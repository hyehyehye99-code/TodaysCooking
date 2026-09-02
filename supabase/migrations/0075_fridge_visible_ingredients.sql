-- Flips 냉장고 재료 관리 from opt-out (hide the ones you don't want) to
-- opt-in (an empty table means every preset ingredient starts hidden, and a
-- household explicitly turns on the ones it actually wants to see in the
-- fridge tab). The old hidden-list table's rows don't translate under the
-- inverted default, so it's dropped rather than migrated — there's no
-- production data riding on it yet.
drop table if exists fridge_hidden_ingredients;

create table fridge_visible_ingredients (
  household_id uuid not null references households (id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now(),
  primary key (household_id, name)
);

alter table fridge_visible_ingredients enable row level security;

create policy "fridge_visible_ingredients: members can select" on fridge_visible_ingredients
  for select using (is_household_member(household_id));
create policy "fridge_visible_ingredients: members can insert" on fridge_visible_ingredients
  for insert with check (is_household_member(household_id));
create policy "fridge_visible_ingredients: members can delete" on fridge_visible_ingredients
  for delete using (is_household_member(household_id));
