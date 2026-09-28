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

-- Client projects (phase 2): one row per project, optionally started from an inbox message.
create table if not exists alvn.projects (
  id bigint generated always as identity primary key,
  name text not null,
  client_name text not null,
  client_email text not null default '',
  company text not null default '',
  type text not null default '',
  stage text not null default 'lead'
    check (stage in ('lead', 'proposal', 'contract', 'in_progress', 'review', 'done', 'on_hold')),
  budget integer check (budget >= 0),
  paid integer not null default 0 check (paid >= 0),
  start_date date,
  due_date date,
  live_url text not null default '',
  repo_url text not null default '',
  notes text not null default '',
  message_id bigint references alvn.messages (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists projects_message_id on alvn.projects (message_id);

-- Contracts (phase 3). The text is frozen (body_hash) when Leou signs and sends it; the client
-- signs through a one-time link (only token_hash is stored).
create table if not exists alvn.contracts (
  id bigint generated always as identity primary key,
  project_id bigint references alvn.projects (id) on delete set null,
  title text not null,
  client_name text not null,
  client_email text not null,
  client_company text not null default '',
  terms jsonb not null default '{}',
  body text not null,
  status text not null default 'draft' check (status in ('draft', 'sent', 'signed', 'void')),
  token_hash text unique,
  body_hash text,
  provider_name text,
  provider_signature text,
  provider_signed_at timestamptz,
  provider_ip text,
  provider_ua text,
  sent_at timestamptz,
  viewed_at timestamptz,
  viewed_ip text,
  client_signer_name text,
  client_signature text,
  client_signed_at timestamptz,
  client_ip text,
  client_ua text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists contracts_project_id on alvn.contracts (project_id);

-- The signed PDF, kept apart so contract rows stay light.
create table if not exists alvn.contract_pdfs (
  contract_id bigint primary key references alvn.contracts (id) on delete cascade,
  pdf bytea not null,
  created_at timestamptz not null default now()
);

alter table alvn.messages enable row level security;
alter table alvn.replies enable row level security;
alter table alvn.login_tokens enable row level security;
alter table alvn.projects enable row level security;
alter table alvn.contracts enable row level security;
alter table alvn.contract_pdfs enable row level security;
