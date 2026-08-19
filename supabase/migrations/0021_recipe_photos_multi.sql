alter table recipes add column if not exists cover_photo_urls text[] not null default '{}';

update recipes
set cover_photo_urls = array[cover_photo_url]
where cover_photo_url is not null and cover_photo_urls = '{}';

alter table recipes drop column if exists cover_photo_url;
