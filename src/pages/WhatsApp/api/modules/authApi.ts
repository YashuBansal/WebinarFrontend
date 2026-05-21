import axiosInstance from '../axios';
import type { LoginPayload, LoginResponse, RefreshTokenPayload, RefreshTokenResponse, UserProfile } from '../../types';
import { CurrentUserApiResponseSchema, loginResponseSchema, refreshTokenResponseSchema } from '../../schemas';

const login = async (payload: LoginPayload): Promise<LoginResponse> => {
  const { data } = await axiosInstance.post('/auth/login', payload);
  return loginResponseSchema.parse(data); // Validate and return
};

const refreshToken = async (payload: RefreshTokenPayload): Promise<RefreshTokenResponse> => {
    const { data } = await axiosInstance.post('/auth/refresh', payload, {
        headers: { Authorization: `Bearer ${payload.refreshToken}` }
    });
    return refreshTokenResponseSchema.parse(data); // Validate and return
};

const logout = async (): Promise<void> => {
    await axiosInstance.post('/auth/logout');
};


const getCurrentUser = async (): Promise<UserProfile> => {
    const { data } = await axiosInstance.get('/auth/current-user'); // Common endpoint for the current user
    console.log(data)
    console.log("Current User")
    const parsedData = CurrentUserApiResponseSchema.parse(data);
    console.log('parsedData', parsedData)
    return parsedData.data;
};

export const authApi = {
  login,
  refreshToken,
  logout,
  getCurrentUser,
};