import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getMeetingMessages } from "@zoom/api/zoomApi";
import {
  exchangeOAuthCode,
  listZoomAccounts,
  getZoomUserProfile,
  refreshZoomAccessToken,
  disconnectZoomAccount,
  listProjectMeetings,
  type ListMeetingsOptions,
  listProjectWebinars,
  type ListWebinarsOptions,
  getWebinarDetails,
  getWebinarRegistrants,
  addWebinarRegistrant,
  getMeetingDetails,
  getMeetingRegistrants,
  addMeetingRegistrant,
  getMeetingStatus,
  type MeetingStatusResponse,
  getAllWebinars,
  updateWebinarMeetingId,
  removeWebinarMeetingId,
  type Webinar,
  getWebhookSubscriptionStatus,
  syncMeetingDetails,
  syncWebinarDetails,
} from "@zoom/api/zoomApi";
import type { OAuthExchangeRequest } from "@zoom/schemas/zoom";
import { zoomProjectsKeys } from "./useZoomProjects";

// Query keys
export const zoomKeys = {
  all: ["zoom"] as const,
  accounts: () => [...zoomKeys.all, "accounts"] as const,
  profile: (accountId: string) =>
    [...zoomKeys.all, "profile", accountId] as const,
  webhookSubscription: (projectId: string) =>
    [...zoomKeys.all, "webhook-subscription", projectId] as const,
};

// Hook to list all connected Zoom accounts
export function useZoomAccounts() {
  return useQuery({
    queryKey: zoomKeys.accounts(),
    queryFn: listZoomAccounts,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
  });
}

// Hook to get Zoom user profile for a specific account
export function useZoomUserProfile(accountId: string, enabled = true) {
  return useQuery({
    queryKey: zoomKeys.profile(accountId),
    queryFn: () => getZoomUserProfile(accountId),
    enabled: enabled && !!accountId,
    staleTime: 10 * 60 * 1000, // 10 minutes
    retry: 2,
  });
}

// Hook to get webhook subscription status for a project
export function useWebhookSubscriptionStatus(projectId: string | undefined) {
  return useQuery({
    queryKey: zoomKeys.webhookSubscription(projectId || ""),
    queryFn: () => getWebhookSubscriptionStatus(projectId!),
    enabled: !!projectId,
    staleTime: 60 * 1000, // 1 minute
    refetchInterval: 60000, // Refetch every 60 seconds
    retry: 2,
  });
}

// Hook to exchange OAuth code for access token
export function useExchangeOAuthCode(
  onSuccess?: () => void,
  onError?: (error: any) => void
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: OAuthExchangeRequest) => exchangeOAuthCode(data),
    onSuccess: async (_data, variables) => {
      // Invalidate and refetch accounts list and projects after successful OAuth exchange
      queryClient.invalidateQueries({ queryKey: zoomKeys.accounts() });
      queryClient.invalidateQueries({ queryKey: zoomProjectsKeys.all });
      // Wait for this project's detail so UI (sidebar, redirects) see isConfigured: true before navigate
      if (variables.projectId) {
        await queryClient.refetchQueries({
          queryKey: zoomProjectsKeys.detail(variables.projectId),
        });
      }
      console.log("OAuth exchange successful");
      onSuccess?.();
    },
    onError: (error) => {
      console.error("OAuth exchange failed:", error);
      onError?.(error);
    },
  });
}

// Hook to refresh Zoom access token
export function useRefreshZoomToken() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (accountId: string) => refreshZoomAccessToken(accountId),
    onSuccess: (_, accountId) => {
      // Invalidate profile query to refetch with new token
      queryClient.invalidateQueries({ queryKey: zoomKeys.profile(accountId) });
    },
    onError: (error) => {
      console.error("Token refresh failed:", error);
    },
  });
}

// Hook to disconnect a Zoom account
export function useDisconnectZoomAccount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (accountId: string) => disconnectZoomAccount(accountId),
    onSuccess: () => {
      // Invalidate accounts list after successful disconnect
      queryClient.invalidateQueries({ queryKey: zoomKeys.accounts() });
    },
    onError: (error) => {
      console.error("Account disconnect failed:", error);
    },
  });
}

