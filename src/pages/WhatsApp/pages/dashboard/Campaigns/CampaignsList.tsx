import { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Card, CardContent } from '@/components/ui/card';
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
  Plus, 
  MessageSquare, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  Eye,
  Calendar,
  X,
  RefreshCw,
  Loader2,
  Search,
  LayoutGrid,
  ChevronRight,
  TrendingUp,
  BarChart3,
  Users,
  ArrowLeft,
  Settings2,
  Trash2,
  History
} from 'lucide-react';
import { useProjectContext } from '@/context/ProjectContext';
import { useCampaigns, useDeleteCampaign, useRescheduleCampaign } from '@/hooks/useCampaigns';
import type { Campaign } from '@/schemas/campaignSchema';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ConfirmationDialog } from '@/components/ui/ConfirmationDialog';
import { formatDateTime12 } from '@/lib/date';

const CampaignsList = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { selectedProject } = useProjectContext();
  const [currentPage, setCurrentPage] = useState(1);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(true);
  const [lastRefreshTime, setLastRefreshTime] = useState<Date | null>(null);
  const [rescheduleDialogOpen, setRescheduleDialogOpen] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [newScheduledDate, setNewScheduledDate] = useState('');
  const [newScheduledTime, setNewScheduledTime] = useState('');
  
  // Confirmation dialog states
  const [confirmationDialog, setConfirmationDialog] = useState({
    isOpen: false,
    title: '',
    description: '',
    variant: 'default' as 'default' | 'destructive',
    onConfirm: () => {},
    isLoading: false,
  });
  
  const limit = 10;

  const { data: campaignsData, isLoading, error, refetch } = useCampaigns(
    selectedProject?._id || '',
    currentPage,
    limit
  );

  const deleteCampaignMutation = useDeleteCampaign();
  const rescheduleCampaignMutation = useRescheduleCampaign();

  // Auto-refresh every 10 seconds
  useEffect(() => {
    if (!autoRefreshEnabled || !selectedProject?._id) return;

    const interval = setInterval(async () => {
      try {
        await refetch();
        setLastRefreshTime(new Date());
      } catch (error) {
        console.error('Auto-refresh failed:', error);
      }
    }, 10000); // 10 seconds

    return () => clearInterval(interval);
  }, [autoRefreshEnabled, selectedProject?._id, refetch]);

  const handleRefresh = async () => {
    try {
      setIsRefreshing(true);
      await refetch();
      setLastRefreshTime(new Date());
    } catch (error) {
      console.error('Failed to refresh campaigns:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const showConfirmationDialog = (
    title: string,
    description: string,
    variant: 'default' | 'destructive',
    onConfirm: () => void
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
    setConfirmationDialog(prev => ({
      ...prev,
      isOpen: false,
      isLoading: false,
    }));
  };

  const handleConfirmationConfirm = async () => {
    setConfirmationDialog(prev => ({ ...prev, isLoading: true }));
    try {
      await confirmationDialog.onConfirm();
      closeConfirmationDialog();
    } catch (error) {
      console.error('Confirmation action failed:', error);
      setConfirmationDialog(prev => ({ ...prev, isLoading: false }));
    }
  };

  const handleDeleteCampaign = async (campaignId: string) => {
    showConfirmationDialog(
      'Cancel Campaign',
      'Are you sure you want to cancel this campaign? This action cannot be undone.',
      'destructive',
      async () => {
        await deleteCampaignMutation.mutateAsync(campaignId);
      }
    );
  };

  const handleRescheduleCampaign = async () => {
    if (!selectedCampaign || !newScheduledDate || !newScheduledTime) return;
    
    const scheduledAt = new Date(`${newScheduledDate}T${newScheduledTime}`).toISOString();
    
    try {
      await rescheduleCampaignMutation.mutateAsync({
        campaignId: selectedCampaign._id,
        scheduledAt,
      });
      setRescheduleDialogOpen(false);
      setSelectedCampaign(null);
      setNewScheduledDate('');
      setNewScheduledTime('');
    } catch (error) {
      console.error('Failed to reschedule campaign:', error);
    }
  };

  const getStatusStyles = (status: string, isDeleted: boolean) => {
    if (isDeleted) return 'bg-red-50 text-red-600 border-red-100';
    switch (status) {
      case 'completed':
        return 'bg-emerald-50 text-emerald-600 border-emerald-100';
      case 'in-progress':
        return 'bg-blue-50 text-blue-600 border-blue-100';
      case 'failed':
        return 'bg-red-50 text-red-600 border-red-100';
      case 'draft':
        return 'bg-slate-50 text-slate-600 border-slate-100';
      default:
        return 'bg-amber-50 text-amber-600 border-amber-100';
    }
  };

  const getStatusIcon = (status: string, isDeleted: boolean) => {
    if (isDeleted) return <X className="h-4 w-4" />;
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4" />;
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

  const renderPagination = () => {
    if (!campaignsData?.pagination) return null;

    const { page = 1, totalPages = 1 } = campaignsData.pagination;
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
                className={`rounded-xl border-slate-200 h-10 px-4 font-bold text-slate-600 transition-all hover:bg-slate-50 ${!hasPrevPage ? 'pointer-events-none opacity-40' : 'cursor-pointer hover:scale-[1.02] active:scale-[0.98]'}`}
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
                    className="cursor-pointer h-10 w-10 rounded-xl border-slate-200 font-bold text-slate-600 hover:bg-slate-50"
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
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
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
                    className="cursor-pointer h-10 w-10 rounded-xl border-slate-200 font-bold text-slate-600 hover:bg-slate-50"
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
                className={`rounded-xl border-slate-200 h-10 px-4 font-bold text-slate-600 transition-all hover:bg-slate-50 ${!hasNextPage ? 'pointer-events-none opacity-40' : 'cursor-pointer hover:scale-[1.02] active:scale-[0.98]'}`}
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
        <Alert variant="destructive" className="max-w-md rounded-[32px] p-8 border-none shadow-2xl bg-white">
          <AlertCircle className="h-8 w-8 mb-4 text-red-500" />
          <AlertTitle className="text-xl font-black text-slate-900 mb-2">Project Required</AlertTitle>
          <AlertDescription className="text-slate-500 font-medium">
            Please select a project to view and manage campaigns.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Fetch global campaigns for project-wide statistics
  const { data: globalStatsData } = useCampaigns(
    selectedProject?._id || '',
    1,
    1000 // Fetch a large enough sample for global stats
  );

  const campaigns = campaignsData?.campaigns || [];
  const globalCampaigns = globalStatsData?.campaigns || [];

  const stats = [
    { 
      label: "Total Campaigns", 
      value: campaignsData?.pagination?.totalCount || 0, 
      icon: MessageSquare, 
      color: "text-blue-600", 
      bg: "bg-blue-50", 
      border: "border-blue-100" 
    },
    { 
      label: "Completed", 
      value: globalCampaigns.filter(c => c.status === 'completed').length, 
      icon: CheckCircle, 
      color: "text-emerald-600", 
      bg: "bg-emerald-50", 
      border: "border-emerald-100" 
    },
    { 
      label: "In Progress", 
      value: globalCampaigns.filter(c => c.status === 'in-progress').length, 
      icon: TrendingUp, 
      color: "text-blue-600", 
      bg: "bg-blue-50", 
      border: "border-blue-100" 
    },
    { 
      label: "Failed/Cancelled", 
      value: globalCampaigns.filter(c => c.status === 'failed' || c.isDeleted).length, 
      icon: X, 
      color: "text-red-600", 
      bg: "bg-red-50", 
      border: "border-red-100" 
    },
  ];

  return (
    <div className="min-h-full w-full min-w-0 max-w-full box-border p-2 transition-colors duration-500 sm:p-2 md:p-0 lg:p-0 xl:p-2 2xl:p-4">
      {/* Premium Header */}
      <motion.div
        className="mb-6 rounded-2xl border border-slate-200/60 p-4 sm:p-5"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
          backgroundColor: "#ffffff",
          boxShadow: "0 1px 3px rgba(0, 0, 0, 0.05), 0 1px 2px rgba(0, 0, 0, 0.06)",
        }}
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-[#22B573] font-bold text-xs uppercase tracking-widest mb-0.5">
                <BarChart3 className="h-3.5 w-3.5" />
                Marketing Hub
              </div>
              <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
                Campaigns
              </h1>
              <p className="text-slate-500 text-xs font-medium">
                Manage your bulk messaging campaigns for <span className="text-slate-900 font-bold">{selectedProject?.projectName || 'Project'}</span>
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
                  <span className="text-[10px] font-bold text-green-600 uppercase tracking-widest">Live Sync Active</span>
                </div>
              )}
            </div>
            
            <Button
              onClick={handleRefresh}
              variant="outline"
              disabled={isRefreshing}
              className="h-11 px-6 rounded-xl flex items-center gap-2 border-slate-200 text-slate-600 font-bold text-sm transition-all hover:bg-slate-50 hover:scale-[1.02] active:scale-[0.98]"
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              {isRefreshing ? 'Syncing...' : 'Sync Now'}
            </Button>

            <Button
              onClick={() => setAutoRefreshEnabled(!autoRefreshEnabled)}
              className={`h-11 px-6 rounded-xl flex items-center gap-2 font-bold text-sm shadow-lg transition-all hover:scale-[1.02] active:scale-[0.98] ${
                autoRefreshEnabled 
                  ? 'bg-slate-900 hover:bg-slate-800 text-white shadow-slate-900/10' 
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
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

            <Link to={`/whatsapp/dashboard/${projectId}/campaigns/create`}>
              <Button
                className="h-11 px-6 rounded-xl flex items-center gap-2 font-bold text-sm shadow-lg shadow-green-600/20 transition-all hover:scale-[1.02] active:scale-[0.98] bg-[#22B573] hover:bg-[#1da467] text-white"
              >
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">Create Campaign</span>
                <span className="sm:hidden">New</span>
              </Button>
            </Link>
          </div>
        </div>
      </motion.div>

      <main className="container mx-auto space-y-6 pb-12">
        {/* Stats Section */}
        <AnimatePresence mode="wait">
          {campaignsData && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="grid grid-cols-2 lg:grid-cols-4 gap-4"
            >
              {stats.map((stat, i) => (
                <Card key={i} className={`rounded-2xl border ${stat.border} ${stat.bg} shadow-sm group hover:shadow-md transition-all duration-300`}>
                  <CardContent className="p-5 flex items-center gap-4">
                    <div className={`h-12 w-12 rounded-xl bg-white border ${stat.border} flex items-center justify-center ${stat.color} shadow-sm group-hover:scale-110 transition-transform`}>
                      <stat.icon className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-0.5">{stat.label}</p>
                      <h4 className={`text-2xl font-black ${stat.color}`}>{stat.value}</h4>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* List Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white border border-slate-200 rounded-[24px] overflow-hidden shadow-sm hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-500"
        >
          <div className="p-6 sm:p-8 border-b border-slate-100 bg-slate-50/30">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div>
                <h2 className="text-xl font-black text-slate-900">Campaign History</h2>
                <p className="text-slate-500 text-xs font-medium mt-1">Monitor and manage your marketing outreach</p>
              </div>

              <div className="relative w-full lg:w-96 group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-[#22B573] transition-colors" />
                <Input
                  placeholder="Search campaigns..."
                  className="h-11 pl-11 rounded-xl border-slate-200 bg-white/50 focus:bg-white transition-all"
                />
              </div>
            </div>
          </div>

          <div className="p-4 sm:p-8">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-24 text-slate-400">
                <div className="h-16 w-16 bg-slate-50 rounded-2xl flex items-center justify-center mb-4 border border-slate-100">
                  <Loader2 className="h-8 w-8 animate-spin text-[#22B573]" />
                </div>
                <p className="font-bold text-sm uppercase tracking-widest">Loading Campaigns...</p>
              </div>
            ) : error ? (
              <Alert variant="destructive" className="bg-red-50 border-red-200 rounded-2xl">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <AlertTitle className="text-red-800 font-bold">Failed to load</AlertTitle>
                <AlertDescription className="text-red-700 font-medium">Please check your connection and try again.</AlertDescription>
              </Alert>
            ) : campaigns.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 text-slate-400">
                <div className="h-16 w-16 bg-slate-50 rounded-2xl flex items-center justify-center mb-4 border border-slate-100">
                  <Search className="h-8 w-8 opacity-20" />
                </div>
                <p className="font-bold text-sm uppercase tracking-widest">No campaigns found</p>
                <p className="text-xs font-medium mt-1">Start by creating your first campaign</p>
                <Link to={`/whatsapp/dashboard/${projectId}/campaigns/create`} className="mt-6">
                  <Button className="bg-[#22B573] hover:bg-[#1da467] text-white font-bold rounded-xl px-6">
                    Create Campaign
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {campaigns.map((campaign, index) => (
                  <motion.div
                    key={campaign._id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="group flex flex-col xl:flex-row xl:items-center gap-6 p-6 rounded-2xl border border-slate-100 bg-white hover:bg-slate-50/50 hover:border-[#22B573]/20 hover:shadow-lg hover:shadow-slate-200/40 transition-all duration-300"
                  >
                    {/* Status Icon */}
                    <div className={`h-14 w-14 rounded-2xl border flex items-center justify-center shadow-sm flex-shrink-0 group-hover:scale-105 transition-transform ${getStatusStyles(campaign.status, campaign.isDeleted)}`}>
                      {getStatusIcon(campaign.status, campaign.isDeleted)}
                    </div>

                    {/* Content Section */}
                    <div className="flex-1 min-w-0 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline" className={`rounded-lg font-black text-[10px] uppercase tracking-tighter px-2 py-0.5 border-slate-200 bg-slate-50 text-slate-500`}>
                            {campaign.messageTemplate?.templateName || 'Direct Campaign'}
                          </Badge>
                          <Badge variant="outline" className={`rounded-lg font-black text-[10px] uppercase tracking-widest px-2 py-0.5 border-none shadow-sm ${getStatusStyles(campaign.status, campaign.isDeleted)}`}>
                            {campaign.isDeleted ? 'Cancelled' : campaign.status}
                          </Badge>
                        </div>
                        <h3 className="font-black text-slate-900 text-lg line-clamp-1 group-hover:text-[#22B573] transition-colors">
                          {campaign.name}
                        </h3>
                        <div className="flex items-center gap-2 text-slate-400">
                          <Users className="h-3 w-3" />
                          <span className="text-xs font-bold tracking-tight">{campaign.analyticsSummary?.total || 0} Recipients</span>
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
                              <span className="text-[10px] font-bold text-slate-400 uppercase">Scheduled</span>
                              <span className="text-[11px] font-medium text-slate-600">
                                {campaign.scheduledAt ? formatDateTime12(campaign.scheduledAt) : 'Immediate'}
                              </span>
                            </div>
                            {campaign.completedAt && (
                              <div className="flex flex-col">
                                <span className="text-[10px] font-bold text-slate-400 uppercase">Completed</span>
                                <span className="text-[11px] font-medium text-emerald-600">{formatDateTime12(campaign.completedAt)}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col justify-center gap-3">
                        <div className="flex items-center gap-4">
                          <div className="flex-1 p-3 rounded-xl bg-slate-50 border border-slate-100 flex flex-col items-center">
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Sent</span>
                            <span className="text-sm font-black text-slate-900">{campaign.analyticsSummary?.sent || 0}</span>
                          </div>
                          <div className="flex-1 p-3 rounded-xl bg-emerald-50 border border-emerald-100 flex flex-col items-center">
                            <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600">Read</span>
                            <span className="text-sm font-black text-emerald-700">{campaign.analyticsSummary?.read || 0}</span>
                          </div>
                          <div className="flex-1 p-3 rounded-xl bg-red-50 border border-red-100 flex flex-col items-center">
                            <span className="text-[10px] font-black uppercase tracking-widest text-red-600">Failed</span>
                            <span className="text-sm font-black text-red-700">{campaign.analyticsSummary?.failed || 0}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      <Link 
                        to={campaign.isDeleted ? "#" : `/whatsapp/dashboard/${projectId}/campaigns/${campaign._id}`}
                        className={campaign.isDeleted ? "pointer-events-none" : ""}
                      >
                        <Button 
                          variant="outline" 
                          size="icon" 
                          disabled={campaign.isDeleted}
                          className="h-10 w-10 rounded-xl border-slate-200 text-slate-500 hover:text-[#22B573] hover:border-[#22B573]/30 hover:bg-[#22B573]/5 transition-all disabled:opacity-30"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </Link>
                      
                      {!campaign.isDeleted && campaign.status !== 'completed' && (
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleDeleteCampaign(campaign._id)}
                          disabled={deleteCampaignMutation.isPending}
                          className="h-10 w-10 rounded-xl border-slate-200 text-slate-400 hover:text-red-600 hover:border-red-200 hover:bg-red-50 transition-all"
                        >
                          {deleteCampaignMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                        </Button>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            )}

            {/* Pagination */}
            {campaignsData?.pagination && campaignsData.pagination.totalPages > 1 && renderPagination()}
          </div>
        </motion.div>
      </main>

      {/* Reschedule Dialog (Kept for future use or hidden if not used) */}
      <Dialog open={rescheduleDialogOpen} onOpenChange={setRescheduleDialogOpen}>
        <DialogContent className="rounded-2xl p-8 border-none shadow-2xl bg-white">
          <DialogHeader>
            <DialogTitle className="text-xl font-black text-slate-900">Reschedule Campaign</DialogTitle>
          </DialogHeader>
          <div className="space-y-6 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">New Date</Label>
                <Input
                  type="date"
                  value={newScheduledDate}
                  onChange={(e) => setNewScheduledDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="rounded-xl border-slate-200 focus:ring-[#22B573]/20"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">New Time</Label>
                <Input
                  type="time"
                  value={newScheduledTime}
                  onChange={(e) => setNewScheduledTime(e.target.value)}
                  className="rounded-xl border-slate-200 focus:ring-[#22B573]/20"
                />
              </div>
            </div>
            
            <div className="flex items-center gap-2 p-3 rounded-xl bg-blue-50 border border-blue-100 text-xs text-blue-600 font-medium">
              <Clock className="h-4 w-4" />
              <span>Timezone: {Intl.DateTimeFormat().resolvedOptions().timeZone}</span>
            </div>
            
            <div className="flex justify-end gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => setRescheduleDialogOpen(false)}
                className="rounded-xl h-11 px-6 font-bold text-slate-600 border-slate-200 hover:bg-slate-50"
              >
                Cancel
              </Button>
              <Button
                onClick={handleRescheduleCampaign}
                disabled={!newScheduledDate || !newScheduledTime || rescheduleCampaignMutation.isPending}
                className="rounded-xl h-11 px-8 font-bold bg-[#22B573] hover:bg-[#1da467] text-white shadow-lg shadow-green-600/20 transition-all hover:scale-[1.02]"
              >
                {rescheduleCampaignMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Confirm Reschedule'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={confirmationDialog.isOpen}
        onClose={closeConfirmationDialog}
        onConfirm={handleConfirmationConfirm}
        title={confirmationDialog.title}
        description={confirmationDialog.description}
        variant={confirmationDialog.variant}
        isLoading={confirmationDialog.isLoading}
        confirmText={confirmationDialog.variant === 'destructive' ? 'Cancel Campaign' : 'Confirm'}
        cancelText="Keep Campaign"
      />
    </div>
  );
};

export default CampaignsList;

