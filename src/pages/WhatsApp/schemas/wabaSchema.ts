import { z } from "zod";

export const wabaPhoneNumberSchema = z.object({
  id: z.string(),
  display_phone_number: z.string(),
  quality_rating: z.string(),
});

export const wabaDetailsSchema = z.object({
  name: z.string(),
  message_template_namespace: z.string(),
  phone_numbers: z.object({
    data: z.array(wabaPhoneNumberSchema),
  }),
});

export const fetchWabaDetailsSchema = z.object({
  wabaId: z.string().min(1, "WABA ID is required"),
  accessToken: z.string().min(1, "Access Token is required"),
});

// Infer types from schemas
export type WABAPhoneNumber = z.infer<typeof wabaPhoneNumberSchema>;
export type WABADetails = z.infer<typeof wabaDetailsSchema>;
export type FetchWabaDetailsPayload = z.infer<typeof fetchWabaDetailsSchema>;
