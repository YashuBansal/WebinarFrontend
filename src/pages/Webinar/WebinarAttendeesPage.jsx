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
import WebinarAttendeesTableShell from "../../components/Attendees/WebinarAttendeesTableShell";
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
const FilterPresetModal = lazy(
  () => import("../../components/Filter/FilterPresetModal"),
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
  Tag,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { useTheme } from "../../contexts/ThemeContext";

const WebinarAttendeesPage = (props) => {
  const { isDark } = useTheme();
  const theme = isDark ? "dark" : "light";

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
  const [presetModalOpen, setPresetModalOpen] = useState(false);

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
        label: "S.No",
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
        sortable: true,
        locked: false,
      },
      {
        key: "enrollments",
        label: "Enrollments",
        dataKey: "enrollments",
        widthKey: "enrollments",
        sortable: true,
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
    const currentSortBy = sortByOption?.sortBy;
    const currentSortOrder = sortByOption?.sortOrder;

    let newSortBy = column;
    let newSortOrder = "desc";

    if (currentSortBy === column) {
      if (currentSortOrder === "desc") {
        newSortOrder = "asc";
      } else {
        // Third click: clear sorting
        newSortBy = "";
        newSortOrder = "";
      }
    }

    dispatch(
      setWebinarAttendeesFilters({
        recordType: tabValue,
        sortBy: {
          sortBy: newSortBy,
          sortOrder: newSortOrder,
        },
      }),
    );
  };

  const handleCopyApi = useCallback((filters) => {
    const params = {
      page,
      limit: LIMIT,
      filters,
      fieldName: "attendeeTableConfig",
      webinarId: id,
      isAttended: tabValue === "postWebinar",
      validCall: selectedActivity === "All" ? undefined : selectedActivity,
      assignmentType: selectedAssignmentType === "All" ? undefined : selectedAssignmentType,
      sort: sortByOption?.sortBy ? sortByOption : undefined,
    };

    const flattened = flattenObjectForURLSearchParams(params);
    const searchParams = new URLSearchParams();
    flattened.forEach(([key, value]) => {
      searchParams.append(key, value);
    });

    const url = `${baseURL}/attendees/webinar?${searchParams.toString()}`;
    navigator.clipboard.writeText(url).then(() => {
      toast.success("API URL copied to clipboard!");
    }).catch(() => {
      toast.error("Failed to copy API URL");
    });
  }, [id, page, LIMIT, tabValue, selectedActivity, selectedAssignmentType, sortByOption]);

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
      <WebinarAttendeesTableShell
        theme={theme}
        isDark={theme === "dark"}
        tabValue={tabValue}
        total={total}
        selectedActivity={selectedActivity}
        setSelectedActivity={setSelectedActivity}
        selectedAssignmentType={selectedAssignmentType}
        setSelectedAssignmentType={setSelectedAssignmentType}
        isFullScreen={isFullScreen}
        setIsFullScreen={setIsFullScreen}
        onOpenFilters={() =>
          dispatch({
            type: "modals/openModal",
            payload: AttendeesFilterModalName,
          })
        }
        onOpenExport={() =>
          dispatch({
            type: "modals/openModal",
            payload: exportExcelModalName,
          })
        }
        onOpenPresets={() => setPresetModalOpen(true)}
        filters={webinarAttendeesFilters}
        setApplyTagsModalOpen={setApplyTagsModalOpen}
        page={page}
        setPage={setPage}
        totalPages={totalPages}
        limit={LIMIT}
        tableHeader={tableHeader}
      >
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
          isLoading={isLoading}
        />
      </WebinarAttendeesTableShell>

      {/* Modals */}
      {AttendeesFilterModalOpen && (
        <Suspense fallback={<ModalFallback />}>
          <AttendeesFilterModal
            modalName={AttendeesFilterModalName}
            setPage={setPage}
            tabValue={tabValue}
            notAllowed={notAllowedFields}
            handleCopy={handleCopyApi}
          />
        </Suspense>
      )}

      {exportModalOpen && (
        <Suspense fallback={<ModalFallback />}>
          <ExportWebinarAttendeesModal
            modalName={exportExcelModalName}
            filters={webinarAttendeesFilters}
            isAttended={tabValue === "postWebinar"}
            webinarId={id}
            webinarName={webinarName}
            sort={sortByOption}
            validCall={selectedActivity === "All" ? undefined : selectedActivity}
            assignmentType={selectedAssignmentType === "All" ? undefined : selectedAssignmentType}
          />
        </Suspense>
      )}

      {isSwapOpen && (
        <Suspense fallback={<ModalFallback />}>
          <SwapAttendeeFieldsModal
            onClose={() => setSwapOpen(false)}
            attendees={selectedRows}
            total={total}
            onSubmit={(field1, field2, attendees) => {
              dispatch(
                swapAttendeeFields({
                  webinarId: id,
                  field1,
                  field2,
                  attendees,
                  filters: webinarAttendeesFilters || {},
                  isAttended: tabValue === "preWebinar" ? false : true,
                }),
              );
            }}
          />
        </Suspense>
      )}

      {applyTagsModalOpen && (
        <Suspense fallback={<ModalFallback />}>
          <ApplyTagsModal
            onClose={() => setApplyTagsModalOpen(false)}
            onSubmit={async (tag) => {
              await bulkApplyTags({
                webinarId: id,
                tag,
                isAttended: tabValue === "preWebinar" ? false : true,
                filters: webinarAttendeesFilters,
              });
            }}
            isLoading={isApplyingTags}
          />
        </Suspense>
      )}

      {bulkEnrollOpen && (
        <Suspense fallback={<ModalFallback />}>
          <BulkEnrollmentModal
            onClose={() => setBulkEnrollOpen(false)}
            webinarId={id}
            isAttended={tabValue === "preWebinar" ? false : true}
            selectedRows={selectedRows}
            total={total}
            filters={webinarAttendeesFilters}
            onSuccess={() => {
              setBulkEnrollOpen(false);
              setSelectedRows([]);
            }}
          />
        </Suspense>
      )}

      {deleteModal && (
        <Suspense fallback={<ModalFallback />}>
          <ConfirmDeleteModal
            setModal={setDeleteModal}
            triggerDelete={() => {
              dispatch(
                deleteWebinarAttendees({
                  webinarId: id,
                  attendees: selectedRows,
                  isAttended: tabValue === "preWebinar" ? false : true,
                  filters: webinarAttendeesFilters,
                }),
              );
            }}
            isLoading={isDeleting}
          />
        </Suspense>
      )}

      {presetModalOpen && (
        <Suspense fallback={<ModalFallback />}>
          <FilterPresetModal
            open={presetModalOpen}
            setIsPresetModalOpen={setPresetModalOpen}
            tableName={tabValue === "preWebinar" ? "preWebinarAttendeesTable" : "postWebinarAttendeesTable"}
            filters={webinarAttendeesFilters}
            setFilters={(next) => {
              dispatch(setWebinarAttendeesFilters({ 
                recordType: tabValue,
                filters: next || {} 
              }));
              setPage(1);
            }}
          />
        </Suspense>
      )}
    </div>
  );
};

export default WebinarAttendeesPage;
