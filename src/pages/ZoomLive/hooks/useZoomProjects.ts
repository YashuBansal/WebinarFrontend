import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiGet, apiPost, apiDelete } from '@zoom/services/api'
import { z } from 'zod'
import { ApiResponseSchema } from '@zoom/schemas/zoom'
import { ZoomProjectSchema, type ZoomProject } from '@zoom/schemas/zoomProject'
import { toastUtils } from '@zoom/lib/utils'

// Query keys
export const zoomProjectsKeys = {
  all: ['zoom-projects'] as const,
  lists: () => [...zoomProjectsKeys.all, 'list'] as const,
  list: (page: number, limit: number, search?: string) => [...zoomProjectsKeys.lists(), { page, limit, search }] as const,
  details: () => [...zoomProjectsKeys.all, 'detail'] as const,
  detail: (id: string) => [...zoomProjectsKeys.details(), id] as const,
}

// Types
export interface CreateZoomProjectPayload {
  projectName: string
}

export interface ValidateAndCreateZoomProjectPayload {
  projectName: string
  accountId: string
  clientId: string
  clientSecret: string
  secretToken?: string
}

export interface ZoomProjectsResponse {
  projects: ZoomProject[]
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
  /** True if any project for this admin is not on general Marketplace OAuth (may be on another page). */
  hasAnyLegacyZoomProjects?: boolean
}

const zoomProjectApiPick = {
  _id: true,
  adminId: true,
  projectName: true,
  accountId: true,
  isConfigured: true,
  createdAt: true,
  updatedAt: true,
  usesMarketplaceGeneralApp: true,
} as const

const ZoomProjectsResponseSchema = ApiResponseSchema.extend({
  data: z.object({
    projects: z.array(ZoomProjectSchema.pick(zoomProjectApiPick)),
    pagination: z.object({
      page: z.union([z.number(), z.string()]).transform((v) => Number(v)),
      limit: z.union([z.number(), z.string()]).transform((v) => Number(v)),
      total: z.number(),
      pages: z.number(),
    }),
    hasAnyLegacyZoomProjects: z.boolean().optional(),
  }),
})

// API functions
export const zoomProjectsApi = {
  getProjects: async (page: number = 1, limit: number = 10, search?: string): Promise<ZoomProjectsResponse> => {
    const params: any = { page, limit }
    if (search) params.search = search
    const response = await apiGet<any>('/zoom/projects', params)
    const parsed = ZoomProjectsResponseSchema.parse(response)
    return parsed.data as ZoomProjectsResponse
  },

  getProject: async (id: string): Promise<ZoomProject> => {
    const response = await apiGet<any>(`/zoom/projects/${id}`)
    // Backend returns { statusCode, message, data }
    const singleSchema = ApiResponseSchema.extend({ data: ZoomProjectSchema.pick(zoomProjectApiPick) })
    const parsed = singleSchema.parse(response)
    return parsed.data as ZoomProject
  },

  createProject: async (payload: CreateZoomProjectPayload): Promise<ZoomProject> => {
    const response = await apiPost<any>('/zoom/projects', payload)
    const singleSchema = ApiResponseSchema.extend({ data: ZoomProjectSchema.pick(zoomProjectApiPick) })
    const parsed = singleSchema.parse(response)
    return parsed.data as ZoomProject
  },

  validateAndCreateProject: async (payload: ValidateAndCreateZoomProjectPayload): Promise<ZoomProject> => {
    const response = await apiPost<any>('/zoom/projects/validate-and-create', payload)
    const singleSchema = ApiResponseSchema.extend({ data: ZoomProjectSchema.pick(zoomProjectApiPick) })
    const parsed = singleSchema.parse(response)
    return parsed.data as ZoomProject
  },

  deleteProject: async (id: string): Promise<{ id: string }> => {
    const response = await apiDelete<any>(`/zoom/projects/${id}`)
    const deleteSchema = ApiResponseSchema.extend({ data: z.object({ id: z.string() }) })
    const parsed = deleteSchema.parse(response)
    return parsed.data as { id: string }
  },

  disconnectOAuthProject: async (id: string): Promise<ZoomProject> => {
    const response = await apiPost<any>(`/zoom/projects/${id}/disconnect-oauth`, {})
    const singleSchema = ApiResponseSchema.extend({
      data: ZoomProjectSchema.pick(zoomProjectApiPick),
    })
    const parsed = singleSchema.parse(response)
    return parsed.data as ZoomProject
  },

  updateProject: async (id: string, payload: Partial<CreateZoomProjectPayload>): Promise<ZoomProject> => {
    const response = await apiPost<any>(`/zoom/projects/${id}`, payload)
    const singleSchema = ApiResponseSchema.extend({
      data: ZoomProjectSchema.pick(zoomProjectApiPick),
    })
    const parsed = singleSchema.parse(response)
    return parsed.data as ZoomProject
  },
}

