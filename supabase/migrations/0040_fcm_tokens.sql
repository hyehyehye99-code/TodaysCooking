-- Native push (Firebase Cloud Messaging) uses a completely different
-- delivery mechanism than the web-push subscriptions table (an FCM
-- registration token, not an endpoint/keys pair), so it gets its own table
-- rather than overloading push_subscriptions with nullable columns.
create table fcm_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  household_id uuid not null references households (id) on delete cascade,
  token text not null unique,
  created_at timestamptz not null default now()
);

create index on fcm_tokens (household_id);

alter table fcm_tokens enable row level security;

create policy "fcm_tokens: users manage their own" on fcm_tokens
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Mirrors get_household_push_subscriptions: sending needs every OTHER
-- household member's token, which the policy above deliberately doesn't
-- allow a user to read directly.
create or replace function get_household_fcm_tokens(p_household_id uuid, p_exclude_user_id uuid)
returns table (token text)
language sql
security definer
set search_path = public
stable
as $$
  select token
  from fcm_tokens
  where household_id = p_household_id
    and user_id != p_exclude_user_id;
$$;

grant execute on function get_household_fcm_tokens(uuid, uuid) to authenticated;
