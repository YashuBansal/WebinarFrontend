import {
  useEffect,
  useState,
  lazy,
  Suspense,
  useRef,
  useCallback,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Copy,
  ArrowUpDown,
  Upload,
  Settings2,
  Search,
  Maximize,
  Minimize,
  RotateCcw,
  Star,
  Filter,
  Trash2,
  Save,
  X,
  Tag
} from "lucide-react";

const Pullbacks = lazy(() => import("./Pullbacks"));
const Enrollments = lazy(() => import("./Enrollments"));
const WebinarAttendeesPage = lazy(() => import("./WebinarAttendeesPage"));

import { Link, useParams, useSearchParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { createPortal } from "react-dom";
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
import AutoAssignmentModal from "./modal/AutoAssignmentModal";
import tagsService from "../../services/tagsService";
const WebinarWebhooksListDialog = lazy(() =>
  import("./modal/WebinarWebhooksListDialog")
);

const WebinarAttendees = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const logUserActivity = useAddUserActivity();

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
  const tabValueRef = useRef(searchParams.get("tabValue") || "preWebinar");
  const subTabValueRef = useRef(searchParams.get("subTabValue") || "attendees");

  const [settingModalOpen, setSettingModalOpen] = useState(false);
  const [webhookDialogOpen, setWebhookDialogOpen] = useState(false);
  const [applyTagsModalOpen, setApplyTagsModalOpen] = useState(false);
  const [bulkEnrollOpen, setBulkEnrollOpen] = useState(false);

  // Sync URL with State
  useEffect(() => {
    const currentParams = Object.fromEntries([...searchParams.entries()]);
    const newParams = {
      page: page,
      tabValue: tabValueRef.current,
      subTabValue: subTabValueRef.current,
    };

    let isDifferent = false;
    for (const key in newParams) {
      if (String(newParams[key] || "") !== String(currentParams[key] || "")) {
        isDifferent = true;
        break;
      }
    }

    if (isDifferent) {
      const paramsToSet = {};
      for (const key in newParams) {
        if (newParams[key]) paramsToSet[key] = newParams[key];
      }
      setSearchParams(paramsToSet, { replace: true });
    }
  }, [page, tabValueRef.current, subTabValueRef.current, searchParams, setSearchParams]);

  const fetchWebinarData = useCallback(() => {
    tagsService.getWebinarById(id).then((res) => {
      if (res?.success) setWebinarData(res.data);
    });
  }, [id]);

  useEffect(() => {
    dispatch(getLeadType());
    dispatch(getAllEmployees({}));
    fetchCounts();
    fetchWebinarData();
  }, []);

  const fetchCounts = useCallback(() => {
    if (["preWebinar", "postWebinar"].includes(tabValueRef.current)) {
      dispatch(
        fetchPullbackRequestCounts({
          webinarId: id,
          status: "active",
          recordType: tabValueRef.current,
        })
      );
    }
  }, [id, tabValueRef.current]);

  useEffect(() => {
    const onNotification = (data) => {
      if (data.actionType === NotifActionType.REASSIGNMENT) fetchCounts();
    };
    socket.on("notification", onNotification);
    return () => socket.off("notification", onNotification);
  }, [fetchCounts]);

  const handleTabChange = (newValue) => {
    tabValueRef.current = newValue;
    setPage(1);
    setSelectedRows([]);
    fetchCounts();
  };

  const handleSubTabChange = (newValue) => {
    subTabValueRef.current = newValue;
    setSelectedRows([]);
    setPage(1);
  };

  const theme = "light"; // Hardcoded for consistency with new UI, can be dynamic
  const cardBg = "rgba(255, 255, 255, 0.7)";
  const cardBorder = "rgba(0, 0, 0, 0.06)";

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-4 md:p-8 space-y-6 font-sans">
      {/* Glassmorphic Header Card */}
      <div
        className="rounded-3xl p-6 border transition-all duration-300"
        style={{
          background: cardBg,
          backdropFilter: 'blur(20px)',
          borderColor: cardBorder,
          boxShadow: '0 10px 40px rgba(0,0,0,0.03)'
        }}
      >
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <Link to="/webinars" className="p-2 rounded-xl hover:bg-black/5 transition-colors">
                <ArrowLeft className="w-5 h-5 text-slate-600" />
              </Link>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                {webinarData?.webinarName || "Webinar Attendees"}
              </h1>
            </div>
            <div className="flex items-center gap-2 ml-12">
              <span className="px-3 py-1 bg-blue-50 text-blue-600 text-xs font-bold rounded-lg border border-blue-100 flex items-center gap-2">
                ID: {id}
                <button onClick={() => copyToClipboard(id, "Webinar")} className="hover:text-blue-800">
                  <Copy className="w-3 h-3" />
                </button>
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            {tabValueRef.current === "postWebinar" && (
              <Link
                to={`/webinar-participants/${id}`}
                className="flex-1 md:flex-none px-5 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl text-sm font-bold hover:bg-slate-50 transition-all flex items-center justify-center gap-2 shadow-sm"
              >
                Participants
              </Link>
            )}
            {tabValueRef.current !== "enrollments" && (
              <>
                {tabValueRef.current === "preWebinar" && (
                  <button
                    onClick={() => setWebhookDialogOpen(true)}
                    className="flex-1 md:flex-none px-5 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl text-sm font-bold hover:bg-slate-50 transition-all flex items-center justify-center gap-2 shadow-sm"
                  >
                    Webhooks
                  </button>
                )}
                <button
                  onClick={() => setSettingModalOpen(true)}
                  className="flex-1 md:flex-none px-5 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl text-sm font-bold hover:bg-slate-50 transition-all flex items-center justify-center gap-2 shadow-sm"
                >
                  <Settings2 className="w-4 h-4" /> Settings
                </button>
                <button
                  onClick={() => setApplyTagsModalOpen(true)}
                  className="flex-1 md:flex-none px-5 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl text-sm font-bold hover:bg-slate-50 transition-all flex items-center justify-center gap-2 shadow-sm"
                >
                  <Tag className="w-4 h-4" /> Apply Tag
                </button>
              </>
            )}

          </div>
        </div>

        {/* Custom Tab Toggles */}
        <div className="mt-8 flex items-center p-1.5 bg-slate-100/50 rounded-2xl w-full md:w-fit">
          {[
            { label: "Reminder", value: "preWebinar" },
            { label: "Sales", value: "postWebinar" },
            { label: "Enrollments", value: "enrollments" }
          ].map((tab) => (
            <button
              key={tab.value}
              onClick={() => handleTabChange(tab.value)}
              className={`px-8 py-2.5 text-sm font-bold rounded-xl transition-all duration-300 ${tabValueRef.current === tab.value
                ? "bg-white text-blue-600 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
                }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="space-y-4">
        {/* Sub-Header Actions */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex flex-wrap gap-2">
            {tabValueRef.current !== "enrollments" && subTabValueRef.current === "attendees" && userData?.isActive && (
              <>
                <button
                  onClick={() => setSwapOpen(true)}
                  className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl text-sm font-bold hover:bg-slate-50 transition-all shadow-sm"
                >
                  Swap Columns
                </button>
                <button
                  onClick={() => setShowModal(true)}
                  className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl text-sm font-bold hover:bg-slate-50 transition-all shadow-sm flex items-center gap-2"
                >
                  <Upload className="w-4 h-4" /> Import
                </button>
                <button
                  onClick={() => setBulkEnrollOpen(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition-all shadow-md shadow-blue-200"
                >
                  Create Enrollments
                </button>
              </>
            )}

            {selectedRows.length > 0 && (
              <button
                onClick={() => (subTabValueRef.current === "attendees" && selectedAssignmentType === "Not Assigned") ? setAssignModal(true) : setReAssignModal(true)}
                className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 transition-all shadow-md"
              >
                {(subTabValueRef.current === "attendees" && selectedAssignmentType === "Not Assigned") ? "Assign" : "Re-Assign"}
              </button>
            )}
          </div>

          {tabValueRef.current !== "enrollments" && (
            <div className="flex items-center p-1 bg-white border border-slate-200 rounded-xl">
              {[
                { label: "Attendees", value: "attendees", count: 0 },
                { label: "Pullbacks", value: AssignmentStatus.REASSIGN_APPROVED, count: reAssignCounts?.pullbacks || 0 },
                { label: "Requests", value: AssignmentStatus.REASSIGN_REQUESTED, count: reAssignCounts?.requests || 0 }
              ].map((subTab) => (
                <button
                  key={subTab.value}
                  onClick={() => handleSubTabChange(subTab.value)}
                  className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-2 ${subTabValueRef.current === subTab.value
                    ? "bg-slate-900 text-white"
                    : "text-slate-500 hover:bg-slate-50"
                    }`}
                >
                  {subTab.label}
                  {subTab.count > 0 && (
                    <span className={`px-1.5 py-0.5 rounded ${subTabValueRef.current === subTab.value ? "bg-slate-700" : "bg-blue-50 text-blue-600"}`}>
                      {subTab.count}
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Dynamic Page Rendering */}
        <Suspense fallback={<DataTableFallback />}>
          {tabValueRef.current === "enrollments" ? (
            <Enrollments page={page} setPage={setPage} tabValue={tabValueRef.current} webinarData={webinarData} />
          ) : subTabValueRef.current === "attendees" ? (
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
              bulkEnrollOpen={bulkEnrollOpen}
              setBulkEnrollOpen={setBulkEnrollOpen}
            />
          ) : (
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
        </Suspense>
      </div>

      {/* Modal Portals */}
      <Suspense fallback={<ModalFallback />}>
        {reAssignModal && (
          <ReAssignmentModal 
            selectedRows={selectedRows} 
            webinarid={id} 
            tabValue={tabValueRef.current} 
            isPullbackVisible={tabValueRef.current !== "enrollments" && subTabValueRef.current === "attendees"} 
            isAttendee={true} 
            setReAssignModal={setReAssignModal} 
          />
        )}

        {assignModal && (
          <EmployeeAssignModal 
            tabValue={tabValueRef.current} 
            selectedRows={selectedRows} 
            setAssignModal={setAssignModal} 
            webinarId={id} 
          />
        )}

        {showModal && (
          <UpdateCsvXslxModal 
            tabValue={tabValueRef.current} 
            setModal={setShowModal} 
          />
        )}

        {webhookDialogOpen && (
          <WebinarWebhooksListDialog 
            webinarId={id} 
            isOpen={webhookDialogOpen} 
            onClose={() => setWebhookDialogOpen(false)} 
            onRefresh={fetchWebinarData} 
          />
        )}
      </Suspense>

      <AutoAssignmentModal webinarId={id} onClose={() => setSettingModalOpen(false)} isOpen={settingModalOpen} webinarData={webinarData} refetchWebinarData={fetchWebinarData} />
    </div>
  );
};

export default WebinarAttendees;
