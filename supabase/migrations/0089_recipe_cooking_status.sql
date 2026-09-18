-- Lets someone flag a recipe as "currently cooking" from its detail page so
-- it pins to the top of the recipes tab (see toggleCookingRecipe) — separate
-- from is_favorite, which is a longer-lived preference rather than an
-- active, usually short-lived state.
alter table recipes add column is_cooking boolean not null default false;
