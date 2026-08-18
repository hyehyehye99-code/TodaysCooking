create or replace function leave_household(target_household_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  my_role text;
  remaining int;
begin
  select role into my_role
  from household_members
  where household_id = target_household_id and user_id = auth.uid();

  if my_role is null then
    return;
  end if;

  if my_role = 'owner' then
    delete from households where id = target_household_id;
    return;
  end if;

  delete from household_members
  where household_id = target_household_id and user_id = auth.uid();

  select count(*) into remaining from household_members where household_id = target_household_id;
  if remaining = 0 then
    delete from households where id = target_household_id;
  end if;
end;
$$;

grant execute on function leave_household(uuid) to authenticated;
