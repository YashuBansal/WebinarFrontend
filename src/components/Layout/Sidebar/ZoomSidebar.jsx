import React, { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  User,
  Video,
  Presentation,
  Settings,
  FolderOpen,
  Briefcase,
  CheckCircle,
  AlertTriangle,
} from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { setSelectedProject } from "../../../features/slices/globalData";
import { useZoomProjects } from "@zoom/hooks/useZoomProjects";
import * as zoomApi from "@zoom/api/zoomApi";

const ZoomSidebar = ({ variant, section, handleNavigation }) => {
  const dispatch = useDispatch();
  const location = useLocation();
  const { selectedProject } = useSelector((state) => state.globalData);

  // Use the existing TanStack Query hook
  const { data: projectsResponse } = useZoomProjects(1, 50);
  const projects = projectsResponse?.projects || [];

  useEffect(() => {
    const match = location.pathname.match(/\/zoom\/dashboard\/([^/]+)/);
    const projectIdFromUrl = match?.[1];

    if (projectIdFromUrl) {
      // If we are on a dashboard route, we should definitely be in "project mode"
      if (!selectedProject || selectedProject._id !== projectIdFromUrl) {
        const project = projects.find((p) => p._id === projectIdFromUrl);
        if (project) {
          dispatch(setSelectedProject(project));
        } else if (projects.length > 0) {
          // If projects are loaded but this one isn't found, it might be an invalid ID
          // Or it's still loading the specific project data
          dispatch(setSelectedProject({ _id: projectIdFromUrl, projectName: "Loading...", isConfigured: false }));
        } else {
          // Projects not loaded yet, set a minimal project object
          dispatch(setSelectedProject({ _id: projectIdFromUrl, projectName: "Loading...", isConfigured: false }));
        }
      }
    } else if (location.pathname === "/zoom" || location.pathname === "/zoom/") {
      if (selectedProject) {
        dispatch(setSelectedProject(null));
      }
    }
  }, [location.pathname, projects, selectedProject?._id, dispatch]);

  const getNavItems = (projectId) => [
    { name: "Profile", path: `/zoom/dashboard/${projectId}/profile`, icon: User },
    { name: "Meetings", path: `/zoom/dashboard/${projectId}/meetings`, icon: Video },
    { name: "Webinars", path: `/zoom/dashboard/${projectId}/webinars`, icon: Presentation },
    { name: "Configuration", path: `/zoom/dashboard/${projectId}/configuration`, icon: Settings },
  ];

  const isActive = (path) => location.pathname === path;
  
  // Use the correct isProjectConfigured check from Zoom project schema
  const isConfigured = !!selectedProject?.isConfigured;
  
  const allNavItems = selectedProject ? getNavItems(selectedProject._id) : [];
  const navItems = !selectedProject
    ? projects.map((p) => ({
      name: p.projectName,
      path: `/zoom/dashboard/${p._id}/configuration`,
      icon: Briefcase,
    }))
    : isConfigured
      ? allNavItems.filter((item) => item.name !== "Configuration")
      : allNavItems.filter((item) => item.name === "Configuration");

  if (section === "top") {
    if (variant === "rail") {
      return (
        <div className="flex flex-col items-center justify-center py-3 border-b border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 h-[68px]">
          <Link
            to="/zoom"
            onClick={() => handleNavigation("/zoom")}
            className={`flex h-10 w-10 items-center justify-center rounded-lg border transition-all ${selectedProject ? "border-blue-500 bg-blue-50 dark:bg-blue-500/10" : "border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
              } hover:bg-blue-50 dark:hover:bg-blue-500/20 hover:border-blue-400`}
            title="View All Zoom Projects"
          >
            <FolderOpen className={`h-5 w-5 ${selectedProject ? "text-blue-600" : "text-slate-400"}`} />
          </Link>
        </div>
      );
    }
    return (
      <div className="px-4 py-3 border-b border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 h-[68px] flex flex-col justify-center">
        <Link
          to="/zoom"
          onClick={() => handleNavigation("/zoom")}
          className="flex items-center gap-2 text-slate-800 dark:text-slate-100 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
        >
          <FolderOpen className="h-4 w-4 text-blue-500" />
          <span className="text-sm font-bold tracking-tight" style={{ fontFamily: "Inter, sans-serif" }}>
            Zoom Projects
          </span>
        </Link>
        {selectedProject && (
          <div className="mt-2 flex items-center gap-1.5 px-0.5">
            <div className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 truncate max-w-[150px]">
              {selectedProject.projectName}
            </span>
          </div>
        )}
      </div>
    );
  }

  if (section === "bottom") {
    if (!selectedProject) return null;
    if (variant === "rail") {
      return (
        <div className="flex items-center justify-center py-3 border-t border-gray-100 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-800/50 h-[55px]">
          <div className={`flex h-[32px] w-[32px] items-center justify-center rounded-lg ${isConfigured ? "bg-blue-100" : "bg-yellow-100"
            }`}>
            <div
              className={`h-2.5 w-2.5 rounded-full ${isConfigured ? "bg-blue-500" : "bg-yellow-500"}`}
              title={isConfigured ? "Zoom Configured" : "Setup Required"}
            />
          </div>
        </div>
      );
    }
    return (
      <div className="px-4 py-3 border-t border-gray-100 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-800/50 h-[55px] flex flex-col justify-center">
        <div
          className={`flex items-center gap-2 rounded-lg px-2 py-1.5 text-xs font-semibold ${isConfigured ? "bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-400" : "bg-yellow-100 dark:bg-yellow-500/20 text-yellow-700 dark:text-yellow-400"
            }`}
        >
          {isConfigured ? (
            <CheckCircle className="h-3.5 w-3.5" />
          ) : (
            <AlertTriangle className="h-3.5 w-3.5" />
          )}
          <span className="truncate">{isConfigured ? "Configured" : "Setup Required"}</span>
        </div>
      </div>
    );
  }

  return (
    <>
      {navItems.map((item) => {
        const active = isActive(item.path);
        const Icon = item.icon;

        if (variant === "mobile") {
          return (
            <li key={item.path}>
              <Link
                to={item.path}
                onClick={() => handleNavigation(item.path)}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 font-medium transition-colors ${active
                    ? "bg-blue-50 dark:bg-blue-500/10 text-blue-600"
                    : "text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-800"
                  }`}
              >
                <Icon className={`h-5 w-5 shrink-0 ${active ? "text-blue-500" : "text-slate-500 dark:text-slate-400"}`} strokeWidth={2} />
                <span>{item.name}</span>
              </Link>
            </li>
          );
        }

        if (variant === "rail") {
          return (
            <li key={item.path}>
              <Link
                to={item.path}
                onClick={() => handleNavigation(item.path)}
                className={`relative flex w-full items-center justify-center rounded-lg py-2.5 transition-colors hover:bg-black/[0.04] dark:hover:bg-white/[0.04] ${active ? "bg-blue-500/10" : ""
                  }`}
              >
                {active && (
                  <div className="absolute bottom-0 left-0 top-0 w-[3px] rounded-r-sm bg-blue-500" />
                )}
                <Icon className={`h-5 w-5 shrink-0 ${active ? "text-blue-500" : "text-slate-400 dark:text-slate-500"}`} strokeWidth={2} />
              </Link>
            </li>
          );
        }

        return (
          <li key={item.path}>
            <Link
              to={item.path}
              onClick={() => handleNavigation(item.path)}
              className={`flex w-full items-center rounded-lg px-2 py-2.5 text-left text-sm font-medium hover:bg-black/[0.04] dark:hover:bg-white/[0.04] ${active
                  ? "text-blue-600"
                  : "text-slate-800 dark:text-slate-200"
                }`}
              style={{ fontFamily: "Inter, sans-serif" }}
            >
              <span className="truncate whitespace-nowrap">{item.name}</span>
            </Link>
          </li>
        );
      })}
    </>
  );
};

export default ZoomSidebar;
