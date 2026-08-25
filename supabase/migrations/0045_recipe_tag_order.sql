-- Recipe tags themselves are still free-text (recipes.tags text[]) — this
-- table only tracks a household's preferred display order for tags that
-- have appeared at least once, and gives tag rename something stable to
-- key off of. A tag typed fresh via TagPicker but never saved here just
-- falls back to first-appearance order in the UI.
create table recipe_tag_order (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households (id) on delete cascade,
  name text not null,
  position integer not null default 0,
  created_at timestamptz not null default now(),
  unique (household_id, name)
);

create index on recipe_tag_order (household_id);

alter table recipe_tag_order enable row level security;

create policy "recipe_tag_order: members can select" on recipe_tag_order
  for select using (is_household_member(household_id));
create policy "recipe_tag_order: members can insert" on recipe_tag_order
  for insert with check (is_household_member(household_id));
create policy "recipe_tag_order: members can update" on recipe_tag_order
  for update using (is_household_member(household_id));
create policy "recipe_tag_order: members can delete" on recipe_tag_order
  for delete using (is_household_member(household_id));

-- Renames a tag across every recipe in a household and its order entry in
-- one transaction, so a rename can never leave recipes and the order table
-- disagreeing on the tag's name.
create or replace function rename_recipe_tag(target_household_id uuid, old_name text, new_name text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not is_household_member(target_household_id) then
    raise exception 'not a member of this household';
  end if;

  update recipes
  set tags = array_replace(tags, old_name, new_name)
  where household_id = target_household_id
    and old_name = any(tags);

  update recipe_tag_order
  set name = new_name
  where household_id = target_household_id and name = old_name;
end;
$$;
