create policy "households: members can update" on households
  for update using (is_household_member(id));
