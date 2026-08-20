create or replace function remove_household_member(target_household_id uuid, target_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  caller_role text;
begin
  if target_user_id = auth.uid() then
    raise exception 'cannot_remove_self';
  end if;

  select role into caller_role
  from household_members
  where household_id = target_household_id and user_id = auth.uid();

  if caller_role is distinct from 'owner' then
    raise exception 'not_owner';
  end if;

  delete from household_members
  where household_id = target_household_id and user_id = target_user_id;
end;
$$;

grant execute on function remove_household_member(uuid, uuid) to authenticated;
