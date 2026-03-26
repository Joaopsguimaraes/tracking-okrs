import { describe, expect, it } from 'vitest';

import { loginSchema, registerSchema } from '@/schemas/auth.schema';

describe('auth.schema', () => {
  it('rejects empty login fields', () => {
    const result = loginSchema.safeParse({
      email: '',
      password: '',
    });

    expect(result.success).toBe(false);

    if (result.success) {
      return;
    }

    expect(result.error.flatten().fieldErrors.email).toContain('This field is required');
    expect(result.error.flatten().fieldErrors.password).toContain('This field is required');
  });

  it('rejects weak passwords and mismatched confirmation on register', () => {
    const result = registerSchema.safeParse({
      username: 'ana',
      email: 'ana@example.com',
      name: 'Ana',
      password: 'weakpass',
      confirmPassword: 'different',
      avatarUrl: '',
      job: '',
    });

    expect(result.success).toBe(false);

    if (result.success) {
      return;
    }

    expect(result.error.flatten().fieldErrors.password).toContain(
      'Password must include at least 1 number and 1 special character',
    );
    expect(result.error.flatten().fieldErrors.confirmPassword).toContain('Passwords do not match');
  });
});
