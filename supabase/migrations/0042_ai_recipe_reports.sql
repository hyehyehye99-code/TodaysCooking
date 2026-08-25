-- Lets a user flag one AI-generated result as unsatisfactory. The output
-- itself is snapshotted here rather than just referenced, since it's never
-- persisted anywhere else unless the user goes on to manually save the
-- recipe — by the time a developer reviews this, the original generation
-- would otherwise be gone.
--
-- There is deliberately no automated refund: a developer reviews reports by
-- hand (via the Supabase dashboard) and, if warranted, deletes the matching
-- row from ai_recipe_generations to free up that user's quota again — the
-- existing rolling-window count query in ai-recipe.ts picks that up with no
-- extra code needed.
create table ai_recipe_reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  generation_id uuid not null references ai_recipe_generations (id) on delete cascade,
  url text not null,
  generated_title text,
  generated_ingredients text[] not null default '{}',
  generated_instructions text not null default '',
  generated_tags text[] not null default '{}',
  note text,
  created_at timestamptz not null default now()
);

create index on ai_recipe_reports (created_at);

alter table ai_recipe_reports enable row level security;

create policy "ai_recipe_reports: users can submit their own" on ai_recipe_reports
  for insert with check (user_id = auth.uid());

create policy "ai_recipe_reports: users can read their own" on ai_recipe_reports
  for select using (user_id = auth.uid());
