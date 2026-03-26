export const AUTH_ERROR_CODES = {
  cooldownActive: 'cooldown_active',
  emailConflict: 'email_conflict',
  emailNotFound: 'email_not_found',
  emailNotVerified: 'email_not_verified',
  expiredVerificationToken: 'expired_verification_token',
  socialEmailMissing: 'social_email_missing',
  invalidCredentials: 'invalid_credentials',
  invalidVerificationToken: 'invalid_verification_token',
  passwordMismatch: 'password_mismatch',
  usernameConflict: 'username_conflict',
  weakPassword: 'weak_password',
} as const;

export type AuthErrorCode = (typeof AUTH_ERROR_CODES)[keyof typeof AUTH_ERROR_CODES];

export class AuthError extends Error {
  readonly code: AuthErrorCode;
  readonly statusCode: number;
  readonly details: Record<string, string> | undefined;

  constructor(
    code: AuthErrorCode,
    message: string,
    options?: {
      details?: Record<string, string>;
      statusCode?: number;
    },
  ) {
    super(message);
    this.name = 'AuthError';
    this.code = code;
    this.statusCode = options?.statusCode ?? 400;
    this.details = options?.details;
  }
}
