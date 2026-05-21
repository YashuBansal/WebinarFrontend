import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ZodError } from 'zod';
import type { AxiosError } from 'axios';
import { wabaTagsApi } from '@/api/modules/tagsAPI';
import type {
  CreateWabaTagPayload,
  UpdateWabaTagPayload,
  WabaTag,
  WabaTagFilters,
  WLHTag,
} from '@/schemas/tagSchema';

// The base query key for all waba tag-related queries.
const WABA_TAGS_QUERY_KEY = 'waba-tags';
const WLH_TAGS_QUERY_KEY = 'wlh-tags';
const CONTACTS_QUERY_KEY = 'contacts';

/**
 * Hook to fetch a list of waba tags with optional filters.
 * @param filters - Query parameters including search filters and project ID.
 */
export const useWabaTags = (filters?: WabaTagFilters) => {
  return useQuery<WabaTag[], AxiosError>({
    queryKey: [WABA_TAGS_QUERY_KEY, 'list', filters],
    queryFn: () => wabaTagsApi.getWabaTags(filters),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

export const useWLHTags = () => {
  return useQuery<WLHTag[], AxiosError>({
    queryKey: [WLH_TAGS_QUERY_KEY, 'list'],
    queryFn: () => wabaTagsApi.getWLHTags(),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

/**
 * Hook to fetch waba tags by project ID.
 * @param projectId - The project ID to filter tags by.
 */
export const useWabaTagsByProject = (projectId: string | undefined) => {
  return useQuery<WabaTag[], AxiosError>({
    queryKey: [WABA_TAGS_QUERY_KEY, 'project', projectId],
    queryFn: () => {
      if (!projectId) {
        return Promise.reject(new Error('Project ID is required.'));
      }
      return wabaTagsApi.getWabaTagsByProject(projectId);
    },
    enabled: !!projectId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

/**
 * Hook to fetch a single waba tag by its ID.
 * @param tagId - The ID of the tag to fetch.
 */
export const useWabaTag = (tagId: string | undefined) => {
  return useQuery<WabaTag, AxiosError>({
    queryKey: [WABA_TAGS_QUERY_KEY, tagId],
    queryFn: () => {
      if (!tagId) {
        return Promise.reject(new Error('Tag ID is required.'));
      }
      return wabaTagsApi.getWabaTagById(tagId);
    },
    enabled: !!tagId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

/**
 * A custom hook that provides mutation functions for creating, updating,
 * and deleting waba tags. This groups related mutations together.
 */
export const useWabaTagMutations = () => {
  const queryClient = useQueryClient();

  /**
   * Mutation to create a new waba tag.
   */
  const useCreateWabaTag = () => {
    return useMutation<WabaTag, Error, CreateWabaTagPayload>({
      mutationFn: wabaTagsApi.createWabaTag,
      onSuccess: () => {
        console.log('WABA Tag created successfully');
        // Invalidate all waba tag-related queries
        queryClient.invalidateQueries({ queryKey: [WABA_TAGS_QUERY_KEY] });
      },
      onError: (error) => {
        if (error instanceof ZodError) {
          console.error('WABA Tag creation failed: Validation error', error.flatten());
        } else {
          console.error('WABA Tag creation failed:', error.message);
        }
      },
    });
  };

  /**
   * Mutation to update an existing waba tag.
   */
  const useUpdateWabaTag = () => {
    return useMutation<WabaTag, Error, { tagId: string; payload: UpdateWabaTagPayload }>({
      mutationFn: ({ tagId, payload }) => wabaTagsApi.updateWabaTag(tagId, payload),
      onSuccess: (updatedTag) => {
        console.log('WABA Tag updated successfully');
        // Invalidate all waba tag lists
        queryClient.invalidateQueries({ queryKey: [WABA_TAGS_QUERY_KEY] });
        queryClient.invalidateQueries({ queryKey: [CONTACTS_QUERY_KEY] });
        
        // Optimistically update the specific tag's query cache
        queryClient.setQueryData([WABA_TAGS_QUERY_KEY, updatedTag._id], updatedTag);
      },
      onError: (error, variables) => {
        console.error(`WABA Tag update failed for ID ${variables.tagId}:`, error.message);
      },
    });
  };

  /**
   * Mutation to delete a waba tag.
   */
  const useDeleteWabaTag = () => {
    return useMutation<WabaTag, Error, string>({
      mutationFn: (tagId) => wabaTagsApi.deleteWabaTag(tagId),
      onSuccess: (deletedTag) => {
        console.log('WABA Tag deleted successfully');
        // After deletion, invalidate the list queries to remove the item from the UI
        queryClient.invalidateQueries({ queryKey: [WABA_TAGS_QUERY_KEY] });
        queryClient.invalidateQueries({ queryKey: [CONTACTS_QUERY_KEY] });

        // Immediately remove the deleted tag's specific query from the cache
        queryClient.removeQueries({ queryKey: [WABA_TAGS_QUERY_KEY, deletedTag._id] });
      },
      onError: (error, tagId) => {
        console.error(`Failed to delete WABA tag with ID ${tagId}:`, error.message);
      },
    });
  };

  return {
    useCreateWabaTag,
    useUpdateWabaTag,
    useDeleteWabaTag,
  };
};
