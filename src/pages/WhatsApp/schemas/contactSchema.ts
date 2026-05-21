import { z } from 'zod';

/**
 * Zod schema for validating a single Contact object.
 * This ensures that the data received from the API conforms to the expected structure.
 */
export const contactSchema = z.object({
  _id: z.string(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  phone: z.string().min(1, { message: "Phone number cannot be empty." }),
  email: z.string().optional().or(z.literal('')),
  tags: z.array(z.string()).default([]),
  projectId: z.string(),
  adminId: z.string(),
  isActive: z.boolean().default(true),
  isDeleted: z.boolean().default(false),
  createdAt: z.string().datetime({ message: "Invalid createdAt date format." }),
  updatedAt: z.string().datetime({ message: "Invalid updatedAt date format." }),
});

/**
 * Zod schema for validating the paginated API response for contacts with traditional pagination.
 */
export const paginatedContactsResponseSchema = z.object({
  contacts: z.array(contactSchema),
  pagination: z.object({
    page: z.number().int().positive(),
    limit: z.number().int().positive(),
    totalCount: z.number().int().nonnegative(),
    totalPages: z.number().int().nonnegative(),
    hasNextPage: z.boolean(),
    hasPrevPage: z.boolean(),
  }),
});

/**
 * Zod schema for validating the payload when creating a new contact.
 */
// Form input schema (what the form sends)
export const createContactFormSchema = z.object({
  firstName: z.string().max(100, { message: "First name must be less than 100 characters." }).optional(),
  lastName: z.string().max(100, { message: "Last name must be less than 100 characters." }).optional(),
  countryCode: z.string().min(1, { message: "Country code is required." }),
  phone: z.string()
    .min(1, { message: "Phone number must not be empty." })
    .regex(/^\d{10}$/, { message: "Phone number must be exactly 10 digits." }),
  email: z.string().email({ message: "Please provide a valid email address." }).max(255, { message: "Email must be less than 255 characters." }).optional().or(z.literal('')),
  tags: z.array(z.string()).optional(),
  projectId: z.string().min(1, { message: "Project ID is required." }),
});

// API payload schema (what gets sent to the API)
export const createContactPayloadSchema = z.object({
  firstName: z.string().max(100, { message: "First name must be less than 100 characters." }).optional(),
  lastName: z.string().max(100, { message: "Last name must be less than 100 characters." }).optional(),
  phone: z.string().min(1, { message: "Phone number must not be empty." }).max(20, { message: "Phone number must be less than 20 characters." }),
  email: z.string().email({ message: "Please provide a valid email address." }).max(255, { message: "Email must be less than 255 characters." }).optional().or(z.literal('')),
  tags: z.array(z.string()).max(10, { message: "Maximum 10 tags allowed." }).optional(),
  projectId: z.string().min(1, { message: "Project ID is required." }),
});

/**
 * Zod schema for validating the payload when updating a contact.
 * All fields are made optional.
 */
export const updateContactPayloadSchema = z.object({
  firstName: z.string().min(1, { message: "First name must not be empty." }).max(100, { message: "First name must be less than 100 characters." }).optional(),
  lastName: z.string().max(100, { message: "Last name must be less than 100 characters." }).optional(),
  phone: z.string().min(1, { message: "Phone number must not be empty." }).max(20, { message: "Phone number must be less than 20 characters." }).optional(),
  email: z.string().email({ message: "Please provide a valid email address." }).max(255, { message: "Email must be less than 255 characters." }).optional(),
  tags: z.array(z.string()).max(10, { message: "Maximum 10 tags allowed." }).optional(),
  isActive: z.boolean().optional(),
});

/**
 * Zod schema for validating bulk contact creation payload.
 */
export const bulkCreateContactsPayloadSchema = z.object({
  contacts: z.array(createContactPayloadSchema).min(1, { message: "At least one contact is required." }),
  defaultCountryCode: z.string().optional(),
  replaceTags: z.boolean().optional(),
  sourceType: z.enum(['csv', 'xlsx', 'unknown']).optional(),
  fileName: z.string().optional(),
  totalRows: z.number().int().nonnegative().optional(),
  clientInvalidRows: z.number().int().nonnegative().optional(),
  clientInvalidRecordsSample: z.array(
    z.object({
      rowNumber: z.number().int().positive(),
      phoneRaw: z.string().optional(),
      reason: z.string(),
      sourceRow: z.record(z.string(), z.unknown()).optional(),
    }),
  ).max(100).optional(),
});

/**
 * Zod schema for validating contact filters.
 */
export const contactFiltersSchema = z.object({
  search: z.string().optional(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  email: z.string().optional(),
  phone: z.string().optional(),
  tags: z.array(z.string()).optional(),
  tagFilterMode: z.enum(['has_any', 'not_has_any']).optional(),
  isActive: z.boolean().optional(),
  projectId: z.string().optional(),
});

/**
 * Zod schema for validating contact statistics response.
 */
export const contactStatsSchema = z.object({
  totalContacts: z.number().int().nonnegative(),
  activeContacts: z.number().int().nonnegative(),
  inactiveContacts: z.number().int().nonnegative(),
  contactsByProject: z.array(z.object({
    projectName: z.string(),
    count: z.number().int().nonnegative(),
  })),
});

/**
 * Zod schema for validating bulk create response.
 */
export const bulkCreateContactsResponseSchema = z.object({
  created: z.array(contactSchema).optional(),
  updated: z.array(contactSchema).optional(),
  failed: z.array(z.object({
    contact: createContactPayloadSchema,
    error: z.string(),
  })).optional(),
  skipped: z.array(z.object({
    contact: createContactPayloadSchema,
    error: z.string(),
  })).optional(),
  importHistoryId: z.string().optional(),
  jobId: z.union([z.string(), z.number()]).optional(),
  status: z.enum(['queued', 'processing', 'success', 'failed', 'partial_success']).optional(),
  message: z.string().optional(),
  summary: z.object({
    totalRows: z.number().int().nonnegative(),
    validRows: z.number().int().nonnegative(),
    invalidRows: z.number().int().nonnegative(),
    duplicates: z.number().int().nonnegative(),
    newCount: z.number().int().nonnegative(),
    updatedCount: z.number().int().nonnegative(),
    failedCount: z.number().int().nonnegative(),
    status: z.enum(['queued', 'processing', 'success', 'failed', 'partial_success']),
    failureReason: z.string().optional(),
  }).optional(),
});

export const importHistoryItemSchema = z.object({
  _id: z.string(),
  adminId: z.string(),
  projectId: z.string(),
  sourceType: z.enum(['csv', 'xlsx', 'unknown']),
  fileName: z.string().optional().default(''),
  status: z.enum(['queued', 'processing', 'success', 'failed', 'partial_success']),
  totalRows: z.number().int().nonnegative(),
  processedRows: z.number().int().nonnegative().optional(),
  validRows: z.number().int().nonnegative(),
  invalidRows: z.number().int().nonnegative(),
  duplicates: z.number().int().nonnegative(),
  newCount: z.number().int().nonnegative(),
  updatedCount: z.number().int().nonnegative(),
  failedCount: z.number().int().nonnegative(),
  failureReason: z.string().optional().default(''),
  queueJobId: z.string().optional().default(''),
  invalidRecordsSample: z.array(z.object({
    rowNumber: z.number().int().positive(),
    phoneRaw: z.string().optional(),
    reason: z.string(),
    sourceRow: z.record(z.string(), z.unknown()).optional().nullable(),
  })).optional().default([]),
  startedAt: z.string().datetime().optional(),
  completedAt: z.string().datetime().nullable().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const importHistoryListResponseSchema = z.object({
  imports: z.array(importHistoryItemSchema),
  pagination: z.object({
    page: z.number().int().positive(),
    limit: z.number().int().positive(),
    totalCount: z.number().int().nonnegative(),
    totalPages: z.number().int().nonnegative(),
    hasNextPage: z.boolean(),
    hasPrevPage: z.boolean(),
  }),
});

export const importHistoryDetailResponseSchema = importHistoryItemSchema;

/**
 * Zod schema for validating bulk delete payload.
 */
export const bulkDeleteContactsPayloadSchema = z.object({
  contactIds: z.array(z.string()).min(1, { message: "At least one contact ID is required." }),
});

export const bulkUpdateContactTagsPayloadSchema = z.object({
  contactIds: z.array(z.string()).min(1, { message: "At least one contact ID is required." }),
  projectId: z.string().min(1, { message: "Project ID is required." }),
  tags: z.array(z.string()).min(1, { message: "At least one tag is required." }).max(10, { message: "Maximum 10 tags allowed." }),
  operation: z.enum(['add', 'remove']),
});

/**
 * Zod schema for validating bulk delete response.
 */
export const bulkDeleteContactsResponseSchema = z.object({
  deleted: z.array(contactSchema),
  failed: z.array(z.object({
    contactId: z.string(),
    error: z.string(),
  })),
});

export const bulkUpdateContactTagsResponseSchema = z.object({
  matchedCount: z.number().int().nonnegative(),
  modifiedCount: z.number().int().nonnegative(),
});

// TypeScript types inferred from Zod schemas
export type Contact = z.infer<typeof contactSchema>;
export type PaginatedContactsResponse = z.infer<typeof paginatedContactsResponseSchema>;
export type CreateContactFormData = z.infer<typeof createContactFormSchema>;
export type CreateContactPayload = z.infer<typeof createContactPayloadSchema>;
export type UpdateContactPayload = z.infer<typeof updateContactPayloadSchema>;
export type BulkCreateContactsPayload = z.infer<typeof bulkCreateContactsPayloadSchema>;
export type ContactFilters = z.infer<typeof contactFiltersSchema>;
export type ContactStats = z.infer<typeof contactStatsSchema>;
export type BulkCreateContactsResponse = z.infer<typeof bulkCreateContactsResponseSchema>;
export type ImportHistoryItem = z.infer<typeof importHistoryItemSchema>;
export type ImportHistoryListResponse = z.infer<typeof importHistoryListResponseSchema>;
export type ImportHistoryDetailResponse = z.infer<typeof importHistoryDetailResponseSchema>;
export type BulkDeleteContactsPayload = z.infer<typeof bulkDeleteContactsPayloadSchema>;
export type BulkDeleteContactsResponse = z.infer<typeof bulkDeleteContactsResponseSchema>;
export type BulkUpdateContactTagsPayload = z.infer<typeof bulkUpdateContactTagsPayloadSchema>;
export type BulkUpdateContactTagsResponse = z.infer<typeof bulkUpdateContactTagsResponseSchema>;
