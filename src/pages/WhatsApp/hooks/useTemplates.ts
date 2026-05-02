import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import { templateApi } from '@/api/modules/templateAPI';
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
import { toastUtils } from '@/lib/utils';

/**
 * Hook to fetch all templates for a WhatsApp Business Account
 */
export const useTemplates = (projectId: string, query?: GetTemplatesQuery) => {
  return useQuery<TemplatesResponse, AxiosError>({
    queryKey: ['templates', projectId, query],
    queryFn: () => templateApi.getTemplates(projectId, query),
    enabled: !!projectId,
    staleTime: 5 * 60 * 1000, 
    refetchOnWindowFocus: false,
   
  });
};

/**
 * Hook to fetch a specific template by ID
 */
export const useTemplateById = (projectId: string, templateId: string) => {
  return useQuery<TemplateResponseSingle, AxiosError>({
    queryKey: ['template', projectId, templateId],
    queryFn: () => templateApi.getTemplateById(projectId, templateId),
    enabled: !!projectId && !!templateId,
    staleTime: 5 * 60 * 1000, // 5 minutes
   
  });
};

/**
 * Hook to create a new template
 */
export const useCreateTemplate = () => {
  const queryClient = useQueryClient();

  return useMutation<TemplateCreateResponse, AxiosError, { projectId: string; payload: CreateTemplatePayload, navigate: (path: string) => void }>({
    mutationFn: ({ projectId, payload }) => templateApi.createTemplate(projectId, payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['templates', variables.projectId] });

      variables.navigate(`/whatsapp/dashboard/${variables.projectId}/templates`);
      toastUtils.success('Template created successfully');
    },
    onError: (error: AxiosError<any>) => {
      const data: any = error.response?.data;
      console.log('Failed to create template:', data);
      const source = data?.source === 'meta' ? 'meta' : 'app';
      const baseMessage =
        data?.message ||
        data?.error?.message ||
        error.message ||
        'Failed to create template.';

      console.error('Failed to create template:', {
        source,
        status: error.response?.status,
        data,
        message: baseMessage,
      });

      if (source === 'meta') {
        toastUtils.error(
          baseMessage,
          'Template rejected by WhatsApp (Meta). Please review the Meta error details.',
        );
      } else {
        toastUtils.error(baseMessage, 'Failed to create template');
      }
    },
  });
};

/**
 * Hook to update an existing template
 */
export const useUpdateTemplate = () => {
  const queryClient = useQueryClient();

  return useMutation<TemplateUpdateResponse, AxiosError, { 
    projectId: string; 
    templateId: string; 
    payload: UpdateTemplatePayload 
  }>({
    mutationFn: ({ projectId, templateId, payload }) => 
      templateApi.updateTemplate(projectId, templateId, payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['templates', variables.projectId] });
      
      queryClient.invalidateQueries({ 
        queryKey: ['template', variables.projectId, variables.templateId] 
      });
    },
    onError: (error) => {
      console.error('Failed to update template:', error.response?.data);
      toastUtils.error('Failed to update template');
    },
  });
};

/**
 * Hook to delete a template
 */
export const useDeleteTemplate = () => {
  const queryClient = useQueryClient();

  return useMutation<TemplateDeleteResponse, AxiosError, { 
    projectId: string; 
    deletePayload: DeleteTemplatePayload 
  }>({
    mutationFn: ({ projectId, deletePayload }) => 
      templateApi.deleteTemplate(projectId, deletePayload),
    onSuccess: (_, variables) => {
      // Invalidate and refetch templates for this project
      queryClient.invalidateQueries({ queryKey: ['templates', variables.projectId] });
      
      // If deleting by template ID, remove from cache
      if (variables.deletePayload.hsm_id) {
        queryClient.removeQueries({ 
          queryKey: ['template', variables.projectId, variables.deletePayload.hsm_id] 
        });
      }
      toastUtils.success('Template deleted successfully');
    },
    onError: (error) => {
      console.error('Failed to delete template:', error.response?.data);
    },
  });
};

/**
 * Hook to sync templates from Meta
 */
export const useSyncTemplates = () => {
  const queryClient = useQueryClient();

  return useMutation<
    { fetched: number; inserted: number; deleted: number },
    AxiosError,
    { projectId: string }
  >({
    mutationFn: ({ projectId }) => templateApi.syncTemplates(projectId),
    onSuccess: (data, variables) => {
      // Invalidate and refetch templates after sync
      queryClient.invalidateQueries({ queryKey: ['templates', variables.projectId] });
      console.log('Sync completed:', data);
      toastUtils.success(
        `Sync completed.`
      );
    },
    onError: (error) => {
      console.error('Failed to sync templates:', error.response?.data);
      toastUtils.error('Failed to sync templates. Please try again.');
    },
  });
};

/**
 * Hook to refresh templates data
 */
export const useRefreshTemplates = () => {
  const queryClient = useQueryClient();

  return (projectId: string) => {
    queryClient.invalidateQueries({ queryKey: ['templates', projectId] });
  };
};

/**
 * Hook to fetch WhatsApp Business Account details
 */
export const useWabaDetails = () => {
  return useQuery<WabaDetailsResponse, AxiosError>({
    queryKey: ['waba-details'],
    queryFn: () => templateApi.getWabaDetails(),
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};

/**
 * Hook to send a template message
 */
export const useSendTemplateMessage = () => {
  return useMutation<SendTemplateMessageResponse, AxiosError, SendTemplateMessagePayload>({
    mutationFn: (payload) => templateApi.sendTemplateMessage(payload),
    onSuccess: (data) => {
      console.log('Template message sent successfully:', data);
      toastUtils.success('Template message sent successfully');
    },
    onError: (error: any) => {
      console.error('Failed to send template message:', error);
      toastUtils.error(error, 'Failed to send template message');
    },
  });
};

/**
 * Hook to send bulk template messages
 */
export const useSendBulkTemplateMessage = () => {
  return useMutation<SendBulkTemplateMessageResponse, AxiosError, SendBulkTemplateMessagePayload>({
    mutationFn: (payload) => templateApi.sendBulkTemplateMessage(payload),
    onSuccess: (data) => {
      console.log('Bulk template messages sent successfully:', data);
      toastUtils.success(`Bulk messages Processed Successfully`);
    },
    onError: (error) => {
      console.error('Failed to send bulk template messages:', error);
      toastUtils.error(error,'Failed to process bulk messages');
    },
  });
};

/**
 * Hook to exchange authorization code for WhatsApp Business Account setup
 */
export const useExchangeCode = () => {
  const queryClient = useQueryClient();

  return useMutation<ExchangeCodeResponse, AxiosError, ExchangeCodePayload>({
    mutationFn: (payload) => templateApi.exchangeCode(payload),
    onSuccess: (data) => {
      // Invalidate WABA details to refetch updated information
      queryClient.invalidateQueries({ queryKey: ['waba-details'] });
      
      // Invalidate templates for all projects since WABA setup might affect templates
      queryClient.invalidateQueries({ queryKey: ['templates'] });
      
      console.log('WhatsApp Business Account connected successfully:', data);
    },
    onError: (error) => {
      console.error('Failed to exchange authorization code:', error.response?.data);
    },
  });
};
