-- Banners link straight to a collection (so tapping one — or its "더보기"
-- row — opens that collection's recipes), and carry a small preview of
-- that collection's images inline, 오늘의집 hero-card style. link_url stays
-- as a fallback for a banner not tied to any collection (e.g. an external
-- link) — the app prefers collection_id when both are set.
alter table explore_banners add column if not exists collection_id uuid references explore_collections (id) on delete set null;

drop function if exists list_explore_banners();

create function list_explore_banners()
returns table (id uuid, title text, emoji text, link_url text, image_url text, collection_id uuid)
language sql
security definer
set search_path = public
stable
as $$
  select id, title, emoji, link_url, image_url, collection_id
  from explore_banners
  where active
  order by position, created_at;
$$;
