-- Lets a link-only recipe (no title, just a reference link) opt out of the
-- ingredients/"만들 수 있어요" UI entirely, even if some ingredient rows
-- exist (e.g. from an AI auto-fill the user ran before deciding to leave
-- the recipe as just a saved link) — that UI wouldn't otherwise disappear
-- until every ingredient row was removed by hand.
alter table recipes add column if not exists hide_ingredients boolean not null default false;
