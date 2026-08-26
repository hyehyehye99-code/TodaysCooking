-- Bookmarks get the same free-text tags recipes already have, so they can
-- be organized/filtered the same way.
alter table bookmarks add column if not exists tags text[] not null default '{}';
