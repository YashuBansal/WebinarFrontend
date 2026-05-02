import { z } from "zod";

// Schema for the exchange code request
export const exchangeCodeRequestSchema = z.object({
  code: z.string().min(1, "Authorization code is required"),
});

// Schema for the exchange code response
// export const exchangeCodeResponseSchema = z.object({
//   statusCode: z.number(),
//   message: z.string(),
//   data: z.object({
//     _id: z.string(),
//     wabaId: z.string(),
//     accessToken: z.string(),
//     phoneNumberId: z.string().optional(),
//     phone: z.string().optional(),
//     createdAt: z.string(),
//     updatedAt: z.string(),
//   }),
// });

// Schema for the API response wrapper
export const exchangeCodeApiResponseSchema = z.object({
  statusCode: z.number(),
  message: z.string(),
  data: z.any(), // The actual WABA connection data
});

// Infer types from schemas
export type ExchangeCodeRequest = z.infer<typeof exchangeCodeRequestSchema>;
// export type EmbeddedSignupResponse = z.infer<typeof exchangeCodeResponseSchema>;
export type ExchangeCodeApiResponse = z.infer<typeof exchangeCodeApiResponseSchema>;
