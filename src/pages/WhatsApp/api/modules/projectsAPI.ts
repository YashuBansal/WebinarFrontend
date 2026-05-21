import axiosInstance from '../axios';
import type {
  Project,
  PaginatedProjectsResponse,
  CreateProjectPayload,
  UpdateProjectPayload,
} from '@/schemas/projectSchema';
import type { WABADetails, FetchWabaDetailsPayload } from '@/schemas/wabaSchema';
import { paginatedProjectsResponseSchema, projectSchema } from '@/schemas/projectSchema';
import { wabaDetailsSchema } from '@/schemas/wabaSchema';

interface GetProjectsParams {
  page?: number;
  limit?: number;
}


const getProjects = async (params?: GetProjectsParams): Promise<PaginatedProjectsResponse> => {
  const { data } = await axiosInstance.get('/projects', { params });
  return paginatedProjectsResponseSchema.parse(data);
};


const getProjectById = async (projectId: string): Promise<Project> => {
  const { data } = await axiosInstance.get(`/projects/${projectId}`);
  return projectSchema.parse(data);
};


const createProject = async (payload: CreateProjectPayload): Promise<Project> => {
  const { data } = await axiosInstance.post('/projects', payload);
  return projectSchema.parse(data);
};


const updateProject = async (
  projectId: string,
  payload: UpdateProjectPayload,
): Promise<Project> => {
  const { data } = await axiosInstance.patch(`/projects/${projectId}`, payload);
  return projectSchema.parse(data);
};


const deleteProject = async (projectId: string): Promise<Project> => {
  const { data } = await axiosInstance.delete(`/projects/${projectId}`);
  return projectSchema.parse(data);
};

const getWABADetails = async (payload: FetchWabaDetailsPayload): Promise<WABADetails> => {
  const { data } = await axiosInstance.post('/projects/waba-details', payload);
  return wabaDetailsSchema.parse(data);
};

export const projectsApi = {
  getProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject,
  getWABADetails,
};