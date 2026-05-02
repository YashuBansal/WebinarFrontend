import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ZodError } from 'zod';
import type { AxiosError } from 'axios';
import { contactsApi } from '@/api/modules/contactsAPI';
import type {
  CreateContactPayload,
  UpdateContactPayload,
  BulkCreateContactsPayload,
  BulkCreateContactsResponse,
  BulkDeleteContactsPayload,
  BulkDeleteContactsResponse,
  BulkUpdateContactTagsPayload,
  BulkUpdateContactTagsResponse,
  PaginatedContactsResponse,
  Contact,
  ContactFilters,
  ContactStats,
  ImportHistoryListResponse,
  ImportHistoryDetailResponse,
} from '@/schemas/contactSchema';
import { toastUtils } from '@/lib/utils';

// The base query key for all contact-related queries.
const CONTACTS_QUERY_KEY = 'contacts';
const WABA_TAGS_QUERY_KEY = 'waba-tags';

/**
 * Hook to fetch a paginated list of contacts with traditional pagination.
 * @param params - Query parameters including page, limit, and filters.
 */
export const useContacts = (params?: {
  page?: number;
  limit?: number;
  filters?: ContactFilters;
}) => {
  return useQuery<PaginatedContactsResponse, AxiosError>({
    queryKey: [CONTACTS_QUERY_KEY, 'list', params],
    queryFn: () => contactsApi.getContacts(params),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

/**
 * Hook to fetch contacts by project ID.
 * @param projectId - The project ID to filter contacts by.
 * @param params - Additional query parameters.
 */
export const useContactsByProject = (
  projectId: string | undefined,
  params?: { page?: number; limit?: number }
) => {
  return useQuery<PaginatedContactsResponse, AxiosError>({
    queryKey: [CONTACTS_QUERY_KEY, 'project', projectId, params],
    queryFn: () => {
      if (!projectId) {
        return Promise.reject(new Error('Project ID is required.'));
      }
      return contactsApi.getContactsByProject(projectId, params);
    },
    enabled: !!projectId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

/**
 * Hook to fetch a single contact by its ID.
 * @param contactId - The ID of the contact to fetch.
 */
export const useContact = (contactId: string | undefined) => {
  return useQuery<Contact, AxiosError>({
    queryKey: [CONTACTS_QUERY_KEY, contactId],
    queryFn: () => {
      if (!contactId) {
        return Promise.reject(new Error('Contact ID is required.'));
      }
      return contactsApi.getContactById(contactId);
    },
    enabled: !!contactId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

/**
 * Hook to fetch contact statistics.
 */
export const useContactStats = () => {
  return useQuery<ContactStats, AxiosError>({
    queryKey: [CONTACTS_QUERY_KEY, 'stats'],
    queryFn: () => contactsApi.getContactStats(),
    staleTime: 1000 * 60 * 10, // 10 minutes
  });
};

export const useImportHistory = (params?: {
  page?: number;
  limit?: number;
  projectId?: string;
  status?: 'queued' | 'processing' | 'success' | 'failed' | 'partial_success';
}) => {
  return useQuery<ImportHistoryListResponse, AxiosError>({
    queryKey: [CONTACTS_QUERY_KEY, 'import-history', params],
    queryFn: () => contactsApi.getImportHistory(params),
    enabled: !!params?.projectId,
    staleTime: 1000 * 15,
    refetchInterval: (query) => {
      const list = query.state.data?.imports || [];
      const hasRunning = list.some(
        (item) => item.status === 'queued' || item.status === 'processing',
      );
      return hasRunning ? 3000 : false;
    },
  });
};

export const useImportHistoryById = (importHistoryId?: string) => {
  return useQuery<ImportHistoryDetailResponse, AxiosError>({
    queryKey: [CONTACTS_QUERY_KEY, 'import-history-detail', importHistoryId],
    queryFn: () => {
      if (!importHistoryId) return Promise.reject(new Error('Import history id is required'));
      return contactsApi.getImportHistoryById(importHistoryId);
    },
    enabled: !!importHistoryId,
    staleTime: 1000 * 5,
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      return status === 'queued' || status === 'processing' ? 3000 : false;
    },
  });
};

/**
 * A custom hook that provides mutation functions for creating, updating,
 * and deleting contacts. This groups related mutations together.
 */
export const useContactMutations = () => {
  const queryClient = useQueryClient();

  /**
   * Mutation to create a new contact.
   */
  const useCreateContact = () => {
    return useMutation<Contact, Error, CreateContactPayload>({
      mutationFn: contactsApi.createContact,
      onSuccess: () => {
        console.log('Contact created successfully');
        queryClient.invalidateQueries({ queryKey: [CONTACTS_QUERY_KEY] });
        // Backend auto-creates missing WABA tags during contact import,
        // so tags list/caches must refresh too.
        queryClient.invalidateQueries({ queryKey: [WABA_TAGS_QUERY_KEY] });
      },
      onError: (error: any) => {
        if (error instanceof ZodError) {
          console.error('Contact creation failed: Validation error', error.flatten());
        } else {
          console.error('Contact creation failed:', error.message);
        }
        console.log(error)
      toastUtils.error(error?.response?.data?.message,  'Failed to create contact');

      },
    });
  };

  /**
   * Mutation to update an existing contact.
   */
  const useUpdateContact = () => {
    return useMutation<Contact, Error, { contactId: string; payload: UpdateContactPayload }>({
      mutationFn: ({ contactId, payload }) => contactsApi.updateContact(contactId, payload),
      onSuccess: () => {
        console.log('Contact updated successfully');
        // Invalidate all contact lists
        queryClient.invalidateQueries({ queryKey: [CONTACTS_QUERY_KEY] });
        
        // Optimistically update the specific contact's query cachex
        // queryClient.setQueryData([CONTACTS_QUERY_KEY, updatedContact._id], updatedContact);
      },
      onError: (error, variables) => {
        console.error(`Contact update failed for ID ${variables.contactId}:`, error.message);
      },
    });
  };

  /**
   * Mutation to delete a contact.
   */
  const useDeleteContact = () => {
    return useMutation<Contact, Error, string>({
      mutationFn: (contactId) => contactsApi.deleteContact(contactId),
      onSuccess: (deletedContact) => {
        console.log('Contact deleted successfully');
        // After deletion, invalidate the list queries to remove the item from the UI
        queryClient.invalidateQueries({ queryKey: [CONTACTS_QUERY_KEY] });

        // Immediately remove the deleted contact's specific query from the cache
        queryClient.removeQueries({ queryKey: [CONTACTS_QUERY_KEY, deletedContact._id] });
      },
      onError: (error, contactId) => {
        console.error(`Failed to delete contact with ID ${contactId}:`, error.message);
      },
    });
  };

  /**
   * Mutation to bulk create contacts.
   */
  const useBulkCreateContacts = () => {
    return useMutation<BulkCreateContactsResponse, Error, BulkCreateContactsPayload>({
      mutationFn: contactsApi.bulkCreateContacts,
      onSuccess: (result) => {
        if (result.summary) {
          console.log(
            `Bulk create completed: ${result.summary.newCount} created, ${result.summary.failedCount} failed`,
          );
        } else {
          console.log(`Bulk import queued: history ${result.importHistoryId}`);
        }
        // Invalidate all contact-related queries
        queryClient.invalidateQueries({ queryKey: [CONTACTS_QUERY_KEY] });
        queryClient.invalidateQueries({ queryKey: [CONTACTS_QUERY_KEY, 'import-history'] });
        // Backend may auto-create missing tags during bulk import.
        queryClient.invalidateQueries({ queryKey: [WABA_TAGS_QUERY_KEY] });
      },
      onError: (error) => {
        if (error instanceof ZodError) {
          console.error('Bulk contact creation failed: Validation error', error.flatten());
        } else {
          console.error('Bulk contact creation failed:', error.message);
        }
      },
    });
  };

  /**
   * Mutation to bulk delete contacts.
   */
  const useBulkDeleteContacts = () => {
    return useMutation<BulkDeleteContactsResponse, Error, BulkDeleteContactsPayload>({
      mutationFn: contactsApi.bulkDeleteContacts,
      onSuccess: (result) => {
        console.log(`Bulk delete completed: ${result.deleted.length} deleted, ${result.failed.length} failed`);
        // Invalidate all contact-related queries
        queryClient.invalidateQueries({ queryKey: [CONTACTS_QUERY_KEY] });
      },
      onError: (error) => {
        if (error instanceof ZodError) {
          console.error('Bulk contact deletion failed: Validation error', error.flatten());
        } else {
          console.error('Bulk contact deletion failed:', error.message);
        }
      },
    });
  };

  /**
   * Mutation to bulk add/remove tags on selected contacts.
   */
  const useBulkUpdateContactTags = () => {
    return useMutation<BulkUpdateContactTagsResponse, Error, BulkUpdateContactTagsPayload>({
      mutationFn: contactsApi.bulkUpdateContactTags,
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: [CONTACTS_QUERY_KEY] });
        queryClient.invalidateQueries({ queryKey: [WABA_TAGS_QUERY_KEY] });
      },
      onError: (error) => {
        console.error('Bulk contact tags update failed:', error.message);
      },
    });
  };

  return {
    useCreateContact,
    useUpdateContact,
    useDeleteContact,
    useBulkCreateContacts,
    useBulkDeleteContacts,
    useBulkUpdateContactTags,
  };
};
