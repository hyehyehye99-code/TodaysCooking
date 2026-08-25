-- The previous fix for "onboarding creates two households" checked
-- getCurrentHousehold() in the Server Action, then called create_household()
-- as a second, separate round trip. That's not atomic — two calls racing
-- close together (a duplicate native appUrlOpen delivery, a retried
-- request, ...) can both pass the check before either one's insert commits,
-- so both still create a household. onboarding_claims makes the "has this
-- user already completed onboarding-create" check atomic: only one
-- concurrent insert can win the unique constraint, and the loser returns
-- the winner's household instead of creating its own.
create table onboarding_claims (
  user_id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table onboarding_claims enable row level security;
-- No policies needed — only ever touched by complete_onboarding_create()
-- below (security definer), never queried directly by clients.

create or replace function complete_onboarding_create(household_name text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  new_id uuid;
begin
  begin
    insert into onboarding_claims (user_id) values (auth.uid());
  exception when unique_violation then
    -- Lost the race (or this is a genuine retry) — the winner's insert has
    -- already committed by the time our insert fails, so this is safe to
    -- read straight away. Return their oldest household rather than
    -- creating a second one.
    select household_id into new_id
    from household_members
    where user_id = auth.uid()
    order by joined_at asc
    limit 1;
    return new_id;
  end;

  insert into households (name, created_by) values (household_name, auth.uid())
  returning id into new_id;

  insert into household_members (household_id, user_id, role)
  values (new_id, auth.uid(), 'owner');

  return new_id;
end;
$$;

grant execute on function complete_onboarding_create(text) to authenticated;
