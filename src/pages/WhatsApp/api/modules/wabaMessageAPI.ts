import axiosInstance from '../axios';

export interface ContactWithMetadata {
  phoneNumber: string;
  lastMessagePreview?: string;
  lastMessageAt?: string;
  lastMessageStatus?: 'pending' | 'sent' | 'delivered' | 'read' | 'failed' | 'clicked' | string;
  lastMessageSentAt?: string;
  lastMessageDeliveredAt?: string;
  lastMessageReadAt?: string;
  lastMessageFailureReason?: string;
  unreadCount: number;
  lastMessageDirection?: 'inbound' | 'outbound';
}

export interface UniquePhoneNumbersResponse {
  phoneNumbers: ContactWithMetadata[];
  count: number;
}

export interface EligibleContact {
  phoneNumber: string;
  contactId?: string;
  lastInboundMessageAt: string;
  windowExpiresAt: string;
  timeRemaining: number;
  lastMessagePreview?: string;
  lastMessageAt?: string;
  lastMessageStatus?: 'pending' | 'sent' | 'delivered' | 'read' | 'failed' | 'clicked' | string;
  lastMessageSentAt?: string;
  lastMessageDeliveredAt?: string;
  lastMessageReadAt?: string;
  lastMessageFailureReason?: string;
  unreadCount: number;
  lastMessageDirection?: 'inbound' | 'outbound';
}

export interface EligibleContactsResponse {
  eligibleContacts: EligibleContact[];
  count: number;
}

export const wabaMessageApi = {
  /**
   * Fetch all unique phone numbers for a project
   */
  async getUniquePhoneNumbers(projectId: string): Promise<UniquePhoneNumbersResponse> {
    const { data } = await axiosInstance.get('/waba-message/unique-phone-numbers', {
      params: { projectId },
    });
    return data as UniquePhoneNumbersResponse;
  },

  /**
   * Fetch contacts eligible for session messages (within 24h window)
   */
  async getEligibleSessionContacts(projectId: string): Promise<EligibleContactsResponse> {
    const { data } = await axiosInstance.get('/waba-message/eligible-session-contacts', {
      params: { projectId },
    });
    return data as EligibleContactsResponse;
  },

  /**
   * Mark messages as read for a contact
   */
  async markAsRead(projectId: string, phoneNumber: string): Promise<{ success: boolean }> {
    const { data } = await axiosInstance.post('/waba-message/mark-as-read', {
      projectId,
      phoneNumber,
    });
    return data;
  },
};

