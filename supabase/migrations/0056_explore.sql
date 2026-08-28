-- Explore tab: two separate sources of public recipes.
--
-- 1) "크리에이터" recipes — curated directly by the app admin via the
--    Supabase dashboard/SQL editor (there is deliberately no in-app admin
--    UI, hence no insert/update/delete RLS policies below), independent of
--    any household.
-- 2) Personal recipes a household opts into publishing from its own
--    recipes tab (recipes.is_public).
--
-- Both are read through security-definer RPCs (same pattern as the old
-- get_shared_recipe(s)) rather than loosened RLS on the base tables, so a
-- household's normal data stays isolated by default.

create table creators (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  bio text,
  icon_emoji text,
  avatar_url text,
  created_at timestamptz not null default now()
);

create table creator_recipes (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid not null references creators (id) on delete cascade,
  title text not null,
  subtitle text,
  cover_photo_urls text[] not null default '{}',
  icon_emoji text,
  tags text[] not null default '{}',
  notes text,
  position integer,
  created_at timestamptz not null default now()
);

create index on creator_recipes (creator_id);

create table creator_recipe_ingredients (
  id uuid primary key default gen_random_uuid(),
  creator_recipe_id uuid not null references creator_recipes (id) on delete cascade,
  name text not null,
  amount text,
  position integer not null default 0
);

create index on creator_recipe_ingredients (creator_recipe_id);

alter table creators enable row level security;
alter table creator_recipes enable row level security;
alter table creator_recipe_ingredients enable row level security;

create policy "creators: any signed-in user can read" on creators
  for select to authenticated using (true);
create policy "creator_recipes: any signed-in user can read" on creator_recipes
  for select to authenticated using (true);
create policy "creator_recipe_ingredients: any signed-in user can read" on creator_recipe_ingredients
  for select to authenticated using (true);

alter table recipes add column if not exists is_public boolean not null default false;

-- Unified search across both sources (name/유형(tags)/재료 — see the app's
-- Explore search bar), used when the query box has anything typed in it.
create or replace function search_explore_recipes(p_query text default null)
returns table (
  source text,
  id uuid,
  title text,
  subtitle text,
  cover_photo_urls text[],
  icon_emoji text,
  tags text[],
  creator_name text,
  creator_icon_emoji text
)
language sql
security definer
set search_path = public
stable
as $$
  select 'creator' as source, cr.id, cr.title, cr.subtitle, cr.cover_photo_urls, cr.icon_emoji, cr.tags,
    c.name as creator_name, c.icon_emoji as creator_icon_emoji
  from creator_recipes cr
  join creators c on c.id = cr.creator_id
  where
    p_query is null or p_query = '' or
    cr.title ilike '%' || p_query || '%' or
    exists (select 1 from unnest(cr.tags) t where t ilike '%' || p_query || '%') or
    exists (
      select 1 from creator_recipe_ingredients cri
      where cri.creator_recipe_id = cr.id and cri.name ilike '%' || p_query || '%'
    )

  union all

  select 'personal' as source, r.id, r.title, r.subtitle, r.cover_photo_urls, r.icon_emoji, r.tags,
    coalesce(p.nickname, '누군가') as creator_name, p.icon_emoji as creator_icon_emoji
  from recipes r
  left join profiles p on p.id = r.created_by
  where r.is_public
    and (
      p_query is null or p_query = '' or
      r.title ilike '%' || p_query || '%' or
      exists (select 1 from unnest(r.tags) t where t ilike '%' || p_query || '%') or
      exists (
        select 1 from recipe_ingredients ri
        where ri.recipe_id = r.id and ri.name ilike '%' || p_query || '%'
      )
    )

  order by title nulls last;
$$;

create or replace function list_creators()
returns table (id uuid, name text, icon_emoji text, avatar_url text, recipe_count bigint)
language sql
security definer
set search_path = public
stable
as $$
  select c.id, c.name, c.icon_emoji, c.avatar_url, count(cr.id) as recipe_count
  from creators c
  left join creator_recipes cr on cr.creator_id = c.id
  group by c.id
  order by c.name;
$$;

create or replace function get_creator(p_id uuid)
returns table (id uuid, name text, bio text, icon_emoji text, avatar_url text)
language sql
security definer
set search_path = public
stable
as $$
  select id, name, bio, icon_emoji, avatar_url from creators where id = p_id;
$$;

