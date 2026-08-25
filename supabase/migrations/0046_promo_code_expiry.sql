-- Lets a promo code grant unlimited AI usage for a limited window (e.g. "1
-- month free") instead of only ever being permanent. duration_days is set
-- per code at creation time; null keeps the old permanent-grant behavior.
alter table promo_codes add column if not exists duration_days integer;

alter table promo_code_redemptions add column if not exists expires_at timestamptz;

create or replace function redeem_promo_code(p_code text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_duration_days integer;
begin
  select duration_days into v_duration_days
  from promo_codes
  where code = p_code and active;

  if not found then
    raise exception 'invalid_code';
  end if;

  insert into promo_code_redemptions (user_id, code, expires_at)
  values (
    auth.uid(),
    p_code,
    case when v_duration_days is null then null else now() + (v_duration_days || ' days')::interval end
  )
  on conflict (user_id) do nothing;
end;
$$;
