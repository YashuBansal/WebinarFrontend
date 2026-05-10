import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { 
  ArrowLeft, 
  MessageSquare, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  BarChart3,
  Send,
  RefreshCw,
  Loader2,
  FileText,
  Download,
  Calendar,
  ChevronRight,
  TrendingUp,
  LayoutGrid,
  Users,
  Search,
  PieChart,
  Target,
  Trophy,
  History,
  Phone,
  Eye,
  CheckCircle2,
  XCircle,
  Clock4,
  Settings2
} from 'lucide-react';
import { useCampaignById } from '@/hooks/useCampaigns';
import { useCampaignMessages } from '@/hooks/useCampaignMessages';
import { formatDateTime12 } from '@/lib/date';
import { toastUtils } from '@/lib/utils';
import { campaignApi } from '@/api/modules/campaignAPI';
import { Label } from '@/components/ui/label';
import { 
  Pagination, 
  PaginationContent, 
  PaginationEllipsis, 
  PaginationItem, 
  PaginationLink, 
  PaginationNext, 
  PaginationPrevious 
} from '@/components/ui/pagination';
import { useProjectContext } from '@/context/ProjectContext';

const CampaignDetails = () => {
  const { campaignId, projectId } = useParams<{ campaignId: string; projectId: string }>();
  const navigate = useNavigate();
  const { selectedProject } = useProjectContext();
  const [showReport, setShowReport] = useState(false);
  const [reportPage, setReportPage] = useState(1);
  const [isDownloadingReport, setIsDownloadingReport] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(true);
  const [lastRefreshTime, setLastRefreshTime] = useState<Date | null>(null);
  const reportLimit = 10;
  
  const { data: campaign, isLoading, error, refetch } = useCampaignById(campaignId || '');
  
  // Fetch campaign messages for report only when showReport is true
  const { 
    data: campaignMessagesData, 
    isLoading: messagesLoading, 
    error: messagesError,
    refetch: refetchMessages,
  } = useCampaignMessages(
    selectedProject?._id || '', 
    campaign?._id || '', 
    reportPage, 
    reportLimit,
    showReport // Only fetch when report is visible
  );

  // Auto-refresh every 10 seconds
  useEffect(() => {
    if (!autoRefreshEnabled || !selectedProject?._id) return;

    const interval = setInterval(async () => {
      try {
        await refetch(); // Always refresh campaign analytics
        if (showReport) {
          await refetchMessages(); // Only refresh report data if visible
        }
        setLastRefreshTime(new Date());
      } catch (error) {
        console.error('Auto-refresh failed:', error);
      }
    }, 10000); // 10 seconds

    return () => clearInterval(interval);
  }, [autoRefreshEnabled, selectedProject?._id, refetch, refetchMessages, showReport]);
  
  const handleExecuteCampaign = async () => {
    if (!campaign) return;
    toastUtils.info('Campaign execution requires contact data. This feature will be implemented with the contacts integration.');
  };

  const handleRefresh = async () => {
    try {
      setIsRefreshing(true);
      await refetch();
      if (showReport) {
        await refetchMessages();
      }
      setLastRefreshTime(new Date());
      toastUtils.success('Campaign data refreshed successfully');
    } catch (error) {
      console.error('Failed to refresh campaign data:', error);
      toastUtils.error('Failed to refresh campaign data');
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleShowReport = () => {
    setShowReport(!showReport);
    setReportPage(1);
  };

  const handleReportPageChange = (page: number) => {
    setReportPage(page);
    // Scroll to the report section
    const reportElement = document.getElementById('campaign-report-section');
    if (reportElement) {
      reportElement.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleDownloadReport = async () => {
    if (!campaign || !selectedProject?._id) {
      toastUtils.error('Campaign or project information not available');
      return;
    }

    setIsDownloadingReport(true);
    try {
      const response = await campaignApi.downloadCampaignReport(campaignId || '');
      const reportData = response.data;

      // Convert to CSV format
      const csvContent = convertToCSV(reportData);
      
      // Create and download file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `campaign-report-${campaign.name}-${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toastUtils.success('Campaign report downloaded successfully');
    } catch (error) {
      console.error('Failed to download report:', error);
      toastUtils.error('Failed to download campaign report');
    } finally {
      setIsDownloadingReport(false);
    }
  };

  const convertToCSV = (reportData: any) => {
    const headers = [
      'Phone Number',
      'Template Name', 
      'Message Type',
      'Status',
      'Created At',
      'Sent At',
      'Delivered At',
      'Read At',
      'Failure Reason',
      'WABA Message ID'
    ];

    const csvRows = [headers.join(',')];

    reportData.messages.forEach((message: any) => {
      const row = [
        message.phoneNumber || '',
        message.templateName || '',
        message.messageType || '',
        message.status || '',
        message.createdAt ? formatDateTime12(message.createdAt) : '',
        message.sentAt ? formatDateTime12(message.sentAt) : '',
        message.deliveredAt ? formatDateTime12(message.deliveredAt) : '',
        message.readAt ? formatDateTime12(message.readAt) : '',
        message.failureReason || '',
        message.wabaMessageId || ''
      ];
      csvRows.push(row.map(field => `"${field}"`).join(','));
    });

    return csvRows.join('\n');
  };

  const getStatusStyles = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-500/20';
      case 'in-progress':
        return 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-100 dark:border-blue-500/20';
      case 'failed':
        return 'bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 border-red-100 dark:border-red-500/20';
      case 'draft':
        return 'bg-slate-50 dark:bg-slate-900/50 text-slate-600 dark:text-slate-400 border-slate-100 dark:border-slate-700/50';
      default:
        return 'bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-100 dark:border-amber-500/20';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 bg-white dark:bg-slate-800/50 shadow-sm" />;
      case 'in-progress':
        return <RefreshCw className="h-4 w-4 animate-spin-slow" />;
      case 'failed':
        return <AlertCircle className="h-4 w-4" />;
      case 'draft':
        return <Clock className="h-4 w-4" />;
      default:
        return <MessageSquare className="h-4 w-4" />;
    }
  };

  const getMessageStatusIcon = (status: string) => {
    switch (status) {
      case 'sent':
        return <CheckCircle className="h-4 w-4" />;
      case 'delivered':
        return <CheckCircle2 className="h-4 w-4" />;
      case 'read':
        return <Eye className="h-4 w-4" />;
      case 'failed':
        return <XCircle className="h-4 w-4" />;
      default:
        return <Clock4 className="h-4 w-4" />;
    }
  };

  const renderPagination = () => {
    if (!campaignMessagesData) return null;

    const { page, totalPages } = campaignMessagesData;
    const hasPrevPage = page > 1;
    const hasNextPage = page < totalPages;

    return (
      <div className="flex justify-center pt-8">
        <Pagination>
          <PaginationContent className="gap-2">
            <PaginationItem>
              <PaginationPrevious
                onClick={(e) => {
                  e.preventDefault();
                  if (hasPrevPage) handleReportPageChange(page - 1);
                }}
                className={`rounded-xl border-slate-200 dark:border-slate-700/50 h-10 px-4 font-bold text-slate-600 dark:text-slate-400 transition-all hover:bg-slate-50 dark:hover:bg-slate-900/50 ${!hasPrevPage ? 'pointer-events-none opacity-40' : 'cursor-pointer hover:scale-[1.02] active:scale-[0.98]'}`}
              />
            </PaginationItem>

            {page > 3 && (
              <>
                <PaginationItem>
                  <PaginationLink
                    onClick={(e) => {
                      e.preventDefault();
                      handleReportPageChange(1);
                    }}
                    className="cursor-pointer h-10 w-10 rounded-xl border-slate-200 dark:border-slate-700/50 font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900/50"
                  >
                    1
                  </PaginationLink>
                </PaginationItem>
                {page > 4 && <PaginationItem><PaginationEllipsis /></PaginationItem>}
              </>
            )}

            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const startPage = Math.max(1, page - 2);
              const pageNum = startPage + i;
              if (pageNum > totalPages) return null;

              return (
                <PaginationItem key={pageNum}>
                  <PaginationLink
                    onClick={(e) => {
                      e.preventDefault();
                      handleReportPageChange(pageNum);
                    }}
                    isActive={pageNum === page}
                    className={`cursor-pointer h-10 w-10 rounded-xl font-bold transition-all ${
                      pageNum === page 
                        ? 'bg-[#22B573] text-white border-[#22B573] shadow-lg shadow-green-600/20' 
                        : 'border-slate-200 dark:border-slate-700/50 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900/50'
                    }`}
                  >
                    {pageNum}
                  </PaginationLink>
                </PaginationItem>
              );
            })}

            {page < totalPages - 2 && (
              <>
                {page < totalPages - 3 && <PaginationItem><PaginationEllipsis /></PaginationItem>}
                <PaginationItem>
                  <PaginationLink
                    onClick={(e) => {
                      e.preventDefault();
                      handleReportPageChange(totalPages);
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
                  if (hasNextPage) handleReportPageChange(page + 1);
                }}
                className={`rounded-xl border-slate-200 dark:border-slate-700/50 h-10 px-4 font-bold text-slate-600 dark:text-slate-400 transition-all hover:bg-slate-50 dark:hover:bg-slate-900/50 ${!hasNextPage ? 'pointer-events-none opacity-40' : 'cursor-pointer hover:scale-[1.02] active:scale-[0.98]'}`}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-[400px] flex flex-col items-center justify-center py-24 text-slate-400">
        <div className="h-16 w-16 bg-slate-50 dark:bg-slate-900/50 rounded-2xl flex items-center justify-center mb-4 border border-slate-100 dark:border-slate-700/50">
          <Loader2 className="h-8 w-8 animate-spin text-[#22B573]" />
        </div>
        <p className="font-bold text-sm uppercase tracking-widest">Loading Details...</p>
      </div>
    );
  }

  if (error || !campaign) {
    return (
      <div className="min-h-full flex items-center justify-center p-8">
        <Alert variant="destructive" className="max-w-md rounded-[32px] p-8 border-none shadow-2xl bg-white dark:bg-slate-800/50">
          <AlertCircle className="h-8 w-8 mb-4 text-red-500" />
          <AlertTitle className="text-xl font-black text-slate-900 dark:text-white mb-2">Campaign Not Found</AlertTitle>
          <AlertDescription className="text-slate-500 dark:text-slate-400 font-medium">
            Failed to load campaign: {(error as any)?.response?.data?.message || 'The requested campaign could not be found.'}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const deliveryRate = campaign.analyticsSummary.total > 0 
    ? Math.round((campaign.analyticsSummary.delivered / campaign.analyticsSummary.total) * 100)
    : 0;
  
  const readRate = campaign.analyticsSummary.delivered > 0 
    ? Math.round((campaign.analyticsSummary.read / campaign.analyticsSummary.delivered) * 100)
    : 0;

  const failureRate = campaign.analyticsSummary.total > 0 
    ? Math.round((campaign.analyticsSummary.failed / campaign.analyticsSummary.total) * 100)
    : 0;

  return (
    <div className="min-h-full w-full min-w-0 max-w-full box-border p-2 transition-colors duration-500 sm:p-2 md:p-0 lg:p-0 xl:p-2 2xl:p-4">
      {/* Premium Header */}
      <motion.div
        className="mb-6 rounded-2xl border border-slate-200/60 p-4 sm:p-5 bg-white dark:bg-slate-800/50 shadow-sm dark:border-slate-700/50"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(`/whatsapp/dashboard/${projectId}/campaigns`)}
              className="h-10 w-10 rounded-xl border border-slate-100 dark:border-slate-700/50 bg-slate-50/50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-900/60 transition-all text-slate-500 dark:text-slate-400"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-[#22B573] font-bold text-xs uppercase tracking-widest mb-0.5">
                <Target className="h-3.5 w-3.5" />
                Campaign Intel
              </div>
              <div className="flex items-center gap-3">
                <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-2xl">
                  {campaign.name}
                </h1>
                <Badge variant="outline" className={`rounded-lg font-black text-[10px] uppercase tracking-widest px-2 py-0.5 border-none shadow-sm ${getStatusStyles(campaign.status)}`}>
                  {campaign.status}
                </Badge>
              </div>
              <p className="text-slate-500 dark:text-slate-400 text-xs font-medium">
                Deep analytics for <span className="text-slate-900 dark:text-white font-bold">{campaign.messageTemplate.templateName}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button
              onClick={handleRefresh}
              variant="outline"
              disabled={isRefreshing}
              className="h-11 px-6 rounded-xl flex items-center gap-2 border-slate-200 dark:border-slate-700/50 text-slate-600 dark:text-slate-400 font-bold text-sm transition-all hover:bg-slate-50 dark:hover:bg-slate-900/50 hover:scale-[1.02] active:scale-[0.98]"
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              {isRefreshing ? 'Syncing...' : 'Sync Data'}
            </Button>

            <Button
              onClick={handleDownloadReport}
              disabled={isDownloadingReport}
              className="h-11 px-6 rounded-xl flex items-center gap-2 font-bold text-sm shadow-lg shadow-slate-900/10 bg-slate-900 hover:bg-slate-800 text-white transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              {isDownloadingReport ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
              Report
            </Button>
          </div>
        </div>
      </motion.div>

      <main className="container mx-auto space-y-6 pb-12">
        {/* Analytics Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: General Info */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-1 space-y-6"
          >
            <Card className="rounded-[24px] border-slate-200 dark:border-slate-700/50 shadow-sm overflow-hidden h-full">
              <CardHeader className="bg-slate-50/50 dark:bg-slate-900/60 border-b border-slate-100 dark:border-slate-700/50 p-6">
                <CardTitle className="text-sm font-black uppercase tracking-widest text-slate-900 dark:text-white flex items-center gap-2">
                  <Settings2 className="h-4 w-4 text-[#22B573]" />
                  Campaign Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <div className="space-y-4">
                  {[
                    { label: "Template Name", value: campaign.messageTemplate.templateName, icon: FileText },
                    { label: "Status", value: campaign.status, icon: History, badge: true },
                    { label: "Created On", value: formatDateTime12(campaign.createdAt), icon: Calendar },
                    { label: "Completion Time", value: campaign.completedAt ? formatDateTime12(campaign.completedAt) : 'N/A', icon: CheckCircle },
                    { label: "Scheduled For", value: campaign.scheduledAt ? formatDateTime12(campaign.scheduledAt) : 'Immediate', icon: Clock },
                  ].map((item, i) => (
                    <div key={i} className="flex items-start gap-4 group">
                      <div className="h-10 w-10 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-700/50 flex items-center justify-center text-slate-400 group-hover:text-[#22B573] group-hover:border-[#22B573]/20 transition-all">
                        <item.icon className="h-5 w-5" />
                      </div>
                      <div className="space-y-0.5">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{item.label}</p>
                        {item.badge ? (
                          <Badge variant="outline" className={`rounded-lg font-black text-[10px] uppercase tracking-widest px-2 py-0.5 border-none shadow-sm ${getStatusStyles(item.value as string)}`}>
                            {item.value}
                          </Badge>
                        ) : (
                          <p className="text-sm font-bold text-slate-900 dark:text-white">{item.value}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {campaign.status === 'draft' && (
                  <Button 
                    onClick={handleExecuteCampaign}
                    className="w-full h-12 rounded-xl bg-[#22B573] hover:bg-[#1da467] text-white font-black uppercase tracking-widest text-xs shadow-lg shadow-green-600/20 transition-all hover:scale-[1.02]"
                  >
                    <Send className="h-4 w-4 mr-2" />
                    Launch Campaign
                  </Button>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Right: Stats Summary */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-2 space-y-6"
          >
            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: "Total Target", value: campaign.analyticsSummary.total, icon: Users, color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-50 dark:bg-blue-500/10", border: "border-blue-100 dark:border-blue-500/20" },
                { label: "Successfully Sent", value: campaign.analyticsSummary.sent, icon: Send, color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-50 dark:bg-amber-500/10", border: "border-amber-100 dark:border-amber-500/20" },
                { label: "Total Delivered", value: campaign.analyticsSummary.delivered, icon: CheckCircle2, color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-500/10", border: "border-emerald-100 dark:border-emerald-500/20" },
                { label: "Total Read", value: campaign.analyticsSummary.read, icon: Eye, color: "text-purple-600 dark:text-purple-400", bg: "bg-purple-50 dark:bg-purple-500/10", border: "border-purple-100 dark:border-purple-500/20" },
              ].map((stat, i) => (
                <Card key={i} className={`rounded-2xl border ${stat.border} ${stat.bg} shadow-sm group hover:shadow-md transition-all duration-300`}>
                  <CardContent className="p-5 flex flex-col items-center text-center gap-3">
                    <div className={`h-12 w-12 rounded-xl bg-white dark:bg-slate-800/50 border ${stat.border} flex items-center justify-center ${stat.color} shadow-sm group-hover:scale-110 transition-transform`}>
                      <stat.icon className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-0.5">{stat.label}</p>
                      <h4 className={`text-2xl font-black ${stat.color}`}>{stat.value}</h4>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Performance Visualizer */}
            <Card className="rounded-[24px] border-slate-200 dark:border-slate-700/50 shadow-sm overflow-hidden">
              <CardHeader className="bg-slate-50/50 dark:bg-slate-900/60 border-b border-slate-100 dark:border-slate-700/50 p-6">
                <CardTitle className="text-sm font-black uppercase tracking-widest text-slate-900 dark:text-white flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-[#22B573]" />
                  Success Benchmarks
                </CardTitle>
              </CardHeader>
              <CardContent className="p-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  {[
                    { label: "Delivery Success", value: deliveryRate, color: "bg-blue-500", icon: CheckCircle2, sub: `${campaign.analyticsSummary.delivered} of ${campaign.analyticsSummary.total}` },
                    { label: "Engagement Rate", value: readRate, color: "bg-emerald-500", icon: Eye, sub: `${campaign.analyticsSummary.read} of ${campaign.analyticsSummary.delivered}` },
                    { label: "Failure Rate", value: failureRate, color: "bg-red-500", icon: AlertCircle, sub: `${campaign.analyticsSummary.failed} errors detected` },
                  ].map((metric, i) => (
                    <div key={i} className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className={`h-2 w-2 rounded-full ${metric.color}`} />
                          <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">{metric.label}</span>
                        </div>
                        <span className="text-xl font-black text-slate-900 dark:text-white">{metric.value}%</span>
                      </div>
                      <div className="h-3 w-full bg-slate-100 dark:bg-slate-900/60 rounded-full overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${metric.value}%` }}
                          transition={{ duration: 1, delay: 0.5 + (i * 0.2) }}
                          className={`h-full ${metric.color} rounded-full`}
                        />
                      </div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">{metric.sub}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Report Toggle Button */}
        <div className="flex justify-center py-4">
          <Button
            onClick={handleShowReport}
            className={`h-12 px-8 rounded-2xl flex items-center gap-3 font-black uppercase tracking-widest text-xs transition-all hover:scale-[1.02] active:scale-[0.98] ${
              showReport 
                ? 'bg-slate-100 dark:bg-slate-900/60 text-slate-600 dark:text-slate-400 hover:bg-slate-200 shadow-none' 
                : 'bg-white dark:bg-slate-800/50 border-2 border-[#22B573] text-[#22B573] hover:bg-[#22B573]/5 shadow-xl shadow-green-600/10'
            }`}
          >
            <FileText className="h-5 w-5" />
            {showReport ? 'Hide Audit Log' : 'View Complete Audit Log'}
          </Button>
        </div>

        {/* Audit Log / Report Section */}
        <AnimatePresence>
          {showReport && (
            <motion.div
              id="campaign-report-section"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 rounded-[24px] overflow-hidden shadow-xl shadow-slate-200/50"
            >
              <div className="p-6 sm:p-8 border-b border-slate-100 dark:border-slate-700/50 bg-slate-50/30 dark:bg-slate-800/30 flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                  <h2 className="text-xl font-black text-slate-900 dark:text-white">Message Audit Log</h2>
                  <p className="text-slate-500 dark:text-slate-400 text-xs font-medium mt-1">Granular message-level delivery tracking</p>
                </div>
                <Button 
                  onClick={handleDownloadReport} 
                  variant="outline" 
                  disabled={isDownloadingReport}
                  className="h-10 px-6 rounded-xl flex items-center gap-2 border-slate-200 dark:border-slate-700/50 text-slate-600 dark:text-slate-400 font-bold text-sm hover:bg-slate-50 dark:hover:bg-slate-900/50"
                >
                  {isDownloadingReport ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                  Export CSV
                </Button>
              </div>

              <div className="p-4 sm:p-8">
                {messagesLoading ? (
                  <div className="flex flex-col items-center justify-center py-24 text-slate-400">
                    <div className="h-16 w-16 bg-slate-50 dark:bg-slate-900/50 rounded-2xl flex items-center justify-center mb-4 border border-slate-100 dark:border-slate-700/50">
                      <Loader2 className="h-8 w-8 animate-spin text-[#22B573]" />
                    </div>
                    <p className="font-bold text-sm uppercase tracking-widest">Loading Logs...</p>
                  </div>
                ) : messagesError ? (
                  <Alert variant="destructive" className="bg-red-50 dark:bg-red-500/10 border-red-200 rounded-2xl">
                    <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                    <AlertTitle className="text-red-800 font-bold">Log Fetch Failed</AlertTitle>
                    <AlertDescription className="text-red-700 font-medium">We couldn't retrieve the message logs for this campaign.</AlertDescription>
                  </Alert>
                ) : !campaignMessagesData || campaignMessagesData.wabaMessages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-24 text-slate-400">
                    <div className="h-16 w-16 bg-slate-50 dark:bg-slate-900/50 rounded-2xl flex items-center justify-center mb-4 border border-slate-100 dark:border-slate-700/50">
                      <Search className="h-8 w-8 opacity-20" />
                    </div>
                    <p className="font-bold text-sm uppercase tracking-widest">No logs available</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {campaignMessagesData.wabaMessages.map((message, index) => (
                      <motion.div
                        key={message._id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="group flex flex-col xl:flex-row xl:items-center gap-6 p-6 rounded-2xl border border-slate-100 dark:border-slate-700/50 bg-white dark:bg-slate-800/50 hover:bg-slate-50/50 hover:border-[#22B573]/20 transition-all duration-300"
                      >
                        {/* Status Icon */}
                        <div className={`h-12 w-12 rounded-xl border flex items-center justify-center shadow-sm flex-shrink-0 transition-transform group-hover:scale-105 ${
                          message.status === 'read' ? 'bg-green-50 dark:bg-green-500/10 text-green-600 dark:text-green-400 border-green-100 dark:border-green-500/20' :
                          message.status === 'delivered' ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-500/20' :
                          message.status === 'sent' ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-100 dark:border-blue-500/20' :
                          message.status === 'failed' ? 'bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 border-red-100 dark:border-red-500/20' :
                          'bg-slate-50 dark:bg-slate-900/50 text-slate-400 border-slate-100 dark:border-slate-700/50'
                        }`}>
                          {getMessageStatusIcon(message.status)}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge variant="outline" className={`rounded-lg font-black text-[10px] uppercase tracking-widest px-2 py-0.5 border-none shadow-sm ${
                                message.status === 'read' ? 'bg-green-50 dark:bg-green-500/10 text-green-600 dark:text-green-400' :
                                message.status === 'delivered' ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' :
                                message.status === 'sent' ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400' :
                                message.status === 'failed' ? 'bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400' :
                                'bg-slate-50 dark:bg-slate-900/50 text-slate-400'
                              }`}>
                                {message.status}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-2">
                              <Phone className="h-3.5 w-3.5 text-slate-400" />
                              <h3 className="font-bold text-slate-900 dark:text-white text-base">{message.phoneNumber}</h3>
                            </div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest break-all">ID: {message.wabaMessageId || 'N/A'}</p>
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">Created</span>
                              <span className="text-xs font-bold text-slate-600 dark:text-slate-400">{formatDateTime12(message.createdAt)}</span>
                            </div>
                            {message.sentAt && (
                              <div className="space-y-1">
                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">Sent</span>
                                <span className="text-xs font-bold text-slate-600 dark:text-slate-400">{formatDateTime12(message.sentAt)}</span>
                              </div>
                            )}
                            {message.deliveredAt && (
                              <div className="space-y-1">
                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block text-emerald-600 dark:text-emerald-400">Delivered</span>
                                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">{formatDateTime12(message.deliveredAt)}</span>
                              </div>
                            )}
                            {message.readAt && (
                              <div className="space-y-1">
                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block text-green-600 dark:text-green-400">Read</span>
                                <span className="text-xs font-bold text-green-600 dark:text-green-400">{formatDateTime12(message.readAt)}</span>
                              </div>
                            )}
                          </div>

                          <div className="flex flex-col justify-center">
                            {message.failureReason ? (
                              <div className="p-3 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20 flex items-start gap-2.5">
                                <AlertCircle className="h-3.5 w-3.5 text-red-500 mt-0.5 flex-shrink-0" />
                                <div className="min-w-0">
                                  <p className="text-[10px] font-black text-red-600 dark:text-red-400 uppercase tracking-widest leading-none mb-1">Error Trace</p>
                                  <p className="text-[11px] font-medium text-red-700 leading-tight line-clamp-2">{message.failureReason}</p>
                                </div>
                              </div>
                            ) : (
                              <div className="p-3 rounded-xl bg-emerald-50/50 border border-emerald-100/50 flex items-center gap-2.5">
                                <Trophy className="h-3.5 w-3.5 text-emerald-500 flex-shrink-0" />
                                <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">No issues detected</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}

                {/* Pagination */}
                {campaignMessagesData && campaignMessagesData.totalPages > 1 && renderPagination()}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
};

export default CampaignDetails;

