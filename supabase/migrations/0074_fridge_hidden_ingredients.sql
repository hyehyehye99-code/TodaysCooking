-- Lets a household hide specific preset ingredients (from INGREDIENT_CATEGORIES
-- in lib/ingredients.ts) out of the fridge tab's category chip lists, via a
-- new 마이페이지 > 냉장고 재료 관리 screen. Only hidden names are stored — an
-- empty table means every preset ingredient stays visible, so this needs no
-- backfill for existing households.
create table fridge_hidden_ingredients (
  household_id uuid not null references households (id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now(),
  primary key (household_id, name)
);

alter table fridge_hidden_ingredients enable row level security;

create policy "fridge_hidden_ingredients: members can select" on fridge_hidden_ingredients
  for select using (is_household_member(household_id));
create policy "fridge_hidden_ingredients: members can insert" on fridge_hidden_ingredients
  for insert with check (is_household_member(household_id));
create policy "fridge_hidden_ingredients: members can delete" on fridge_hidden_ingredients
  for delete using (is_household_member(household_id));
