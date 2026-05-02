import { useQuery } from "@tanstack/react-query";
import api from "@/api/axios";
import {
  MessageHistoryResponseSchema,
  type MessageHistoryResponse,
  type MessageType,
} from "@/schemas/wabaMessageSchema";

export type DatePreset = "today" | "yesterday" | "lastWeek" | "custom" | null;

export const useWabaMessages = (
  projectId: string,
  page: number = 1,
  limit: number = 10,
  options?: {
    datePreset?: DatePreset;
    startDate?: string | null;
    endDate?: string | null;
    messageType?: MessageType | null;
  }
) => {
  const datePreset = options?.datePreset ?? null;
  const startDate = options?.startDate ?? null;
  const endDate = options?.endDate ?? null;
  const messageType = options?.messageType ?? null;

  return useQuery<MessageHistoryResponse>({
    queryKey: [
      "waba-messages",
      projectId,
      page,
      limit,
      datePreset,
      startDate,
      endDate,
      messageType,
    ],
    queryFn: async () => {
      if (!projectId) {
        throw new Error("Project ID is required");
      }

      const params: any = { page, limit };
      if (datePreset) {
        params.datePreset = datePreset;
        if (datePreset === "custom" && (startDate || endDate)) {
          if (startDate) {
            params.startDate = startDate;
          }
          if (endDate) {
            params.endDate = endDate;
          }
        }
      }
      if (messageType) {
        params.messageType = messageType;
      }
      try {
        const response = await api.get(`/projects/waba-messages/${projectId}`, {
          params,
        });

        const validatedData = MessageHistoryResponseSchema.parse(response.data);
        return validatedData;
      } catch (error) {
        console.error(error);
        throw error;
      }
    },
    enabled: !!projectId,
    staleTime: 30000,
    refetchOnWindowFocus: false,
  });
};
