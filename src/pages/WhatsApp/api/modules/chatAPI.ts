import axiosInstance from '../axios';
import type { SendTemplateMessagePayload } from '@/schemas/templateSchema';

export interface ChatMessageDTO {
  _id?: string;
  phoneNumber: string;
  textBody?: string;
  direction: 'inbound' | 'outbound';
  createdAt: string;
  // WhatsApp/WABA delivery lifecycle for outbound messages
  status?: 'pending' | 'sent' | 'delivered' | 'read' | 'failed' | 'clicked';
  sentAt?: string;
  deliveredAt?: string;
  readAt?: string;
  failureReason?: string;
  messageFormat?: 'text' | 'template' | 'media';
  templateName?: string;
  templateLanguage?: string;
  templateComponents?: any[];
  displayText?: string;
  mimeType?: string;
  mediaUrl?: string;
}

export interface ChatHistoryResponse {
  messages: ChatMessageDTO[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface CanSendDirectResponse {
  canSend: boolean;
  reason?: string;
  lastInboundMessageTime?: string;
}

export const chatApi = {
  async getHistory(projectId: string, phoneNumber: string, page = 1, limit = 30): Promise<ChatHistoryResponse> {
    const formattedPhone = phoneNumber.startsWith('+') ? phoneNumber : `+${phoneNumber}`;
    const { data } = await axiosInstance.get('/whatsapp/chat', {
      params: { projectId, phoneNumber: formattedPhone, page, limit },
    });
    return data.data as ChatHistoryResponse;
  },

  async sendText(payload: { projectId: string; phoneNumber: string; text: string; components?: any[]; contactId?: string }) {
    const formattedPayload = {
      ...payload,
      phoneNumber: payload.phoneNumber.startsWith('+') ? payload.phoneNumber : `+${payload.phoneNumber}`,
    };
    const { data } = await axiosInstance.post('/whatsapp/chat/send-text', formattedPayload);
    return data.data as { id: string };
  },

  async sendTemplate(payload: SendTemplateMessagePayload) {
    const formattedPayload = {
      ...payload,
      recipientPhoneNumber: payload.recipientPhoneNumber.startsWith('+') ? payload.recipientPhoneNumber : `+${payload.recipientPhoneNumber}`,
    };
    const { data } = await axiosInstance.post('/whatsapp/send-template', formattedPayload);
    return data.data as { id: string };
  },

  async canSendDirect(projectId: string, phoneNumber: string): Promise<CanSendDirectResponse> {
    const formattedPhone = phoneNumber.startsWith('+') ? phoneNumber : `+${phoneNumber}`;
    const { data } = await axiosInstance.get(`/whatsapp/chat/can-send-direct/${projectId}/${formattedPhone}`);
    return data.data as CanSendDirectResponse;
  },
};


