import apiClient from "@zoom/lib/axios";
import type { Participant } from "@zoom/types/zoomParticipants";
import {
  OAuthExchangeResponseSchema,
  ListAccountsResponseSchema,
  ZoomUserProfileResponseSchema,
  RefreshTokenResponseSchema,
  DisconnectResponseSchema,
  WebhookSubscriptionStatusResponseSchema,
  type OAuthExchangeRequest,
  type OAuthExchangeResponse,
  type ListAccountsResponse,
  type ZoomUserProfileResponse,
  type RefreshTokenResponse,
  type DisconnectResponse,
  type WebhookSubscriptionStatus,
} from "@zoom/schemas/zoom";

// OAuth Exchange - Exchange authorization code for access token
export async function exchangeOAuthCode(
  data: OAuthExchangeRequest
): Promise<OAuthExchangeResponse> {
  const response = await apiClient.post("/zoom/oauth/exchange", data);
  console.log(response.data);
  return OAuthExchangeResponseSchema.parse(response.data);
}

// List Zoom Accounts - Get all connected Zoom accounts for the user
export async function listZoomAccounts(): Promise<ListAccountsResponse> {
  const response = await apiClient.get("/zoom/accounts");
  return ListAccountsResponseSchema.parse(response.data);
}

// Get Zoom User Profile - Get profile information for a specific Zoom account
export async function getZoomUserProfile(
  accountId: string
): Promise<ZoomUserProfileResponse> {
  const response = await apiClient.get(`/zoom/me/${accountId}`);
  return ZoomUserProfileResponseSchema.parse(response.data);
}

// Refresh Access Token - Refresh the access token for a Zoom account
export async function refreshZoomAccessToken(
  accountId: string
): Promise<RefreshTokenResponse> {
  const response = await apiClient.post(`/zoom/oauth/refresh/${accountId}`);
  return RefreshTokenResponseSchema.parse(response.data);
}

// Disconnect Zoom Account - Remove a connected Zoom account
export async function disconnectZoomAccount(
  accountId: string
): Promise<DisconnectResponse> {
  const response = await apiClient.delete(`/zoom/accounts/${accountId}`);
  return DisconnectResponseSchema.parse(response.data);
}

// Meetings API
export interface ZoomMeeting {
  id: string;
  uuid?: string;
  topic: string;
  startTime?: string;
  duration?: number;
  status?: string;
  joinUrl?: string;
  createdAt?: string;
}

export interface ZoomMeetingsResponse {
  totalRecords: number;
  meetings: ZoomMeeting[];
}

export type ListMeetingsOptions = {
  type?: "scheduled" | "upcoming" | "live" | "past" | "pending";
  from?: string;
  to?: string;
  pageSize?: number;
};

export async function listProjectMeetings(
  projectId: string,
  options: ListMeetingsOptions = {}
): Promise<ZoomMeetingsResponse> {
  const params = {
    type: options.type ?? "upcoming",
    pageSize: options.pageSize ?? 30,
    from: options.from,
    to: options.to,
  };
  const response = await apiClient.get(`/zoom/projects/${projectId}/meetings`, {
    params,
  });
  return response.data.data as ZoomMeetingsResponse;
}

// Webinars API (project scoped)
export interface ZoomWebinar {
  id: string;
  uuid?: string;
  topic: string;
  startTime?: string;
  occurrences?: any[];
  duration?: number;
  status?: string;
  joinUrl?: string;
  createdAt?: string;
}

export interface ZoomWebinarsResponse {
  totalRecords: number;
  webinars: ZoomWebinar[];
}

export type ListWebinarsOptions = {
  type?: "upcoming";
  from?: string;
  to?: string;
  pageSize?: number;
};

export async function listProjectWebinars(
  projectId: string,
  options: ListWebinarsOptions = {}
): Promise<ZoomWebinarsResponse> {
  const params = {
    type: options.type ?? "upcoming",
    pageSize: options.pageSize ?? 30,
    from: options.from,
    to: options.to,
  };
  const response = await apiClient.get(`/zoom/projects/${projectId}/webinars`, {
    params,
  });
  return response.data.data as ZoomWebinarsResponse;
}

// Webinar details & registrants
export interface ZoomWebinarDetails extends ZoomWebinar {
  hostId?: string;
  raw?: any;
}

export async function getWebinarDetails(
  projectId: string,
  webinarId: string
): Promise<ZoomWebinarDetails> {
  const response = await apiClient.get(
    `/zoom-meeting/projects/${projectId}/webinars/${encodeURIComponent(webinarId)}`
  );
  return response.data as ZoomWebinarDetails;
}

export async function syncWebinarDetails(
  projectId: string,
  webinarId: string
): Promise<{ statusCode: number; message: string }> {
  const response = await apiClient.post(
    `/zoom-meeting/projects/${projectId}/webinars/${encodeURIComponent(webinarId)}/sync`
  );
  return response.data;
}

export async function getWebinarRegistrants(
  projectId: string,
  webinarId: string,
  status: "pending" | "approved" | "denied" = "approved",
  page: number = 1,
  pageSize: number = 30,
  occurrenceId?: string
): Promise<any> {
  const params: any = { status, page, page_size: pageSize };
  if (occurrenceId) {
    params.occurrenceId = occurrenceId;
  }
  const response = await apiClient.get(
    `/zoom/projects/${projectId}/webinars/${encodeURIComponent(
      webinarId
    )}/registrants`,
    {
      params,
    }
  );
  return response.data.data;
}