// Hooks
export function useZoomProjects(page: number = 1, limit: number = 10, search?: string) {
  return useQuery({
    queryKey: zoomProjectsKeys.list(page, limit, search),
    queryFn: () => zoomProjectsApi.getProjects(page, limit, search),
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
  })
}

export function useZoomProject(id: string | undefined) {
  return useQuery({
    queryKey: zoomProjectsKeys.detail(id!),
    queryFn: () => zoomProjectsApi.getProject(id!),
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
  })
}

export function useZoomProjectMutations() {
  const queryClient = useQueryClient()

  const useCreateZoomProject = () => {
    return useMutation({
      mutationFn: zoomProjectsApi.createProject,
      onSuccess: () => {
        console.log('Zoom project created successfully')
        queryClient.invalidateQueries({ queryKey: zoomProjectsKeys.lists() })
      },
      onError: (error) => {
        console.error('Zoom project creation failed:', error)
      },
    })
  }

  const useDeleteZoomProject = () => {
    return useMutation({
      mutationFn: zoomProjectsApi.deleteProject,
      onSuccess: (_, projectId) => {
        console.log('Zoom project deleted successfully')
        queryClient.invalidateQueries({ queryKey: zoomProjectsKeys.lists() })
        queryClient.removeQueries({ queryKey: zoomProjectsKeys.detail(projectId) })
      },
      onError: (error, projectId) => {
        console.error(`Failed to delete zoom project ${projectId}:`, error)
      },
    })
  }

  const useValidateAndCreateZoomProject = () => {
    return useMutation({
      mutationFn: zoomProjectsApi.validateAndCreateProject,
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: zoomProjectsKeys.lists() })
      },
      onError: (error: any) => {
        console.error('Zoom project validation and creation failed:', error)
        toastUtils.error(error, "Zoom project validation and creation failed")
      },
    })
  }

  const useDisconnectZoomOAuth = () => {
    return useMutation({
      mutationFn: zoomProjectsApi.disconnectOAuthProject,
      onSuccess: (_, id) => {
        queryClient.invalidateQueries({ queryKey: zoomProjectsKeys.detail(id) })
        queryClient.invalidateQueries({ queryKey: zoomProjectsKeys.lists() })
      },
      onError: (error: unknown) => {
        console.error('Zoom OAuth disconnect failed:', error)
        const msg =
          error instanceof Error ? error.message : 'Failed to disconnect Zoom'
        toastUtils.error(msg, 'Failed to disconnect Zoom')
      },
    })
  }

  const useUpdateZoomProject = () => {
    return useMutation({
      mutationFn: ({ projectId, payload }: { projectId: string; payload: Partial<CreateZoomProjectPayload> }) =>
        zoomProjectsApi.updateProject(projectId, payload),
      onSuccess: (_, { projectId }) => {
        queryClient.invalidateQueries({ queryKey: zoomProjectsKeys.lists() })
        queryClient.invalidateQueries({ queryKey: zoomProjectsKeys.detail(projectId) })
      },
      onError: (error: any) => {
        console.error('Zoom project update failed:', error)
      },
    })
  }

  return {
    useCreateZoomProject,
    useDeleteZoomProject,
    useValidateAndCreateZoomProject,
    useDisconnectZoomOAuth,
    useUpdateZoomProject,
  }
}
