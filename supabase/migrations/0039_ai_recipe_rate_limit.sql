-- Backs the AI recipe-generation server action's per-user daily cap. That
-- action is reachable via its own endpoint by any logged-in account
-- regardless of the UI — without a per-user log to count against, a script
-- hitting it in a loop could run up the Gemini bill and exhaust the
-- YouTube Data API's daily quota.
create table ai_recipe_generations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

create index on ai_recipe_generations (user_id, created_at);

alter table ai_recipe_generations enable row level security;

create policy "ai_recipe_generations: users manage their own" on ai_recipe_generations
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
