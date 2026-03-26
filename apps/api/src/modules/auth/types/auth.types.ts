import type { AuthUser } from '@tracking-okrs/shared-types';

export type AuthUserRecord = AuthUser & {
  passwordHash: string | null;
};

export type CreateLocalUserInput = {
  username: string;
  email: string;
  name: string;
  passwordHash: string;
  avatarUrl: string | null;
  job: string | null;
};

export type CreateGithubUserInput = {
  username: string;
  email: string;
  name: string;
  avatarUrl: string | null;
  job: string | null;
  githubId: string;
  providerEmail: string | null;
};

export type EmailVerificationTokenRecord = {
  id: string;
  userId: string;
  tokenHash: string;
  expiresAt: string;
  sentAt: string;
  usedAt: string | null;
};

export type CreateEmailVerificationTokenInput = {
  userId: string;
  tokenHash: string;
  expiresAt: string;
  sentAt?: string;
};

export type AuthRepository = {
  findUserByEmail(email: string): Promise<AuthUserRecord | null>;
  findUserByUsername(username: string): Promise<AuthUser | null>;
  findUserById(id: string): Promise<AuthUser | null>;
  findUserByGithubId(githubId: string): Promise<AuthUser | null>;
  createLocalUser(input: CreateLocalUserInput): Promise<AuthUserRecord>;
  createGithubUser(input: CreateGithubUserInput): Promise<AuthUser>;
  createEmailVerificationToken(input: CreateEmailVerificationTokenInput): Promise<void>;
  findEmailVerificationTokenByHash(tokenHash: string): Promise<EmailVerificationTokenRecord | null>;
  findLatestEmailVerificationTokenByUserId(
    userId: string,
  ): Promise<EmailVerificationTokenRecord | null>;
  consumeEmailVerificationToken(tokenHash: string): Promise<boolean>;
  invalidateEmailVerificationTokensForUser(userId: string): Promise<void>;
  markUserAsVerified(userId: string): Promise<void>;
};

export type EmailDeliveryStatus = 'sent' | 'pending_retry';

export type SendVerificationEmailInput = {
  to: string;
  name: string;
  verificationUrl: string;
};

export type EmailSender = {
  sendVerificationEmail(input: SendVerificationEmailInput): Promise<void>;
};

export type GithubProfileInput = {
  id: string;
  username?: string | null;
  displayName?: string | null;
  primaryEmail?: string | null;
  avatarUrl?: string | null;
};
