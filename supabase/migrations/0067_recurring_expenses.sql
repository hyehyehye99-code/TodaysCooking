-- Recurring cost templates (server hosting, API subscriptions, etc.) that
-- the admin logs an actual occurrence of each period instead of retyping
-- the same category/amount every time. There's no cron job in this app, so
-- logging stays a manual one-click action rather than auto-inserting.
create table recurring_expenses (
  id uuid primary key default gen_random_uuid(),
  category text not null,
  amount numeric not null,
  memo text,
  cycle text not null default 'monthly',
  active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table expenses add column if not exists recurring_expense_id uuid references recurring_expenses (id) on delete set null;
