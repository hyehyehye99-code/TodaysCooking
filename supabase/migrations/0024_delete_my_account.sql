-- Let a user delete their own account. households/recipes/bookmarks.created_by
-- previously had no ON DELETE behavior (defaulting to RESTRICT), which would
-- block deleting auth.users outright the moment the account had created
-- anything — relax those to SET NULL so that content stays with the
-- household instead of blocking (or cascading away) account deletion.

alter table households alter column created_by drop not null;
alter table households drop constraint if exists households_created_by_fkey;
alter table households add constraint households_created_by_fkey
  foreign key (created_by) references auth.users (id) on delete set null;

alter table recipes alter column created_by drop not null;
alter table recipes drop constraint if exists recipes_created_by_fkey;
alter table recipes add constraint recipes_created_by_fkey
  foreign key (created_by) references auth.users (id) on delete set null;

alter table bookmarks alter column created_by drop not null;
alter table bookmarks drop constraint if exists bookmarks_created_by_fkey;
alter table bookmarks add constraint bookmarks_created_by_fkey
  foreign key (created_by) references auth.users (id) on delete set null;

-- For every household I own, hand ownership to whoever joined earliest
-- besides me, or delete the household if I'm the only member. Then delete
-- my own auth.users row, which cascades to household_members (all my
-- remaining memberships) and profiles via their existing ON DELETE CASCADE.
create or replace function delete_my_account()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  owned record;
  successor uuid;
begin
  for owned in
    select household_id from household_members
    where user_id = auth.uid() and role = 'owner'
  loop
    select user_id into successor
    from household_members
    where household_id = owned.household_id and user_id != auth.uid()
    order by joined_at asc
    limit 1;

    if successor is null then
      delete from households where id = owned.household_id;
    else
      update household_members set role = 'owner'
      where household_id = owned.household_id and user_id = successor;
    end if;
  end loop;

  delete from auth.users where id = auth.uid();
end;
$$;

grant execute on function delete_my_account() to authenticated;
