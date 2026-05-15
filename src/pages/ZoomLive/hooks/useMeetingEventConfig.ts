import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import { meetingEventConfigApi } from '@zoom/services/meetingEventConfigApi';
import type {
  CreateMeetingEventConfigPayload,
  UpdateMeetingEventConfigPayload,
  MeetingEventConfigResponse,
  Project,
  ConfiguredTemplate,
} from '@zoom/schemas/meetingEventConfig';

/**
 * Hook to fetch meeting event configuration for a specific meeting/occurrence
 */
export const useMeetingEventConfig = (meetingId: string, occurrenceId?: string) => {
  return useQuery<MeetingEventConfigResponse | null, AxiosError>({
    queryKey: ['meeting-event-config', meetingId, occurrenceId || ''],
    queryFn: () =>
      meetingEventConfigApi.getMeetingEventConfig(meetingId, occurrenceId),
    enabled: !!meetingId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });
};

/**
 * Hook to fetch WhatsApp projects
 */
export const useWhatsAppProjects = () => {
  return useQuery<Project[], AxiosError>({
    queryKey: ['whatsapp-projects'],
    queryFn: () => meetingEventConfigApi.getWhatsAppProjects(),
    staleTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
  });
};

/**
 * Hook to fetch configured templates for a project
 */
export const useConfiguredTemplates = (projectId: string) => {
  return useQuery<ConfiguredTemplate[], AxiosError>({
    queryKey: ['configured-templates', projectId],
    queryFn: () => meetingEventConfigApi.getConfiguredTemplates(projectId),
    enabled: !!projectId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });
};

/**
 * Hook to create meeting event configuration
 */
export const useCreateMeetingEventConfig = () => {
  const queryClient = useQueryClient();

  return useMutation<MeetingEventConfigResponse, AxiosError, CreateMeetingEventConfigPayload>({
    mutationFn: (payload) => meetingEventConfigApi.createMeetingEventConfig(payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: ['meeting-event-config', variables.meetingId, variables.occurrenceId || ''] 
      });
      queryClient.invalidateQueries({ 
        queryKey: ['meeting-event-config'] 
      });
    },
    onError: (error) => {
      console.error('Failed to create meeting event configuration:', error.response?.data);
    },
  });
};

/**
 * Hook to update meeting event configuration
 */
export const useUpdateMeetingEventConfig = () => {
  const queryClient = useQueryClient();

  return useMutation<MeetingEventConfigResponse, AxiosError, { 
    meetingId: string;
    occurrenceId?: string;
    payload: UpdateMeetingEventConfigPayload;
  }>({
    mutationFn: ({ meetingId, occurrenceId, payload }) =>
      meetingEventConfigApi.updateMeetingEventConfig(
        meetingId,
        occurrenceId,
        payload,
      ),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: ['meeting-event-config', variables.meetingId, variables.occurrenceId || ''] 
      });
      queryClient.invalidateQueries({ 
        queryKey: ['meeting-event-config'] 
      });
    },
    onError: (error) => {
      console.error('Failed to update meeting event configuration:', error.response?.data);
    },
  });
};

/**
 * Hook to delete meeting event configuration
 */
export const useDeleteMeetingEventConfig = () => {
  const queryClient = useQueryClient();

  return useMutation<void, AxiosError, string>({
    mutationFn: (meetingId) => meetingEventConfigApi.deleteMeetingEventConfig(meetingId),
    onSuccess: (_, meetingId) => {
      queryClient.removeQueries({ 
        queryKey: ['meeting-event-config', meetingId] 
      });
      queryClient.invalidateQueries({ 
        queryKey: ['meeting-event-config'] 
      });
    },
    onError: (error) => {
      console.error('Failed to delete meeting event configuration:', error.response?.data);
    },
  });
};
