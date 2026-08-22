-- Web Push subscriptions, one row per browser/device a user has enabled
-- notifications on. household_id is stored alongside so we can look up
-- "everyone else in this household" without an extra join at send time.
create table push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  household_id uuid not null references households (id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  created_at timestamptz not null default now()
);

create index on push_subscriptions (household_id);

alter table push_subscriptions enable row level security;

create policy "push_subscriptions: users manage their own" on push_subscriptions
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Sending a notification needs every OTHER household member's subscription,
-- which the policy above deliberately doesn't allow (a user should never be
-- able to read another user's push endpoint/keys directly) — this
-- security-definer function is the one sanctioned way to fetch them,
-- scoped to a specific household and excluding the actor who triggered it.
create or replace function get_household_push_subscriptions(p_household_id uuid, p_exclude_user_id uuid)
returns table (endpoint text, p256dh text, auth text)
language sql
security definer
set search_path = public
stable
as $$
  select endpoint, p256dh, auth
  from push_subscriptions
  where household_id = p_household_id
    and user_id != p_exclude_user_id;
$$;

grant execute on function get_household_push_subscriptions(uuid, uuid) to authenticated;
