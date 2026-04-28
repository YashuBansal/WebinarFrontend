import React, {
  useEffect,
  useState,
  useMemo,
  useCallback,
  useRef,
  lazy,
  Suspense,
} from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import useAddUserActivity from "../../hooks/useAddUserActivity";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  ChevronDown,
  Tag,
  Activity,
  FileText,
  ClipboardList,
  Search,
  Filter,
  Bookmark,
  Maximize,
  Minimize,
  RotateCcw,
  Download,
} from "lucide-react";

import {
  getUserActivity,
  getUserActivitySilently,
} from "../../features/actions/userActivity";
import { useDispatch, useSelector } from "react-redux";
import UserActivityTable from "../../components/Table/UserActivityTable";
import DataTable from "../../components/Table/DataTable";
import { attendeeTableColumns } from "../../utils/columnData";
import { openModal } from "../../features/slices/modalSlice";
import EmployeeAssignmentsFilterModal from "./modal/EmployeeAssignmentsFilterModal";
import { getAssignments } from "../../features/actions/assign";
import {
  AssignmentStatus,
  formatDateAsNumber,
  SocketEvents,
} from "../../utils/extra";
import { useLayoutEffect } from "react";
import { getEmployeeWebinars } from "../../features/actions/webinarContact";
import { clearWebinarData } from "../../features/slices/webinarContact";
import useRoles from "../../hooks/useRoles";
import { socket } from "../../socket";
import { VisibilityIcon } from "../../components/SVGs";
import { resetAssignedData } from "../../features/slices/assign";
import { setWebinarAttendeesFilters } from "../../features/slices/filters.slice";
import { exportUserActivitiesByUser } from "../../features/actions/export-excel";
import ModalFallback from "../../components/Fallback/ModalFallback";
import { resetUserActivities } from "../../features/slices/userActivity";
import ApplyTagsModal from "../../components/Webinar/ApplyTagsModal";
import { useApplyTagsToEmployeeAssignments } from "../../hooks/useTags";
import { useTheme } from "../../contexts/ThemeContext";
import FilterPresetModal from "../../components/Filter/FilterPresetModal";
import { Button } from "../../components/ui/button";
import { Eye } from "lucide-react";
import AppLoader from "../../components/AppLoader";

const ExportEmployeeAssignments = lazy(
  () => import("../../components/Export/ExportEmployeeAssignments"),
);

