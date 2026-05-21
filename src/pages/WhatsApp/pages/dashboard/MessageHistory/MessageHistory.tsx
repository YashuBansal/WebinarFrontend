import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious
} from '@/components/ui/pagination';
import {
  History,
  ArrowLeft,
  MessageSquare,
  Calendar,
  AlertCircle,
  Loader2,
  CheckCircle,
  Clock,
  XCircle,
  Eye,
  RefreshCw,
  Phone,
  ChevronRight,
  Filter,
  CheckCircle2,
  LayoutGrid,
  Search
} from 'lucide-react';
import { useProjectContext } from '@/context/ProjectContext';
import { useWabaMessages, type DatePreset } from '@/hooks/useWabaMessages';
import { Input } from '@/components/ui/input';
import { formatDateTime12 } from '@/lib/date';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { type MessageType } from '@/schemas/wabaMessageSchema';

const MessageHistory = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { selectedProject } = useProjectContext();
  const [currentPage, setCurrentPage] = useState(1);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(true);
  const [lastRefreshTime, setLastRefreshTime] = useState<Date | null>(null);
  const limit = 10;

  // Date filtering state
  const [datePreset, setDatePreset] = useState<DatePreset>('today');
  const [customStart, setCustomStart] = useState<string>('');
  const [customEnd, setCustomEnd] = useState<string>('');

  // Message type filtering state
  const [selectedMessageType, setSelectedMessageType] = useState<MessageType | null>(null);

  const {
    data: messagesData,
    isLoading,
    error,
    refetch
  } = useWabaMessages(projectId || '', currentPage, limit, {
    datePreset,
    startDate: datePreset === 'custom' ? customStart : null,
    endDate: datePreset === 'custom' ? customEnd : null,
    messageType: selectedMessageType,
  });

  // Reset pagination when message type or date preset changes
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedMessageType, datePreset]);

  // Auto-refresh every 10 seconds
  useEffect(() => {
    if (!autoRefreshEnabled || !projectId) return;

    const interval = setInterval(async () => {
      try {
        await refetch();
        setLastRefreshTime(new Date());
      } catch (error) {
        console.error('Auto-refresh failed:', error);
      }
    }, 10000); // 10 seconds

    return () => clearInterval(interval);
  }, [autoRefreshEnabled, projectId, refetch]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'sent':
        return <CheckCircle className="h-4 w-4 bg-white dark:bg-slate-800/50 shadow-sm" />;
      case 'delivered':
        return <CheckCircle2 className="h-4 w-4" />;
      case 'read':
        return <Eye className="h-4 w-4" />;
      case 'failed':
        return <XCircle className="h-4 w-4" />;
      case 'clicked':
        return <CheckCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getStatusStyles = (status: string) => {
    switch (status) {
      case 'sent':
        return 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-100 dark:border-blue-500/20';
      case 'delivered':
        return 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-500/20';
      case 'read':
        return 'bg-green-50 dark:bg-green-500/10 text-green-600 dark:text-green-400 border-green-100 dark:border-green-500/20';
      case 'failed':
        return 'bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 border-red-100 dark:border-red-500/20';
      case 'clicked':
        return 'bg-purple-50 text-purple-600 border-purple-100';
      default:
        return 'bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-100 dark:border-amber-500/20';
    }
  };

  const formatDate = (dateString: string) => {
    return formatDateTime12(dateString);
  };

  const getMessageTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      campaign: 'Campaign',
      individual: 'Individual',
      template: 'Template',
      'auto-message': 'Auto Message',
      alarm: 'Alarm',
      'zoom-event': 'Zoom Event',
      'api-campaign': 'API Campaign',
      program: 'Program',
    };
    return labels[type] ?? type;
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleRefresh = async () => {
    try {
      setIsRefreshing(true);
      await refetch();
      setLastRefreshTime(new Date());
    } catch (error) {
      console.error('Failed to refresh messages:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const renderPagination = () => {
    if (!messagesData) return null;

    const { page, totalPages } = messagesData;
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
                  if (hasPrevPage) handlePageChange(page - 1);
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
                      handlePageChange(1);
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
                      handlePageChange(pageNum);
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
                  if (hasNextPage) handlePageChange(page + 1);
                }}
                className={`rounded-xl border-slate-200 dark:border-slate-700/50 h-10 px-4 font-bold text-slate-600 dark:text-slate-400 transition-all hover:bg-slate-50 dark:hover:bg-slate-900/50 ${!hasNextPage ? 'pointer-events-none opacity-40' : 'cursor-pointer hover:scale-[1.02] active:scale-[0.98]'}`}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>
    );
  };

  if (!projectId) {
    return (
      <div className="min-h-full flex items-center justify-center p-8">
        <Alert variant="destructive" className="max-w-md rounded-[32px] p-8 border-none shadow-2xl bg-white dark:bg-slate-800/50">
          <AlertCircle className="h-8 w-8 mb-4 text-red-500" />
          <AlertTitle className="text-xl font-black text-slate-900 dark:text-white mb-2">Project ID Required</AlertTitle>
          <AlertDescription className="text-slate-500 dark:text-slate-400 font-medium">
            Please provide a valid project ID to view message history.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

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
              onClick={() => navigate(`/whatsapp/dashboard/${projectId}/send-message`)}
              className="h-10 w-10 rounded-xl border border-slate-100 dark:border-slate-700/50 bg-slate-50/50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-900/60 transition-all text-slate-500 dark:text-slate-400"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-[#22B573] font-bold text-xs uppercase tracking-widest mb-0.5">
                <History className="h-3.5 w-3.5" />
                Audit Logs
              </div>
              <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-2xl">
                Message History
              </h1>
              <p className="text-slate-500 dark:text-slate-400 text-xs font-medium">
                Tracking all outbound messages for <span className="text-slate-900 dark:text-white font-bold">{selectedProject?.projectName || 'Project'}</span>
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
              className="h-11 px-6 rounded-xl flex items-center gap-2 border-slate-200 dark:border-slate-700/50 text-slate-600 dark:text-slate-400 font-bold text-sm transition-all hover:bg-slate-50 dark:hover:bg-slate-900/50 hover:scale-[1.02] active:scale-[0.98]"
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              {isRefreshing ? 'Syncing...' : 'Sync Now'}
            </Button>

            <Button
              onClick={() => setAutoRefreshEnabled(!autoRefreshEnabled)}
              className={`h-11 px-6 rounded-xl flex items-center gap-2 font-bold text-sm shadow-lg transition-all hover:scale-[1.02] active:scale-[0.98] ${
                autoRefreshEnabled 
                  ? 'bg-slate-900 hover:bg-slate-800 text-white shadow-slate-900/10' 
                  : 'bg-white dark:bg-slate-800/50 border-slate-200 dark:border-slate-700/50 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900/50'
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
          </div>
        </div>
      </motion.div>

      <main className="container mx-auto space-y-6 pb-12">
        {/* Stats Section */}
        <AnimatePresence mode="wait">
          {messagesData && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="grid grid-cols-2 lg:grid-cols-4 gap-4"
            >
              {[
                { label: "Total Messages", value: messagesData.total, icon: MessageSquare, color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-50 dark:bg-blue-500/10", border: "border-blue-100 dark:border-blue-500/20" },
                { label: "Delivered/Read", value: messagesData.wabaMessages.filter(m => m.status === 'delivered' || m.status === 'read').length, icon: CheckCircle2, color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-500/10", border: "border-emerald-100 dark:border-emerald-500/20" },
                { label: "Pending/Sent", value: messagesData.wabaMessages.filter(m => m.status === 'sent' || m.status === 'pending').length, icon: Clock, color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-50 dark:bg-amber-500/10", border: "border-amber-100 dark:border-amber-500/20" },
                { label: "Failed", value: messagesData.wabaMessages.filter(m => m.status === 'failed').length, icon: XCircle, color: "text-red-600 dark:text-red-400", bg: "bg-red-50 dark:bg-red-500/10", border: "border-red-100 dark:border-red-500/20" },
              ].map((stat, i) => (
                <Card key={i} className={`rounded-2xl border ${stat.border} ${stat.bg} shadow-sm group hover:shadow-md transition-all duration-300`}>
                  <CardContent className="p-5 flex items-center gap-4">
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
            </motion.div>
          )}
        </AnimatePresence>

        {/* Filters and List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 rounded-[24px] overflow-hidden shadow-sm hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-500"
        >
          <div className="p-6 sm:p-8 border-b border-slate-100 dark:border-slate-700/50 bg-slate-50/30 dark:bg-slate-800/30">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div>
                <h2 className="text-xl font-black text-slate-900 dark:text-white">Message Logs</h2>
                <p className="text-slate-500 dark:text-slate-400 text-xs font-medium mt-1">Filter and audit your message delivery status</p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                {/* Date Filter */}
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 flex items-center justify-center text-slate-400">
                    <Calendar className="h-4 w-4" />
                  </div>
                  <Select value={datePreset || ''} onValueChange={(value) => setDatePreset(value as DatePreset)}>
                    <SelectTrigger className="w-40 h-10 rounded-xl border-slate-200 dark:border-slate-700/50 font-bold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800/50 focus:ring-[#22B573]/20">
                      <SelectValue placeholder="Period" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-slate-200 dark:border-slate-700/50 shadow-2xl">
                      <SelectItem value="today" className="font-bold">Today</SelectItem>
                      <SelectItem value="yesterday" className="font-bold">Yesterday</SelectItem>
                      <SelectItem value="lastWeek" className="font-bold">Last Week</SelectItem>
                      <SelectItem value="custom" className="font-bold text-blue-600 dark:text-blue-400">Custom Range</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Message Type Filter */}
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 flex items-center justify-center text-slate-400">
                    <Filter className="h-4 w-4" />
                  </div>
                  <Select
                    value={selectedMessageType || 'all'}
                    onValueChange={(value) => {
                      setSelectedMessageType(value === 'all' ? null : (value as MessageType));
                    }}
                  >
                    <SelectTrigger className="w-48 h-10 rounded-xl border-slate-200 dark:border-slate-700/50 font-bold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800/50 focus:ring-[#22B573]/20">
                      <SelectValue placeholder="All Types" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-slate-200 dark:border-slate-700/50 shadow-2xl">
                      <SelectItem value="all" className="font-bold">All Messages</SelectItem>
                      <SelectItem value="campaign" className="font-bold">Campaigns</SelectItem>
                      <SelectItem value="individual" className="font-bold">Individual</SelectItem>
                      <SelectItem value="template" className="font-bold">Templates</SelectItem>
                      <SelectItem value="auto-message" className="font-bold">Auto-Messages</SelectItem>
                      <SelectItem value="alarm" className="font-bold">Alarms</SelectItem>
                      <SelectItem value="zoom-event" className="font-bold">Zoom Events</SelectItem>
                      <SelectItem value="api-campaign" className="font-bold">API Campaigns</SelectItem>
                      <SelectItem value="program" className="font-bold">Programs</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Custom Date Range Picker */}
            <AnimatePresence>
              {datePreset === 'custom' && (
                <motion.div
                  initial={{ opacity: 0, height: 0, marginTop: 0 }}
                  animate={{ opacity: 1, height: 'auto', marginTop: 24 }}
                  exit={{ opacity: 0, height: 0, marginTop: 0 }}
                  className="flex flex-wrap items-center gap-4 p-4 rounded-2xl bg-[#22B573]/5 border border-[#22B573]/10"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] font-black uppercase tracking-widest text-[#22B573]">Start Date:</span>
                    <Input
                      type="date"
                      value={customStart}
                      onChange={(e) => setCustomStart(e.target.value)}
                      className="h-10 w-44 rounded-xl border-slate-200 dark:border-slate-700/50 bg-white dark:bg-slate-800/50 font-bold text-slate-700 dark:text-slate-300 focus:ring-[#22B573]/20"
                    />
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] font-black uppercase tracking-widest text-[#22B573]">End Date:</span>
                    <Input
                      type="date"
                      value={customEnd}
                      onChange={(e) => setCustomEnd(e.target.value)}
                      className="h-10 w-44 rounded-xl border-slate-200 dark:border-slate-700/50 bg-white dark:bg-slate-800/50 font-bold text-slate-700 dark:text-slate-300 focus:ring-[#22B573]/20"
                    />
                  </div>
                  <Button 
                    size="sm" 
                    onClick={handleRefresh}
                    className="ml-auto bg-[#22B573] hover:bg-[#1da467] text-white font-bold rounded-xl px-6 h-10"
                  >
                    Apply Range
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="p-4 sm:p-8">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-24 text-slate-400">
                <div className="h-16 w-16 bg-slate-50 dark:bg-slate-900/50 rounded-2xl flex items-center justify-center mb-4 border border-slate-100 dark:border-slate-700/50">
                  <Loader2 className="h-8 w-8 animate-spin text-[#22B573]" />
                </div>
                <p className="font-bold text-sm uppercase tracking-widest">Loading Messages...</p>
              </div>
            ) : error ? (
              <Alert variant="destructive" className="bg-red-50 dark:bg-red-500/10 border-red-200 rounded-2xl">
                <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                <AlertTitle className="text-red-800 font-bold">Failed to load</AlertTitle>
                <AlertDescription className="text-red-700 font-medium">Please check your connection and try again.</AlertDescription>
              </Alert>
            ) : !messagesData || messagesData.wabaMessages.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 text-slate-400">
                <div className="h-16 w-16 bg-slate-50 dark:bg-slate-900/50 rounded-2xl flex items-center justify-center mb-4 border border-slate-100 dark:border-slate-700/50">
                  <Search className="h-8 w-8 opacity-20" />
                </div>
                <p className="font-bold text-sm uppercase tracking-widest">No messages found</p>
                <p className="text-xs font-medium mt-1">Try adjusting your filters or date range</p>
              </div>
            ) : (
              <div className="space-y-4">
                {messagesData.wabaMessages.map((message, index) => (
                  <motion.div
                    key={message._id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="group flex flex-col xl:flex-row xl:items-center gap-6 p-6 rounded-2xl border border-slate-100 dark:border-slate-700/50 bg-white dark:bg-slate-800/50 hover:bg-slate-50/50 hover:border-[#22B573]/20 hover:shadow-lg hover:shadow-slate-200/40 transition-all duration-300"
                  >
                    {/* Status Icon */}
                    <div className={`h-14 w-14 rounded-2xl border flex items-center justify-center shadow-sm flex-shrink-0 group-hover:scale-105 transition-transform ${getStatusStyles(message.status)}`}>
                      {getStatusIcon(message.status)}
                    </div>

                    {/* Content Section */}
                    <div className="flex-1 min-w-0 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline" className={`rounded-lg font-black text-[10px] uppercase tracking-tighter px-2 py-0.5 border-slate-200 dark:border-slate-700/50 bg-slate-50 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400`}>
                            {getMessageTypeLabel(message.messageType)}
                          </Badge>
                          <Badge variant="outline" className={`rounded-lg font-black text-[10px] uppercase tracking-widest px-2 py-0.5 border-none shadow-sm ${getStatusStyles(message.status)}`}>
                            {message.status}
                          </Badge>
                        </div>
                        <h3 className="font-black text-slate-900 dark:text-white text-lg line-clamp-1 group-hover:text-[#22B573] transition-colors">
                          {message.templateName || 'Direct Message'}
                        </h3>
                        <div className="flex items-center gap-2 text-slate-400">
                          <Phone className="h-3 w-3" />
                          <span className="text-xs font-mono font-bold tracking-tight">{message.phoneNumber}</span>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div className="flex flex-col gap-1.5">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-3 w-3 text-slate-400" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Timeline</span>
                          </div>
                          <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                            <div className="flex flex-col">
                              <span className="text-[10px] font-bold text-slate-400 uppercase">Created</span>
                              <span className="text-[11px] font-medium text-slate-600 dark:text-slate-400">{formatDate(message.createdAt)}</span>
                            </div>
                            {message.sentAt && (
                              <div className="flex flex-col">
                                <span className="text-[10px] font-bold text-slate-400 uppercase">Sent</span>
                                <span className="text-[11px] font-medium text-slate-600 dark:text-slate-400">{formatDate(message.sentAt)}</span>
                              </div>
                            )}
                            {message.deliveredAt && (
                              <div className="flex flex-col">
                                <span className="text-[10px] font-bold text-slate-400 uppercase">Delivered</span>
                                <span className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400">{formatDate(message.deliveredAt)}</span>
                              </div>
                            )}
                            {message.readAt && (
                              <div className="flex flex-col">
                                <span className="text-[10px] font-bold text-slate-400 uppercase">Read</span>
                                <span className="text-[11px] font-medium text-green-600 dark:text-green-400">{formatDate(message.readAt)}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col justify-center gap-3">
                        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-700/50 flex flex-col gap-1">
                          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">WABA Message ID</span>
                          <span className="text-xs font-mono font-medium text-slate-600 dark:text-slate-400 break-all">{message.wabaMessageId}</span>
                        </div>
                        
                        {message.failureReason && (
                          <div className="p-2.5 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20 flex items-start gap-2.5">
                            <AlertCircle className="h-3.5 w-3.5 text-red-500 mt-0.5 flex-shrink-0" />
                            <div className="min-w-0">
                              <p className="text-[10px] font-black text-red-600 dark:text-red-400 uppercase tracking-widest leading-none mb-1">Error Trace</p>
                              <p className="text-[11px] font-medium text-red-700 leading-tight line-clamp-2">{message.failureReason}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                  </motion.div>
                ))}
              </div>
            )}

            {/* Pagination */}
            {messagesData && messagesData.totalPages > 1 && renderPagination()}
          </div>
        </motion.div>
      </main>
    </div>
  );
};

export default MessageHistory;
