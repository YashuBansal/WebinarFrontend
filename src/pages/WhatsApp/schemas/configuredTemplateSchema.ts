import { z } from 'zod';

// Variable Mapping Schema
export const variableMappingSchema = z.object({
  variable: z.string().max(100),
  dynamicField: z.string().optional(),
  isDynamic: z.boolean(),
  fallbackValue: z.string().optional(),
  staticValue: z.string().optional(),
});

// Create Configured Template Schema
export const createConfiguredTemplateSchema = z.object({
  templateName: z.string().max(100),
  configuredTemplateName: z.string().max(100),
  variableMappings: z.array(variableMappingSchema),
  headerMediaAssetId: z.string().optional(),
  isActive: z.boolean().optional(),
});

// Update Configured Template Schema
export const updateConfiguredTemplateSchema = z.object({
  configuredTemplateName: z.string().max(100).optional(),
  variableMappings: z.array(variableMappingSchema).optional(),
  headerMediaAssetId: z.string().optional(),
  isActive: z.boolean().optional(),
});

// Get Configured Templates Query Schema
export const getConfiguredTemplatesQuerySchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  search: z.string().optional(),
  isActive: z.boolean().optional(),
});

// Configured Template Response Schema
export const configuredTemplateResponseSchema = z.object({
  _id: z.string(),
  templateName: z.string(),
  configuredTemplateName: z.string(),
  variableMappings: z.array(variableMappingSchema),
  headerMediaAssetId: z.string().optional(),
  isActive: z.boolean(),
  isDeleted: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

// Configured Templates List Response Schema
export const configuredTemplatesListResponseSchema = z.object({
  data: z.array(configuredTemplateResponseSchema),
  pagination: z.object({
    page: z.number(),
    limit: z.number(),
    total: z.number(),
    pages: z.number(),
  }),
});

// API Response Schema
export const configuredTemplateApiResponseSchema = z.object({
  statusCode: z.number(),
  message: z.string(),
  data: configuredTemplateResponseSchema,
});

export const configuredTemplatesListApiResponseSchema = z.object({
  statusCode: z.number(),
  message: z.string(),
  data: configuredTemplatesListResponseSchema,
});

// Type exports
export type VariableMapping = z.infer<typeof variableMappingSchema>;
export type CreateConfiguredTemplatePayload = z.infer<typeof createConfiguredTemplateSchema>;
export type UpdateConfiguredTemplatePayload = z.infer<typeof updateConfiguredTemplateSchema>;
export type GetConfiguredTemplatesQuery = z.infer<typeof getConfiguredTemplatesQuerySchema>;
export type ConfiguredTemplateResponse = z.infer<typeof configuredTemplateResponseSchema>;
export type ConfiguredTemplatesListResponse = z.infer<typeof configuredTemplatesListResponseSchema>;
export type ConfiguredTemplateApiResponse = z.infer<typeof configuredTemplateApiResponseSchema>;
export type ConfiguredTemplatesListApiResponse = z.infer<typeof configuredTemplatesListApiResponseSchema>;
