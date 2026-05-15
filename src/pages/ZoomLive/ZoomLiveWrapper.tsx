import { ProjectProvider } from "./context/ProjectContext";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import AppRoutes from "./AppRoutes";
import "./index.css";

export default function ZoomLiveWrapper() {
  return (
    <QueryClientProvider client={queryClient}>
      <ProjectProvider>
        <div className="zoom-live-module min-h-screen bg-transparent text-foreground">
          <AppRoutes />
        </div>
      </ProjectProvider>
    </QueryClientProvider>
  );
}
