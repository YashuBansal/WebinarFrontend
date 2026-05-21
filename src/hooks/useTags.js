import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import tagsService, { normalizeTagsListResponse } from "../services/tagsService";
import { instance } from "../services/axiosInterceptor";
import { toast } from "sonner";

export const useTags = () => {
  return useQuery({
    queryKey: ["tags"],
    queryFn: async () => {
      const response = await tagsService.getTags();
      return normalizeTagsListResponse(response);
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useUpdateAttendeeTag = (email, onSuccessCallback) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ tag, action }) => {
      const response = await tagsService.updateAttendeeAssociationTag(
        email,
        tag,
        action,
      );
      if (!response?.success) {
        throw new Error(response?.message || "Failed to update tag");
      }
      return { data: response.data, action };
    },
    onSuccess: ({ data, action }) => {
      // Invalidate attendee association query to refetch updated data
      queryClient.invalidateQueries({
        queryKey: ["attendee-association", email],
      });
      // Also invalidate the general attendee association queries
      queryClient.invalidateQueries({
        queryKey: ["attendee-association"],
      });
      // Call optional callback to refetch Redux data if provided
      if (onSuccessCallback) {
        onSuccessCallback();
      }
      toast.success(
        `Tag ${action === "add" ? "added" : "removed"} successfully`,
      );
    },
    onError: (error) => {
      toast.error(error?.message || "Failed to update tag");
    },
  });
};

// Bulk apply a tag to a list of attendee emails (uses /attendees/tag)
export const useBulkApplyTagsToEmails = (onSuccessCallback) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ emails, webinarId, tag }) => {
      const body = { emails, tag };
      if (webinarId) {
        body.webinar = webinarId;
      }

      const response = await instance.put(`/attendees/tag`, body);

      // Axios instance returns the full response; normalize like other hooks
      const data = response?.data || response;
      return data;
    },
    onSuccess: () => {
      // Let caller decide what to refetch (Redux / queries)
      if (onSuccessCallback) {
        onSuccessCallback();
      }
      toast.success("Tag applied successfully");
    },
    onError: (error) => {
      toast.error(error?.message || "Failed to apply tag");
    },
  });
};

// Bulk apply a tag to webinar attendees matching filters (uses /attendees/tag-by-filters)
export const useBulkApplyTagsByFilters = (onSuccessCallback) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload) => {
      // payload should contain: { webinarId, isAttended, filters, validCall, assignmentType, tag }
      const response = await instance.put(`/attendees/tag-by-filters`, payload);

      const data = response?.data || response;

      return data;
    },
    onSuccess: () => {
      if (onSuccessCallback) {
        onSuccessCallback();
      }
      toast.success("Tags applied successfully to matching attendees");
    },
    onError: (error) => {
      toast.error(error?.message || "Failed to apply tags to attendees");
    },
  });
};

// Bulk apply a tag to ALL attendees matching grouped filters (uses /attendees/tag-grouped)
export const useBulkApplyTagsToAllAttendees = (onSuccessCallback) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload) => {
      // payload: { filters, sort, tag }
      const response = await instance.put(`/attendees/tag-grouped`, payload);
      const data = response?.data || response;
      return data;
    },
    onSuccess: () => {
      if (onSuccessCallback) {
        onSuccessCallback();
      }
      toast.success("Tags applied successfully to matching attendees");
    },
    onError: (error) => {
      toast.error(error?.message || "Failed to apply tags to attendees");
    },
  });
};

// Bulk apply a tag to employee assignments (uses /assignment/tag-employee-assignments/:empId)
export const useApplyTagsToEmployeeAssignments = (empId, onSuccessCallback) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload) => {
      const response = await instance.put(
        `/assignment/tag-employee-assignments/${empId}`,
        payload,
      );
      const data = response?.data || response;
      return data;
    },
    onSuccess: () => {
      if (onSuccessCallback) {
        onSuccessCallback();
      }
      toast.success("Tags applied successfully to employee assignments");
    },
    onError: (error) => {
      toast.error(
        error?.message || "Failed to apply tags to employee assignments",
      );
    },
  });
};
