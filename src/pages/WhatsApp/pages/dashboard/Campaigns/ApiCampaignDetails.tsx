import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Loader2,
  ArrowLeft,
  RefreshCw,
  Clock,
  FileText,
  Download,
  AlertCircle,
  CheckCircle,
  MessageSquare,
  BarChart3,
  Copy,
} from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { useApiCampaignById, useApiCampaignMessages } from "@/hooks/useApiCampaigns";
import { formatDateTime12 } from "@/lib/date";
import { useProjectContext } from "@/context/ProjectContext";
import { toastUtils } from "@/lib/utils";
import { apiCampaignApi } from "@/api/modules/apiCampaignAPI";

const getStatusMeta = (campaign?: {
  isDeleted?: boolean;
  isActive?: boolean;
}) => {
  if (!campaign) {
    return {
      label: "Unknown",
      badge: <Badge variant="outline">Unknown</Badge>,
      icon: <AlertCircle className="h-5 w-5 text-muted-foreground" />,
    };
  }

  if (campaign.isDeleted) {
    return {
      label: "Cancelled",
      badge: <Badge variant="destructive">Cancelled</Badge>,
      icon: <AlertCircle className="h-5 w-5 text-red-500" />,
    };
  }

  if (campaign.isActive === false) {
    return {
      label: "Inactive",
      badge: <Badge variant="secondary">Inactive</Badge>,
      icon: <Clock className="h-5 w-5 text-yellow-500" />,
    };
  }

  return {
    label: "Active",
    badge: <Badge className="bg-green-500 text-white">Active</Badge>,
    icon: <CheckCircle className="h-5 w-5 text-green-500" />,
  };
};

