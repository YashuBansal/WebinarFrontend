import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@zoom/components/ui/card";
import { Alert, AlertDescription } from "@zoom/components/ui/alert";
import { Button } from "@zoom/components/ui/button";
import { Badge } from "@zoom/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@zoom/components/ui/table";
import { Loader2, RefreshCw } from "lucide-react";
import { useMeetingMessages } from "@zoom/hooks/useZoom";

export default function MeetingMessages() {
  const { meetingId, webinarId } = useParams<{
    projectId: string;
    meetingId?: string;
    webinarId?: string;
  }>();
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefreshTime, setLastRefreshTime] = useState<Date | null>(null);
  const [searchParams] = useSearchParams();
  const occurrenceId = searchParams.get("occurrenceId");
  // Determine if this is a webinar or meeting context
  const isWebinar = !!webinarId;
  const zoomId = webinarId || meetingId; // Use webinarId if present, otherwise meetingId

  const { data, isLoading, error, refetch, isFetching } = useMeetingMessages(
    zoomId,
    page,
    limit,
    true,
    occurrenceId || undefined
  );

  // Auto-refresh every 10 seconds
  useEffect(() => {
    if (!autoRefreshEnabled || !zoomId) return;
    const interval = setInterval(async () => {
      try {
        await refetch();
        setLastRefreshTime(new Date());
      } catch (e) {
        console.error("Auto-refresh failed:", e);
      }
    }, 10000);
    return () => clearInterval(interval);
  }, [autoRefreshEnabled, zoomId, refetch]);

  const handleRefresh = async () => {
    try {
      setIsRefreshing(true);
      await refetch();
      setLastRefreshTime(new Date());
    } finally {
      setIsRefreshing(false);
    }
  };

  const reportData = useMemo(() => {
    if (!data) return null;
    return {
      messages: data.wabaMessages,
      pagination: {
        page: data.page,
        limit: data.limit,
        totalCount: data.total,
        totalPages: data.totalPages,
        hasNextPage: data.page < data.totalPages,
        hasPrevPage: data.page > 1,
      },
    };
  }, [data]);

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin mr-2" /> Loading messages...
      </div>
    );
  }

  if (error) {
    return (
      <Alert>
        <AlertDescription>Failed to load meeting messages.</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="mb-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                navigate(-1);
              }}
              className="flex items-center gap-2"
            >
              Back
            </Button>
          </div>
          <h1 className="text-2xl font-bold">Message History</h1>
          <p className="text-muted-foreground">
            {isWebinar ? "Webinar" : "Meeting"}: {zoomId}
          </p>
          {lastRefreshTime && (
            <p className="text-xs text-muted-foreground mt-1">
              Last updated: {lastRefreshTime.toLocaleTimeString()}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={handleRefresh}
            variant="outline"
            size="sm"
            disabled={isRefreshing || isFetching}
            className="flex items-center gap-2"
          >
            <RefreshCw
              className={`h-4 w-4 ${
                isRefreshing || isFetching ? "animate-spin" : ""
              }`}
            />
            <span className="hidden sm:inline">
              {isRefreshing || isFetching ? "Refreshing..." : "Refresh"}
            </span>
          </Button>
          <Button
            onClick={() => setAutoRefreshEnabled(!autoRefreshEnabled)}
            variant={autoRefreshEnabled ? "default" : "outline"}
            size="sm"
            className="flex items-center gap-2 w-32"
          >
            <RefreshCw className="h-4 w-4" />
            <span className="hidden sm:inline">
              {autoRefreshEnabled ? "Disable Auto" : "Enable Auto"}
            </span>
          </Button>
          {/* <Button onClick={handleDownloadReport} variant="outline" size="sm" className="flex items-center gap-2">
            <FileText className="h-4 w-4" /> Download CSV
          </Button> */}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Messages</CardTitle>
        </CardHeader>
        <CardContent>
          {!reportData || reportData.messages.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No messages found.
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
                  {reportData.messages.map((m: any) => (
                    <TableRow key={m._id}>
                      <TableCell className="font-medium">
                        {m.phoneNumber}
                      </TableCell>
                      <TableCell className="font-medium">
                        {m.templateName}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            m.status === "delivered" || m.status === "read"
                              ? "default"
                              : m.status === "sent"
                              ? "secondary"
                              : m.status === "failed"
                              ? "destructive"
                              : "outline"
                          }
                          className={
                            m.status === "delivered"
                              ? "bg-green-500"
                              : m.status === "read"
                              ? "bg-blue-500"
                              : m.status === "sent"
                              ? "bg-yellow-500"
                              : ""
                          }
                        >
                          {String(m.status || "").toUpperCase()}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{m.messageType}</Badge>
                      </TableCell>
                      <TableCell>
                        {m.createdAt
                          ? new Date(m.createdAt).toLocaleString()
                          : "-"}
                      </TableCell>
                      <TableCell>
                        {m.sentAt ? new Date(m.sentAt).toLocaleString() : "-"}
                      </TableCell>
                      <TableCell>
                        {m.deliveredAt
                          ? new Date(m.deliveredAt).toLocaleString()
                          : "-"}
                      </TableCell>
                      <TableCell>
                        {m.readAt ? new Date(m.readAt).toLocaleString() : "-"}
                      </TableCell>
                      <TableCell className="text-red-600">
                        {m.failureReason || "-"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {reportData && reportData.pagination.totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-4">
              <Button
                variant="outline"
                size="sm"
                disabled={!reportData.pagination.hasPrevPage}
                onClick={() =>
                  reportData.pagination.hasPrevPage && setPage(page - 1)
                }
              >
                Previous
              </Button>
              <span className="text-sm">
                Page {page} of {reportData.pagination.totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={!reportData.pagination.hasNextPage}
                onClick={() =>
                  reportData.pagination.hasNextPage && setPage(page + 1)
                }
              >
                Next
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
