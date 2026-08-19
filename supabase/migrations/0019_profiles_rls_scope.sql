-- profiles was readable by any authenticated user app-wide; scope it to
-- your own profile plus profiles of people who share a household with you.
drop policy if exists "profiles: authenticated can select" on profiles;
create policy "profiles: self or household co-members can select" on profiles
  for select using (
    id = auth.uid()
    or exists (
      select 1 from household_members hm1
      join household_members hm2 on hm1.household_id = hm2.household_id
      where hm1.user_id = auth.uid() and hm2.user_id = profiles.id
    )
  );
