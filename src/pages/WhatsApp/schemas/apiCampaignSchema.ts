import { z } from 'zod';

const messageTemplateSchema = z.object({
  templateName: z.string(),
  bodyVariables: z.array(z.string()).optional(),
  headerMediaAssetId: z.string().nullable().optional(),
});

const sampleMediaSchema = z.object({
  url: z.string(),
  filename: z.string(),
}).optional().nullable();

const sampleJSONSchema = z.object({
  campaignName: z.string(),
  destination: z.string(),
  media: sampleMediaSchema,
  templateParams: z.array(z.string()).optional(),
});

const analyticsSummarySchema = z.object({
  total: z.number().default(0),
  sent: z.number().default(0),
  delivered: z.number().default(0),
  read: z.number().default(0),
  clicked: z.number().default(0),
  failed: z.number().default(0),
});

const paginationSchema = z.object({
  page: z.number(),
  limit: z.number(),
  totalCount: z.number(),
  totalPages: z.number(),
  hasNextPage: z.boolean(),
  hasPrevPage: z.boolean(),
});

export const apiCampaignSchema = z.object({
  _id: z.string(),
  name: z.string(),
  project: z.string(),
  adminId: z.string().optional(),
  messageTemplate: messageTemplateSchema,
  analyticsSummary: analyticsSummarySchema.optional(),
  sampleJSON: sampleJSONSchema.optional(),
  isActive: z.boolean().optional(),
  isDeleted: z.boolean().optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

export const apiCampaignsListResponseSchema = z.object({
  campaigns: z.array(apiCampaignSchema),
  pagination: paginationSchema,
});

export const createApiCampaignPayloadSchema = z.object({
  name: z
    .string()
    .min(1, { message: 'Campaign name is required' })
    .max(100, { message: 'Campaign name must be under 100 characters' }),
  projectId: z.string().min(1, { message: 'Project ID is required' }),
  messageTemplate: z.object({
    templateName: z.string().min(1, { message: 'Template selection is required' }),
    bodyVariables: z.array(z.string()).optional(),
    headerMediaAssetId: z.string().nullable().optional(),
  }),
});

export const executeApiCampaignPayloadSchema = z.object({
  campaignName: z.string().min(1),
  destination: z.string().min(1),
  media: z.object({
    url: z.string().url(),
    filename: z.string(),
  }),
  templateParams: z.array(z.string()).optional(),
});

export type ApiCampaign = z.infer<typeof apiCampaignSchema>;
export type ApiCampaignsListResponse = z.infer<typeof apiCampaignsListResponseSchema>;
export type CreateApiCampaignPayload = z.infer<typeof createApiCampaignPayloadSchema>;
export type ExecuteApiCampaignPayload = z.infer<typeof executeApiCampaignPayloadSchema>;

