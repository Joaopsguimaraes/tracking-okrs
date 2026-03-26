import type { AuthUser } from '@tracking-okrs/shared-types';

declare global {
  namespace Express {
    interface User extends AuthUser {}
  }
}

export {};
