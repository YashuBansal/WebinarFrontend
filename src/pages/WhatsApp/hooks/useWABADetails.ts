import { useMutation } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import { projectsApi } from '@/api/modules/projectsAPI';
import type { FetchWabaDetailsPayload, WABADetails } from '@/schemas/wabaSchema';

/**
 * Hook to fetch WhatsApp Business Account details
 */
export const useWABADetails = () => {
  return useMutation<WABADetails, AxiosError, FetchWabaDetailsPayload>({
    mutationFn: (payload) => projectsApi.getWABADetails(payload),
    onError: (error) => {
      // You can add custom error handling here
      console.error('Failed to fetch WABA details:', error.response?.data);
    },
  });
};