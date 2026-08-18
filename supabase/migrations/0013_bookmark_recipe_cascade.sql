alter table bookmarks drop constraint if exists bookmarks_recipe_id_fkey;
alter table bookmarks add constraint bookmarks_recipe_id_fkey
  foreign key (recipe_id) references recipes (id) on delete cascade;
