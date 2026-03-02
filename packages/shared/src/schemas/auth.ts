import { z } from 'zod';

import { localeSchema, selfServeRoleSchema } from '../constants/app';

export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters long')
  .regex(/[A-Z]/, 'Password must include an uppercase letter')
  .regex(/[a-z]/, 'Password must include a lowercase letter')
  .regex(/\d/, 'Password must include a number');

export const registerSchema = z.object({
  email: z.string().email(),
  password: passwordSchema,
  role: selfServeRoleSchema,
  locale: localeSchema.default('fr'),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1),
  password: passwordSchema,
});

export const onboardingProfileSchema = z.object({
  fullName: z.string().min(2),
  country: z.string().min(2),
  city: z.string().min(2),
  phone: z.string().min(6),
  headline: z.string().min(2).max(160),
  yearsExperience: z.coerce.number().min(0).max(60),
  locale: localeSchema,
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type OnboardingProfileInput = z.infer<typeof onboardingProfileSchema>;
