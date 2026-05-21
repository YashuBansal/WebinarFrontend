import { z } from "zod";

// Template Categories
export const templateCategorySchema = z.enum(['UTILITY', 'MARKETING', 'AUTHENTICATION']);

// Component Types
export const componentTypeSchema = z.enum(['HEADER', 'BODY', 'FOOTER', 'BUTTONS']);

// Header Format Types
export const headerFormatSchema = z.enum(['TEXT', 'IMAGE', 'VIDEO', 'DOCUMENT', 'LOCATION']);

// Button Types
export const buttonTypeSchema = z.enum([
  'QUICK_REPLY', 
  'URL', 
  'PHONE_NUMBER', 
  'OTP', 
  'MPM', 
  'CATALOG', 
  'FLOW', 
  'VOICE_CALL', 
  'APP'
]);

// Parameter Format Types
export const parameterFormatSchema = z.enum(['POSITIONAL', 'NAMED']);

// Button Schema
export const buttonSchema = z.object({
  type: buttonTypeSchema,
  text: z.string().min(1).max(25, 'Button text must not exceed 25 characters'),
  url: z.string().optional(),
  phone_number: z.string().optional(),
});

// Example Schema
export const exampleSchema = z.object({
  header_text: z.array(z.string()).optional(),
  body_text: z.array(z.array(z.string())).optional(),
});

// Component Schema
export const componentSchema = z.object({
  type: componentTypeSchema,
  format: headerFormatSchema.optional(),
  text: z.string().max(1024, 'Component text must not exceed 1024 characters').optional(),
  buttons: z.array(buttonSchema).min(1).max(3, 'Maximum 3 buttons allowed').optional(),
  example: exampleSchema.optional(),
});

// Create Template Schema
export const createTemplateSchema = z.object({
  name: z.string().min(1).max(512, 'Template name must not exceed 512 characters'),
  category: templateCategorySchema,
  parameter_format: parameterFormatSchema.optional(),
  language: z.string().min(1, 'Language is required'),
  components: z.array(componentSchema).min(1, 'At least one component is required'),
  library_template_name: z.string().optional(),
  library_template_button_inputs: z.any().optional(),
});

// Update Template Schema
export const updateTemplateSchema = z.object({
  category: templateCategorySchema.optional(),
  components: z.array(componentSchema).optional(),
});

// Quality Score Schema
export const qualityScoreSchema = z.object({
  score: z.string(),
  date: z.number(),
});

// Template Response Schema
export const templateResponseSchema = z.object({
  id: z.string(),
  status: z.enum(['APPROVED', 'PENDING', 'REJECTED', 'PAUSED', 'DISABLED']),
  category: templateCategorySchema,
  name: z.string(),
  language: z.string(),
  components: z.array(componentSchema),
  quality_score: qualityScoreSchema.optional(),
  rejected_reason: z.string().optional(),
  created_time: z.string().optional(),
  modified_time: z.string().optional(),
  last_synced_at: z.string().optional().nullable(),
});

// Get Templates Query Schema
export const getTemplatesQuerySchema = z.object({
  fields: z.string().optional(),
  status: z.string().optional(),
  category: z.string().optional(),
  language: z.string().optional(),
  limit: z.string().optional(),
});

// Delete Template Schema
export const deleteTemplateSchema = z.object({
  name: z.string().optional(),
  hsm_id: z.string().optional(),
});

// Frontend Form Schema (simplified for the UI)
export const templateFormSchema = z.object({
  category: templateCategorySchema,
  language: z.string().min(1, 'Language is required'),
  name: z.string()
    .min(1, 'Template name is required')
    .max(512, 'Template name must not exceed 512 characters')
    .regex(/^[a-z0-9_]+$/, 'Name can only contain lowercase letters, numbers, and underscores'),
  headerFormat: z.string().min(1, 'Template type is required'),
  format: z.string().min(1, 'Message content is required').max(1024, 'Message content must not exceed 1024 characters'),
  header: z.string().max(60, 'Header must not exceed 60 characters').optional(),
  headerHandle: z.string().optional(), // For media templates (IMAGE, VIDEO, DOCUMENT)
  footer: z.string().max(60, 'Footer must not exceed 60 characters').optional(),
  interactiveType: z.enum(['none', 'call_to_actions', 'quick_replies', 'all']),
  interactiveActions: z.array(z.object({
    id: z.string(),
    type: z.enum(['QUICK_REPLY', 'URL', 'PHONE_NUMBER', 'OTP']),
    title: z.string().max(25, 'Button title must not exceed 25 characters').optional(),
    value: z.string().optional(),
    otp_type: z.enum(['ZERO_TAP', 'COPY_CODE']).optional(),
  })).optional(),
});

// API Response Schemas
export const templatesResponseSchema = z.object({
  statusCode: z.number(),
  message: z.string(),
  data: z.array(templateResponseSchema),
});

export const templateResponseSingleSchema = z.object({
  statusCode: z.number(),
  message: z.string(),
  data: templateResponseSchema,
});

export const templateCreateResponseSchema = z.object({
  statusCode: z.number(),
  message: z.string(),
});

export const templateUpdateResponseSchema = z.object({
  statusCode: z.number(),
  message: z.string(),
  data: z.object({
    success: z.boolean(),
  }),
});

export const templateDeleteResponseSchema = z.object({
  statusCode: z.number(),
  message: z.string(),
  data: z.object({
    success: z.boolean(),
  }),
});

