import axiosInstance from '../axios';

export interface QuickReply {
  _id: string;
  projectId: string;
  name: string;
  content: string;
  language?: string;
  components?: any[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateQuickReplyPayload {
  projectId: string;
  name: string;
  content: string;
  language?: string;
  components?: any[];
}

export const quickReplyApi = {
  async list(projectId: string): Promise<QuickReply[]> {
    const { data } = await axiosInstance.get(`/quick-replies/${projectId}`);
    return data.data;
  },
  async create(payload: CreateQuickReplyPayload): Promise<QuickReply> {
    const { data } = await axiosInstance.post('/quick-replies', payload);
    return data.data;
  },
  async delete(id: string): Promise<void> {
    await axiosInstance.delete(`/quick-replies/${id}`);
  }
};
