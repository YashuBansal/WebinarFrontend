import axiosInstance from '../axios';
import type { User, PaginatedUsersResponse } from '../../types';
import { userSchema, paginatedUsersResponseSchema } from '../../schemas';


interface GetUsersParams {
  page?: number;
  limit?: number;
}

const getUsers = async (params?: GetUsersParams): Promise<PaginatedUsersResponse> => {
  const { data } = await axiosInstance.get('/users', { params });
  return paginatedUsersResponseSchema.parse(data);
};

const getUserById = async (userId: string): Promise<User> => {
  const { data } = await axiosInstance.get(`/users/${userId}`);
  return userSchema.parse(data);
};

export const usersApi = {
  getUsers,
  getUserById,
};