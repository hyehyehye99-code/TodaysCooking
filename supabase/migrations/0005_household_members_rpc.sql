create or replace function get_household_members(target_household_id uuid)
returns table (user_id uuid, email text, role text, joined_at timestamptz)
language sql
security definer
set search_path = public
stable
as $$
  select hm.user_id, u.email, hm.role, hm.joined_at
  from household_members hm
  join auth.users u on u.id = hm.user_id
  where hm.household_id = target_household_id
    and is_household_member(target_household_id)
  order by hm.joined_at asc;
$$;

grant execute on function get_household_members(uuid) to authenticated;
