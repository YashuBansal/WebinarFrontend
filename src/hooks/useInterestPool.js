import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { instance } from "../services/axiosInterceptor";
import { toast } from "sonner";

const SETTINGS_QUERY_KEY = ["interest-pool", "settings"];

export const useInterestPoolSettings = () => {
  return useQuery({
    queryKey: SETTINGS_QUERY_KEY,
    queryFn: async () => {
      const { data } = await instance.get("/interest-pool/settings");
      return data;
    },
    staleTime: 2 * 60 * 1000,
  });
};

export const useUpdateInterestPoolSettings = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ accountId, accessToken }) => {
      const { data } = await instance.put("/interest-pool/settings", {
        accountId: accountId.trim(),
        accessToken: accessToken.trim(),
      });
      return data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(SETTINGS_QUERY_KEY, data);
      toast.success("Interest Pool settings saved.");
    },
    onError: (error) => {
      const message =
        typeof error === "string"
          ? error
          : error?.response?.data?.message ||
            error?.message ||
            "Failed to save Interest Pool settings.";
      toast.error(message);
    },
  });
};

export const useInterestSearch = () => {
  return useMutation({
    mutationFn: async ({ accountId, accessToken, q }) => {
      const { data } = await instance.get("/fb/interest-search", {
        params: { accountId, accessToken, q: q.trim() },
      });
      if (data?.error) {
        throw new Error(data.error.message || "Facebook API error");
      }
      return data;
    },
    onError: (error) => {
      const message =
        typeof error === "string"
          ? error
          : error?.response?.data?.error?.message ||
            error?.message ||
            "Failed to fetch interests.";
      toast.error(message);
    },
  });
};
