import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import { autoMessageApi, type AutoMessageConfigResponse, type AutoMessageConfigPayload } from '@/api/modules/autoMessage';
import { toast } from 'sonner';
import { toastUtils } from '@/lib/utils';

/**
 * Hook to fetch all auto message configurations for a project
 */
export const useAutoMessageConfigs = (projectId?: string) => {
  return useQuery<AutoMessageConfigResponse[], AxiosError>({
    queryKey: ['auto-message-configs', projectId],
    queryFn: () => autoMessageApi.listConfigs(projectId),
    enabled: !!projectId,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
};

/**
 * Hook to create/update an auto message configuration
 */
export const useUpsertAutoMessageConfig = () => {
  const queryClient = useQueryClient();

  return useMutation<AutoMessageConfigResponse, AxiosError, AutoMessageConfigPayload & { projectId: string }>({
    mutationFn: (payload) => autoMessageApi.upsertConfig(payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['auto-message-configs', variables.projectId] });
      queryClient.invalidateQueries({ queryKey: ['auto-message-config', variables.projectId, variables.webinarId] });
      toastUtils.success('Auto message configuration saved');
    },
    onError: (error: any) => {
      console.error('Failed to save auto message config:', error);
      toastUtils.error(error, 'Failed to save configuration');
    },
  });
};

/**
 * Hook to delete an auto message configuration
 */
export const useDeleteAutoMessageConfig = () => {
  const queryClient = useQueryClient();

  return useMutation<void, AxiosError, { _id: string; projectId: string }>({
    mutationFn: ({ _id }) => autoMessageApi.deleteConfig(_id),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['auto-message-configs', variables.projectId] });
      toast.success('Configuration deleted successfully');
    },
    onError: (error) => {
      console.error('Failed to delete config:', error);
      toast.error('Failed to delete configuration');
    },
  });
};

/**
 * Hook to toggle enable/disable status of an auto message configuration
 */
export const useToggleAutoMessageConfig = () => {
  const queryClient = useQueryClient();

  return useMutation<AutoMessageConfigResponse, AxiosError, { _id: string; projectId: string; enabled: boolean }>({
    mutationFn: ({ _id, enabled }) => autoMessageApi.toggleConfig(_id, enabled),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['auto-message-configs', variables.projectId] });
      toast.success(`Configuration ${variables.enabled ? 'enabled' : 'disabled'} successfully`);
    },
    onError: (error: any) => {
      console.error('Failed to toggle config:', error);
      toast.error('Failed to toggle configuration');
    },
  });
};

/**
 * Hook to send a test message
 */
export const useSendAutoMessageTest = () => {
  return useMutation<
    { success: boolean; messageId?: string },
    AxiosError,
    {
      projectId: string;
      webinarId: string;
      phoneNumber: string;
      templateName: string;
      language?: string;
      headerMediaAssetId?: string | null;
      variableMappings: AutoMessageConfigPayload['variableMappings'];
    }
  >({
    mutationFn: (payload) => autoMessageApi.testSend(payload),
    onSuccess: () => {
      toast.success('Test message sent successfully');
    },
    onError: (error: any) => {
      console.error('Failed to send test message:', error);
      toast.error(error?.response?.data?.message || 'Failed to send test message');
    },
  });
};

