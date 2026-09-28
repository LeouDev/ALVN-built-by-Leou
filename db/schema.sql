-- ALVN admin tables. Safe to re-run: paste into Supabase's SQL Editor,
-- or run `node --env-file=.env.local scripts/db-setup.mjs`.

-- Their own schema: Supabase's public API only serves `public`, so none of this is
-- reachable with the project's publishable key. Row level security is on as a second lock.
create schema if not exists alvn;

-- Inbox: a copy of every inquiry and booked call, plus Leou's replies.
create table if not exists alvn.messages (
  id bigint generated always as identity primary key,
  kind text not null check (kind in ('inquiry', 'booking')),
  name text not null,
  email text not null,
  subject text not null default '',
  body text not null default '',
  details jsonb not null default '{}',
  created_at timestamptz not null default now(),
  read_at timestamptz,
  archived_at timestamptz
);
create index if not exists messages_created_at on alvn.messages (created_at desc);

create table if not exists alvn.replies (
  id bigint generated always as identity primary key,
  message_id bigint not null references alvn.messages (id) on delete cascade,
  body text not null,
  sent_at timestamptz not null default now()
);

-- One-time admin sign-in links (only the hash of each token is stored).
create table if not exists alvn.login_tokens (
  hash text primary key,
  expires_at timestamptz not null,
  used_at timestamptz,
  created_at timestamptz not null default now()
);

alter table alvn.messages enable row level security;
alter table alvn.replies enable row level security;
alter table alvn.login_tokens enable row level security;
