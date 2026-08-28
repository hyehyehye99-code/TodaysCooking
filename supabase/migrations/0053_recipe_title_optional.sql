-- Recipes tab now absorbs the "just save a link" use case that used to be
-- the standalone 북마크 tab: a recipe can be created with no title at all
-- (just a reference link, e.g. a video with nothing else filled in yet),
-- and shows up in the recipe list as a link-preview card instead of a
-- normal title row.
alter table recipes alter column title drop not null;

-- One-time migration: every bookmark that wasn't already attached to a
-- recipe (a plain saved link, never linked via a recipe's reference-link
-- field) becomes a title-less recipe, carrying over its tags/favorite/note
-- (note -> notes, the closest existing recipe field). The bookmark row
-- itself is then repointed at the new recipe via recipe_id, exactly like
-- every other reference-link bookmark already works (see saveReferenceLink
-- in recipes.ts) — nothing else about the bookmarks table changes.
do $$
declare
  b record;
  new_recipe_id uuid;
begin
  for b in select * from bookmarks where recipe_id is null loop
    insert into recipes (household_id, title, tags, is_favorite, notes, created_by, created_at)
    values (b.household_id, null, coalesce(b.tags, '{}'), b.is_favorite, b.note, b.created_by, b.created_at)
    returning id into new_recipe_id;

    update bookmarks set recipe_id = new_recipe_id where id = b.id;
  end loop;
end $$;
