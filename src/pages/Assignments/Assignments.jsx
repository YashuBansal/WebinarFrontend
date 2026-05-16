import React, {
  useEffect,
  useState,
  useLayoutEffect,
  useMemo,
  useRef,
  Suspense,
  lazy,
} from "react";
import { useSearchParams, useNavigate, useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  Tabs,
  Tab,
} from "@mui/material";
import { attendeeTableColumns } from "../../utils/columnData";
import {
  cancelRequestReAssignment,
  getAssignments,
  getAssignmentsSilently,
  getLeadType,
  requestReAssignment,
} from "../../features/actions/assign";
import { getEmployee } from "../../features/actions/employee";
const AttendeesFilterModal = lazy(() => import("../../components/Attendees/AttendeesFilterModal"));
import { getEmployeeWebinars } from "../../features/actions/webinarContact";
import {
  resetAssignedData,
  resetAssignSuccess,
} from "../../features/slices/assign";
import useAddUserActivity from "../../hooks/useAddUserActivity";
import {
  AssignmentStatus,
  errorToast,
  formatDateAsNumber,
  NotifActionType,
} from "../../utils/extra";
import { socket } from "../../socket";
import RequestReassignmentModal from "./ReAssigmentModal";
import { createPortal } from "react-dom";
import useRoles from "../../hooks/useRoles";
import { setWebinarAttendeesFilters } from "../../features/slices/filters.slice";
import { clearWebinarData } from "../../features/slices/webinarContact";
import ApplyTagsModal from "../../components/Webinar/ApplyTagsModal";
import { useApplyTagsToEmployeeAssignments } from "../../hooks/useTags";
import useUserSubscription from "../../hooks/useUserSubscription";
import { useTheme } from "../../contexts/ThemeContext";
const FilterPresetModal = lazy(() => import("../../components/Filter/FilterPresetModal"));
import { motion, AnimatePresence } from "framer-motion";
import WebinarAttendeesTableShell from "../../components/Attendees/WebinarAttendeesTableShell";
import { DynamicLeadsTable } from "../../components/Webinar/DynamicLeadsTable";
import ModalFallback from "../../components/Fallback/ModalFallback";
import { ChevronDown, Calendar, UserCheck, Activity, Tag as TagIcon, LayoutGrid } from "lucide-react";
import { cn } from "../../lib/utils";

