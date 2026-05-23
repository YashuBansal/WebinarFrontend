import { Outlet, useNavigate, useParams } from "react-router-dom"
import { Suspense, useEffect } from "react"
import { AlertTriangle } from "lucide-react"
import { LEGACY_ZOOM_SETUP } from "@zoom/lib/legacyZoomSetupCopy"
import { useProject } from "@zoom/context/ProjectContext"
import { useZoomProject } from "@zoom/hooks/useZoomProjects"
import { isProjectConfigured } from "@zoom/lib/projectUtils"
import { socketManager } from "@zoom/lib/socket"
import { useAuth } from "@zoom/hooks/useAuth"
import { Button } from "@zoom/components/ui/button"
import { Card, CardContent } from "@zoom/components/ui/card"

export default function DashboardLayout() {
  const { projectId } = useParams<{ projectId: string }>()
  const { project, setProject } = useProject()
  const navigate = useNavigate()
  const { useCurrentUser } = useAuth()
  const { isLoading: isAuthLoading, isError: isAuthError, data: userData } = useCurrentUser()
  const dashboardBaseUrl = import.meta.env.VITE_REACT_APP_DASHBOARD_BASE_URL
  const isLoggedOut = isAuthError || (!isAuthLoading && !userData)

  useEffect(() => {
    if (!isLoggedOut || !dashboardBaseUrl?.trim()) return
    window.location.href = dashboardBaseUrl
  }, [isLoggedOut, dashboardBaseUrl])

  useEffect(() => {
    if (isLoggedOut && !dashboardBaseUrl?.trim()) {
      navigate("/", { replace: true })
    }
  }, [isLoggedOut, dashboardBaseUrl, navigate])

  // Fetch project data if we have projectId but no project
  const { data: projectData, isLoading: isProjectLoading } = useZoomProject(projectId)

  // Initialize socket connection when component mounts
  useEffect(() => {
    // Establish socket connection - backend will authenticate via cookies
    const socket = socketManager.getSocket()

    if (socket) {
      console.log('Socket connection initialized in DashboardLayout')
    }

    // Cleanup: disconnect socket when component unmounts
    // Note: Since socketManager is a singleton, you might want to keep connection alive
    // Uncomment the return statement below if you want to disconnect on unmount
    // return () => {
    //   socketManager.disconnect()
    // }
  }, [])

  useEffect(() => {
    if (!projectId) {
      navigate("/projects", { replace: true })
      return
    }
    // Always keep context in sync with server (e.g. after OAuth, isConfigured flips true; stale localStorage would stay false)
    if (projectData && projectData._id === projectId) {
      setProject(projectData)
    }
  }, [projectId, projectData, setProject, navigate])

  // Check if project is configured and redirect if not
  useEffect(() => {
    // Use the most up-to-date project data (either from context or fresh fetch)
    const currentProject = projectData || project
    const isLegacyZoom = currentProject?.usesMarketplaceGeneralApp !== true
    if (currentProject && projectId) {
      const isConfigured = isProjectConfigured(currentProject)
      const currentPath = window.location.pathname

      // Check for post-configuration redirect
      const postConfigRedirect = sessionStorage.getItem('postConfigRedirect')
      if (postConfigRedirect) {
        sessionStorage.removeItem('postConfigRedirect')
        navigate(postConfigRedirect, { replace: true })
        return
      }

      // If not configured and not already on configuration page, redirect to configuration
      if (!isConfigured && !currentPath.includes('/configuration')) {
        navigate(`/zoom/dashboard/${projectId}/configuration`, { replace: true })
      }
      // If configured and on configuration page, redirect to profile — unless legacy OAuth reconfigure is needed
      else if (isConfigured && currentPath.includes('/configuration') && !isLegacyZoom) {
        navigate(`/zoom/dashboard/${projectId}/profile`, { replace: true })
      }
      // If configured and on root dashboard path, redirect to profile
      else if (isConfigured && currentPath === `/zoom/dashboard/${projectId}`) {
        navigate(`/zoom/dashboard/${projectId}/profile`, { replace: true })
      }
    }
  }, [project, projectData, projectId, navigate])

  const resolvedProject = projectData ?? project
  const showLegacyZoomBanner =
    !!projectId &&
    !!resolvedProject &&
    resolvedProject.usesMarketplaceGeneralApp !== true

  if (isLoggedOut) {
    return null
  }

  // Show loading while we're determining the project
  if (projectId && !project && isProjectLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="text-sm text-gray-600">Loading project...</p>
        </div>
      </div>
    )
  }

  // If we have projectId but no project found after loading, show error
  if (projectId && !project && !isProjectLoading && !projectData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-800/50">
        <div className="w-full max-w-md shadow-xl rounded-[32px] border border-slate-200 dark:border-slate-700/50 bg-white dark:bg-gray-900/90 p-10 text-center">
          <div className="h-20 w-20 bg-red-50 dark:bg-red-500/10 rounded-3xl flex items-center justify-center mx-auto mb-6">
            <AlertTriangle className="h-10 w-10 text-red-600 dark:text-red-400" />
          </div>
          <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-3">Project Not Found</h3>
          <p className="text-slate-500 dark:text-slate-400 font-medium mb-8">
            The project you're looking for doesn't exist or you don't have access to it.
          </p>
          <Button onClick={() => navigate("/zoom")} className="w-full h-12 rounded-2xl font-bold bg-blue-600 hover:bg-blue-700">
            Back to Projects
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex w-full min-h-screen bg-transparent">
      <div className="flex-1 flex flex-col min-w-0">
        {showLegacyZoomBanner && projectId && (
          <div
            role="alert"
            className="shrink-0 border-b border-amber-300 bg-amber-50 px-4 py-3 text-amber-950"
          >
            <div className="mx-auto flex max-w-5xl gap-2">
              <AlertTriangle className="h-5 w-5 shrink-0 text-amber-600" aria-hidden />
              <div className="min-w-0">
                <div className="text-sm font-semibold text-amber-900">{LEGACY_ZOOM_SETUP.title}</div>
                <p className="text-xs text-amber-900/90 sm:text-sm">{LEGACY_ZOOM_SETUP.body}</p>
              </div>
            </div>
          </div>
        )}
        <main className="flex-1 p-0 flex justify-center items-start min-w-0">
          <div className="w-full max-w-full flex flex-col min-w-0">
            <div className="flex-1 min-w-0 p-0 md:p-4">
              <Suspense fallback={<div className='p-8 text-center text-muted-foreground'>Loading...</div>}>
                <Outlet />
              </Suspense>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
