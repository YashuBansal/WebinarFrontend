import axiosInstance from '../axios';
import {
  apiCampaignSchema,
  apiCampaignsListResponseSchema,
  createApiCampaignPayloadSchema,
  executeApiCampaignPayloadSchema,
  type ApiCampaign,
  type ApiCampaignsListResponse,
  type CreateApiCampaignPayload,
  type ExecuteApiCampaignPayload,
} from '@/schemas/apiCampaignSchema';

const API_CAMPAIGN_BASE_URL = '/api-campaign';

const buildQueryString = (params: Record<string, string | number | undefined>) => {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      searchParams.append(key, String(value));
    }
  });
  const query = searchParams.toString();
  return query ? `?${query}` : '';
};

const createApiCampaign = async (payload: CreateApiCampaignPayload)=> {
  const body = createApiCampaignPayloadSchema.parse(payload);
  const { data } = await axiosInstance.post(API_CAMPAIGN_BASE_URL, body);
  return data;
};

const getApiCampaigns = async ({
  projectId,
  page = 1,
  limit = 10,
}: {
  projectId?: string;
  page?: number;
  limit?: number;
}): Promise<ApiCampaignsListResponse> => {
  const query = buildQueryString({ projectId, page, limit });
  const { data } = await axiosInstance.get(`${API_CAMPAIGN_BASE_URL}${query}`);
  return apiCampaignsListResponseSchema.parse(data);
};

const getApiCampaignById = async (campaignId: string): Promise<ApiCampaign> => {
  const { data } = await axiosInstance.get(`${API_CAMPAIGN_BASE_URL}/${campaignId}`);
  return apiCampaignSchema.parse(data);
};

const executeApiCampaign = async (payload: ExecuteApiCampaignPayload) => {
  const body = executeApiCampaignPayloadSchema.parse(payload);
  const { data } = await axiosInstance.post(`${API_CAMPAIGN_BASE_URL}/execute`, body);
  return data;
};

const deleteApiCampaign = async (campaignId: string): Promise<void> => {
  await axiosInstance.delete(`${API_CAMPAIGN_BASE_URL}/${campaignId}`);
};

const downloadApiCampaignReport = async (campaignId: string): Promise<any> => {
  const { data } = await axiosInstance.get(
    `${API_CAMPAIGN_BASE_URL}/${campaignId}/report/download`,
  );
  return data;
};

export const apiCampaignApi = {
  createApiCampaign,
  getApiCampaigns,
  getApiCampaignById,
  executeApiCampaign,
  deleteApiCampaign,
  downloadApiCampaignReport,
};

