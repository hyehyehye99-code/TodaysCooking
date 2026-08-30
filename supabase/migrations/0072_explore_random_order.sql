-- 탐색 탭 리스트가 항상 똑같은 순서(최신순/이름순)로 보여서 매번 같은 것들만
-- 위에 뜨는 문제 — 두 RPC 모두 매 호출마다 무작위 순서로 섞어서 반환하도록
-- 바꿔준다. 클라이언트는 한 번 받아온 배열을 그대로 들고 있다가 태그/검색
-- 필터링만 하므로, 한 방문 안에서는 순서가 안정적으로 유지되고 새로
-- 열거나 새로고침할 때만 다시 섞인다.

drop function if exists list_creators();
create function list_creators()
returns table (
  id uuid, name text, icon_emoji text, avatar_url text, channel_type text, recipe_count bigint
)
language sql
security definer
set search_path = public
stable
as $$
  select c.id, c.name, c.icon_emoji, c.avatar_url, c.channel_type, count(cr.id) as recipe_count
  from creators c
  left join creator_recipes cr on cr.creator_id = c.id
  group by c.id
  order by random();
$$;

grant execute on function list_creators() to authenticated;

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
  select * from (
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
  ) combined
  order by random();
$$;

grant execute on function search_explore_recipes(text) to authenticated;
