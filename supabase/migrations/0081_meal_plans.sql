-- 메뉴판(meal plan): a named bundle of existing recipes for planning an
-- occasion (e.g. 홈파티) — lets a household see combined ingredient needs
-- across several recipes at once instead of checking each recipe one by
-- one. Lives in the (now-empty) 탐색 탭.

create table meal_plans (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households (id) on delete cascade,
  title text not null,
  created_by uuid not null references auth.users (id),
  created_at timestamptz not null default now()
);

create index on meal_plans (household_id);

create table meal_plan_recipes (
  meal_plan_id uuid not null references meal_plans (id) on delete cascade,
  recipe_id uuid not null references recipes (id) on delete cascade,
  position integer not null default 0,
  primary key (meal_plan_id, recipe_id)
);

create index on meal_plan_recipes (meal_plan_id);

alter table meal_plans enable row level security;
alter table meal_plan_recipes enable row level security;

create policy "meal_plans: members can select" on meal_plans
  for select using (is_household_member(household_id));
create policy "meal_plans: members can insert" on meal_plans
  for insert with check (is_household_member(household_id) and created_by = auth.uid());
create policy "meal_plans: members can update" on meal_plans
  for update using (is_household_member(household_id));
create policy "meal_plans: members can delete" on meal_plans
  for delete using (is_household_member(household_id));

-- meal_plan_recipes (scoped via parent meal_plan's household, same pattern
-- as recipe_ingredients scoping via its parent recipe)
create policy "meal_plan_recipes: members can select" on meal_plan_recipes
  for select using (
    exists (select 1 from meal_plans mp where mp.id = meal_plan_id and is_household_member(mp.household_id))
  );
create policy "meal_plan_recipes: members can insert" on meal_plan_recipes
  for insert with check (
    exists (select 1 from meal_plans mp where mp.id = meal_plan_id and is_household_member(mp.household_id))
  );
create policy "meal_plan_recipes: members can delete" on meal_plan_recipes
  for delete using (
    exists (select 1 from meal_plans mp where mp.id = meal_plan_id and is_household_member(mp.household_id))
  );
