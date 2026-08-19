create policy "bookmarks: members can update" on bookmarks
  for update using (is_household_member(household_id));
