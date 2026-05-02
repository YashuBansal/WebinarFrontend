import axiosInstance from '../axios';
import type {   ExchangeCodeApiResponse } from '../../schemas';

/**
 * Exchange authorization code for WhatsApp Business Account connection
 * @param code - The authorization code from Meta's embedded signup flow
 * @param projectId - The project ID to associate the WABA with
 */
const exchangeCode = async (
  code: string, 
  projectId: string
): Promise<ExchangeCodeApiResponse> => {
  const { data } = await axiosInstance.post(
    `/whatsapp/exchange-code/${projectId}`, 
    { code }
  );
  return data;
};

export const whatsappApi = {
  exchangeCode,
};
