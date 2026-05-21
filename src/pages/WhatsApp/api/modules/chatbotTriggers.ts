import axiosInstance from "../axios";

export type ResponseType = "link" | "text";

export interface ChatbotTriggerPayload {
  projectId: string;
  keyword: string;
  responseType: ResponseType;
  responseValue: string;
  enabled?: boolean;
}

export interface ChatbotTriggerResponse {
  _id: string;
  adminId: string;
  projectId: string;
  keyword: string;
  responseType: ResponseType;
  responseValue: string;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ChatbotTriggerUpdatePayload {
  keyword?: string;
  responseType?: ResponseType;
  responseValue?: string;
  enabled?: boolean;
}

export const chatbotTriggersApi = {
  async listTriggers(projectId: string) {
    const { data } = await axiosInstance.get(`/whatsapp/chatbot/triggers`, {
      params: { projectId },
    });
    return (data?.data ?? []) as ChatbotTriggerResponse[];
  },

  async createTrigger(payload: ChatbotTriggerPayload) {
    const { data } = await axiosInstance.post(`/whatsapp/chatbot/triggers`, payload);
    return data?.data as ChatbotTriggerResponse;
  },

  async updateTrigger(triggerId: string, projectId: string, payload: ChatbotTriggerUpdatePayload) {
    const { data } = await axiosInstance.patch(`/whatsapp/chatbot/triggers/${triggerId}`, payload, {
      params: { projectId },
    });
    return data?.data as ChatbotTriggerResponse;
  },

  async deleteTrigger(triggerId: string, projectId: string) {
    await axiosInstance.delete(`/whatsapp/chatbot/triggers/${triggerId}`, {
      params: { projectId },
    });
  },
};
