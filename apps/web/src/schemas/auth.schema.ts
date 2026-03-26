import { toTypedSchema } from '@vee-validate/zod';
import { z } from 'zod';

const passwordStrengthRegex = /^(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;

const requiredMessage = 'This field is required';

export const loginSchema = z.object({
  email: z.string().trim().min(1, requiredMessage).email('Enter a valid email'),
  password: z.string().min(1, requiredMessage),
});

export type LoginSchema = z.infer<typeof loginSchema>;

export const typedLoginSchema = toTypedSchema(loginSchema);

export const registerSchema = z
  .object({
    username: z.string().trim().min(3, 'Username must have at least 3 characters').max(50),
    email: z.string().trim().min(1, requiredMessage).email('Enter a valid email'),
    name: z.string().trim().min(1, requiredMessage).max(120),
    password: z
      .string()
      .min(8, 'Password must have at least 8 characters')
      .regex(
        passwordStrengthRegex,
        'Password must include at least 1 number and 1 special character',
      ),
    confirmPassword: z.string().min(1, requiredMessage),
    avatarUrl: z
      .string()
      .trim()
      .url('Enter a valid URL')
      .or(z.literal(''))
      .transform((value) => value || undefined)
      .optional(),
    job: z.string().trim().max(120).optional(),
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

export type RegisterSchema = z.infer<typeof registerSchema>;

export const typedRegisterSchema = toTypedSchema(registerSchema);

export const resendVerificationSchema = z.object({
  email: z.string().trim().min(1, requiredMessage).email('Enter a valid email'),
});

export type ResendVerificationSchema = z.infer<typeof resendVerificationSchema>;

export const typedResendVerificationSchema = toTypedSchema(resendVerificationSchema);
