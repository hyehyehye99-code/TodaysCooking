-- Mid-countdown notifications for a timer (e.g. "5 minutes left — flip it
-- over"), separate from the completion alarm. RLS is scoped through the
-- owning timer's household rather than its own household_id column, since
-- an alert only ever exists attached to one.
create table timer_alerts (
  id uuid primary key default gen_random_uuid(),
  timer_id uuid not null references timers (id) on delete cascade,
  remaining_seconds integer not null check (remaining_seconds > 0),
  message text not null,
  created_at timestamptz not null default now()
);

create index on timer_alerts (timer_id);

alter table timer_alerts enable row level security;

create policy "timer_alerts: members can select" on timer_alerts
  for select using (
    exists (select 1 from timers t where t.id = timer_alerts.timer_id and is_household_member(t.household_id))
  );
create policy "timer_alerts: members can insert" on timer_alerts
  for insert with check (
    exists (select 1 from timers t where t.id = timer_alerts.timer_id and is_household_member(t.household_id))
  );
create policy "timer_alerts: members can update" on timer_alerts
  for update using (
    exists (select 1 from timers t where t.id = timer_alerts.timer_id and is_household_member(t.household_id))
  );
create policy "timer_alerts: members can delete" on timer_alerts
  for delete using (
    exists (select 1 from timers t where t.id = timer_alerts.timer_id and is_household_member(t.household_id))
  );
