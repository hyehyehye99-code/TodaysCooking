-- Lets the admin panel add exceptions to the ingredient name/amount splitter
-- (src/lib/actions/recipes.ts) without a code change + deploy each time a
-- new unit/quantity word shows up in someone's recipe. Global, not
-- household-scoped — it's just parsing hints, not user data, so any signed-
-- in user can read it (needed at recipe save time) but only the admin panel
-- (service-role client) writes to it.
create table ingredient_parse_rules (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in ('unit_suffix', 'quantity_word', 'count_word', 'phrase')),
  value text not null,
  created_at timestamptz not null default now(),
  unique (type, value)
);

alter table ingredient_parse_rules enable row level security;

create policy "ingredient_parse_rules: any signed-in user can select" on ingredient_parse_rules
  for select using (auth.uid() is not null);
