import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { Separator } from "@zoom/components/ui/separator";
import { Alert, AlertDescription } from "@zoom/components/ui/alert";
import { Button } from "@zoom/components/ui/button";
import { Settings, History, RefreshCw, Video } from "lucide-react";
import {
  useMeetingDetails,
  useMeetingRegistrants,
  useUpdateWebinarMeetingId,
  useRemoveWebinarMeetingId,
  useWebinars,
  meetingsKeys,
  meetingStatusKeys,
  useSyncMeetingDetails,
} from "@zoom/hooks/useZoom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@zoom/components/ui/tabs";
import ConfirmationDialog from "@zoom/components/ui/ConfirmationDialog";
import MeetingHeader from "./components/MeetingHeader";
import RegistrationsTab from "./components/RegistrationsTab";
import LiveDataTab from "../../../components/common/LiveDataTab";
import WebinarDropdown from "./components/WebinarDropdown";
import { socketManager } from "@zoom/lib/socket";
import { getQueryErrorMessage } from "@zoom/lib/apiErrors";
import { useQueryClient } from "@tanstack/react-query";
import { cn, useDebounce } from "@zoom/lib/utils";
import { motion } from "framer-motion";

export default function MeetingDetails() {
  const { projectId, meetingId } = useParams<{
    projectId: string;
    meetingId: string;
  }>();
  const [searchParams] = useSearchParams();
  const startTime = searchParams.get("start-time");
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("registrations");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(30);
  const queryClient = useQueryClient();

  const {
    data: details,
    isLoading,
    error,
  } = useMeetingDetails(projectId, meetingId);

  const occurenceId = useMemo(() => {
    if (
      Array.isArray(details?.occurrences) &&
      details?.occurrences.length > 0
    ) {
      const occurrence = details?.occurrences.find(
        (occurrence: any) => occurrence.start_time === startTime
      );
      return occurrence?.occurrence_id;
    }
    return null;
  }, [details, startTime]);

  const {
    data: registrantsData,
    isLoading: isRegLoading,
    error: regError,
  } = useMeetingRegistrants(projectId, meetingId, "approved", page, pageSize, occurenceId || undefined);

  // Debounced refresh functions to prevent excessive API calls
  const debouncedRefreshRegistrants = useDebounce(() => {
    console.log(
      "Refreshing meeting registrants due to socket update (debounced)"
    );
    queryClient.invalidateQueries({
      queryKey: [...meetingsKeys.all, "registrants", projectId, meetingId],
    });
  }, 800); // 800ms debounce delay

  const debouncedRefreshLiveData = useDebounce(() => {
    console.log(
      "Refreshing meeting live data due to socket update (debounced)"
    );
    queryClient.invalidateQueries({
      queryKey: meetingStatusKeys.detail(
        meetingId || "",
        projectId,
        false,
        occurenceId
      ),
    });
  }, 800); // 800ms debounce delay

  // Listen for registrants updates via socket
  useEffect(() => {
    const socket = socketManager.getSocket();
    if (!socket) return;

    const handleRegistrantsUpdate = (payload: {
      projectId: string;
      meetingId: string;
      type: "meeting" | "webinar";
      timestamp?: string;
    }) => {
      // Only refresh if this update is for the current meeting
      if (
        payload.type === "meeting" &&
        payload.meetingId === meetingId &&
        payload.projectId === projectId
      ) {
        debouncedRefreshRegistrants();
      }
    };

    socket.on("zoom-registrants-update", handleRegistrantsUpdate);

    return () => {
      socket.off("zoom-registrants-update", handleRegistrantsUpdate);
    };
  }, [meetingId, projectId, debouncedRefreshRegistrants]);

  // Listen for live data updates via socket
  useEffect(() => {
    const socket = socketManager.getSocket();
    if (!socket) return;

    const handleLiveUpdate = (payload: {
      projectId: string;
      meetingId: string;
      isWebinar: boolean;
      timestamp?: string;
    }) => {
      if (
        !payload.isWebinar &&
        payload.meetingId === meetingId &&
        payload.projectId === projectId
      ) {
        debouncedRefreshLiveData();
      }
    };

    socket.on("zoom-live-update", handleLiveUpdate);

    return () => {
      socket.off("zoom-live-update", handleLiveUpdate);
    };
  }, [meetingId, projectId, debouncedRefreshLiveData]);

  const [showConfirmationDialog, setShowConfirmationDialog] = useState(false);
  const [pendingWebinarId, setPendingWebinarId] = useState<string>("");

  const updateWebinarMutation = useUpdateWebinarMeetingId();
  const removeWebinarMutation = useRemoveWebinarMeetingId();
  const { data: webinars } = useWebinars();
  const syncMeetingMutation = useSyncMeetingDetails();

  const handleWebinarSave = (webinarId: string) => {
    setPendingWebinarId(webinarId);
    setShowConfirmationDialog(true);
  };

  const handleConfirmSave = async () => {
    try {
      if (pendingWebinarId === "") {
        // Remove webinar association
        // Find current webinar and remove meetingId
        // When occurrenceId exists, match by both meetingId and occurrenceId
        const currentWebinar = occurenceId
          ? webinars?.find(
            (w: any) =>
              w.meetingId === meetingId && w.occurrenceId === occurenceId
          )
          : webinars?.find((w: any) => w.meetingId === meetingId);
        if (currentWebinar) {
          await removeWebinarMutation.mutateAsync(currentWebinar._id);
        }
      } else {
        // Update webinar with meetingId and occurrenceId (if available)
        await updateWebinarMutation.mutateAsync({
          webinarId: pendingWebinarId,
          meetingId: meetingId!,
          occurrenceId: occurenceId || undefined,
        });
      }

      setShowConfirmationDialog(false);
      setPendingWebinarId("");
    } catch (error) {
      console.error("Failed to save webinar association:", error);
    }
  };

  const handleWebinarChange = (_webinar: any) => {
    // This callback is used by WebinarDropdown to notify of selection changes
    // The actual saving is handled by the onSave callback
  };

  if (isLoading) {
    return <div className="p-6">Loading meeting details...</div>;
  }

  if (error) {
    return (
      <Alert>
        <AlertDescription className="whitespace-pre-wrap">
          {getQueryErrorMessage(error, "Failed to load meeting details.")}
        </AlertDescription>
      </Alert>
    );
  }

  if (!details) {
    return (
      <Alert>
        <AlertDescription>Meeting details not found.</AlertDescription>
      </Alert>
    );
  }

  const registrants =
    registrantsData?.registrants ?? registrantsData?.participants ?? [];
  const totalRegistrations =
    registrantsData?.pagination?.totalRecords ?? registrants.length;

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
              Meeting Insights
            </div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-2xl">
              Meeting Details
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-xs font-medium">
              View comprehensive details and manage registrations for your meeting
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              onClick={() => navigate(-1)}
              variant="outline"
              className="h-11 px-6 rounded-xl font-bold text-xs border-slate-200 dark:border-slate-700"
            >
              Go Back
            </Button>
          </div>
        </div>
      </motion.div>

      <main className="container mx-auto space-y-6 pb-12">
        {/* Main Info Section */}
        <MeetingHeader
          details={details}
          meetingState={'coming soon'}
          isStatusLoading={false}
          statusError={null}
        />

        {/* Association & Actions Card */}
        <div className="grid gap-6 md:grid-cols-3 items-start">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="md:col-span-2 bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 rounded-[24px] p-6 shadow-sm"
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center text-blue-600 dark:text-blue-400">
                  <Settings className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white">Workspace Association</h3>
              </div>
            </div>

            {meetingId && (
              <WebinarDropdown
                currentMeetingId={meetingId}
                currentOccurrenceId={occurenceId || undefined}
                onWebinarChange={handleWebinarChange}
                onSave={handleWebinarSave}
              />
            )}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-4"
          >
            <div className="bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 rounded-[24px] p-6 shadow-sm">
              <h3 className="text-sm font-black uppercase tracking-widest text-slate-400 mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <Button
                  onClick={async () => {
                    try {
                      await syncMeetingMutation.mutateAsync({
                        projectId: projectId!,
                        meetingId: meetingId!,
                      });
                    } catch (error) {
                      console.error("Failed to sync meeting:", error);
                    }
                  }}
                  variant="outline"
                  className="w-full h-11 rounded-xl flex items-center justify-start gap-3 border-slate-200 dark:border-slate-700 font-bold text-xs"
                  disabled={syncMeetingMutation.isPending}
                >
                  <RefreshCw className={cn("h-4 w-4", syncMeetingMutation.isPending && "animate-spin")} />
                  {syncMeetingMutation.isPending ? 'Syncing Data...' : 'Sync with Zoom'}
                </Button>

                <Button
                  onClick={() =>
                    navigate(
                      `/zoom/dashboard/${projectId}/meetings/${meetingId}/event-config${occurenceId ? `?occurrenceId=${occurenceId}` : ''}`
                    )
                  }
                  variant="outline"
                  className="w-full h-11 rounded-xl flex items-center justify-start gap-3 border-slate-200 dark:border-slate-700 font-bold text-xs"
                >
                  <Settings className="h-4 w-4" />
                  Event Configuration
                </Button>

                <Button
                  onClick={() =>
                    navigate(`/zoom/dashboard/${projectId}/meetings/${meetingId}/messages${occurenceId ? `?occurrenceId=${occurenceId}` : ''}`)
                  }
                  variant="outline"
                  className="w-full h-11 rounded-xl flex items-center justify-start gap-3 border-slate-200 dark:border-slate-700 font-bold text-xs"
                >
                  <History className="h-4 w-4" />
                  Message History
                </Button>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Content Tabs */}
        <div className="bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 rounded-[32px] p-2 overflow-hidden shadow-sm">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="px-4 pt-4 mb-6">
              <TabsList className="bg-slate-100/50 dark:bg-slate-900/50 p-1.5 rounded-2xl border border-slate-200/50 dark:border-slate-800/50 h-auto gap-1">
                <TabsTrigger
                  value="registrations"
                  className="px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:text-blue-600 dark:data-[state=active]:text-blue-400 data-[state=active]:shadow-sm transition-all"
                >
                  Registrations
                </TabsTrigger>
                <TabsTrigger
                  value="live"
                  className="px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:text-blue-600 dark:data-[state=active]:text-blue-400 data-[state=active]:shadow-sm transition-all"
                >
                  Live Data
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="registrations" className="m-0 focus-visible:outline-none">
              <RegistrationsTab
                registrants={registrants}
                totalRegistrations={totalRegistrations}
                isRegLoading={isRegLoading}
                regError={regError}
                pagination={registrantsData?.pagination}
                page={page}
                pageSize={pageSize}
                onPageChange={setPage}
                onPageSizeChange={(newPageSize) => {
                  setPageSize(newPageSize);
                  setPage(1);
                }}
              />
            </TabsContent>

            <TabsContent value="live" className="m-0 focus-visible:outline-none">
              <LiveDataTab
                meetingId={meetingId}
                zoomProjectId={projectId}
                occurrenceId={occurenceId}
                isWebinar={false}
              />
            </TabsContent>
          </Tabs>
        </div>
      </main>

      <ConfirmationDialog
        open={showConfirmationDialog}
        onOpenChange={setShowConfirmationDialog}
        title="Confirm Association"
        description="Are you sure you want to associate this meeting with the selected workspace webinar?"
        onConfirm={handleConfirmSave}
        confirmText="Confirm Save"
        cancelText="Cancel"
        isLoading={updateWebinarMutation.isPending || removeWebinarMutation.isPending}
      />
    </div>
  );
}
