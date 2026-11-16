-- 우리집 가족끼리 주고받는 대화 (네이티브 앱의 대화 탭).
-- AI 셰프와의 대화는 서버에 남기지 않고, 사람끼리의 메시지만 저장한다.
-- 레시피를 제안할 때는 recipe_id 로 레시피 카드를 함께 보낸다.

create table household_messages (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  body text not null check (char_length(body) between 1 and 1000),
  recipe_id uuid references recipes (id) on delete set null,
  created_at timestamptz not null default now()
);

create index on household_messages (household_id, created_at desc);

alter table household_messages enable row level security;

create policy "household_messages: members can select" on household_messages
  for select using (is_household_member(household_id));

create policy "household_messages: members can send as themselves" on household_messages
  for insert with check (is_household_member(household_id) and user_id = auth.uid());

create policy "household_messages: authors can delete their own" on household_messages
  for delete using (user_id = auth.uid());

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'household_messages'
  ) then
    alter publication supabase_realtime add table household_messages;
  end if;
end $$;

-- AI 셰프 이름은 기기가 아니라 우리집에 속한다 (가족 모두에게 같은 이름으로 보인다).
-- 수정은 기존 "households: members can update" 정책으로 가능하다.
alter table households add column if not exists chef_name text check (chef_name is null or char_length(chef_name) between 1 and 20);
