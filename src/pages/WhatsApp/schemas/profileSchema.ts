import { z } from 'zod';

// Business verticals enum - matching WhatsApp Business API values
export const BusinessVerticalEnum = z.enum([
  'OTHER',
  'AUTO',
  'BEAUTY',
  'APPAREL',
  'EDU',
  'ENTERTAIN',
  'EVENT_PLAN',
  'FINANCE',
  'GROCERY',
  'GOVT',
  'HOTEL',
  'HEALTH',
  'NONPROFIT',
  'PROF_SERVICES',
  'RETAIL',
  'TRAVEL',
  'RESTAURANT',
  'ALCOHOL',
  'ONLINE_GAMBLING',
  'PHYSICAL_GAMBLING',
  'OTC_DRUGS',
]);

// Display name status enum
export const DisplayNameStatusEnum = z.enum([
  'PENDING',
  'APPROVED',
  'REJECTED',
  'UNKNOWN',
]);

// Business profile schema
export const businessProfileSchema = z.object({
  about: z.string().optional(),
  address: z.string().optional(),
  description: z.string().optional(),
  email: z.string().optional(),
  profile_picture_url: z.string().optional(),
  websites: z.array(z.string()).optional(),
  vertical: z.string().optional(),
});

// Update business profile payload schema
export const updateBusinessProfilePayloadSchema = z.object({
  about: z.string().max(139, 'About text must not exceed 139 characters').optional(),
  address: z.string().max(256, 'Address must not exceed 256 characters').optional(),
  description: z.string().max(512, 'Description must not exceed 512 characters').optional(),
  email: z.string().max(128, 'Email must not exceed 128 characters').optional(),
  vertical: z.string().optional(),
  websites: z.array(z.string()).max(2, 'Maximum 2 websites allowed').optional(),
  profilePictureHandle: z.string().optional(),
});

// Display name status schema
export const displayNameStatusSchema = z.object({
  displayNameStatus: DisplayNameStatusEnum,
  displayPhoneNumber: z.string(),
  verifiedName: z.string().optional(),
  qualityRating: z.string().optional(),
  throughput: z.string().optional(),
});

// Profile picture upload data schema
export const profilePictureUploadDataSchema = z.object({
  fileHandle: z.string(),
  fileName: z.string(),
  fileSize: z.number(),
  mimeType: z.string(),
});

// API Response schemas
export const businessProfileResponseSchema = z.object({
  statusCode: z.number(),
  message: z.string(),
  data: businessProfileSchema,
});

export const updateBusinessProfileResponseSchema = z.object({
  statusCode: z.number(),
  message: z.string(),
  data: z.object({
    success: z.boolean(),
  }),
});

export const displayNameStatusResponseSchema = z.object({
  statusCode: z.number(),
  message: z.string(),
  data: displayNameStatusSchema,
});

export const profilePictureUploadResponseSchema = z.object({
  statusCode: z.number(),
  message: z.string(),
  data: profilePictureUploadDataSchema,
});

// Webhook subscription status schema
export const webhookSubscriptionStatusSchema = z.object({
  isSubscribed: z.boolean(),
});

// Webhook subscription status response schema
export const webhookSubscriptionStatusResponseSchema = z.object({
  statusCode: z.number(),
  message: z.string(),
  data: webhookSubscriptionStatusSchema,
});

// Type exports
export type BusinessProfile = z.infer<typeof businessProfileSchema>;
export type UpdateBusinessProfilePayload = z.infer<typeof updateBusinessProfilePayloadSchema>;
export type DisplayNameStatus = z.infer<typeof displayNameStatusSchema>;
export type ProfilePictureUploadData = z.infer<typeof profilePictureUploadDataSchema>;
export type BusinessVertical = z.infer<typeof BusinessVerticalEnum>;
export type DisplayNameStatusValue = z.infer<typeof DisplayNameStatusEnum>;

// API Response types
export type BusinessProfileResponse = z.infer<typeof businessProfileResponseSchema>;
export type UpdateBusinessProfileResponse = z.infer<typeof updateBusinessProfileResponseSchema>;
export type DisplayNameStatusResponse = z.infer<typeof displayNameStatusResponseSchema>;
export type ProfilePictureUploadResponse = z.infer<typeof profilePictureUploadResponseSchema>;
export type WebhookSubscriptionStatus = z.infer<typeof webhookSubscriptionStatusSchema>;
export type WebhookSubscriptionStatusResponse = z.infer<typeof webhookSubscriptionStatusResponseSchema>;

// Business vertical labels for UI
export const BUSINESS_VERTICAL_LABELS: Record<BusinessVertical, string> = {
  OTHER: 'Other',
  AUTO: 'Automotive',
  BEAUTY: 'Beauty & Personal Care',
  APPAREL: 'Apparel & Fashion',
  EDU: 'Education',
  ENTERTAIN: 'Entertainment',
  EVENT_PLAN: 'Event Planning',
  FINANCE: 'Finance & Banking',
  GROCERY: 'Food & Grocery',
  GOVT: 'Government',
  HOTEL: 'Hotel & Lodging',
  HEALTH: 'Health & Wellness',
  NONPROFIT: 'Non-Profit',
  PROF_SERVICES: 'Professional Services',
  RETAIL: 'Retail',
  TRAVEL: 'Travel & Tourism',
  RESTAURANT: 'Restaurant',
  ALCOHOL: 'Alcohol',
  ONLINE_GAMBLING: 'Online Gambling',
  PHYSICAL_GAMBLING: 'Physical Gambling',
  OTC_DRUGS: 'OTC Drugs',
};

// Display name status labels and descriptions
export const DISPLAY_NAME_STATUS_INFO: Record<DisplayNameStatusValue, { label: string; description: string; color: string }> = {
  PENDING: {
    label: 'In Review',
    description: 'Your display name is currently under review by WhatsApp.',
    color: 'yellow',
  },
  APPROVED: {
    label: 'Approved',
    description: 'Your display name has been approved and is active.',
    color: 'green',
  },
  REJECTED: {
    label: 'Rejected',
    description: 'Your display name was not approved. Please review WhatsApp\'s guidelines and resubmit.',
    color: 'red',
  },
  UNKNOWN: {
    label: 'Unknown',
    description: 'Unable to determine the status of your display name.',
    color: 'gray',
  },
};
