import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import { configuredTemplateApi } from '@/api/modules/configuredTemplateAPI';
import type {
  CreateConfiguredTemplatePayload,
  UpdateConfiguredTemplatePayload,
  GetConfiguredTemplatesQuery,
  ConfiguredTemplateResponse,
  ConfiguredTemplatesListResponse,
} from '@/schemas/configuredTemplateSchema';
import { toastUtils } from '@/lib/utils';

/**
 * Hook to fetch all configured templates for a project
 */
export const useConfiguredTemplates = (projectId: string, query?: GetConfiguredTemplatesQuery) => {
  return useQuery<ConfiguredTemplatesListResponse, AxiosError>({
    queryKey: ['configured-templates', projectId, query],
    queryFn: () => configuredTemplateApi.getConfiguredTemplates(projectId, query),
    enabled: !!projectId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });
};

/**
 * Hook to fetch a specific configured template by ID
 */
export const useConfiguredTemplateById = (projectId: string, configuredTemplateId: string) => {
  return useQuery<ConfiguredTemplateResponse, AxiosError>({
    queryKey: ['configured-template', projectId, configuredTemplateId],
    queryFn: () => configuredTemplateApi.getConfiguredTemplateById(projectId, configuredTemplateId),
    enabled: !!projectId && !!configuredTemplateId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

/**
 * Hook to create a new configured template
 */
export const useCreateConfiguredTemplate = () => {
  const queryClient = useQueryClient();

  return useMutation<ConfiguredTemplateResponse, AxiosError, { 
    projectId: string; 
    payload: CreateConfiguredTemplatePayload;
    navigate: (path: string) => void;
  }>({
    mutationFn: ({ projectId, payload }) => 
      configuredTemplateApi.createConfiguredTemplate(projectId, payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: ['configured-templates', variables.projectId] 
      });
      
      variables.navigate(`/whatsapp/dashboard/${variables.projectId}/configured-templates`);
      toastUtils.success('Configured template created successfully');
    },
    onError: (error) => {
      console.error('Failed to create configured template:', error.response?.data);
      toastUtils.error(error,'Failed to create configured template');
    },
  });
};

/**
 * Hook to update an existing configured template
 */
export const useUpdateConfiguredTemplate = () => {
  const queryClient = useQueryClient();

  return useMutation<ConfiguredTemplateResponse, AxiosError, { 
    projectId: string; 
    configuredTemplateId: string; 
    payload: UpdateConfiguredTemplatePayload;
  }>({
    mutationFn: ({ projectId, configuredTemplateId, payload }) => 
      configuredTemplateApi.updateConfiguredTemplate(projectId, configuredTemplateId, payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: ['configured-templates', variables.projectId] 
      });
      
      queryClient.invalidateQueries({ 
        queryKey: ['configured-template', variables.projectId, variables.configuredTemplateId] 
      });
      
      toastUtils.success('Configured template updated successfully');
    },
    onError: (error) => {
      console.error('Failed to update configured template:', error.response?.data);
      toastUtils.error('Failed to update configured template');
    },
  });
};

/**
 * Hook to delete a configured template
 */
export const useDeleteConfiguredTemplate = () => {
  const queryClient = useQueryClient();

  return useMutation<ConfiguredTemplateResponse, AxiosError, { 
    projectId: string; 
    configuredTemplateId: string;
  }>({
    mutationFn: ({ projectId, configuredTemplateId }) => 
      configuredTemplateApi.deleteConfiguredTemplate(projectId, configuredTemplateId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: ['configured-templates', variables.projectId] 
      });
      
      queryClient.removeQueries({ 
        queryKey: ['configured-template', variables.projectId, variables.configuredTemplateId] 
      });
      
      toastUtils.success('Configured template deleted successfully');
    },
    onError: (error) => {
      console.error('Failed to delete configured template:', error.response?.data);
      toastUtils.error('Failed to delete configured template');
    },
  });
};

/**
 * Hook to refresh configured templates data
 */
export const useRefreshConfiguredTemplates = () => {
  const queryClient = useQueryClient();

  return (projectId: string) => {
    queryClient.invalidateQueries({ 
      queryKey: ['configured-templates', projectId] 
    });
  };
};