const ApiCampaignDetails = () => {
  const { campaignId, projectId } = useParams<{ campaignId: string; projectId: string }>();
  const { selectedProject } = useProjectContext();
  const resolvedProjectId = projectId || selectedProject?._id || "";

  const [showReport, setShowReport] = useState(false);
  const [reportPage, setReportPage] = useState(1);
  const [isDownloadingReport, setIsDownloadingReport] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(true);
  const [lastRefreshTime, setLastRefreshTime] = useState<Date | null>(null);
  const reportLimit = 10;

  const {
    data: campaign,
    isLoading,
    error,
    refetch,
    // isFetching,
  } = useApiCampaignById(campaignId || "");

  const {
    data: campaignMessagesData,
    isLoading: messagesLoading,
    error: messagesError,
    refetch: refetchMessages,
  } = useApiCampaignMessages(
    resolvedProjectId,
    campaign?._id || "",
    reportPage,
    reportLimit,
    showReport,
  );

  useEffect(() => {
    if (!autoRefreshEnabled || !campaignId) return;

    const interval = setInterval(async () => {
      try {
        await refetch();
        if (showReport) {
          await refetchMessages();
        }
        setLastRefreshTime(new Date());
      } catch (refreshError) {
        console.error("Auto-refresh failed:", refreshError);
      }
    }, 10000);

    return () => clearInterval(interval);
  }, [autoRefreshEnabled, campaignId, refetch, refetchMessages, showReport]);

  const handleRefresh = async () => {
    try {
      setIsRefreshing(true);
      await refetch();
      if (showReport) {
        await refetchMessages();
      }
      setLastRefreshTime(new Date());
      toastUtils.success("Campaign data refreshed successfully");
    } catch (refreshError) {
      console.error("Failed to refresh campaign data:", refreshError);
      toastUtils.error("Failed to refresh campaign data");
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleShowReport = () => {
    setShowReport((prev) => !prev);
    setReportPage(1);
  };

  const handleReportPageChange = (page: number) => {
    setReportPage(page);
  };

  const handleDownloadReport = async () => {
    if (!campaignId) {
      toastUtils.error("Campaign not found.");
      return;
    }

    setIsDownloadingReport(true);
    try {
      const response = await apiCampaignApi.downloadApiCampaignReport(campaignId);
      const reportData = response.data;
      const csvContent = convertToCSV(reportData);

      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `api-campaign-report-${campaign?.name ?? "campaign"}-${
          new Date().toISOString().split("T")[0]
        }.csv`,
      );
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toastUtils.success("Campaign report downloaded successfully");
    } catch (downloadError) {
      console.error("Failed to download report:", downloadError);
      toastUtils.error("Failed to download campaign report");
    } finally {
      setIsDownloadingReport(false);
    }
  };

  const convertToCSV = (reportData: any) => {
    const headers = [
      "Phone Number",
      "Template Name",
      "Message Type",
      "Status",
      "Created At",
      "Sent At",
      "Delivered At",
      "Read At",
      "Failure Reason",
      "WABA Message ID",
    ];

    const csvRows = [headers.join(",")];

    reportData.messages.forEach((message: any) => {
      const row = [
        message.phoneNumber || "",
        message.templateName || "",
        message.messageType || "",
        message.status || "",
        message.createdAt ? formatDateTime12(message.createdAt) : "",
        message.sentAt ? formatDateTime12(message.sentAt) : "",
        message.deliveredAt ? formatDateTime12(message.deliveredAt) : "",
        message.readAt ? formatDateTime12(message.readAt) : "",
        message.failureReason || "",
        message.wabaMessageId || "",
      ];
      csvRows.push(row.map((field) => `"${field}"`).join(","));
    });

    return csvRows.join("\n");
  };

  const analytics = useMemo(
    () =>
      campaign?.analyticsSummary || {
        total: 0,
        sent: 0,
        delivered: 0,
        read: 0,
        clicked: 0,
        failed: 0,
      },
    [campaign?.analyticsSummary],
  );

  const defaultSampleJSON = useMemo(() => {
    const hasMedia = Boolean(campaign?.messageTemplate?.headerMediaAssetId);

    return {
      campaignName: campaign?.name || "",
      destination: "<recipient_phone_number>",
      media: {
        url: hasMedia ? "<media_url>" : "",
        filename: hasMedia ? "<media_filename>" : "",
      },
      templateParams: campaign?.messageTemplate?.bodyVariables || [],
    };
  }, [campaign?.messageTemplate?.bodyVariables, campaign?.messageTemplate?.headerMediaAssetId, campaign?.name]);

  const samplePayload = useMemo(
    () => campaign?.sampleJSON || defaultSampleJSON,
    [campaign?.sampleJSON, defaultSampleJSON],
  );

  console.log('samplePayload', samplePayload, campaign);

  const executeEndpointUrl = useMemo(() => {
    const baseUrl = import.meta.env.VITE_REACT_APP_API_BASE_URL;
    return baseUrl ? `${baseUrl}/api-campaign/execute` : "/api-campaign/execute";
  }, []);

  const samplePayloadString = useMemo(
    () => JSON.stringify(samplePayload, null, 2),
    [samplePayload],
  );

  const handleCopyToClipboard = async (value: string, label: string) => {
    try {
      await navigator.clipboard.writeText(value);
      toastUtils.success(`${label} copied to clipboard`);
    } catch (copyError) {
      console.error("Copy failed", copyError);
      toastUtils.error(`Failed to copy ${label.toLowerCase()}`);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !campaign) {
    return (
      <Alert variant="destructive">
        <AlertDescription>
          {error
            ? (error as any)?.response?.data?.message || error.message
            : "Campaign not found"}
        </AlertDescription>
      </Alert>
    );
  }

  const statusMeta = getStatusMeta(campaign);

  const reportData = campaignMessagesData
    ? {
        messages: campaignMessagesData.wabaMessages,
        pagination: {
          page: campaignMessagesData.page,
          limit: campaignMessagesData.limit,
          totalCount: campaignMessagesData.total,
          totalPages: campaignMessagesData.totalPages,
          hasNextPage: campaignMessagesData.page < campaignMessagesData.totalPages,
          hasPrevPage: campaignMessagesData.page > 1,
        },
      }
    : null;

  return (
    <div className="h-full flex flex-col space-y-6 overflow-y-auto">
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link to={`/whatsapp/dashboard/${resolvedProjectId}/api-campaigns`}>
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to list
              </Button>
            </Link>
            <div className="flex items-center gap-2">
              {statusMeta.icon}
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                {campaign.name}
              </h1>
              {statusMeta.badge}
            </div>
          </div>
          <div className="text-sm text-muted-foreground">
            <div className="font-medium">
              Project: {selectedProject?.projectName || "Unknown Project"}
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
          <div className="flex flex-wrap items-center gap-2">
            <Button
              onClick={handleRefresh}
              variant="outline"
              size="sm"
              disabled={isRefreshing}
              className="flex items-center gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
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

            <Button
              onClick={handleShowReport}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <FileText className="h-4 w-4" />
              {showReport ? "Hide Report" : "View Report"}
            </Button>

            <Button
              onClick={handleDownloadReport}
              variant="outline"
              size="sm"
              disabled={isDownloadingReport}
              className="flex items-center gap-2"
            >
              {isDownloadingReport ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              {isDownloadingReport ? "Downloading..." : "Download Report"}
            </Button>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Campaign Details
            </CardTitle>
            <CardDescription>Stored when the campaign was created.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Template</p>
                <p className="text-sm">{campaign.messageTemplate.templateName}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Status</p>
                <div className="flex items-center gap-2">{statusMeta.badge}</div>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Created</p>
                <p className="text-sm">
                  {campaign.createdAt ? formatDateTime12(campaign.createdAt) : "—"}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Updated</p>
                <p className="text-sm">
                  {campaign.updatedAt ? formatDateTime12(campaign.updatedAt) : "—"}
                </p>
              </div>
            </div>
          
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Analytics Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Total Messages</span>
              <span className="font-semibold">{analytics.total}</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Sent</span>
              <span className="font-semibold text-green-600">{analytics.sent}</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Delivered</span>
              <span className="font-semibold text-blue-600">{analytics.delivered}</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Read</span>
              <span className="font-semibold text-purple-600">{analytics.read}</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Failed</span>
              <span className="font-semibold text-red-600">{analytics.failed}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              API Execution Details
            </CardTitle>
            <CardDescription>
              Use this endpoint and payload from your external system to trigger the campaign.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Execute Endpoint</p>
                  <p className="text-sm break-all font-mono">{executeEndpointUrl}</p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleCopyToClipboard(executeEndpointUrl, "Endpoint URL")}
                  className="flex items-center gap-2 shrink-0"
                >
                  <Copy className="h-4 w-4" />
                  Copy
                </Button>
              </div>
            </div>

            <Separator />

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-muted-foreground">Sample JSON payload</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleCopyToClipboard(samplePayloadString, "Sample JSON")}
                  className="flex items-center gap-2"
                >
                  <Copy className="h-4 w-4" />
                  Copy
                </Button>
              </div>
              <div className="rounded-md bg-muted p-4 overflow-auto max-h-80">
                <pre className="text-xs sm:text-sm font-mono whitespace-pre-wrap break-words">
                  {samplePayloadString}
                </pre>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5" />
            Performance Metrics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {analytics.total > 0
                  ? Math.round((analytics.delivered / analytics.total) * 100)
                  : 0}
                %
              </div>
              <div className="text-sm text-muted-foreground">Delivery Rate</div>
            </div>

            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {analytics.delivered > 0
                  ? Math.round((analytics.read / analytics.delivered) * 100)
                  : 0}
                %
              </div>
              <div className="text-sm text-muted-foreground">Read Rate</div>
            </div>

            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {analytics.read > 0
                  ? Math.round((analytics.clicked / analytics.read) * 100)
                  : 0}
                %
              </div>
              <div className="text-sm text-muted-foreground">Click Rate</div>
            </div>

            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                {analytics.total > 0
                  ? Math.round((analytics.failed / analytics.total) * 100)
                  : 0}
                %
              </div>
              <div className="text-sm text-muted-foreground">Failure Rate</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {showReport && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Campaign Report
            </CardTitle>
          </CardHeader>
          <CardContent>
            {messagesLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin mr-2" />
                Loading campaign messages...
              </div>
            ) : messagesError ? (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Failed to load campaign messages. Please try again.
                </AlertDescription>
              </Alert>
            ) : !reportData || reportData.messages.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No messages found for this campaign.
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Phone Number</TableHead>
                      <TableHead>Template Name</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Message Type</TableHead>
                      <TableHead>Created At</TableHead>
                      <TableHead>Sent At</TableHead>
                      <TableHead>Delivered At</TableHead>
                      <TableHead>Read At</TableHead>
                      <TableHead>Error</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reportData.messages.map((message) => (
                      <TableRow key={message._id}>
                        <TableCell className="font-medium">{message.phoneNumber}</TableCell>
                        <TableCell className="font-medium">{message.templateName}</TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              message.status === "delivered" || message.status === "read"
                                ? "default"
                                : message.status === "sent"
                                  ? "secondary"
                                  : message.status === "failed"
                                    ? "destructive"
                                    : "outline"
                            }
                            className={
                              message.status === "delivered"
                                ? "bg-green-500"
                                : message.status === "read"
                                  ? "bg-blue-500"
                                  : message.status === "sent"
                                    ? "bg-yellow-500"
                                    : ""
                            }
                          >
                            {message.status?.toUpperCase()}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{message.messageType}</Badge>
                        </TableCell>
                        <TableCell>{formatDateTime12(message.createdAt)}</TableCell>
                        <TableCell>
                          {message.sentAt ? formatDateTime12(message.sentAt) : "-"}
                        </TableCell>
                        <TableCell>
                          {message.deliveredAt ? formatDateTime12(message.deliveredAt) : "-"}
                        </TableCell>
                        <TableCell>{message.readAt ? formatDateTime12(message.readAt) : "-"}</TableCell>
                        <TableCell className="text-red-600">
                          {message.failureReason || "-"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}

            {reportData && reportData.pagination.totalPages > 1 && (
              <div className="flex justify-center pt-4">
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        onClick={(e) => {
                          e.preventDefault();
                          if (reportData.pagination.hasPrevPage) {
                            handleReportPageChange(reportPage - 1);
                          }
                        }}
                        className={
                          !reportData.pagination.hasPrevPage
                            ? "pointer-events-none opacity-50"
                            : "cursor-pointer"
                        }
                      />
                    </PaginationItem>

                    {reportPage > 3 && (
                      <>
                        <PaginationItem>
                          <PaginationLink
                            onClick={(e) => {
                              e.preventDefault();
                              handleReportPageChange(1);
                            }}
                            className="cursor-pointer"
                          >
                            1
                          </PaginationLink>
                        </PaginationItem>
                        {reportPage > 4 && (
                          <PaginationItem>
                            <PaginationEllipsis />
                          </PaginationItem>
                        )}
                      </>
                    )}

                    {Array.from({ length: Math.min(5, reportData.pagination.totalPages) }, (_, i) => {
                      const startPage = Math.max(1, reportPage - 2);
                      const pageNum = startPage + i;

                      if (pageNum > reportData.pagination.totalPages) return null;

                      return (
                        <PaginationItem key={pageNum}>
                          <PaginationLink
                            onClick={(e) => {
                              e.preventDefault();
                              handleReportPageChange(pageNum);
                            }}
                            isActive={pageNum === reportPage}
                            className="cursor-pointer"
                          >
                            {pageNum}
                          </PaginationLink>
                        </PaginationItem>
                      );
                    })}

                    {reportPage < reportData.pagination.totalPages - 2 && (
                      <>
                        {reportPage < reportData.pagination.totalPages - 3 && (
                          <PaginationItem>
                            <PaginationEllipsis />
                          </PaginationItem>
                        )}
                        <PaginationItem>
                          <PaginationLink
                            onClick={(e) => {
                              e.preventDefault();
                              handleReportPageChange(reportData.pagination.totalPages);
                            }}
                            className="cursor-pointer"
                          >
                            {reportData.pagination.totalPages}
                          </PaginationLink>
                        </PaginationItem>
                      </>
                    )}

                    <PaginationItem>
                      <PaginationNext
                        onClick={(e) => {
                          e.preventDefault();
                          if (reportData.pagination.hasNextPage) {
                            handleReportPageChange(reportPage + 1);
                          }
                        }}
                        className={
                          !reportData.pagination.hasNextPage
                            ? "pointer-events-none opacity-50"
                            : "cursor-pointer"
                        }
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ApiCampaignDetails;
