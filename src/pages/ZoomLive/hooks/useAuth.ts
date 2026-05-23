import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import apiClient, {
  clearClientAuthStorage,
  redirectToZoomHome,
} from '@zoom/lib/axios';
import { socketManager } from '@zoom/lib/socket';
import type { AxiosError } from 'axios';

// User profile type based on the WhatsApp project structure
export interface UserProfile {
  _id: string;
  email: string;
  companyName?: string;
  userName: string;
  phone: string;
  isActive: boolean;
  adminId: string;
  role: string;
  dailyContactCount: number;
  failedOtpAttempts: number;
  dateFormat: string;
  tags: string[];
  documents: any[];
  createdAt: string;
  updatedAt: string;
  isTwoFactorAuthenticationEnabled: boolean;
  isDeleted: boolean;
  __v?: number;
}

// API response wrapper
interface CurrentUserApiResponse {
  status: boolean;
  message: string;
  data: UserProfile;
}

const CURRENT_USER_QUERY_KEY = ['currentUser'];

// API function to get current user
const getCurrentUser = async (): Promise<UserProfile> => {
  const { data } = await apiClient.get<CurrentUserApiResponse>('/auth/current-user');
  return data.data;
};

export const useAuth = () => {
  const queryClient = useQueryClient();

  const useCurrentUser = () => {
    return useQuery<UserProfile, AxiosError>({
      queryKey: CURRENT_USER_QUERY_KEY,
      queryFn: getCurrentUser,
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

  const useLogout = () => {
    return useMutation({
      mutationFn: async () => {
        // Intentionally no POST /auth/logout — global SaaS session stays valid.
      },
      onSettled: () => {
        queryClient.clear();
        clearClientAuthStorage();
        socketManager.disconnect();
        redirectToZoomHome();
      },
    });
  };

  return { useCurrentUser, useLogout };
};
