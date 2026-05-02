import { useMutation, useQueryClient } from '@tanstack/react-query';
import { whatsappApi } from '../api/modules/whatsappApi';
import type { ExchangeCodeApiResponse } from '../schemas';
import { ZodError } from 'zod';

// const EMBEDDED_SIGNUP_QUERY_KEY = ['embeddedSignup'];

export const useEmbeddedSignup = () => {
  const queryClient = useQueryClient();

  /**
   * Mutation to exchange authorization code for WABA connection
   */
  const useExchangeCode = () => {
    return useMutation<ExchangeCodeApiResponse, Error, { code: string; projectId: string }>({
      mutationFn: ({ code, projectId }) => whatsappApi.exchangeCode(code, projectId),
      onSuccess: (data) => {
        console.log('WhatsApp Business Account connected successfully:', data);
        // Invalidate project queries to refresh project data with new WABA connection
        queryClient.invalidateQueries({ queryKey: ['projects'] });
        // Invalidate current project query if it exists
        queryClient.invalidateQueries({ queryKey: ['projects', 'current'] });
      },
      onError: (error) => {
        if (error instanceof ZodError) {
          console.error('Exchange code failed: Validation error', error.flatten());
        } else {
          console.error('Exchange code failed:', error.message);
        }
      },
    });
  };

  return { useExchangeCode };
};
