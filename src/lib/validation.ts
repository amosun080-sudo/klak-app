/**
 * Centralized Zod validation schemas — Issue #6 from code review.
 * Used in auth forms, budget creation, and currency inputs.
 */
import { z } from 'zod';

export const phoneSchema = z
  .string()
  .regex(/^[0-9]{10}$/, 'Phone must be 10 digits (without country code)')
  .refine((val) => !val.startsWith('0') === false || val.startsWith('0'),
    'Enter digits after +234');

export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Must include at least one uppercase letter')
  .regex(/[0-9]/, 'Must include at least one number');

export const currencySchema = z
  .number()
  .int('Must be a whole number')
  .min(0, 'Amount must be positive')
  .max(99_999_999_99, 'Amount exceeds maximum');

export const registrationSchema = z.object({
  fullName: z.string().min(2, 'Name must be at least 2 characters').trim(),
  phone:    z.string().min(10, 'Enter a valid phone number'),
  password: passwordSchema,
});

export const loginSchema = z.object({
  phone:    z.string().min(10, 'Enter a valid phone number'),
  password: z.string().min(1, 'Enter your password'),
});

export const budgetSchema = z.object({
  categoryId:  z.string().min(1, 'Choose a category'),
  limitCents:  currencySchema.min(1, 'Enter a spending limit'),
  month:       z.number().int().min(1).max(12),
  year:        z.number().int().min(2020),
});
