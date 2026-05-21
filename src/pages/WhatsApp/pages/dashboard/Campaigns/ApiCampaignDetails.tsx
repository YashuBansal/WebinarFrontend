import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  ArrowLeft,
  RefreshCw,
  Clock,
  AlertCircle,
  MessageSquare,
  Copy,
  Zap,
  Activity,
  Code,
  Target,
  Sparkles,
  Search,
  CheckCircle2,
  TrendingUp,
  LayoutGrid,
  History,
  Download,
  Settings2
} from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Pagination,
  PaginationContent,
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

const getStatusStyles = (campaign?: { isDeleted?: boolean; isActive?: boolean }) => {
  if (!campaign) return { label: "Unknown", color: "text-slate-400", bg: "bg-slate-50 dark:bg-slate-900/50", border: "border-slate-100 dark:border-slate-700/50", icon: AlertCircle };
  if (campaign.isDeleted) return { label: "Cancelled", color: "text-red-600 dark:text-red-400", bg: "bg-red-50 dark:bg-red-500/10", border: "border-red-100 dark:border-red-500/20", icon: AlertCircle };
  if (campaign.isActive === false) return { label: "Inactive", color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-50 dark:bg-amber-500/10", border: "border-amber-100 dark:border-amber-500/20", icon: Clock };
  return { label: "Active", color: "text-[#22B573]", bg: "bg-emerald-50 dark:bg-emerald-500/10", border: "border-emerald-100 dark:border-emerald-500/20", icon: CheckCircle2 };
};

const ApiCampaignDetails = () => {
  const { campaignId, projectId } = useParams<{ campaignId: string; projectId: string }>();
  const { selectedProject } = useProjectContext();
  const resolvedProjectId = projectId || selectedProject?._id || "";

  const [showReport, setShowReport] = useState(true);
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
        if (showReport) await refetchMessages();
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
      if (showReport) await refetchMessages();
      setLastRefreshTime(new Date());
      toastUtils.success("System status synchronized");
    } catch (refreshError) {
      console.error("Failed to refresh campaign data:", refreshError);
      toastUtils.error("Sync failed");
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleReportPageChange = (page: number) => {
    setReportPage(page);
    const element = document.getElementById('audit-log');
    if (element) element.scrollIntoView({ behavior: 'smooth' });
  };

  const handleDownloadReport = async () => {
    if (!campaignId) return;
    setIsDownloadingReport(true);
    try {
      const response = await apiCampaignApi.downloadApiCampaignReport(campaignId);
      const csvContent = convertToCSV(response.data);
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `api-report-${campaign?.name || "campaign"}-${new Date().toISOString().split("T")[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toastUtils.success("Report downloaded");
    } catch (downloadError) {
      console.error("Download failed:", downloadError);
      toastUtils.error("Download failed");
    } finally {
      setIsDownloadingReport(false);
    }
  };

  const convertToCSV = (reportData: any) => {
    const headers = ["Phone", "Template", "Type", "Status", "Created", "Sent", "Delivered", "Read", "Failure", "WABA ID"];
    const csvRows = [headers.join(",")];
    reportData.messages.forEach((m: any) => {
      const row = [m.phoneNumber || "", m.templateName || "", m.messageType || "", m.status || "", m.createdAt ? formatDateTime12(m.createdAt) : "", m.sentAt ? formatDateTime12(m.sentAt) : "", m.deliveredAt ? formatDateTime12(m.deliveredAt) : "", m.readAt ? formatDateTime12(m.readAt) : "", m.failureReason || "", m.wabaMessageId || ""];
      csvRows.push(row.map(f => `"${f}"`).join(","));
    });
    return csvRows.join("\n");
  };

  const analytics = useMemo(() => campaign?.analyticsSummary || { total: 0, sent: 0, delivered: 0, read: 0, clicked: 0, failed: 0 }, [campaign?.analyticsSummary]);

  const executeEndpointUrl = useMemo(() => {
    const baseUrl = import.meta.env.VITE_REACT_APP_API_BASE_URL;
    return baseUrl ? `${baseUrl}/api-campaign/execute` : "/api-campaign/execute";
  }, []);

  const samplePayloadString = useMemo(() => {
    const hasMedia = Boolean(campaign?.messageTemplate?.headerMediaAssetId);
    const payload = campaign?.sampleJSON || {
      campaignName: campaign?.name || "",
      destination: "<recipient_phone_number>",
      media: { url: hasMedia ? "<media_url>" : "", filename: hasMedia ? "<media_filename>" : "" },
      templateParams: campaign?.messageTemplate?.bodyVariables || [],
    };
    return JSON.stringify(payload, null, 2);
  }, [campaign]);

  const handleCopyToClipboard = async (value: string, label: string) => {
    try {
      await navigator.clipboard.writeText(value);
      toastUtils.success(`${label} copied`);
    } catch (e) {
      toastUtils.error(`Copy failed`);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-[400px] flex flex-col items-center justify-center py-24 text-slate-400 bg-white dark:bg-slate-800/50 shadow-sm">
        <div className="h-16 w-16 bg-slate-50 dark:bg-slate-900/50 rounded-2xl flex items-center justify-center mb-4 border border-slate-100 dark:border-slate-700/50">
          <Loader2 className="h-8 w-8 animate-spin text-[#22B573]" />
        </div>
        <p className="font-bold text-sm uppercase tracking-widest">Hydrating API Details...</p>
      </div>
    );
  }

  if (error || !campaign) {
    return (
      <div className="min-h-full flex items-center justify-center p-8">
        <Alert variant="destructive" className="max-w-md rounded-[32px] p-8 border-none shadow-2xl bg-white dark:bg-slate-800/50">
          <AlertCircle className="h-8 w-8 mb-4 text-red-500" />
          <AlertTitle className="text-xl font-black text-slate-900 dark:text-white mb-2">Campaign Error</AlertTitle>
          <AlertDescription className="text-slate-500 dark:text-slate-400 font-medium">
            {error ? (error as any)?.response?.data?.message || error.message : "The requested campaign data could not be retrieved."}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const status = getStatusStyles(campaign);
  const StatusIcon = status.icon;

  return (
    <div className="min-h-full w-full min-w-0 max-w-full box-border p-2 transition-colors duration-500 sm:p-2 md:p-0 lg:p-0 xl:p-2 2xl:p-4">
      <motion.div
        className="mb-6 rounded-2xl border border-slate-200/60 p-4 sm:p-5"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <Link to={`/whatsapp/dashboard/${resolvedProjectId}/api-campaigns`}>
              <Button
                variant="ghost"
                size="icon"
                className="h-10 w-10 rounded-xl border border-slate-100 dark:border-slate-700/50 bg-slate-50/50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-900/60 transition-all text-slate-500 dark:text-slate-400"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div className="space-y-0.5">
              <div className="flex items-center gap-2 text-[#22B573] font-bold text-xs uppercase tracking-widest">
                <Code className="h-3.5 w-3.5" />
                API Endpoint
              </div>
              <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-2xl">
                {campaign.name}
              </h1>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className={`rounded-lg font-black text-[10px] uppercase tracking-widest px-2 py-0.5 ${status.bg} ${status.color} ${status.border} shadow-sm`}>
                  <StatusIcon className="h-3 w-3 mr-1" />
                  {status.label}
                </Badge>
                <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                  ID: {campaign._id.slice(-8)}
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="hidden sm:flex flex-col items-end mr-2">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Last Synced</p>
              <p className="text-xs font-bold text-slate-600 dark:text-slate-400">{lastRefreshTime ? lastRefreshTime.toLocaleTimeString() : "Just now"}</p>
            </div>

            <Button
              onClick={handleRefresh}
              variant="outline"
              disabled={isRefreshing}
              className="h-11 px-5 rounded-xl border-slate-200 dark:border-slate-700/50 text-slate-600 dark:text-slate-400 font-bold text-sm transition-all hover:bg-slate-50 dark:hover:bg-slate-900/50 hover:scale-[1.02] active:scale-[0.98]"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
              Sync
            </Button>

            <Button
              onClick={handleDownloadReport}
              variant="outline"
              disabled={isDownloadingReport}
              className="h-11 px-5 rounded-xl border-slate-200 dark:border-slate-700/50 text-slate-600 dark:text-slate-400 font-bold text-sm transition-all hover:bg-slate-50 dark:hover:bg-slate-900/50 hover:scale-[1.02] active:scale-[0.98]"
            >
              {isDownloadingReport ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Download className="h-4 w-4 mr-2" />}
              Export CSV
            </Button>

            <Button
              onClick={() => setAutoRefreshEnabled(!autoRefreshEnabled)}
              variant={autoRefreshEnabled ? "default" : "outline"}
              className={`h-11 px-5 rounded-xl font-bold text-sm transition-all hover:scale-[1.02] active:scale-[0.98] ${autoRefreshEnabled ? 'bg-[#22B573]/10 text-[#22B573] border-[#22B573]/20 hover:bg-[#22B573]/15 shadow-none' : ''
                }`}
            >
              <Clock className={`h-4 w-4 mr-2 ${autoRefreshEnabled ? 'animate-pulse' : ''}`} />
              {autoRefreshEnabled ? 'Auto-Sync' : 'Manual'}
            </Button>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-6 gap-6 mb-8">
        {[
          { label: "Volume", val: analytics.total, icon: Activity, color: "text-slate-600 dark:text-slate-400", bg: "bg-slate-50 dark:bg-slate-900/50" },
          { label: "Dispatched", val: analytics.sent, icon: Zap, color: "text-[#22B573]", bg: "bg-emerald-50 dark:bg-emerald-500/10" },
          { label: "Received", val: analytics.delivered, icon: CheckCircle2, color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-50 dark:bg-blue-500/10" },
          { label: "Viewed", val: analytics.read, icon: TrendingUp, color: "text-indigo-600 dark:text-indigo-400", bg: "bg-indigo-50 dark:bg-indigo-500/10" },
          { label: "Actions", val: analytics.clicked, icon: Target, color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-50 dark:bg-amber-500/10" },
          { label: "Anomalies", val: analytics.failed, icon: AlertCircle, color: "text-red-600 dark:text-red-400", bg: "bg-red-50 dark:bg-red-500/10" },
        ].map((stat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.05 }}
            className="rounded-2xl border border-slate-200 dark:border-slate-700/50 bg-white dark:bg-slate-800/50 p-6 hover:shadow-lg hover:shadow-slate-100 transition-all group"
          >
            <div className={`h-10 w-10 rounded-xl ${stat.bg} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
              <stat.icon className={`h-5 w-5 ${stat.color}`} />
            </div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">{stat.label}</p>
            <p className={`text-2xl font-black ${stat.color}`}>{stat.val}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="lg:col-span-1 space-y-6"
        >
          <Card className="rounded-2xl border-slate-200 dark:border-slate-700/50 shadow-sm overflow-hidden h-full">
            <CardHeader className="bg-slate-50/50 dark:bg-slate-900/60 border-b border-slate-100 dark:border-slate-700/50 p-6">
              <CardTitle className="text-sm font-black uppercase tracking-widest text-slate-900 dark:text-white flex items-center gap-2">
                <Settings2 className="h-4 w-4 text-[#22B573]" />
                Endpoint Specs
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-8">
              <div className="space-y-6">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">Blueprint Template</p>
                  <div className="flex items-center gap-3 p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-700/50 group">
                    <div className="h-10 w-10 rounded-xl bg-white dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/50 flex items-center justify-center text-[#22B573]">
                      <MessageSquare className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-black text-slate-900 dark:text-white truncate uppercase tracking-tight">{campaign.messageTemplate.templateName}</p>
                      <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400">Live Production Template</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Deployed At</p>
                    <p className="text-xs font-bold text-slate-700 dark:text-slate-300">{formatDateTime12(campaign.createdAt)}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Last Mutation</p>
                    <p className="text-xs font-bold text-slate-700 dark:text-slate-300">{formatDateTime12(campaign.updatedAt)}</p>
                  </div>
                </div>

                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">Health Distribution</p>
                  <div className="space-y-3">
                    {[
                      { label: "Delivery Efficiency", val: analytics.total > 0 ? Math.round((analytics.delivered / analytics.total) * 100) : 0, color: "bg-blue-500" },
                      { label: "Engagement Velocity", val: analytics.delivered > 0 ? Math.round((analytics.read / analytics.delivered) * 100) : 0, color: "bg-indigo-500" },
                      { label: "Protocol Stability", val: analytics.total > 0 ? 100 - Math.round((analytics.failed / analytics.total) * 100) : 100, color: "bg-[#22B573]" },
                    ].map((bar, i) => (
                      <div key={i} className="space-y-1.5">
                        <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">
                          <span>{bar.label}</span>
                          <span>{bar.val}%</span>
                        </div>
                        <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-900/60 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${bar.val}%` }}
                            transition={{ duration: 1, ease: "easeOut" }}
                            className={`h-full ${bar.color}`}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="lg:col-span-2"
        >
          <Card className="rounded-2xl border-slate-200 dark:border-slate-700/50 shadow-xl shadow-slate-200/50 overflow-hidden h-full">
            <CardHeader className="bg-slate-900 border-b border-slate-800 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-white text-lg font-black uppercase tracking-widest flex items-center gap-2">
                    <Code className="h-5 w-5 text-[#22B573]" />
                    API Execution Hub
                  </CardTitle>
                  <CardDescription className="text-slate-400 font-medium mt-1">
                    Direct integration interface for external systems.
                  </CardDescription>
                </div>
                <div className="h-12 w-12 rounded-2xl bg-[#22B573]/20 flex items-center justify-center text-[#22B573]">
                  <Sparkles className="h-6 w-6" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-8 bg-slate-950">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">Target Endpoint (POST)</p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleCopyToClipboard(executeEndpointUrl, "Endpoint URL")}
                    className="h-8 px-3 rounded-lg text-[#22B573] hover:bg-[#22B573]/10 font-black text-[10px] uppercase tracking-widest transition-all"
                  >
                    <Copy className="h-3 w-3 mr-1.5" />
                    Copy Endpoint
                  </Button>
                </div>
                <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex items-center gap-3">
                  <div className="h-8 px-2 rounded-lg bg-[#22B573]/20 border border-[#22B573]/30 text-[#22B573] text-[10px] font-black flex items-center justify-center uppercase">POST</div>
                  <p className="text-sm font-mono text-slate-300 truncate flex-1">{executeEndpointUrl}</p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">JSON Blueprint Payload</p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleCopyToClipboard(samplePayloadString, "Sample JSON")}
                    className="h-8 px-3 rounded-lg text-[#22B573] hover:bg-[#22B573]/10 font-black text-[10px] uppercase tracking-widest transition-all"
                  >
                    <Copy className="h-3 w-3 mr-1.5" />
                    Copy Payload
                  </Button>
                </div>
                <div className="relative group">
                  <div className="absolute inset-0 bg-[#22B573]/5 blur-3xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                  <div className="relative rounded-2xl bg-slate-900 border border-slate-800 p-5 overflow-auto max-h-[300px] custom-scrollbar">
                    <pre className="text-xs sm:text-sm font-mono text-emerald-400 leading-relaxed whitespace-pre-wrap break-words">
                      {samplePayloadString}
                    </pre>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 p-4 rounded-2xl bg-white/5 border border-white/10">
                <Activity className="h-5 w-5 text-slate-400 shrink-0" />
                <p className="text-[11px] font-medium text-slate-400 leading-relaxed">
                  Authenticate your requests using the project <span className="text-white font-bold">API Key</span> in the <span className="text-white font-bold">Authorization</span> header.
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <motion.div
        id="audit-log"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card className="rounded-2xl border-slate-200 dark:border-slate-700/50 shadow-xl shadow-slate-200/50 overflow-hidden bg-white dark:bg-slate-800/50">
          <CardHeader className="bg-slate-50/50 dark:bg-slate-900/60 border-b border-slate-100 dark:border-slate-700/50 p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
              <div>
                <CardTitle className="text-lg font-black uppercase tracking-widest text-slate-900 dark:text-white flex items-center gap-2">
                  <History className="h-5 w-5 text-[#22B573]" />
                  Protocol Audit Log
                </CardTitle>
                <CardDescription className="text-slate-500 dark:text-slate-400 font-medium mt-1">
                  Granular verification of every dispatched message.
                </CardDescription>
              </div>
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search phone..."
                    className="h-10 pl-9 pr-4 rounded-xl border-slate-200 dark:border-slate-700/50 bg-white dark:bg-slate-800/50 text-xs font-bold focus:ring-4 focus:ring-[#22B573]/10 focus:border-[#22B573] transition-all w-full sm:w-48"
                  />
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {messagesLoading ? (
              <div className="flex flex-col items-center justify-center py-24 text-slate-400">
                <Loader2 className="h-8 w-8 animate-spin mb-3 text-[#22B573]" />
                <p className="text-[10px] font-black uppercase tracking-widest">Streaming message data...</p>
              </div>
            ) : messagesError ? (
              <div className="p-12 text-center">
                <AlertCircle className="h-10 w-10 text-red-500 mx-auto mb-4" />
                <p className="text-slate-900 dark:text-white font-black uppercase tracking-widest text-sm">Synchronize Error</p>
                <p className="text-slate-500 dark:text-slate-400 text-xs font-medium mt-1">Failed to retrieve message logs. Please try manual refresh.</p>
              </div>
            ) : !campaignMessagesData || campaignMessagesData.wabaMessages.length === 0 ? (
              <div className="py-24 text-center">
                <div className="h-20 w-20 bg-slate-50 dark:bg-slate-900/50 rounded-full flex items-center justify-center mx-auto mb-4 border border-dashed border-slate-200 dark:border-slate-700/50">
                  <LayoutGrid className="h-8 w-8 text-slate-300" />
                </div>
                <h3 className="text-slate-900 dark:text-white font-black uppercase tracking-widest text-sm">No Logs Generated</h3>
                <p className="text-slate-500 dark:text-slate-400 text-xs font-medium mt-1 max-w-xs mx-auto">This campaign hasn't triggered any messages via the API endpoint yet.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-slate-50/50 dark:bg-slate-900/60">
                    <TableRow className="hover:bg-transparent border-slate-100 dark:border-slate-700/50">
                      <TableHead className="w-[180px] py-5 pl-8 text-[10px] font-black uppercase tracking-widest text-slate-400">Destination</TableHead>
                      <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400">Identity</TableHead>
                      <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400">State</TableHead>
                      <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">Protocol</TableHead>
                      <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400">Timeline</TableHead>
                      <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400 pr-8">Anomalies</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <AnimatePresence mode="popLayout">
                      {campaignMessagesData.wabaMessages.map((msg, i) => (
                        <motion.tr
                          key={msg._id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.03 }}
                          className="group border-slate-50 dark:border-slate-700/30 hover:bg-slate-50/80 dark:hover:bg-slate-900/40 transition-colors"
                        >
                          <TableCell className="py-4 pl-8">
                            <div className="flex items-center gap-3">
                              <div className="h-9 w-9 rounded-xl bg-white dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/50 flex items-center justify-center text-[#22B573] shadow-sm group-hover:scale-110 transition-transform">
                                <Zap className="h-4 w-4" />
                              </div>
                              <span className="text-sm font-black text-slate-900 dark:text-white tracking-tight">{msg.phoneNumber}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-tight">{msg.templateName}</span>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={`rounded-lg font-black text-[9px] uppercase tracking-widest px-2 py-0.5 border-none shadow-sm ${msg.status === "read" ? "bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400" :
                                  msg.status === "delivered" ? "bg-emerald-50 dark:bg-emerald-500/10 text-[#22B573]" :
                                    msg.status === "sent" ? "bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400" :
                                      msg.status === "failed" ? "bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400" : "bg-slate-50 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400"
                                }`}
                            >
                              {msg.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge variant="outline" className="rounded-lg font-bold text-[10px] text-slate-400 border-slate-100 dark:border-slate-700/50 bg-white dark:bg-slate-800/50">
                              {msg.messageType || "TEXT"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col gap-0.5">
                              <span className="text-[11px] font-black text-slate-900 dark:text-white leading-none">
                                {msg.readAt ? formatDateTime12(msg.readAt) : msg.deliveredAt ? formatDateTime12(msg.deliveredAt) : formatDateTime12(msg.createdAt)}
                              </span>
                              <span className="text-[10px] font-bold text-slate-400 leading-none tracking-tight">
                                {msg.readAt ? "READ" : msg.deliveredAt ? "DELIVERED" : "INITIALIZED"}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="pr-8">
                            {msg.failureReason ? (
                              <div className="flex items-center gap-1.5 text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 px-3 py-1 rounded-lg border border-red-100 dark:border-red-500/20 w-fit">
                                <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                                <span className="text-[10px] font-black uppercase tracking-tight truncate max-w-[120px]">{msg.failureReason}</span>
                              </div>
                            ) : (
                              <span className="text-slate-300">—</span>
                            )}
                          </TableCell>
                        </motion.tr>
                      ))}
                    </AnimatePresence>
                  </TableBody>
                </Table>
              </div>
            )}

            {campaignMessagesData && campaignMessagesData.totalPages > 1 && (
              <div className="p-8 border-t border-slate-100 dark:border-slate-700/50 flex justify-center">
                <Pagination>
                  <PaginationContent className="gap-2">
                    <PaginationItem>
                      <PaginationPrevious
                        onClick={(e) => {
                          e.preventDefault();
                          if (reportPage > 1) handleReportPageChange(reportPage - 1);
                        }}
                        className={`rounded-xl border-slate-200 dark:border-slate-700/50 h-10 px-4 font-bold text-slate-600 dark:text-slate-400 transition-all hover:bg-slate-50 dark:hover:bg-slate-900/50 ${reportPage <= 1 ? 'pointer-events-none opacity-40' : 'cursor-pointer hover:scale-[1.02] active:scale-[0.98]'}`}
                      />
                    </PaginationItem>

                    {Array.from({ length: Math.min(5, campaignMessagesData.totalPages) }, (_, i) => {
                      const startPage = Math.max(1, reportPage - 2);
                      const pageNum = startPage + i;
                      if (pageNum > campaignMessagesData.totalPages) return null;
                      return (
                        <PaginationItem key={pageNum}>
                          <PaginationLink
                            onClick={(e) => { e.preventDefault(); handleReportPageChange(pageNum); }}
                            isActive={pageNum === reportPage}
                            className={`cursor-pointer h-10 w-10 rounded-xl font-bold transition-all ${pageNum === reportPage ? 'bg-[#22B573] text-white border-[#22B573] shadow-lg shadow-green-600/20' : 'border-slate-200 dark:border-slate-700/50 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900/50'
                              }`}
                          >
                            {pageNum}
                          </PaginationLink>
                        </PaginationItem>
                      );
                    })}

                    <PaginationItem>
                      <PaginationNext
                        onClick={(e) => {
                          e.preventDefault();
                          if (reportPage < campaignMessagesData.totalPages) handleReportPageChange(reportPage + 1);
                        }}
                        className={`rounded-xl border-slate-200 dark:border-slate-700/50 h-10 px-4 font-bold text-slate-600 dark:text-slate-400 transition-all hover:bg-slate-50 dark:hover:bg-slate-900/50 ${reportPage >= campaignMessagesData.totalPages ? 'pointer-events-none opacity-40' : 'cursor-pointer hover:scale-[1.02] active:scale-[0.98]'}`}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default ApiCampaignDetails;
