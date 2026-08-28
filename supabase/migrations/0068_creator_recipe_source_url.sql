-- Track which source link (typically a YouTube video URL) a creator recipe
-- was generated from, so the admin's "채널에서 영상 가져오기" picker can tell
-- which videos already have a recipe and skip them instead of re-importing
-- duplicates every time it's opened.

alter table creator_recipes add column if not exists source_url text;

-- Exact-URL safety net (e.g. a double-click during bulk import). Not the
-- primary dedup mechanism — the app compares by extracted YouTube video id,
-- since the same video can appear under different URL shapes
-- (youtu.be/xxx vs youtube.com/watch?v=xxx, extra query params, etc).
create unique index if not exists creator_recipes_creator_source_unique
  on creator_recipes (creator_id, source_url)
  where source_url is not null;
