import { z } from 'zod';

const passwordStrengthRegex = /^(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;

export const loginSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(1),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const registerSchema = z
  .object({
    username: z.string().trim().min(3).max(50),
    email: z.string().trim().email(),
    name: z.string().trim().min(1).max(120),
    password: z
      .string()
      .min(8)
      .regex(
        passwordStrengthRegex,
        'Password must have at least 8 characters, 1 number, and 1 special character',
      ),
    confirmPassword: z.string(),
    avatarUrl: z.string().trim().url().optional(),
    job: z.string().trim().min(1).max(120).optional(),
  })
  .superRefine((input, context) => {
    if (input.password !== input.confirmPassword) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Passwords do not match',
        path: ['confirmPassword'],
      });
    }
  });

export const resendVerificationEmailSchema = z.object({
  email: z.string().trim().email(),
});

export const authValidation = {
  isStrongPassword(password: string): boolean {
    return passwordStrengthRegex.test(password);
  },
};

export type RegisterInput = z.infer<typeof registerSchema>;
export type ResendVerificationEmailInput = z.infer<typeof resendVerificationEmailSchema>;
