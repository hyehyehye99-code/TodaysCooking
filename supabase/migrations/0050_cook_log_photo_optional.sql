-- recipe_cook_logs was defined in 0002 (photo required) but, as it turns
-- out, never actually got created on the live database — the "요리했어요"
-- feature built on top of it was silently writing to a table that didn't
-- exist. Creating it here for real, with photo_url nullable from the start
-- (a cook log shouldn't require a photo to be worth logging).
create table if not exists recipe_cook_logs (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households (id) on delete cascade,
  recipe_id uuid not null references recipes (id) on delete cascade,
  photo_url text,
  cooked_at date not null default current_date,
  rating smallint check (rating between 1 and 5),
  created_at timestamptz not null default now()
);

create index if not exists recipe_cook_logs_household_id_idx on recipe_cook_logs (household_id);
create index if not exists recipe_cook_logs_recipe_id_idx on recipe_cook_logs (recipe_id);

alter table recipe_cook_logs enable row level security;

create policy "recipe_cook_logs: members can select" on recipe_cook_logs
  for select using (is_household_member(household_id));
create policy "recipe_cook_logs: members can insert" on recipe_cook_logs
  for insert with check (is_household_member(household_id));
create policy "recipe_cook_logs: members can delete" on recipe_cook_logs
  for delete using (is_household_member(household_id));

-- In case some environment did apply the original 0002 definition with
-- photo_url not null, make sure it's nullable there too.
alter table recipe_cook_logs alter column photo_url drop not null;
