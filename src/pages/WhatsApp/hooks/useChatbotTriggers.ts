import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { AxiosError } from "axios";
import {
  chatbotTriggersApi,
  type ChatbotTriggerPayload,
  type ChatbotTriggerUpdatePayload,
  type ChatbotTriggerResponse,
} from "@/api/modules/chatbotTriggers";
import { toast } from "sonner";
import { toastUtils } from "@/lib/utils";

export const useChatbotTriggers = (projectId?: string) => {
  return useQuery<ChatbotTriggerResponse[], AxiosError>({
    queryKey: ["chatbot-triggers", projectId],
    queryFn: () => chatbotTriggersApi.listTriggers(projectId!),
    enabled: !!projectId,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
};

export const useCreateChatbotTrigger = () => {
  const queryClient = useQueryClient();

  return useMutation<
    ChatbotTriggerResponse,
    AxiosError,
    ChatbotTriggerPayload
  >({
    mutationFn: (payload) => chatbotTriggersApi.createTrigger(payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["chatbot-triggers", variables.projectId],
      });
      toastUtils.success("Trigger created");
    },
    onError: (error: any) => {
      console.error("Failed to create trigger:", error);
      toastUtils.error(error, "Failed to create trigger");
    },
  });
};

export const useUpdateChatbotTrigger = () => {
  const queryClient = useQueryClient();

  return useMutation<
    ChatbotTriggerResponse,
    AxiosError,
    { triggerId: string; projectId: string } & ChatbotTriggerUpdatePayload
  >({
    mutationFn: ({ triggerId, projectId, ...payload }) =>
      chatbotTriggersApi.updateTrigger(triggerId, projectId, payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["chatbot-triggers", variables.projectId],
      });
      toastUtils.success("Trigger updated");
    },
    onError: (error: any) => {
      console.error("Failed to update trigger:", error);
      toastUtils.error(error, "Failed to update trigger");
    },
  });
};

export const useDeleteChatbotTrigger = () => {
  const queryClient = useQueryClient();

  return useMutation<void, AxiosError, { triggerId: string; projectId: string }>({
    mutationFn: ({ triggerId, projectId }) =>
      chatbotTriggersApi.deleteTrigger(triggerId, projectId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["chatbot-triggers", variables.projectId],
      });
      toast.success("Trigger deleted");
    },
    onError: (error: any) => {
      console.error("Failed to delete trigger:", error);
      toast.error(error?.response?.data?.message ?? "Failed to delete trigger");
    },
  });
};

export const useToggleChatbotTrigger = () => {
  const queryClient = useQueryClient();

  return useMutation<
    ChatbotTriggerResponse,
    AxiosError,
    { triggerId: string; projectId: string; enabled: boolean }
  >({
    mutationFn: ({ triggerId, projectId, enabled }) =>
      chatbotTriggersApi.updateTrigger(triggerId, projectId, { enabled }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["chatbot-triggers", variables.projectId],
      });
      toast.success(
        `Trigger ${variables.enabled ? "enabled" : "disabled"}`
      );
    },
    onError: (error: any) => {
      console.error("Failed to toggle trigger:", error);
      toast.error("Failed to toggle trigger");
    },
  });
};
