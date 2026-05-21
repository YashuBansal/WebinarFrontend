import { useQuery } from '@tanstack/react-query';
import api from '@/api/axios';
import { MessageHistoryResponseSchema, type MessageHistoryResponse } from '@/schemas/wabaMessageSchema';

export const useCampaignMessages = (
  projectId: string, 
  campaignId: string, 
  page: number = 1, 
  limit: number = 10,
  enabled: boolean = true
) => {
  return useQuery<MessageHistoryResponse>({
    queryKey: ['campaign-messages', projectId, campaignId, page, limit],
    queryFn: async () => {
      if (!projectId || !campaignId) {
        throw new Error('Project ID and Campaign ID are required');
      }

      const response = await api.get(`/projects/waba-messages/${projectId}`, {
        params: {
          page,
          limit,
          campaignId,
          messageType: 'campaign'
        },
      });

      // Validate response with Zod schema
      const validatedData = MessageHistoryResponseSchema.parse(response.data);
      return validatedData;
    },
    enabled: enabled && !!projectId && !!campaignId,
    staleTime: 30000, // 30 seconds
    refetchOnWindowFocus: false,
  });
};
