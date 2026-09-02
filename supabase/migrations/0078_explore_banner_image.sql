-- Banners become a real wide image banner instead of a text+emoji pill —
-- admin pastes a hosted image URL (same convention as creators.avatar_url),
-- and the app falls back to a gray placeholder box until one is set.
alter table explore_banners add column if not exists image_url text;

-- Postgres won't let create-or-replace change a function's return row
-- shape (new image_url out param) — the old signature has to go first.
drop function if exists list_explore_banners();

create function list_explore_banners()
returns table (id uuid, title text, emoji text, link_url text, image_url text)
language sql
security definer
set search_path = public
stable
as $$
  select id, title, emoji, link_url, image_url from explore_banners where active order by position, created_at;
$$;
