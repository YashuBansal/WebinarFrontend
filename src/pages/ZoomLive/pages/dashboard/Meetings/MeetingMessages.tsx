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
import { Loader2, RefreshCw, History, MessageSquare, ArrowLeft, Clock } from "lucide-react";
import { useMeetingMessages } from "@zoom/hooks/useZoom";
import { motion } from "framer-motion";
import { cn } from "@zoom/lib/utils";

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
    <div className="min-h-full w-full min-w-0 max-w-full box-border p-2 transition-colors duration-500 sm:p-2 md:p-0 lg:p-0 xl:p-2 2xl:p-4">
      {/* Premium Header */}
      <motion.div
        className="mb-6 rounded-2xl border border-slate-200/60 p-4 sm:p-5 bg-white dark:bg-slate-800/50 shadow-sm dark:border-slate-700/50"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(-1)}
              className="h-10 w-10 rounded-xl border border-slate-200 dark:border-slate-700/30 flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-all shadow-sm"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 font-bold text-xs uppercase tracking-widest mb-1">
                <History className="h-3.5 w-3.5" />
                Communication Logs
              </div>
              <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-2xl">
                Message History
              </h1>
              <p className="text-slate-500 dark:text-slate-400 text-xs font-medium">
                Tracking all WhatsApp notifications for {isWebinar ? "Webinar" : "Meeting"} <span className="text-slate-900 dark:text-white font-bold">{zoomId}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="h-11 p-1 bg-slate-100 dark:bg-slate-900/50 rounded-xl flex items-center gap-1 border border-slate-200 dark:border-slate-800">
              <Button
                onClick={handleRefresh}
                variant="ghost"
                className="h-9 px-4 rounded-lg font-bold text-xs hover:bg-white dark:hover:bg-slate-800 shadow-none transition-all"
                disabled={isRefreshing || isFetching}
              >
                <RefreshCw className={cn("h-3.5 w-3.5 mr-2", (isRefreshing || isFetching) && "animate-spin")} />
                Refresh
              </Button>
              <div className="w-[1px] h-4 bg-slate-200 dark:bg-slate-700 mx-1" />
              <Button
                onClick={() => setAutoRefreshEnabled(!autoRefreshEnabled)}
                variant="ghost"
                className={cn(
                  "h-9 px-4 rounded-lg font-bold text-xs transition-all",
                  autoRefreshEnabled ? "text-blue-600 bg-blue-50 dark:bg-blue-500/10" : "hover:bg-white dark:hover:bg-slate-800"
                )}
              >
                <motion.div
                  animate={autoRefreshEnabled ? { rotate: 360 } : { rotate: 0 }}
                  transition={autoRefreshEnabled ? { repeat: Infinity, duration: 4, ease: "linear" } : { duration: 0.5 }}
                >
                  <Clock className="h-4 w-4" />
                </motion.div>
                {autoRefreshEnabled ? "Live" : "Manual"}
              </Button>
            </div>
          </div>
        </div>
      </motion.div>

      <main className="container mx-auto space-y-6 pb-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 rounded-[32px] overflow-hidden shadow-sm"
        >
          <div className="p-6 border-b border-slate-100 dark:border-slate-800/50 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center text-blue-600 dark:text-blue-400">
                <MessageSquare className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">Delivery Status</h3>
            </div>
            {lastRefreshTime && (
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                Sync: {lastRefreshTime.toLocaleTimeString()}
              </span>
            )}
          </div>

          <div className="overflow-x-auto">
            {!reportData || reportData.messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 text-center">
                <div className="h-16 w-16 rounded-3xl bg-slate-50 dark:bg-slate-900/50 flex items-center justify-center text-slate-300 mb-4">
                  <MessageSquare className="h-8 w-8" />
                </div>
                <h4 className="text-lg font-bold text-slate-900 dark:text-white">No messages sent yet</h4>
                <p className="text-slate-500 text-sm max-w-xs mt-1">
                  Messages will appear here once triggers are activated and notifications are delivered.
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader className="bg-slate-50/50 dark:bg-slate-900/50">
                  <TableRow className="border-slate-100 dark:border-slate-800 hover:bg-transparent">
                    <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400 py-4">Recipient</TableHead>
                    <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400 py-4">Template</TableHead>
                    <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400 py-4 text-center">Status</TableHead>
                    <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400 py-4">Timeline</TableHead>
                    <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400 py-4 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reportData.messages.map((m: any, index: number) => (
                    <motion.tr
                      key={m._id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.03 }}
                      className="border-slate-100 dark:border-slate-800 hover:bg-slate-50/30 dark:hover:bg-slate-900/30 transition-colors"
                    >
                      <TableCell className="py-4">
                        <div className="flex flex-col">
                          <span className="font-bold text-sm text-slate-900 dark:text-white">{m.phoneNumber}</span>
                          <span className="text-[10px] font-medium text-slate-500">{m.messageType}</span>
                        </div>
                      </TableCell>
                      <TableCell className="py-4">
                        <span className="font-bold text-xs text-slate-700 dark:text-slate-300">{m.templateName}</span>
                      </TableCell>
                      <TableCell className="py-4">
                        <div className="flex justify-center">
                          <Badge
                            className={cn(
                              "px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-tight shadow-sm",
                              m.status === "delivered" || m.status === "read"
                                ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 border border-emerald-200/50 dark:border-emerald-500/20"
                                : m.status === "sent"
                                  ? "bg-amber-50 text-amber-600 dark:bg-amber-500/10 border border-amber-200/50 dark:border-amber-500/20"
                                  : m.status === "failed"
                                    ? "bg-rose-50 text-rose-600 dark:bg-rose-500/10 border border-rose-200/50 dark:border-rose-500/20"
                                    : "bg-slate-50 text-slate-600 dark:bg-slate-700/50 border border-slate-200/50 dark:border-slate-700/20"
                            )}
                          >
                            {m.status || "pending"}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell className="py-4">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2">
                            <div className="h-1 w-1 rounded-full bg-blue-500" />
                            <span className="text-[10px] font-medium text-slate-500">Created: {new Date(m.createdAt).toLocaleString()}</span>
                          </div>
                          {m.sentAt && (
                            <div className="flex items-center gap-2">
                              <div className="h-1 w-1 rounded-full bg-emerald-500" />
                              <span className="text-[10px] font-medium text-slate-500">Sent: {new Date(m.sentAt).toLocaleString()}</span>
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="py-4 text-right">
                        {m.failureReason && (
                          <span className="text-[10px] font-bold text-rose-500 bg-rose-50 dark:bg-rose-500/10 px-2 py-1 rounded-md border border-rose-100 dark:border-rose-500/20">
                            Error: {m.failureReason}
                          </span>
                        )}
                        {!m.failureReason && <span className="text-slate-300 dark:text-slate-700">—</span>}
                      </TableCell>
                    </motion.tr>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>

          {reportData && reportData.pagination.totalPages > 1 && (
            <div className="p-6 border-t border-slate-100 dark:border-slate-800 flex items-center justify-center gap-4 bg-slate-50/20 dark:bg-slate-900/10">
              <Button
                variant="outline"
                size="sm"
                disabled={!reportData.pagination.hasPrevPage}
                onClick={() => setPage(page - 1)}
                className="rounded-xl font-bold text-xs h-9 px-4 border-slate-200 dark:border-slate-700"
              >
                Previous
              </Button>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black text-slate-900 dark:text-white px-3 py-1 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm">
                  {page}
                </span>
                <span className="text-xs font-bold text-slate-400">of {reportData.pagination.totalPages}</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                disabled={!reportData.pagination.hasNextPage}
                onClick={() => setPage(page + 1)}
                className="rounded-xl font-bold text-xs h-9 px-4 border-slate-200 dark:border-slate-700"
              >
                Next
              </Button>
            </div>
          )}
        </motion.div>
      </main>
    </div>
  );
}
