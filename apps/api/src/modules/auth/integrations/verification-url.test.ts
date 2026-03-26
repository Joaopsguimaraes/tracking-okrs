import assert from 'node:assert/strict';
import test from 'node:test';

import { buildEmailVerificationUrl } from './verification-url.js';

void test('buildEmailVerificationUrl composes the auth verification endpoint from the app origin', () => {
  const url = buildEmailVerificationUrl('http://localhost:3000', 'plain-token');

  assert.equal(url, 'http://localhost:3000/api/v1/auth/verify-email?token=plain-token');
});
