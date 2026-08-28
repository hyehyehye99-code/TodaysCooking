-- Creator profile gets richer fields (YouTube channel link, a free-text
-- "유형" like 유튜버/블로거), and search_explore_recipes now also returns
-- creator_id so the app can cross-reference a feed item back to its
-- creator's profile route/tag filtering without a second round trip.

alter table creators add column if not exists youtube_url text;
alter table creators add column if not exists type text;

drop function if exists get_creator(uuid);
create function get_creator(p_id uuid)
returns table (id uuid, name text, bio text, icon_emoji text, avatar_url text, youtube_url text, type text)
language sql
security definer
set search_path = public
stable
as $$
  select id, name, bio, icon_emoji, avatar_url, youtube_url, type from creators where id = p_id;
$$;

drop function if exists list_creators();
create function list_creators()
returns table (id uuid, name text, icon_emoji text, avatar_url text, type text, recipe_count bigint)
language sql
security definer
set search_path = public
stable
as $$
  select c.id, c.name, c.icon_emoji, c.avatar_url, c.type, count(cr.id) as recipe_count
  from creators c
  left join creator_recipes cr on cr.creator_id = c.id
  group by c.id
  order by c.name;
$$;

drop function if exists search_explore_recipes(text);
create function search_explore_recipes(p_query text default null)
returns table (
  source text,
  id uuid,
  title text,
  subtitle text,
  cover_photo_urls text[],
  icon_emoji text,
  tags text[],
  creator_id uuid,
  creator_name text,
  creator_icon_emoji text,
  add_count integer,
  created_at timestamptz
)
language sql
security definer
set search_path = public
stable
as $$
  select 'creator' as source, cr.id, cr.title, cr.subtitle, cr.cover_photo_urls, cr.icon_emoji, cr.tags,
    c.id as creator_id, c.name as creator_name, c.icon_emoji as creator_icon_emoji, cr.add_count, cr.created_at
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
    null::uuid as creator_id, coalesce(p.nickname, '누군가') as creator_name, p.icon_emoji as creator_icon_emoji,
    r.explore_add_count, r.created_at
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

  order by created_at desc;
$$;

grant execute on function get_creator(uuid) to authenticated;
grant execute on function list_creators() to authenticated;
grant execute on function search_explore_recipes(text) to authenticated;
