import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { instance } from "../services/axiosInterceptor";
import { toast } from "sonner";

const INTEGRATIONS_QUERY_KEY = ["integrations", "settings"];

export const useIntegrationsSettings = () => {
  return useQuery({
    queryKey: INTEGRATIONS_QUERY_KEY,
    queryFn: async () => {
      const { data } = await instance.get("/integrations/settings");
      return data;
    },
    staleTime: 2 * 60 * 1000,
  });
};

export const useUpdateIntegrationsSettings = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload) => {
      const { data } = await instance.put("/integrations/settings", payload);
      return data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(INTEGRATIONS_QUERY_KEY, data);
      toast.success("Integration settings saved successfully.");
    },
    onError: (error) => {
      const message =
        typeof error === "string"
          ? error
          : error?.response?.data?.message ||
            error?.message ||
            "Failed to save integration settings.";
      toast.error(message);
    },
  });
};
