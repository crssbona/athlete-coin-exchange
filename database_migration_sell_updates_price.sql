-- Migration: sell_tokens updates market price on sale
-- Execute after database_setup.sql, database_migration_athlete_profile.sql, database_migration_limit_orders.sql
--
-- When a sponsor sells tokens at a price, that price becomes the new market price.
-- This triggers the existing after_athlete_price_update, which processes pending limit orders.
--
-- IMPORTANT: This function uses SECURITY DEFINER to bypass RLS when updating/deleting user_tokens.
-- Ensure this migration is applied; an older sell_tokens in Supabase may not remove tokens correctly.

create or replace function public.sell_tokens(
    p_user_token_id uuid,
    p_athlete_id text,
    p_quantity integer,
    p_sell_price decimal
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
    v_user_id uuid := auth.uid();
    v_row record;
    v_new_quantity integer;
begin
    if v_user_id is null then
        raise exception 'Usuário não autenticado';
    end if;

    if p_quantity is null or p_quantity <= 0 then
        raise exception 'Quantidade inválida';
    end if;

    if p_sell_price is null or p_sell_price <= 0 then
        raise exception 'Preço de venda inválido';
    end if;

    -- Get and validate user_tokens row
    select id, user_id, athlete_id, quantity into v_row
    from public.user_tokens
    where id = p_user_token_id;

    if v_row is null then
        raise exception 'Posição não encontrada';
    end if;

    if v_row.user_id != v_user_id then
        raise exception 'Você não possui estes tokens';
    end if;

    if v_row.athlete_id != p_athlete_id then
        raise exception 'Athlete id inválido';
    end if;

    if v_row.quantity < p_quantity then
        raise exception 'Quantidade insuficiente. Você possui % tokens.', v_row.quantity;
    end if;

    v_new_quantity := v_row.quantity - p_quantity;

    -- Update or delete user_tokens
    if v_new_quantity <= 0 then
        delete from public.user_tokens where id = p_user_token_id;
    else
        update public.user_tokens set quantity = v_new_quantity where id = p_user_token_id;
    end if;

    -- Return tokens to pool and update market price
    update public.athlete_tokens
    set available_tokens = available_tokens + p_quantity,
        price_per_token = p_sell_price,
        updated_at = timezone('utc'::text, now()),
        market_cap = total_tokens * p_sell_price
    where athlete_id = p_athlete_id;

    if not found then
        raise exception 'Atleta não encontrado';
    end if;

    -- Trigger after_athlete_price_update will fire and process pending limit orders
end;
$$;
