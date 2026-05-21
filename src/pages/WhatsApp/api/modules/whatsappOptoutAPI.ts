import axiosInstance from '../axios';

export interface OptedOutNumber {
  _id: string;
  projectId: string;
  phoneNumber: string;
  reason: string;
  createdAt: string;
  updatedAt: string;
}

export interface OptedOutListResponse {
  items: OptedOutNumber[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface GetOptedOutNumbersParams {
  page?: number;
  limit?: number;
  startDate?: string;
  endDate?: string;
}

const getOptedOutNumbers = async (
  projectId: string,
  params?: GetOptedOutNumbersParams,
): Promise<OptedOutListResponse> => {
  const { data } = await axiosInstance.get('/whatsapp-optout', {
    params: { projectId, ...params },
  });
  return data.data;
};

const optInNumber = async (projectId: string, optoutId: string) => {
  const { data } = await axiosInstance.patch(
    `/whatsapp-optout/${optoutId}/opt-in`,
    undefined,
    { params: { projectId } },
  );
  return data.data;
};

export const whatsappOptoutApi = {
  getOptedOutNumbers,
  optInNumber,
};
