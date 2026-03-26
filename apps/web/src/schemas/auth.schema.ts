import { toTypedSchema } from '@vee-validate/zod';
import { z } from 'zod';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export type LoginSchema = z.infer<typeof loginSchema>;

export const typedLoginSchema = toTypedSchema(loginSchema);
