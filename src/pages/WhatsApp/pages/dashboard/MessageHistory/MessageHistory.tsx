import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
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
  Phone
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
        return <CheckCircle className="h-4 w-4 text-blue-500" />;
      case 'delivered':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'read':
        return <Eye className="h-4 w-4 text-green-600" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'clicked':
        return <CheckCircle className="h-4 w-4 text-purple-500" />;
      default:
        return <Clock className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'sent':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'delivered':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'read':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'failed':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'clicked':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      default:
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
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
      <div className="flex justify-center pt-4">
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious 
                onClick={(e) => {
                  e.preventDefault();
                  if (hasPrevPage) handlePageChange(page - 1);
                }}
                className={!hasPrevPage ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
              />
            </PaginationItem>
            
            {/* Show first page */}
            {page > 3 && (
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
                {page > 4 && (
                  <PaginationItem>
                    <PaginationEllipsis />
                  </PaginationItem>
                )}
              </>
            )}
            
            {/* Show pages around current page */}
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
                    className="cursor-pointer"
                  >
                    {pageNum}
                  </PaginationLink>
                </PaginationItem>
              );
            })}
            
            {/* Show last page */}
            {page < totalPages - 2 && (
              <>
                {page < totalPages - 3 && (
                  <PaginationItem>
                    <PaginationEllipsis />
                  </PaginationItem>
                )}
                <PaginationItem>
                  <PaginationLink 
                    onClick={(e) => {
                      e.preventDefault();
                      handlePageChange(totalPages);
                    }}
                    className="cursor-pointer"
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
                className={!hasNextPage ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>
    );
  };

  if (!projectId) {
    return (
      <div className="flex items-center justify-center h-64">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            No project ID provided.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 px-2 sm:px-0 overflow-y-auto">
      {/* Header */}
      <div className="space-y-4 flex flex-col gap-4">
        {/* Main Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(`/whatsapp/dashboard/${projectId}/send-message`)}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Back to Send Message</span>
              <span className="sm:hidden">Back</span>
            </Button>
            <div className="flex items-center gap-2">
              <History className="h-5 w-5 text-primary" />
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                Message History
              </h1>
            </div>
          </div>
          
          {/* Project Info */}
          <div className="text-sm text-muted-foreground">
            <div className="font-medium">Project: {selectedProject?.projectName || 'Unknown'}</div>
            {lastRefreshTime && (
              <div className="text-xs text-muted-foreground">
                Last updated: {lastRefreshTime.toLocaleTimeString()}
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
          
          {/* Date Filters + Actions */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Date Filter Dropdown */}
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Date Filter:</span>
              <Select value={datePreset || ''} onValueChange={(value) => setDatePreset(value as DatePreset)}>
                <SelectTrigger className="w-32 h-8">
                  <SelectValue placeholder="Select period" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="yesterday">Yesterday</SelectItem>
                  <SelectItem value="lastWeek">Last Week</SelectItem>
                  <SelectItem value="custom">Custom Range</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Message Type Filter Dropdown */}
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Message Type:</span>
              <Select 
                value={selectedMessageType || 'all'} 
                onValueChange={(value) => {
                  setSelectedMessageType(value === 'all' ? null : (value as MessageType));
                }}
              >
                <SelectTrigger className="w-40 h-8">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="campaign">Campaign</SelectItem>
                  <SelectItem value="individual">Individual</SelectItem>
                  <SelectItem value="template">Template</SelectItem>
                  <SelectItem value="auto-message">Auto Message</SelectItem>
                  <SelectItem value="alarm">Alarm</SelectItem>
                  <SelectItem value="zoom-event">Zoom Event</SelectItem>
                  <SelectItem value="api-campaign">API Campaign</SelectItem>
                  <SelectItem value="program">Program</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Custom Date Range Inputs
            {datePreset === 'custom' && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">From:</span>
                <Input 
                  type="date" 
                  value={customStart} 
                  onChange={(e) => setCustomStart(e.target.value)} 
                  className="h-8 w-40" 
                />
                <span className="text-sm text-muted-foreground">To:</span>
                <Input 
                  type="date" 
                  value={customEnd} 
                  onChange={(e) => setCustomEnd(e.target.value)} 
                  className="h-8 w-40" 
                />
              </div>
            )} */}

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
          </div>
        </div>

        <div className="flex items-center gap-2 w-full justify-end">
        {datePreset === 'custom' && (
              <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-800 px-3 py-2 rounded-lg border">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Date Range:</span>
                <Input 
                  type="date" 
                  value={customStart} 
                  onChange={(e) => setCustomStart(e.target.value)} 
                  className="h-8 w-40" 
                  placeholder="Start date"
                />
                <span className="text-sm text-muted-foreground">to</span>
                <Input 
                  type="date" 
                  value={customEnd} 
                  onChange={(e) => setCustomEnd(e.target.value)} 
                  className="h-8 w-40" 
                  placeholder="End date"
                />
              </div>
            )}
        </div>
      </div>

      {/* Stats Card */}
      {messagesData && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Message Statistics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <div className="text-center p-2 sm:p-3">
                <div className="text-lg sm:text-2xl font-bold text-primary">{messagesData.total}</div>
                <div className="text-xs sm:text-sm text-muted-foreground">Total Messages</div>
              </div>
              <div className="text-center p-2 sm:p-3">
                <div className="text-lg sm:text-2xl font-bold text-green-600">
                  {messagesData.wabaMessages.filter(m => m.status === 'delivered' || m.status === 'read').length}
                </div>
                <div className="text-xs sm:text-sm text-muted-foreground">Delivered</div>
              </div>
              <div className="text-center p-2 sm:p-3">
                <div className="text-lg sm:text-2xl font-bold text-blue-600">
                  {messagesData.wabaMessages.filter(m => m.status === 'sent').length}
                </div>
                <div className="text-xs sm:text-sm text-muted-foreground">Sent</div>
              </div>
              <div className="text-center p-2 sm:p-3">
                <div className="text-lg sm:text-2xl font-bold text-red-600">
                  {messagesData.wabaMessages.filter(m => m.status === 'failed').length}
                </div>
                <div className="text-xs sm:text-sm text-muted-foreground">Failed</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Messages List */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Messages</CardTitle>
          <CardDescription>
            View all WhatsApp messages sent through this project
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin mr-2" />
              Loading messages...
            </div>
          ) : error ? (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Failed to load messages. Please try again.
              </AlertDescription>
            </Alert>
          ) : messagesData?.wabaMessages.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No messages found for this project.
            </div>
          ) : (
            <div className="space-y-3">
              {messagesData?.wabaMessages.map((message) => (
                <div key={message._id} className="border rounded-lg p-4 space-y-3 bg-white dark:bg-gray-800 shadow-sm hover:shadow-md transition-shadow">
                  {/* Header Row */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      {getStatusIcon(message.status)}
                      <div className="min-w-0">
                        <h3 className="font-semibold text-base truncate">{message.templateName}</h3>
                        <p className="text-xs text-muted-foreground">{getMessageTypeLabel(message.messageType)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Badge className={getStatusColor(message.status)}>
                        {message.status.toUpperCase()}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {formatDate(message.createdAt)}
                      </span>
                    </div>
                  </div>

                  {/* Contact Information */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className="space-y-2">
                      {/* Phone Number */}
                      {message.phoneNumber && (
                        <div className="flex items-center gap-2">
                          <Phone className="h-3 w-3 text-blue-500 flex-shrink-0" />
                          <div className="min-w-0">
                            <span className="text-xs text-muted-foreground">Phone:</span>
                            <p className="font-mono text-sm font-medium truncate">{message.phoneNumber}</p>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      {/* Timestamps */}
                      {message.sentAt && (
                        <div className="flex items-center gap-2">
                          <Calendar className="h-3 w-3 text-blue-500 flex-shrink-0" />
                          <div className="min-w-0">
                            <span className="text-xs text-muted-foreground">Sent:</span>
                            <p className="text-xs truncate">{formatDate(message.sentAt)}</p>
                          </div>
                        </div>
                      )}

                      {message.deliveredAt && (
                        <div className="flex items-center gap-2">
                          <Calendar className="h-3 w-3 text-green-500 flex-shrink-0" />
                          <div className="min-w-0">
                            <span className="text-xs text-muted-foreground">Delivered:</span>
                            <p className="text-xs truncate">{formatDate(message.deliveredAt)}</p>
                          </div>
                        </div>
                      )}

                      {message.readAt && (
                        <div className="flex items-center gap-2">
                          <Eye className="h-3 w-3 text-green-600 flex-shrink-0" />
                          <div className="min-w-0">
                            <span className="text-xs text-muted-foreground">Read:</span>
                            <p className="text-xs truncate">{formatDate(message.readAt)}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Error Message */}
                  {message.failureReason && (
                    <div className="p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                      <div className="flex items-center gap-2">
                        <AlertCircle className="h-3 w-3 text-red-500" />
                        <span className="text-xs font-medium text-red-700 dark:text-red-300">Error:</span>
                      </div>
                      <p className="text-xs text-red-600 dark:text-red-400 mt-1">{message.failureReason}</p>
                    </div>
                  )}

                  {/* Footer */}
                  <div className="flex items-center justify-between pt-1 border-t border-gray-200 dark:border-gray-600">
                    <div className="text-xs text-muted-foreground">
                      ID: <span className="font-mono">{message.wabaMessageId}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination: hide when date filters are applied */}
          {messagesData && !datePreset && !selectedMessageType && messagesData.totalPages > 1 && renderPagination()}
        </CardContent>
      </Card>
    </div>
  );
};

export default MessageHistory;
