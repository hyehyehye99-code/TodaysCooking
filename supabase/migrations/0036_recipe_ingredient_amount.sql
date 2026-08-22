-- Manually-typed ingredients (e.g. "돼지고기 200g") used to be stored as one
-- literal string, which broke fridge/shopping matching (their name has to
-- match exactly). The app now splits name from amount before saving, so this
-- column holds the amount half without it ever touching the name used for
-- matching.
alter table recipe_ingredients add column if not exists amount text;
