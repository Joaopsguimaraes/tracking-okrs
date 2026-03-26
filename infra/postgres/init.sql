create extension if not exists "pgcrypto";

create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  display_name text not null,
  password_hash text null,
  avatar_url text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists auth_accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  provider text not null,
  provider_user_id text not null,
  created_at timestamptz not null default now(),
  unique (provider, provider_user_id)
);

create table if not exists quarters (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  starts_at date not null,
  ends_at date not null,
  created_at timestamptz not null default now()
);

create table if not exists objectives (
  id uuid primary key default gen_random_uuid(),
  quarter_id uuid not null references quarters(id) on delete cascade,
  title text not null,
  description text null,
  created_at timestamptz not null default now()
);

create table if not exists key_results (
  id uuid primary key default gen_random_uuid(),
  objective_id uuid not null references objectives(id) on delete cascade,
  quarter_id uuid not null references quarters(id) on delete cascade,
  title text not null,
  description text null,
  progress_percentage numeric(5,2) not null default 0,
  created_at timestamptz not null default now()
);
