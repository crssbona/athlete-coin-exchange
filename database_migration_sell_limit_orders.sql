-- Migration: Limit orders for token sales (like stock market)
-- Execute after database_setup.sql, database_migration_athlete_profile.sql,
-- database_migration_limit_orders.sql, database_migration_sell_updates_price.sql
--
-- Sell at or below current price: execute immediately (tokens removed, price updated).
-- Sell above current price: order goes to pending_sales, executes when price rises.

-- 1. Create enum for pending sale status (reuse existing if compatible)
do $$ begin
    create type public.pending_sale_status as enum ('pending', 'completed', 'cancelled');
exception
    when duplicate_object then null;  -- enum already exists
end $$;

-- 2. Create pending_sales table
-- user_token_id: ON DELETE SET NULL so when tokens are sold the reference is cleared
create table if not exists public.pending_sales (
    id uuid primary key default gen_random_uuid(),
    user_id uuid references auth.users(id) on delete cascade not null,
    user_token_id uuid null references public.user_tokens(id) on delete set null,
    athlete_id text not null,
    quantity integer not null,
    limit_price decimal(10,2) not null,
    status public.pending_sale_status not null default 'pending',
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    completed_at timestamp with time zone
);

alter table public.pending_sales enable row level security;

drop policy if exists "Users can view their own pending sales" on public.pending_sales;
create policy "Users can view their own pending sales"
    on public.pending_sales for select using (auth.uid() = user_id);

drop policy if exists "Users can insert their own pending sales" on public.pending_sales;
create policy "Users can insert their own pending sales"
    on public.pending_sales for insert with check (auth.uid() = user_id);

drop policy if exists "Users can update their own pending sales" on public.pending_sales;
create policy "Users can update their own pending sales"
    on public.pending_sales for update using (auth.uid() = user_id)
    with check (auth.uid() = user_id);

-- 3. RPC: place_sell_order
-- If sell_price <= current_price: execute immediately via sell_tokens
-- Else: insert into pending_sales
create or replace function public.place_sell_order(
    p_user_token_id uuid,
    p_athlete_id text,
    p_quantity integer,
    p_sell_price decimal
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
    v_current_price decimal(10,2);
    v_user_id uuid := auth.uid();
begin
    if v_user_id is null then
        return jsonb_build_object('executed', false, 'message', 'Usuário não autenticado');
    end if;

    if p_quantity is null or p_quantity <= 0 then
        return jsonb_build_object('executed', false, 'message', 'Quantidade inválida');
    end if;

    if p_sell_price is null or p_sell_price <= 0 then
        return jsonb_build_object('executed', false, 'message', 'Preço de venda inválido');
    end if;

    select price_per_token into v_current_price
    from public.athlete_tokens
    where athlete_id = p_athlete_id;

    if v_current_price is null then
        return jsonb_build_object('executed', false, 'message', 'Atleta não encontrado');
    end if;

    if p_sell_price <= v_current_price then
        perform public.sell_tokens(p_user_token_id, p_athlete_id, p_quantity, p_sell_price);
        return jsonb_build_object('executed', true, 'message', 'Venda realizada');
    else
        -- Validate user owns the tokens before creating pending sale
        if not exists (
            select 1 from public.user_tokens
            where id = p_user_token_id and user_id = v_user_id
              and athlete_id = p_athlete_id and quantity >= p_quantity
        ) then
            return jsonb_build_object('executed', false, 'message', 'Posição não encontrada ou quantidade insuficiente', 'error', true);
        end if;

        insert into public.pending_sales (user_id, user_token_id, athlete_id, quantity, limit_price, status)
        values (v_user_id, p_user_token_id, p_athlete_id, p_quantity, p_sell_price, 'pending');
        return jsonb_build_object('executed', false, 'message', 'Venda em espera');
    end if;
end;
$$;

-- 4. Function: process pending sales when price rises
-- Executes sells where limit_price <= new_price (price has risen to meet ask)
-- Does NOT update price_per_token to avoid trigger recursion; price is already correct
create or replace function public.process_pending_sales_for_athlete(p_athlete_id text, p_new_price decimal)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
    v_sale record;
    v_row record;
    v_new_quantity integer;
begin
    for v_sale in
        select id, user_id, user_token_id, athlete_id, quantity, limit_price
        from public.pending_sales
        where athlete_id = p_athlete_id
          and status = 'pending'
          and limit_price <= p_new_price
        order by created_at asc  -- FIFO
    loop
        begin
            -- Verify seller still has the tokens
            select id, user_id, athlete_id, quantity into v_row
            from public.user_tokens
            where id = v_sale.user_token_id;

            if v_row is null or v_row.user_id != v_sale.user_id or v_row.quantity < v_sale.quantity then
                raise warning 'Cannot execute pending sale %: tokens no longer available', v_sale.id;
                update public.pending_sales set status = 'cancelled' where id = v_sale.id;
                continue;
            end if;

            v_new_quantity := v_row.quantity - v_sale.quantity;

            -- Mark completed first (before delete, since delete may cascade)
            update public.pending_sales
            set status = 'completed', completed_at = timezone('utc'::text, now())
            where id = v_sale.id;

            -- Update or delete user_tokens
            if v_new_quantity <= 0 then
                delete from public.user_tokens where id = v_sale.user_token_id;
            else
                update public.user_tokens set quantity = v_new_quantity where id = v_sale.user_token_id;
            end if;

            -- Return tokens to pool; update price to sell price
            update public.athlete_tokens
            set available_tokens = available_tokens + v_sale.quantity,
                price_per_token = v_sale.limit_price,
                updated_at = timezone('utc'::text, now()),
                market_cap = total_tokens * v_sale.limit_price
            where athlete_id = v_sale.athlete_id;

            -- Note: This price update WILL fire the trigger again. To prevent infinite loop,
            -- we process only rows we haven't yet completed. The trigger recursion is
            -- bounded: each iteration completes at least one sale and removes it from
            -- the pending set. Eventually no more sales match and we stop.
        exception when others then
            raise warning 'Failed to execute pending sale %: %', v_sale.id, sqlerrormessage;
        end;
    end loop;
end;
$$;

-- 5. Update trigger: also process pending sales when price changes
create or replace function public.trigger_after_athlete_price_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
    if old.price_per_token is distinct from new.price_per_token then
        -- Price dropped: process pending purchases (limit_price >= new_price)
        perform public.process_pending_purchases_for_athlete(new.athlete_id, new.price_per_token);
        -- Price rose: process pending sales (limit_price <= new_price)
        perform public.process_pending_sales_for_athlete(new.athlete_id, new.price_per_token);
    end if;
    return new;
end;
$$;

drop trigger if exists after_athlete_price_update on public.athlete_tokens;
create trigger after_athlete_price_update
    after update of price_per_token on public.athlete_tokens
    for each row execute procedure public.trigger_after_athlete_price_update();

-- 6. RPC: cancel_pending_sale
create or replace function public.cancel_pending_sale(p_pending_sale_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
    v_user_id uuid := auth.uid();
    v_updated integer;
begin
    if v_user_id is null then
        return jsonb_build_object('success', false, 'message', 'Usuário não autenticado');
    end if;

    update public.pending_sales
    set status = 'cancelled'
    where id = p_pending_sale_id
      and user_id = v_user_id
      and status = 'pending';

    get diagnostics v_updated = row_count;

    if v_updated > 0 then
        return jsonb_build_object('success', true, 'message', 'Venda cancelada');
    else
        return jsonb_build_object('success', false, 'message', 'Venda não encontrada ou já processada');
    end if;
end;
$$;
