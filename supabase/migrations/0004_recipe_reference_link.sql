alter table bookmarks add column if not exists recipe_id uuid references recipes (id) on delete set null;
create index if not exists bookmarks_recipe_id_idx on bookmarks (recipe_id);
