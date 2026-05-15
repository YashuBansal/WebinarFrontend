import { useEffect, useMemo, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@zoom/components/ui/card";
import { Button } from "@zoom/components/ui/button";
import { Badge } from "@zoom/components/ui/badge";
// import { Separator } from '@zoom/components/ui/separator'
import { Alert, AlertDescription } from "@zoom/components/ui/alert";
import {
  Video,
  Calendar,
  Clock,
  AlertCircle,
  ExternalLink,
  Search,
} from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { meetingsKeys, useProjectMeetings } from "@zoom/hooks/useZoom";
import { getQueryErrorMessage } from "@zoom/lib/apiErrors";
import { socketManager } from "@zoom/lib/socket";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@zoom/lib/utils";
import { Skeleton } from "@mui/material";

const Meetings = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Filters
  const [type, setType] = useState<"upcoming" | "live">("upcoming");
  const [fromDate, setFromDate] = useState<string>("");
  const [toDate, setToDate] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState<string>("");

  const toIsoStart = (d: string) =>
    d ? new Date(d + "T00:00:00Z").toISOString() : undefined;
  const toIsoEnd = (d: string) =>
    d ? new Date(d + "T23:59:59.999Z").toISOString() : undefined;

  // Ensure date range only fetches current and future meetings
  const formatLocalDate = (d: Date) => {
    const yr = d.getFullYear();
    const mo = String(d.getMonth() + 1).padStart(2, "0");
    const da = String(d.getDate()).padStart(2, "0");
    return `${yr}-${mo}-${da}`;
  };
  const todayStr = formatLocalDate(new Date());
  const clampFrom = fromDate && fromDate < todayStr ? todayStr : fromDate;
  const clampTo = toDate && toDate < todayStr ? todayStr : toDate;

  const { data, isLoading, error } = useProjectMeetings(projectId, {
    type,
    pageSize: 30,
    from: toIsoStart(clampFrom),
    to: toIsoEnd(clampTo),
  });
  const meetings = data?.meetings ?? [];

  useEffect(() => {
    const socket = socketManager.getSocket();
    if (!socket || !projectId) {
      return;
    }

    const handleZoomUpdate = (payload: {
      resource?: string;
      projectId?: string;
    }) => {
      if (payload.resource !== "meetings" || payload.projectId !== projectId) {
        return;
      }
      queryClient.invalidateQueries({ queryKey: meetingsKeys.all });
    };

    socket.on("zoom-update", handleZoomUpdate);
    return () => {
      socket.off("zoom-update", handleZoomUpdate);
    };
  }, [projectId, queryClient]);

  const sortedMeetings = useMemo(() => {
    const copy = [...meetings];
    copy.sort((a, b) => {
      const aTime = new Date(
        (a.startTime as any) || (a.createdAt as any) || 0
      ).getTime();
      const bTime = new Date(
        (b.startTime as any) || (b.createdAt as any) || 0
      ).getTime();
      return bTime - aTime;
    });
    return copy;
  }, [meetings]);

  // Create meeting removed (not functional)

  const getStatusColor = (status: string) => {
    switch (status) {
      case "scheduled":
        return "default";
      case "in-progress":
        return "secondary";
      case "completed":
        return "outline";
      default:
        return "secondary";
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // const totalMeetings = useMemo(() => meetings.length, [meetings])

  return (
    <div className="min-h-full w-full min-w-0 max-w-full box-border p-2 transition-colors duration-500 sm:p-2 md:p-0 lg:p-0 xl:p-2 2xl:p-4">
      {/* Premium Header */}
      <motion.div
        className="mb-6 rounded-2xl border border-slate-200/60 p-4 sm:p-5 bg-white dark:bg-slate-800/50 shadow-sm dark:border-slate-700/50"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 font-bold text-xs uppercase tracking-widest mb-1">
              <Video className="h-3.5 w-3.5" />
              Session Manager
            </div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-2xl">
              Zoom Meetings
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-xs font-medium">
              Browse and manage meetings for <span className="text-slate-900 dark:text-white font-bold">Zoom Workspace</span>
            </p>
          </div>

          <div className="flex items-center gap-2 bg-slate-100/50 dark:bg-slate-900/50 p-1 rounded-xl border border-slate-200/50 dark:border-slate-800/50">
            {(["upcoming", "live"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setType(t)}
                className={cn(
                  "px-4 py-2 rounded-lg text-xs font-bold transition-all uppercase tracking-widest",
                  type === t
                    ? "bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm border border-slate-200/50 dark:border-slate-700/50"
                    : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                )}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
      </motion.div>

      <main className="container mx-auto space-y-6 pb-12">
        {/* Filters Toolbar */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 rounded-2xl p-4 shadow-sm"
        >
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-4">
            <div className="relative flex-1 group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
              <input
                type="text"
                placeholder="Search by topic..."
                className="w-full h-11 bg-slate-50/50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 rounded-xl pl-10 pr-4 text-sm font-medium focus:ring-2 focus:ring-blue-500/20 transition-all outline-none"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">From</span>
                <input
                  type="date"
                  className="h-10 px-3 bg-slate-50/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 outline-none"
                  min={todayStr}
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">To</span>
                <input
                  type="date"
                  className="h-10 px-3 bg-slate-50/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 outline-none"
                  min={todayStr}
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                />
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setFromDate("");
                  setToDate("");
                  setSearchTerm("");
                }}
                className="h-10 rounded-xl text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 font-bold px-4"
              >
                Reset
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Meetings Grid */}
        {isLoading ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map(i => <Skeleton key={i} className="h-48 w-full rounded-[24px]" />)}
          </div>
        ) : error ? (
          <div className="py-20 flex flex-col items-center justify-center bg-white dark:bg-slate-800/50 rounded-[32px] border border-dashed border-red-200 dark:border-red-900/30">
            <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
            <p className="text-slate-900 dark:text-white font-bold">Failed to load meetings</p>
            <p className="text-slate-500 text-sm mt-1">{getQueryErrorMessage(error, "")}</p>
          </div>
        ) : sortedMeetings.length === 0 ? (
          <div className="py-32 flex flex-col items-center justify-center bg-white/50 dark:bg-slate-800/20 rounded-[40px] border-2 border-dashed border-slate-100 dark:border-slate-800">
            <div className="h-20 w-20 rounded-3xl bg-slate-100 dark:bg-slate-900/50 flex items-center justify-center mb-6">
              <Video className="h-10 w-10 text-slate-300" />
            </div>
            <h3 className="text-xl font-black text-slate-900 dark:text-white">No Meetings Found</h3>
            <p className="text-slate-500 text-sm mt-1">Try adjusting your filters or search term.</p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <AnimatePresence>
              {sortedMeetings
                .filter((m) =>
                  searchTerm
                    ? (m.topic || "").toLowerCase().includes(searchTerm.toLowerCase())
                    : true
                )
                .map((meeting, index) => (
                  <motion.div
                    key={`${meeting.id}-${index}`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="group relative flex flex-col bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 hover:border-blue-400/50 dark:hover:border-blue-500/50 hover:shadow-2xl hover:shadow-blue-900/5 dark:hover:shadow-blue-500/10 rounded-[24px] p-6 transition-all duration-300"
                  >
                    <div className="absolute top-0 right-0 -mr-12 -mt-12 h-24 w-24 rounded-full bg-blue-500/5 blur-2xl opacity-0 group-hover:opacity-100 transition-opacity" />

                    <div className="flex items-start justify-between mb-6 relative z-10">
                      <div className="h-12 w-12 rounded-2xl bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center text-blue-600 dark:text-blue-400 group-hover:bg-blue-600 group-hover:text-white transition-all duration-500">
                        <Video className="h-6 w-6" />
                      </div>
                      <Badge
                        variant={meeting.status === 'in-progress' ? 'default' : 'secondary'}
                        className={cn(
                          "px-2.5 py-0.5 rounded-lg font-black uppercase tracking-widest text-[9px]",
                          meeting.status === 'in-progress' ? "bg-green-500 text-white" : ""
                        )}
                      >
                        {meeting.status || "scheduled"}
                      </Badge>
                    </div>

                    <div className="mb-6 flex-1 relative z-10">
                      <h3 className="text-lg font-black text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-2 leading-snug mb-4">
                        {meeting.topic || "Untitled Meeting"}
                      </h3>

                      <div className="space-y-3">
                        <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400">
                          <Calendar className="h-4 w-4 text-slate-300" />
                          <span className="text-xs font-bold uppercase tracking-tight">
                            {meeting.startTime ? formatDate(new Date(meeting.startTime)) : "No date"}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400">
                          <Clock className="h-4 w-4 text-slate-300" />
                          <span className="text-xs font-bold uppercase tracking-tight">
                            {meeting.startTime ? formatTime(new Date(meeting.startTime)) : "—"} • {meeting.duration ?? 0} min
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-slate-100 dark:border-slate-800/50 flex items-center justify-between gap-3 relative z-10">
                      <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500 font-bold uppercase tracking-tighter">ID: {meeting.id}</span>
                      <div className="flex items-center gap-2">
                        {meeting.status === "scheduled" && meeting.joinUrl && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-9 rounded-xl border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 font-bold text-xs"
                            asChild
                          >
                            <a href={meeting.joinUrl} target="_blank" rel="noopener noreferrer">
                              Join
                            </a>
                          </Button>
                        )}
                        <Button
                          className="h-9 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-lg shadow-blue-600/10 px-4"
                          size="sm"
                          onClick={() =>
                            navigate(
                              `/zoom/dashboard/${projectId}/meetings/${encodeURIComponent(meeting.id)}?start-time=${encodeURIComponent(meeting.startTime || "")}`
                            )
                          }
                        >
                          Details
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                ))}
            </AnimatePresence>
          </div>
        )}
      </main>
    </div>
  );
};

export default Meetings;
