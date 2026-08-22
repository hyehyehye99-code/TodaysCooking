-- Let a "먹고 싶어요" reaction come from a visitor who never logs in — the
-- point of the public share page is that no account is required to view it,
-- and requiring login just to react was a bigger ask than the feature
-- warrants. Anonymous reactions have no identity to dedupe or undo by (the
-- client remembers "already reacted" locally instead), so they're a one-way
-- add; only a signed-in reactor can still toggle their own reaction off.
alter table recipe_reactions alter column user_id drop not null;

drop policy if exists "recipe_reactions: signed-in visitors can react to a shared recipe" on recipe_reactions;
create policy "recipe_reactions: anyone can react to a shared recipe" on recipe_reactions
  for insert with check (
    (user_id is null or user_id = auth.uid())
    and exists (
      select 1 from recipes r
      join households h on h.id = r.household_id
      where r.id = recipe_reactions.recipe_id and h.share_code is not null
    )
  );

create or replace function get_recipe_reactions(target_recipe_id uuid)
returns table (id uuid, nickname text, created_at timestamptz)
language sql
security definer
set search_path = public
stable
as $$
  select
    rr.id,
    coalesce(p.nickname, split_part(u.email, '@', 1), '외부 방문자') as nickname,
    rr.created_at
  from recipe_reactions rr
  left join auth.users u on u.id = rr.user_id
  left join profiles p on p.id = rr.user_id
  where rr.recipe_id = target_recipe_id
    and is_household_member((select r.household_id from recipes r where r.id = target_recipe_id))
  order by rr.created_at desc;
$$;
