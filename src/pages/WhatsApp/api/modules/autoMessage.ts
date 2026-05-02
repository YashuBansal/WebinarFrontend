import axiosInstance from "../axios";

export interface VariableMapping {
  variable: string; // e.g., "{{1}}"
  isDynamic: boolean;
  contactField?: string; // when isDynamic
  staticValue?: string; // when !isDynamic
  fallbackValue?: string;
}

export interface AutoMessageConfigPayload {
  webinarId: string;
  templateName: string;
  language?: string;
  headerMediaAssetId?: string | null;
  enabled: boolean;
  variableMappings: VariableMapping[];
}

export interface AutoMessageConfigResponse extends AutoMessageConfigPayload {
  id: string;
  adminId: string;
  updatedAt: string;
  createdAt: string;
  webinarName?: string;
  webinarDate?: string;
}

export const autoMessageApi = {
  async listConfigs(projectId?: string) {
    const { data } = await axiosInstance.get(`/webinar-auto-message/all`, { params: { projectId } });
    return data?.data as AutoMessageConfigResponse[];
  },
  async getConfig(projectId: string, webinarId: string) {
    const { data } = await axiosInstance.get(`/webinar-auto-message`, {
      params: { projectId, webinarId },
    });
    return data?.data as AutoMessageConfigResponse | null;
  },

  async upsertConfig(payload: AutoMessageConfigPayload & { projectId: string }) {
    const { data } = await axiosInstance.post(`/webinar-auto-message`, payload);
    return data?.data as AutoMessageConfigResponse;
  },

  async testSend(payload: {
    projectId: string;
    webinarId: string;
    phoneNumber: string;
    templateName: string;
    language?: string;
    headerMediaAssetId?: string | null;
    variableMappings: VariableMapping[];
  }) {
    const { data } = await axiosInstance.post(`/webinar-auto-message/test-send`, payload);
    return data?.data as { success: boolean; messageId?: string };
  },

  async deleteConfig(_id: string) {
    const { data } = await axiosInstance.delete(`/webinar-auto-message`, {
      params: { _id },
    });
    return data?.data;
  },

  async toggleConfig(_id: string, enabled: boolean) {
    const { data } = await axiosInstance.patch(`/webinar-auto-message/toggle`, {
      _id,
      enabled,
    });
    return data?.data as AutoMessageConfigResponse;
  },
};


