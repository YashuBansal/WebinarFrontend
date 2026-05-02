import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import { campaignApi } from '@/api/modules/campaignAPI';
import type {
  CreateCampaignPayload,
  CampaignPreviewResponse,
  CampaignsListResponse,
  Campaign,
  VariableMapping,
  WlhAttendeeFilterSelection,
} from '@/schemas/campaignSchema';
import { toastUtils } from '@/lib/utils';

/**
 * Hook to fetch all campaigns for a project
 */
export const useCampaigns = (projectId: string, page: number = 1, limit: number = 10) => {
  return useQuery<CampaignsListResponse, AxiosError>({
    queryKey: ['campaigns', projectId, page, limit],
    queryFn: () => campaignApi.getCampaigns(projectId, page, limit),
    enabled: !!projectId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    throwOnError(error) {
      console.error('Failed to fetch campaigns:', error);
      toastUtils.error('Failed to fetch campaigns');
      return false;
    },
  });
};

/**
 * Hook to fetch a specific campaign by ID
 */
export const useCampaignById = (campaignId: string) => {
  return useQuery<Campaign, AxiosError>({
    queryKey: ['campaign', campaignId],
    queryFn: () => campaignApi.getCampaignById(campaignId),
    enabled: !!campaignId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

/**
 * Hook to create a new campaign
 */
export const useCreateCampaign = () => {
  const queryClient = useQueryClient();

  return useMutation<CampaignPreviewResponse, AxiosError, CreateCampaignPayload>({
    mutationFn: (payload) => campaignApi.createCampaign(payload),
    onSuccess: (_, variables) => {
      // Invalidate campaigns list for the project
      queryClient.invalidateQueries({ queryKey: ['campaigns', variables.projectId] });
    },
    onError: (error) => {
      console.error('Failed to create campaign:', error.response?.data);
      toastUtils.error('Failed to create campaign');
    },
  });
};

/**
 * Hook to update a campaign
 */
export const useUpdateCampaign = () => {
  const queryClient = useQueryClient();

  return useMutation<Campaign, AxiosError, { campaignId: string; payload: Partial<CreateCampaignPayload> }>({
    mutationFn: ({ campaignId, payload }) => campaignApi.updateCampaign(campaignId, payload),
    onSuccess: (_, variables) => {
      // Invalidate specific campaign
      queryClient.invalidateQueries({ queryKey: ['campaign', variables.campaignId] });
      
      // Invalidate campaigns list
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      
      toastUtils.success('Campaign updated successfully!');
    },
    onError: (error) => {
      console.error('Failed to update campaign:', error.response?.data);
      toastUtils.error('Failed to update campaign');
    },
  });
};

/**
 * Hook to delete a campaign
 */
export const useDeleteCampaign = () => {
  const queryClient = useQueryClient();

  return useMutation<void, AxiosError, string>({
    mutationFn: (campaignId) => campaignApi.deleteCampaign(campaignId),
    onSuccess: (_, campaignId) => {
      // Remove campaign from cache
      queryClient.removeQueries({ queryKey: ['campaign', campaignId] });
      
      // Invalidate campaigns list
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      
      toastUtils.success('Campaign deleted successfully!');
    },
    onError: (error) => {
      console.error('Failed to delete campaign:', error.response?.data);
      toastUtils.error('Failed to delete campaign');
    },
  });
};

/**
 * Hook to get campaign analytics
 */
export const useCampaignAnalytics = (campaignId: string) => {
  return useQuery<any, AxiosError>({
    queryKey: ['campaign-analytics', campaignId],
    queryFn: () => campaignApi.getCampaignAnalytics(campaignId),
    enabled: !!campaignId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

/**
 * Hook to get campaign results
 */
export const useCampaignResults = (campaignId: string) => {
  return useQuery<any, AxiosError>({
    queryKey: ['campaign-results', campaignId],
    queryFn: () => campaignApi.getCampaignResults(campaignId),
    enabled: !!campaignId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

/**
 * Hook to execute a campaign
 */
export const useExecuteCampaign = () => {
  const queryClient = useQueryClient();

  return useMutation<
    any,
    AxiosError,
    {
      campaignId: string;
      contacts: { contactId: string; phoneNumber: string; firstName?: string; lastName?: string }[];
      variableMappings?: VariableMapping[];
      language?: string;
      headerMediaAssetId?: string;
      contactType: 'whatsapp' | 'wlh';
      wlhAttendeeFilters?: WlhAttendeeFilterSelection;
    }
  >({
    mutationFn: (payload) => campaignApi.executeCampaign(payload),
    onSuccess: (data, variables) => {
      // Invalidate campaign data
      queryClient.invalidateQueries({ queryKey: ['campaign', variables.campaignId] });
      queryClient.invalidateQueries({ queryKey: ['campaign-analytics', variables.campaignId] });
      queryClient.invalidateQueries({ queryKey: ['campaign-results', variables.campaignId] });
      
      toastUtils.success(`Campaign executed! ${data.data.sent} sent, ${data.data.failed} failed`);
    },
    onError: (error) => {
      console.error('Failed to execute campaign:', error.response?.data);
      toastUtils.error('Failed to execute campaign');
    },
  });
};

/**
 * Hook to refresh campaigns data
 */
export const useRefreshCampaigns = () => {
  const queryClient = useQueryClient();

  return (projectId: string) => {
    queryClient.invalidateQueries({ queryKey: ['campaigns', projectId] });
  };
};

/**
 * Hook to cancel a scheduled campaign
 */
export const useCancelScheduledCampaign = () => {
  const queryClient = useQueryClient();

  return useMutation<Campaign, AxiosError, string>({
    mutationFn: (campaignId) => campaignApi.cancelScheduledCampaign(campaignId),
    onSuccess: (_, campaignId) => {
      // Invalidate campaign data
      queryClient.invalidateQueries({ queryKey: ['campaign', campaignId] });
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      
      toastUtils.success('Scheduled campaign cancelled successfully');
    },
    onError: (error) => {
      console.error('Failed to cancel scheduled campaign:', error.response?.data);
      toastUtils.error('Failed to cancel scheduled campaign');
    },
  });
};

/**
 * Hook to reschedule a campaign
 */
export const useRescheduleCampaign = () => {
  const queryClient = useQueryClient();

  return useMutation<Campaign, AxiosError, { campaignId: string; scheduledAt: string }>({
    mutationFn: ({ campaignId, scheduledAt }) => campaignApi.rescheduleCampaign(campaignId, scheduledAt),
    onSuccess: (_, variables) => {
      // Invalidate campaign data
      queryClient.invalidateQueries({ queryKey: ['campaign', variables.campaignId] });
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      
      toastUtils.success('Campaign rescheduled successfully');
    },
    onError: (error) => {
      console.error('Failed to reschedule campaign:', error.response?.data);
      toastUtils.error('Failed to reschedule campaign');
    },
  });
};