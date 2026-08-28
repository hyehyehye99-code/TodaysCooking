-- A regular user can apply to become an Explore 크리에이터 — this is just
-- the application/submission; the admin still reviews it and manually
-- creates the real creators/creator_recipes rows (via the SQL editor, same
-- as always) if they approve it. Nothing here writes to those tables
-- directly, so Explore stays admin-curated.

create table creator_applications (
  id uuid primary key default gen_random_uuid(),
  applicant_user_id uuid not null references auth.users (id) on delete cascade,
  creator_name text not null,
  channel_type text,
  channel_name text,
  channel_link text,
  tags text[] not null default '{}',
  representative_links text[] not null default '{}',
  status text not null default 'pending',
  created_at timestamptz not null default now()
);

create index on creator_applications (applicant_user_id, created_at desc);

alter table creator_applications enable row level security;

create policy "creator_applications: applicant can insert their own" on creator_applications
  for insert with check (applicant_user_id = auth.uid());

create policy "creator_applications: applicant can select their own" on creator_applications
  for select using (applicant_user_id = auth.uid());
