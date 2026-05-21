import { useQuery } from '@tanstack/react-query';
import { usersApi } from '../api/modules/usersApi';

const USERS_QUERY_KEY = 'users';

export const useUsers = (page: number = 1, limit: number = 10) => {
  return useQuery({
    queryKey: [USERS_QUERY_KEY, { page, limit }],
    queryFn: () => usersApi.getUsers({ page, limit }),
  });
};

export const useUser = (userId: string | undefined) => {
    return useQuery({
        queryKey: [USERS_QUERY_KEY, userId],
        queryFn: () => {
            if (!userId) {
                return Promise.reject(new Error("User ID is required."));
            }
            return usersApi.getUserById(userId);
        },
        enabled: !!userId,
    });
};