import React, { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  User,
  MessageSquare,
  Layout,
  Settings,
  ChevronDown,
  Briefcase,
  Users,
  FileText,
  Zap,
  Clock,
  ShieldCheck,
  Video,
  Bell,
  Bot,
  Hash,
  FileCode,
  Tag,
  ListTree,
  FolderOpen,
  CheckCircle,
  AlertTriangle,
} from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { setSelectedProject } from "../../../features/slices/globalData";
import { projectsApi } from "../../../pages/WhatsApp/api/modules/projectsAPI";
import { isProjectConfigured } from "../../../pages/WhatsApp/lib/projectUtils";
import { useTheme } from "../../../contexts/ThemeContext";

const WhatsAppSidebar = ({ variant, section, handleNavigation }) => {
  const dispatch = useDispatch();
  const location = useLocation();
  const navigate = useNavigate();
  const { selectedProject } = useSelector((state) => state.globalData);
  const [projects, setProjects] = useState([]);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const response = await projectsApi.getProjects();
        setProjects(response.results || []);
      } catch (error) {
        console.error("Error fetching projects:", error);
      }
    };
    fetchProjects();
  }, []);

  useEffect(() => {
    const match = location.pathname.match(/\/whatsapp\/dashboard\/([^/]+)/);
    const projectIdFromUrl = match?.[1];

    if (projectIdFromUrl) {
      if (projects.length > 0 && (!selectedProject || selectedProject._id !== projectIdFromUrl)) {
        const project = projects.find((p) => p._id === projectIdFromUrl);
        if (project) {
          dispatch(setSelectedProject(project));
        }
      }
    } else if (location.pathname === "/whatsapp" || location.pathname === "/whatsapp/") {
      if (selectedProject) {
        dispatch(setSelectedProject(null));
      }
    }
  }, [location.pathname, projects, selectedProject, dispatch]);

  const getNavItems = (projectId) => [
    { name: "Profile", path: `/whatsapp/dashboard/${projectId}/profile`, icon: User },
    { name: "Chat", path: `/whatsapp/dashboard/${projectId}/chat`, icon: MessageSquare },
    { name: "Templates", path: `/whatsapp/dashboard/${projectId}/templates`, icon: Layout },
    { name: "Send Message", path: `/whatsapp/dashboard/${projectId}/send-message`, icon: Zap },
    { name: "Campaigns", path: `/whatsapp/dashboard/${projectId}/campaigns`, icon: Bell },
    { name: "API Campaigns", path: `/whatsapp/dashboard/${projectId}/api-campaigns`, icon: FileCode },
    { name: "Auto Message", path: `/whatsapp/dashboard/${projectId}/auto-message`, icon: Clock },
    { name: "Chatbot", path: `/whatsapp/dashboard/${projectId}/chatbot`, icon: Bot },
    { name: "Zoom Templates", path: `/whatsapp/dashboard/${projectId}/configured-templates`, icon: Video },
    { name: "Contacts", path: `/whatsapp/dashboard/${projectId}/contacts`, icon: Users },
    { name: "Opted Out Numbers", path: `/whatsapp/dashboard/${projectId}/opted-out-numbers`, icon: Hash },
    { name: "Media Files", path: `/whatsapp/dashboard/${projectId}/media-files`, icon: FileText },
    { name: "Tags", path: `/whatsapp/dashboard/${projectId}/tags`, icon: Tag },
    { name: "Sequence", path: `/whatsapp/dashboard/${projectId}/programs`, icon: ListTree },
    { name: "Configuration", path: `/whatsapp/dashboard/${projectId}/configuration`, icon: Settings },
  ];

  const isActive = (path) => location.pathname === path;
  const isConfigured = isProjectConfigured(selectedProject);
  const allNavItems = selectedProject ? getNavItems(selectedProject._id) : [];
  const navItems = !selectedProject
    ? projects.map((p) => ({
        name: p.projectName,
        path: `/whatsapp/dashboard/${p._id}/configuration`,
        icon: Briefcase,
      }))
    : isConfigured
    ? allNavItems.filter((item) => item.name !== "Configuration")
    : allNavItems.filter((item) => item.name === "Configuration");
  const isDisabled = false; // Never disable the project list itself

  if (section === "top") {
    if (variant === "rail") {
      return (
        <div className="flex flex-col items-center justify-center py-3 border-b border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 h-[68px]">
          <Link
            to="/whatsapp"
            onClick={() => handleNavigation("/whatsapp")}
            className={`flex h-10 w-10 items-center justify-center rounded-lg border transition-all ${
              selectedProject ? "border-green-500 bg-green-50 dark:bg-green-500/10" : "border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
            } hover:bg-green-50 dark:hover:bg-green-500/20 hover:border-green-400`}
            title="View All Projects"
          >
            <FolderOpen className={`h-5 w-5 ${selectedProject ? "text-green-600" : "text-slate-400"}`} />
          </Link>
        </div>
      );
    }
    return (
      <div className="px-4 py-3 border-b border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 h-[68px] flex flex-col justify-center">
        <Link
          to="/whatsapp"
          onClick={() => handleNavigation("/whatsapp")}
          className="flex items-center gap-2 text-slate-800 dark:text-slate-100 hover:text-green-600 dark:hover:text-green-400 transition-colors"
        >
          <FolderOpen className="h-4 w-4 text-green-500" />
          <span className="text-sm font-bold tracking-tight" style={{ fontFamily: "Inter, sans-serif" }}>
            Projects
          </span>
        </Link>
        {selectedProject && (
          <div className="mt-2 flex items-center gap-1.5 px-0.5">
            <div className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 truncate max-w-[150px]">
              {selectedProject.projectName}
            </span>
          </div>
        )}
      </div>
    );
  }

  if (section === "bottom") {
    return null;
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
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 font-medium transition-colors ${
                  isDisabled
                    ? "cursor-not-allowed opacity-50 grayscale pointer-events-none"
                    : active
                    ? "bg-green-50 dark:bg-green-500/10 text-green-600"
                    : "text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-800"
                }`}
              >
                <Icon className={`h-5 w-5 shrink-0 ${active ? "text-green-500" : "text-slate-500 dark:text-slate-400"}`} strokeWidth={2} />
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
                className={`relative flex w-full items-center justify-center rounded-lg py-2.5 transition-colors hover:bg-black/[0.04] dark:hover:bg-white/[0.04] ${
                  isDisabled ? "cursor-not-allowed opacity-50 grayscale pointer-events-none" : active ? "bg-green-500/10" : ""
                }`}
              >
                {active && (
                  <div className="absolute bottom-0 left-0 top-0 w-[3px] rounded-r-sm bg-green-500" />
                )}
                <Icon className={`h-5 w-5 shrink-0 ${active ? "text-green-500" : "text-slate-400 dark:text-slate-500"}`} strokeWidth={2} />
              </Link>
            </li>
          );
        }

        return (
          <li key={item.path}>
            <Link
              to={item.path}
              onClick={() => handleNavigation(item.path)}
              className={`flex w-full items-center rounded-lg px-2 py-2.5 text-left text-sm font-medium hover:bg-black/[0.04] dark:hover:bg-white/[0.04] ${
                isDisabled
                  ? "cursor-not-allowed opacity-40 grayscale pointer-events-none"
                  : active
                  ? "text-green-600"
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

export default WhatsAppSidebar;
