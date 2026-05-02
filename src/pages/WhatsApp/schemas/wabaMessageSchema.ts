import { z } from 'zod';

// Status and message type enums
const MessageStatusSchema = z.enum(['pending', 'sent', 'delivered', 'read', 'failed', 'clicked']);
export const MessageTypeSchema = z.enum(['campaign', 'individual', 'template', 'auto-message', 'alarm', 'zoom-event', 'api-campaign', 'program']);

// Main WABA Message schema
export const WabaMessageSchema = z.object({
  _id: z.string(),
  wabaMessageId: z.string(),
  phoneNumber: z.string().optional(),
  status: MessageStatusSchema,
  messageType: MessageTypeSchema,
  templateName: z.string(),
  createdAt: z.string(),
  sentAt: z.string().optional(),
  deliveredAt: z.string().optional(),
  readAt: z.string().optional(),
  failureReason: z.string().optional(),
  projectId: z.string(), // Just the ID, not populated
  adminId: z.string(), // Just the ID, not populated
  campaignId: z.string().optional(), // Just the ID, not populated
  contactId: z.string().optional(), // Just the ID, not populated
});

// Response schema for paginated messages
export const MessageHistoryResponseSchema = z.object({
  wabaMessages: z.array(WabaMessageSchema),
  total: z.number(),
  totalPages: z.number(),
  page: z.number(),
  limit: z.number(),
});

// Type exports
export type WabaMessage = z.infer<typeof WabaMessageSchema>;
export type MessageHistoryResponse = z.infer<typeof MessageHistoryResponseSchema>;
export type MessageStatus = z.infer<typeof MessageStatusSchema>;
export type MessageType = z.infer<typeof MessageTypeSchema>;
