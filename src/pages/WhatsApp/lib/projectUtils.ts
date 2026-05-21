import type { Project } from '@/schemas/projectSchema';

/**
 * Checks if a project has been configured with WhatsApp Business API credentials
 * A project is considered configured if it has all the essential WABA fields
 */
export const isProjectConfigured = (project: Project | null | undefined): boolean => {
  if (!project) return false;
  
  // Check if all essential WABA configuration fields are present
  const hasEssentialFields = !!(
    project.appId &&
    project.appSecret &&
    project.wabaId &&
    project.permanentAccessToken &&
    project.phoneNumberId &&
    project.phone
  );
  
  return hasEssentialFields;
};

/**
 * Gets the configuration status of a project
 */
export const getProjectConfigurationStatus = (project: Project | null | undefined) => {
  if (!project) return { isConfigured: false, missingFields: [] };
  
  const missingFields: string[] = [];
  
  if (!project.appId) missingFields.push('App ID');
  if (!project.appSecret) missingFields.push('App Secret');
  if (!project.wabaId) missingFields.push('WABA ID');
  if (!project.permanentAccessToken) missingFields.push('Access Token');
  if (!project.phoneNumberId) missingFields.push('Phone Number ID');
  if (!project.phone) missingFields.push('Phone Number');
  
  return {
    isConfigured: missingFields.length === 0,
    missingFields
  };
};
