import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { AxiosError } from "axios";
import api from "@/api/axios";
import { apiCampaignApi } from "@/api/modules/apiCampaignAPI";
import type {
  ApiCampaign,
  ApiCampaignsListResponse,
  CreateApiCampaignPayload,
  ExecuteApiCampaignPayload,
} from "@/schemas/apiCampaignSchema";
import {
  MessageHistoryResponseSchema,
  type MessageHistoryResponse,
} from "@/schemas/wabaMessageSchema";
import { toastUtils } from "@/lib/utils";

export const useApiCampaigns = (
  projectId: string,
  page: number = 1,
  limit: number = 10
) => {
  return useQuery<ApiCampaignsListResponse, AxiosError>({
    queryKey: ["api-campaigns", projectId, page, limit],
    queryFn: () => apiCampaignApi.getApiCampaigns({ projectId, page, limit }),
    enabled: !!projectId,
    staleTime: 5 * 60 * 1000,
    throwOnError(error) {
      console.error("Failed to fetch API campaigns:", error);
      toastUtils.error("Failed to load API campaigns");
      return false;
    },
  });
};

export const useApiCampaignById = (campaignId: string) => {
  return useQuery<ApiCampaign, AxiosError>({
    queryKey: ["api-campaign", campaignId],
    queryFn: () => apiCampaignApi.getApiCampaignById(campaignId),
    enabled: !!campaignId,
    staleTime: 5 * 60 * 1000,
  });
};

export const useCreateApiCampaign = () => {
  const queryClient = useQueryClient();
  return useMutation<ApiCampaign, AxiosError, CreateApiCampaignPayload>({
    mutationFn: (payload) => apiCampaignApi.createApiCampaign(payload),
    onSuccess: () => {
      toastUtils.success("API campaign created successfully");
      queryClient.invalidateQueries({ queryKey: ["api-campaigns"] });
    },
    onError: (error) => {
      console.error("Failed to create API campaign:", error);
      toastUtils.error(error, "Failed to create API campaign");
    },
  });
};

export const useExecuteApiCampaign = () => {
  return useMutation<any, AxiosError, ExecuteApiCampaignPayload>({
    mutationFn: (payload) => apiCampaignApi.executeApiCampaign(payload),
    onSuccess: () => {
      toastUtils.success("API campaign execution triggered");
    },
    onError: (error) => {
      console.error(
        "Failed to execute API campaign:",
        error.response?.data || error.message
      );
      toastUtils.error("Failed to execute API campaign");
    },
  });
};

export const useDeleteApiCampaign = () => {
  const queryClient = useQueryClient();

  return useMutation<void, AxiosError, string>({
    mutationFn: (campaignId) => apiCampaignApi.deleteApiCampaign(campaignId),
    onSuccess: (_, campaignId) => {
      queryClient.removeQueries({ queryKey: ["api-campaign", campaignId] });
      queryClient.invalidateQueries({ queryKey: ["api-campaigns"] });
      toastUtils.success("API campaign cancelled successfully");
    },
    onError: (error) => {
      console.error("Failed to cancel API campaign:", error);
      toastUtils.error(error, "Failed to cancel API campaign");
    },
  });
};

export const useApiCampaignMessages = (
  projectId: string,
  campaignId: string,
  page: number = 1,
  limit: number = 10,
  enabled: boolean = true,
) => {
  return useQuery<MessageHistoryResponse>({
    queryKey: ["api-campaign-messages", projectId, campaignId, page, limit],
    queryFn: async () => {
      if (!projectId || !campaignId) {
        throw new Error("Project ID and Campaign ID are required");
      }

      const response = await api.get(`/projects/waba-messages/${projectId}`, {
        params: {
          page,
          limit,
          apiCampaignId: campaignId,
          messageType: "api-campaign",
        },
      });

      return MessageHistoryResponseSchema.parse(response.data);
    },
    enabled: enabled && !!projectId && !!campaignId,
    staleTime: 30000,
    refetchOnWindowFocus: false,
  });
};
