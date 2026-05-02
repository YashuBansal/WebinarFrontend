import { z } from 'zod';

/**
 * Zod schema for campaign creation workflow
 */

// Step 1: Campaign Setup
export const campaignSetupSchema = z.object({
  name: z.string()
    .min(1, { message: "Campaign name is required." })
    .max(100, { message: "Campaign name must be less than 100 characters." }),
});

// Step 2: Contact Selection
export const contactSelectionSchema = z.object({
  selectedContacts: z.array(z.string()).optional(),
});

// Step 3: Template Selection and Variable Mapping
export const templateSelectionSchema = z.object({
  templateName: z.string().min(1, { message: "Template is required." }),
  variableMappings: z.array(z.object({
    variable: z.string(),
    contactField: z.string(),
    isDynamic: z.boolean().optional(),
    staticValue: z.string().optional(),
    fallbackValue: z.string().optional(),
  })).optional(),
});

// Step 4: Preview and Send
const campaignSendBaseSchema = z.object({
  sendType: z.enum(['now', 'scheduled']),
  scheduledAt: z.string().nullable().optional(),
});

export const campaignSendSchema = campaignSendBaseSchema.refine((data) => {
  if (data.sendType === 'scheduled' && !data.scheduledAt) {
    return false;
  }
  return true;
}, {
  message: "Scheduled date and time are required when scheduling a campaign.",
  path: ["scheduledAt"],
});

// Complete campaign creation schema
export const createCampaignWorkflowSchema = z.object({
  // Step 1
  name: campaignSetupSchema.shape.name,
  projectId: z.string().min(1, { message: "Project ID is required." }),
  
  // Step 2
  selectedContacts: contactSelectionSchema.shape.selectedContacts,
  
  // Step 3
  templateName: templateSelectionSchema.shape.templateName,
  variableMappings: templateSelectionSchema.shape.variableMappings,
  
  // Step 4
  sendType: campaignSendBaseSchema.shape.sendType,
  scheduledAt: campaignSendBaseSchema.shape.scheduledAt,
});

// Campaign response schema
export const campaignResponseSchema = z.object({
  _id: z.string(),
  name: z.string(),
  status: z.enum(['draft', 'in-progress', 'completed', 'failed']),
  messageTemplate: z.object({
    templateName: z.string(),
    body: z.string(),
  }),
  analyticsSummary: z.object({
    total: z.number(),
    sent: z.number(),
    delivered: z.number(),
    read: z.number(),
    clicked: z.number(),
    failed: z.number(),
  }),
  scheduledAt: z.string().nullable().optional(),
  completedAt: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
  isDeleted: z.boolean().optional(),
});

// Campaign list response schema
export const campaignsListResponseSchema = z.object({
  campaigns: z.array(campaignResponseSchema),
  pagination: z.object({
    page: z.number(),
    limit: z.number(),
    totalCount: z.number(),
    totalPages: z.number(),
    hasNextPage: z.boolean(),
    hasPrevPage: z.boolean(),
  }),
});

// Contact selection schema for campaign
export const campaignContactSchema = z.object({
  _id: z.string(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  phone: z.string(),
  email: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

const wlhConditionSchema = z.object({
  mode: z.enum(["include", "exclude"]),
  // Align available fields with WLHContacts filter UI
  field: z.enum([
    "email",
    "firstName",
    "lastName",
    "phone",
    "timeInSession",
    "gender",
    "location",
    "profession",
    "assignedTo",
    "status",
    "source",
    "tags",
    "registeredCount",
    "attendedCount",
  ]),
  // Align operators with WLHContacts operator config and advance filters
  operator: z.enum([
    "equals",
    "contains",
    "starts_with",
    "ends_with",
    "greater_than_or_equal",
    "less_than_or_equal",
  ]),
  value: z.array(z.string()),
  logicOperator: z.enum(["AND", "OR"]).default("AND"),
  // Match advance-filters fieldType, including mongodb_id
  fieldType: z.enum(["string", "number", "boolean", "date", "mongodb_id"]),
  isMultiple: z.boolean().default(false),
});

const wlhFiltersSchema = z.object({
  webinarIds: z.array(z.string()),
  conditions: z.array(wlhConditionSchema),
});

export const wlhAttendeeFilterSelectionSchema = z.object({
  filters: wlhFiltersSchema,
  contactCount: z.number(),
  isAttended: z.boolean().nullable(),
});

// Template schema for campaign
export const campaignTemplateSchema = z.object({
  id: z.string(),
  name: z.string(),
  category: z.string(),
  language: z.string(),
  status: z.string(),
  components: z.array(z.object({
    type: z.string(),
    text: z.string().optional(),
    buttons: z.array(z.object({
      type: z.string(),
      text: z.string(),
    })).optional(),
    example: z.object({
      body_text: z.array(z.array(z.string())).optional(),
    }).optional(),
  })),
});

// Variable mapping schema
export const variableMappingSchema = z.object({
  variable: z.string(), // e.g., "{{1}}", "{{name}}"
  contactField: z.string(), // e.g., "firstName", "lastName"
  isDynamic: z.boolean().optional(), // Whether to use contact field or static value
  staticValue: z.string().optional(), // Static value when not using contact field
  fallbackValue: z.string().optional(), // Fallback value when contact field is empty
});

// Campaign creation payload schema
export const createCampaignPayloadSchema = z.object({
  name: z.string().min(1).max(100),
  projectId: z.string().min(1),
  selectedContacts: z.array(z.object({
    contactId: z.string(),
    phoneNumber: z.string(),
  })),
  templateName: z.string().min(1),
  variableMappings: z.array(variableMappingSchema).optional(),
  sendType: z.enum(['now', 'scheduled']),
  scheduledAt: z.string().nullable().optional(),
  headerMediaAssetId: z.string().optional(),
  contactType: z.enum(['whatsapp', 'wlh']).optional(),
  wlhAttendeeFilters: wlhAttendeeFilterSelectionSchema.optional(),
});

// Campaign preview response schema
export const campaignPreviewResponseSchema = z.object({
  campaign: campaignResponseSchema,
  sampleMessage: z.string(),
  totalRecipients: z.number(),
});

// TypeScript types inferred from Zod schemas
export type CampaignSetupData = z.infer<typeof campaignSetupSchema>;
export type ContactSelectionData = z.infer<typeof contactSelectionSchema>;
export type TemplateSelectionData = z.infer<typeof templateSelectionSchema>;
export type CampaignSendData = z.infer<typeof campaignSendSchema>;
export type CreateCampaignWorkflowData = z.infer<typeof createCampaignWorkflowSchema>;
export type Campaign = z.infer<typeof campaignResponseSchema>;
export type CampaignsListResponse = z.infer<typeof campaignsListResponseSchema>;
export type CampaignContact = z.infer<typeof campaignContactSchema>;
export type CampaignTemplate = z.infer<typeof campaignTemplateSchema>;
export type VariableMapping = z.infer<typeof variableMappingSchema>;
export type CreateCampaignPayload = z.infer<typeof createCampaignPayloadSchema>;
export type CampaignPreviewResponse = z.infer<typeof campaignPreviewResponseSchema>;
export type WlhFilterCondition = z.infer<typeof wlhConditionSchema>;
export type WlhFiltersSelection = z.infer<typeof wlhFiltersSchema>;
export type WlhAttendeeFilterSelection = z.infer<typeof wlhAttendeeFilterSelectionSchema>;
export type WlhAttendeeFilterState = {
  filters: WlhFiltersSelection | null;
  contactCount: number;
  isAttended: boolean | null;
};
