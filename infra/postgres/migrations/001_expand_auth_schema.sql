alter table users
  add column if not exists username text,
  add column if not exists name text,
  add column if not exists job text,
  add column if not exists is_verified boolean not null default false;

update users
set
  username = coalesce(
    username,
    nullif(regexp_replace(split_part(email, '@', 1), '[^a-zA-Z0-9_]+', '_', 'g'), ''),
    id::text
  ),
  name = coalesce(name, display_name);

alter table users
  alter column username set not null,
  alter column name set not null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'users_username_key'
  ) then
    alter table users add constraint users_username_key unique (username);
  end if;
end $$;

alter table auth_accounts
  add column if not exists provider_email text;

create table if not exists email_verification_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  token_hash text not null unique,
  expires_at timestamptz not null,
  sent_at timestamptz not null default now(),
  used_at timestamptz null
);

create index if not exists email_verification_tokens_user_id_used_at_idx
  on email_verification_tokens (user_id, used_at);
