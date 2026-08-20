-- Reordering previously fired one UPDATE per row via Promise.all — N round
-- trips for N items. Batch each into a single statement instead. (A plain
-- upsert({id, position}) can't be used here since the recipes/bookmarks
-- INSERT RLS policies require household_id/created_by, which a
-- position-only payload wouldn't satisfy.)

create or replace function reorder_recipes(recipe_ids uuid[])
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update recipes r
  set position = v.pos
  from unnest(recipe_ids) with ordinality as v(id, pos)
  where r.id = v.id
    and is_household_member(r.household_id);
end;
$$;

create or replace function reorder_bookmarks(bookmark_ids uuid[])
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update bookmarks b
  set position = v.pos
  from unnest(bookmark_ids) with ordinality as v(id, pos)
  where b.id = v.id
    and is_household_member(b.household_id);
end;
$$;

grant execute on function reorder_recipes(uuid[]) to authenticated;
grant execute on function reorder_bookmarks(uuid[]) to authenticated;
