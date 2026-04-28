import React, {
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  clearAttendeeData,
  clearSuccess,
} from "../../features/slices/attendees";
import {
  deleteWebinarAttendees,
  getAttendees,
  getAttendeesSilently,
  swapAttendeeFields,
} from "../../features/actions/attendees";
import { attendeeTableColumns } from "../../utils/columnData";
import { DynamicLeadsTable } from "../../components/Webinar/DynamicLeadsTable";
import { setPageLimit } from "../../features/slices/pageLimits";

const AttendeesFilterModal = lazy(
  () => import("../../components/Attendees/AttendeesFilterModal"),
);
import { resetReAssignSuccess } from "../../features/slices/reAssign.slice";
import { resetAssignSuccess } from "../../features/slices/assign";
const ExportWebinarAttendeesModal = lazy(
  () => import("../../components/Export/ExportWebinarAttendeesModal"),
);
const SwapAttendeeFieldsModal = lazy(
  () => import("../../components/Webinar/SwapAttendeeFieldsModal"),
);
const ApplyTagsModal = lazy(
  () => import("../../components/Webinar/ApplyTagsModal"),
);
const BulkEnrollmentModal = lazy(
  () => import("../../components/Webinar/BulkEnrollmentModal"),
);
import { createPortal } from "react-dom";
import ModalFallback from "../../components/Fallback/ModalFallback";
import { setWebinarAttendeesFilters } from "../../features/slices/filters.slice";
import {
  flattenObjectForURLSearchParams,
  NotifActionType,
  successToast,
} from "../../utils/extra";
import { socket } from "../../socket";
import ConfirmDeleteModal from "../../components/ConfirmDeleteModal";
import { clearWebinarData } from "../../features/slices/webinarContact";
import { baseURL } from "../../services/axiosInterceptor";
import { getTagsData, setTagsData } from "../../features/slices/globalData";
import tagsService from "../../services/tagsService";
import { useBulkApplyTagsByFilters } from "../../hooks/useTags";
import {
  Maximize,
  Minimize,
  RotateCcw,
  Settings2,
  Star,
  Filter,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  Upload,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

const WebinarAttendeesPage = (props) => {
  const {
    tabValue,
    page,
    setPage,
    userData,
    isSwapOpen,
    setSwapOpen,
    subTabValue,
    selectedRows,
    setSelectedRows,
    setSelectedAssignmentType,
    selectedAssignmentType,
    applyTagsModalOpen,
    setApplyTagsModalOpen,
    bulkEnrollOpen,
    setBulkEnrollOpen,
  } = props;

  const tableHeader = "Attendees Table";
  const exportExcelModalName = "ExportWebinarAttendeesExcel";
  const AttendeesFilterModalName = "AttendeesFilterModal";

  const modalState = useSelector((state) => state.modals.modals);
  const exportModalOpen = modalState[exportExcelModalName] ? true : false;
  const AttendeesFilterModalOpen = modalState[AttendeesFilterModalName]
    ? true
    : false;

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { id } = useParams();

  const theme = "light";

  const {
    attendeeData,
    isLoading,
    pagination,
    isSuccess,
    isDeleting,
    webinarName,
  } = useSelector((state) => state.attendee);
  const { total = 0, totalPages = 1 } = pagination;

  const { isSuccess: isSuccessReAssign } = useSelector(
    (state) => state.reAssign,
  );
  const { leadTypeData, isSuccess: assignSuccess } = useSelector(
    (state) => state.assign,
  );
  const LIMIT = useSelector((state) => state.pageLimits[tableHeader] || 10);

  const [selectedActivity, setSelectedActivity] = useState("All");
  const [deleteModal, setDeleteModal] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);

  const {
    webinarAttendeesSortBy,
    webinarAttendeesFilters,
    salesAttendeesSortBy,
  } = useSelector((state) => state.filters);

  const sortByOption = useMemo(
    () =>
      tabValue === "preWebinar" ? webinarAttendeesSortBy : salesAttendeesSortBy,
    [tabValue, webinarAttendeesSortBy, salesAttendeesSortBy],
  );

  const notAllowedFields = useMemo(
    () =>
      tabValue === "preWebinar"
        ? ["assignmentDate", "timeInSession"]
        : ["assignmentDate"],
    [tabValue],
  );

  // Column config for DynamicLeadsTable
  const ALL_COLUMNS = useMemo(
    () => [
      {
        key: "serialNo",
        label: "Sr No",
        dataKey: "serialNo",
        widthKey: "serialNo",
        sortable: false,
        locked: true,
      },
      {
        key: "email",
        label: "Email",
        dataKey: "email",
        widthKey: "email",
        sortable: true,
        locked: true,
      },
      {
        key: "phone",
        label: "Phone",
        dataKey: "phone",
        widthKey: "phone",
        sortable: true,
        locked: false,
      },
      {
        key: "assignedTo",
        label: "Assigned To",
        dataKey: "isAssigned",
        widthKey: "assignedTo",
        sortable: true,
        locked: false,
      },
      {
        key: "firstName",
        label: "First Name",
        dataKey: "firstName",
        widthKey: "firstName",
        sortable: true,
        locked: false,
      },
      {
        key: "lastName",
        label: "Last Name",
        dataKey: "lastName",
        widthKey: "lastName",
        sortable: true,
        locked: false,
      },
      {
        key: "status",
        label: "Status",
        dataKey: "status",
        widthKey: "status",
        sortable: true,
        locked: false,
      },
      {
        key: "gender",
        label: "Gender",
        dataKey: "gender",
        widthKey: "gender",
        sortable: true,
        locked: false,
      },
      {
        key: "location",
        label: "Location",
        dataKey: "location",
        widthKey: "location",
        sortable: true,
        locked: false,
      },
      {
        key: "source",
        label: "Source",
        dataKey: "source",
        widthKey: "source",
        sortable: true,
        locked: false,
      },
      {
        key: "dateTime",
        label: "Date",
        dataKey: "createdAt",
        widthKey: "dateTime",
        sortable: true,
        locked: false,
      },
      {
        key: "tags",
        label: "Tags",
        dataKey: "tags",
        widthKey: "tags",
        sortable: false,
        locked: false,
      },
      {
        key: "enrollments",
        label: "Enrollments",
        dataKey: "enrollments",
        widthKey: "enrollments",
        sortable: false,
        locked: false,
      },
      {
        key: "registeredWebinars",
        label: "Registered",
        dataKey: "registeredCount",
        widthKey: "registeredWebinars",
        sortable: true,
        locked: false,
      },
      {
        key: "attendedWebinars",
        label: "Attended",
        dataKey: "attendedCount",
        widthKey: "attendedWebinars",
        sortable: true,
        locked: false,
      },
      {
        key: "pastWebinarDuration",
        label: "Duration",
        dataKey: "timeInSession",
        widthKey: "pastWebinarDuration",
        sortable: true,
        locked: false,
      },
      {
        key: "actions",
        label: "Actions",
        dataKey: "actions",
        widthKey: "actions",
        sortable: false,
        locked: true,
      },
    ],
    [],
  );

  const [columnWidths, setColumnWidths] = useState({
    serialNo: 60,
    email: 250,
    phone: 150,
    assignedTo: 150,
    firstName: 150,
    lastName: 150,
    status: 150,
    gender: 100,
    location: 150,
    source: 150,
    dateTime: 200,
    tags: 200,
    enrollments: 200,
    registeredWebinars: 100,
    attendedWebinars: 100,
    pastWebinarDuration: 120,
    actions: 120,
  });

  const [columnVisibility, setColumnVisibility] = useState(
    ALL_COLUMNS.reduce((acc, col) => ({ ...acc, [col.key]: true }), {}),
  );

  useEffect(() => {
    return () => {
      dispatch(clearWebinarData());
      dispatch(clearAttendeeData());
    };
  }, [tabValue]);

  const tagsData = useSelector(getTagsData);

  const { mutateAsync: applyTagsByFilters, isPending: isApplyingTags } =
    useBulkApplyTagsByFilters(() => {
      fetchAttendees(1);
      setApplyTagsModalOpen(false);
    });

  const fetchAttendees = (p = page) => {
    dispatch(
      getAttendees({
        id,
        isAttended: tabValue === "postWebinar",
        page: p,
        limit: LIMIT,
        filters: webinarAttendeesFilters,
        validCall: selectedActivity === "All" ? undefined : selectedActivity,
        assignmentType:
          selectedAssignmentType === "All" ? undefined : selectedAssignmentType,
        sort: sortByOption,
      }),
    );
  };

  useEffect(() => {
    if (tabValue !== "enrollments" && subTabValue === "attendees") {
      fetchAttendees();
    }
  }, [
    page,
    tabValue,
    LIMIT,
    webinarAttendeesFilters,
    selectedActivity,
    selectedAssignmentType,
    sortByOption,
  ]);

  useEffect(() => {
    if (isSuccess || assignSuccess || isSuccessReAssign) {
      fetchAttendees(1);
      dispatch(clearSuccess());
      dispatch(resetReAssignSuccess());
      dispatch(resetAssignSuccess());
      setDeleteModal(false);
      setApplyTagsModalOpen(false);
      setSelectedRows([]);
    }
  }, [isSuccess, assignSuccess, isSuccessReAssign]);

  useEffect(() => {
    function onNotification(data) {
      if (data.actionType === NotifActionType.ATTENDEE_REGISTRATION) {
        if (tabValue !== "enrollments" && subTabValue === "attendees") {
          dispatch(
            getAttendeesSilently({
              id,
              isAttended: tabValue === "postWebinar",
              page,
              limit: LIMIT,
              filters: webinarAttendeesFilters,
              validCall:
                selectedActivity === "All" ? undefined : selectedActivity,
              assignmentType:
                selectedAssignmentType === "All"
                  ? undefined
                  : selectedAssignmentType,
              sort: sortByOption,
            }),
          );
        }
      }
    }
    socket.on("notification", onNotification);
    return () => socket.off("notification", onNotification);
  }, [
    page,
    tabValue,
    LIMIT,
    webinarAttendeesFilters,
    selectedActivity,
    selectedAssignmentType,
    sortByOption,
  ]);

  const handleColumnSwap = (field1, field2) => {
    dispatch(
      swapAttendeeFields({
        attendees: selectedRows,
        field1,
        field2,
        webinarId: id,
        isAttended: tabValue === "postWebinar",
        filters: webinarAttendeesFilters,
        validCall: selectedActivity === "All" ? undefined : selectedActivity,
        assignmentType:
          selectedAssignmentType === "All" ? undefined : selectedAssignmentType,
      }),
    ).then((res) => {
      res?.meta?.requestStatus === "fulfilled" && setSelectedRows([]);
    });
  };

  const handleSort = (column) => {
    const isAsc =
      sortByOption?.sortBy === column && sortByOption?.sortOrder === "asc";
    const newSortOrder = isAsc ? "desc" : "asc";

    dispatch(
      setWebinarAttendeesFilters({
        recordType: tabValue,
        sortBy: {
          sortBy: column,
          sortOrder: newSortOrder,
        },
      }),
    );
  };

  // UI Styling Helpers
  const textPrimary = theme === "dark" ? "#f8fafc" : "#071028";
  const textMuted = theme === "dark" ? "#94a3b8" : "#64748b";
  const cardBg =
    theme === "dark" ? "rgba(30,41,59,0.7)" : "rgba(255,255,255,0.8)";
  const cardBorder =
    theme === "dark" ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)";
  const dividerColor = theme === "dark" ? "#334155" : "rgba(0,0,0,0.06)";
  const inputBg = theme === "dark" ? "#0f172a" : "#ffffff";
  const inputBorder = theme === "dark" ? "#334155" : "#e2e8f0";

  const inputStyle = {
    backgroundColor: inputBg,
    border: `1px solid ${inputBorder}`,
    color: textPrimary,
    fontFamily: "Inter, sans-serif",
  };

  const labelStyle = {
    color: textMuted,
    fontSize: "11px",
    fontWeight: 600,
    marginBottom: "2px",
    display: "block",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
  };

  const indexOfFirstItem = (page - 1) * LIMIT;
  const indexOfLastItem = Math.min(page * LIMIT, total);

  return (
    <div className="space-y-4">
      {/* Table Container Card */}
      <div
        className={`rounded-2xl overflow-hidden border flex flex-col transition-all duration-300 ${isFullScreen ? "fixed inset-0 z-[100] rounded-none bg-white" : ""}`}
        style={{
          background: cardBg,
          backdropFilter: "blur(16px)",
          borderColor: cardBorder,
          boxShadow: "0 10px 40px rgba(7,16,40,0.05)",
          minHeight: isFullScreen ? "100vh" : "600px",
        }}
      >
        {/* Controls Bar */}
        <div
          className="p-4 border-b flex flex-col sm:flex-row items-center justify-between gap-4"
          style={{ borderColor: dividerColor }}
        >
          <div className="flex flex-col">
            <h3 className="text-lg font-bold" style={{ color: textPrimary }}>
              {tabValue === "preWebinar" ? "Reminder Leads" : "Sales Leads"}
            </h3>
            <p className="text-xs mt-0.5" style={{ color: textMuted }}>
              Total Records:{" "}
              <span style={{ color: "#3b82f6", fontWeight: 700 }}>{total}</span>
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsFullScreen(!isFullScreen)}
              className="p-2.5 rounded-xl border hover:bg-black/5 transition-colors"
              style={inputStyle}
            >
              {isFullScreen ? (
                <Minimize className="w-4 h-4" />
              ) : (
                <Maximize className="w-4 h-4" />
              )}
            </button>
            <button
              onClick={() => { }}
              className="p-2.5 rounded-xl border hover:bg-black/5 transition-colors"
              style={inputStyle}
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            <button
              onClick={() => { }}
              className="p-2.5 rounded-xl border hover:bg-black/5 transition-colors"
              style={inputStyle}
            >
              <Settings2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Filter Bar */}
        <div
          className="p-4 border-b flex items-center justify-between gap-4 flex-wrap"
          style={{ borderColor: dividerColor }}
        >
          <div className="flex items-center gap-3">
            <div className="flex flex-col gap-1">
              <label style={labelStyle}>Activity</label>
              <select
                className="px-3 py-2 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 cursor-pointer appearance-none"
                style={inputStyle}
                value={selectedActivity}
                onChange={(e) => {
                  setSelectedActivity(e.target.value);
                  setPage(1);
                }}
              >
                <option value="All">All</option>
                <option value="Worked">Worked</option>
                <option value="Pending">Pending</option>
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label style={labelStyle}>Assignment</label>
              <select
                className="px-3 py-2 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 cursor-pointer appearance-none"
                style={inputStyle}
                value={selectedAssignmentType}
                onChange={(e) => {
                  setSelectedAssignmentType(e.target.value);
                  setPage(1);
                }}
              >
                <option value="All">All</option>
                <option value="Assigned">Assigned</option>
                <option value="Not Assigned">Not Assigned</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() =>
                dispatch({
                  type: "modals/openModal",
                  payload: AttendeesFilterModalName,
                })
              }
              className="flex items-center gap-2 px-4 py-2 rounded-xl border hover:bg-black/5 transition-colors text-sm font-semibold"
              style={inputStyle}
            >
              <Filter className="w-4 h-4" /> Filters
            </button>
            <button
              onClick={() =>
                dispatch({
                  type: "modals/openModal",
                  payload: exportExcelModalName,
                })
              }
              className="flex items-center gap-2 px-4 py-2 rounded-xl border hover:bg-black/5 transition-colors text-sm font-semibold"
              style={inputStyle}
            >
              <Upload className="w-4 h-4" /> Export
            </button>
          </div>
        </div>

        {/* Table Area */}
        <div className="flex-1 overflow-auto custom-scrollbar relative">
          <table className="w-full text-left border-collapse" style={{ minWidth: "2000px" }}>
            <DynamicLeadsTable
              columns={ALL_COLUMNS.map((col) => ({
                ...col,
                onViewClick: (item) =>
                  navigate(
                    `/particularContact?email=${item?.email}&attendeeId=${item?._id}`,
                  ),
                onDeleteClick: (item) => setDeleteModal(item),
              }))}
              selectedRows={selectedRows}
              onToggleSelect={(id) => {
                setSelectedRows(prev => {
                  if (prev.includes(id)) return prev.filter(rowId => rowId !== id);
                  return [...prev, id];
                });
              }}
              onToggleSelectAll={(checked, allIds) => {
                if (checked) setSelectedRows(allIds);
                else setSelectedRows([]);
              }}
              attendees={attendeeData}
              columnWidths={columnWidths}
              columnVisibility={columnVisibility}
              sortColumn={sortByOption?.sortBy}
              sortDirection={sortByOption?.sortOrder}
              resizingColumn={null}
              theme={theme}
              indexOfFirstItem={indexOfFirstItem}
              sortedAttendees={attendeeData}
              onSort={handleSort}
              onResizeStart={() => { }}
              onResizeDoubleClick={() => { }}
              onDeleteClick={() => { }}
            />
          </table>
          {isLoading && (
            <div className="absolute inset-0 bg-white/50 backdrop-blur-[2px] flex items-center justify-center z-50">
              <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          )}
        </div>

        {/* Pagination Footer */}
        <div
          className="p-4 border-t flex flex-col sm:flex-row items-center justify-between gap-4 flex-shrink-0"
          style={{
            borderColor: dividerColor,
            backgroundColor:
              theme === "dark" ? "rgba(15,23,42,0.4)" : "#F9FAFB",
          }}
        >
          <div className="flex items-center gap-4">
            <span className="text-sm" style={{ color: textMuted }}>
              Showing{" "}
              <span className="font-bold" style={{ color: textPrimary }}>
                {total > 0 ? indexOfFirstItem + 1 : 0}
              </span>{" "}
              to{" "}
              <span className="font-bold" style={{ color: textPrimary }}>
                {indexOfLastItem}
              </span>{" "}
              of{" "}
              <span className="font-bold" style={{ color: textPrimary }}>
                {total}
              </span>{" "}
              entries
            </span>
            <div className="flex items-center gap-2">
              <span className="text-sm" style={{ color: textMuted }}>
                Show:
              </span>
              <input
                type="number"
                value={LIMIT}
                onChange={(e) => {
                  const val = parseInt(e.target.value);
                  if (val > 0)
                    dispatch(setPageLimit({ key: tableHeader, limit: val }));
                }}
                className="w-16 px-2 py-1.5 rounded-xl text-sm text-center border focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                style={inputStyle}
              />
            </div>
          </div>

          <div className="flex gap-2">
            <button
              disabled={page === 1}
              onClick={() => setPage(page - 1)}
              className="px-4 py-2 rounded-xl border text-sm font-semibold transition-all disabled:opacity-50 hover:bg-black/5"
              style={inputStyle}
            >
              Previous
            </button>
            <button
              disabled={page === totalPages || totalPages === 0}
              onClick={() => setPage(page + 1)}
              className="px-4 py-2 rounded-xl border text-sm font-semibold transition-all disabled:opacity-50 hover:bg-black/5"
              style={inputStyle}
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Modals */}
      <AnimatePresence>
        {AttendeesFilterModalOpen && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() =>
                dispatch({
                  type: "modals/closeModal",
                  payload: AttendeesFilterModalName,
                })
              }
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 16 }}
              className="relative z-10 w-full max-w-4xl"
            >
              <Suspense fallback={<ModalFallback />}>
                <AttendeesFilterModal
                  modalName={AttendeesFilterModalName}
                  setPage={setPage}
                  tabValue={tabValue}
                  notAllowed={notAllowedFields}
                  handleCopy={() => { }}
                />
              </Suspense>
            </motion.div>
          </div>
        )}

        {exportModalOpen && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() =>
                dispatch({
                  type: "modals/closeModal",
                  payload: exportExcelModalName,
                })
              }
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 16 }}
              className="relative z-10 w-full max-w-2xl"
            >
              <Suspense fallback={<ModalFallback />}>
                <ExportWebinarAttendeesModal
                  modalName={exportExcelModalName}
                  filters={webinarAttendeesFilters}
                  sort={sortByOption}
                  webinarId={id}
                  webinarName={webinarName}
                  isAttended={tabValue === "postWebinar"}
                  validCall={
                    selectedActivity === "All" ? undefined : selectedActivity
                  }
                  assignmentType={
                    selectedAssignmentType === "All"
                      ? undefined
                      : selectedAssignmentType
                  }
                />
              </Suspense>
            </motion.div>
          </div>
        )}

        {isSwapOpen && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setSwapOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 16 }}
              className="relative z-10 w-full max-w-lg"
            >
              <Suspense fallback={<ModalFallback />}>
                <SwapAttendeeFieldsModal
                  onClose={() => setSwapOpen(false)}
                  onSubmit={handleColumnSwap}
                />
              </Suspense>
            </motion.div>
          </div>
        )}

        {deleteModal && (
          <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setDeleteModal(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 16 }}
              className="relative z-10 w-full max-w-sm"
            >
              <Suspense fallback={<ModalFallback />}>
                <ConfirmDeleteModal
                  setModal={setDeleteModal}
                  triggerDelete={() =>
                    dispatch(
                      deleteWebinarAttendees({
                        attendees: [deleteModal?._id],
                        webinarId: id,
                      }),
                    )
                  }
                  isLoading={isDeleting}
                />
              </Suspense>
            </motion.div>
          </div>
        )}

        {applyTagsModalOpen && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setApplyTagsModalOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 16 }}
              className="relative z-10 w-full max-w-md"
            >
              <Suspense fallback={<ModalFallback />}>
                <ApplyTagsModal
                  onClose={() => setApplyTagsModalOpen(false)}
                  onSubmit={(tag) =>
                    applyTagsByFilters({
                      webinarId: id,
                      isAttended: tabValue === "postWebinar",
                      filters: webinarAttendeesFilters,
                      validCall:
                        selectedActivity === "All"
                          ? undefined
                          : selectedActivity,
                      assignmentType:
                        selectedAssignmentType === "All"
                          ? undefined
                          : selectedAssignmentType,
                      tag,
                    })
                  }
                  isLoading={isApplyingTags}
                />
              </Suspense>
            </motion.div>
          </div>
        )}

        {bulkEnrollOpen && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setBulkEnrollOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 16 }}
              className="relative z-10 w-full max-w-4xl"
            >
              <Suspense fallback={<ModalFallback />}>
                <BulkEnrollmentModal
                  onClose={() => setBulkEnrollOpen(false)}
                  webinarId={id}
                  isAttended={tabValue === "postWebinar"}
                  selectedRows={selectedRows}
                  total={total}
                  filters={webinarAttendeesFilters}
                  validCall={
                    selectedActivity === "All" ? undefined : selectedActivity
                  }
                  assignmentType={
                    selectedAssignmentType === "All"
                      ? undefined
                      : selectedAssignmentType
                  }
                  onSuccess={() => fetchAttendees(1)}
                />
              </Suspense>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default WebinarAttendeesPage;
