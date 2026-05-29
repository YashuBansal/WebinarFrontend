import axiosInstance, { API_BASE_URL } from '../axios';
import axios from 'axios';
import type {
  CreateTemplatePayload,
  UpdateTemplatePayload,
  GetTemplatesQuery,
  DeleteTemplatePayload,
  TemplatesResponse,
  TemplateResponseSingle,
  TemplateCreateResponse,
  TemplateUpdateResponse,
  TemplateDeleteResponse,
  WabaDetailsResponse,
  SendTemplateMessagePayload,
  SendTemplateMessageResponse,
  SendBulkTemplateMessagePayload,
  SendBulkTemplateMessageResponse,
  ExchangeCodePayload,
  ExchangeCodeResponse,
} from '@/schemas/templateSchema';
import {
  templatesResponseSchema,
  templateResponseSingleSchema,
  templateCreateResponseSchema,
  templateUpdateResponseSchema,
  wabaDetailsResponseSchema,
  exchangeCodeResponseSchema,
} from '@/schemas/templateSchema';

/**
 * Sync templates from Meta for a WhatsApp Business Account
 */
const syncTemplates = async (projectId: string): Promise<{ fetched: number; inserted: number; deleted: number }> => {
  const { data } = await axiosInstance.get(`/waba-template/sync/${projectId}`);
  return data;
};

/**
 * Get all templates for a WhatsApp Business Account
 */
const getTemplates = async (
  projectId: string,
  query?: GetTemplatesQuery
): Promise<TemplatesResponse> => {
  const params = new URLSearchParams();
  if (query?.fields) params.append('fields', query.fields);
  if (query?.status) params.append('status', query.status);
  if (query?.category) params.append('category', query.category);
  if (query?.language) params.append('language', query.language);
  if (query?.limit) params.append('limit', query.limit);

  const queryString = params.toString();
  const url = `/waba-template/${projectId}${queryString ? `?${queryString}` : ''}`;
  
  try {
  const { data } = await axiosInstance.get(url);

    const parsedData = templatesResponseSchema.parse(data);
    console.log('Parsed data:', parsedData);
    return parsedData;
  } catch (error) {
    console.error('Failed to parse templates response:', error);
    throw error;
  }
};

/**
 * Create a new template
 * Uses direct axios call to bypass the interceptor that converts errors to strings,
 * preserving structured error data (source: 'app' | 'meta') for proper error handling
 */
const createTemplate = async (
  projectId: string,
  payload: CreateTemplatePayload
): Promise<TemplateCreateResponse> => {
  
  try {
    // Use direct axios call to bypass the interceptor that converts errors to strings
    // This preserves the structured error response (source, message, code, details)
    const { data } = await axios.post(
      `${API_BASE_URL}/waba-template/${projectId}`,
      payload,
      {
        headers: {
          'Content-Type': 'application/json',
        },
        withCredentials: true,
      }
    );
    return templateCreateResponseSchema.parse(data);
  } catch (error: any) {
    // Preserve the full AxiosError with structured data for template error handling
    // The hook and page will access error.response?.data to get source, message, code, etc.
    throw error;
  }
};

/**
 * Get a specific template by ID
 */
const getTemplateById = async (
  projectId: string,
  templateId: string
): Promise<TemplateResponseSingle> => {
  const { data } = await axiosInstance.get(`/whatsapp/templates/${projectId}/${templateId}`);
  return templateResponseSingleSchema.parse(data);
};

/**
 * Delete a template
 */
const deleteTemplate = async (
  projectId: string,
  deletePayload: DeleteTemplatePayload
): Promise<TemplateDeleteResponse> => {
  const params = new URLSearchParams();
  if (deletePayload.name) params.append('name', deletePayload.name);
  if (deletePayload.hsm_id) params.append('hsm_id', deletePayload.hsm_id);

  const queryString = params.toString();
  const url = `/waba-template/${projectId}${queryString ? `?${queryString}` : ''}`;
  
  const { data } = await axiosInstance.delete(url);
  return data;
};


/**
 * Update an existing template
 */
const updateTemplate = async (
  projectId: string,
  templateId: string,
  payload: UpdateTemplatePayload
): Promise<TemplateUpdateResponse> => {
  const { data } = await axiosInstance.patch(`/whatsapp/templates/${projectId}/${templateId}`, payload);
  return templateUpdateResponseSchema.parse(data);
};



/**
 * Get WhatsApp Business Account details
 */
const getWabaDetails = async (): Promise<WabaDetailsResponse> => {
  const { data } = await axiosInstance.get('/whatsapp/data');
  return wabaDetailsResponseSchema.parse(data);
};

/**
 * Send a template message
 */
const sendTemplateMessage = async (
  payload: SendTemplateMessagePayload
): Promise<SendTemplateMessageResponse> => {
  const formattedPayload = {
    ...payload,
    recipientPhoneNumber: payload.recipientPhoneNumber.startsWith('+') ? payload.recipientPhoneNumber : `+${payload.recipientPhoneNumber}`,
  };
  const { data } = await axiosInstance.post('/whatsapp/send-template', formattedPayload);
  return data;
};

/**
 * Send bulk template messages
 */
const sendBulkTemplateMessage = async (
  payload: SendBulkTemplateMessagePayload
): Promise<SendBulkTemplateMessageResponse> => {
  const formattedPayload = {
    ...payload,
    contacts: payload.contacts.map(contact => ({
      ...contact,
      phoneNumber: contact.phoneNumber.startsWith('+') ? contact.phoneNumber : `+${contact.phoneNumber}`,
    })),
  };
  const { data } = await axiosInstance.post('/whatsapp/send-bulk-template', formattedPayload);
  return data;
};

/**
 * Exchange authorization code for WhatsApp Business Account setup
 */
const exchangeCode = async (
  payload: ExchangeCodePayload
): Promise<ExchangeCodeResponse> => {
  const { data } = await axiosInstance.post('/whatsapp/exchange-code', payload);
  return exchangeCodeResponseSchema.parse(data);
};

/**
 * Upload sample media for template creation
 */
const uploadSampleMedia = async (file: File, projectId: string): Promise<any> => {
  const formData = new FormData();
  formData.append('file', file);

  const { data } = await axiosInstance.post(`/whatsapp/templates/${projectId}/upload-sample-media`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return data;
};

/**
 * Upload media asset for sending messages
 */
const uploadMediaAsset = async (file: File, projectId: string): Promise<any> => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('projectId', projectId);

  const { data } = await axiosInstance.post('/whatsapp/upload-media-asset', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return data;
};

/**
 * Check if session window is active for a given phone number
 */
const checkSessionStatus = async (projectId: string, phoneNumber: string): Promise<{ canSend: boolean }> => {
  const cleanPhone = phoneNumber.startsWith('+') ? phoneNumber : `+${phoneNumber}`;
  const { data } = await axiosInstance.get(`/whatsapp/chat/can-send-direct/${projectId}/${encodeURIComponent(cleanPhone)}`);
  return data.data; // returns { canSend: boolean }
};

export const templateApi = {
  syncTemplates,
  getTemplates,
  getTemplateById,
  createTemplate,
  updateTemplate,
  deleteTemplate,
  getWabaDetails,
  sendTemplateMessage,
  sendBulkTemplateMessage,
  exchangeCode,
  uploadSampleMedia,
  uploadMediaAsset,
  checkSessionStatus,
};
