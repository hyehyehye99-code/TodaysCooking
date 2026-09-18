-- Manual drag-to-reorder for the timer list, same shape as reorder_recipes.
alter table timers add column position integer;

create function reorder_timers(timer_ids uuid[])
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update timers t
  set position = v.pos
  from unnest(timer_ids) with ordinality as v(id, pos)
  where t.id = v.id
    and is_household_member(t.household_id);
end;
$$;

grant execute on function reorder_timers(uuid[]) to authenticated;
