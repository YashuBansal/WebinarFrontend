import { Outlet, useNavigate, useParams, useLocation } from "react-router-dom";
import { Suspense, useEffect } from "react";
import { useProjectContext } from "@/context/ProjectContext";
import { Button } from "@/components/ui/button";
import { useProjects } from "@/hooks/useProjects";
import { isProjectConfigured } from "@/lib/projectUtils";
import { useAuth } from "@/hooks/useAuth";

export default function DashboardLayout() {
  const { projectId } = useParams<{ projectId: string }>();
  const { selectedProject, setSelectedProject } = useProjectContext();
  const navigate = useNavigate();
  const location = useLocation();
  const { useCurrentUser } = useAuth();
  const { isLoading: isAuthLoading, isError: isAuthError, data: userData } = useCurrentUser();
  const dashboardBaseUrl = import.meta.env.VITE_REACT_APP_DASHBOARD_BASE_URL;
  const isLoggedOut = isAuthError || (!isAuthLoading && !userData);
  const isChatPage = location.pathname.split('/').includes('chat');

  useEffect(() => {
    if (!isLoggedOut || !dashboardBaseUrl?.trim()) return;
    window.location.href = dashboardBaseUrl;
  }, [isLoggedOut, dashboardBaseUrl]);

  // Scroll to top on route change
  useEffect(() => {
    const el = document.querySelector(".custom-scrollbar.absolute");
    if (el) {
      el.scrollTop = 0;
    } else {
      window.scrollTo({ top: 0, behavior: "instant" });
    }
  }, [location.pathname]);

  useEffect(() => {
    if (isLoggedOut && !dashboardBaseUrl?.trim()) {
      navigate("/whatsapp", { replace: true });
    }
  }, [isLoggedOut, dashboardBaseUrl, navigate]);

  // Fetch project data if we have projectId but no selectedProject
  const { data: projectsResponse, isLoading: isProjectsLoading } = useProjects(1, 100);

  useEffect(() => {
    if (projectId && !selectedProject && projectsResponse) {
      // Find and set the project from the URL parameter
      const project = projectsResponse.results.find(p => p._id === projectId);
      if (project) {
        setSelectedProject(project);
      } else {
        // Project not found, redirect to project selection
        navigate("/whatsapp", { replace: true });
      }
    } else if (!projectId) {
      // No projectId in URL, redirect to project selection
      navigate("/whatsapp", { replace: true });
    }
  }, [projectId, selectedProject, projectsResponse, setSelectedProject, navigate]);

  // Check if project is configured and redirect if not
  useEffect(() => {
    if (selectedProject && projectId) {
      const isConfigured = isProjectConfigured(selectedProject);
      const currentPath = window.location.pathname;

      // Check for post-configuration redirect
      const postConfigRedirect = sessionStorage.getItem('postConfigRedirect');
      if (postConfigRedirect) {
        sessionStorage.removeItem('postConfigRedirect');
        navigate(postConfigRedirect, { replace: true });
        return;
      }

      // If not configured and not already on configuration page, redirect to configuration
      if (!isConfigured && !currentPath.includes('/configuration')) {
        navigate(`/whatsapp/dashboard/${projectId}/configuration`, { replace: true });
      }
      // If configured and on configuration page, redirect to profile (default)
      else if (isConfigured && currentPath.includes('/configuration')) {
        navigate(`/whatsapp/dashboard/${projectId}/profile`, { replace: true });
      }
      // If configured and on root dashboard path, redirect to profile
      else if (isConfigured && currentPath === `/whatsapp/dashboard/${projectId}`) {
        navigate(`/whatsapp/dashboard/${projectId}/profile`, { replace: true });
      }
    }
  }, [selectedProject, projectId, navigate]);

  if (isLoggedOut) {
    return null;
  }

  // Show loading while we're determining the project
  if (projectId && !selectedProject && isProjectsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-800/50">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="text-sm text-gray-600 dark:text-slate-400">Loading project...</p>
        </div>
      </div>
    );
  }

  // If we have projectId but no project found after loading, show error
  if (projectId && !selectedProject && !isProjectsLoading && projectsResponse) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-800/50">
        <div className="w-full max-w-md shadow-lg border-none bg-white/90 dark:bg-gray-900/90">
          <div className="pt-6">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Project Not Found</h3>
              <p className="text-gray-600 dark:text-slate-400 mb-4">
                The project you're looking for doesn't exist or you don't have access to it.
              </p>
              <Button onClick={() => navigate("/whatsapp")} className="w-full">
                Back to Projects
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex w-full min-h-screen bg-transparent">
      <div className="flex-1 flex flex-col min-w-0">
        <main className={`flex-1 flex justify-center items-stretch min-w-0 ${isChatPage ? 'p-0' : ''}`}>
          <div className={`w-full max-w-full flex flex-col min-w-0 ${isChatPage ? 'bg-transparent' : ''}`}>
            <div className={`flex-1 min-w-0 ${isChatPage ? 'p-0' : 'p-0 md:p-4'}`}>
              <Suspense fallback={<div className='p-8 text-center text-muted-foreground'>Loading...</div>}>
                <Outlet />
              </Suspense>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

