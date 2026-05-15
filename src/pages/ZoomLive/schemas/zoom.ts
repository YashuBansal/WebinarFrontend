import { z } from 'zod'
import { ZoomProjectSchema, type ZoomProject } from './zoomProject'

// Base API response schema
export const ApiResponseSchema = z.object({
  statusCode: z.number(),
  message: z.string(),
  data: z.any().nullable(),
})

// Re-exported for convenience
export { ZoomProjectSchema }

// Zoom User Profile schema (from Zoom API)
export const ZoomUserProfileSchema = z.object({
  id: z.string(),
  first_name: z.string().optional(),
  last_name: z.string().optional(),
  display_name: z.string().optional(),
  email: z.string().email().optional(),
  type: z.number().optional(),
  role_name: z.string().optional(),
  pmi: z.number().optional(),
  use_pmi: z.boolean().optional(),
  personal_meeting_url: z.string().url().optional(),
  timezone: z.string().optional(),
  verified: z.number().optional(),
  dept: z.string().optional(),
  created_at: z.string().optional(),
  last_login_time: z.string().optional(),
  last_client_version: z.string().optional(),
  language: z.string().optional(),
  phone_country: z.string().optional(),
  phone_number: z.string().optional(),
  status: z.string().optional(),
  job_title: z.string().optional(),
  location: z.string().optional(),
  login_types: z.array(z.number()),
  role_id: z.string().optional(),
  account_id: z.string().optional(),
  account_number: z.number().optional(),
  cluster: z.string().optional(),
  jid: z.string().optional(),
  group_ids: z.array(z.string()).optional(),
  im_group_ids: z.array(z.string()).optional(),
  custom_attributes: z.array(z.any()).optional(),
})

// OAuth Exchange Request schema
export const OAuthExchangeRequestSchema = z.object({
  code: z.string(),
  state: z.string(),
  redirectUri: z.string().url(),
  projectId: z.string(),
})

// OAuth Exchange Response schema
export const OAuthExchangeResponseSchema = ApiResponseSchema.extend({
  data: z.object({
    id: z.string(),
  }),
})

// List Accounts Response schema
export const ListAccountsResponseSchema = ApiResponseSchema.extend({
  data: z.array(ZoomProjectSchema),
})

// Zoom User Profile Response schema
export const ZoomUserProfileResponseSchema = ApiResponseSchema.extend({
  data: ZoomUserProfileSchema,
})

// Refresh Token Response schema
export const RefreshTokenResponseSchema = ApiResponseSchema.extend({
  data: z.object({
    accountId: z.string(),
    accessTokenExpiresAt: z.string(),
  }),
})

// Disconnect Response schema
export const DisconnectResponseSchema = ApiResponseSchema.extend({
  data: z.null(),
})

// Webhook subscription status schema
export const WebhookSubscriptionStatusSchema = z.object({
  isSubscribed: z.boolean(),
})

// Webhook subscription status response schema
export const WebhookSubscriptionStatusResponseSchema = ApiResponseSchema.extend({
  data: WebhookSubscriptionStatusSchema,
})

// Type exports
export type ApiResponse = z.infer<typeof ApiResponseSchema>
export type { ZoomProject }
export type ZoomUserProfile = z.infer<typeof ZoomUserProfileSchema>
export type OAuthExchangeRequest = z.infer<typeof OAuthExchangeRequestSchema>
export type OAuthExchangeResponse = z.infer<typeof OAuthExchangeResponseSchema>
export type ListAccountsResponse = z.infer<typeof ListAccountsResponseSchema>
export type ZoomUserProfileResponse = z.infer<typeof ZoomUserProfileResponseSchema>
export type RefreshTokenResponse = z.infer<typeof RefreshTokenResponseSchema>
export type DisconnectResponse = z.infer<typeof DisconnectResponseSchema>
export type WebhookSubscriptionStatus = z.infer<typeof WebhookSubscriptionStatusSchema>
export type WebhookSubscriptionStatusResponse = z.infer<typeof WebhookSubscriptionStatusResponseSchema>
