-- complete_onboarding_create() (0047) copied create_household()'s insert but
-- dropped the invite_code column, which households.invite_code requires
-- (not null, set via generate_household_invite_code() — see 0022). Every
-- call was failing with "null value in column invite_code violates
-- not-null constraint", so new-household onboarding was completely broken,
-- not just occasionally duplicating.
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
    select household_id into new_id
    from household_members
    where user_id = auth.uid()
    order by joined_at asc
    limit 1;
    return new_id;
  end;

  insert into households (name, created_by, invite_code)
  values (household_name, auth.uid(), generate_household_invite_code())
  returning id into new_id;

  insert into household_members (household_id, user_id, role)
  values (new_id, auth.uid(), 'owner');

  return new_id;
end;
$$;
