-- Align creators' own fields with what /mypage/creator-apply actually
-- collects (creator_name / channel_type / channel_name / channel_link /
-- tags), so an approved application maps straight onto the profile
-- instead of leaving half the fields with nothing to show.

alter table creators rename column type to channel_type;
alter table creators rename column youtube_url to channel_link;
alter table creators add column if not exists channel_name text;
alter table creators add column if not exists tags text[] not null default '{}';

drop function if exists get_creator(uuid);
create function get_creator(p_id uuid)
returns table (
  id uuid, name text, bio text, icon_emoji text, avatar_url text,
  channel_type text, channel_name text, channel_link text, tags text[]
)
language sql
security definer
set search_path = public
stable
as $$
  select id, name, bio, icon_emoji, avatar_url, channel_type, channel_name, channel_link, tags
  from creators where id = p_id;
$$;

drop function if exists list_creators();
create function list_creators()
returns table (
  id uuid, name text, icon_emoji text, avatar_url text, channel_type text, tags text[], recipe_count bigint
)
language sql
security definer
set search_path = public
stable
as $$
  select c.id, c.name, c.icon_emoji, c.avatar_url, c.channel_type, c.tags, count(cr.id) as recipe_count
  from creators c
  left join creator_recipes cr on cr.creator_id = c.id
  group by c.id
  order by c.name;
$$;

grant execute on function get_creator(uuid) to authenticated;
grant execute on function list_creators() to authenticated;
