alter table recipe_ingredients add column if not exists skipped boolean not null default false;
