-- Track which explore source (크리에이터 or 공개된 개인 레시피) a household's
-- copy came from, so "우리집 레시피에 추가" can be made idempotent instead of
-- creating a new duplicate recipe row every time it's pressed.

alter table recipes add column if not exists source_type text check (source_type in ('creator', 'personal'));
alter table recipes add column if not exists source_id uuid;

create unique index if not exists recipes_household_source_unique
  on recipes (household_id, source_type, source_id)
  where source_id is not null;