export async function addWebinarRegistrant(
  projectId: string,
  webinarId: string,
  payload: { email: string; first_name?: string; last_name?: string }
): Promise<any> {
  const response = await apiClient.post(
    `/zoom/projects/${projectId}/webinars/${encodeURIComponent(
      webinarId
    )}/registrants`,
    payload
  );
  return response.data.data;
}

// Meeting details and registrants
export async function getMeetingDetails(
  projectId: string,
  meetingId: string
): Promise<any> {
  const response = await apiClient.get(
    `/zoom-meeting/projects/${projectId}/meetings/${encodeURIComponent(meetingId)}`
  );
  return response.data;
}

export async function syncMeetingDetails(
  projectId: string,
  meetingId: string
): Promise<{ statusCode: number; message: string }> {
  const response = await apiClient.post(
    `/zoom-meeting/projects/${projectId}/meetings/${encodeURIComponent(meetingId)}/sync`
  );
  return response.data;
}

export async function getMeetingRegistrants(
  projectId: string,
  meetingId: string,
  status: "pending" | "approved" | "denied" = "approved",
  page: number = 1,
  pageSize: number = 30,
  occurrenceId?: string
): Promise<any> {
  const params: any = { status, page, page_size: pageSize };
  if (occurrenceId) {
    params.occurrenceId = occurrenceId;
  }
  const response = await apiClient.get(
    `/zoom/projects/${projectId}/meetings/${encodeURIComponent(
      meetingId
    )}/registrants`,
    {
      params,
    }
  );
  return response.data.data;
}

export async function addMeetingRegistrant(
  projectId: string,
  meetingId: string,
  payload: { email: string; first_name?: string; last_name?: string }
): Promise<any> {
  const response = await apiClient.post(
    `/zoom/projects/${projectId}/meetings/${encodeURIComponent(
      meetingId
    )}/registrants`,
    payload
  );
  return response.data.data;
}

// Meeting status (from backend Zoom events aggregator)
export interface MeetingStatusResponse {
  meetingId: string;
  accountId: string | null;
  meetingStartedAt: string | null;
  meetingEndedAt: string | null;
  isOngoing: boolean;
  counts: {
    online: number;
    joinedButLeft: number;
    totalUniqueParticipants: number;
    totalJoins: number;
    totalNotJoined: number;
    totalRegistrations: number;
  };
  participants: {
    online: Participant[];
    left: Participant[];
    notJoined: Participant[];
  };
}

export async function getMeetingStatus({
  meetingId,
  isWebinar,
  zoomProjectId,
  occurrenceId
}: {
  meetingId?: string;
  isWebinar: boolean;
  zoomProjectId?: string;
  occurrenceId?: string;
}): Promise<MeetingStatusResponse> {
  const response = await apiClient.get(
    `/zoom-event/${encodeURIComponent(meetingId || "")}`,
    { params: { isWebinar, zoomProjectId, occurrenceId } }
  );
  return response.data as MeetingStatusResponse;
}

// Webinar API
export interface Webinar {
  _id: string;
  webinarName: string;
  meetingId?: string;
  occurrenceId?: string;
  webinarDate?: string;
  adminId: string;
  assignedEmployees: string[];
  excludedEmployees: string[];
  autoAssignmentDisabled: boolean;
  productIds: string[];
  createdAt: string;
  updatedAt: string;
}

export async function getAllWebinars(): Promise<Webinar[]> {
  const response = await apiClient.get("/webinar/all");
  return response.data as Webinar[];
}

export async function updateWebinarMeetingId(
  webinarId: string,
  meetingId: string,
  occurrenceId?: string
): Promise<any> {
  const body: { meetingId: string; occurrenceId?: string } = { meetingId };
  if (occurrenceId) {
    body.occurrenceId = occurrenceId;
  }
  const response = await apiClient.patch(`/webinar/${webinarId}/meeting`, body);
  return response.data;
}

export async function removeWebinarMeetingId(webinarId: string): Promise<any> {
  const response = await apiClient.delete(`/webinar/${webinarId}/meeting`);
  return response.data;
}

// WABA Messages (meeting messages)
export interface WabaMessagePaginatedResponse {
  wabaMessages: Array<{
    _id: string;
    phoneNumber: string;
    templateName?: string;
    messageType?: string;
    status?: string;
    createdAt?: string;
    sentAt?: string;
    deliveredAt?: string;
    readAt?: string;
    failureReason?: string;
  }>;
  total: number;
  totalPages: number;
  page: number;
  limit: number;
}

export async function getMeetingMessages(
  meetingId: string,
  page = 1,
  limit = 10,
  occurrenceId?: string
): Promise<WabaMessagePaginatedResponse> {
  const response = await apiClient.get("/waba-message/paginated", {
    params: { meetingId, page, limit, occurrenceId },
  });
  return response.data as WabaMessagePaginatedResponse;
}

// Get webhook subscription status
export async function getWebhookSubscriptionStatus(
  projectId: string
): Promise<WebhookSubscriptionStatus> {
  const response = await apiClient.get(
    `/zoom/projects/${projectId}/webhook-subscription-status`
  );
  const parsedResponse = WebhookSubscriptionStatusResponseSchema.parse(
    response.data
  );
  return parsedResponse.data;
}
