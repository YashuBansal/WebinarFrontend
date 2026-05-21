import { z } from 'zod';

export const authTokensSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
});

const objectIdSchema = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid ObjectId');

export const userProfileSchema = z.object({
  _id: objectIdSchema,
  email: z.string().email(),
  companyName: z.string().optional(),
  userName: z.string(),
  phone: z.string(),
  isActive: z.boolean(),
  adminId: objectIdSchema,
  role: objectIdSchema,
  dailyContactCount: z.number().int().nonnegative(),
  failedOtpAttempts: z.number().int().nonnegative(),
  dateFormat: z.string(),
  tags: z.array(z.string()),
  documents: z.array(z.any()), // Define a more specific schema if possible
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  isTwoFactorAuthenticationEnabled: z.boolean(),
  isDeleted: z.boolean(),
  // __v is often present but not always needed by the client
  __v: z.number().optional(), 
});


export const CurrentUserApiResponseSchema = z.object({
  status: z.boolean(),
  message: z.string(),
  data: userProfileSchema, // The data field MUST match the UserProfileSchema
});

export const loginPayloadSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters long'),
});

export const loginResponseSchema = z.object({
  tokens: authTokensSchema,
  user: userProfileSchema,
});

export const refreshTokenPayloadSchema = z.object({
  refreshToken: z.string(),
});

export const refreshTokenResponseSchema = z.object({
  tokens: authTokensSchema,
});