-- Explore tab (feed/배너/검색/컬렉션/크리에이터) and everything that only
-- existed to feed it — including the 크리에이터 신청(creator_applications)
-- flow and the admin's creator/collection/banner management screens — has
-- been removed from the app. This tears down the matching DB objects.
--
-- recipe-photos/creator-photos storage buckets and any files already in
-- them are left alone — dropping stored binaries is a separate, more
-- deliberate action than a schema migration.

drop function if exists list_explore_banners();
drop function if exists get_collection_recipes(uuid);
drop function if exists get_collection(uuid);
drop function if exists list_explore_collections();
drop function if exists increment_recipe_explore_add_count(uuid);
drop function if exists increment_creator_recipe_add_count(uuid);
drop function if exists get_public_recipe(uuid);
drop function if exists list_public_recipes();
drop function if exists get_creator_recipe(uuid);
drop function if exists get_creator_recipes(uuid);
drop function if exists get_creator(uuid);
drop function if exists list_creators();
drop function if exists search_explore_recipes(text);

drop policy if exists "recipe-photos: public can read when a recipe is published to explore" on storage.objects;
drop policy if exists "creator-photos: any signed-in user can read" on storage.objects;

drop table if exists explore_banners;
drop table if exists explore_collection_items;
drop table if exists explore_collections;
drop table if exists creator_recipe_ingredients;
drop table if exists creator_recipes;
drop table if exists creators;
drop table if exists creator_applications;

drop index if exists recipes_household_source_unique;
alter table recipes drop column if exists source_id;
alter table recipes drop column if exists source_type;
alter table recipes drop column if exists source_creator_name;
alter table recipes drop column if exists explore_add_count;
alter table recipes drop column if exists is_public;
