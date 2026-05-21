import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { ConfirmationDialog } from "@/components/ui/ConfirmationDialog";
import { useProjectContext } from "@/context/ProjectContext";
import { useApiCampaigns, useDeleteApiCampaign } from "@/hooks/useApiCampaigns";
import { formatDate12 } from "@/lib/date";
import {
  RefreshCw,
  Loader2,
  MessageSquare,
  MessageSquarePlus,
  Clock,
  Eye,
  X,
  Plus,
  Settings2,
  Activity,
  History,
  Trash2,
  Zap,
  Target,
  Sparkles,
  Search,
  Code,
  AlertCircle
} from "lucide-react";

type ConfirmationDialogState = {
  isOpen: boolean;
  title: string;
  description: string;
  variant: "default" | "destructive";
  onConfirm: () => Promise<void>;
  isLoading: boolean;
};

const ApiCampaignsList = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const { selectedProject } = useProjectContext();
  const resolvedProjectId = projectId ?? selectedProject?._id ?? "";
  const [currentPage, setCurrentPage] = useState(1);
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefreshTime, setLastRefreshTime] = useState<Date | null>(null);
  const [confirmationDialog, setConfirmationDialog] = useState<ConfirmationDialogState>({
    isOpen: false,
    title: "",
    description: "",
    variant: "default" as "default" | "destructive",
    onConfirm: async () => { },
    isLoading: false,
  });
  const limit = 10;

  const activeProjectId = selectedProject?._id || resolvedProjectId;

  const { data, isLoading, error, refetch } = useApiCampaigns(
    activeProjectId,
    currentPage,
    limit
  );
  const deleteApiCampaignMutation = useDeleteApiCampaign();

  useEffect(() => {
    if (!autoRefreshEnabled || !activeProjectId) return;

    const interval = setInterval(async () => {
      try {
        await refetch();
        setLastRefreshTime(new Date());
      } catch (refreshError) {
        console.error("Auto-refresh failed:", refreshError);
      }
    }, 10000);

    return () => clearInterval(interval);
  }, [autoRefreshEnabled, activeProjectId, refetch]);

  const handleRefresh = async () => {
    try {
      setIsRefreshing(true);
      await refetch();
      setLastRefreshTime(new Date());
    } catch (refreshError) {
      console.error("Failed to refresh API campaigns:", refreshError);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const showConfirmationDialog = (
    title: string,
    description: string,
    variant: "default" | "destructive",
    onConfirm: () => Promise<void>
  ) => {
    setConfirmationDialog({
      isOpen: true,
      title,
      description,
      variant,
      onConfirm,
      isLoading: false,
    });
  };

  const closeConfirmationDialog = () => {
    setConfirmationDialog((prev) => ({
      ...prev,
      isOpen: false,
      isLoading: false,
    }));
  };

  const handleConfirmationConfirm = async () => {
    setConfirmationDialog((prev) => ({ ...prev, isLoading: true }));
    try {
      await confirmationDialog.onConfirm();
      closeConfirmationDialog();
    } catch (dialogError) {
      console.error("Confirmation action failed:", dialogError);
      setConfirmationDialog((prev) => ({ ...prev, isLoading: false }));
    }
  };

  const handleCancelApiCampaign = (campaignId: string) => {
    showConfirmationDialog(
      "Cancel API Campaign",
      "Are you sure you want to cancel this API campaign? This action cannot be undone.",
      "destructive",
      async () => {
        await deleteApiCampaignMutation.mutateAsync(campaignId);
        await refetch();
      }
    );
  };

  const getStatusBadge = (campaign: any) => {
    if (campaign.isDeleted) {
      return (
        <Badge variant="outline" className="rounded-lg font-black text-[10px] uppercase tracking-widest px-2 py-0.5 border-red-100 dark:border-red-900 bg-red-50 dark:bg-red-900 text-red-600 dark:text-red-400 shadow-sm">
          Cancelled
        </Badge>
      );
    }

    if (campaign.isActive === false) {
      return (
        <Badge variant="outline" className="rounded-lg font-black text-[10px] uppercase tracking-widest px-2 py-0.5 border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400 shadow-sm">
          Inactive
        </Badge>
      );
    }

    return (
      <Badge variant="outline" className="rounded-lg font-black text-[10px] uppercase tracking-widest px-2 py-0.5 border-emerald-100 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900 text-emerald-600 dark:text-emerald-400 shadow-sm">
        Active
      </Badge>
    );
  };

  const renderPagination = () => {
    if (!data?.pagination) return null;
    const { totalPages, hasPrevPage, hasNextPage } = data.pagination;

    return (
      <div className="flex justify-center pt-10">
        <Pagination>
          <PaginationContent className="gap-2">
            <PaginationItem>
              <PaginationPrevious
                onClick={(e) => {
                  e.preventDefault();
                  if (hasPrevPage) handlePageChange(currentPage - 1);
                }}
                className={`rounded-xl border-slate-200 dark:border-slate-700/50 h-10 px-4 font-bold text-slate-600 dark:text-slate-400 transition-all hover:bg-slate-50 dark:hover:bg-slate-900/50 ${!hasPrevPage ? 'pointer-events-none opacity-40' : 'cursor-pointer hover:scale-[1.02] active:scale-[0.98]'}`}
              />
            </PaginationItem>

            {currentPage > 3 && (
              <>
                <PaginationItem>
                  <PaginationLink
                    onClick={(e) => {
                      e.preventDefault();
                      handlePageChange(1);
                    }}
                    className="cursor-pointer h-10 w-10 rounded-xl border-slate-200 dark:border-slate-700/50 font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900/50"
                  >
                    1
                  </PaginationLink>
                </PaginationItem>
                {currentPage > 4 && <PaginationItem><PaginationEllipsis /></PaginationItem>}
              </>
            )}

            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const startPage = Math.max(1, currentPage - 2);
              const pageNum = startPage + i;
              if (pageNum > totalPages) return null;

              return (
                <PaginationItem key={pageNum}>
                  <PaginationLink
                    onClick={(e) => {
                      e.preventDefault();
                      handlePageChange(pageNum);
                    }}
                    isActive={pageNum === currentPage}
                    className={`cursor-pointer h-10 w-10 rounded-xl font-bold transition-all ${pageNum === currentPage
                        ? 'bg-[#22B573] text-white border-[#22B573] shadow-lg shadow-green-600/20'
                        : 'border-slate-200 dark:border-slate-700/50 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900/50'
                      }`}
                  >
                    {pageNum}
                  </PaginationLink>
                </PaginationItem>
              );
            })}

            {currentPage < totalPages - 2 && (
              <>
                {currentPage < totalPages - 3 && <PaginationItem><PaginationEllipsis /></PaginationItem>}
                <PaginationItem>
                  <PaginationLink
                    onClick={(e) => {
                      e.preventDefault();
                      handlePageChange(totalPages);
                    }}
                    className="cursor-pointer h-10 w-10 rounded-xl border-slate-200 dark:border-slate-700/50 font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900/50"
                  >
                    {totalPages}
                  </PaginationLink>
                </PaginationItem>
              </>
            )}

            <PaginationItem>
              <PaginationNext
                onClick={(e) => {
                  e.preventDefault();
                  if (hasNextPage) handlePageChange(currentPage + 1);
                }}
                className={`rounded-xl border-slate-200 dark:border-slate-700/50 h-10 px-4 font-bold text-slate-600 dark:text-slate-400 transition-all hover:bg-slate-50 dark:hover:bg-slate-900/50 ${!hasNextPage ? 'pointer-events-none opacity-40' : 'cursor-pointer hover:scale-[1.02] active:scale-[0.98]'}`}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>
    );
  };

  if (!selectedProject) {
    return (
      <div className="min-h-full flex items-center justify-center p-8">
        <Alert className="max-w-md rounded-[32px] p-8 border border-slate-200 dark:border-slate-800 shadow-2xl bg-white dark:bg-slate-900">
          <AlertCircle className="h-8 w-8 mb-4 text-[#22B573]" />
          <AlertTitle className="text-xl font-black text-slate-900 dark:text-white mb-2">Project Required</AlertTitle>
          <AlertDescription className="text-slate-500 dark:text-slate-400 font-medium">
            Please select a project from the sidebar to view your API campaigns.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-[400px] flex flex-col items-center justify-center py-24 text-slate-400">
        <div className="h-16 w-16 bg-slate-50 dark:bg-slate-900 rounded-2xl flex items-center justify-center mb-4 border border-slate-100 dark:border-slate-800">
          <Loader2 className="h-8 w-8 animate-spin text-[#22B573]" />
        </div>
        <p className="font-bold text-sm uppercase tracking-widest">Initializing API Hub...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-full flex items-center justify-center p-8">
        <Alert variant="destructive" className="max-w-md rounded-[32px] p-8 border border-red-100 dark:border-red-900/50 shadow-2xl bg-white dark:bg-slate-900">
          <AlertCircle className="h-8 w-8 mb-4 text-red-500" />
          <AlertTitle className="text-xl font-black text-slate-900 dark:text-white mb-2">Connection Error</AlertTitle>
          <AlertDescription className="text-slate-500 dark:text-slate-400 font-medium">
            Failed to load API campaigns: {(error as any)?.response?.data?.message || error.message}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const campaigns = data?.campaigns || [];

  return (
    <div className="min-h-full w-full min-w-0 max-w-full box-border p-2 transition-colors duration-500 sm:p-2 md:p-0 lg:p-0 xl:p-2 2xl:p-4">
      {/* Premium Header */}
      <motion.div
        className="mb-6 rounded-2xl border border-slate-200 p-4 sm:p-5 bg-white dark:bg-slate-900 shadow-sm dark:border-slate-800"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-[#22B573] font-bold text-xs uppercase tracking-widest mb-0.5">
                <Sparkles className="h-3.5 w-3.5" />
                API Hub
              </div>
              <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-2xl">
                API Campaigns
              </h1>
              <p className="text-slate-500 dark:text-slate-400 text-xs font-medium">
                Programmatically triggered template messaging hub.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex flex-col items-end mr-2 hidden sm:flex">
              {lastRefreshTime && (
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                  Last Updated: {lastRefreshTime.toLocaleTimeString()}
                </span>
              )}
              {autoRefreshEnabled && (
                <div className="flex items-center gap-1.5 mt-1">
                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                  <span className="text-[10px] font-bold text-green-600 dark:text-green-400 uppercase tracking-widest">Live Sync Active</span>
                </div>
              )}
            </div>

            <Button
              onClick={handleRefresh}
              variant="outline"
              disabled={isRefreshing}
              className="h-11 px-6 rounded-xl flex items-center gap-2 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 font-bold text-sm transition-all hover:bg-slate-50 dark:hover:bg-slate-800 hover:scale-[1.02] active:scale-[0.98]"
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              {isRefreshing ? 'Syncing...' : 'Sync Now'}
            </Button>

            <Button
              onClick={() => setAutoRefreshEnabled(!autoRefreshEnabled)}
              className={`h-11 px-6 rounded-xl flex items-center gap-2 font-bold text-sm shadow-lg transition-all hover:scale-[1.02] active:scale-[0.98] ${
                autoRefreshEnabled 
                  ? 'bg-slate-900 dark:bg-green-900/50 text-white dark:text-green-400 border-slate-900 dark:border-green-500 shadow-slate-900/10' 
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              <motion.div
                animate={autoRefreshEnabled ? { rotate: 360 } : { rotate: 0 }}
                transition={autoRefreshEnabled ? { repeat: Infinity, duration: 4, ease: "linear" } : { duration: 0.5 }}
              >
                <Clock className="h-4 w-4" />
              </motion.div>
              {autoRefreshEnabled ? 'Live' : 'Manual'}
            </Button>

            <Link to={`/whatsapp/dashboard/${resolvedProjectId}/api-campaigns/create`}>
              <Button className="h-11 px-6 rounded-xl flex items-center gap-2 font-bold text-sm shadow-lg shadow-green-600/20 bg-[#22B573] hover:bg-[#1da467] text-white transition-all hover:scale-[1.02] active:scale-[0.98]">
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">New API Campaign</span>
                <span className="sm:hidden">New</span>
              </Button>
            </Link>
          </div>
        </div>
      </motion.div>

      {/* Main Content Area */}
      <div className="space-y-6">
        {campaigns.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center py-24 px-8 border border-dashed border-slate-200 dark:border-slate-800 rounded-[32px] bg-slate-50 dark:bg-slate-950 text-center space-y-6"
          >
            <div className="h-24 w-24 bg-white dark:bg-slate-800/50 rounded-3xl flex items-center justify-center shadow-xl shadow-slate-200/50">
              <Sparkles className="h-12 w-12 text-[#22B573]" />
            </div>
            <div className="space-y-2">
              <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">No API Campaigns Found</h3>
              <p className="text-slate-500 dark:text-slate-400 text-sm font-medium max-w-sm mx-auto">
                Trigger high-volume template sends directly from your own systems via our robust API interface.
              </p>
            </div>
            <Link to={`/whatsapp/dashboard/${resolvedProjectId}/api-campaigns/create`}>
              <Button className="h-12 px-8 rounded-2xl bg-[#22B573] hover:bg-[#1da467] text-white font-black uppercase tracking-widest text-xs shadow-xl shadow-green-600/20 transition-all hover:scale-105 active:scale-95">
                Build First API Campaign
              </Button>
            </Link>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-6">
            <AnimatePresence mode="popLayout">
              {campaigns.map((campaign, index) => (
                <motion.div
                  key={campaign._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ delay: index * 0.05 }}
                  className="group relative flex flex-col h-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 hover:shadow-xl transition-all duration-300"
                >
                  {/* Status Indicator */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="h-10 w-10 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-700/50 flex items-center justify-center text-slate-400 group-hover:text-[#22B573] group-hover:bg-[#22B573]/5 group-hover:border-[#22B573]/20 transition-all duration-300">
                      <Target className="h-5 w-5" />
                    </div>
                    {getStatusBadge(campaign)}
                  </div>

                  {/* Body */}
                  <div className="flex-1 space-y-4">
                    <div className="space-y-1">
                      <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tight group-hover:text-[#22B573] transition-colors line-clamp-1">
                        {campaign.name}
                      </h3>
                      <div className="flex items-center gap-2">
                        <MessageSquare className="h-3.5 w-3.5 text-slate-400" />
                        <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider truncate">
                          {campaign.messageTemplate.templateName}
                        </span>
                      </div>
                    </div>

                    {/* Metadata Grid */}
                    <div className="grid grid-cols-2 gap-3 pt-4 border-t border-slate-100 dark:border-slate-700/50">
                      <div className="space-y-0.5">
                        <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Created</p>
                        <p className="text-[11px] font-bold text-slate-600 dark:text-slate-400">{campaign.createdAt ? formatDate12(campaign.createdAt) : "—"}</p>
                      </div>
                      <div className="space-y-0.5">
                        <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Parameters</p>
                        <p className="text-[11px] font-bold text-slate-600 dark:text-slate-400">
                          {campaign.messageTemplate.bodyVariables?.length || 0} Variable(s)
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="mt-6 flex items-center gap-2">
                    <Link
                      to={campaign.isDeleted ? "#" : `/whatsapp/dashboard/${resolvedProjectId}/api-campaigns/${campaign._id}`}
                      className={`flex-1 ${campaign.isDeleted ? "pointer-events-none" : ""}`}
                    >
                      <Button
                        variant="outline"
                        disabled={campaign.isDeleted}
                        className="w-full h-10 rounded-xl border-slate-100 dark:border-slate-700/50 bg-slate-50/50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400 font-bold text-xs uppercase tracking-widest hover:bg-[#22B573] hover:text-white hover:border-[#22B573] transition-all duration-300 disabled:opacity-30"
                      >
                        <Eye className="h-3.5 w-3.5 mr-2" />
                        Explore
                      </Button>
                    </Link>
                    {!campaign.isDeleted && (
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleCancelApiCampaign(campaign._id)}
                        disabled={deleteApiCampaignMutation.isPending}
                        className="h-10 w-10 rounded-xl border-slate-100 dark:border-slate-700/50 bg-slate-50/50 dark:bg-slate-800/50 text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 hover:border-red-100 transition-all duration-300"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}

        {/* Pagination */}
        {renderPagination()}
      </div>

      <ConfirmationDialog
        isOpen={confirmationDialog.isOpen}
        onClose={closeConfirmationDialog}
        onConfirm={handleConfirmationConfirm}
        title={confirmationDialog.title}
        description={confirmationDialog.description}
        variant={confirmationDialog.variant}
        isLoading={confirmationDialog.isLoading}
        confirmText={
          confirmationDialog.variant === "destructive" ? "Confirm Delete" : "Confirm"
        }
        cancelText="Discard"
      />
    </div>
  );
};

export default ApiCampaignsList;

