-- 문의하기 (support inquiries) — previously just a mailto: link with no
-- record kept anywhere. This gives users an in-app submission + history
-- view, and the admin dashboard something to actually list and respond to.

create table inquiries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  message text not null,
  status text not null default 'open' check (status in ('open', 'resolved')),
  admin_note text,
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);

create index on inquiries (user_id, created_at desc);
create index on inquiries (status, created_at desc);

alter table inquiries enable row level security;

create policy "inquiries: user can insert own" on inquiries
  for insert with check (user_id = auth.uid());

create policy "inquiries: user can select own" on inquiries
  for select using (user_id = auth.uid());