// Meetings
export const meetingsKeys = {
  all: ["zoom-meetings"] as const,
  list: (
    projectId: string,
    options: { type?: string; from?: string; to?: string; pageSize?: number }
  ) =>
    [
      ...meetingsKeys.all,
      projectId,
      options.type ?? "upcoming",
      options.pageSize ?? 30,
      options.from ?? "",
      options.to ?? "",
    ] as const,
};

export function useProjectMeetings(
  projectId: string | undefined,
  options: ListMeetingsOptions = { type: "upcoming", pageSize: 30 }
) {
  return useQuery({
    queryKey: meetingsKeys.list(projectId || "", options),
    queryFn: () => listProjectMeetings(projectId!, options),
    enabled: !!projectId,
    staleTime: 60 * 1000,
  });
}

// Project Webinars
export const webinarsKeys = {
  all: ["zoom-webinars"] as const,
  list: (
    projectId: string,
    options: { type?: string; from?: string; to?: string; pageSize?: number }
  ) =>
    [
      ...webinarsKeys.all,
      projectId,
      options.type ?? "upcoming",
      options.pageSize ?? 30,
      options.from ?? "",
      options.to ?? "",
    ] as const,
};

export function useProjectWebinars(
  projectId: string | undefined,
  options: ListWebinarsOptions = { type: "upcoming", pageSize: 30 }
) {
  return useQuery({
    queryKey: webinarsKeys.list(projectId || "", options),
    queryFn: () => listProjectWebinars(projectId!, options),
    enabled: !!projectId,
    staleTime: 60 * 1000,
  });
}

// Webinar Details
export function useWebinarDetails(
  projectId: string | undefined,
  webinarId: string | undefined
) {
  return useQuery({
    queryKey: [...webinarsKeys.all, "detail", projectId || "", webinarId || ""],
    queryFn: () => getWebinarDetails(projectId!, webinarId!),
    enabled: !!projectId && !!webinarId,
    staleTime: 60 * 1000,
  });
}

export function useSyncWebinarDetails() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      projectId,
      webinarId,
    }: {
      projectId: string;
      webinarId: string;
    }) => syncWebinarDetails(projectId, webinarId),
    onSuccess: (_, variables) => {
      // Invalidate and refetch webinar details after successful sync
      queryClient.invalidateQueries({
        queryKey: [...webinarsKeys.all, "detail", variables.projectId, variables.webinarId],
      });
    },
  });
}

// Webinar Registrants
export function useWebinarRegistrants(
  projectId: string | undefined,
  webinarId: string | undefined,
  status: "pending" | "approved" | "denied" = "approved",
  page: number = 1,
  pageSize: number = 30,
  occurrenceId?: string
) {
  return useQuery({
    queryKey: [
      ...webinarsKeys.all,
      "registrants",
      projectId || "",
      webinarId || "",
      status,
      page,
      pageSize,
      occurrenceId || "",
    ],
    queryFn: () =>
      getWebinarRegistrants(projectId!, webinarId!, status, page, pageSize, occurrenceId),
    enabled: !!projectId && !!webinarId,
    staleTime: 60 * 1000,
  });
}

export function useAddWebinarRegistrant() {
  return useMutation({
    mutationFn: ({
      projectId,
      webinarId,
      payload,
    }: {
      projectId: string;
      webinarId: string;
      payload: { email: string; first_name?: string; last_name?: string };
    }) => addWebinarRegistrant(projectId, webinarId, payload),
  });
}

export function useMeetingDetails(
  projectId: string | undefined,
  meetingId: string | undefined
) {
  return useQuery({
    queryKey: [...meetingsKeys.all, "detail", projectId || "", meetingId || ""],
    queryFn: () => getMeetingDetails(projectId!, meetingId!),
    enabled: !!projectId && !!meetingId,
    staleTime: 60 * 1000,
  });
}

export function useSyncMeetingDetails() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      projectId,
      meetingId,
    }: {
      projectId: string;
      meetingId: string;
    }) => syncMeetingDetails(projectId, meetingId),
    onSuccess: (_, variables) => {
      // Invalidate and refetch meeting details after successful sync
      queryClient.invalidateQueries({
        queryKey: [...meetingsKeys.all, "detail", variables.projectId, variables.meetingId],
      });
    },
  });
}

