-- generateRecipeFromLink used to spend a bonus generation by reading
-- remaining_count then writing back (remaining_count - 1) as two separate
-- steps. Two requests racing on the same read let one decrement get
-- overwritten, so a user could burn more bonus generations than they were
-- granted. This makes the spend a single atomic, conditional UPDATE so
-- concurrent callers can't both succeed against the same unit.
create function decrement_promo_bonus()
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  new_count int;
begin
  update promo_code_redemptions
  set remaining_count = remaining_count - 1
  where user_id = auth.uid() and remaining_count > 0
  returning remaining_count into new_count;

  return new_count; -- null when there was nothing left to spend
end;
$$;

grant execute on function decrement_promo_bonus() to authenticated;
