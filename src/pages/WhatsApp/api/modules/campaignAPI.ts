import {
  type CreateCampaignPayload,
  type CampaignPreviewResponse,
  type CampaignsListResponse,
  type Campaign,
  type VariableMapping,
  type WlhAttendeeFilterSelection,
  campaignsListResponseSchema,
} from '@/schemas/campaignSchema';
import axiosInstance from '../axios';

const CAMPAIGN_BASE_URL = '/campaign';

export const campaignApi = {
  /**
   * Create a new campaign
   */
  createCampaign: async (payload: CreateCampaignPayload): Promise<CampaignPreviewResponse> => {
    const response = await axiosInstance.post(`${CAMPAIGN_BASE_URL}/workflow`, payload);
    return response.data;
  },

  /**
   * Get all campaigns for a project
   */
  getCampaigns: async (projectId: string, page: number = 1, limit: number = 10): Promise<CampaignsListResponse> => {
    const response = await axiosInstance.get(`${CAMPAIGN_BASE_URL}?projectId=${projectId}&page=${page}&limit=${limit}`);
    return campaignsListResponseSchema.parse(response.data);
  },

  /**
   * Get a specific campaign by ID
   */
  getCampaignById: async (campaignId: string): Promise<Campaign> => {
    const response = await axiosInstance.get(`${CAMPAIGN_BASE_URL}/${campaignId}`);
    return response.data;
  },

  /**
   * Update a campaign
   */
  updateCampaign: async (campaignId: string, payload: Partial<CreateCampaignPayload>): Promise<Campaign> => {
    const response = await axiosInstance.patch(`${CAMPAIGN_BASE_URL}/${campaignId}`, payload);
    return response.data;
  },

  /**
   * Delete a campaign
   */
  deleteCampaign: async (campaignId: string): Promise<void> => {
    await axiosInstance.delete(`${CAMPAIGN_BASE_URL}/${campaignId}`);
  },

  /**
   * Get campaign analytics
   */
  getCampaignAnalytics: async (campaignId: string): Promise<any> => {
    const response = await axiosInstance.get(`${CAMPAIGN_BASE_URL}/${campaignId}/analytics`);
    return response.data;
  },

  /**
   * Get campaign execution results
   */
  getCampaignResults: async (campaignId: string): Promise<any> => {
    const response = await axiosInstance.get(`${CAMPAIGN_BASE_URL}/${campaignId}/results`);
    return response.data;
  },

  /**
   * Execute a campaign
   */
  executeCampaign: async (payload: {
    campaignId: string;
    contacts: { contactId: string; phoneNumber: string; firstName?: string; lastName?: string }[];
    variableMappings?: VariableMapping[];
    language?: string;
    headerMediaAssetId?: string;
    contactType: 'whatsapp' | 'wlh';
    wlhAttendeeFilters?: WlhAttendeeFilterSelection;
  }): Promise<any> => {
    const response = await axiosInstance.post(`${CAMPAIGN_BASE_URL}/execute`, payload);
    return response.data;
  },

  /**
   * Cancel a scheduled campaign
   */
  cancelScheduledCampaign: async (campaignId: string): Promise<Campaign> => {
    const response = await axiosInstance.patch(`${CAMPAIGN_BASE_URL}/${campaignId}/cancel`);
    return response.data;
  },

  /**
   * Reschedule a campaign
   */
  rescheduleCampaign: async (campaignId: string, scheduledAt: string): Promise<Campaign> => {
    const response = await axiosInstance.patch(`${CAMPAIGN_BASE_URL}/${campaignId}/reschedule`, {
      scheduledAt,
    });
    return response.data;
  },

  /**
   * Download campaign report data
   */
  downloadCampaignReport: async (campaignId: string): Promise<any> => {
    const response = await axiosInstance.get(`${CAMPAIGN_BASE_URL}/${campaignId}/report/download`);
    return response.data;
  },
};
