import axiosInstance from '../axios';
import type {
  CreateConfiguredTemplatePayload,
  UpdateConfiguredTemplatePayload,
  GetConfiguredTemplatesQuery,
  ConfiguredTemplateResponse,
  ConfiguredTemplatesListResponse,
} from '@/schemas/configuredTemplateSchema';
import {
  configuredTemplateApiResponseSchema,
  configuredTemplatesListApiResponseSchema,
} from '@/schemas/configuredTemplateSchema';

/**
 * Get all configured templates for a project
 */
const getConfiguredTemplates = async (
  projectId: string,
  query?: GetConfiguredTemplatesQuery
): Promise<ConfiguredTemplatesListResponse> => {
  const params = new URLSearchParams();
  if (query?.page) params.append('page', query.page);
  if (query?.limit) params.append('limit', query.limit);
  if (query?.search) params.append('search', query.search);
  if (query?.isActive !== undefined) params.append('isActive', query.isActive.toString());

  const queryString = params.toString();
  const url = `/configured-templates/${projectId}${queryString ? `?${queryString}` : ''}`;
  
  const { data } = await axiosInstance.get(url);
  const parsedResponse = configuredTemplatesListApiResponseSchema.parse(data);
  return parsedResponse.data;
};

/**
 * Get a specific configured template by ID
 */
const getConfiguredTemplateById = async (
  projectId: string,
  configuredTemplateId: string
): Promise<ConfiguredTemplateResponse> => {
  const url = `/configured-templates/${projectId}/${configuredTemplateId}`;
  
  const { data } = await axiosInstance.get(url);
  const parsedResponse = configuredTemplateApiResponseSchema.parse(data);
  return parsedResponse.data;
};

/**
 * Create a new configured template
 */
const createConfiguredTemplate = async (
  projectId: string,
  payload: CreateConfiguredTemplatePayload
): Promise<ConfiguredTemplateResponse> => {
  const url = `/configured-templates/${projectId}`;
  
  const { data } = await axiosInstance.post(url, payload);
  const parsedResponse = configuredTemplateApiResponseSchema.parse(data);
  return parsedResponse.data;
};

/**
 * Update an existing configured template
 */
const updateConfiguredTemplate = async (
  projectId: string,
  configuredTemplateId: string,
  payload: UpdateConfiguredTemplatePayload
): Promise<ConfiguredTemplateResponse> => {
  const url = `/configured-templates/${projectId}/${configuredTemplateId}`;
  
  const { data } = await axiosInstance.patch(url, payload);
  const parsedResponse = configuredTemplateApiResponseSchema.parse(data);
  return parsedResponse.data;
};

/**
 * Delete a configured template
 */
const deleteConfiguredTemplate = async (
  projectId: string,
  configuredTemplateId: string
): Promise<ConfiguredTemplateResponse> => {
  const url = `/configured-templates/${projectId}/${configuredTemplateId}`;
  
  const { data } = await axiosInstance.delete(url);
  const parsedResponse = configuredTemplateApiResponseSchema.parse(data);
  return parsedResponse.data;
};

export const configuredTemplateApi = {
  getConfiguredTemplates,
  getConfiguredTemplateById,
  createConfiguredTemplate,
  updateConfiguredTemplate,
  deleteConfiguredTemplate,
};
