import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
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
  Download
} from 'lucide-react';
import { useCampaignById,  } from '@/hooks/useCampaigns';
import { useCampaignMessages } from '@/hooks/useCampaignMessages';
import { formatDateTime12 } from '@/lib/date';
import { toastUtils } from '@/lib/utils';
import { campaignApi } from '@/api/modules/campaignAPI';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { useProjectContext } from '@/context/ProjectContext';

const CampaignDetails = () => {
  const { campaignId, projectId } = useParams<{ campaignId: string; projectId: string }>();
  const {selectedProject} = useProjectContext();
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
  
  // const executeCampaignMutation = useExecuteCampaign();

  const handleExecuteCampaign = async () => {
    if (!campaign) return;
    
    if (window.confirm('Are you sure you want to execute this campaign? This will send messages to all selected contacts.')) {
      try {
        // This would need the contacts data - for now, we'll show a placeholder
        toastUtils.info('Campaign execution requires contact data. This feature will be implemented with the contacts integration.');
      } catch (error) {
        console.error('Failed to execute campaign:', error);
      }
    }
  };

  const handleRefresh = async () => {
    try {
      setIsRefreshing(true);
      await refetch(); // Always refresh campaign analytics
      if (showReport) {
        await refetchMessages(); // Only refresh report data if visible
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
    setReportPage(1); // Reset to first page when toggling
  };

  const handleReportPageChange = (page: number) => {
    setReportPage(page);
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

  // Transform API data for display
  const reportData = campaignMessagesData ? {
    messages: campaignMessagesData.wabaMessages,
    pagination: {
      page: campaignMessagesData.page,
      limit: campaignMessagesData.limit,
      totalCount: campaignMessagesData.total,
      totalPages: campaignMessagesData.totalPages,
      hasNextPage: campaignMessagesData.page < campaignMessagesData.totalPages,
      hasPrevPage: campaignMessagesData.page > 1,
    }
  } : null;

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
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'in-progress':
        return <Clock className="h-5 w-5 text-blue-500" />;
      case 'failed':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      case 'draft':
        return <MessageSquare className="h-5 w-5 text-gray-500" />;
      default:
        return <MessageSquare className="h-5 w-5 text-gray-500" />;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error || !campaign) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Failed to load campaign: {(error as any)?.response?.data?.message || 'Campaign not found'}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="h-full flex flex-col space-y-6 overflow-y-auto">
      {/* Header */}
      <div className="space-y-4">
        {/* Main Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link to={`/whatsapp/dashboard/${projectId}/campaigns`}>
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Campaigns
              </Button>
            </Link>
            
            <div className="flex items-center gap-2">
              {getStatusIcon(campaign.status)}
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                {campaign.name}
              </h1>
              {getStatusBadge(campaign.status)}
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
          
          <Button 
            onClick={handleShowReport} 
            variant="outline" 
            size="sm"
            className="flex items-center gap-2"
          >
            <FileText className="h-4 w-4" />
            {showReport ? 'Hide Report' : 'View Report'}
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
            {isDownloadingReport ? 'Downloading...' : 'Download Report'}
          </Button>
          
          {campaign?.status === 'draft' && (
            <Button onClick={handleExecuteCampaign} className="flex items-center gap-2">
              <Send className="h-4 w-4" />
              Execute Campaign
            </Button>
          )}
        </div>
      </div>
    </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Campaign Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Campaign Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Campaign Name</Label>
                <p className="text-sm">{campaign.name}</p>
              </div>
              
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Template</Label>
                <p className="text-sm">{campaign.messageTemplate.templateName}</p>
              </div>
              
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Status</Label>
                <div className="flex items-center gap-2">
                  {getStatusIcon(campaign.status)}
                  {getStatusBadge(campaign.status)}
                </div>
              </div>
              
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Created</Label>
                <p className="text-sm">{formatDateTime12(campaign.createdAt)}</p>
              </div>
              
              {campaign.scheduledAt && (
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Scheduled</Label>
                  <p className="text-sm">{formatDateTime12(campaign.scheduledAt)}</p>
                </div>
              )}
              
              {campaign.completedAt && (
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Completed</Label>
                  <p className="text-sm">{formatDateTime12(campaign.completedAt)}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Analytics Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Analytics Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Total Messages</span>
                <span className="font-semibold">{campaign.analyticsSummary.total}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Sent</span>
                <span className="font-semibold text-green-600">{campaign.analyticsSummary.sent}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Delivered</span>
                <span className="font-semibold text-blue-600">{campaign.analyticsSummary.delivered}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Read</span>
                <span className="font-semibold text-purple-600">{campaign.analyticsSummary.read}</span>
              </div>
              
              {/* <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Clicked</span>
                <span className="font-semibold text-orange-600">{campaign.analyticsSummary.clicked}</span>
              </div> */}
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Failed</span>
                <span className="font-semibold text-red-600">{campaign.analyticsSummary.failed}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Metrics - Full Width */}
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
                {campaign.analyticsSummary.total > 0 
                  ? Math.round((campaign.analyticsSummary.delivered / campaign.analyticsSummary.total) * 100)
                  : 0}%
              </div>
              <div className="text-sm text-muted-foreground">Delivery Rate</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {campaign.analyticsSummary.delivered > 0 
                  ? Math.round((campaign.analyticsSummary.read / campaign.analyticsSummary.delivered) * 100)
                  : 0}%
              </div>
              <div className="text-sm text-muted-foreground">Read Rate</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {campaign.analyticsSummary.read > 0 
                  ? Math.round((campaign.analyticsSummary.clicked / campaign.analyticsSummary.read) * 100)
                  : 0}%
              </div>
              <div className="text-sm text-muted-foreground">Click Rate</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                {campaign.analyticsSummary.total > 0 
                  ? Math.round((campaign.analyticsSummary.failed / campaign.analyticsSummary.total) * 100)
                  : 0}%
              </div>
              <div className="text-sm text-muted-foreground">Failure Rate</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Campaign Report Table */}
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
                              message.status === 'delivered' || message.status === 'read' ? 'default' :
                              message.status === 'sent' ? 'secondary' :
                              message.status === 'failed' ? 'destructive' : 'outline'
                            }
                            className={
                              message.status === 'delivered' ? 'bg-green-500' :
                              message.status === 'read' ? 'bg-blue-500' :
                              message.status === 'sent' ? 'bg-yellow-500' : ''
                            }
                          >
                            {message.status.toUpperCase()}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{message.messageType}</Badge>
                        </TableCell>
                        <TableCell>{formatDateTime12(message.createdAt)}</TableCell>
                        <TableCell>
                          {message.sentAt ? formatDateTime12(message.sentAt) : '-'}
                        </TableCell>
                        <TableCell>
                          {message.deliveredAt ? formatDateTime12(message.deliveredAt) : '-'}
                        </TableCell>
                        <TableCell>
                          {message.readAt ? formatDateTime12(message.readAt) : '-'}
                        </TableCell>
                        <TableCell className="text-red-600">
                          {message.failureReason || '-'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
            
            {/* Pagination */}
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
                        className={!reportData.pagination.hasPrevPage ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                      />
                    </PaginationItem>
                    
                    {/* Show first page */}
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
                    
                    {/* Show pages around current page */}
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
                    
                    {/* Show last page */}
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
                        className={!reportData.pagination.hasNextPage ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
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

export default CampaignDetails;

