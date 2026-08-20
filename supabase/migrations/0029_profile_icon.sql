-- Lets a user pick an icon for their profile (shown next to their nickname
-- in the household member list and on recipes they registered), separate
-- from upsert_my_nickname which is still used as-is by onboarding.
alter table profiles add column if not exists icon_emoji text;

create or replace function upsert_my_profile(new_nickname text, new_icon_emoji text)
returns void
language sql
security definer
set search_path = public
as $$
  insert into profiles (id, nickname, icon_emoji)
  values (auth.uid(), new_nickname, nullif(new_icon_emoji, ''))
  on conflict (id) do update
    set nickname = excluded.nickname,
        icon_emoji = excluded.icon_emoji;
$$;

grant execute on function upsert_my_profile(text, text) to authenticated;

drop function if exists get_household_members(uuid);

create function get_household_members(target_household_id uuid)
returns table (user_id uuid, nickname text, icon_emoji text, email text, role text, joined_at timestamptz)
language sql
security definer
set search_path = public
stable
as $$
  select
    hm.user_id,
    coalesce(p.nickname, split_part(u.email, '@', 1)) as nickname,
    p.icon_emoji,
    u.email,
    hm.role,
    hm.joined_at
  from household_members hm
  join auth.users u on u.id = hm.user_id
  left join profiles p on p.id = hm.user_id
  where hm.household_id = target_household_id
    and is_household_member(target_household_id)
  order by hm.joined_at asc;
$$;

grant execute on function get_household_members(uuid) to authenticated;
