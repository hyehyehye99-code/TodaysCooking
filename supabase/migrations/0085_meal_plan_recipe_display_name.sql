-- Per-(meal_plan, recipe) display name override — lets "얼큰 순두부찌개
-- (유튜브 레시피)" show up on the meal plan and its shared card as just
-- "순두부찌개", without renaming the actual recipe.
alter table meal_plan_recipes add column if not exists display_name text;
