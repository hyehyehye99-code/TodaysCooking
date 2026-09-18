-- Shared cooking timers for the 타이머 tab (formerly 냉장고, then a placeholder
-- 도구 tab). A timer counts down from duration_seconds; remaining_seconds +
-- started_at (null while paused) is enough to compute the live remaining
-- time without any server-side ticking, and to survive the app being closed
-- and reopened mid-countdown.
create table timers (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households (id) on delete cascade,
  recipe_id uuid references recipes (id) on delete set null,
  name text not null,
  color text not null default 'accent',
  duration_seconds integer not null check (duration_seconds > 0),
  remaining_seconds integer not null,
  is_running boolean not null default true,
  started_at timestamptz,
  created_by uuid not null references auth.users (id),
  created_at timestamptz not null default now()
);

create index on timers (household_id);

alter table timers enable row level security;

create policy "timers: members can select" on timers
  for select using (is_household_member(household_id));
create policy "timers: members can insert" on timers
  for insert with check (is_household_member(household_id));
create policy "timers: members can update" on timers
  for update using (is_household_member(household_id));
create policy "timers: members can delete" on timers
  for delete using (is_household_member(household_id));

-- So a timer someone else in the household starts/pauses/stops shows up
-- live for everyone else looking at the tab, the same way notifications do.
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'timers'
  ) then
    alter publication supabase_realtime add table timers;
  end if;
end $$;
