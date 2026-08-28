-- Explore v2:
-- - A single combined feed (creator + personal recipes together, newest
--   first) replaces the old separate "공개 레시피" list — the creator row
--   stays as its own browsing path on top of it.
-- - "맛있다고 표현했어요! {n}" is just a display of how many times a recipe
--   has been added to someone's household recipes — no separate reaction,
--   adding IS the compliment — so it rides on the existing add_count.
-- - The household's own copy remembers where it came from.

alter table creator_recipes add column if not exists add_count integer not null default 0;
alter table recipes add column if not exists explore_add_count integer not null default 0;
alter table recipes add column if not exists source_creator_name text;

drop function if exists list_public_recipes();

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
    c.name as creator_name, c.icon_emoji as creator_icon_emoji, cr.add_count, cr.created_at
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
    coalesce(p.nickname, '누군가') as creator_name, p.icon_emoji as creator_icon_emoji,
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

drop function if exists get_creator_recipe(uuid);
create function get_creator_recipe(p_id uuid)
returns table (
  id uuid, creator_id uuid, creator_name text, creator_icon_emoji text, creator_bio text,
  title text, subtitle text, cover_photo_urls text[], icon_emoji text, tags text[], notes text,
  ingredients jsonb, add_count integer
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
    ) as ingredients,
    cr.add_count
  from creator_recipes cr
  join creators c on c.id = cr.creator_id
  where cr.id = p_id;
$$;

drop function if exists get_public_recipe(uuid);
create function get_public_recipe(p_id uuid)
returns table (
  id uuid, creator_name text, creator_icon_emoji text,
  title text, subtitle text, cover_photo_urls text[], icon_emoji text, tags text[], notes text,
  ingredients jsonb, add_count integer
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
    ) as ingredients,
    r.explore_add_count
  from recipes r
  left join profiles p on p.id = r.created_by
  where r.id = p_id and r.is_public;
$$;

create or replace function increment_creator_recipe_add_count(p_id uuid)
returns void
language sql
security definer
set search_path = public
as $$
  update creator_recipes set add_count = add_count + 1 where id = p_id;
$$;

create or replace function increment_recipe_explore_add_count(p_id uuid)
returns void
language sql
security definer
set search_path = public
as $$
  update recipes set explore_add_count = explore_add_count + 1 where id = p_id;
$$;

grant execute on function search_explore_recipes(text) to authenticated;
grant execute on function get_creator_recipe(uuid) to authenticated;
grant execute on function get_public_recipe(uuid) to authenticated;
grant execute on function increment_creator_recipe_add_count(uuid) to authenticated;
grant execute on function increment_recipe_explore_add_count(uuid) to authenticated;
