-- creators.name and creators.channel_name were always redundant in
-- practice (every real row had the same value in both) — merge into a
-- single name field. Also drop creators.tags: a creator-level tag list
-- maintained separately from its recipes' own tags was one more thing to
-- keep in sync for no real benefit — the explore tag filter already folds
-- each creator's recipes' tags in alongside it (explore-view.tsx), so
-- dropping the creator-level list just means that union now comes from
-- recipes alone.
--
-- Both RPCs select the columns being dropped, so they're republished first
-- (while the columns still exist) before the columns themselves go.

drop function if exists get_creator(uuid);
create function get_creator(p_id uuid)
returns table (
  id uuid, name text, bio text, icon_emoji text, avatar_url text,
  channel_type text, channel_link text
)
language sql
security definer
set search_path = public
stable
as $$
  select id, name, bio, icon_emoji, avatar_url, channel_type, channel_link
  from creators where id = p_id;
$$;

grant execute on function get_creator(uuid) to authenticated;

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
  order by c.name;
$$;

grant execute on function list_creators() to authenticated;

alter table creators drop column if exists channel_name;
alter table creators drop column if exists tags;
