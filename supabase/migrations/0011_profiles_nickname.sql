drop function if exists get_household_members(uuid);

create table if not exists profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  nickname text not null,
  created_at timestamptz not null default now()
);

alter table profiles enable row level security;

drop policy if exists "profiles: authenticated can select" on profiles;
create policy "profiles: authenticated can select" on profiles
  for select using (auth.role() = 'authenticated');

drop policy if exists "profiles: user can insert own" on profiles;
create policy "profiles: user can insert own" on profiles
  for insert with check (auth.uid() = id);

drop policy if exists "profiles: user can update own" on profiles;
create policy "profiles: user can update own" on profiles
  for update using (auth.uid() = id);

create or replace function upsert_my_nickname(new_nickname text)
returns void
language sql
security definer
set search_path = public
as $$
  insert into profiles (id, nickname)
  values (auth.uid(), new_nickname)
  on conflict (id) do update set nickname = excluded.nickname;
$$;

grant execute on function upsert_my_nickname(text) to authenticated;

create function get_household_members(target_household_id uuid)
returns table (user_id uuid, nickname text, email text, role text, joined_at timestamptz)
language sql
security definer
set search_path = public
stable
as $$
  select
    hm.user_id,
    coalesce(p.nickname, split_part(u.email, '@', 1)) as nickname,
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
