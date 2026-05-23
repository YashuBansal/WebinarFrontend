import { Navigate, useLocation } from 'react-router-dom'
import { useProject } from '@zoom/context/ProjectContext'
import { isProjectConfigured } from '@zoom/lib/projectUtils'

export default function ConfigurationGuard({ children }: { children: React.ReactNode }) {
  const { project } = useProject()
  const location = useLocation()

  if (!project) {
    return <Navigate to="/projects" replace state={{ from: location }} />
  }

  if (!isProjectConfigured(project) && location.pathname !== '/dashboard/configuration') {
    return <Navigate to="/dashboard/configuration" replace />
  }

  return <>{children}</>
}


