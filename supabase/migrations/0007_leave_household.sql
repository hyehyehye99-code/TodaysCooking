create or replace function leave_household(target_household_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  remaining int;
begin
  delete from household_members
  where household_id = target_household_id and user_id = auth.uid();

  select count(*) into remaining from household_members where household_id = target_household_id;

  if remaining = 0 then
    delete from households where id = target_household_id;
  end if;
end;
$$;

grant execute on function leave_household(uuid) to authenticated;
