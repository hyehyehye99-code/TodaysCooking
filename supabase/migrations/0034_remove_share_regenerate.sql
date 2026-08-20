-- The "재발급" (regenerate) button was removed from the share modal — the
-- only way to turn sharing on is now from an off state, so the enabled
-- branch no longer needs to distinguish 'enabled' vs 'regenerated'.
create or replace function set_household_share_enabled(target_household_id uuid, enabled boolean)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  new_code text;
begin
  if not is_household_member(target_household_id) then
    raise exception 'not_a_member';
  end if;

  if enabled then
    new_code := generate_household_share_code();
    update households
    set share_code = new_code,
        share_updated_by = auth.uid(),
        share_updated_at = now(),
        share_last_action = 'enabled'
    where id = target_household_id;
    return new_code;
  else
    update households
    set share_code = null,
        share_tags = null,
        share_updated_by = auth.uid(),
        share_updated_at = now(),
        share_last_action = 'disabled'
    where id = target_household_id;
    return null;
  end if;
end;
$$;
