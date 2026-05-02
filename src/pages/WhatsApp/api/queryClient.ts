import { QueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import type { ApiError } from '../types';
import { ZodError } from 'zod';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      refetchOnWindowFocus: false,
      retry: (failureCount, error) => {
        // Do not retry on Zod validation errors
        if (error instanceof ZodError) {
          return false;
        }

        const axiosError = error as AxiosError<ApiError>;
        // Do not retry on 4xx client errors, except for 429 (Too Many Requests)
        if (axiosError.response?.status && axiosError.response.status >= 400 && axiosError.response.status < 500 && axiosError.response.status !== 429) {
          return false;
        }
        // Retry up to 3 times for other errors
        return failureCount < 3;
      },
    },
    mutations: {
       retry: false,
    },
  },
});