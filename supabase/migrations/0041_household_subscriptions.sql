-- Tracks the paid subscription entitlement for a household (one purchase
-- unlocks the AI auto-fill quota bump for every member). Written only by the
-- RevenueCat webhook route via a service-role client — there are
-- deliberately no insert/update policies here, since anon/authenticated
-- writers should never be able to grant themselves an entitlement.
create table household_subscriptions (
  household_id uuid primary key references households (id) on delete cascade,
  active boolean not null default false,
  product_id text,
  expires_at timestamptz,
  updated_at timestamptz not null default now()
);

alter table household_subscriptions enable row level security;

create policy "household_subscriptions: members can read" on household_subscriptions
  for select using (is_household_member(household_id));
