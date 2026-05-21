import { z } from 'zod';
import {
  authTokensSchema,
  loginResponseSchema,
  userProfileSchema,
  loginPayloadSchema,
  refreshTokenPayloadSchema,
  refreshTokenResponseSchema,
  userSchema,
  paginatedUsersResponseSchema
} from '../schemas';


// Auth types inferred from schemas
export type AuthTokens = z.infer<typeof authTokensSchema>;
export type UserProfile = z.infer<typeof userProfileSchema>;
export type LoginPayload = z.infer<typeof loginPayloadSchema>;
export type LoginResponse = z.infer<typeof loginResponseSchema>;
export type RefreshTokenPayload = z.infer<typeof refreshTokenPayloadSchema>;
export type RefreshTokenResponse = z.infer<typeof refreshTokenResponseSchema>;

// User types inferred from schemas
export type User = z.infer<typeof userSchema>;
export type PaginatedUsersResponse = z.infer<typeof paginatedUsersResponseSchema>;


// Generic API Error for non-Zod errors
export interface ApiError {
  message: string;
  statusCode: number;
  errors?: { [key: string]: string[] };
}

export const CotactType = {
  WLH: 'wlh',
  WHATSAPP: 'whatsapp'
}