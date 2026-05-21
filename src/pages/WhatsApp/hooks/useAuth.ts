import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { authApi } from '../api/modules/authApi';
import type { LoginPayload, LoginResponse, UserProfile } from '../types';
import { ZodError } from 'zod';
import type { AxiosError } from 'axios';

const CURRENT_USER_QUERY_KEY = ['currentUser'];

export const useAuth = () => {
  const queryClient = useQueryClient();


   const useCurrentUser = () => {
    return useQuery<UserProfile, AxiosError>({
      queryKey: CURRENT_USER_QUERY_KEY,
      queryFn: authApi.getCurrentUser,
      staleTime: 1000 * 60 * 30, // 30 minutes
      gcTime: 1000 * 60 * 60, // 1 hour

      

      retry: (failureCount, error) => {
        // Don't retry on auth errors
        if (error.response?.status === 401 || error.response?.status === 403) {
          return false;
        }
        return failureCount < 2; 
      },
      throwOnError(error) {
        console.error('Current user failed:', error);
        return false;
      },
      
    });
  };

  const useLogin = () => {
    return useMutation<LoginResponse, Error, LoginPayload>({
      mutationFn: authApi.login,
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: CURRENT_USER_QUERY_KEY });
        console.log('Login successful');
      },
      onError: (error) => {
        if (error instanceof ZodError) {
          console.error('Login failed: Validation error', error.flatten());
        } else {
          console.error('Login failed:', error.message);
        }
      },
    });
  };

  const useLogout = () => {
    return useMutation({
      mutationFn: authApi.logout,
      onSuccess: () => {
        queryClient.clear();
        console.log('Logout successful');
      },
      onError: (error) => {
         console.error('Logout failed:', error);
         queryClient.clear();
      }
    });
  };

  return { useLogin, useLogout , useCurrentUser};
};