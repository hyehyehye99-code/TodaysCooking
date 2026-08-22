-- In-app notification history, one row per recipient per event (as opposed
-- to push_subscriptions which is per device) — this is what the bell icon on
-- 마이페이지 lists, independent of whether that member has push enabled.
create table notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  household_id uuid not null references households (id) on delete cascade,
  title text not null,
  body text not null,
  url text,
  read boolean not null default false,
  created_at timestamptz not null default now()
);

create index on notifications (user_id, created_at desc);

alter table notifications enable row level security;

-- Users only ever see/manage their own notifications. There's deliberately
-- no policy letting one user INSERT a row for another — that only ever
-- happens through notify_household() below, which runs as security definer
-- and so bypasses RLS entirely.
create policy "notifications: users manage their own" on notifications
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Fans a single event out to every OTHER member of the household as one
-- notification row each. Mirrors get_household_push_subscriptions' shape:
-- security definer so the caller (any authenticated household member,
-- acting through a server action) can write rows for people who are not
-- themselves, scoped to just this household.
create or replace function notify_household(
  p_household_id uuid,
  p_exclude_user_id uuid,
  p_title text,
  p_body text,
  p_url text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into notifications (user_id, household_id, title, body, url)
  select user_id, p_household_id, p_title, p_body, p_url
  from household_members
  where household_id = p_household_id
    and user_id != p_exclude_user_id;
end;
$$;

grant execute on function notify_household(uuid, uuid, text, text, text) to authenticated;
