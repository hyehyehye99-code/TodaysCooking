alter table recipes add column if not exists icon_emoji text;
alter table recipes add column if not exists tags text[] not null default '{}';
