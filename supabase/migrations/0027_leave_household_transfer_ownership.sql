-- Bring leave_household in line with delete_my_account: an owner leaving a
-- household with other members hands ownership to whoever joined earliest,
-- instead of destroying the household outright. Only a sole-member owner
-- still deletes the household (nothing to hand off to).
create or replace function leave_household(target_household_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  my_role text;
  successor uuid;
  remaining int;
begin
  select role into my_role
  from household_members
  where household_id = target_household_id and user_id = auth.uid();

  if my_role is null then
    return;
  end if;

  if my_role = 'owner' then
    select user_id into successor
    from household_members
    where household_id = target_household_id and user_id != auth.uid()
    order by joined_at asc
    limit 1;

    if successor is null then
      delete from households where id = target_household_id;
      return;
    end if;

    update household_members set role = 'owner'
    where household_id = target_household_id and user_id = successor;
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

-- Lets an invite link show the household's name (and id, so the join page
-- can tell whether the viewer is already a member) before the viewer has
-- joined — and is therefore not yet covered by the households select
-- policy, which requires membership.
create or replace function get_household_by_invite_code(p_invite_code text)
returns table (id uuid, name text)
language sql
security definer
set search_path = public
stable
as $$
  select h.id, h.name from households h where h.invite_code = p_invite_code;
$$;

grant execute on function get_household_by_invite_code(text) to authenticated, anon;
