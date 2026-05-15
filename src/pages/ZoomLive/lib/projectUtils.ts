import type { ZoomProject } from '@zoom/schemas/zoom'

/**
 * Checks if a Zoom project has been configured with Zoom credentials
 * A project is considered configured if isConfigured is true
 */
export const isProjectConfigured = (project: ZoomProject | null | undefined): boolean => {
  if (!project) return false
  
  return project.isConfigured
}

/**
 * Gets the configuration status of a Zoom project
 */
export const getProjectConfigurationStatus = (project: ZoomProject | null | undefined) => {
  if (!project) return { isConfigured: false, missingFields: [] }
  
  const missingFields: string[] = []
  
  if (!project.isConfigured) {
    if (!project.accountId) missingFields.push('Account ID')
    if (!project.accessToken) missingFields.push('Access Token')
  }
  
  return {
    isConfigured: project.isConfigured,
    missingFields
  }
}
