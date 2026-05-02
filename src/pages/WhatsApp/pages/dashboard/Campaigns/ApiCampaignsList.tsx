import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
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
    onConfirm: async () => {},
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
      "default",
      async () => {
        await deleteApiCampaignMutation.mutateAsync(campaignId);
        await refetch();
      }
    );
  };

  const getStatusBadge = (campaign: any) => {
    if (campaign.isDeleted) {
      return <Badge variant="destructive">Cancelled</Badge>;
    }

    if (campaign.isActive === false) {
      return <Badge variant="secondary">Inactive</Badge>;
    }

    return <Badge className="bg-green-500 text-white">Active</Badge>;
  };

  if (!selectedProject) {
    return (
      <div className="flex items-center justify-center h-64">
        <Alert>
          <AlertDescription>
            Please select a project to view API campaigns.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>
          Failed to load API campaigns:{" "}
          {(error as any)?.response?.data?.message || error.message}
        </AlertDescription>
      </Alert>
    );
  }

  const campaigns = data?.campaigns || [];
  const pagination = data?.pagination;

  return (
    <div className="h-full flex flex-col space-y-4 sm:space-y-6 px-2 sm:px-0">
      <div className="space-y-4 flex-shrink-0">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-primary" />
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                API Campaigns
              </h1>
              <p className="text-sm text-muted-foreground">
                Lightweight campaigns you can trigger programmatically.
              </p>
            </div>
          </div>
          <div className="text-sm text-muted-foreground">
            <div className="font-medium">
              Project: {selectedProject?.projectName || "Unknown"}
            </div>
            {lastRefreshTime && (
              <div className="text-xs text-muted-foreground">
                Last updated:{" "}
                {lastRefreshTime.toLocaleTimeString("en-US", {
                  hour: "numeric",
                  minute: "2-digit",
                  second: "2-digit",
                  hour12: true,
                })}
              </div>
            )}
          </div>
        </div>

        <div
          className={`flex flex-col sm:flex-row items-start sm:items-center gap-3 ${
            autoRefreshEnabled ? "justify-between" : "justify-end"
          }`}
        >
          {autoRefreshEnabled && (
            <div className="flex items-center gap-2 text-sm text-green-600">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span>Auto-refresh active</span>
            </div>
          )}

          <div className="flex items-center gap-2">
            <Button
              onClick={handleRefresh}
              variant="outline"
              size="sm"
              disabled={isRefreshing}
              className="flex items-center gap-2"
            >
              <RefreshCw
                className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`}
              />
              <span className="hidden sm:inline">
                {isRefreshing ? "Refreshing..." : "Refresh"}
              </span>
            </Button>

            <Button
              onClick={() => setAutoRefreshEnabled((prev) => !prev)}
              variant={autoRefreshEnabled ? "default" : "outline"}
              size="sm"
              className="flex items-center gap-2 w-32"
            >
              <Clock className="h-4 w-4" />
              <span className="hidden sm:inline">
                {autoRefreshEnabled ? "Disable Auto" : "Enable Auto"}
              </span>
            </Button>

            <Link to={`/whatsapp/dashboard/${resolvedProjectId}/api-campaigns/create`}>
              <Button className="flex items-center gap-2">
                <MessageSquarePlus className="h-4 w-4" />
                <span className="hidden sm:inline">Create API Campaign</span>
                <span className="sm:hidden">Create</span>
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="flex-1 min-h-0 flex flex-col">
        {campaigns.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 border rounded-lg flex-1 text-center space-y-3">
            <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto" />
            <h3 className="text-lg font-semibold">No API campaigns yet</h3>
            <p className="text-sm text-muted-foreground max-w-md">
              Create your first API campaign to start triggering template sends
              programmatically.
            </p>
            <Link to={`/whatsapp/dashboard/${resolvedProjectId}/api-campaigns/create`}>
              <Button>Create your first API campaign</Button>
            </Link>
          </div>
        ) : (
          <div className="border rounded-lg overflow-hidden flex-1 flex flex-col">
            <div className="overflow-auto flex-1">
              <table className="w-full min-w-[720px]">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Campaign Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Template
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Created
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                  {campaigns.map((campaign) => (
                    <tr
                      key={campaign._id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-800"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {campaign.name}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-white">
                          {campaign.messageTemplate.templateName}
                        </div>
                        {campaign.messageTemplate.bodyVariables &&
                          campaign.messageTemplate.bodyVariables.length > 0 && (
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              {campaign.messageTemplate.bodyVariables.length}{" "}
                              placeholder(s)
                            </div>
                          )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {campaign.createdAt
                          ? formatDate12(campaign.createdAt)
                          : "—"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(campaign)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center gap-2">
                          <Link
                            to={`/whatsapp/dashboard/${resolvedProjectId}/api-campaigns/${campaign._id}`}
                          >
                            <Button variant="outline" size="sm">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </Link>
                          {!campaign.isDeleted && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleCancelApiCampaign(campaign._id)}
                              disabled={deleteApiCampaignMutation.isPending}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {pagination && pagination.totalPages > 1 && (
        <div className="flex justify-center pt-4 flex-shrink-0">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  onClick={(e) => {
                    e.preventDefault();
                    if (pagination.hasPrevPage)
                      handlePageChange(currentPage - 1);
                  }}
                  className={
                    !pagination.hasPrevPage
                      ? "pointer-events-none opacity-50"
                      : "cursor-pointer"
                  }
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
                      className="cursor-pointer"
                    >
                      1
                    </PaginationLink>
                  </PaginationItem>
                  {currentPage > 4 && (
                    <PaginationItem>
                      <PaginationEllipsis />
                    </PaginationItem>
                  )}
                </>
              )}

              {Array.from(
                { length: Math.min(5, pagination.totalPages) },
                (_, i) => {
                  const startPage = Math.max(1, currentPage - 2);
                  const pageNum = startPage + i;

                  if (pageNum > pagination.totalPages) return null;

                  return (
                    <PaginationItem key={pageNum}>
                      <PaginationLink
                        onClick={(e) => {
                          e.preventDefault();
                          handlePageChange(pageNum);
                        }}
                        isActive={pageNum === currentPage}
                        className="cursor-pointer"
                      >
                        {pageNum}
                      </PaginationLink>
                    </PaginationItem>
                  );
                }
              )}

              {currentPage < pagination.totalPages - 2 && (
                <>
                  {currentPage < pagination.totalPages - 3 && (
                    <PaginationItem>
                      <PaginationEllipsis />
                    </PaginationItem>
                  )}
                  <PaginationItem>
                    <PaginationLink
                      onClick={(e) => {
                        e.preventDefault();
                        handlePageChange(pagination.totalPages);
                      }}
                      className="cursor-pointer"
                    >
                      {pagination.totalPages}
                    </PaginationLink>
                  </PaginationItem>
                </>
              )}

              <PaginationItem>
                <PaginationNext
                  onClick={(e) => {
                    e.preventDefault();
                    if (pagination.hasNextPage)
                      handlePageChange(currentPage + 1);
                  }}
                  className={
                    !pagination.hasNextPage
                      ? "pointer-events-none opacity-50"
                      : "cursor-pointer"
                  }
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}
      <ConfirmationDialog
        isOpen={confirmationDialog.isOpen}
        onClose={closeConfirmationDialog}
        onConfirm={handleConfirmationConfirm}
        title={confirmationDialog.title}
        description={confirmationDialog.description}
        variant={confirmationDialog.variant}
        isLoading={confirmationDialog.isLoading}
        confirmText={
          confirmationDialog.variant === "destructive" ? "Cancel" : "Confirm"
        }
        cancelText="Cancel"
      />
    </div>
  );
};

export default ApiCampaignsList;