// Infer types from schemas
export type TemplateCategory = z.infer<typeof templateCategorySchema>;
export type ComponentType = z.infer<typeof componentTypeSchema>;
export type HeaderFormat = z.infer<typeof headerFormatSchema>;
export type ButtonType = z.infer<typeof buttonTypeSchema>;
export type ParameterFormat = z.infer<typeof parameterFormatSchema>;
export type Button = z.infer<typeof buttonSchema>;
export type Example = z.infer<typeof exampleSchema>;
export type Component = z.infer<typeof componentSchema>;
export type CreateTemplatePayload = z.infer<typeof createTemplateSchema>;
export type UpdateTemplatePayload = z.infer<typeof updateTemplateSchema>;
export type TemplateResponse = z.infer<typeof templateResponseSchema>;
export type QualityScore = z.infer<typeof qualityScoreSchema>;
export type GetTemplatesQuery = z.infer<typeof getTemplatesQuerySchema>;
export type DeleteTemplatePayload = z.infer<typeof deleteTemplateSchema>;
export type TemplateFormData = z.infer<typeof templateFormSchema>;

// WABA Details Schemas
export const wabaDetailsResponseSchema = z.object({
  statusCode: z.number(),
  message: z.string(),
  data: z.object({
    _id: z.string(),
    adminId: z.string(),
    projectName: z.string(),
    phone: z.string().optional(),
    appId: z.string().optional(),
    appSecret: z.string().optional(),
    wabaId: z.string().optional(),
    phoneNumberId: z.string().optional(),
    permanentAccessToken: z.string().optional(),
    createdAt: z.string(),
    updatedAt: z.string(),
  }),
});

// Send Template Message Schemas
export const sendTemplateMessagePayloadSchema = z.object({
  projectId: z.string(),
  recipientPhoneNumber: z.string().min(1, "Recipient phone number is required"),
  templateName: z.string().min(1, "Template name is required"),
  language: z.string().optional(), // Defaults to template's language
  bodyVariables: z.array(z.string()).optional(),
  headerMediaAssetId: z.string().optional(), // ID of the media asset to use for header
});

export const sendTemplateMessageResponseSchema = z.object({
  statusCode: z.number(),
  message: z.string(),
  data: z.object({
    messaging_product: z.string(),
    contacts: z.array(z.object({
      input: z.string(),
      wa_id: z.string(),
    })),
    messages: z.array(z.object({
      id: z.string(),
    })),
  }),
});

// Bulk Send Template Message Schemas
import { variableMappingSchema } from './campaignSchema';

export const sendBulkTemplateMessagePayloadSchema = z.object({
  projectId: z.string(),
  contacts: z.array(z.object({
    contactId: z.string(),
    phoneNumber: z.string().min(1, "Phone number is required"),
  })).min(1, "At least one contact is required"),
  templateName: z.string().min(1, "Template name is required"),
  language: z.string().optional(), // Defaults to template's language
  variableMappings: z.array(variableMappingSchema).optional(), // Variable mappings for template variables
  headerMediaAssetId: z.string().optional(), // ID of the media asset to use for header
});

export const sendBulkTemplateMessageResponseSchema = z.object({
  statusCode: z.number(),
  message: z.string(),
  data: z.object({
    sent: z.number(),
    failed: z.number(),
    totalContacts: z.number(),
    errors: z.array(z.object({
      contactId: z.string(),
      phoneNumber: z.string(),
      error: z.any(),
    })),
    messageIds: z.array(z.string()),
  }),
});

// Exchange Code Schemas
export const exchangeCodePayloadSchema = z.object({
  code: z.string().min(1, "Authorization code is required"),
});

export const exchangeCodeResponseSchema = z.object({
  statusCode: z.number(),
  message: z.string(),
  data: z.object({
    _id: z.string(),
    adminId: z.string(),
    projectName: z.string(),
    wabaId: z.string(),
    phoneNumberId: z.string(),
    permanentAccessToken: z.string(),
    createdAt: z.string(),
    updatedAt: z.string(),
  }),
});

// API Response Types
export type TemplatesResponse = z.infer<typeof templatesResponseSchema>;
export type TemplateResponseSingle = z.infer<typeof templateResponseSingleSchema>;
export type TemplateCreateResponse = z.infer<typeof templateCreateResponseSchema>;
export type TemplateUpdateResponse = z.infer<typeof templateUpdateResponseSchema>;
export type TemplateDeleteResponse = z.infer<typeof templateDeleteResponseSchema>;

// WABA Details Types
export type WabaDetailsResponse = z.infer<typeof wabaDetailsResponseSchema>;

// Send Template Message Types
export type SendTemplateMessagePayload = z.infer<typeof sendTemplateMessagePayloadSchema>;
export type SendTemplateMessageResponse = z.infer<typeof sendTemplateMessageResponseSchema>;

// Bulk Send Template Message Types
export type SendBulkTemplateMessagePayload = z.infer<typeof sendBulkTemplateMessagePayloadSchema>;
export type SendBulkTemplateMessageResponse = z.infer<typeof sendBulkTemplateMessageResponseSchema>;

// Exchange Code Types
export type ExchangeCodePayload = z.infer<typeof exchangeCodePayloadSchema>;
export type ExchangeCodeResponse = z.infer<typeof exchangeCodeResponseSchema>;
