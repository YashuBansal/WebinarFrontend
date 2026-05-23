import { z } from 'zod'

// Zoom Project schema based on backend ZoomProject model
export const ZoomProjectSchema = z.object({
  _id: z.string(),
  adminId: z.string(),
  projectName: z.string(),
  accountId: z.string().optional(),
  accessToken: z.string().optional(),
  refreshToken: z.string().optional(),
  accessTokenExpiresAt: z.string().optional(),
  isConfigured: z.boolean(),
  /** General Marketplace OAuth flow; legacy / reconfigure UX when not strictly `true`. */
  usesMarketplaceGeneralApp: z.boolean().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
})

export type ZoomProject = z.infer<typeof ZoomProjectSchema>