const Assignments = () => {
  const employeeId = useParams()?.id;
  const navigate = useNavigate();
  const addUserActivity = useAddUserActivity();
  const roles = useRoles();

  // ----------------------- ModalNames for Redux -----------------------
  const filterModalName = "ViewAssignmentsFilterModal";
  const tableHeader = "Assignments Table";
  const exportExcelModalName = "ExportViewAssignmentsExcel";
  // ----------------------- etcetra -----------------------
  const dispatch = useDispatch();

  const [selectedRows, setSelectedRows] = useState([]);

  const { userData } = useSelector((state) => state.auth);
  const { data: subscription } = useUserSubscription();

  const { singleEmployeeData } = useSelector((state) => state.employee);

  const semething = useMemo(() => {
    const targetRole = singleEmployeeData?.role || userData?.role;
    return roles.getRoleNameById(targetRole) === "EMPLOYEE SALES"
      ? "postWebinar"
      : "preWebinar";
  }, [singleEmployeeData, userData, roles]);

  const assignmentMetrics = subscription?.plan?.assignmentMetrics || false;
  const { assignData, isLoading, isSuccess, pagination, leadTypeData } =
    useSelector((state) => state.assign);
  const { total = 0, totalPages = 1 } = pagination;

  const { webinarData } = useSelector((state) => state.webinarContact);
  const LIMIT = useSelector((state) => state.pageLimits[tableHeader] || 10);
  const modalState = useSelector((state) => state.modals.modals);
  const filterModalOpen = modalState[filterModalName] ? true : false;
  const resetFilterRef = useRef(false);

  const [searchParams, setSearchParams] = useSearchParams();
  const [page, setPage] = useState(Number(searchParams.get("page")) || 1);
  const {
    webinarAttendeesSortBy,
    webinarAttendeesFilters,
    salesAttendeesSortBy,
  } = useSelector((state) => state.filters);

  const sortByOption =
    semething === "preWebinar" ? webinarAttendeesSortBy : salesAttendeesSortBy;

  const [currentWebinar, setCurrentWebinar] = useState(
    searchParams.get("webinarId") || ""
  );
  const [selected, setSelected] = useState(
    searchParams.get("activity") || "Pending"
  );
  const [tabValue, setTabValue] = useState(
    searchParams.get("tabValue") || AssignmentStatus.ACTIVE
  );
  const [openReassignModal, setOpenReassignModal] = useState(false);
  const [notAllowedColumns, setNotAllowedColumns] = useState([
    "enrollments",
    "isAssigned",
  ]);
  const [applyTagsModalOpen, setApplyTagsModalOpen] = useState(false);
  const [presetModalOpen, setPresetModalOpen] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const { isDark } = useTheme();
  const theme = isDark ? "dark" : "light";

  useEffect(() => {
    const currentParams = Object.fromEntries([...searchParams.entries()]);

    const newParams = {
      page: page,
      webinarId: currentWebinar,
      tabValue: tabValue,
      activity: selected,
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
        if (newParams[key]) {
          paramsToSet[key] = newParams[key];
        }
      }
      setSearchParams(paramsToSet, { replace: true });
    }
  }, [page, currentWebinar, tabValue, selected, searchParams, setSearchParams]);

  useEffect(() => {
    if (currentWebinar) {
      dispatch(
        getAssignments({
          id: employeeId || userData?._id,
          page,
          limit: LIMIT,
          filters: webinarAttendeesFilters,
          sort: sortByOption,
          webinarId: currentWebinar,
          validCall:
            selected === "All" || tabValue !== AssignmentStatus.ACTIVE
              ? undefined
              : selected,
          assignmentStatus: tabValue,
        })
      );
    }
  }, [
    page,
    LIMIT,
    webinarAttendeesFilters,
    selected,
    tabValue,
    currentWebinar,
  ]);

  useEffect(() => {
    if (isSuccess) {
      setSelectedRows([]);
      setOpenReassignModal(false);
      dispatch(resetAssignSuccess());
      if (totalPages > 1 && currentWebinar)
        console.log("333333333333333 ---> ");

      dispatch(
        getAssignments({
          id: employeeId || userData?._id,
          page: 1,
          limit: LIMIT,
          filters: webinarAttendeesFilters,
          sort: sortByOption,
          webinarId: currentWebinar,
          validCall: selected === "All" ? undefined : selected,
          assignmentStatus: tabValue,
        })
      );
    }
  }, [isSuccess]);

  useLayoutEffect(() => {
    dispatch(getEmployeeWebinars({ employeeId }));
    dispatch(getLeadType());
    if (employeeId) {
      dispatch(getEmployee(employeeId));
    }
    return () => {
      dispatch(resetAssignedData());
      console.log("resetting data", resetFilterRef.current);
      if (!resetFilterRef.current) {
        dispatch(setWebinarAttendeesFilters());
      }
      dispatch(clearWebinarData());
    };
  }, []);

  useEffect(() => {
    if (
      Array.isArray(webinarData) &&
      webinarData.length > 0 &&
      !currentWebinar
    ) {
      setCurrentWebinar(webinarData[0]._id);
      setPage(1);
    }
  }, [webinarData]);

  useEffect(() => {
    function onNotification(data) {
      if (
        currentWebinar &&
        (data.actionType === NotifActionType.ASSIGNMENT ||
          data.actionType === NotifActionType.REASSIGNMENT)
      )
        if (page === 1) {
          dispatch(
            getAssignmentsSilently({
              id: employeeId || userData?._id,
              page: 1,
              limit: LIMIT,
              filters: webinarAttendeesFilters,
              sort: sortByOption,
              webinarId: currentWebinar,
              validCall: selected === "All" ? undefined : selected,
              assignmentStatus: tabValue,
            })
          );
        } else setPage(1);

      if (data.actionType === NotifActionType.WEBINAR_ASSIGNMENT) {
        dispatch(getEmployeeWebinars({ employeeId }));
      }
    }
    socket.on("notification", onNotification);
    return () => {
      socket.off("notification", onNotification);
    };
  }, [
    page,
    LIMIT,
    webinarAttendeesFilters,
    selected,
    tabValue,
    currentWebinar,
  ]);

  useEffect(() => {
    const isExist = notAllowedColumns.some(
      (column) => column === "timeInSession"
    );

    console.log(roles.getRoleNameById(userData?.role), isExist);

    if (roles.getRoleNameById(userData?.role) === "EMPLOYEE SALES" && isExist) {
      setNotAllowedColumns((prevColumns) =>
        prevColumns.filter((column) => column !== "timeInSession")
      );
    } else if (
      roles.getRoleNameById(userData?.role) === "EMPLOYEE REMINDER" &&
      !isExist
    ) {
      setNotAllowedColumns((prevColumns) => [...prevColumns, "timeInSession"]);
    }
  }, [roles, userData]);

  const handleViewFullDetails = (item) => {
    resetFilterRef.current = true;
    const recordType = item?.isAttended ? "postWebinar" : "preWebinar";
    navigate(
      `/particularContact?email=${item?.email}&attendeeId=${item?.attendeeId}`
    );
    addUserActivity({
      action: "viewDetails",
      details: `User viewed details of Attendee with Email: ${item?.email} and Record Type: ${recordType}`,
    });
  };

  const handleReassignRequest = (requestReason) => {
    if (selectedRows.length === 0) return;

    const attendeeEmails = assignData
      .filter((row) => selectedRows.includes(row._id))
      .map((a) => a.email);

    dispatch(
      requestReAssignment({
        assignments: selectedRows,
        attendeeEmails: attendeeEmails,
        webinarId: currentWebinar,
        requestReason,
      })
    );
  };

  const ALL_COLUMNS = useMemo(() => {
    const baseColumns = attendeeTableColumns
      .filter((column) => !notAllowedColumns.includes(column.key))
      .map((col) => {
        // Map keys to what DynamicLeadsTable expects for special formatting
        let key = col.key;
        if (col.key === "isAssigned") key = "assignedTo";
        if (col.key === "createdAt") key = "dateTime";
        if (col.key === "registeredCount") key = "registeredWebinars";
        if (col.key === "attendedCount") key = "attendedWebinars";
        if (col.key === "timeInSession") key = "pastWebinarDuration";

        return {
          key: key,
          label: col.header,
          dataKey: col.key,
          widthKey: col.key,
          sortable: true,
          locked: col.key === "email" || col.key === "serialNo",
        };
      });

    return [
      {
        key: "serialNo",
        label: "S.No",
        dataKey: "serialNo",
        widthKey: "serialNo",
        sortable: false,
        locked: true,
      },
      ...baseColumns,
      {
        key: "actions",
        label: "Actions",
        dataKey: "actions",
        widthKey: "actions",
        sortable: false,
        locked: true,
        variant: tabValue === AssignmentStatus.REASSIGN_REQUESTED ? "cancel" : "delete",
      },
    ];
  }, [notAllowedColumns, tabValue]);

  const tableData = useMemo(() => {
    return {
      totalRecords: total,
      rows: assignData.map((row) => ({
        ...row,
        leadType: leadTypeData.find((lead) => lead._id === row?.leadType),
      })),
    };
  }, [assignData, leadTypeData]);

  const columnWidths = useMemo(() => {
    const widths = {
      serialNo: 60,
      actions: 120,
    };
    attendeeTableColumns.forEach((col) => {
      widths[col.key] = col.width * 5 || 150;
    });
    return widths;
  }, []);

  const columnVisibility = useMemo(() => {
    return ALL_COLUMNS.reduce((acc, col) => ({ ...acc, [col.key]: true }), {});
  }, [ALL_COLUMNS]);

  const targetEmployeeId = employeeId || userData?._id;

  const {
    mutateAsync: applyTagsForEmployee,
    isPending: isApplyingTags,
  } = useApplyTagsToEmployeeAssignments(targetEmployeeId, () => {
    // After tagging, refetch assignments
    if (currentWebinar) {
      dispatch(
        getAssignments({
          id: targetEmployeeId,
          page: 1,
          limit: LIMIT,
          filters: webinarAttendeesFilters,
          sort: sortByOption,
          webinarId: currentWebinar,
          validCall:
            selected === "All" || tabValue !== AssignmentStatus.ACTIVE
              ? undefined
              : selected,
          assignmentStatus: tabValue,
        })
      );
    }
    setApplyTagsModalOpen(false);
  });

  // ----------------------- Action Icons -----------------------

  const actionIcons = useMemo(() => {
    const icons = [
      {
        icon: () => (
          <img
            src={VisibilityIcon}
            alt="Bookmark"
            className="min-h-6 h-6 w-6 min-w-6"
          />
        ),
        tooltip: "View Attendee Info",
        type: "attendee-link",
      },
      ...(tabValue === AssignmentStatus.ACTIVE
        ? []
        : [
          {
            icon: () => (
              <CancelIcon className="text-red-500 group-hover:text-red-600" />
            ),
            tooltip: "Cancel Re-Assignment Request",
            onClick: (item) => {
              dispatch(
                cancelRequestReAssignment({
                  assignments: [item._id],
                  attendeeEmails: [item?.email],
                  webinarId: item?.webinar,
                  requestReason: "cancelled",
                })
              );
            },
          },
        ]),
    ];

    return icons;
  }, [tabValue]);

  const handleSort = (column) => {
    const currentSortBy = sortByOption?.sortBy;
    const currentSortOrder = sortByOption?.sortOrder;

    let newSortBy = column;
    let newSortOrder = "desc";

    if (currentSortBy === column) {
      if (currentSortOrder === "desc") {
        newSortOrder = "asc";
      } else {
        newSortBy = "";
        newSortOrder = "";
      }
    }

    dispatch(
      setWebinarAttendeesFilters({
        recordType: semething,
        sortBy: {
          sortBy: newSortBy,
          sortOrder: newSortOrder,
        },
      })
    );
  };
  return (
    <div className="md:px-10 pt-10 min-h-screen">
      <div className="flex justify-center mb-8">
        <Tabs
          value={tabValue}
          onChange={(e, newValue) => {
            setSelectedRows([]);
            setTabValue(newValue);
          }}
          centered
          className="bg-white/50 dark:bg-slate-900/50 backdrop-blur-md p-1 rounded-2xl border border-slate-200 dark:border-slate-800"
          textColor="primary"
          indicatorColor="primary"
          sx={{
            "& .MuiTabs-indicator": {
              height: "100%",
              borderRadius: "12px",
              zIndex: 0,
              backgroundColor: "rgba(59, 130, 246, 0.1)",
            },
            "& .MuiTab-root": {
              zIndex: 1,
              minHeight: "44px",
              borderRadius: "12px",
              margin: "0 4px",
              fontWeight: 600,
              textTransform: "none",
              color: isDark ? "#94a3b8" : "#64748b",
              "&.Mui-selected": {
                color: "#3b82f6",
              },
            },
          }}
        >
          <Tab label="Assignments" value={AssignmentStatus.ACTIVE} />
          <Tab label="ReAssignments" value={AssignmentStatus.REASSIGN_REQUESTED} />
        </Tabs>
      </div>

      <div className="flex items-center mb-8 gap-4 flex-wrap justify-between">
        <div className="flex items-center gap-3">
          {userData?.isActive && assignmentMetrics && (
            <button
              onClick={() => {
                resetFilterRef.current = true;
                navigate(`/assignment-metrics`);
              }}
              className="group relative px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl transition-all duration-300 shadow-lg shadow-indigo-500/20 flex items-center gap-2 overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
              <Activity className="w-4 h-4" />
              Assign Metrics
            </button>
          )}

          {userData?.isActive && tabValue === AssignmentStatus.ACTIVE && (
            <button
              onClick={() => setApplyTagsModalOpen(true)}
              className="px-6 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-sm font-semibold rounded-xl hover:bg-slate-50 dark:hover:bg-slate-750 transition-all shadow-sm flex items-center gap-2"
            >
              <TagIcon className="w-4 h-4 text-slate-400" />
              Apply Tags
            </button>
          )}

          {selectedRows.length > 0 &&
            userData?.isActive &&
            tabValue === AssignmentStatus.ACTIVE && (
              <motion.button
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                onClick={() => {
                  if (currentWebinar === "all") {
                    errorToast("Please Select a Webinar First");
                    return;
                  }
                  setOpenReassignModal(true);
                }}
                className="px-6 py-2.5 bg-rose-500 hover:bg-rose-600 text-white text-sm font-semibold rounded-xl transition-all shadow-lg shadow-rose-500/20 flex items-center gap-2"
              >
                <LayoutGrid className="w-4 h-4" />
                Request ReAssignment ({selectedRows.length})
              </motion.button>
            )}
        </div>

        <div className="flex flex-col gap-1.5 min-w-[280px]">
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 ml-1">Select Webinar</label>
          <div className="relative group">
            <select
              value={currentWebinar}
              onChange={(e) => {
                setCurrentWebinar(e.target.value);
                setPage(1);
                setSelectedRows([]);
                dispatch(setWebinarAttendeesFilters());
              }}
              className="w-full h-11 pl-4 pr-10 rounded-xl text-sm font-semibold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none appearance-none cursor-pointer transition-all shadow-sm"
            >
              <option value="all">All Webinars</option>
              {webinarData.map((webinar, index) => (
                <option key={index} value={webinar._id}>
                  {webinar?.webinarName} - {formatDateAsNumber(webinar?.webinarDate)}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none group-hover:text-blue-500 transition-colors" />
          </div>
        </div>
      </div>

      <WebinarAttendeesTableShell
        theme={theme}
        isDark={isDark}
        tabValue={semething}
        total={total}
        selectedActivity={selected}
        setSelectedActivity={setSelected}
        showAssignmentType={false}
        showActivityStatus={tabValue === AssignmentStatus.ACTIVE}
        showExport={false}
        isFullScreen={isFullScreen}
        setIsFullScreen={setIsFullScreen}
        onOpenFilters={() => dispatch({ type: "modals/openModal", payload: filterModalName })}
        onOpenExport={() => dispatch({ type: "modals/openModal", payload: exportExcelModalName })}
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
            onViewClick: handleViewFullDetails,
            onDeleteClick: (item) => {
              if (tabValue === AssignmentStatus.REASSIGN_REQUESTED) {
                dispatch(
                  cancelRequestReAssignment({
                    assignments: [item._id],
                    attendeeEmails: [item?.email],
                    webinarId: item?.webinar,
                    requestReason: "cancelled",
                  })
                );
              }
            },
          }))}
          selectedRows={selectedRows}
          onToggleSelect={(id) => {
            setSelectedRows((prev) => {
              if (prev.includes(id)) return prev.filter((rowId) => rowId !== id);
              return [...prev, id];
            });
          }}
          onToggleSelectAll={(checked, allIds) => {
            if (checked) setSelectedRows(allIds);
            else setSelectedRows([]);
          }}
          attendees={tableData.rows}
          columnWidths={columnWidths}
          columnVisibility={columnVisibility}
          sortColumn={sortByOption?.sortBy}
          sortDirection={sortByOption?.sortOrder}
          resizingColumn={null}
          theme={theme}
          indexOfFirstItem={(page - 1) * LIMIT}
          sortedAttendees={tableData.rows}
          onSort={handleSort}
          isLoading={isLoading}
        />
      </WebinarAttendeesTableShell>

      {filterModalOpen && (
        <Suspense fallback={<ModalFallback />}>
          <AttendeesFilterModal
            notAllowed={notAllowedColumns}
            modalName={filterModalName}
            setPage={setPage}
            label="Assignments Filter"
            tabValue={semething}
            onTrigger={() => setSelected("All")}
          />
        </Suspense>
      )}
      {openReassignModal &&
        createPortal(
          <RequestReassignmentModal
            onClose={() => setOpenReassignModal(false)}
            onSubmit={(reason) => handleReassignRequest(reason)}
          />,
          document.body
        )}
      {applyTagsModalOpen &&
        createPortal(
          <ApplyTagsModal
            onClose={() => setApplyTagsModalOpen(false)}
            onSubmit={async (tag) => {
              const normalizedWebinarId =
                currentWebinar && currentWebinar !== "all"
                  ? currentWebinar
                  : undefined;

              await applyTagsForEmployee({
                webinarId: normalizedWebinarId,
                filters: webinarAttendeesFilters,
                validCall:
                  selected === "All" || tabValue !== AssignmentStatus.ACTIVE
                    ? undefined
                    : selected,
                assignmentStatus: tabValue,
                tag,
              });
            }}
            isLoading={isApplyingTags}
          />,
          document.body
        )}
      {presetModalOpen && (
        <Suspense fallback={<ModalFallback />}>
          <FilterPresetModal
            open={presetModalOpen}
            setIsPresetModalOpen={setPresetModalOpen}
            tableName={tableHeader}
            filters={webinarAttendeesFilters}
            setFilters={(next) => {
              dispatch(
                setWebinarAttendeesFilters({
                  recordType: semething,
                  filters: next || {},
                })
              );
              setPage(1);
            }}
          />
        </Suspense>
      )}
    </div>
  );
};

export default Assignments;
