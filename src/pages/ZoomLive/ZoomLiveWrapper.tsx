import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { ProjectProvider } from "./context/ProjectContext";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import AppRoutes from "./AppRoutes";
import "./index.css";

export default function ZoomLiveWrapper() {
  const location = useLocation();

  // Scroll to top on route change
  useEffect(() => {
    const el = document.querySelector(".custom-scrollbar.absolute");
    if (el) {
      el.scrollTop = 0;
    } else {
      window.scrollTo({ top: 0, behavior: "instant" });
    }
  }, [location.pathname]);

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
