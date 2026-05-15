import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { Separator } from "@zoom/components/ui/separator";
import { Alert, AlertDescription } from "@zoom/components/ui/alert";
import { Button } from "@zoom/components/ui/button";
import { Settings, History, RefreshCw } from "lucide-react";
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
import { useDebounce } from "@zoom/lib/utils";

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
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Meeting Details</h1>
        <p className="text-muted-foreground">
          View meeting information and registrations
        </p>
      </div>

      <Separator />

      <MeetingHeader
        details={details}
        meetingState={'coming soon'}
        isStatusLoading={false}
        statusError={null}
      />

      {meetingId && (
        <WebinarDropdown
          currentMeetingId={meetingId}
          currentOccurrenceId={occurenceId || undefined}
          onWebinarChange={handleWebinarChange}
          onSave={handleWebinarSave}
        />
      )}

      {/* Meeting Event Configuration Button */}
      {/* {false && ( */}

      {meetingId && (
        <div className="flex justify-end gap-2">
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
            className="flex items-center gap-2"
            disabled={syncMeetingMutation.isPending}
          >
            <RefreshCw className={`h-4 w-4 ${syncMeetingMutation.isPending ? 'animate-spin' : ''}`} />
            {syncMeetingMutation.isPending ? 'Syncing...' : 'Sync Meeting'}
          </Button>
          <Button
            onClick={() =>
              navigate(
                `/zoom/dashboard/${projectId}/meetings/${meetingId}/event-config${occurenceId ? `?occurrenceId=${occurenceId}` : ''}`
              )
            }
            variant="outline"
            className="flex items-center gap-2"
          >
            <Settings className="h-4 w-4" />
            Configure Meeting Events
          </Button>
          <Button
            onClick={() =>
              navigate(`/zoom/dashboard/${projectId}/meetings/${meetingId}/messages${occurenceId ? `?occurrenceId=${occurenceId}` : ''}`)
            }
            variant="outline"
            className="flex items-center gap-2"
          >
            <History className="h-4 w-4" />
            Message History
          </Button>
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="registrations">Registrations</TabsTrigger>
          <TabsTrigger value="live">Live Data</TabsTrigger>
        </TabsList>
        <TabsContent value="registrations" className="mt-4">
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
              setPage(1); // Reset to first page when page size changes
            }}
          />
        </TabsContent>
        <TabsContent value="live" className="mt-4">
          <LiveDataTab
            meetingId={meetingId}
            zoomProjectId={projectId}
            occurrenceId={occurenceId}
            isWebinar={false}
          />
        </TabsContent>
      </Tabs>

      <ConfirmationDialog
        open={showConfirmationDialog}
        onOpenChange={setShowConfirmationDialog}
        title="Confirm Webinar Association"
        description="Are you sure you want to save this webinar association? This action will update the webinar's meeting ID."
        onConfirm={handleConfirmSave}
        confirmText="Save Association"
        cancelText="Cancel"
        isLoading={
          updateWebinarMutation.isPending || removeWebinarMutation.isPending
        }
      />
    </div>
  );
}
