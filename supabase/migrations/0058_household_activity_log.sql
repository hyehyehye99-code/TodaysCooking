-- Replaces the per-user "notifications" inbox (unread/read state, always
-- excluded whoever did the thing) with a shared household activity log —
-- one row per event, visible to every member including whoever triggered
-- it. A plain RLS policy can let a member insert their own row directly
-- now (no more security-definer fan-out needed), since there's exactly one
-- row per event instead of one per recipient.

create table household_activity (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households (id) on delete cascade,
  actor_user_id uuid not null references auth.users (id) on delete cascade,
  title text not null,
  body text not null,
  url text,
  created_at timestamptz not null default now()
);

create index on household_activity (household_id, created_at desc);

alter table household_activity enable row level security;

create policy "household_activity: members can select" on household_activity
  for select using (is_household_member(household_id));

create policy "household_activity: members can insert their own actions" on household_activity
  for insert with check (is_household_member(household_id) and actor_user_id = auth.uid());

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'household_activity'
  ) then
    alter publication supabase_realtime add table household_activity;
  end if;
end $$;

drop table if exists notifications cascade;
drop function if exists notify_household(uuid, uuid, text, text, text);
