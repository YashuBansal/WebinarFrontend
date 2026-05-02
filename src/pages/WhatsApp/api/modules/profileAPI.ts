import axiosInstance from '../axios';
import type {
  BusinessProfile,
  UpdateBusinessProfilePayload,
  DisplayNameStatus,
  ProfilePictureUploadData,
  WebhookSubscriptionStatus,
} from '@/schemas/profileSchema';
import {
  businessProfileResponseSchema,
  updateBusinessProfileResponseSchema,
  displayNameStatusResponseSchema,
  profilePictureUploadResponseSchema,
  webhookSubscriptionStatusResponseSchema,
} from '@/schemas/profileSchema';

/**
 * Get business profile information
 */
const getBusinessProfile = async (projectId: string): Promise<BusinessProfile> => {
  const { data } = await axiosInstance.get(`/profile/${projectId}`);
  console.log('data ------------------------- > ', data);
  const parsedResponse = businessProfileResponseSchema.parse(data);
  return parsedResponse.data;
};

/**
 * Sync business profile from Meta into local cache
 */
const syncBusinessProfile = async (
  projectId: string,
): Promise<BusinessProfile> => {
  const { data } = await axiosInstance.get(`/profile/${projectId}/sync`);
  const parsedResponse = businessProfileResponseSchema.parse(data);
  return parsedResponse.data;
};

/**
 * Update business profile information
 */
const updateBusinessProfile = async (
  projectId: string,
  payload: UpdateBusinessProfilePayload,
): Promise<{ success: boolean }> => {
  const { data } = await axiosInstance.post(`/profile/${projectId}`, payload);
  const parsedResponse = updateBusinessProfileResponseSchema.parse(data);
  return parsedResponse.data;
};

/**
 * Get display name status
 */
const getDisplayNameStatus = async (projectId: string): Promise<DisplayNameStatus> => {
  const { data } = await axiosInstance.get(`/profile/${projectId}/display-name-status`);
  const parsedResponse = displayNameStatusResponseSchema.parse(data);
  return parsedResponse.data;
};

/**
 * Upload profile picture
 */
const uploadProfilePicture = async (
  projectId: string,
  file: File,
): Promise<ProfilePictureUploadData> => {
  const formData = new FormData();
  formData.append('file', file);

  const { data } = await axiosInstance.post(`/profile/${projectId}/profile-picture`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  const parsedResponse = profilePictureUploadResponseSchema.parse(data);
  return parsedResponse.data;
};

/**
 * Get webhook subscription status
 */
const getWebhookSubscriptionStatus = async (
  projectId: string,
): Promise<WebhookSubscriptionStatus> => {
  const { data } = await axiosInstance.get(
    `/profile/${projectId}/webhook-subscription-status`,
  );
  const parsedResponse = webhookSubscriptionStatusResponseSchema.parse(data);
  return parsedResponse.data;
};

/**
 * Subscribe webhook for a project
 */
const subscribeWebhook = async (projectId: string): Promise<{ success: boolean }> => {
  const { data } = await axiosInstance.post(
    `/profile/${projectId}/webhook-subscription`,
  );
  return data.data;
};

export const profileApi = {
  getBusinessProfile,
  updateBusinessProfile,
  getDisplayNameStatus,
  uploadProfilePicture,
  getWebhookSubscriptionStatus,
  subscribeWebhook,
  syncBusinessProfile,
};
