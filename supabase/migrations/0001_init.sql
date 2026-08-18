-- 둘의 부엌 — initial schema
-- Run this in the Supabase SQL editor, or via `supabase db push` with the CLI.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- households (a "family"/couple group) and membership
-- ---------------------------------------------------------------------------

create table households (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_by uuid not null references auth.users (id),
  created_at timestamptz not null default now()
);

create table household_members (
  household_id uuid not null references households (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role text not null default 'member' check (role in ('owner', 'member')),
  joined_at timestamptz not null default now(),
  primary key (household_id, user_id)
);

create table household_invites (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households (id) on delete cascade,
  code text not null unique,
  created_by uuid not null references auth.users (id),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default now() + interval '14 days'
);

-- ---------------------------------------------------------------------------
-- app data, all scoped to a household
-- ---------------------------------------------------------------------------

create table recipes (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households (id) on delete cascade,
  title text not null,
  subtitle text,
  cook_time_minutes integer,
  created_by uuid not null references auth.users (id),
  created_at timestamptz not null default now()
);

create table recipe_ingredients (
  id uuid primary key default gen_random_uuid(),
  recipe_id uuid not null references recipes (id) on delete cascade,
  name text not null,
  position integer not null default 0
);

create table fridge_items (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households (id) on delete cascade,
  name text not null,
  in_stock boolean not null default true,
  updated_at timestamptz not null default now(),
  unique (household_id, name)
);

create table bookmarks (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households (id) on delete cascade,
  url text not null,
  title text,
  domain text,
  thumbnail_url text,
  created_by uuid not null references auth.users (id),
  created_at timestamptz not null default now()
);

create table shopping_items (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households (id) on delete cascade,
  name text not null,
  source_recipe_id uuid references recipes (id) on delete set null,
  source_recipe_title text,
  checked boolean not null default false,
  created_at timestamptz not null default now()
);

create index on recipe_ingredients (recipe_id);
create index on fridge_items (household_id);
create index on bookmarks (household_id);
create index on shopping_items (household_id);
create index on household_members (user_id);

-- ---------------------------------------------------------------------------
-- membership helper + RLS
-- ---------------------------------------------------------------------------

create or replace function is_household_member(target_household_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from household_members
    where household_id = target_household_id
      and user_id = auth.uid()
  );
$$;

alter table households enable row level security;
alter table household_members enable row level security;
alter table household_invites enable row level security;
alter table recipes enable row level security;
alter table recipe_ingredients enable row level security;
alter table fridge_items enable row level security;
alter table bookmarks enable row level security;
alter table shopping_items enable row level security;

-- households: members can read; direct writes are blocked, use the RPCs below
create policy "households: members can select" on households
  for select using (is_household_member(id));

-- household_members: members can see their household's roster
create policy "household_members: members can select" on household_members
  for select using (is_household_member(household_id));

-- household_invites: members can see and create invites for their household
create policy "household_invites: members can select" on household_invites
  for select using (is_household_member(household_id));

create policy "household_invites: members can create" on household_invites
  for insert with check (is_household_member(household_id) and created_by = auth.uid());

-- recipes
create policy "recipes: members can select" on recipes
  for select using (is_household_member(household_id));
create policy "recipes: members can insert" on recipes
  for insert with check (is_household_member(household_id) and created_by = auth.uid());
create policy "recipes: members can update" on recipes
  for update using (is_household_member(household_id));
create policy "recipes: members can delete" on recipes
  for delete using (is_household_member(household_id));

-- recipe_ingredients (scoped via parent recipe's household)
create policy "recipe_ingredients: members can select" on recipe_ingredients
  for select using (
    exists (select 1 from recipes r where r.id = recipe_id and is_household_member(r.household_id))
  );
create policy "recipe_ingredients: members can insert" on recipe_ingredients
  for insert with check (
    exists (select 1 from recipes r where r.id = recipe_id and is_household_member(r.household_id))
  );
create policy "recipe_ingredients: members can delete" on recipe_ingredients
  for delete using (
    exists (select 1 from recipes r where r.id = recipe_id and is_household_member(r.household_id))
  );

-- fridge_items
create policy "fridge_items: members can select" on fridge_items
  for select using (is_household_member(household_id));
create policy "fridge_items: members can insert" on fridge_items
  for insert with check (is_household_member(household_id));
create policy "fridge_items: members can update" on fridge_items
  for update using (is_household_member(household_id));
create policy "fridge_items: members can delete" on fridge_items
  for delete using (is_household_member(household_id));

-- bookmarks
create policy "bookmarks: members can select" on bookmarks
  for select using (is_household_member(household_id));
create policy "bookmarks: members can insert" on bookmarks
  for insert with check (is_household_member(household_id) and created_by = auth.uid());
create policy "bookmarks: members can delete" on bookmarks
  for delete using (is_household_member(household_id));

-- shopping_items
create policy "shopping_items: members can select" on shopping_items
  for select using (is_household_member(household_id));
create policy "shopping_items: members can insert" on shopping_items
  for insert with check (is_household_member(household_id));
create policy "shopping_items: members can update" on shopping_items
  for update using (is_household_member(household_id));
create policy "shopping_items: members can delete" on shopping_items
  for delete using (is_household_member(household_id));

-- ---------------------------------------------------------------------------
-- RPCs for creating/joining a household (writes households/household_members
-- directly, bypassing the tables' own RLS, since a brand-new member can't
-- satisfy "is_household_member" until the row exists)
-- ---------------------------------------------------------------------------

create or replace function create_household(household_name text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  new_id uuid;
begin
  insert into households (name, created_by) values (household_name, auth.uid())
  returning id into new_id;

  insert into household_members (household_id, user_id, role)
  values (new_id, auth.uid(), 'owner');

  return new_id;
end;
$$;

create or replace function join_household_with_code(invite_code text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  target_household_id uuid;
begin
  select household_id into target_household_id
  from household_invites
  where code = invite_code and expires_at > now();

  if target_household_id is null then
    raise exception 'invalid_or_expired_invite';
  end if;

  insert into household_members (household_id, user_id, role)
  values (target_household_id, auth.uid(), 'member')
  on conflict (household_id, user_id) do nothing;

  return target_household_id;
end;
$$;

grant execute on function create_household(text) to authenticated;
grant execute on function join_household_with_code(text) to authenticated;
grant execute on function is_household_member(uuid) to authenticated;
