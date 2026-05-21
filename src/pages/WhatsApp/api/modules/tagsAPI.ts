import axiosInstance from '../axios';
import type {
  WabaTag,
  CreateWabaTagPayload,
  UpdateWabaTagPayload,
  WLHTag,
} from '@/schemas/tagSchema';
import {
  wabaTagsResponseSchema,
  wabaTagResponseSchema,
  wlhTagsResponseSchema,
} from '@/schemas/tagSchema';

interface GetWabaTagsParams {
  search?: string;
  projectId?: string;
}

const getWabaTags = async (params?: GetWabaTagsParams): Promise<WabaTag[]> => {
  const { data } = await axiosInstance.get('/waba-tags', { params });
  const parsedResponse = wabaTagsResponseSchema.parse(data);
  return parsedResponse.data;
};

const getWabaTagsByProject = async (projectId: string): Promise<WabaTag[]> => {
  const { data } = await axiosInstance.get(`/waba-tags/project/${projectId}`);
  const parsedResponse = wabaTagsResponseSchema.parse(data);
  return parsedResponse.data;
};

const getWabaTagById = async (tagId: string): Promise<WabaTag> => {
  const { data } = await axiosInstance.get(`/waba-tags/${tagId}`);
  const parsedResponse = wabaTagResponseSchema.parse(data);
  return parsedResponse.data;
};

const createWabaTag = async (payload: CreateWabaTagPayload): Promise<WabaTag> => {
  const { data } = await axiosInstance.post('/waba-tags', payload);
  const parsedResponse = wabaTagResponseSchema.parse(data);
  return parsedResponse.data;
};

const updateWabaTag = async (
  tagId: string,
  payload: UpdateWabaTagPayload,
): Promise<WabaTag> => {
  const { data } = await axiosInstance.put(`/waba-tags/${tagId}`, payload);
  const parsedResponse = wabaTagResponseSchema.parse(data);
  return parsedResponse.data;
};

const deleteWabaTag = async (tagId: string): Promise<WabaTag> => {
  const { data } = await axiosInstance.delete(`/waba-tags/${tagId}`);
  const parsedResponse = wabaTagResponseSchema.parse(data);
  return parsedResponse.data;
};



const getWLHTags = async (): Promise<WLHTag[]> => {
  const { data } = await axiosInstance.get('/tags');
  const parsedResponse = wlhTagsResponseSchema.parse(data);
  return parsedResponse.data;
};

export const wabaTagsApi = {
  getWabaTags,
  getWabaTagsByProject,
  getWabaTagById,
  createWabaTag,
  updateWabaTag,
  deleteWabaTag,
  getWLHTags,
};