create or replace function get_creator_recipes(p_creator_id uuid)
returns table (id uuid, title text, subtitle text, cover_photo_urls text[], icon_emoji text, tags text[])
language sql
security definer
set search_path = public
stable
as $$
  select id, title, subtitle, cover_photo_urls, icon_emoji, tags
  from creator_recipes
  where creator_id = p_creator_id
  order by coalesce(position, 999999), created_at desc;
$$;

create or replace function get_creator_recipe(p_id uuid)
returns table (
  id uuid, creator_id uuid, creator_name text, creator_icon_emoji text, creator_bio text,
  title text, subtitle text, cover_photo_urls text[], icon_emoji text, tags text[], notes text,
  ingredients jsonb
)
language sql
security definer
set search_path = public
stable
as $$
  select cr.id, cr.creator_id, c.name, c.icon_emoji, c.bio,
    cr.title, cr.subtitle, cr.cover_photo_urls, cr.icon_emoji, cr.tags, cr.notes,
    coalesce(
      (select jsonb_agg(jsonb_build_object('name', cri.name, 'amount', cri.amount) order by cri.position)
       from creator_recipe_ingredients cri where cri.creator_recipe_id = cr.id),
      '[]'::jsonb
    ) as ingredients
  from creator_recipes cr
  join creators c on c.id = cr.creator_id
  where cr.id = p_id;
$$;

create or replace function list_public_recipes()
returns table (
  id uuid, title text, subtitle text, cover_photo_urls text[], icon_emoji text, tags text[],
  creator_name text, creator_icon_emoji text
)
language sql
security definer
set search_path = public
stable
as $$
  select r.id, r.title, r.subtitle, r.cover_photo_urls, r.icon_emoji, r.tags,
    coalesce(p.nickname, '누군가') as creator_name, p.icon_emoji as creator_icon_emoji
  from recipes r
  left join profiles p on p.id = r.created_by
  where r.is_public
  order by r.created_at desc
  limit 30;
$$;

create or replace function get_public_recipe(p_id uuid)
returns table (
  id uuid, creator_name text, creator_icon_emoji text,
  title text, subtitle text, cover_photo_urls text[], icon_emoji text, tags text[], notes text,
  ingredients jsonb
)
language sql
security definer
set search_path = public
stable
as $$
  select r.id, coalesce(p.nickname, '누군가') as creator_name, p.icon_emoji as creator_icon_emoji,
    r.title, r.subtitle, r.cover_photo_urls, r.icon_emoji, r.tags, r.notes,
    coalesce(
      (select jsonb_agg(jsonb_build_object('name', ri.name, 'amount', ri.amount) order by ri.position)
       from recipe_ingredients ri where ri.recipe_id = r.id),
      '[]'::jsonb
    ) as ingredients
  from recipes r
  left join profiles p on p.id = r.created_by
  where r.id = p_id and r.is_public;
$$;

-- A personal recipe's cover photos live under <household_id>/<uuid>.<ext>
-- in the recipe-photos bucket, RLS-gated to that household's own members
-- (see 0002) — once the recipe is published to Explore, any other signed-in
-- user needs to be able to load those same photo URLs. Same tradeoff as
-- 0051's per-recipe share policy: this opens the whole household's photo
-- folder, not just the one recipe's photos, but filenames are random UUIDs
-- and the RPCs above only ever hand out URLs for is_public recipes anyway.
create policy "recipe-photos: public can read when a recipe is published to explore"
on storage.objects for select
using (
  bucket_id = 'recipe-photos'
  and exists (
    select 1 from recipes r
    where r.household_id = (storage.foldername(name))[1]::uuid
      and r.is_public
  )
);

-- Creator recipe/avatar photos: uploaded by the admin directly via the
-- Supabase dashboard (bypasses RLS as the table/storage owner), so this
-- bucket only needs a read policy for the app itself.
insert into storage.buckets (id, name, public)
values ('creator-photos', 'creator-photos', true)
on conflict (id) do nothing;

create policy "creator-photos: any signed-in user can read"
on storage.objects for select
to authenticated
using (bucket_id = 'creator-photos');

grant execute on function search_explore_recipes(text) to authenticated;
grant execute on function list_creators() to authenticated;
grant execute on function get_creator(uuid) to authenticated;
grant execute on function get_creator_recipes(uuid) to authenticated;
grant execute on function get_creator_recipe(uuid) to authenticated;
grant execute on function list_public_recipes() to authenticated;
grant execute on function get_public_recipe(uuid) to authenticated;
