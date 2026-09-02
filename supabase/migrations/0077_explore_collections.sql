-- 탐색 탭 큐레이션: admin hand-picks themed collections (제철 요리, 새우
-- 요리, 크리스마스 레시피, ...) that group existing creator/personal
-- recipes together, shown above the existing feed rather than replacing
-- it. Same source_type/source_id shape the rest of Explore already uses
-- (search_explore_recipes, recipes.source_type) so items can point at
-- either a creator_recipes row or a public household recipe.
create table explore_collections (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  emoji text,
  active boolean not null default true,
  position integer not null default 0,
  created_at timestamptz not null default now()
);

create table explore_collection_items (
  collection_id uuid not null references explore_collections (id) on delete cascade,
  source_type text not null check (source_type in ('creator', 'personal')),
  source_id uuid not null,
  position integer not null default 0,
  created_at timestamptz not null default now(),
  primary key (collection_id, source_type, source_id)
);

create index on explore_collection_items (collection_id);

alter table explore_collections enable row level security;
alter table explore_collection_items enable row level security;

-- Admin writes go through the service-role client (createAdminClient), same
-- as creators/creator_recipes — only a read policy is needed here. Readers
-- only ever see active collections; admin's own list bypasses RLS entirely.
create policy "explore_collections: any signed-in user can read active ones" on explore_collections
  for select to authenticated using (active);
create policy "explore_collection_items: any signed-in user can read" on explore_collection_items
  for select to authenticated using (
    exists (select 1 from explore_collections c where c.id = collection_id and c.active)
  );

create or replace function list_explore_collections()
returns table (id uuid, title text, emoji text, recipe_count bigint)
language sql
security definer
set search_path = public
stable
as $$
  select c.id, c.title, c.emoji, count(i.collection_id) as recipe_count
  from explore_collections c
  left join explore_collection_items i on i.collection_id = c.id
  where c.active
  group by c.id
  order by c.position, c.created_at;
$$;

create or replace function get_collection(p_id uuid)
returns table (id uuid, title text, emoji text)
language sql
security definer
set search_path = public
stable
as $$
  select id, title, emoji from explore_collections where id = p_id and active;
$$;

create or replace function get_collection_recipes(p_collection_id uuid)
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
  select combined.source, combined.id, combined.title, combined.subtitle, combined.cover_photo_urls,
    combined.icon_emoji, combined.tags, combined.creator_name, combined.creator_icon_emoji
  from (
    select 'creator' as source, cr.id, cr.title, cr.subtitle, cr.cover_photo_urls, cr.icon_emoji, cr.tags,
      c.name as creator_name, c.icon_emoji as creator_icon_emoji, i.position
    from explore_collection_items i
    join creator_recipes cr on cr.id = i.source_id
    join creators c on c.id = cr.creator_id
    where i.collection_id = p_collection_id and i.source_type = 'creator'

    union all

    select 'personal' as source, r.id, r.title, r.subtitle, r.cover_photo_urls, r.icon_emoji, r.tags,
      coalesce(p.nickname, '누군가') as creator_name, p.icon_emoji as creator_icon_emoji, i.position
    from explore_collection_items i
    join recipes r on r.id = i.source_id
    left join profiles p on p.id = r.created_by
    where i.collection_id = p_collection_id and i.source_type = 'personal' and r.is_public
  ) combined
  order by combined.position;
$$;

-- Promotional banner slots shown in the 탐색 curated section — admin-managed
-- placeholder for real ad-network inventory later (see explore-view.tsx).
create table explore_banners (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  emoji text,
  link_url text,
  active boolean not null default true,
  position integer not null default 0,
  created_at timestamptz not null default now()
);

alter table explore_banners enable row level security;

create policy "explore_banners: any signed-in user can read active ones" on explore_banners
  for select to authenticated using (active);

create or replace function list_explore_banners()
returns table (id uuid, title text, emoji text, link_url text)
language sql
security definer
set search_path = public
stable
as $$
  select id, title, emoji, link_url from explore_banners where active order by position, created_at;
$$;
