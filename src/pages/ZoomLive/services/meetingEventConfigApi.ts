import { apiGet, apiPost, apiPatch, apiDelete } from '@zoom/services/api';
import type {
  CreateMeetingEventConfigPayload,
  UpdateMeetingEventConfigPayload,
  MeetingEventConfigResponse,
  Project,
  ConfiguredTemplate,
  MeetingEventConfigApiResponse,
  ConfiguredTemplatesApiResponse,
} from '@zoom/schemas/meetingEventConfig';

/**
 * Get meeting event configuration for a specific meeting
 */
export const getMeetingEventConfig = async (
  meetingId: string,
  occurrenceId?: string,
): Promise<MeetingEventConfigResponse | null> => {
  const query = occurrenceId
    ? `?occurrenceId=${encodeURIComponent(occurrenceId)}`
    : '';
  const response = await apiGet<MeetingEventConfigApiResponse>(
    `/meeting-event-config/${meetingId}${query}`,
  );
  return response.data;
};

/**
 * Create meeting event configuration
 */
export const createMeetingEventConfig = async (
  payload: CreateMeetingEventConfigPayload
): Promise<MeetingEventConfigResponse> => {
  const response = await apiPost<MeetingEventConfigApiResponse>('/meeting-event-config', payload);
  return response.data!;
};

/**
 * Update meeting event configuration
 */
export const updateMeetingEventConfig = async (
  meetingId: string,
  occurrenceId: string | undefined,
  payload: UpdateMeetingEventConfigPayload
): Promise<MeetingEventConfigResponse> => {
  const query = occurrenceId
    ? `?occurrenceId=${encodeURIComponent(occurrenceId)}`
    : '';
  const response = await apiPatch<MeetingEventConfigApiResponse>(
    `/meeting-event-config/${meetingId}${query}`,
    payload,
  );
  return response.data!;
};

/**
 * Delete meeting event configuration
 */
export const deleteMeetingEventConfig = async (
  meetingId: string,
  occurrenceId?: string,
): Promise<void> => {
  const query = occurrenceId
    ? `?occurrenceId=${encodeURIComponent(occurrenceId)}`
    : '';
  await apiDelete(`/meeting-event-config/${meetingId}${query}`);
};


/**
 * Get WhatsApp projects for the current admin
 */
export const getWhatsAppProjects = async (): Promise<Project[]> => {
  const response = await apiGet<Project[]>('/projects/whatsapp');
  return response || [];
};

/**
 * Get configured templates for a specific project
 */
export const getConfiguredTemplates = async (
  projectId: string
): Promise<ConfiguredTemplate[]> => {
  const response = await apiGet<ConfiguredTemplatesApiResponse>(`/configured-templates/${projectId}`);
  return response.data.data || [];
};

export const meetingEventConfigApi = {
  getMeetingEventConfig,
  createMeetingEventConfig,
  updateMeetingEventConfig,
  deleteMeetingEventConfig, 
  getWhatsAppProjects,
  getConfiguredTemplates,
};
