import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
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
      'Are you sure you want to Cancel this campaign? This action cannot be undone.',
      'default',
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

  // const openRescheduleDialog = (campaign: Campaign) => {
  //   setSelectedCampaign(campaign);
  //   if (campaign.scheduledAt) {
  //     const scheduledDate = new Date(campaign.scheduledAt);
  //     setNewScheduledDate(scheduledDate.toISOString().split('T')[0]);
  //     setNewScheduledTime(scheduledDate.toTimeString().slice(0, 5));
  //   }
  //   setRescheduleDialogOpen(true);
  // };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge variant="default" className="bg-green-500">Completed</Badge>;
      case 'in-progress':
        return <Badge variant="default" className="bg-blue-500">In Progress</Badge>;
      case 'failed':
        return <Badge variant="destructive">Failed</Badge>;
      case 'draft':
        return <Badge variant="secondary">Draft</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'in-progress':
        return <Clock className="h-4 w-4 text-blue-500" />;
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'draft':
        return <MessageSquare className="h-4 w-4 text-gray-500" />;
      default:
        return <MessageSquare className="h-4 w-4 text-gray-500" />;
    }
  };

  const getScheduleInfo = (campaign: Campaign) => {
    if (campaign.scheduledAt && campaign.status === 'draft') {
      return (
        <div className="flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400">
          <Calendar className="h-3 w-3" />
          <span>{formatDateTime12(campaign.scheduledAt)}</span>
        </div>
      );
    }
    return null;
  };

  if (!selectedProject) {
    return (
      <div className="flex items-center justify-center h-64">
        <Alert>
          <AlertDescription>
            Please select a project to view campaigns.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading campaigns...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Failed to load campaigns: {(error as any)?.response?.data?.message || 'Unknown error'}
        </AlertDescription>
      </Alert>
    );
  }

  const campaigns = campaignsData?.campaigns || [];
  const pagination = campaignsData?.pagination;

  return (
    <div className="h-full flex flex-col space-y-4 sm:space-y-6 px-2 sm:px-0">
      {/* Header */}
      <div className="space-y-4 flex-shrink-0">
        {/* Main Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-primary" />
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                Campaigns
              </h1>
            </div>
          </div>
          
          {/* Project Info */}
          <div className="text-sm text-muted-foreground">
            <div className="font-medium">Project: {selectedProject?.projectName || 'Unknown'}</div>
            {lastRefreshTime && (
              <div className="text-xs text-muted-foreground">
                Last updated: {lastRefreshTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', second: '2-digit', hour12: true })}
              </div>
            )}
          </div>
        </div>

        {/* Controls Row */}
        <div className={`flex flex-col sm:flex-row items-start sm:items-center gap-3 ${autoRefreshEnabled ? 'justify-between' : 'justify-end'}`}>
          {/* Auto-refresh indicator */}
          {autoRefreshEnabled && (
            <div className="flex items-center gap-2 text-sm text-green-600">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span>Auto-refresh active</span>
            </div>
          )}
          
          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <Button 
              onClick={handleRefresh} 
              variant="outline" 
              size="sm"
              disabled={isRefreshing}
              className="flex items-center gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">{isRefreshing ? 'Refreshing...' : 'Refresh'}</span>
            </Button>
            
            <Button 
              onClick={() => setAutoRefreshEnabled(!autoRefreshEnabled)}
              variant={autoRefreshEnabled ? "default" : "outline"}
              size="sm"
              className="flex items-center gap-2 w-32"
            >
              <Clock className="h-4 w-4" />
              <span className="hidden sm:inline">{autoRefreshEnabled ? 'Disable Auto' : 'Enable Auto'}</span>
            </Button>

            <Link to={`/whatsapp/dashboard/${projectId}/campaigns/create`}>
              <Button className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">Create Campaign</span>
                <span className="sm:hidden">Create</span>
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Campaigns Table */}
      <div className="flex-1 min-h-0 flex flex-col">
        {campaigns.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 border rounded-lg flex-1">
            <MessageSquare className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No campaigns yet</h3>
            <p className="text-muted-foreground text-center mb-4">
              Create your first campaign to start sending bulk messages to your contacts.
            </p>
            <Link to={`/whatsapp/dashboard/${projectId}/campaigns/create`}>
              <Button className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Create Your First Campaign
              </Button>
            </Link>
          </div>
        ) : (
          <div className="border rounded-lg overflow-hidden flex-1 flex flex-col">
            <div className="overflow-auto flex-1">
              <table className="w-full min-w-[800px]">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Campaign Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Schedule
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Completed At
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Total
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
              {campaigns.map((campaign: Campaign) => (
                <tr key={campaign._id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {campaign.name}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {campaign.messageTemplate.templateName}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      {campaign.isDeleted ? (
                        <AlertCircle className="h-4 w-4 text-red-500" />
                      ) : (
                        getStatusIcon(campaign.status)
                      )}
                      {campaign.isDeleted ? (
                        <Badge variant="destructive">Cancelled</Badge>
                      ) : (
                        getStatusBadge(campaign.status)
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {getScheduleInfo(campaign) || (
                      <span className="text-gray-500 dark:text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {campaign.completedAt ? (
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        {new Date(campaign.completedAt).toLocaleDateString()}
                      </div>
                    ) : (
                      <span className="text-gray-500 dark:text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                    {campaign.analyticsSummary.total}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center gap-2">
                      {campaign.isDeleted ? (
                        <span className="text-gray-500 dark:text-gray-400">Cancelled</span>
                      ) : (
                        <>
                          <Link to={`/whatsapp/dashboard/${projectId}/campaigns/${campaign._id}`}>
                            <Button variant="outline" size="sm">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </Link>
                          
                          {/* {campaign.status === 'draft' && campaign.scheduledAt && (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => openRescheduleDialog(campaign)}
                                disabled={rescheduleCampaignMutation.isPending}
                              >
                                <Edit3 className="h-4 w-4" />
                              </Button>
                               <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleCancelScheduledCampaign(campaign._id)}
                                disabled={cancelScheduledCampaignMutation.isPending}
                              >
                              </Button> 
                            </>
                          )} */}
                          
                          {campaign.status !== 'completed' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteCampaign(campaign._id)}
                              disabled={deleteCampaignMutation.isPending}
                            >
                                                              <X className="h-4 w-4" />

                            </Button>
                          )}
                        </>
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

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex justify-center pt-4 flex-shrink-0">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious 
                  onClick={(e) => {
                    e.preventDefault();
                    if (pagination.hasPrevPage) handlePageChange(currentPage - 1);
                  }}
                  className={!pagination.hasPrevPage ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                />
              </PaginationItem>
              
              {/* Show first page */}
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
              
              {/* Show pages around current page */}
              {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
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
              })}
              
              {/* Show last page */}
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
                    if (pagination.hasNextPage) handlePageChange(currentPage + 1);
                  }}
                  className={!pagination.hasNextPage ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}

      {/* Reschedule Dialog */}
      <Dialog open={rescheduleDialogOpen} onOpenChange={setRescheduleDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reschedule Campaign</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="reschedule-date">Date</Label>
              <Input
                id="reschedule-date"
                type="date"
                value={newScheduledDate}
                onChange={(e) => setNewScheduledDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="reschedule-time">Time</Label>
              <Input
                id="reschedule-time"
                type="time"
                value={newScheduledTime}
                onChange={(e) => setNewScheduledTime(e.target.value)}
              />
            </div>
            
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>Your local timezone: {Intl.DateTimeFormat().resolvedOptions().timeZone}</span>
            </div>
            
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setRescheduleDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleRescheduleCampaign}
                disabled={!newScheduledDate || !newScheduledTime || rescheduleCampaignMutation.isPending}
              >
                {rescheduleCampaignMutation.isPending ? 'Rescheduling...' : 'Reschedule'}
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
        confirmText={confirmationDialog.variant === 'destructive' ? 'Cancel' : 'Confirm'}
        cancelText="Cancel"
      />
    </div>
  );
};

export default CampaignsList;

