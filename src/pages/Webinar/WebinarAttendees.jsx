import {
  useEffect,
  useState,
  lazy,
  Suspense,
  useRef,
  useCallback,
} from "react";

const Pullbacks = lazy(() => import("./Pullbacks"));
const Enrollments = lazy(() => import("./Enrollments"));
const WebinarAttendeesPage = lazy(() => import("./WebinarAttendeesPage"));

import { Link, useParams, useSearchParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import Button from "@mui/material/Button";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";

import { createPortal } from "react-dom";
import { AttachFile, ContentCopy } from "@mui/icons-material";
import { getLeadType } from "../../features/actions/assign";
import {
  AssignmentStatus,
  copyToClipboard,
  NotifActionType,
} from "../../utils/extra";
import { getAllEmployees } from "../../features/actions/employee";
import useAddUserActivity from "../../hooks/useAddUserActivity";
const EmployeeAssignModal = lazy(() =>
  import("../Attendees/Modal/EmployeeAssignModal")
);
const ReAssignmentModal = lazy(() =>
  import("../../components/Webinar/ReAssignmentModal")
);
const UpdateCsvXslxModal = lazy(() => import("./modal/UpdateCsvXslxModal"));
import DataTableFallback from "../../components/Fallback/DataTableFallback";
import { fetchPullbackRequestCounts } from "../../features/actions/reAssign";
import { socket } from "../../socket";
import ModalFallback from "../../components/Fallback/ModalFallback";
import { globalButton } from "../../utils/style";
import { useMediaQuery, useTheme } from "@mui/material";
import AutoAssignmentModal from "./modal/AutoAssignmentModal";
import tagsService from "../../services/tagsService";
const WebinarWebhooksListDialog = lazy(() =>
  import("./modal/WebinarWebhooksListDialog")
);

const WebinarAttendees = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const logUserActivity = useAddUserActivity();

  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down("md"));

  const { enrollmentCounts } = useSelector((state) => state.attendee);
  const { userData } = useSelector((state) => state.auth);
  const { reAssignCounts } = useSelector((state) => state.reAssign);
  const [selectedRows, setSelectedRows] = useState([]);
  const [searchParams, setSearchParams] = useSearchParams();
  const [showModal, setShowModal] = useState(false);
  const [selectedAssignmentType, setSelectedAssignmentType] = useState("All");
  const [isSwapOpen, setSwapOpen] = useState(false);
  const [webinarData, setWebinarData] = useState(null);

  const [assignModal, setAssignModal] = useState(false);
  const [reAssignModal, setReAssignModal] = useState(false);
  const [page, setPage] = useState(Number(searchParams.get("page")) || 1);
  const tabValueRef = useRef(searchParams.get("tabValue") || "");
  const subTabValueRef = useRef(searchParams.get("subTabValue") || "attendees");

  const [settingModalOpen, setSettingModalOpen] = useState(false);
  const [webhookDialogOpen, setWebhookDialogOpen] = useState(false);
  const [applyTagsModalOpen, setApplyTagsModalOpen] = useState(false);

  useEffect(() => {
    // Get the current values from the URL
    const currentParams = Object.fromEntries([...searchParams.entries()]);

    // Define the new values from your component's state
    const newParams = {
      page: page,
      tabValue: tabValueRef.current,
      subTabValue: subTabValueRef.current,
    };

    // Check if an update is actually needed by comparing current vs. new
    let isDifferent = false;
    for (const key in newParams) {
      // Compare string representations to handle different types (number vs. string)
      // and normalize null/undefined to empty strings for a stable comparison.
      if (String(newParams[key] || "") !== String(currentParams[key] || "")) {
        isDifferent = true;
        break; // A difference was found, no need to check further
      }
    }

    // Only call setSearchParams if a value has actually changed
    if (isDifferent) {
      // Create a clean object for the URL, filtering out any empty values
      // to prevent params like `&subTabValueRef.current=` from appearing.
      const paramsToSet = {};
      for (const key in newParams) {
        if (newParams[key]) {
          paramsToSet[key] = newParams[key];
        }
      }

      // Use { replace: true } to avoid polluting browser history with tab/page changes
      setSearchParams(paramsToSet, { replace: true });
    }

    // The dependency array now correctly listens for changes to state variables.
  }, [
    page,
    tabValueRef.current,
    subTabValueRef.current,
    searchParams,
    setSearchParams,
  ]);

  const fetchWebinarData = useCallback(() => {
    tagsService.getWebinarById(id).then((res) => {
      if (res?.success) {
        setWebinarData(res.data);
      } else {
        setWebinarData(null);
      }
    });
  }, [id, tagsService]);

  useEffect(() => {
    dispatch(getLeadType());
    dispatch(getAllEmployees({}));
    fetchCounts();
    fetchWebinarData();
  }, []);

  function fetchCounts() {
    if (
      tabValueRef.current === "preWebinar" ||
      tabValueRef.current === "postWebinar"
    ) {
      dispatch(
        fetchPullbackRequestCounts({
          webinarId: id,
          status: "active",
          recordType: tabValueRef.current,
        })
      );
    }
  }

  useEffect(() => {
    function onNotification(data) {
      if (data.actionType === NotifActionType.REASSIGNMENT) {
        fetchCounts();
      }
    }
    socket.on("notification", onNotification);
    return () => {
      socket.off("notification", onNotification);
    };
  }, [tabValueRef.current, id]);

  // Tabs change handler
  const handleTabChange = (_, newValue) => {
    tabValueRef.current = newValue;
    setPage(1);
    setSelectedRows([]);
    fetchCounts();
    logUserActivity({
      action: "switch",
      type: "tab",
      detailItem: newValue,
    });
  };

  const handleSubTabChange = (_, newValue) => {
    subTabValueRef.current = newValue;
    setSelectedRows([]);
    setPage(1);
    // logUserActivity({
    //   action: "switch",
    //   type: "tab",
    //   detailItem: newValue,
    // });
  };

  // ----------------------- Action Icons -----------------------

  return (
    <div className=" md:px-10 pt-10">
      {/* Tabs for Sales and Reminder */}
      <Tabs
        value={tabValueRef.current}
        onChange={handleTabChange}
        centered
        className="border-b border-gray-200"
        textColor="primary"
        indicatorColor="primary"
      >
        <Tab label="Reminder" value="preWebinar" className="text-gray-600" />
        <Tab label="Sales" value="postWebinar" className="text-gray-600" />
        <Tab
          label="Enrollments"
          value="enrollments"
          style={{
            color: "gray",
          }}
        />
      </Tabs>

      <div className="flex  mt-6 justify-between items-center flex-wrap flex-col md:flex-row gap-4">
        <div className="flex items-center gap-4 md:flex-row flex-col">
          <Button
            onClick={() => copyToClipboard(id, "Webinar")}
            variant="outlined"
            endIcon={<ContentCopy />}
            style={{ textTransform: "none" }}
          >
            {id}
          </Button>
          <span className=" text-md text-neutral-800 capitalize underline-offset-8 underline">
            {webinarData?.webinarName}
          </span>
        </div>
        <div className="flex gap-2 ">
          {tabValueRef.current !== "enrollments" && (
            <div className="flex gap-2">
              {tabValueRef.current === "preWebinar" && (
                <button
                  className={globalButton}
                  onClick={() => setWebhookDialogOpen(true)}
                >
                  Webhook
                </button>
              )}
              <button
                className={globalButton}
                onClick={() => setSettingModalOpen(true)}
              >
                Settings
              </button>
              {console.log(tabValueRef.current, subTabValueRef.current, userData?.isActive)}
              { (tabValueRef.current === "preWebinar" || tabValueRef.current === "postWebinar") && subTabValueRef.current === "attendees" && userData?.isActive && (
                <button
                  className={globalButton}
                  onClick={() => setApplyTagsModalOpen(true)}
                >
                  Apply Tags
                </button>
              )}
            </div>
          )}

          {tabValueRef.current === "postWebinar" && (
            <Link className={globalButton} to={`/webinar-participants/${id}`}>
              Webinar Participants
            </Link>
          )}
        </div>

        {tabValueRef.current === "enrollments" && (
          <div className="flex gap-4">
            <span className="text-sm text-neutral-900">
              Total Enrollments:{" "}
              <span className="font-semibold text-lg text-indigo-500">
                {enrollmentCounts?.totalEnrollments || 0}
              </span>
            </span>
            <span className="text-sm text-neutral-900">
              Total Revenue:{" "}
              <span className="font-semibold text-lg text-indigo-500">
                {enrollmentCounts?.totalRevenue || 0}
              </span>
            </span>
          </div>
        )}
      </div>

      {tabValueRef.current && (
        <div className="flex gap-4 my-4 justify-between flex-wrap items-center flex-col md:flex-row">
          <div className="flex flex-wrap gap-4">
            {subTabValueRef.current === "attendees" &&
              tabValueRef.current !== "enrollments" &&
              userData?.isActive && (
                <button
                  className={globalButton}
                  onClick={() => setSwapOpen(true)}
                >
                  Swap Columns
                </button>
              )}
            {selectedRows.length > 0 &&
              (!(selectedAssignmentType === "All") ||
                subTabValueRef.current !== "attendees") && (
                <button
                  className={globalButton}
                  onClick={() => {
                    if (
                      subTabValueRef.current === "attendees" &&
                      selectedAssignmentType === "Not Assigned"
                    ) {
                      setAssignModal(true);
                    } else {
                      setReAssignModal(true);
                    }
                  }}
                >
                  {subTabValueRef.current === "attendees" &&
                  selectedAssignmentType === "Not Assigned"
                    ? "Assign"
                    : "Re-Assign"}
                </button>
              )}
            {userData?.isActive &&
              tabValueRef.current !== "enrollments" &&
              subTabValueRef.current === "attendees" &&
              selectedRows.length === 0 && (
                <button
                  onClick={() => setShowModal((prev) => !prev)}
                  className={`${globalButton} flex gap-1`}
                >
                  <AttachFile />
                  Import
                </button>
              )}
          </div>

          {tabValueRef.current !== "enrollments" && (
            <Tabs
              value={subTabValueRef.current}
              onChange={handleSubTabChange}
              className="border-b border-gray-200"
              textColor="primary"
              indicatorColor="primary"
              variant={isSmallScreen ? "scrollable" : "standard"} // Use scrollable on mobile
              scrollButtons="auto" // Automatically show scroll buttons if needed
            >
              <Tab
                label="Attendees"
                value="attendees"
                sx={{
                  // Apply smaller styles on extra-small to small screens
                  fontSize: { xs: "0.75rem", sm: "0.875rem" },
                  padding: { xs: "6px 8px", sm: "12px 16px" },
                  minWidth: { xs: "auto", sm: "90px" },
                }}
              />
              <Tab
                label={
                  <div className="flex items-center justify-center">
                    Pullbacks
                    {/* Make the badge smaller on mobile */}
                    <span
                      className={`ml-1.5 text-xs font-semibold rounded ${
                        isSmallScreen
                          ? "px-2 py-0.5 bg-blue-100 text-blue-600"
                          : "px-2.5 py-0.5 bg-blue-100 text-blue-600"
                      }`}
                    >
                      {reAssignCounts?.pullbacks || 0}
                    </span>
                  </div>
                }
                value={AssignmentStatus.REASSIGN_APPROVED}
                sx={{
                  fontSize: { xs: "0.75rem", sm: "0.875rem" },
                  padding: { xs: "6px 8px", sm: "12px 16px" },
                  minWidth: { xs: "auto", sm: "90px" },
                }}
              />
              <Tab
                label={
                  <div className="flex items-center justify-center">
                    Requests
                    <span
                      className={`ml-1.5 text-xs font-semibold rounded ${
                        isSmallScreen
                          ? "px-2 py-0.5 bg-blue-100 text-blue-600"
                          : "px-2.5 py-0.5 bg-blue-100 text-blue-600"
                      }`}
                    >
                      {reAssignCounts?.requests || 0}
                    </span>
                  </div>
                }
                value={AssignmentStatus.REASSIGN_REQUESTED}
                sx={{
                  fontSize: { xs: "0.75rem", sm: "0.875rem" },
                  padding: { xs: "6px 8px", sm: "12px 16px" },
                  minWidth: { xs: "auto", sm: "90px" },
                }}
              />
            </Tabs>
          )}
        </div>
      )}

      <Suspense fallback={<DataTableFallback />}>
        {tabValueRef.current === "" ? (
          <div className="flex flex-col items-center m-6 justify-center py-20 px-4 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 bg-gray-50 min-h-[300px]">
            <p className="text-lg font-semibold mb-2">No Tab Selected</p>
            <p className="text-center max-w-sm">
              Please select a tab (Reminder, Sales, or Enrollments) above to
              view the attendees data for this webinar.
            </p>
          </div>
        ) : (
          <>
            {""}
            {subTabValueRef.current === "attendees" &&
              (tabValueRef.current === "preWebinar" ||
                tabValueRef.current === "postWebinar") && (
                <WebinarAttendeesPage
                  userData={userData}
                  tabValue={tabValueRef.current}
                  page={page}
                  setPage={setPage}
                  isSwapOpen={isSwapOpen}
                  setSwapOpen={setSwapOpen}
                  subTabValue={subTabValueRef.current}
                  selectedRows={selectedRows}
                  setSelectedRows={setSelectedRows}
                  selectedAssignmentType={selectedAssignmentType}
                  setSelectedAssignmentType={setSelectedAssignmentType}
                  applyTagsModalOpen={applyTagsModalOpen}
                  setApplyTagsModalOpen={setApplyTagsModalOpen}
                />
              )}
            {subTabValueRef.current !== "attendees" &&
              tabValueRef.current !== "enrollments" && (
                <Pullbacks
                  subTabValue={subTabValueRef.current}
                  page={page}
                  setPage={setPage}
                  tabValue={tabValueRef.current}
                  selectedRows={selectedRows}
                  setSelectedRows={setSelectedRows}
                  userData={userData}
                />
              )}
            {tabValueRef.current === "enrollments" && (
              <Enrollments
                page={page}
                setPage={setPage}
                tabValue={tabValueRef.current}
                webinarData={webinarData}
              />
            )}
          </>
        )}
      </Suspense>

      {reAssignModal && (
        <Suspense fallback={<ModalFallback />}>
          <ReAssignmentModal
            selectedRows={selectedRows}
            webinarid={id}
            tabValue={tabValueRef.current}
            isPullbackVisible={
              tabValueRef.current !== "enrollments" &&
              subTabValueRef.current === "attendees"
            }
            isAttendee={true}
            setReAssignModal={setReAssignModal}
          />
        </Suspense>
      )}

      {assignModal &&
        createPortal(
          <Suspense fallback={<ModalFallback />}>
            <EmployeeAssignModal
              tabValue={tabValueRef.current}
              selectedRows={selectedRows}
              setAssignModal={setAssignModal}
              webinarId={id}
            />
          </Suspense>,
          document.body
        )}

      {showModal &&
        createPortal(
          <Suspense fallback={<ModalFallback />}>
            <UpdateCsvXslxModal
              tabValue={tabValueRef.current}
              setModal={setShowModal}
            />
          </Suspense>,
          document.body
        )}

      <AutoAssignmentModal
        webinarId={id}
        onClose={() => {
          setSettingModalOpen(false);
        }}
        isOpen={settingModalOpen}
        webinarData={webinarData}
        refetchWebinarData={fetchWebinarData}
      />

      {webhookDialogOpen && (
        <Suspense fallback={<ModalFallback />}>
          <WebinarWebhooksListDialog
            webinarId={id}
            isOpen={webhookDialogOpen}
            onClose={() => setWebhookDialogOpen(false)}
            onRefresh={fetchWebinarData}
          />
        </Suspense>
      )}
    </div>
  );
};

export default WebinarAttendees;
