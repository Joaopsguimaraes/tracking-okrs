import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const currentDirectory = path.dirname(fileURLToPath(import.meta.url));
const repositoryRoot = path.resolve(currentDirectory, '../../../../../..');

const readProjectFile = async (relativePath: string): Promise<string> =>
  readFile(path.join(repositoryRoot, relativePath), 'utf8');

void test('bootstrap schema includes expanded auth user fields and verification token table', async () => {
  const schema = await readProjectFile('infra/postgres/init.sql');

  assert.match(schema, /create table if not exists users/i);
  assert.match(schema, /username text not null unique/i);
  assert.match(schema, /name text not null/i);
  assert.match(schema, /job text null/i);
  assert.match(schema, /is_verified boolean not null default false/i);
  assert.match(schema, /provider_email text null/i);
  assert.match(schema, /create table if not exists email_verification_tokens/i);
  assert.match(schema, /token_hash text not null unique/i);
  assert.match(schema, /expires_at timestamptz not null/i);
  assert.match(schema, /used_at timestamptz null/i);
});

void test('migration covers legacy user/auth tables and verification token lifecycle', async () => {
  const migration = await readProjectFile('infra/postgres/migrations/001_expand_auth_schema.sql');

  assert.match(migration, /alter table users/i);
  assert.match(migration, /add column if not exists username text/i);
  assert.match(migration, /add column if not exists name text/i);
  assert.match(migration, /add column if not exists job text/i);
  assert.match(migration, /add column if not exists is_verified boolean not null default false/i);
  assert.match(migration, /update users/i);
  assert.match(migration, /alter table auth_accounts/i);
  assert.match(migration, /add column if not exists provider_email text/i);
  assert.match(migration, /create table if not exists email_verification_tokens/i);
  assert.match(
    migration,
    /create index if not exists email_verification_tokens_user_id_used_at_idx/i,
  );
});
