-- Public per-recipe sharing: an individual recipe can be shared via its own
-- link (recipes.share_code), separate from the household-wide menu board
-- share in 0030 — sharing one recipe from its detail page shouldn't require
-- turning on (or matching the tag filter of) the whole menu board.

alter table recipes add column if not exists share_code text unique;

create or replace function generate_recipe_share_code()
returns text
language plpgsql
as $$
declare
  candidate text;
begin
  loop
    candidate := replace(gen_random_uuid()::text, '-', '');
    exit when not exists (select 1 from recipes where share_code = candidate);
  end loop;
  return candidate;
end;
$$;

-- Idempotent: returns the existing code if the recipe was already shared
-- before, otherwise mints and stores a new one.
create or replace function ensure_recipe_share_code(target_recipe_id uuid)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  target_household uuid;
  existing text;
  new_code text;
begin
  select household_id, share_code into target_household, existing
  from recipes where id = target_recipe_id;

  if target_household is null then
    raise exception 'not_found';
  end if;
  if not is_household_member(target_household) then
    raise exception 'not_a_member';
  end if;
  if existing is not null then
    return existing;
  end if;

  new_code := generate_recipe_share_code();
  update recipes set share_code = new_code where id = target_recipe_id;
  return new_code;
end;
$$;

grant execute on function generate_recipe_share_code() to authenticated;
grant execute on function ensure_recipe_share_code(uuid) to authenticated;

-- Public read for a single shared recipe — deliberately excludes
-- household_id/created_by (member identity) and everything from
-- fridge_items/shopping_items/recipe_cook_logs (household-private state),
-- unlike the full recipe detail page.
create or replace function get_shared_recipe(p_share_code text)
returns table (
  id uuid,
  title text,
  subtitle text,
  cover_photo_urls text[],
  icon_emoji text,
  tags text[],
  notes text,
  ingredients jsonb
)
language sql
security definer
set search_path = public
stable
as $$
  select
    r.id, r.title, r.subtitle, r.cover_photo_urls,
    r.icon_emoji, r.tags, r.notes,
    coalesce(
      (
        select jsonb_agg(
          jsonb_build_object('name', ri.name, 'amount', ri.amount, 'skipped', ri.skipped)
          order by ri.position
        )
        from recipe_ingredients ri
        where ri.recipe_id = r.id
      ),
      '[]'::jsonb
    ) as ingredients
  from recipes r
  where r.share_code = p_share_code;
$$;

grant execute on function get_shared_recipe(text) to anon, authenticated;

-- Mirrors 0032_shared_recipe_photos.sql: cover photos live under
-- <household_id>/<uuid>.<ext>, not per-recipe, so once any recipe in a
-- household has been link-shared, the whole household's photo folder
-- becomes anonymously readable. Filenames are random UUIDs and
-- get_shared_recipe() already limits which URLs are ever handed out, so
-- this is the same accepted tradeoff as the existing menu-board policy.
create policy "recipe-photos: public can read when a recipe is shared"
on storage.objects for select
using (
  bucket_id = 'recipe-photos'
  and exists (
    select 1 from recipes r
    where r.household_id = (storage.foldername(name))[1]::uuid
      and r.share_code is not null
  )
);
