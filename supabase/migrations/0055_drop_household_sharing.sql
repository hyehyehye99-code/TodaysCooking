-- Removes the household-wide "메뉴판 공유" (public menu-board link) feature
-- from 0030/0031/0033/0034/0035 — its UI (ShareMenuButton) was never wired
-- up to any page, and the concept is being replaced by per-recipe public
-- listing in the Explore tab instead.

drop policy if exists "recipe-photos: public can read when household is shared" on storage.objects;
drop policy if exists "recipe_reactions: anyone can react to a shared recipe" on recipe_reactions;
drop policy if exists "recipe_reactions: signed-in visitors can react to a shared recipe" on recipe_reactions;

-- A household member reacting to their OWN household's recipe never had a
-- dedicated policy — it rode entirely on the "this household is publicly
-- shared" check above (any signed-in user, including members, only passed
-- through that same gate). Give it a real policy now that the gate is gone,
-- otherwise in-app reactions (see reaction-log.tsx) would silently start
-- failing RLS.
create policy "recipe_reactions: household members can insert their own" on recipe_reactions
  for insert with check (
    user_id = auth.uid()
    and exists (
      select 1 from recipes r
      where r.id = recipe_reactions.recipe_id and is_household_member(r.household_id)
    )
  );

drop function if exists get_shared_household(text);
drop function if exists get_shared_recipes(text);
drop function if exists set_household_share_enabled(uuid, boolean);
drop function if exists set_household_share_tags(uuid, text[]);
drop function if exists generate_household_share_code();

alter table households drop column if exists share_code;
alter table households drop column if exists share_tags;
alter table households drop column if exists share_updated_by;
alter table households drop column if exists share_updated_at;
alter table households drop column if exists share_last_action;
