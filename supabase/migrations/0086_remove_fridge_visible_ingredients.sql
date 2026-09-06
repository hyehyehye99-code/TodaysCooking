-- The 냉장고 재료 관리 opt-in page is gone — every preset ingredient in
-- INGREDIENT_CATEGORIES now always shows in the fridge tab, so this table
-- (which only ever gated that opt-in list) has nothing left to do.
drop table if exists fridge_visible_ingredients;
