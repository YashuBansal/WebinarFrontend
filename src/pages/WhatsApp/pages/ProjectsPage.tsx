import { useEffect, useState } from "react";
import { useProjectContext } from "../context/ProjectContext";
import { useNavigate } from "react-router-dom";
import { toastUtils } from "../lib/utils";
import {
  PlusCircle,
  FolderOpen,
  Loader2,
  AlertCircle,
  Search,
  MoreVertical,
  Trash2,
  Edit3,
  ArrowRight,
  Globe,
  MessageCircle,
  Calendar,
  Settings,
  LayoutGrid,
  X
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import { Button } from "../components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../components/ui/dialog";
import { Skeleton } from "../components/ui/skeleton";
import { ProjectForm } from "../components/projects/ProjectForm";
import { useProjects, useProjectMutations } from "../hooks/useProjects";
import { Input } from "../components/ui/input";
import { formatDate12 } from "../lib/date";
import { useAuth } from "../hooks/useAuth";
import ConfirmDeleteModal from "../../../components/ConfirmDeleteModal";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "../components/ui/dropdown-menu";

const CardSkeleton = () => (
  <div className="bg-white/40 backdrop-blur-md border border-white/20 rounded-2xl p-5 shadow-sm">
    <div className="flex items-center gap-4 mb-3">
      <Skeleton className="h-10 w-10 rounded-xl" />
      <div className="space-y-1.5 flex-1">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
      </div>
    </div>
    <div className="space-y-2">
      <Skeleton className="h-3 w-full" />
    </div>
  </div>
);

export default function ProjectsPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [renameDialogProjectId, setRenameDialogProjectId] = useState<string | null>(null);
  const [renameProjectName, setRenameProjectName] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  // Authentication state
  const { useCurrentUser } = useAuth();
  const {
    isLoading: isAuthLoading,
    isError: isAuthError,
    data: userData,
  } = useCurrentUser();

  useEffect(() => {
    if (userData?.email) {
      localStorage.setItem("userEmail", userData.email);
    }
  }, [userData]);

  const dashboardBaseUrl = import.meta.env.VITE_REACT_APP_DASHBOARD_BASE_URL;
  useEffect(() => {
    if (!isAuthError || !dashboardBaseUrl?.trim()) return;
    window.location.href = dashboardBaseUrl;
  }, [isAuthError, dashboardBaseUrl]);

  // Projects data
  const {
    data: projectsResponse,
    isLoading: isProjectsLoading,
    isError: isProjectsError,
    error: projectsError,
  } = useProjects(1, 50);

  const { useUpdateProject, useDeleteProject } = useProjectMutations();
  const { mutate: renameProject, isPending: isRenaming } = useUpdateProject();
  const { mutate: deleteProject, isPending: isDeleting } = useDeleteProject();

  const adminId = "user-placeholder-12345";
  const { setSelectedProject } = useProjectContext();
  const navigate = useNavigate();
  const [deleteDialogProject, setDeleteDialogProject] = useState<any | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const handleSelectProject = (project: any) => {
    setSelectedProject(project);
    navigate(`/whatsapp/dashboard/${project._id}`);
  };

  const handleDeleteProject = (project: any) => {
    if (!project?._id) return;
    setDeleteDialogProject(project);
    setIsDeleteDialogOpen(true);
  };

  const openRenameDialog = (project: any) => {
    setRenameDialogProjectId(project._id);
    setRenameProjectName(project.projectName || "");
  };

  const closeRenameDialog = () => {
    setRenameDialogProjectId(null);
    setRenameProjectName("");
  };

  const submitRename = () => {
    if (!renameDialogProjectId || renameProjectName.trim().length < 3) return;
    renameProject(
      {
        projectId: renameDialogProjectId,
        payload: { projectName: renameProjectName.trim() },
      },
      {
        onSuccess: () => {
          toastUtils.success("Project renamed successfully");
          closeRenameDialog();
        },
        onError: (err) => {
          toastUtils.error(err, "Failed to rename project");
        }
      }
    );
  };

  const filteredProjects = projectsResponse?.results.filter(p =>
    p.projectName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (p.phone && p.phone.includes(searchQuery))
  ) || [];

  if (isAuthLoading && !userData) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#f8fafc]">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="h-12 w-12 rounded-full border-4 border-green-100 dark:border-green-500/20 border-t-green-500 animate-spin" />
            <div className="absolute inset-0 flex items-center justify-center">
              <Globe className="h-5 w-5 text-green-500" />
            </div>
          </div>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400 animate-pulse">Establishing secure connection...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full w-full min-w-0 max-w-full box-border p-2 transition-colors duration-500 sm:p-2 lg:p-4 xl:p-6 2xl:p-8">
      {/* Premium Header motion.div */}
      <motion.div
        className="mb-6 rounded-2xl border border-slate-200/60 p-4 sm:p-5 bg-white dark:bg-slate-800/50 shadow-sm dark:border-slate-700/50"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}

      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-green-600 dark:text-green-400 font-bold text-xs uppercase tracking-widest mb-1">
              <LayoutGrid className="h-3.5 w-3.5" />
              WhatsApp Module
            </div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-2xl">
              Projectsssss
            </h1>
            <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-xs font-medium">
              <div className="h-2 w-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,181,115,0.6)]" />
              {projectsResponse?.results.length || 0} active projects
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  className="h-12 px-6 rounded-2xl flex items-center justify-center gap-2 text-white shadow-xl shadow-green-600/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
                  style={{
                    backgroundColor: "#22B573",
                    fontWeight: 700,
                  }}
                >
                  <PlusCircle className="h-5 w-5" />
                  <span className="hidden sm:inline">New Project</span>
                  <span className="sm:hidden">New</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[450px] rounded-[32px] p-0 overflow-hidden border-none shadow-2xl">
                <div className="bg-gradient-to-br from-green-600 to-emerald-700 px-8 py-10 text-white">
                  <DialogTitle className="text-2xl font-black">Create Project</DialogTitle>
                  <p className="text-green-50/80 text-sm mt-2 font-medium">Set up a new WhatsApp Business context for your campaigns.</p>
                </div>
                <div className="p-8">
                  {adminId ? (
                    <ProjectForm
                      adminId={adminId}
                      onSuccess={() => setIsDialogOpen(false)}
                    />
                  ) : (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="h-8 w-8 animate-spin text-green-600 dark:text-green-400" />
                    </div>
                  )}
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </motion.div>

      {/* Main Content */}
      <main className="container mx-auto">
        {isProjectsLoading ? (
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <CardSkeleton key={i} />
            ))}
          </div>
        ) : isProjectsError ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-slate-800/50 rounded-[32px] border border-dashed border-red-200">
            <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">Unable to load projects</h3>
            <p className="text-slate-500 dark:text-slate-400 max-w-sm text-center mt-2 font-medium">{projectsError?.message || "An unexpected error occurred while fetching your projects."}</p>
          </div>
        ) : filteredProjects.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 bg-white/50 backdrop-blur-sm rounded-[40px] border-2 border-dashed border-slate-200 dark:border-slate-700/50">
            <div className="h-24 w-24 rounded-3xl bg-slate-100 dark:bg-slate-800/80 flex items-center justify-center mb-6">
              <FolderOpen className="h-12 w-12 text-slate-300" />
            </div>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white">No projects found</h3>
            <p className="text-slate-500 dark:text-slate-400 mt-2 mb-10 font-medium">
              {searchQuery ? `No results match "${searchQuery}"` : "Get started by creating your first WhatsApp project."}
            </p>
            <Button
              variant="outline"
              className="rounded-2xl border-slate-200 dark:border-slate-700/50 px-10 py-6 h-auto text-base font-bold transition-all hover:bg-slate-50 dark:hover:bg-slate-800"
              onClick={() => searchQuery ? setSearchQuery("") : setIsDialogOpen(true)}
            >
              {searchQuery ? "Clear Search" : "Create My First Project"}
            </Button>
          </div>
        ) : (
          <motion.div
            layout
            className="grid gap-6 md:grid-cols-2 xl:grid-cols-3"
          >
            <AnimatePresence>
              {filteredProjects.map((project) => (
                <motion.div
                  key={project._id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.3 }}
                >
                  <div
                    onClick={() => handleSelectProject(project)}
                    className="group relative flex flex-col bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 hover:border-green-400/50 dark:hover:border-green-500/50 hover:shadow-xl hover:shadow-green-900/5 dark:hover:shadow-green-500/10 rounded-[20px] p-5 sm:p-6 transition-all duration-300 cursor-pointer overflow-hidden"
                  >
                    {/* Hover Glow Effect */}
                    <div className="absolute top-0 right-0 -mr-16 -mt-16 h-40 w-40 rounded-full bg-green-500/5 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity" />

                    <div className="flex items-start justify-between mb-4 relative z-10">
                      <div className="flex h-12 w-12 items-center justify-center rounded-[14px] bg-green-50 dark:bg-green-500/10 text-green-600 dark:text-green-400 group-hover:bg-green-600 group-hover:text-white transition-all duration-300 shadow-sm">
                        <MessageCircle className="h-6 w-6" />
                      </div>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                          <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors">
                            <MoreVertical className="h-5 w-5" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="rounded-2xl border-slate-200 dark:border-slate-700/50 shadow-2xl p-2 min-w-[160px]">
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              openRenameDialog(project);
                            }}
                            className="gap-3 px-4 py-3 rounded-xl cursor-pointer font-medium"
                          >
                            <Edit3 className="h-4 w-4 text-blue-500" />
                            <span>Rename</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteProject(project);
                            }}
                            className="gap-3 px-4 py-3 rounded-xl text-red-600 dark:text-red-400 cursor-pointer focus:text-red-600 font-medium"
                          >
                            <Trash2 className="h-4 w-4" />
                            <span>Delete Project</span>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    <div className="mb-6 relative z-10">
                      <h3 className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-green-700 transition-colors line-clamp-1 mb-1.5">
                        {project.projectName}
                      </h3>
                      <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-xs font-semibold">
                        <div className="px-1.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 text-[9px] uppercase tracking-tighter font-black">Phone</div>
                        <span className="font-mono tracking-tight">{project.phone || "Not Set"}</span>
                      </div>
                    </div>

                    <div className="mt-auto pt-4 border-t border-slate-100 dark:border-slate-700/50 flex items-center justify-between relative z-10">
                      <div className="flex items-center gap-2 text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                        <Calendar className="h-3 w-3" />
                        {formatDate12(project.createdAt)}
                      </div>

                      <div className="flex items-center gap-1.5 text-green-600 dark:text-green-400 text-xs font-black opacity-0 group-hover:opacity-100 -translate-x-3 group-hover:translate-x-0 transition-all duration-300">
                        OPEN <ArrowRight className="h-4 w-4" />
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </main>

      {/* Delete Project Confirmation */}
      {isDeleteDialogOpen && deleteDialogProject && (
        <ConfirmDeleteModal
          setModal={(val) => {
            if (!val) {
              setIsDeleteDialogOpen(false);
              setDeleteDialogProject(null);
            }
          }}
          triggerDelete={() => {
            if (!deleteDialogProject?._id) return;
            deleteProject(deleteDialogProject._id, {
              onSuccess: () => {
                toastUtils.success("Project deleted successfully");
                setIsDeleteDialogOpen(false);
                setDeleteDialogProject(null);
              },
              onError: (err) => {
                toastUtils.error(err, "Failed to delete project");
              }
            });
          }}
          isLoading={isDeleting}
          itemName={deleteDialogProject.projectName}
        />
      )}

      {/* Rename Project Dialog */}
      <Dialog
        open={!!renameDialogProjectId}
        onOpenChange={(open) => !open && closeRenameDialog()}
      >
        <DialogContent
          className="max-w-sm border-0 bg-transparent p-0 shadow-none outline-none"
          onPointerDownOutside={(e) => e.preventDefault()}
          showCloseButton={false}
        >
          <div className="relative w-full rounded-2xl p-6 shadow-2xl flex flex-col bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Rename Project
              </h3>
              <button
                type="button"
                onClick={closeRenameDialog}
                className="p-1.5 rounded-lg hover:bg-black/5 transition-colors"
              >
                <X className="w-5 h-5 text-gray-500 dark:text-slate-400" />
              </button>
            </div>

            <div className="mb-8">
              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">
                New Project Name
              </label>
              <div className="relative">
                <Edit3 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none z-[1]" />
                <Input
                  autoFocus
                  type="text"
                  value={renameProjectName}
                  onChange={(e) => setRenameProjectName(e.target.value)}
                  placeholder="Enter new project name"
                  className="pl-9 rounded-xl border-slate-200 dark:border-slate-700/50 focus:ring-green-500/20 py-6 text-base font-medium shadow-sm bg-white dark:bg-slate-800/50"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-auto w-full">
              <Button
                type="button"
                variant="outline"
                onClick={closeRenameDialog}
                disabled={isRenaming}
                className="rounded-xl px-4 py-2.5 font-medium border-slate-200 dark:border-slate-700/50 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={submitRename}
                disabled={isRenaming || renameProjectName.trim().length < 3}
                className="rounded-xl px-6 py-2.5 font-bold hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 bg-[#22B573] hover:bg-[#1da467] text-white shadow-lg shadow-green-600/20"
              >
                {isRenaming ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : null}
                Save Changes
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
