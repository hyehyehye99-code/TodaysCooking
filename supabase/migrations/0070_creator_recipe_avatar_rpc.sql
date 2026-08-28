-- Add creator_avatar_url to get_creator_recipe so the explore recipe detail
-- page can show the creator's real profile photo next to their name
-- (previously only creator_icon_emoji, the emoji fallback, was exposed).

drop function if exists get_creator_recipe(uuid);
create function get_creator_recipe(p_id uuid)
returns table (
  id uuid, creator_id uuid, creator_name text, creator_icon_emoji text, creator_avatar_url text, creator_bio text,
  title text, subtitle text, cover_photo_urls text[], icon_emoji text, tags text[], notes text,
  ingredients jsonb, add_count integer, source_url text
)
language sql
security definer
set search_path = public
stable
as $$
  select cr.id, cr.creator_id, c.name, c.icon_emoji, c.avatar_url, c.bio,
    cr.title, cr.subtitle, cr.cover_photo_urls, cr.icon_emoji, cr.tags, cr.notes,
    coalesce(
      (select jsonb_agg(jsonb_build_object('name', cri.name, 'amount', cri.amount) order by cri.position)
       from creator_recipe_ingredients cri where cri.creator_recipe_id = cr.id),
      '[]'::jsonb
    ) as ingredients,
    cr.add_count, cr.source_url
  from creator_recipes cr
  join creators c on c.id = cr.creator_id
  where cr.id = p_id;
$$;

grant execute on function get_creator_recipe(uuid) to authenticated;
