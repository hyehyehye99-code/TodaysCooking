-- Recipe cover photos + cook logs (date + star rating), and a storage bucket for them.

alter table recipes add column if not exists cover_photo_url text;

create table recipe_cook_logs (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households (id) on delete cascade,
  recipe_id uuid not null references recipes (id) on delete cascade,
  photo_url text not null,
  cooked_at date not null default current_date,
  rating smallint check (rating between 1 and 5),
  created_at timestamptz not null default now()
);

create index on recipe_cook_logs (household_id);
create index on recipe_cook_logs (recipe_id);

alter table recipe_cook_logs enable row level security;

create policy "recipe_cook_logs: members can select" on recipe_cook_logs
  for select using (is_household_member(household_id));
create policy "recipe_cook_logs: members can insert" on recipe_cook_logs
  for insert with check (is_household_member(household_id));
create policy "recipe_cook_logs: members can delete" on recipe_cook_logs
  for delete using (is_household_member(household_id));

-- storage bucket for recipe cover photos + cook log photos
insert into storage.buckets (id, name, public)
values ('recipe-photos', 'recipe-photos', true)
on conflict (id) do nothing;

create policy "recipe-photos: members can read"
on storage.objects for select
using (
  bucket_id = 'recipe-photos'
  and is_household_member((storage.foldername(name))[1]::uuid)
);

create policy "recipe-photos: members can upload"
on storage.objects for insert
with check (
  bucket_id = 'recipe-photos'
  and is_household_member((storage.foldername(name))[1]::uuid)
);

create policy "recipe-photos: members can delete"
on storage.objects for delete
using (
  bucket_id = 'recipe-photos'
  and is_household_member((storage.foldername(name))[1]::uuid)
);
