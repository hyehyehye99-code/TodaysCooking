-- The public share link is one-per-household, so any member can turn it on,
-- turn it off, regenerate it, or change its tag filter — and until now the
-- others had no way to know it happened. This isn't a chat/comment thread,
-- just a lightweight "who last touched it, and when" record shown in the
-- share settings modal.
alter table households add column if not exists share_updated_by uuid references auth.users (id) on delete set null;
alter table households add column if not exists share_updated_at timestamptz;
alter table households add column if not exists share_last_action text;

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
        share_last_action = case when share_code is null then 'enabled' else 'regenerated' end
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

create or replace function set_household_share_tags(target_household_id uuid, new_tags text[])
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not is_household_member(target_household_id) then
    raise exception 'not_a_member';
  end if;

  update households
  set share_tags = case when coalesce(array_length(new_tags, 1), 0) = 0 then null else new_tags end,
      share_updated_by = auth.uid(),
      share_updated_at = now(),
      share_last_action = 'tags_changed'
  where id = target_household_id;
end;
$$;
