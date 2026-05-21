import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ZodError } from 'zod';
import type { AxiosError } from 'axios';
import { profileApi } from '@/api/modules/profileAPI';
import type {
  BusinessProfile,
  UpdateBusinessProfilePayload,
  DisplayNameStatus,
  ProfilePictureUploadData,
  WebhookSubscriptionStatus,
} from '@/schemas/profileSchema';

// The base query key for all profile-related queries.
const PROFILE_QUERY_KEY = 'profile';

/**
 * Hook to fetch business profile information
 * @param projectId - The project ID to fetch profile for
 */
export const useBusinessProfile = (projectId: string | undefined) => {
  return useQuery<BusinessProfile, AxiosError>({
    queryKey: [PROFILE_QUERY_KEY, projectId],
    queryFn: () => {
      if (!projectId) {
        return Promise.reject(new Error('Project ID is required.'));
      }
      return profileApi.getBusinessProfile(projectId);
    },
    enabled: !!projectId,
    retry: false,
  });
};

/**
 * Hook to fetch display name status
 * @param projectId - The project ID to fetch status for
 */
export const useDisplayNameStatus = (projectId: string | undefined) => {
  return useQuery<DisplayNameStatus, AxiosError>({
    queryKey: [PROFILE_QUERY_KEY, 'display-name-status', projectId],
    queryFn: () => {
      if (!projectId) {
        return Promise.reject(new Error('Project ID is required.'));
      }
      return profileApi.getDisplayNameStatus(projectId);
    },
    enabled: !!projectId,
    refetchInterval: 30000, // Refetch every 30 seconds to check for status updates
  });
};

/**
 * Hook to fetch webhook subscription status
 * @param projectId - The project ID to fetch status for
 */
export const useWebhookSubscriptionStatus = (
  projectId: string | undefined,
) => {
  return useQuery<WebhookSubscriptionStatus, AxiosError>({
    queryKey: [PROFILE_QUERY_KEY, 'webhook-subscription', projectId],
    queryFn: () => {
      if (!projectId) {
        return Promise.reject(new Error('Project ID is required.'));
      }
      return profileApi.getWebhookSubscriptionStatus(projectId);
    },
    enabled: !!projectId,
    refetchInterval: 60000, // Refetch every 60 seconds to check for status updates
  });
};

/**
 * A custom hook that provides mutation functions for profile management
 */
export const useProfileMutations = () => {
  const queryClient = useQueryClient();

  /**
   * Mutation to update business profile
   */
  const useUpdateBusinessProfile = () => {
    return useMutation<
      { success: boolean },
      Error,
      { projectId: string; payload: UpdateBusinessProfilePayload }
    >({
      mutationFn: ({ projectId, payload }) =>
        profileApi.updateBusinessProfile(projectId, payload),
      onSuccess: (_, variables) => {
        console.log('Business profile updated successfully');
        // Invalidate profile queries to refetch updated data
        queryClient.invalidateQueries({
          queryKey: [PROFILE_QUERY_KEY, variables.projectId],
        });
        // Also invalidate display name status
        queryClient.invalidateQueries({
          queryKey: [PROFILE_QUERY_KEY, 'display-name-status', variables.projectId],
        });
      },
      onError: (error) => {
        if (error instanceof ZodError) {
          console.error('Profile update failed: Validation error', error.flatten());
        } else {
          console.error('Profile update failed:', error.message);
        }
      },
    });
  };

  /**
   * Mutation to upload profile picture
   */
  const useUploadProfilePicture = () => {
    return useMutation<
      ProfilePictureUploadData,
      Error,
      { projectId: string; file: File }
    >({
      mutationFn: ({ projectId, file }) =>
        profileApi.uploadProfilePicture(projectId, file),
      onSuccess: async (data, variables) => {
        console.log('Profile picture uploaded successfully');
        // Immediately call profile update with the returned handle so Meta applies it
        try {
          await profileApi.updateBusinessProfile(variables.projectId, {
            profilePictureHandle: data.fileHandle,
          });
        } catch (e) {
          console.error('Failed to apply profile picture handle:', (e as Error).message);
        }
        // Invalidate profile queries to refetch updated data
        queryClient.invalidateQueries({
          queryKey: [PROFILE_QUERY_KEY, variables.projectId],
        });
      },
      onError: (error) => {
        console.error('Profile picture upload failed:', error.message);
      },
    });
  };

  /**
   * Mutation to subscribe webhook
   */
  const useSubscribeWebhook = () => {
    return useMutation<
      { success: boolean },
      Error,
      { projectId: string }
    >({
      mutationFn: ({ projectId }) =>
        profileApi.subscribeWebhook(projectId),
      onSuccess: (_, variables) => {
        console.log('Webhook subscription successful');
        // Invalidate webhook subscription status query to refetch
        queryClient.invalidateQueries({
          queryKey: [PROFILE_QUERY_KEY, 'webhook-subscription', variables.projectId],
        });
      },
      onError: (error) => {
        console.error('Webhook subscription failed:', error.message);
      },
    });
  };

  /**
   * Mutation to sync business profile from Meta into local cache
   */
  const useSyncBusinessProfile = () => {
    return useMutation<
      BusinessProfile,
      Error,
      { projectId: string }
    >({
      mutationFn: ({ projectId }) =>
        profileApi.syncBusinessProfile(projectId),
      onSuccess: (_, variables) => {
        console.log('Business profile synced successfully');
        // Invalidate business profile
        queryClient.invalidateQueries({
          queryKey: [PROFILE_QUERY_KEY, variables.projectId],
        });
        // Also invalidate display name status so it refreshes after sync
        queryClient.invalidateQueries({
          queryKey: [PROFILE_QUERY_KEY, 'display-name-status', variables.projectId],
        });
      },
      onError: (error) => {
        console.error('Business profile sync failed:', error.message);
      },
    });
  };

  return {
    useUpdateBusinessProfile,
    useUploadProfilePicture,
    useSubscribeWebhook,
    useSyncBusinessProfile,
  };
};
