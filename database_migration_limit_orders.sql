-- Migration: Limit orders for token purchases (like stock market)
-- Execute in Supabase SQL Editor after database_setup.sql and database_migration_athlete_profile.sql
--
-- Requires: purchase_tokens(p_athlete_token_id, p_athlete_id, p_quantity, p_price) RPC in Supabase.
-- The trigger uses set_config so auth.uid() returns the buyer when processing pending orders.
-- If that fails, modify purchase_tokens to accept optional p_buyer_id and use it when provided.

-- 1. Create enum for pending purchase status
create type public.pending_purchase_status as enum ('pending', 'completed', 'cancelled');

-- 2. Create pending_purchases table
create table public.pending_purchases (
    id uuid primary key default gen_random_uuid(),
    user_id uuid references auth.users(id) on delete cascade not null,
    athlete_token_id uuid references public.athlete_tokens(id) on delete cascade not null,
    athlete_id text not null,
    quantity integer not null,
    limit_price decimal(10,2) not null,
    status public.pending_purchase_status not null default 'pending',
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    completed_at timestamp with time zone
);

alter table public.pending_purchases enable row level security;

create policy "Users can view their own pending purchases"
    on public.pending_purchases for select using (auth.uid() = user_id);

create policy "Users can insert their own pending purchases"
    on public.pending_purchases for insert with check (auth.uid() = user_id);

create policy "Users can update their own pending purchases (for cancel)"
    on public.pending_purchases for update using (auth.uid() = user_id)
    with check (auth.uid() = user_id);

-- 3. RPC: place_purchase_order
-- If limit_price >= current_price: execute immediately via purchase_tokens
-- Else: insert into pending_purchases
-- Returns: { executed: boolean, message: text }
create or replace function public.place_purchase_order(
    p_athlete_token_id uuid,
    p_athlete_id text,
    p_quantity integer,
    p_limit_price decimal
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

    if p_limit_price is null or p_limit_price <= 0 then
        return jsonb_build_object('executed', false, 'message', 'Preço inválido');
    end if;

    -- Get current price
    select price_per_token into v_current_price
    from public.athlete_tokens
    where id = p_athlete_token_id;

    if v_current_price is null then
        return jsonb_build_object('executed', false, 'message', 'Atleta não encontrado');
    end if;

    if p_limit_price >= v_current_price then
        -- Execute immediately - use least of limit_price and current to ensure fair execution
        perform public.purchase_tokens(
            p_athlete_token_id,
            p_athlete_id,
            p_quantity,
            least(p_limit_price, v_current_price)::decimal(10,2)
        );
        return jsonb_build_object('executed', true, 'message', 'Compra realizada');
    else
        -- Insert pending order
        insert into public.pending_purchases (user_id, athlete_token_id, athlete_id, quantity, limit_price, status)
        values (v_user_id, p_athlete_token_id, p_athlete_id, p_quantity, p_limit_price, 'pending');
        return jsonb_build_object('executed', false, 'message', 'Ordem em espera');
    end if;
end;
$$;

-- 4. Function: process pending purchases when price drops
-- Note: purchase_tokens uses auth.uid() for the buyer. We set request.jwt.claim.sub
-- so auth.uid() returns the sponsor's id when called from this trigger context.
create or replace function public.process_pending_purchases_for_athlete(p_athlete_id text, p_new_price decimal)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
    v_order record;
begin
    for v_order in
        select id, user_id, athlete_token_id, athlete_id, quantity, limit_price
        from public.pending_purchases
        where athlete_id = p_athlete_id
          and status = 'pending'
          and limit_price >= p_new_price
        order by created_at asc  -- FIFO
    loop
        begin
            -- Run as the sponsor (buyer) so purchase_tokens creates tokens for them
            perform set_config('request.jwt.claim.sub', v_order.user_id::text, true);

            perform public.purchase_tokens(
                v_order.athlete_token_id,
                v_order.athlete_id,
                v_order.quantity,
                least(v_order.limit_price, p_new_price)::decimal(10,2)
            );
            update public.pending_purchases
            set status = 'completed', completed_at = timezone('utc'::text, now())
            where id = v_order.id;
        exception when others then
            -- If purchase_tokens fails (e.g. not enough tokens), keep order pending
            raise warning 'Failed to execute pending purchase %: %', v_order.id, sqlerrormessage;
        end;
    end loop;
end;
$$;

-- 5. Trigger: when athlete updates price, process pending purchases
create or replace function public.trigger_after_athlete_price_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
    if old.price_per_token is distinct from new.price_per_token then
        perform public.process_pending_purchases_for_athlete(new.athlete_id, new.price_per_token);
    end if;
    return new;
end;
$$;

drop trigger if exists after_athlete_price_update on public.athlete_tokens;
create trigger after_athlete_price_update
    after update of price_per_token on public.athlete_tokens
    for each row execute procedure public.trigger_after_athlete_price_update();

-- 6. RPC: cancel_pending_purchase
create or replace function public.cancel_pending_purchase(p_pending_purchase_id uuid)
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

    update public.pending_purchases
    set status = 'cancelled'
    where id = p_pending_purchase_id
      and user_id = v_user_id
      and status = 'pending';

    get diagnostics v_updated = row_count;

    if v_updated > 0 then
        return jsonb_build_object('success', true, 'message', 'Ordem cancelada');
    else
        return jsonb_build_object('success', false, 'message', 'Ordem não encontrada ou já processada');
    end if;
end;
$$;
