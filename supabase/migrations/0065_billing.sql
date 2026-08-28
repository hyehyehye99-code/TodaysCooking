-- 비용관리 (수익/지출 관리) for the admin dashboard.
--
-- subscription_events: RevenueCat sends a price/currency on every webhook
-- event, which the app previously discarded (see api/webhooks/revenuecat) —
-- this captures it so 수익 관리 can show real transaction history instead
-- of a manual ledger. Only ever written by the webhook route via a
-- service-role client, so no insert/update policies (mirrors
-- household_subscriptions' own comment on the same point). Revenue only
-- accumulates from here forward; there's no way to recover past events
-- RevenueCat already sent before this table existed.
create table subscription_events (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households (id) on delete cascade,
  event_type text not null,
  product_id text,
  price numeric,
  currency text,
  occurred_at timestamptz not null default now()
);

create index on subscription_events (occurred_at desc);

alter table subscription_events enable row level security;

create policy "subscription_events: members can read their own household" on subscription_events
  for select using (is_household_member(household_id));

-- expenses: 지출 관리 has no automatic data source (AI/hosting/marketing
-- costs aren't tracked anywhere in-app), so it's a plain manual ledger the
-- admin fills in — same shape as subscription_events' amount/currency pair
-- so the two "비용관리" pages read consistently.
create table expenses (
  id uuid primary key default gen_random_uuid(),
  category text not null,
  amount numeric not null,
  memo text,
  spent_at date not null default current_date,
  created_at timestamptz not null default now()
);

create index on expenses (spent_at desc);

alter table expenses enable row level security;
-- No policies: this table is only ever touched via the admin dashboard's
-- service-role client (see lib/supabase/admin.ts), same as creators/
-- creator_recipes — RLS enabled with zero policies means even a leaked
-- anon key can't read or write it.
