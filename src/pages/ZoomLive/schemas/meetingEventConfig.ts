import { z } from 'zod';

// Meeting Event Configuration Schema for Non-Attendee Nudge (minimum 1 minute delay)
export const nonAttendeeNudgeConfigSchema = z.object({
  enabled: z.boolean(),
  delayInMinutes: z.number().min(1).max(60), // Minimum 1 minute delay for Non-Attendee Nudge
  configuredTemplateId: z.string().optional(),
});

// Meeting Event Configuration Schema
export const meetingEventConfigSchema = z.object({
  enabled: z.boolean(),
  delayInMinutes: z.number().min(0).max(60),
  configuredTemplateId: z.string().optional(),
});

// Create Meeting Event Configuration Schema
export const createMeetingEventConfigSchema = z.object({
  meetingId: z.string(),
  occurrenceId: z.string().optional(),
  whatsappProjectId: z.string(),
  zoomProjectId: z.string(),
  meetingStarted: meetingEventConfigSchema,
  nonAttendeeNudge: nonAttendeeNudgeConfigSchema,
  participantLeft: meetingEventConfigSchema,
  meetingEndedAttendees: meetingEventConfigSchema,
  meetingEndedNonAttendees: meetingEventConfigSchema,
});

// Update Meeting Event Configuration Schema
export const updateMeetingEventConfigSchema = z.object({
  occurrenceId: z.string().optional(),
  whatsappProjectId: z.string().optional(),
  zoomProjectId: z.string().optional(),
  meetingStarted: meetingEventConfigSchema.optional(),
  nonAttendeeNudge: nonAttendeeNudgeConfigSchema.optional(),
  participantLeft: meetingEventConfigSchema.optional(),
  meetingEndedAttendees: meetingEventConfigSchema.optional(),
  meetingEndedNonAttendees: meetingEventConfigSchema.optional(),
});

// Meeting Event Configuration Response Schema
export const meetingEventConfigResponseSchema = z.object({
  _id: z.string(),
  meetingId: z.string(),
  occurrenceId: z.string().optional(),
  whatsappProjectId: z.string(),
  zoomProjectId: z.string(),
  meetingStarted: meetingEventConfigSchema,
  nonAttendeeNudge: nonAttendeeNudgeConfigSchema,
  participantLeft: meetingEventConfigSchema,
  meetingEndedAttendees: meetingEventConfigSchema,
  meetingEndedNonAttendees: meetingEventConfigSchema,
  createdAt: z.string(),
  updatedAt: z.string(),
});

// Project Schema
export const projectSchema = z.object({
  _id: z.string(),
  projectName: z.string(),
  adminId: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

// Configured Template Schema
export const configuredTemplateSchema = z.object({
  _id: z.string(),
  templateName: z.string(),
  configuredTemplateName: z.string(),
  variableMappings: z.array(z.any()),
  headerMediaAssetId: z.string().optional(),
  isActive: z.boolean(),
  isDeleted: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

// API Response Schemas
export const meetingEventConfigApiResponseSchema = z.object({
  statusCode: z.number(),
  message: z.string(),
  data: meetingEventConfigResponseSchema.nullable(),
});

// Projects API returns array directly, not wrapped in data
export const projectsApiResponseSchema = z.array(projectSchema);

export const configuredTemplatesApiResponseSchema = z.object({
  statusCode: z.number(),
  message: z.string(),
  data: z.object({
    data: z.array(configuredTemplateSchema),
    pagination: z.object({
      page: z.number(),
      limit: z.number(),
      total: z.number(),
      pages: z.number(),
    }),
  }),
});

// Type exports
export type MeetingEventConfig = z.infer<typeof meetingEventConfigSchema>;
export type CreateMeetingEventConfigPayload = z.infer<typeof createMeetingEventConfigSchema>;
export type UpdateMeetingEventConfigPayload = z.infer<typeof updateMeetingEventConfigSchema>;
export type MeetingEventConfigResponse = z.infer<typeof meetingEventConfigResponseSchema>;
export type Project = z.infer<typeof projectSchema>;
export type ConfiguredTemplate = z.infer<typeof configuredTemplateSchema>;
export type MeetingEventConfigApiResponse = z.infer<typeof meetingEventConfigApiResponseSchema>;
export type ConfiguredTemplatesApiResponse = z.infer<typeof configuredTemplatesApiResponseSchema>;
