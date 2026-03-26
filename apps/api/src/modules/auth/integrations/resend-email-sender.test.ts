import assert from 'node:assert/strict';
import test from 'node:test';

process.env.NODE_ENV ??= 'test';
process.env.APP_ORIGIN ??= 'http://localhost:3000';
process.env.SESSION_SECRET ??= '1234567890abcdef';
process.env.POSTGRES_HOST ??= 'localhost';
process.env.POSTGRES_PORT ??= '5432';
process.env.POSTGRES_DB ??= 'tracking_okrs_test';
process.env.POSTGRES_USER ??= 'postgres';
process.env.POSTGRES_PASSWORD ??= 'postgres';
process.env.RESEND_API_KEY ??= 'resend-api-key';
process.env.RESEND_FROM_EMAIL ??= 'no-reply@example.com';
process.env.RESEND_FROM_NAME ??= 'Tracking OKRs';
process.env.GITHUB_CLIENT_ID ??= 'github-client-id';
process.env.GITHUB_CLIENT_SECRET ??= 'github-client-secret';
process.env.GITHUB_CALLBACK_URL ??= 'http://localhost:3000/api/v1/auth/github/callback';
process.env.OTEL_EXPORTER_OTLP_ENDPOINT ??= 'http://localhost:4318';

import { createResendEmailSender } from './resend-email-sender.js';

void test('createResendEmailSender sends the expected payload to Resend', async () => {
  const requests: {
    url: string;
    init: RequestInit;
  }[] = [];

  const sender = createResendEmailSender({
    apiKey: 'resend-api-key',
    fromEmail: 'no-reply@example.com',
    fromName: 'Tracking OKRs',
    fetchImpl: ((url, init) => {
      requests.push({
        url:
          typeof url === 'string'
            ? url
            : url instanceof URL
              ? url.toString()
              : url.url,
        init: init ?? {},
      });

      return Promise.resolve(
        new Response(null, {
          status: 200,
        }),
      );
    }) as typeof fetch,
  });

  await sender.sendVerificationEmail({
    to: 'alice@example.com',
    name: 'Alice',
    verificationUrl: 'http://localhost:3000/api/v1/auth/verify-email?token=plain-token',
  });

  assert.equal(requests.length, 1);
  const request = requests[0];

  assert.ok(request);
  assert.equal(request.url, 'https://api.resend.com/emails');
  assert.equal(request.init.method, 'POST');
  assert.equal(
    (request.init.headers as Record<string, string>).Authorization,
    'Bearer resend-api-key',
  );

  const body = JSON.parse(request.init.body as string) as Record<string, unknown>;
  assert.equal(body.from, 'Tracking OKRs <no-reply@example.com>');
  assert.deepEqual(body.to, ['alice@example.com']);
  assert.equal(body.subject, 'Verify your Tracking OKRs account');
  assert.match(String(body.html), /Verify email address/);
  assert.match(String(body.html), /plain-token/);
});

void test('createResendEmailSender throws when Resend returns a non-success status', async () => {
  const sender = createResendEmailSender({
    apiKey: 'resend-api-key',
    fromEmail: 'no-reply@example.com',
    fetchImpl: (() =>
      Promise.resolve(
        new Response('provider unavailable', {
          status: 503,
        }),
      )) as typeof fetch,
  });

  await assert.rejects(
    sender.sendVerificationEmail({
      to: 'alice@example.com',
      name: 'Alice',
      verificationUrl: 'http://localhost:3000/api/v1/auth/verify-email?token=plain-token',
    }),
    /Resend request failed with status 503/,
  );
});
