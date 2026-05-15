import { ProjectProvider } from "./context/ProjectContext";
import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { useSyncTemplates } from "./hooks/useTemplates";
import { useProjectContext } from "./context/ProjectContext";
import { isProjectConfigured } from "./lib/projectUtils";
import { useProject } from "./hooks/useProjects";
import AppRoutes from "./AppRoutes";

function WabaTemplatesSyncOnFirstProjectOpen() {
  const location = useLocation();
  const syncTemplatesMutation = useSyncTemplates();
  const { selectedProject } = useProjectContext();

  const match = location.pathname.match(/\/whatsapp\/dashboard\/([^/]+)(?:\/|$)/);
  const projectId = match?.[1];

  const { data: projectDetails } = useProject(projectId);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!projectId) return;

    const projectForConfigCheck =
      projectDetails && projectDetails._id === projectId
        ? projectDetails
        : selectedProject && selectedProject._id === projectId
          ? selectedProject
          : null;

    if (!projectForConfigCheck) return;
    if (!isProjectConfigured(projectForConfigCheck)) return;

    const storageKey = `wabaTemplatesSyncedOnce:${projectId}`;
    if (localStorage.getItem(storageKey)) return;

    if (syncTemplatesMutation.isPending) return;

    (async () => {
      try {
        await syncTemplatesMutation.mutateAsync({ projectId });
        localStorage.setItem(storageKey, "1");
      } catch {
        // If sync fails, don't mark as synced so next open retries.
      }
    })();
  }, [
    location.pathname,
    selectedProject,
    projectDetails,
    syncTemplatesMutation.isPending,
    syncTemplatesMutation.mutateAsync,
  ]);


  // Scroll to top on route change
  useEffect(() => {
    const el = document.querySelector(".custom-scrollbar.absolute");
    if (el) {
      el.scrollTop = 0;
    } else {
      window.scrollTo({ top: 0, behavior: "instant" });
    }
  }, [location.pathname]);

  return null;
}

export default function WhatsAppWrapper() {
  return (
    <ProjectProvider>
      <WabaTemplatesSyncOnFirstProjectOpen />
      <AppRoutes />
    </ProjectProvider>
  );
}
