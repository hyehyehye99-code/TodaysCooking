create policy "recipe_ingredients: members can update" on recipe_ingredients
  for update using (
    exists (select 1 from recipes r where r.id = recipe_id and is_household_member(r.household_id))
  );
