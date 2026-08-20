-- Replace rotating/expiring household_invites rows with one fixed,
-- never-changing code per household, set the moment the household is
-- created.

create or replace function generate_household_invite_code()
returns text
language plpgsql
as $$
declare
  candidate text;
begin
  loop
    candidate := upper(substr(md5(random()::text || clock_timestamp()::text), 1, 6));
    exit when not exists (select 1 from households where invite_code = candidate);
  end loop;
  return candidate;
end;
$$;

alter table households add column if not exists invite_code text unique;

update households set invite_code = generate_household_invite_code() where invite_code is null;

alter table households alter column invite_code set not null;

create or replace function create_household(household_name text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  new_id uuid;
begin
  insert into households (name, created_by, invite_code)
  values (household_name, auth.uid(), generate_household_invite_code())
  returning id into new_id;

  insert into household_members (household_id, user_id, role)
  values (new_id, auth.uid(), 'owner');

  return new_id;
end;
$$;

-- Renamed the parameter (p_invite_code) so it can't shadow the
-- households.invite_code column it's compared against below. Postgres
-- won't let CREATE OR REPLACE change an existing parameter's name, so
-- the old signature has to be dropped first.
drop function if exists join_household_with_code(text);

create function join_household_with_code(p_invite_code text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  target_household_id uuid;
begin
  select id into target_household_id
  from households
  where invite_code = p_invite_code;

  if target_household_id is null then
    raise exception 'invalid_invite';
  end if;

  insert into household_members (household_id, user_id, role)
  values (target_household_id, auth.uid(), 'member')
  on conflict (household_id, user_id) do nothing;

  return target_household_id;
end;
$$;

grant execute on function generate_household_invite_code() to authenticated;
grant execute on function create_household(text) to authenticated;
grant execute on function join_household_with_code(text) to authenticated;

drop table if exists household_invites;
