-- Public menu-board sharing: a household can turn on one link
-- (households.share_code) that lets anyone — no invite, no login — see a
-- read-only preview of its recipes. Logged-in visitors can additionally
-- leave a "먹고 싶어요" reaction on a recipe, which the household sees as a
-- log entry on that recipe's detail page.

alter table households add column if not exists share_code text unique;
-- null/empty = share everything; otherwise only recipes carrying at least
-- one of these tags are included in the public preview.
alter table households add column if not exists share_tags text[];

create or replace function generate_household_share_code()
returns text
language plpgsql
as $$
declare
  candidate text;
begin
  loop
    candidate := replace(replace(replace(encode(gen_random_bytes(9), 'base64'), '/', '_'), '+', '-'), '=', '');
    exit when not exists (select 1 from households where share_code = candidate);
  end loop;
  return candidate;
end;
$$;

-- Turning sharing on (re)issues a fresh code — the same call doubles as
-- "regenerate" (invalidates whatever link was out there) and "create".
-- Turning it off clears the code, which is what every public/reaction
-- policy below actually checks.
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
    update households set share_code = new_code where id = target_household_id;
    return new_code;
  else
    update households set share_code = null, share_tags = null where id = target_household_id;
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
  set share_tags = case when coalesce(array_length(new_tags, 1), 0) = 0 then null else new_tags end
  where id = target_household_id;
end;
$$;

grant execute on function generate_household_share_code() to authenticated;
grant execute on function set_household_share_enabled(uuid, boolean) to authenticated;
grant execute on function set_household_share_tags(uuid, text[]) to authenticated;

-- Public reads — security definer so an anonymous visitor's request (which
-- has no household membership at all) can still resolve a share link,
-- without opening up the underlying households/recipes tables via RLS.
create or replace function get_shared_household(p_share_code text)
returns table (id uuid, name text)
language sql
security definer
set search_path = public
stable
as $$
  select id, name from households where share_code = p_share_code;
$$;

create or replace function get_shared_recipes(p_share_code text)
returns table (
  id uuid,
  title text,
  subtitle text,
  cover_photo_urls text[],
  icon_emoji text,
  tags text[]
)
language sql
security definer
set search_path = public
stable
as $$
  select r.id, r.title, r.subtitle, r.cover_photo_urls, r.icon_emoji, r.tags
  from recipes r
  join households h on h.id = r.household_id
  where h.share_code = p_share_code
    and (
      coalesce(array_length(h.share_tags, 1), 0) = 0
      or r.tags && h.share_tags
    )
  order by r.position asc nulls last, r.created_at desc;
$$;

grant execute on function get_shared_household(text) to anon, authenticated;
grant execute on function get_shared_recipes(text) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- reactions ("먹고 싶어요")
-- ---------------------------------------------------------------------------

create table recipe_reactions (
  id uuid primary key default gen_random_uuid(),
  recipe_id uuid not null references recipes (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (recipe_id, user_id)
);

create index on recipe_reactions (recipe_id);

alter table recipe_reactions enable row level security;

create policy "recipe_reactions: household members or the reactor can select" on recipe_reactions
  for select using (
    user_id = auth.uid()
    or exists (
      select 1 from recipes r
      where r.id = recipe_reactions.recipe_id and is_household_member(r.household_id)
    )
  );

-- Anyone signed in can react, but only to a recipe whose household currently
-- has sharing turned on — this is the only path an outsider (non-member)
-- can write through.
create policy "recipe_reactions: signed-in visitors can react to a shared recipe" on recipe_reactions
  for insert with check (
    user_id = auth.uid()
    and exists (
      select 1 from recipes r
      join households h on h.id = r.household_id
      where r.id = recipe_reactions.recipe_id and h.share_code is not null
    )
  );

create policy "recipe_reactions: household members can delete" on recipe_reactions
  for delete using (
    exists (
      select 1 from recipes r
      where r.id = recipe_reactions.recipe_id and is_household_member(r.household_id)
    )
  );

create policy "recipe_reactions: reactor can undo their own" on recipe_reactions
  for delete using (user_id = auth.uid());

create or replace function get_recipe_reactions(target_recipe_id uuid)
returns table (id uuid, nickname text, created_at timestamptz)
language sql
security definer
set search_path = public
stable
as $$
  select
    rr.id,
    coalesce(p.nickname, split_part(u.email, '@', 1)) as nickname,
    rr.created_at
  from recipe_reactions rr
  join auth.users u on u.id = rr.user_id
  left join profiles p on p.id = rr.user_id
  where rr.recipe_id = target_recipe_id
    and is_household_member((select r.household_id from recipes r where r.id = target_recipe_id))
  order by rr.created_at desc;
$$;

grant execute on function get_recipe_reactions(uuid) to authenticated;
