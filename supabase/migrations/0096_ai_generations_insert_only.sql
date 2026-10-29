-- ai_recipe_generations is the weekly AI usage ledger, but its original policy
-- (0039) was `for all`, so a signed-in user could delete or edit their own rows
-- straight through the API and reset their usage for free. Users now only read
-- and append; deletes/updates are reserved for the server side:
--   * use_reset_ticket() (security definer) flags rows as forgiven
--   * the admin "refund" action deletes with the service-role key
drop policy "ai_recipe_generations: users manage their own" on ai_recipe_generations;

create policy "ai_recipe_generations: users can read their own" on ai_recipe_generations
  for select using (user_id = auth.uid());

-- Inserts stay open because the app records a generation with the caller's own
-- session. A user inserting extra rows for themselves only uses up their quota.
create policy "ai_recipe_generations: users can add their own" on ai_recipe_generations
  for insert with check (user_id = auth.uid());