export function useMeetingRegistrants(
  projectId: string | undefined,
  meetingId: string | undefined,
  status: "pending" | "approved" | "denied" = "approved",
  page: number = 1,
  pageSize: number = 30,
  occurrenceId?: string
) {
  return useQuery({
    queryKey: [
      ...meetingsKeys.all,
      "registrants",
      projectId || "",
      meetingId || "",
      status,
      page,
      pageSize,
      occurrenceId || "",
    ],
    queryFn: () =>
      getMeetingRegistrants(projectId!, meetingId!, status, page, pageSize, occurrenceId),
    enabled: !!projectId && !!meetingId,
    staleTime: 60 * 1000,
  });
}

export function useAddMeetingRegistrant() {
  return useMutation({
    mutationFn: ({
      projectId,
      meetingId,
      payload,
    }: {
      projectId: string;
      meetingId: string;
      payload: { email: string; first_name?: string; last_name?: string };
    }) => addMeetingRegistrant(projectId, meetingId, payload),
  });
}

// Meeting status
export const meetingStatusKeys = {
  detail: (
    meetingId: string,
    zoomProjectId?: string,
    isWebinar?: boolean,
    occurrenceId?: string
  ) =>
    [
      ...meetingsKeys.all,
      "status",
      meetingId,
      zoomProjectId || "",
      isWebinar ? "webinar" : "meeting",
      occurrenceId || "",
    ] as const,
};

export function useMeetingStatus({
  meetingId,
  isWebinar,
  zoomProjectId,
  occurrenceId,
}: {
  meetingId?: string;
  isWebinar: boolean;
  zoomProjectId?: string;
  occurrenceId?: string;
}) {
  return useQuery<MeetingStatusResponse>({
    queryKey: meetingStatusKeys.detail(
      meetingId || "",
      zoomProjectId,
      isWebinar,
      occurrenceId
    ),
    queryFn: () =>
      getMeetingStatus({
        meetingId,
        isWebinar,
        zoomProjectId,
        occurrenceId,
      }),
    enabled: !!meetingId && !!zoomProjectId,
    refetchInterval: 5000,
    staleTime: 1000,
  });
}

// Webinar hooks
export const webinarKeys = {
  all: ["webinars"] as const,
  list: () => [...webinarKeys.all, "list"] as const,
};

export function useWebinars() {
  return useQuery<Webinar[]>({
    queryKey: webinarKeys.list(),
    queryFn: getAllWebinars,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
  });
}

export function useUpdateWebinarMeetingId() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      webinarId,
      meetingId,
      occurrenceId,
    }: {
      webinarId: string;
      meetingId: string;
      occurrenceId?: string;
    }) => updateWebinarMeetingId(webinarId, meetingId, occurrenceId),
    onSuccess: () => {
      // Invalidate webinars list to refetch with updated data
      queryClient.invalidateQueries({ queryKey: webinarKeys.list() });
    },
    onError: (error) => {
      console.error("Failed to update webinar meeting ID:", error);
    },
  });
}

export function useRemoveWebinarMeetingId() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (webinarId: string) => removeWebinarMeetingId(webinarId),
    onSuccess: () => {
      // Invalidate webinars list to refetch with updated data
      queryClient.invalidateQueries({ queryKey: webinarKeys.list() });
    },
    onError: (error) => {
      console.error("Failed to remove webinar meeting ID:", error);
    },
  });
}

// Meeting messages (WABA)
export const meetingMessageKeys = {
  list: (meetingId: string, page: number, limit: number, occurrenceId?: string) =>
    [...meetingsKeys.all, "messages", meetingId, page, limit, occurrenceId] as const,
};

export function useMeetingMessages(
  meetingId: string | undefined,
  page = 1,
  limit = 10,
  enabled = true,
  occurrenceId?: string
) {
  return useQuery({
    queryKey: meetingMessageKeys.list(meetingId || "", page, limit, occurrenceId),
    queryFn: () => getMeetingMessages(meetingId!, page, limit, occurrenceId),
    enabled: enabled && !!meetingId,
    placeholderData: (prev) => prev,
    staleTime: 10 * 1000,
  });
}
