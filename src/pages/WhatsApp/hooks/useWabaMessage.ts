import { useQuery } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { wabaMessageApi } from '@/api/modules/wabaMessageAPI';
import type {
  UniquePhoneNumbersResponse,
  EligibleContactsResponse,
} from '@/api/modules/wabaMessageAPI';

const WABA_MESSAGE_QUERY_KEY = 'wabaMessage';

/**
 * Hook to fetch all unique phone numbers for a project
 */
export const useUniquePhoneNumbers = (projectId: string | undefined) => {
  return useQuery<UniquePhoneNumbersResponse, AxiosError>({
    queryKey: [WABA_MESSAGE_QUERY_KEY, 'unique-phone-numbers', projectId],
    queryFn: () => {
      if (!projectId) {
        return Promise.reject(new Error('Project ID is required.'));
      }
      return wabaMessageApi.getUniquePhoneNumbers(projectId);
    },
    enabled: !!projectId,
    staleTime: 1000 * 60 * 2, // 2 minutes - data changes frequently with new messages
    refetchInterval: 1000 * 30, // Auto-refresh status updates
  });
};

/**
 * Hook to fetch contacts eligible for session messages (within 24h window)
 */
export const useEligibleSessionContacts = (projectId: string | undefined) => {
  return useQuery<EligibleContactsResponse, AxiosError>({
    queryKey: [WABA_MESSAGE_QUERY_KEY, 'eligible-session-contacts', projectId],
    queryFn: () => {
      if (!projectId) {
        return Promise.reject(new Error('Project ID is required.'));
      }
      return wabaMessageApi.getEligibleSessionContacts(projectId);
    },
    enabled: !!projectId,
    staleTime: 1000 * 60 * 1, // 1 minute - 24h window status changes frequently
    refetchInterval: 1000 * 30, // Auto-refresh status updates
  });
};

