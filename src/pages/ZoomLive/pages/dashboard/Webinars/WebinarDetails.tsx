import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { Alert, AlertDescription } from "@zoom/components/ui/alert";
import { Button } from "@zoom/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@zoom/components/ui/tabs";
import { Settings, History, RefreshCw } from "lucide-react";
import {
  useWebinarDetails,
  useWebinarRegistrants,
  useUpdateWebinarMeetingId,
  useRemoveWebinarMeetingId,
  useWebinars,
  webinarsKeys,
  meetingStatusKeys,
  useSyncWebinarDetails,
} from "@zoom/hooks/useZoom";
import WebinarHeader from "./components/WebinarHeader";
import ConfirmationDialog from "@zoom/components/ui/ConfirmationDialog";
import WebinarDropdown from "../Meetings/components/WebinarDropdown";
import LiveDataTab from "../../../components/common/LiveDataTab";
import WebinarsRegistrationsTab from "./components/WebinarsRegistrationsTab";
import { socketManager } from "@zoom/lib/socket";
import { getQueryErrorMessage } from "@zoom/lib/apiErrors";
import { useQueryClient } from "@tanstack/react-query";
import { useDebounce } from "@zoom/lib/utils";

export default function WebinarDetails() {
  const { projectId, webinarId } = useParams<{
    projectId: string;
    webinarId: string;
  }>();
  const [searchParams] = useSearchParams();
  const startTime = searchParams.get('start-time');
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("registrations");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(30);
  const queryClient = useQueryClient();

  const {
    data: details,
    isLoading,
    error,
  } = useWebinarDetails(projectId, webinarId);

  const occurenceId = useMemo(() => {
    if(Array.isArray(details?.occurrences) && details?.occurrences.length > 0) {
      const occurrence = details.occurrences.find((occurrence: any) => occurrence.start_time === startTime);
      return occurrence?.occurrence_id;
    }
    return null;
  }, [details, startTime]);
  const {
    data: registrantsData,
    isLoading: isRegLoading,
    error: regError,
  } = useWebinarRegistrants(projectId, webinarId, "approved", page, pageSize, occurenceId || undefined);

  // Debounced refresh functions to prevent excessive API calls
  const debouncedRefreshRegistrants = useDebounce(() => {
    console.log("Refreshing webinar registrants due to socket update (debounced)");
    queryClient.invalidateQueries({
      queryKey: [
        ...webinarsKeys.all,
        "registrants",
        projectId,
        webinarId,
      ],
    });
  }, 800); // 800ms debounce delay

  const debouncedRefreshLiveData = useDebounce(() => {
    console.log("Refreshing webinar live data due to socket update (debounced)");
    queryClient.invalidateQueries({
      queryKey: meetingStatusKeys.detail(webinarId || "", projectId, true, occurenceId),
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
      // Only refresh if this update is for the current webinar
      if (
        payload.type === "webinar" &&
        payload.meetingId === webinarId &&
        payload.projectId === projectId
      ) {
        debouncedRefreshRegistrants();
      }
    };

    socket.on("zoom-registrants-update", handleRegistrantsUpdate);

    return () => {
      socket.off("zoom-registrants-update", handleRegistrantsUpdate);
    };
  }, [webinarId, projectId, debouncedRefreshRegistrants]);

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
        payload.isWebinar &&
        payload.meetingId === webinarId &&
        payload.projectId === projectId
      ) {
        debouncedRefreshLiveData();
      }
    };

    socket.on("zoom-live-update", handleLiveUpdate);

    return () => {
      socket.off("zoom-live-update", handleLiveUpdate);
    };
  }, [webinarId, projectId, debouncedRefreshLiveData]);


  // Association state & mutations (reuse meeting UX)
  const [showConfirmationDialog, setShowConfirmationDialog] = useState(false);
  const [pendingWebinarId, setPendingWebinarId] = useState<string>("");

  const updateWebinarMutation = useUpdateWebinarMeetingId();
  const removeWebinarMutation = useRemoveWebinarMeetingId();
  const { data: webinars } = useWebinars();
  const syncWebinarMutation = useSyncWebinarDetails();

  const handleWebinarSave = (selectedWebinarId: string) => {
    setPendingWebinarId(selectedWebinarId);
    setShowConfirmationDialog(true);
  };

  const handleConfirmSave = async () => {
    try {
      if (!webinarId) return;
      if (pendingWebinarId === "") {
        // Remove association: find current internal webinar that holds this Zoom webinar id in meetingId
        // When occurrenceId exists, match by both meetingId and occurrenceId
        const current = occurenceId
          ? webinars?.find((w: any) => w.meetingId === webinarId && w.occurrenceId === occurenceId)
          : webinars?.find((w: any) => w.meetingId === webinarId);
        if (current) {
          await removeWebinarMutation.mutateAsync(current._id);
        }
      } else {
        // Associate selected internal webinar with this Zoom webinar id and occurrenceId (if available)
        await updateWebinarMutation.mutateAsync({
          webinarId: pendingWebinarId,
          meetingId: webinarId,
          occurrenceId: occurenceId || undefined,
        });
      }
    } catch (e) {
      console.error("Failed to save webinar association:", e);
    } finally {
      setShowConfirmationDialog(false);
      setPendingWebinarId("");
    }
  };

  if (isLoading) {
    return <div className="p-6">Loading webinar details...</div>;
  }

  if (error) {
    return (
      <Alert>
        <AlertDescription className="whitespace-pre-wrap">
          {getQueryErrorMessage(error, "Failed to load webinar details.")}
        </AlertDescription>
      </Alert>
    );
  }

  if (!details) {
    return (
      <Alert>
        <AlertDescription>Webinar details not found.</AlertDescription>
      </Alert>
    );
  }

  const registrants =
    registrantsData?.registrants ?? registrantsData?.participants ?? [];
  const totalRegistrations =
    registrantsData?.pagination?.totalRecords ?? registrants?.length ?? 0;
  return (
    <div className="space-y-6">
      <WebinarHeader
        details={details}
        isStatusLoading={false}
        statusError={null}
      />

      {webinarId && (
        <WebinarDropdown
          currentMeetingId={webinarId}
          currentOccurrenceId={occurenceId || undefined}
          onWebinarChange={() => {}}
          onSave={handleWebinarSave}
        />
      )}

      {/* Webinar Event Configuration Button */}
      {webinarId && (
        <div className="flex justify-end gap-2">
          <Button
            onClick={async () => {
              try {
                await syncWebinarMutation.mutateAsync({
                  projectId: projectId!,
                  webinarId: webinarId!,
                });
              } catch (error) {
                console.error("Failed to sync webinar:", error);
              }
            }}
            variant="outline"
            className="flex items-center gap-2"
            disabled={syncWebinarMutation.isPending}
          >
            <RefreshCw className={`h-4 w-4 ${syncWebinarMutation.isPending ? 'animate-spin' : ''}`} />
            {syncWebinarMutation.isPending ? 'Syncing...' : 'Sync Webinar'}
          </Button>
          <Button
            onClick={() =>
              navigate(
                `/zoom/dashboard/${projectId}/webinars/${webinarId}/event-config${occurenceId ? `?occurrenceId=${occurenceId}` : ''}`
              )
            }
            variant="outline"
            className="flex items-center gap-2"
          >
            <Settings className="h-4 w-4" />
            Configure Webinar Events
          </Button>
          <Button
            onClick={() =>
              navigate(`/zoom/dashboard/${projectId}/webinars/${webinarId}/messages${occurenceId ? `?occurrenceId=${occurenceId}` : ''}`)
            }
            variant="outline"
            className="flex items-center gap-2"
          >
            <History className="h-4 w-4" />
            Webinar Message History
          </Button>
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="registrations">Registrations</TabsTrigger>
          <TabsTrigger value="live">Live Data</TabsTrigger>
        </TabsList>
        <TabsContent value="registrations" className="mt-4">
          <WebinarsRegistrationsTab
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
            meetingId={webinarId}
            zoomProjectId={projectId}
            occurrenceId={occurenceId}
            isWebinar={true}
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
