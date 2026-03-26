export const buildEmailVerificationUrl = (appOrigin: string, rawToken: string): string => {
  const url = new URL('/api/v1/auth/verify-email', appOrigin);
  url.searchParams.set('token', rawToken);
  return url.toString();
};
