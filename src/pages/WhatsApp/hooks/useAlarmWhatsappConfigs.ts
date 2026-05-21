import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import {
  alarmWhatsappConfigApi,
  type AlarmWhatsappConfigPayload,
  type AlarmWhatsappConfigResponse,
} from '@/api/modules/alarmWhatsappConfig';
import { toast } from 'sonner';
import { toastUtils } from '@/lib/utils';

export const useAlarmWhatsappConfigs = (projectId?: string) => {
  return useQuery<AlarmWhatsappConfigResponse[], AxiosError>({
    queryKey: ['alarm-whatsapp-configs', projectId],
    queryFn: () => alarmWhatsappConfigApi.listConfigs(projectId),
    enabled: !!projectId,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
};

export const useAlarmWhatsappConfig = (projectId?: string) => {
  return useQuery<AlarmWhatsappConfigResponse | null, AxiosError>({
    queryKey: ['alarm-whatsapp-config', projectId],
    queryFn: () => alarmWhatsappConfigApi.getConfig(projectId!),
    enabled: !!projectId,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
};

export const useUpsertAlarmWhatsappConfig = () => {
  const queryClient = useQueryClient();

  return useMutation<AlarmWhatsappConfigResponse, AxiosError, AlarmWhatsappConfigPayload>({
    mutationFn: (payload) => alarmWhatsappConfigApi.upsertConfig(payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['alarm-whatsapp-configs', variables.projectId],
      });
      queryClient.invalidateQueries({
        queryKey: ['alarm-whatsapp-config', variables.projectId],
      });
      toastUtils.success('Alarm WhatsApp configuration saved');
    },
    onError: (error: any) => {
      console.error('Failed to save alarm WhatsApp config:', error);
      toastUtils.error(error, 'Failed to save configuration');
    },
  });
};

export const useDeleteAlarmWhatsappConfig = () => {
  const queryClient = useQueryClient();

  return useMutation<void, AxiosError, { _id: string; projectId: string }>({
    mutationFn: ({ _id }) => alarmWhatsappConfigApi.deleteConfig(_id),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['alarm-whatsapp-configs', variables.projectId],
      });
      queryClient.invalidateQueries({
        queryKey: ['alarm-whatsapp-config', variables.projectId],
      });
      toast.success('Configuration deleted successfully');
    },
    onError: (error) => {
      console.error('Failed to delete config:', error);
      toast.error('Failed to delete configuration');
    },
  });
};

export const useToggleAlarmWhatsappConfig = () => {
  const queryClient = useQueryClient();

  return useMutation<
    AlarmWhatsappConfigResponse,
    AxiosError,
    { _id: string; projectId: string; enabled: boolean }
  >({
    mutationFn: ({ _id, enabled }) =>
      alarmWhatsappConfigApi.toggleConfig(_id, enabled),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['alarm-whatsapp-configs', variables.projectId],
      });
      queryClient.invalidateQueries({
        queryKey: ['alarm-whatsapp-config', variables.projectId],
      });
      toast.success(
        `Configuration ${variables.enabled ? 'enabled' : 'disabled'} successfully`,
      );
    },
    onError: (error: any) => {
      console.error('Failed to toggle config:', error);
      toast.error('Failed to toggle configuration');
    },
  });
};

export const useSendAlarmWhatsappConfigTest = () => {
  return useMutation<
    { success: boolean; messageId?: string },
    AxiosError,
    { projectId: string; phoneNumber: string; type: 'main' | 'reminder' }
  >({
    mutationFn: (payload) => alarmWhatsappConfigApi.testSend(payload),
    onSuccess: () => {
      toast.success('Test message sent successfully');
    },
    onError: (error: any) => {
      console.error('Failed to send test message:', error);
      toast.error(error?.response?.data?.message || 'Failed to send test message');
    },
  });
};
