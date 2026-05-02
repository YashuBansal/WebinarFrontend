import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import axiosInstance from '@/api/axios';
import { templateApi } from '@/api/modules/templateAPI';
import { z } from 'zod';

// Zod schema for media asset
const mediaAssetSchema = z.object({
  _id: z.string(),
  userId: z.string(),
  projectId: z.string(),
  fileName: z.string(),
  filePath: z.string(),
  fileSize: z.number(),
  mimeType: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

const paginatedMediaAssetsResponseSchema = z.object({
  data: z.array(mediaAssetSchema),
  total: z.number(),
  page: z.number(),
  limit: z.number(),
});

const apiResponseSchema = z.object({
  statusCode: z.number(),
  message: z.string(),
  data: paginatedMediaAssetsResponseSchema,
});

export type MediaAsset = z.infer<typeof mediaAssetSchema>;
export type PaginatedMediaAssetsResponse = z.infer<typeof paginatedMediaAssetsResponseSchema>;

interface GetMediaAssetsParams {
  projectId: string;
  page?: number;
  limit?: number;
  type?: 'ALL' | 'IMAGE' | 'VIDEO' | 'DOCUMENT';
}

interface DeleteMediaAssetParams {
  projectId: string;
  mediaAssetId: string;
}

const getMediaAssets = async (params: GetMediaAssetsParams): Promise<PaginatedMediaAssetsResponse> => {
  const { data } = await axiosInstance.get('/whatsapp/media-assets', { 
    params: {
      projectId: params.projectId,
      page: params.page || 1,
      limit: params.limit || 20,
      type: params.type && params.type !== 'ALL' 
        ? params.type.toLowerCase()
        : undefined,
    }
  });
  return apiResponseSchema.parse(data).data;
};

export const useMediaAssets = (params: GetMediaAssetsParams) => {
  const queryClient = useQueryClient();
  
  const query = useQuery({
    queryKey: ['mediaAssets', params.projectId, params.page, params.limit, params.type],
    queryFn: () => getMediaAssets(params),
    enabled: !!params.projectId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Function to invalidate and refetch media assets
  const invalidateMediaAssets = () => {
    return queryClient.invalidateQueries({
      queryKey: ['mediaAssets', params.projectId],
    });
  };

  return {
    ...query,
    invalidateMediaAssets,
  };
};

export const useDeleteMediaAsset = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ projectId, mediaAssetId }: DeleteMediaAssetParams) => {
      const { data } = await axiosInstance.delete(
        `/whatsapp/media-assets/${mediaAssetId}`,
        {
          params: { projectId },
        }
      );
      return data;
    },
    onSuccess: (_, variables) => {
      // Invalidate media assets queries to refetch the updated list
      queryClient.invalidateQueries({
        queryKey: ['mediaAssets', variables.projectId],
      });
    },
  });
};

interface UploadMediaAssetParams {
  file: File;
  projectId: string;
}

export const useUploadMediaAsset = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ file, projectId }: UploadMediaAssetParams) => {
      return templateApi.uploadMediaAsset(file, projectId);
    },
    onSuccess: (_, variables) => {
      // Invalidate media assets queries to refetch the updated list
      queryClient.invalidateQueries({
        queryKey: ['mediaAssets', variables.projectId],
      });
    },
  });
};