const ViewEmployee = () => {
  const { theme } = useTheme();
  const [portalTarget, setPortalTarget] = useState(null);

  // ----------------------- ModalNames for Redux -----------------------
  const filterModalName = "ViewAssignmentsFilterModal";
  const exportExcelModalName = "ExportViewAssignmentsExcel";
  // ----------------------- etcetra -----------------------

  const userActivityTableHeader = "User Activity Table";
  const userActivityLimit = useSelector(
    (state) => state.pageLimits[userActivityTableHeader] || 10,
  );

  const { id } = useParams();
  const logUserActivity = useAddUserActivity();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const roles = useRoles();

  const [tableHeader, setTableHeader] = useState("Employee Assignments Table");
  const [searchParams, setSearchParams] = useSearchParams();
  const [filters, setFilters] = useState({});
  const role = searchParams.get("role");
  if (!role) {
    navigate("/employees");
  }

  const {
    webinarAttendeesSortBy,
    webinarAttendeesFilters,
    salesAttendeesSortBy,
  } = useSelector((state) => state.filters);

  const sortByOption = useMemo(
    () =>
      role === "EMPLOYEE_SALES" || role === roles.EMPLOYEE_SALES
        ? salesAttendeesSortBy
        : webinarAttendeesSortBy,
    [role, salesAttendeesSortBy, webinarAttendeesFilters, roles],
  );

  const { assignData, isLoading, isSuccess, leadTypeData, pagination } =
    useSelector((state) => state.assign);
  const { totalPages = 1, total = 0 } = pagination;
  const { locationsData } = useSelector((state) => state.location);
  const { userData } = useSelector((state) => state.auth);

  const { webinarData } = useSelector((state) => state.webinarContact);
  const modalState = useSelector((state) => state.modals.modals);
  const filterModalOpen = modalState[filterModalName] ? true : false;
  const exportModalOpen = modalState[exportExcelModalName] ? true : false;

  const userName = searchParams.get("userName");
  const [tabValue, setTabValue] = useState(
    searchParams.get("tabValue") || "assignments",
  );
  const LIMIT = useSelector((state) => state.pageLimits[tableHeader] || 10);
  const [page, setPage] = useState(Number(searchParams.get("page")) || 1);
  // --- NEW FILTER FORM STATE ---
  const [filterForm, setFilterForm] = useState({
    email: '', firstName: '', lastName: '',
    gender: '', minTime: '', maxTime: '',
    phone: '', location: '', profession: '',
    source: '', status: '', leadType: '',
    tags: '', dateFrom: '', dateTo: '',
    sortBy: 'Time in Session', sortOrder: 'Z - A'
  });

  const handleApplyFilters = () => {
    // Yahan aap apne Redux mein filters bhej sakte hain
    dispatch(setWebinarAttendeesFilters({ filters: filterForm }));
    // dispatch(closeModal(filterModalName)); // Modal close karne ke liye
    setPage(1);
  };

  const handleResetFilters = () => {
    const resetState = {
      email: '', firstName: '', lastName: '', gender: '', minTime: '', maxTime: '',
      phone: '', location: '', profession: '', source: '', status: '', leadType: '',
      tags: '', dateFrom: '', dateTo: '', sortBy: 'Time in Session', sortOrder: 'Z - A'
    };
    setFilterForm(resetState);
    dispatch(setWebinarAttendeesFilters({ filters: {} }));
  };
  const [currentWebinar, setCurrentWebinar] = useState(
    searchParams.get("webinarId") || "",
  );
  const [validCallFlag, setValidCallFlag] = useState(
    searchParams.get("valid-call") || "all",
  );

  const [applyTagsModalOpen, setApplyTagsModalOpen] = useState(false);
  const [assignmentSearchValue, setAssignmentSearchValue] = useState("");
  const [presetModalOpen, setPresetModalOpen] = useState(false);
  const [isTableFullscreen, setIsTableFullscreen] = useState(false);

  const resetFilterRef = useRef(false);

  useEffect(() => {
    setPortalTarget(document.body);
  }, []);

  useEffect(() => {
    const currentParams = Object.fromEntries([...searchParams.entries()]);
    const newParams = {
      page: page,
      tabValue: tabValue,
      role: role,
      webinarId: currentWebinar,
      userName: userName,
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
          paramsToSet[key] = String(newParams[key]);
        }
      }
      setSearchParams(paramsToSet, { replace: true });
    }
  }, [
    page,
    tabValue,
    currentWebinar,
    role,
    userName,
    searchParams,
    setSearchParams,
  ]);

  useEffect(() => {
    return () => {
      dispatch(resetAssignedData());
      dispatch(clearWebinarData());
      dispatch(resetUserActivities());
      if (!resetFilterRef.current) {
        dispatch(setWebinarAttendeesFilters({ filters: {} }));
      }
    };
  }, [dispatch]);

  const fetchEmployeeActivityLogs = useCallback(() => {
    if (tabValue === "activityLogs")
      dispatch(
        getUserActivity({ id, page: page, limit: userActivityLimit, filters }),
      );
  }, [page, userActivityLimit, dispatch, tabValue, filters, id]);

  const fetchEmployeeActivityLogsSilently = useCallback(() => {
    if (tabValue === "activityLogs")
      dispatch(
        getUserActivitySilently({ id, page: page, limit: LIMIT, filters }),
      );
  }, [page, LIMIT, dispatch, tabValue, filters, id]);

  const exportEmployeeActivityLogs = useCallback(
    (limit, columns) => {
      dispatch(
        exportUserActivitiesByUser({ limit, columns, filters, userId: id }),
      );
    },
    [dispatch, filters, id],
  );

  const fetchEmployeeAssignments = useCallback(
    (validCall) => {
      if (currentWebinar)
        dispatch(
          getAssignments({
            id,
            page,
            limit: LIMIT,
            filters: webinarAttendeesFilters,
            sort: sortByOption,
            webinarId: currentWebinar,
            assignmentStatus: AssignmentStatus.ACTIVE,
            validCall,
            validCallFlag,
          }),
        );
    },
    [
      page,
      LIMIT,
      webinarAttendeesFilters,
      sortByOption,
      currentWebinar,
      validCallFlag,
      dispatch,
      id,
    ],
  );

  useEffect(() => {
    function onNotification() {
      fetchEmployeeActivityLogsSilently();
    }
    if (socket) socket.on(SocketEvents.EMPLOYEE_ACTIVITY_LOG, onNotification);
    return () => {
      if (socket)
        socket.off(SocketEvents.EMPLOYEE_ACTIVITY_LOG, onNotification);
    };
  }, [fetchEmployeeActivityLogsSilently]);

  useEffect(() => {
    if (tabValue === "activityLogs") fetchEmployeeActivityLogs();
    else if (tabValue === "history") fetchEmployeeAssignments("Worked");
    else fetchEmployeeAssignments("Pending");
  }, [tabValue, fetchEmployeeActivityLogs, fetchEmployeeAssignments]);

  useLayoutEffect(() => {
    dispatch(getEmployeeWebinars({ employeeId: id }));
  }, [dispatch, id]);

  useEffect(() => {
    if (
      Array.isArray(webinarData) &&
      webinarData.length > 0 &&
      !currentWebinar
    ) {
      setCurrentWebinar(webinarData[0]._id);
      setPage(1);
    }
  }, [webinarData, currentWebinar]);

  const notAllowedColumns = useMemo(
    () =>
      role === "EMPLOYEE_SALES" || role === roles.EMPLOYEE_SALES
        ? ["enrollments", "isAssigned", "attendedCount", "registeredCount"]
        : [
          "enrollments",
          "isAssigned",
          "attendedCount",
          "registeredCount",
          "timeInSession",
        ],
    [role, roles],
  );

  const tableData = useMemo(() => {
    return {
      columns: attendeeTableColumns.filter(
        (column) => !notAllowedColumns.includes(column.key),
      ),
      totalRecords: total,
      rows: assignData.map((row) => ({
        ...row,
        leadType: leadTypeData.find((lead) => lead._id === row?.leadType),
      })),
    };
  }, [assignData, leadTypeData, notAllowedColumns, total]);

  const filteredAssignmentRows = useMemo(() => {
    const query = assignmentSearchValue.trim().toLowerCase();
    if (!query) return tableData.rows || [];
    return (tableData.rows || []).filter((row) => {
      const blob = tableData.columns
        .map((column) => {
          const value = row?.[column.key];
          if (value == null) return "";
          if (typeof value === "object") {
            if (value?.name) return String(value.name);
            if (value?.userName) return String(value.userName);
            return "";
          }
          return String(value);
        })
        .join(" ")
        .toLowerCase();
      return blob.includes(query);
    });
  }, [assignmentSearchValue, tableData]);

  const { mutateAsync: applyTagsForEmployee, isPending: isApplyingTags } =
    useApplyTagsToEmployeeAssignments(id, () => {
      if (tabValue === "history") {
        fetchEmployeeAssignments("Worked");
      } else {
        fetchEmployeeAssignments("Pending");
      }
      setApplyTagsModalOpen(false);
    });

  const handleTabChange = (newValue) => {
    setTabValue(newValue);
    if (newValue === "activityLogs") {
      setTableHeader("activityLogs");
    } else {
      setTableHeader("Employee Assignments Table");
    }
    setPage(1);
    logUserActivity({
      action: "switch",
      type: "tab",
      detailItem: newValue,
    });
  };

  const actionIcons = [
    {
      icon: () => (
        <img
          src={VisibilityIcon}
          alt="View"
          className="min-h-6 h-6 w-6 min-w-6"
        />
      ),
      tooltip: "View Attendee Info",
      onClick: (item) => {
        resetFilterRef.current = true;
        navigate(
          `/particularContact?email=${item?.email}&attendeeId=${item?._id}`,
        );
      },
    },
  ];

  // --- STYLING HELPERS ---
  const panelBg = theme === "dark" ? "#1e293b" : "#ffffff";
  const panelBorder = theme === "dark" ? "#334155" : "#e5e7eb";
  const textColor = theme === "dark" ? "#f8fafc" : "#0f172a";
  const mutedText = theme === "dark" ? "#94a3b8" : "#64748b";
  const inputStyle = {
    backgroundColor: theme === "dark" ? "#0f172a" : "#ffffff",
    border: `1px solid ${panelBorder}`,
    color: textColor,
  };

  const WebinarDropdown = () => {
    return (
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative">
          <select
            className="pl-4 pr-10 py-2 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 appearance-none cursor-pointer font-medium transition-all hover:border-blue-400"
            style={inputStyle}
            value={currentWebinar}
            onChange={(e) => {
              setCurrentWebinar(e.target.value);
              setPage(1);
            }}
          >
            <option value="all">All Webinars</option>
            {Array.isArray(webinarData) && webinarData.map((webinar, index) => (
              <option key={index} value={webinar._id}>
                {webinar?.webinarName} -{" "}
                {formatDateAsNumber(webinar?.webinarDate)}
              </option>
            ))}
          </select>
          <ChevronDown
            className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none"
            style={{ color: mutedText }}
          />
        </div>

        {tabValue === "history" && (
          <div className="relative">
            <select
              className="pl-4 pr-10 py-2 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 appearance-none cursor-pointer font-medium transition-all hover:border-blue-400"
              style={inputStyle}
              value={validCallFlag}
              onChange={(e) => {
                setValidCallFlag(e.target.value);
                setPage(1);
              }}
            >
              <option value="all">All Status</option>
              <option value="valid">Valid Calls</option>
              <option value="invalid">Invalid Calls</option>
            </select>
            <ChevronDown
              className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none"
              style={{ color: mutedText }}
            />
          </div>
        )}
      </div>
    );
  };

  const profileBadgeLabel = roles.getRoleNameById(role);

  const badgeStyles = useMemo(() => {
    const isDark = theme === "dark";
    const name = profileBadgeLabel.toUpperCase();
    if (name.includes("SALES")) {
      return {
        backgroundColor: isDark ? "rgba(249, 115, 22, 0.2)" : "#fff7ed",
        color: isDark ? "#fb923c" : "#ea580c",
        border: `1px solid ${isDark ? "rgba(249, 115, 22, 0.3)" : "#ffedd5"}`,
      };
    }
    if (name.includes("REMINDER")) {
      return {
        backgroundColor: isDark ? "rgba(59, 130, 246, 0.2)" : "#eff6ff",
        color: isDark ? "#60a5fa" : "#2563eb",
        border: `1px solid ${isDark ? "rgba(59, 130, 246, 0.3)" : "#bfdbfe"}`,
      };
    }
    if (name.includes("ADMIN")) {
      return {
        backgroundColor: isDark ? "rgba(139, 92, 246, 0.2)" : "#f5f3ff",
        color: isDark ? "#a78bfa" : "#7c3aed",
        border: `1px solid ${isDark ? "rgba(139, 92, 246, 0.3)" : "#ddd6fe"}`,
      };
    }
    return {
      backgroundColor: isDark ? "rgba(148, 163, 184, 0.2)" : "#f8fafc",
      color: isDark ? "#94a3b8" : "#64748b",
      border: `1px solid ${isDark ? "rgba(148, 163, 184, 0.3)" : "#e2e8f0"}`,
    };
  }, [profileBadgeLabel, theme]);

  const renderAssignmentCell = (row, column) => {
    const value = row?.[column.key];
    if (value == null || value === "") {
      return <span className="italic text-red-400">N/A</span>;
    }
    if (typeof value === "object") {
      if (value?.name) return value.name;
      if (value?.userName) return value.userName;
      return "N/A";
    }
    if (Array.isArray(value)) {
      return value.length ? value.join(", ") : "N/A";
    }
    return String(value);
  };

  const getAssignmentTableUI = (isFs) => (
    <motion.div
      key={isFs ? "employeeAssignmentsShell-fs" : "employeeAssignmentsShell-normal"}
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={!isFs ? { opacity: 0, x: 10 } : undefined}
      className={`rounded-2xl overflow-hidden border flex flex-col transition-all duration-300 ${isFs ? "flex-1 h-full shadow-2xl" : ""
        }`}
      style={{
        background: isFs
          ? panelBg
          : theme === "dark"
            ? "rgba(30, 41, 59, 0.7)"
            : "rgba(255, 255, 255, 0.7)",
        backdropFilter: isFs ? "none" : "blur(16px)",
        borderColor: theme === "dark" ? "rgba(255,255,255,0.05)" : panelBorder,
      }}
    >
      <div
        className="p-4 border-b flex flex-col lg:flex-row items-center justify-between gap-4"
        style={{
          borderColor: theme === "dark" ? "#334155" : "rgba(0,0,0,0.05)",
        }}
      >
        <div className="flex flex-col sm:flex-row items-center gap-4 w-full lg:w-auto">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search email, location, source..."
              value={assignmentSearchValue}
              onChange={(e) => setAssignmentSearchValue(e.target.value)}
              className="pl-9 pr-9 py-2 w-full rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#22B573]/35 transition-all"
              style={inputStyle}
            />
          </div>
          {WebinarDropdown()}
        </div>
        <div className="flex items-center gap-2 self-end lg:self-auto w-full lg:w-auto">
          {Object.keys(webinarAttendeesFilters || {}).length > 0 && (
            <button
              type="button"
              onClick={() => dispatch(setWebinarAttendeesFilters({ filters: {} }))}
              className="rounded-xl flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium transition-all flex-1 sm:flex-none"
              style={{
                backgroundColor: "transparent",
                color: "#ef4444",
                border: "1px solid rgba(239, 68, 68, 0.3)",
              }}
            >
              <RotateCcw className="w-4 h-4" />
              <span className="hidden sm:inline">Reset</span>
            </button>
          )}
          <button
            type="button"
            onClick={() => setExportModalOpen(true)}
            className="rounded-xl flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium hover:bg-black/5 transition-all flex-1 sm:flex-none"
            style={inputStyle}
          >
            <Download className="w-4 h-4 text-gray-500" />
            <span className="hidden sm:inline">Export</span>
          </button>
          <button
            type="button"
            onClick={() => setPresetModalOpen(true)}
            className="rounded-xl flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium hover:bg-black/5 transition-all flex-1 sm:flex-none"
            style={inputStyle}
          >
            <Bookmark className="w-4 h-4 text-gray-500" />
            <span className="hidden sm:inline">Presets</span>
          </button>
          <button
            type="button"
            onClick={() => dispatch(openModal(filterModalName))}
            className="rounded-xl flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium hover:bg-black/5 transition-all flex-1 sm:flex-none relative"
            style={inputStyle}
          >
            <Filter className="w-4 h-4 text-gray-500" />
            <span className="hidden sm:inline">Filters</span>
            {Object.keys(webinarAttendeesFilters || {}).length > 0 && (
              <span className="ml-1 bg-blue-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                {Object.keys(webinarAttendeesFilters).length}
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={() => setIsTableFullscreen((prev) => !prev)}
            className="rounded-xl flex items-center justify-center p-2.5 flex-shrink-0 hover:bg-black/5 transition-all"
            style={inputStyle}
            title={isFs ? "Exit Fullscreen" : "Fullscreen"}
          >
            {isFs ? (
              <Minimize className="w-4 h-4 text-gray-500" />
            ) : (
              <Maximize className="w-4 h-4 text-gray-500" />
            )}
          </button>
        </div>
      </div>

      <div
        className={`overflow-x-auto custom-scrollbar ${isFs ? "flex-1 overflow-y-auto" : ""}`}
      >
        <table className="w-full text-left border-collapse min-w-[1200px]">
          <thead className={isFs ? "sticky top-0 z-20" : ""}>
            <tr
              style={{
                backgroundColor:
                  theme === "dark" ? "rgba(15,23,42,0.95)" : "#F9FAFB",
              }}
            >
              <th
                className="p-4 text-left font-semibold text-xs uppercase tracking-wider text-gray-500 hover:bg-black/5 transition-colors"
                style={{ color: mutedText }}
              >
                S.NO
              </th>
              {tableData.columns.map((column) => (
                <th
                  key={column.key}
                  className="p-4 text-left font-semibold text-xs uppercase tracking-wider text-gray-500 hover:bg-black/5 transition-colors whitespace-nowrap"
                  style={{ color: mutedText }}
                >
                  {column.header}
                </th>
              ))}
              <th
                className="p-4 text-center font-semibold text-xs uppercase tracking-wider text-gray-500 sticky right-0 z-10 transition-colors"
                style={{
                  color: mutedText,
                  backgroundColor: theme === "dark" ? "rgba(15,23,42,0.95)" : "#F9FAFB",
                }}
              >
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td
                  colSpan={tableData.columns.length + 2}
                  className="px-6 py-20 text-center"
                >
                  <div className="flex flex-col items-center gap-3">
                    <AppLoader size="xl" />
                    <p className="text-sm font-medium text-gray-400">
                      Loading assignments...
                    </p>
                  </div>
                </td>
              </tr>
            ) : filteredAssignmentRows.length === 0 ? (
              <tr>
                <td
                  colSpan={tableData.columns.length + 2}
                  className="px-6 py-20 text-center"
                >
                  <div className="flex flex-col items-center gap-3 opacity-40">
                    <Search className="w-10 h-10" />
                    <p className="text-sm font-medium">No assignments found matching your criteria.</p>
                  </div>
                </td>
              </tr>
            ) : (
              filteredAssignmentRows.map((row, index) => (
                <motion.tr
                  key={row?._id || index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.03 }}
                  className="group border-b hover:bg-black/5 transition-all duration-200"
                  style={{
                    borderColor: theme === "dark" ? "#334155" : "rgba(0,0,0,0.05)",
                  }}
                >
                  <td className="p-4 text-sm font-medium transition-colors" style={{ color: mutedText }}>
                    {(Number(page) - 1) * LIMIT + index + 1}
                  </td>
                  {tableData.columns.map((column) => (
                    <td
                      key={`${row?._id || index}-${column.key}`}
                      className="p-4 text-sm whitespace-nowrap transition-colors"
                      style={{ color: textColor }}
                    >
                      {renderAssignmentCell(row, column)}
                    </td>
                  ))}
                  <td
                    className="p-4 text-center sticky right-0 z-10 transition-colors"
                    style={{ backgroundColor: panelBg }}
                  >
                    <div className="flex items-center justify-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          navigate(
                            `/particularContact?email=${row?.email}&attendeeId=${row?._id}`,
                          )
                        }
                        className="!min-w-0 !p-2 hover:bg-black/5 dark:hover:bg-white/10"
                        title="View"
                      >
                        <Eye className="w-4 h-4 text-purple-500" />
                      </Button>
                    </div>
                  </td>
                </motion.tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div
        className="p-4 border-t flex flex-col sm:flex-row items-center justify-between gap-4 flex-shrink-0"
        style={{
          borderColor: theme === "dark" ? "#334155" : "rgba(0,0,0,0.05)",
          backgroundColor: theme === "dark" ? "rgba(15,23,42,0.4)" : "#F9FAFB",
        }}
      >
        <div className="text-sm text-slate-500" style={{ color: mutedText }}>
          Showing {tableData.totalRecords > 0 ? (Number(page) - 1) * LIMIT + 1 : 0} to{" "}
          {Math.min(Number(page) * LIMIT, tableData.totalRecords)} of {tableData.totalRecords} entries
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, Number(p) - 1))}
            disabled={Number(page) === 1}
            className="px-3 py-1.5 rounded-lg text-sm border hover:bg-black/5 disabled:opacity-50 transition-colors"
            style={{ borderColor: theme === "dark" ? "#334155" : "#e2e8f0", color: theme === "dark" ? "#f8fafc" : "#0f172a" }}
          >
            Previous
          </button>
          <div className="flex items-center gap-1 hidden sm:flex">
            {Array.from({ length: Math.min(5, Math.ceil(tableData.totalRecords / LIMIT) || 1) }, (_, i) => {
              const totalPages = Math.ceil(tableData.totalRecords / LIMIT) || 1;
              let pageNum = i + 1;
              if (totalPages > 5) {
                if (Number(page) > 3) {
                  pageNum = Number(page) - 3 + i;
                  if (pageNum + (5 - i - 1) > totalPages) {
                    pageNum = totalPages - 4 + i;
                  }
                }
              }
              return (
                <button
                  key={pageNum}
                  onClick={() => setPage(pageNum)}
                  className={`w-8 h-8 rounded-lg text-sm flex items-center justify-center transition-colors ${Number(page) === pageNum
                      ? "bg-blue-600 text-white"
                      : "hover:bg-black/5"
                    }`}
                  style={{
                    color: Number(page) !== pageNum ? (theme === "dark" ? "#f8fafc" : "#0f172a") : undefined,
                  }}
                >
                  {pageNum}
                </button>
              );
            })}
          </div>
          <button
            onClick={() => setPage((p) => Math.min(Math.ceil(tableData.totalRecords / LIMIT) || 1, Number(p) + 1))}
            disabled={Number(page) === (Math.ceil(tableData.totalRecords / LIMIT) || 1)}
            className="px-3 py-1.5 rounded-lg text-sm border hover:bg-black/5 disabled:opacity-50 transition-colors"
            style={{ borderColor: theme === "dark" ? "#334155" : "#e2e8f0", color: theme === "dark" ? "#f8fafc" : "#0f172a" }}
          >
            Next
          </button>
        </div>
      </div>
    </motion.div>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto space-y-6 transition-all duration-300"
    >
      {/* Premium Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-4 min-w-0">
          <button
            onClick={() => navigate("/employees")}
            className="p-2.5 rounded-xl transition-all hover:scale-105 border flex-shrink-0"
            style={{
              backgroundColor: panelBg,
              borderColor: panelBorder,
              color: textColor,
            }}
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="min-w-0">
            <h2
              className="text-2xl font-bold tracking-tight flex items-center gap-3 truncate"
              style={{ color: textColor }}
            >
              <span className="truncate">{userName}</span>
              <span
                className="flex-shrink-0 text-xs font-semibold px-2.5 py-1 rounded-lg"
                style={badgeStyles}
              >
                {profileBadgeLabel}
              </span>
            </h2>
            <p className="text-sm mt-1" style={{ color: mutedText }}>
              Manage assignments, history, and activity logs.
            </p>
          </div>
        </div>

        {currentWebinar && userData?.isActive && (
          <button
            onClick={() => setApplyTagsModalOpen(true)}
            className="flex-shrink-0 flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-transform hover:scale-105"
            style={{
              backgroundColor: "#22B573",
              color: "white",
              boxShadow: "0 4px 10px rgba(34,181,115,0.25)",
            }}
          >
            <Tag className="w-4 h-4" /> Apply Tags
          </button>
        )}
      </div>

      {/* Premium Tabs */}
      <div
        className="flex items-center justify-start gap-2 p-1.5 rounded-2xl w-fit mb-6 shadow-sm border"
        style={{ backgroundColor: panelBg, borderColor: panelBorder }}
      >
        {[
          { id: "assignments", label: "Assignments", icon: ClipboardList },
          { id: "history", label: "History", icon: FileText },
          { id: "activityLogs", label: "Activity Logs", icon: Activity },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => handleTabChange(tab.id)}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 whitespace-nowrap"
            style={{
              backgroundColor:
                tabValue === tab.id
                  ? theme === "dark"
                    ? "#3b82f6"
                    : "#eff6ff"
                  : "transparent",
              color:
                tabValue === tab.id
                  ? theme === "dark"
                    ? "#ffffff"
                    : "#2563eb"
                  : mutedText,
            }}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content Area */}
      <div className="w-full">
        <AnimatePresence mode="wait">
          {tabValue === "activityLogs" && (
            <motion.div
              key="activityLogs"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              className="w-full"
            >
              <UserActivityTable
                page={page}
                setPage={setPage}
                filters={filters}
                setFilters={setFilters}
                handleExportData={exportEmployeeActivityLogs}
                limit={userActivityLimit}
                tableHeader={userActivityTableHeader}
                adminLogsUi2025={true}
                hideHeader={true}
              />
            </motion.div>
          )}

          {(tabValue === "history" || tabValue === "assignments") &&
            !isTableFullscreen &&
            getAssignmentTableUI(false)}
        </AnimatePresence>
      </div>

      {(tabValue === "history" || tabValue === "assignments") &&
        isTableFullscreen &&
        portalTarget &&
        createPortal(
          <div
            className={`fixed inset-0 z-[100] p-4 sm:p-6 flex flex-col ${theme === "dark" ? "bg-[#0f172a]" : "bg-[#F2F4F6]"
              }`}
          >
            {getAssignmentTableUI(true)}
          </div>,
          portalTarget,
        )}

      {presetModalOpen && (
        <FilterPresetModal
          open={presetModalOpen}
          setIsPresetModalOpen={setPresetModalOpen}
          tableName="employeeAssignmentsTable"
          filters={webinarAttendeesFilters}
          setFilters={(next) => {
            dispatch(setWebinarAttendeesFilters({ filters: next || {} }));
            setPage(1);
          }}
        />
      )}

      {/* MODALS RENDERED IN PORTALS */}
      {portalTarget &&
        createPortal(
          <AnimatePresence>
            {filterModalOpen && (
              <EmployeeAssignmentsFilterModal
                modalName={filterModalName}
                setPage={setPage}
                notAllowed={notAllowedColumns}
                label="Employee Assignments Filter"
                tabValue={
                  role === "EMPLOYEE_REMINDER" ||
                    role === roles.EMPLOYEE_REMINDER
                    ? "preWebinar"
                    : "postWebinar"
                }
              />
            )}

            {exportModalOpen && (
              <Suspense fallback={<ModalFallback />}>
                <ExportEmployeeAssignments
                  id={id}
                  modalName={exportExcelModalName}
                  filters={webinarAttendeesFilters}
                  webinarId={currentWebinar}
                  validCall={tabValue === "history" ? "Worked" : "Pending"}
                  assignmentStatus={AssignmentStatus.ACTIVE}
                  validCallFlag={validCallFlag}
                  employeeName={userName}
                  sort={sortByOption}
                />
              </Suspense>
            )}

            {userData?.isActive && applyTagsModalOpen && (
              <Suspense fallback={<ModalFallback />}>
                <ApplyTagsModal
                  onClose={() => setApplyTagsModalOpen(false)}
                  onSubmit={async (tag) => {
                    const normalizedWebinarId =
                      currentWebinar && currentWebinar !== "all"
                        ? currentWebinar
                        : undefined;

                    await applyTagsForEmployee({
                      webinarId: normalizedWebinarId,
                      isAttended:
                        role === "EMPLOYEE_SALES" ||
                        role === roles.EMPLOYEE_SALES,
                      filters: webinarAttendeesFilters,
                      validCall: tabValue === "history" ? "Worked" : "Pending",
                      assignmentType: "Assigned",
                      assignmentStatus: AssignmentStatus.ACTIVE,
                      tag,
                    });
                  }}
                  isLoading={isApplyingTags}
                />
              </Suspense>
            )}
          </AnimatePresence>,
          portalTarget,
        )}
    </motion.div>
  );
};

export default ViewEmployee;
