-- Referral rewards: inviting a new friend earns "reset tickets" that wipe
-- (full) or halve (half) the current weekly AI usage.
--
-- Usage is still counted as ai_recipe_generations rows in the last 7 days;
-- a ticket just flags rows as `forgiven` so the count query skips them.
alter table ai_recipe_generations add column if not exists forgiven boolean not null default false;

create table reset_tickets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  kind text not null check (kind in ('full', 'half')),
  source text not null check (source in ('referral_inviter', 'referral_invitee', 'admin')),
  created_at timestamptz not null default now(),
  used_at timestamptz
);
create index on reset_tickets (user_id, created_at desc);

alter table reset_tickets enable row level security;
-- Read-only for users: tickets are only ever created by claim_referral_reward /
-- admin tooling and spent by use_reset_ticket (both security definer).
create policy "reset_tickets: users can read their own" on reset_tickets
  for select using (user_id = auth.uid());

-- One row per invited person, ever — the primary key is what stops the same
-- account from rewarding anyone twice.
create table referral_rewards (
  invitee_id uuid primary key references auth.users (id) on delete cascade,
  inviter_id uuid not null references auth.users (id) on delete cascade,
  household_id uuid references households (id) on delete set null,
  created_at timestamptz not null default now()
);
create index on referral_rewards (inviter_id, created_at);

alter table referral_rewards enable row level security;
create policy "referral_rewards: users can read their own" on referral_rewards
  for select using (inviter_id = auth.uid() or invitee_id = auth.uid());

create table ai_usage_settings (
  user_id uuid primary key references auth.users (id) on delete cascade,
  auto_use_tickets boolean not null default false,
  ticket_order text not null default 'half_first' check (ticket_order in ('half_first', 'full_first')),
  updated_at timestamptz not null default now()
);

alter table ai_usage_settings enable row level security;
create policy "ai_usage_settings: users manage their own" on ai_usage_settings
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Called by the app right after someone joins a household with an invite code.
-- Rewards only a brand-new account (created in the last 3 days) joining a
-- household someone else owns; the household's owner counts as the inviter.
-- The new friend always gets a ticket; the inviter gets one too unless they've
-- already earned 10 this month. Idempotent, so calling it twice is harmless.
create function claim_referral_reward(p_household_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  me uuid := auth.uid();
  inviter uuid;
  account_created timestamptz;
begin
  if me is null then
    return false;
  end if;

  if not exists (
    select 1 from household_members where household_id = p_household_id and user_id = me
  ) then
    return false;
  end if;

  select created_at into account_created from auth.users where id = me;
  if account_created is null or account_created < now() - interval '3 days' then
    return false;
  end if;

  select user_id into inviter
  from household_members
  where household_id = p_household_id and role = 'owner'
  order by joined_at
  limit 1;
  if inviter is null or inviter = me then
    return false;
  end if;

  insert into referral_rewards (invitee_id, inviter_id, household_id)
  values (me, inviter, p_household_id)
  on conflict (invitee_id) do nothing;
  if not found then
    return false;
  end if;

  insert into reset_tickets (user_id, kind, source) values (me, 'full', 'referral_invitee');

  if (
    select count(*) from referral_rewards
    where inviter_id = inviter and created_at > now() - interval '30 days'
  ) <= 10 then
    insert into reset_tickets (user_id, kind, source) values (inviter, 'full', 'referral_inviter');
  end if;

  return true;
end;
$$;

grant execute on function claim_referral_reward(uuid) to authenticated;

-- Spends one unused ticket of the given kind. A full ticket forgives every
-- counted generation in the last 7 days, a half ticket the oldest half of them
-- (rounded up). Returns how many generations were forgiven; null when the user
-- has no such ticket. Raises 'nothing_to_reset' rather than burning a ticket
-- while usage is already at 0.
create function use_reset_ticket(p_kind text)
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  me uuid := auth.uid();
  ticket_id uuid;
  used_count int;
  to_forgive int;
begin
  if me is null or p_kind not in ('full', 'half') then
    raise exception 'invalid_request';
  end if;

  select id into ticket_id
  from reset_tickets
  where user_id = me and kind = p_kind and used_at is null
  order by created_at
  limit 1
  for update skip locked;
  if ticket_id is null then
    return null;
  end if;

  select count(*) into used_count
  from ai_recipe_generations
  where user_id = me and via_bonus = false and forgiven = false
    and created_at >= now() - interval '7 days';
  if used_count = 0 then
    raise exception 'nothing_to_reset';
  end if;

  to_forgive := case when p_kind = 'full' then used_count else ceil(used_count / 2.0)::int end;

  update ai_recipe_generations set forgiven = true
  where id in (
    select id from ai_recipe_generations
    where user_id = me and via_bonus = false and forgiven = false
      and created_at >= now() - interval '7 days'
    order by created_at
    limit to_forgive
  );

  update reset_tickets set used_at = now() where id = ticket_id;
  return to_forgive;
end;
$$;

grant execute on function use_reset_ticket(text) to authenticated;
