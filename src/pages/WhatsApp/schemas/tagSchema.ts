import { z } from 'zod';

/**
 * Zod schema for validating a single WabaTag object.
 * This ensures that the data received from the API conforms to the expected structure.
 */
export const wabaTagSchema = z.object({
  _id: z.string(),
  name: z.string().min(1, { message: "Tag name cannot be empty." }),
  projectId: z.string(),
  adminId: z.string(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

/**
 * Zod schema for validating the API response for waba tags list.
 */
export const wabaTagsResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  data: z.array(wabaTagSchema),
});

/**
 * Zod schema for validating the API response for a single waba tag.
 */
export const wabaTagResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  data: wabaTagSchema,
});

/**
 * Zod schema for validating the form input (without projectId).
 */
export const createWabaTagFormSchema = z.object({
  name: z.string().min(1, { message: "Tag name must not be empty." }).max(100, { message: "Tag name must be less than 100 characters." }),
});

/**
 * Zod schema for validating the payload when creating a new waba tag.
 */
export const createWabaTagPayloadSchema = z.object({
  name: z.string().min(1, { message: "Tag name must not be empty." }).max(100, { message: "Tag name must be less than 100 characters." }),
  projectId: z.string().min(1, { message: "Project ID is required." }),
});

/**
 * Zod schema for validating the payload when updating a waba tag.
 * All fields are made optional.
 */
export const updateWabaTagPayloadSchema = z.object({
  name: z.string().min(1, { message: "Tag name must not be empty." }).max(100, { message: "Tag name must be less than 100 characters." }).optional(),
});

/**
 * Zod schema for validating waba tag filters.
 */
export const wabaTagFiltersSchema = z.object({
  search: z.string().optional(),
  projectId: z.string().optional(),
});

// TypeScript types inferred from Zod schemas
export type WabaTag = z.infer<typeof wabaTagSchema>;
export type WabaTagsResponse = z.infer<typeof wabaTagsResponseSchema>;
export type WabaTagResponse = z.infer<typeof wabaTagResponseSchema>;
export type CreateWabaTagFormData = z.infer<typeof createWabaTagFormSchema>;
export type CreateWabaTagPayload = z.infer<typeof createWabaTagPayloadSchema>;
export type UpdateWabaTagPayload = z.infer<typeof updateWabaTagPayloadSchema>;
export type WabaTagFilters = z.infer<typeof wabaTagFiltersSchema>;








export const WLHTag = z.object({
  _id: z.string(),
  name: z.string(),
});

export const wlhTagsResponseSchema = z.object({
  message: z.string(),
  data: z.array(WLHTag),
  success: z.boolean(),
});

export type WLHTag = z.infer<typeof WLHTag>;
export type WLHTagsResponse = z.infer<typeof wlhTagsResponseSchema>;
