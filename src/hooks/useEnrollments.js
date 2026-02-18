import { useQuery, useMutation } from "@tanstack/react-query";
import { instance } from "../services/axiosInterceptor";
import { successToast, errorToast } from "../utils/extra";

export const useProductsForAdmin = () => {
  return useQuery({
    queryKey: ["products", "all"],
    queryFn: async () => {
      const { data } = await instance.get(`/products/all`);
      return Array.isArray(data) ? data : data?.result || [];
    },
    staleTime: 5 * 60 * 1000,
  });
};

export const useBulkCreateEnrollments = (onSuccessCallback) => {
  return useMutation({
    mutationFn: async (payload) => {
      const { data } = await instance.post(
        `/enrollments/bulk-webinar`,
        payload
      );
      return data;
    },
    onSuccess: (data) => {
      const { createdCount, skippedExisting, totalCandidates } = data || {};
      successToast(
        `Enrollments created: ${createdCount || 0} (${skippedExisting || 0} already existed). Total attendees: ${totalCandidates || 0}.`
      );
      if (onSuccessCallback) {
        onSuccessCallback();
      }
    },
    onError: (error) => {
      const message =
        error?.response?.data?.message || error?.message || "Failed to create enrollments.";
      errorToast(message);
    },
  });
};

