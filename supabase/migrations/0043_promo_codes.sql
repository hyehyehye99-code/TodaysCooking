-- Lets a tester (or the developer) unlock unlimited AI usage by entering a
-- code in the app, without needing their email hardcoded into
-- AI_RECIPE_UNLIMITED_EMAILS. Codes themselves are managed by hand via the
-- Supabase dashboard — no admin UI for creating them.
create table promo_codes (
  code text primary key,
  note text,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table promo_codes enable row level security;
-- Deliberately no select/insert policy for regular users — the codes table
-- would otherwise let anyone list every valid code. Redemption goes through
-- redeem_promo_code() below instead, which checks it with elevated rights.

create table promo_code_redemptions (
  user_id uuid primary key references auth.users (id) on delete cascade,
  code text not null references promo_codes (code),
  redeemed_at timestamptz not null default now()
);

alter table promo_code_redemptions enable row level security;

create policy "promo_code_redemptions: users can read their own" on promo_code_redemptions
  for select using (user_id = auth.uid());

-- Same shape as join_household_with_code (0022): security definer so it can
-- check promo_codes (no select policy) and write the redemption in one
-- atomic step, without ever exposing the codes table itself to clients.
create function redeem_promo_code(p_code text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (select 1 from promo_codes where code = p_code and active) then
    raise exception 'invalid_code';
  end if;

  insert into promo_code_redemptions (user_id, code)
  values (auth.uid(), p_code)
  on conflict (user_id) do nothing;
end;
$$;

grant execute on function redeem_promo_code(text) to authenticated;
