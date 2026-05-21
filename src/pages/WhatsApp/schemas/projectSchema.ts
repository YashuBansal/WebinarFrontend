import { z } from 'zod';

/**
 * Zod schema for validating a single Project object.
 * This ensures that the data received from the API conforms to the expected structure.
 */
export const projectSchema = z.object({
  _id: z.string(),
  adminId: z.string(),
  projectName: z.string().min(1, { message: "Project name cannot be empty." }),
  phone: z.string().optional(),
  // WhatsApp Business fields (all optional)
  appId: z.string().optional(),
  appSecret: z.string().optional(),
  wabaId: z.string().optional(),
  phoneNumberId: z.string().optional(),
  permanentAccessToken: z.string().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

/**
 * Zod schema for validating the paginated API response for projects.
 * It uses the projectSchema to validate each item in the results array.
 */
export const paginatedProjectsResponseSchema = z.object({
  results: z.array(projectSchema),
  page: z.number().int().positive(),
  limit: z.number().int().positive(),
  totalPages: z.number().int().positive(),
  totalResults: z.number().int().nonnegative(),
});

/**
 * Zod schema for validating the payload when creating a new project.
 */
export const createProjectPayloadSchema = z.object({
    projectName: z.string().min(3, { message: "Project name must be at least 3 characters long." }),
    phone: z.string().optional(),
    // WhatsApp Business Account fields (all optional)
    appId: z.string().min(1, { message: "App ID must not be empty" }).optional(),
    appSecret: z.string().min(1, { message: "App Secret must not be empty" }).optional(),
    wabaId: z.string().min(1, { message: "WABA ID must not be empty" }).optional(),
    phoneNumberId: z.string().min(1, { message: "Phone Number ID must not be empty" }).optional(),
    permanentAccessToken: z.string().min(1, { message: "Access Token must not be empty" }).optional(),
});

/**
 * Zod schema for validating the payload when updating a project.
 * All fields are made optional.
 */
export const updateProjectPayloadSchema = z.object({
  projectName: z.string().min(3, { message: "Project name must be at least 3 characters long." }).optional(),
  phone: z.string().optional(),
  // WhatsApp Business Account fields (all optional)
  appId: z.string().optional(),
  appSecret: z.string().optional(),
  wabaId: z.string().optional(),
  phoneNumberId: z.string().optional(),
  permanentAccessToken: z.string().optional(),
});


// If you want to infer the TypeScript types directly from your Zod schemas
// (instead of writing them manually), you can do the following:
//
export type Project = z.infer<typeof projectSchema>;
export type PaginatedProjectsResponse = z.infer<typeof paginatedProjectsResponseSchema>;
export type CreateProjectPayload = z.infer<typeof createProjectPayloadSchema>;
export type UpdateProjectPayload = z.infer<typeof updateProjectPayloadSchema>;