import axiosInstance from '../axios';

export interface VariableMapping {
  variable: string;
  isDynamic: boolean;
  contactField?: string;
  staticValue?: string;
  fallbackValue?: string;
}

export interface AlarmWhatsappConfigPayload {
  projectId: string;
  enabled: boolean;
  mainAlarmTemplateName: string;
  mainAlarmLanguage?: string;
  mainAlarmHeaderMediaAssetId?: string | null;
  mainAlarmVariableMappings: VariableMapping[];
  reminderTemplateName: string;
  reminderLanguage?: string;
  reminderHeaderMediaAssetId?: string | null;
  reminderVariableMappings: VariableMapping[];
}

export interface AlarmWhatsappConfigResponse extends AlarmWhatsappConfigPayload {
  id: string;
  adminId: string;
  createdAt: string;
  updatedAt: string;
  mainAlarmSent?: number;
  reminderSent?: number;
  mainAlarmFailed?: number;
  reminderFailed?: number;
  lastError?: string;
}

const normalizeConfig = (config: any): AlarmWhatsappConfigResponse => ({
  ...config,
  id: config?.id || config?._id,
  adminId:
    typeof config?.adminId === 'string'
      ? config.adminId
      : config?.adminId?.toString?.(),
  projectId:
    typeof config?.projectId === 'string'
      ? config.projectId
      : config?.projectId?.toString?.(),
});

export const alarmWhatsappConfigApi = {
  async listConfigs(projectId?: string) {
    const { data } = await axiosInstance.get('/alarm-whatsapp-config/all', {
      params: { projectId },
    });
    const list = (data?.data || []) as any[];
    return list.map(normalizeConfig);
  },

  async getConfig(projectId: string) {
    const { data } = await axiosInstance.get('/alarm-whatsapp-config', {
      params: { projectId },
    });
    return data?.data ? normalizeConfig(data.data) : null;
  },

  async upsertConfig(payload: AlarmWhatsappConfigPayload) {
    const { data } = await axiosInstance.post('/alarm-whatsapp-config', payload);
    return normalizeConfig(data?.data);
  },

  async deleteConfig(_id: string) {
    const { data } = await axiosInstance.delete('/alarm-whatsapp-config', {
      params: { _id },
    });
    return data?.data;
  },

  async toggleConfig(_id: string, enabled: boolean) {
    const { data } = await axiosInstance.patch('/alarm-whatsapp-config/toggle', {
      _id,
      enabled,
    });
    return normalizeConfig(data?.data);
  },

  async testSend(payload: { projectId: string; phoneNumber: string; type: 'main' | 'reminder' }) {
    const { data } = await axiosInstance.post('/alarm-whatsapp-config/test-send', payload);
    return data?.data as { success: boolean; messageId?: string };
  },
};
