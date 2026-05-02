import axiosInstance from "@/api/axios";

export type AutomationFlow = {
  _id: string;
  name: string;
  status: 'active' | 'inactive';
  webinarId?: string;
  graph: any;
  createdAt: string;
};

export async function listAutomations(projectId: string): Promise<AutomationFlow[]> {
  const { data } = await axiosInstance.get(`/automations`, { params: { projectId } });
  return data;
}

export async function createAutomation(projectId: string, payload: Partial<AutomationFlow>) {
  const { data } = await axiosInstance.post(`/automations`, payload, { params: { projectId } });
  return data;
}

export async function getAutomation(projectId: string, id: string): Promise<AutomationFlow> {
  const { data } = await axiosInstance.get(`/automations/${id}`, { params: { projectId } });
  return data;
}

export async function updateAutomation(projectId: string, id: string, payload: Partial<AutomationFlow>) {
  const { data } = await axiosInstance.put(`/automations/${id}`, payload, { params: { projectId } });
  return data;
}

export async function deleteAutomation(projectId: string, id: string) {
  const { data } = await axiosInstance.delete(`/automations/${id}`, { params: { projectId } });
  return data;
}


