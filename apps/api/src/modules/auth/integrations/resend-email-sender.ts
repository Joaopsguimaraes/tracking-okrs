import { env } from '../../../config/env.js';
import type { EmailSender, SendVerificationEmailInput } from '../types/auth.types.js';

type ResendEmailSenderDependencies = {
  apiKey?: string;
  fromEmail?: string;
  fromName?: string;
  fetchImpl?: typeof fetch;
};

const escapeHtml = (value: string): string =>
  value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');

const buildFrom = (fromEmail: string, fromName?: string): string =>
  fromName?.trim() ? `${fromName.trim()} <${fromEmail}>` : fromEmail;

const buildVerificationEmailHtml = (name: string, verificationUrl: string): string => {
  const safeName = escapeHtml(name);
  const safeUrl = escapeHtml(verificationUrl);

  return [
    `<p>Hello ${safeName},</p>`,
    '<p>Use the link below to verify your Tracking OKRs account.</p>',
    `<p><a href="${safeUrl}">Verify email address</a></p>`,
    '<p>This verification link expires in 24 hours.</p>',
  ].join('');
};

export const createResendEmailSender = (
  dependencies: ResendEmailSenderDependencies = {},
): EmailSender => {
  const fetchImpl = dependencies.fetchImpl ?? fetch;
  const apiKey = dependencies.apiKey ?? env.RESEND_API_KEY;
  const fromEmail = dependencies.fromEmail ?? env.RESEND_FROM_EMAIL;
  const fromName = dependencies.fromName ?? env.RESEND_FROM_NAME;

  return {
    async sendVerificationEmail(input: SendVerificationEmailInput): Promise<void> {
      const response = await fetchImpl('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: buildFrom(fromEmail, fromName),
          to: [input.to],
          subject: 'Verify your Tracking OKRs account',
          html: buildVerificationEmailHtml(input.name, input.verificationUrl),
        }),
      });

      if (response.ok) {
        return;
      }

      const responseBody = await response.text();
      throw new Error(`Resend request failed with status ${response.status}: ${responseBody}`);
    },
  };
};

export const resendEmailSender = createResendEmailSender();
