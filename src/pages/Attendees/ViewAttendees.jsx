import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  deleteAllAttendeesData,
  fetchGroupedAttendees,
  fetchGroupedAttendeesSilently,
} from "../../features/actions/attendees";
import { getLeadType } from "../../features/actions/assign";
import GroupedAttendeeFilterModal from "./Modal/GroupedAttendeeFilterModal";
import { createPortal } from "react-dom";
import { clearAttendeeData } from "../../features/slices/attendees";
import { socket } from "../../socket";
import {
  flattenObjectForURLSearchParams,
  NotifActionType,
  successToast,
  filterTruthyValues,
} from "../../utils/extra";
import { maskPiiDisplay } from "../../utils/maskPii";
import AppLoader from "../../components/AppLoader";
import ModalFallback from "../../components/Fallback/ModalFallback";
import ConfirmDeleteModal from "../../components/ConfirmDeleteModal";
import { clearEmployeeData } from "../../features/slices/employee";
import { getAllEmployees } from "../../features/actions/employee";
import GroupedAttendeesExportModal from "./Modal/GroupedAttendeeExportModal";
import { baseURL } from "../../services/axiosInterceptor";
import { useBulkApplyTagsToAllAttendees } from "../../hooks/useTags";
import ApplyTagsModal from "../../components/Webinar/ApplyTagsModal";
import { openModal } from "../../features/slices/modalSlice";
import { setAllAttendeesFilters } from "../../features/slices/filters.slice";
import FilterPresetModal from "../../components/Filter/FilterPresetModal";
import { useTheme } from "../../contexts/ThemeContext";
import { motion } from "framer-motion";
import {
  Filter,
  Download,
  Search,
  Eye,
  Trash2,
  Bookmark,
  Tag,
  Clock,
  Mail,
  MapPin,
  Briefcase,
  Maximize,
  Minimize,
  RotateCcw,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { Checkbox } from "../../components/ui/checkbox";

const API_SORT_FIELDS = {
  email: "_id",
  totalTime: "timeInSession",
  regWebinars: "registeredWebinarCount",
  attWebinars: "attendedWebinarCount",
};

const DEFAULT_API_SORT = { sortBy: "_id", sortOrder: "asc" };

function joinListField(value) {
  if (Array.isArray(value) && value.length)
    return value.filter((x) => x != null && String(x).trim() !== "").join(", ");
  if (typeof value === "string" && value.trim()) return value.trim();
  return "";
}

function enrollmentSortValue(row) {
  const e = row?.enrollments;
  if (Array.isArray(e)) return e.length;
  if (typeof e === "number" && !Number.isNaN(e)) return e;
  return 0;
}

function enrollmentCellValue(row) {
  const e = row?.enrollments;
  if (Array.isArray(e)) return e.length;
  if (typeof e === "number" && !Number.isNaN(e)) return e;
  if (e != null && e !== "") return String(e);
  return null;
}

function looksLikeMongoId(value) {
  return typeof value === "string" && /^[a-f0-9]{24}$/i.test(value);
}

function getBadgeColor(status) {
  const s = String(status || "").trim();
  switch (s) {
    case "Converted":
    case "Called":
      return {
        bg: "rgba(34, 181, 115, 0.15)",
        text: "#22B573",
        border: "rgba(34, 181, 115, 0.3)",
      };
    case "Interested":
    case "Wants Demo":
    case "Need More Information":
      return {
        bg: "rgba(59, 130, 246, 0.15)",
        text: "#3b82f6",
        border: "rgba(59, 130, 246, 0.3)",
      };
    case "Follow-Up Required":
    case "Asked to Call Later":
    case "Parent/Spouse Spoke":
      return {
        bg: "rgba(249, 115, 22, 0.15)",
        text: "#f97316",
        border: "rgba(249, 115, 22, 0.3)",
      };
    case "Not Interested":
    case "Already Purchased":
    case "Do Not Call Again":
    case "Irrelevant Lead":
    case "Fake Lead":
    case "Wrong Number":
    case "Phone Number Invalid":
      return {
        bg: "rgba(239, 68, 68, 0.15)",
        text: "#ef4444",
        border: "rgba(239, 68, 68, 0.3)",
      };
    case "Number Busy":
    case "Switched Off":
    case "Not Reachable / No Network":
    case "No Answer":
    case "Call Disconnected Immediately":
    case "Technical Issue During Call":
      return {
        bg: "rgba(100, 116, 139, 0.15)",
        text: "#64748b",
        border: "rgba(100, 116, 139, 0.3)",
      };
    case "Language Barrier":
      return {
        bg: "rgba(139, 92, 246, 0.15)",
        text: "#8b5cf6",
        border: "rgba(139, 92, 246, 0.3)",
      };
    case "Abusive/Misbehaved":
      return {
        bg: "rgba(0, 0, 0, 0.15)",
        text: "#000000",
        border: "rgba(0, 0, 0, 0.3)",
      };
    default: {
      const low = s.toLowerCase();
      if (!low)
        return {
          bg: "rgba(100, 116, 139, 0.15)",
          text: "#64748b",
          border: "rgba(100, 116, 139, 0.3)",
        };
      if (low.includes("pending"))
        return {
          bg: "rgba(100, 116, 139, 0.15)",
          text: "#64748b",
          border: "rgba(100, 116, 139, 0.3)",
        };
      if (low.includes("converted") || low.includes("called"))
        return {
          bg: "rgba(34, 181, 115, 0.15)",
          text: "#22B573",
          border: "rgba(34, 181, 115, 0.3)",
        };
      if (low.includes("interested") || low.includes("demo"))
        return {
          bg: "rgba(59, 130, 246, 0.15)",
          text: "#3b82f6",
          border: "rgba(59, 130, 246, 0.3)",
        };
      if (low.includes("not interested") || low.includes("invalid"))
        return {
          bg: "rgba(239, 68, 68, 0.15)",
          text: "#ef4444",
          border: "rgba(239, 68, 68, 0.3)",
        };
      return {
        bg: "rgba(100, 116, 139, 0.15)",
        text: "#64748b",
        border: "rgba(100, 116, 139, 0.3)",
      };
    }
  }
}

const WebinarAttendees = () => {
  const AttendeesFilterModalName = "ViewAttendeesFilterModal";
  const tableHeader = "All Attendees Table";
  const exportModalName = "ExportViewAttendeesExcel";

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { theme } = useTheme();

  const { userData } = useSelector((state) => state.auth);
  const { isTablesMasked } = useSelector((state) => state.table);
  const { attendeeData, isLoading, pagination, isDeleting, isSuccess } =
    useSelector((state) => state.attendee);
  const { total, totalPages } = pagination;

  const { allAttendeesFilters, allAttendeesSortBy } = useSelector(
    (state) => state.filters
  );

  const { employeeData } = useSelector((state) => state.employee);

  const LIMIT = useSelector((state) => state.pageLimits[tableHeader] || 10);
  const modalState = useSelector((state) => state.modals.modals);
  const exportModalOpen = modalState[exportModalName] ? true : false;
  const [searchParams, setSearchParams] = useSearchParams();
  const [page, setPage] = useState(searchParams.get("page") || 1);
  const [deleteModal, setDeleteModal] = useState(false);
  const [applyTagsModalOpen, setApplyTagsModalOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [presetModalOpen, setPresetModalOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [selectedIds, setSelectedIds] = useState(() => new Set());
  const [localSort, setLocalSort] = useState({ field: null, direction: "asc" });
  const [isApiSortDisabled, setIsApiSortDisabled] = useState(true);

  const isDark = theme === "dark";

  const appliedFilters = useMemo(
    () => filterTruthyValues(allAttendeesFilters || {}),
    [allAttendeesFilters]
  );
  const isFilterApplied = Object.keys(appliedFilters).length > 0;

  useEffect(() => {
    const currentPageInUrl = searchParams.get("page");
    const newPageValue = String(page);

    if (newPageValue !== String(currentPageInUrl || "")) {
      setSearchParams({ page: newPageValue }, { replace: true });
    }
  }, [page, searchParams, setSearchParams]);

  useEffect(() => {
    dispatch(
      fetchGroupedAttendees({
        page,
        limit: LIMIT,
        filters: allAttendeesFilters,
        sort: allAttendeesSortBy?.sortBy ? allAttendeesSortBy : DEFAULT_API_SORT,
      })
    );
  }, [page, LIMIT, allAttendeesSortBy, allAttendeesFilters]);

  useEffect(() => {
    if (isSuccess) {
      dispatch(
        fetchGroupedAttendees({
          page: 1,
          limit: LIMIT,
          filters: allAttendeesFilters,
          sort: allAttendeesSortBy?.sortBy ? allAttendeesSortBy : DEFAULT_API_SORT,
        })
      );
      setDeleteModal(false);
    }
  }, [LIMIT, allAttendeesSortBy, allAttendeesFilters, isSuccess]);

  useEffect(() => {
    function onNotification(data) {
      if (data.actionType === NotifActionType.ATTENDEE_REGISTRATION) {
        dispatch(
          fetchGroupedAttendeesSilently({
            page,
            limit: LIMIT,
            filters: allAttendeesFilters,
            sort: allAttendeesSortBy?.sortBy ? allAttendeesSortBy : DEFAULT_API_SORT,
          })
        );
      }
    }
    socket.on("notification", onNotification);
    return () => {
      socket.off("notification", onNotification);
    };
  }, [page, LIMIT, allAttendeesSortBy, allAttendeesFilters]);

  useEffect(() => {
    dispatch(getLeadType());
    dispatch(
      getAllEmployees({ page: 1, limit: 100, filters: { isActive: "active" } })
    );
    return () => {
      dispatch(clearEmployeeData());
      dispatch(clearAttendeeData());
    };
  }, []);

  const employees = useMemo(
    () => (Array.isArray(employeeData) ? employeeData : []),
    [employeeData]
  );
  const employeesMap = useMemo(
    () => new Map(employees.map((item) => [item?._id, item?.userName])),
    [employees]
  );

  const {
    mutateAsync: applyTagsToAllAttendees,
    isPending: isApplyingTags,
  } = useBulkApplyTagsToAllAttendees(() => {
    setPage(1);
    dispatch(
      fetchGroupedAttendees({
        page: 1,
        limit: LIMIT,
        filters: allAttendeesFilters,
        sort: allAttendeesSortBy?.sortBy ? allAttendeesSortBy : DEFAULT_API_SORT,
      })
    );
    setApplyTagsModalOpen(false);
  });

  const handleCopy = useCallback(
    (additionalFilters = {}, sortOverride) => {
      const GROUPED_ATTENDEES_ENDPOINT = "/attendees/grouped";

      const allQueryParams = {
        page,
        limit: LIMIT,
        filters: additionalFilters,
        sort:
          (sortOverride ?? allAttendeesSortBy)?.sortBy
            ? sortOverride ?? allAttendeesSortBy
            : DEFAULT_API_SORT,
      };

      const flattenedParams = flattenObjectForURLSearchParams(allQueryParams);

      const queryString = new URLSearchParams(flattenedParams).toString();

      const finalURL = `${baseURL.replace(
        /\/$/,
        ""
      )}${GROUPED_ATTENDEES_ENDPOINT}?${queryString}&fieldName=attendeeTableConfig&accessToken=<BEARER_TOKEN>`;

      navigator.clipboard
        .writeText(finalURL)
        .then(() => {
          successToast("Copied to clipboard!");
        })
        .catch((err) => {
          console.error("Failed to copy URL to clipboard: ", err);
        });
    },
    [page, LIMIT, baseURL, allAttendeesSortBy]
  );

  const filteredRows = useMemo(() => {
    const normalized = searchValue.trim().toLowerCase();
    if (!normalized) return attendeeData;
    return attendeeData.filter((item) => {
      return [
        item?._id,
        item?.locations?.join(" "),
        item?.sources?.join(" "),
        item?.professions?.join(" "),
        item?.salesLastStatus,
        item?.reminderLastStatus,
        item?.tags?.join(" "),
      ]
        .join(" ")
        .toLowerCase()
        .includes(normalized);
    });
  }, [attendeeData, searchValue]);

  const formatAssignee = useCallback(
    (value) => {
      if (value == null || value === "") return "—";
      if (typeof value === "object" && value?.userName) return value.userName;
      if (typeof value === "object" && value?._id) {
        const n = employeesMap.get(value._id);
        return n || (looksLikeMongoId(String(value._id)) ? "—" : String(value._id));
      }
      const s = String(value);
      const name = employeesMap.get(s);
      if (name) return name;
      if (looksLikeMongoId(s)) return "—";
      return s;
    },
    [employeesMap]
  );

  const getSortComparable = useCallback(
    (row, field) => {
      switch (field) {
        case "email":
          return String(row?._id || "").toLowerCase();
        case "totalTime":
          return String(row?.timeInSession || "");
        case "regWebinars":
          return Number(row?.registeredWebinarCount) || 0;
        case "remAssigned":
          return String(formatAssignee(row?.reminderAssignedTo) || "").toLowerCase();
        case "salesAssigned":
          return String(formatAssignee(row?.salesAssignedTo) || "").toLowerCase();
        case "remStatus":
          return String(row?.reminderLastStatus || "").toLowerCase();
        case "salesStatus":
          return String(row?.salesLastStatus || "").toLowerCase();
        case "attWebinars":
          return Number(row?.attendedWebinarCount) || 0;
        case "location":
          return joinListField(row?.locations).toLowerCase();
        case "source":
          return joinListField(row?.sources).toLowerCase();
        case "profession":
          return joinListField(row?.professions).toLowerCase();
        case "tags":
          return joinListField(row?.tags).toLowerCase();
        case "enrollments":
          return enrollmentSortValue(row);
        default:
          return "";
      }
    },
    [formatAssignee]
  );

  const filteredSortedRows = useMemo(() => {
    if (!localSort.field) return filteredRows;
    const dir = localSort.direction === "asc" ? 1 : -1;
    const field = localSort.field;
    return [...filteredRows].sort((a, b) => {
      const va = getSortComparable(a, field);
      const vb = getSortComparable(b, field);
      if (va < vb) return -1 * dir;
      if (va > vb) return 1 * dir;
      return 0;
    });
  }, [filteredRows, localSort, getSortComparable]);

  const handleSortClick = useCallback(
    (field) => {
      const apiKey = API_SORT_FIELDS[field];
      if (apiKey) {
        const isSame = !isApiSortDisabled && allAttendeesSortBy?.sortBy === apiKey;
        const order = allAttendeesSortBy?.sortOrder;
        if (isSame && order === "asc") {
          setIsApiSortDisabled(false);
          dispatch(
            setAllAttendeesFilters({
              sortBy: { sortBy: apiKey, sortOrder: "desc" },
            })
          );
        } else if (isSame && order === "desc") {
          setIsApiSortDisabled(true);
          dispatch(
            setAllAttendeesFilters({
              sortBy: DEFAULT_API_SORT,
            })
          );
        } else {
          setIsApiSortDisabled(false);
          dispatch(
            setAllAttendeesFilters({
              sortBy: { sortBy: apiKey, sortOrder: "asc" },
            })
          );
        }
        setLocalSort({ field: null, direction: "asc" });
        setPage(1);
        return;
      }
      setLocalSort((prev) => {
        if (prev.field === field) {
          if (prev.direction === "asc") {
            return { field, direction: "desc" };
          }
          if (prev.direction === "desc") {
            return { field: null, direction: "asc" };
          }
        }
        return { field, direction: "asc" };
      });
    },
    [allAttendeesSortBy, dispatch, isApiSortDisabled]
  );

  const SortIcon = ({ field }) => {
    const apiKey = API_SORT_FIELDS[field];
    const activeApi =
      !isApiSortDisabled &&
      apiKey != null &&
      allAttendeesSortBy?.sortBy === apiKey;
    const activeLocal = !apiKey && localSort.field === field;
    const dir = activeApi
      ? allAttendeesSortBy?.sortOrder
      : activeLocal
        ? localSort.direction
        : null;
    if (!activeApi && !activeLocal) {
      return <ArrowUpDown className="w-3.5 h-3.5 opacity-40" />;
    }
    if (dir === "asc") {
      return <ArrowUp className="w-3.5 h-3.5" style={{ color: "#3b82f6" }} />;
    }
    return <ArrowDown className="w-3.5 h-3.5" style={{ color: "#3b82f6" }} />;
  };

  const handleResetFilters = () => {
    dispatch(setAllAttendeesFilters());
    setPage(1);
    setLocalSort({ field: null, direction: "asc" });
    setIsApiSortDisabled(true);
  };

  const toggleSelect = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = (checked) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (checked) {
        filteredSortedRows.forEach((r) => {
          if (r?._id) next.add(r._id);
        });
      } else {
        filteredSortedRows.forEach((r) => {
          if (r?._id) next.delete(r._id);
        });
      }
      return next;
    });
  };

  const startRow = total > 0 ? (Number(page) - 1) * LIMIT + 1 : 0;
  const endRow = Math.min(Number(page) * LIMIT, total);

  const portalTarget =
    typeof document !== "undefined" ? document.body : null;

  const cardBorder = isDark ? "rgba(255,255,255,0.05)" : "rgba(255,255,255,0.4)";
  const cardBg = isDark
    ? isFullscreen
      ? "#1e293b"
      : "rgba(30, 41, 59, 0.7)"
    : isFullscreen
      ? "#ffffff"
      : "rgba(255, 255, 255, 0.7)";

  const TableUI = (
    <>
      <motion.div
        className={`rounded-2xl overflow-hidden border flex flex-col transition-all duration-300 ${isFullscreen ? "flex-1 h-full shadow-2xl" : ""}`}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.08 }}
        style={{
          background: cardBg,
          backdropFilter: isFullscreen ? "none" : "blur(16px)",
          borderColor: cardBorder,
          boxShadow:
            theme === "light" && !isFullscreen
              ? "0 10px 40px rgba(7, 16, 40, 0.04)"
              : "none",
        }}
      >
        <div
          className="p-4 border-b flex flex-col sm:flex-row items-center justify-between gap-4"
          style={{
            borderColor: isDark ? "#334155" : "rgba(0,0,0,0.05)",
          }}
        >
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search email, location, source..."
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              className="pl-9 pr-4 py-2 w-full rounded-xl text-sm focus:outline-none focus:ring-2 transition-all"
              style={{
                backgroundColor: isDark ? "#0f172a" : "#ffffff",
                border: `1px solid ${isDark ? "#334155" : "#e2e8f0"}`,
                color: isDark ? "#f8fafc" : "#0f172a",
              }}
            />
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto w-full sm:w-auto">
            {isFilterApplied && (
              <Button
                type="button"
                onClick={handleResetFilters}
                className="rounded-xl flex items-center gap-2 px-4 flex-1 sm:flex-none hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                style={{
                  backgroundColor: "transparent",
                  color: "#ef4444",
                  border: "1px solid rgba(239, 68, 68, 0.3)",
                }}
              >
                <RotateCcw className="w-4 h-4" />{" "}
                <span className="hidden sm:inline">Reset</span>
              </Button>
            )}
            <Button
              type="button"
              onClick={() => setPresetModalOpen(true)}
              className="rounded-xl flex items-center gap-2 px-4 flex-1 sm:flex-none hover:bg-black/5 dark:hover:bg-white/5"
              style={{
                backgroundColor: isDark ? "#1e293b" : "white",
                color: isDark ? "#f8fafc" : "#071028",
                border: `1px solid ${isDark ? "#334155" : "#e2e8f0"}`,
              }}
            >
              <Bookmark className="w-4 h-4 text-gray-500" />{" "}
              <span className="hidden sm:inline">Presets</span>
            </Button>
            <Button
              type="button"
              onClick={() => dispatch(openModal(AttendeesFilterModalName))}
              className="rounded-xl flex items-center gap-2 px-4 flex-1 sm:flex-none hover:bg-black/5 dark:hover:bg-white/5"
              style={{
                backgroundColor: isDark ? "#1e293b" : "white",
                color: isDark ? "#f8fafc" : "#071028",
                border: `1px solid ${isDark ? "#334155" : "#e2e8f0"}`,
              }}
            >
              <Filter className="w-4 h-4 text-gray-500" />{" "}
              <span className="hidden sm:inline">Filters</span>
            </Button>
            <Button
              type="button"
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="rounded-xl flex items-center justify-center p-2.5 flex-shrink-0 hover:bg-black/5 dark:hover:bg-white/5"
              style={{
                backgroundColor: isDark ? "#1e293b" : "white",
                color: isDark ? "#94a3b8" : "#64748b",
                border: `1px solid ${isDark ? "#334155" : "#e2e8f0"}`,
              }}
              title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
            >
              {isFullscreen ? (
                <Minimize className="w-4 h-4" />
              ) : (
                <Maximize className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>

        <div
          className={`overflow-x-auto custom-scrollbar ${isFullscreen ? "flex-1 overflow-y-auto" : ""}`}
        >
          <table className="w-full text-left border-collapse min-w-[2000px]">
            <thead className={isFullscreen ? "sticky top-0 z-20" : ""}>
              <tr
                style={{
                  backgroundColor: isDark
                    ? "rgba(15,23,42,0.95)"
                    : "#F9FAFB",
                  backdropFilter: isFullscreen ? "blur(8px)" : "none",
                }}
              >
                <th
                  className="p-4 font-semibold text-xs uppercase tracking-wider sticky left-0 z-30"
                  style={{
                    backgroundColor: isDark ? "#1e293b" : "#F9FAFB",
                    color: isDark ? "#94a3b8" : "#64748b",
                  }}
                >
                  <Checkbox
                    checked={
                      filteredSortedRows.length > 0 &&
                      filteredSortedRows.every((r) => r._id && selectedIds.has(r._id))
                    }
                    onCheckedChange={(c) => toggleSelectAll(Boolean(c))}
                    className={isDark ? "border-slate-500" : "border-slate-300"}
                  />
                </th>
                <th
                  className="p-4 text-left font-semibold text-xs uppercase tracking-wider whitespace-nowrap transition-colors"
                  style={{ color: isDark ? "#94a3b8" : "#64748b" }}
                >
                  <div className="flex items-center gap-2">S.NO</div>
                </th>
                <th
                  className="p-4 text-left font-semibold text-xs uppercase tracking-wider whitespace-nowrap text-gray-500 cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                  style={{ color: isDark ? "#94a3b8" : "#64748b" }}
                  onClick={() => handleSortClick("email")}
                >
                  <div className="flex items-center gap-2">
                    Email <SortIcon field="email" />
                  </div>
                </th>
                <th
                  className="p-4 text-left font-semibold text-xs uppercase tracking-wider whitespace-nowrap text-gray-500 cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                  style={{ color: isDark ? "#94a3b8" : "#64748b" }}
                  onClick={() => handleSortClick("totalTime")}
                >
                  <div className="flex items-center gap-2">
                    Total Time <SortIcon field="totalTime" />
                  </div>
                </th>
                <th
                  className="p-4 text-left font-semibold text-xs uppercase tracking-wider whitespace-nowrap text-gray-500 cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                  style={{ color: isDark ? "#94a3b8" : "#64748b" }}
                  onClick={() => handleSortClick("remAssigned")}
                >
                  <div className="flex items-center gap-2">
                    Reminder Assigned <SortIcon field="remAssigned" />
                  </div>
                </th>
                <th
                  className="p-4 text-left font-semibold text-xs uppercase tracking-wider whitespace-nowrap text-gray-500 cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                  style={{ color: isDark ? "#94a3b8" : "#64748b" }}
                  onClick={() => handleSortClick("salesAssigned")}
                >
                  <div className="flex items-center gap-2">
                    Sales Assigned <SortIcon field="salesAssigned" />
                  </div>
                </th>
                <th
                  className="p-4 text-left font-semibold text-xs uppercase tracking-wider whitespace-nowrap text-gray-500 cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                  style={{ color: isDark ? "#94a3b8" : "#64748b" }}
                  onClick={() => handleSortClick("remStatus")}
                >
                  <div className="flex items-center gap-2">
                    Reminder Status <SortIcon field="remStatus" />
                  </div>
                </th>
                <th
                  className="p-4 text-left font-semibold text-xs uppercase tracking-wider whitespace-nowrap text-gray-500 cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                  style={{ color: isDark ? "#94a3b8" : "#64748b" }}
                  onClick={() => handleSortClick("salesStatus")}
                >
                  <div className="flex items-center gap-2">
                    Sales Status <SortIcon field="salesStatus" />
                  </div>
                </th>
                <th
                  className="p-4 text-center font-semibold text-xs uppercase tracking-wider whitespace-nowrap text-gray-500 cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                  style={{ color: isDark ? "#94a3b8" : "#64748b" }}
                  onClick={() => handleSortClick("regWebinars")}
                >
                  <div className="flex items-center justify-center gap-2">
                    Reg. Webinars <SortIcon field="regWebinars" />
                  </div>
                </th>
                <th
                  className="p-4 text-center font-semibold text-xs uppercase tracking-wider whitespace-nowrap text-gray-500 cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                  style={{ color: isDark ? "#94a3b8" : "#64748b" }}
                  onClick={() => handleSortClick("attWebinars")}
                >
                  <div className="flex items-center justify-center gap-2">
                    Att. Webinars <SortIcon field="attWebinars" />
                  </div>
                </th>
                <th
                  className="p-4 text-left font-semibold text-xs uppercase tracking-wider whitespace-nowrap text-gray-500 cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                  style={{ color: isDark ? "#94a3b8" : "#64748b" }}
                  onClick={() => handleSortClick("location")}
                >
                  <div className="flex items-center gap-2">
                    Locations <SortIcon field="location" />
                  </div>
                </th>
                <th
                  className="p-4 text-left font-semibold text-xs uppercase tracking-wider whitespace-nowrap text-gray-500 cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                  style={{ color: isDark ? "#94a3b8" : "#64748b" }}
                  onClick={() => handleSortClick("source")}
                >
                  <div className="flex items-center gap-2">
                    Sources <SortIcon field="source" />
                  </div>
                </th>
                <th
                  className="p-4 text-left font-semibold text-xs uppercase tracking-wider whitespace-nowrap text-gray-500 cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                  style={{ color: isDark ? "#94a3b8" : "#64748b" }}
                  onClick={() => handleSortClick("profession")}
                >
                  <div className="flex items-center gap-2">
                    Professions <SortIcon field="profession" />
                  </div>
                </th>
                <th
                  className="p-4 text-left font-semibold text-xs uppercase tracking-wider whitespace-nowrap text-gray-500 cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                  style={{ color: isDark ? "#94a3b8" : "#64748b" }}
                  onClick={() => handleSortClick("tags")}
                >
                  <div className="flex items-center gap-2">
                    Tags <SortIcon field="tags" />
                  </div>
                </th>
                <th
                  className="p-4 text-center font-semibold text-xs uppercase tracking-wider whitespace-nowrap text-gray-500 cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                  style={{ color: isDark ? "#94a3b8" : "#64748b" }}
                  onClick={() => handleSortClick("enrollments")}
                >
                  <div className="flex items-center justify-center gap-2">
                    Enrollments <SortIcon field="enrollments" />
                  </div>
                </th>
                <th
                  className="p-4 font-semibold text-xs uppercase tracking-wider whitespace-nowrap text-right sticky right-0 z-30"
                  style={{
                    backgroundColor: isDark ? "#1e293b" : "#F9FAFB",
                    color: isDark ? "#94a3b8" : "#64748b",
                    boxShadow: "-4px 0 10px rgba(0,0,0,0.05)",
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
                    colSpan={16}
                    className="p-8 text-center"
                    style={{ color: isDark ? "#94a3b8" : "#64748b" }}
                  >
                    <div className="flex flex-col items-center justify-center gap-3">
                      <AppLoader size="lg" />
                      <p>Loading attendees...</p>
                    </div>
                  </td>
                </tr>
              ) : filteredSortedRows.length === 0 ? (
                <tr>
                  <td
                    colSpan={16}
                    className="p-8 text-center"
                    style={{ color: isDark ? "#94a3b8" : "#64748b" }}
                  >
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Search className="w-8 h-8 mb-2 opacity-20" />
                      <p>No attendees found matching your criteria.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredSortedRows.map((row, index) => {
                  const rowId = row?._id;
                  const isSelected = rowId && selectedIds.has(rowId);
                  const remStyles = getBadgeColor(row?.reminderLastStatus);
                  const salesStyles = getBadgeColor(row?.salesLastStatus);
                  const remLabel = row?.reminderLastStatus || "N/A";
                  const salesLabel = row?.salesLastStatus || "N/A";
                  const enrollVal = enrollmentCellValue(row);

                  return (
                    <motion.tr
                      key={rowId || index}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.03 }}
                      className="border-b transition-colors group"
                      style={{
                        borderColor: isDark ? "#334155" : "#e2e8f0",
                        backgroundColor: isSelected
                          ? isDark
                            ? "rgba(34, 181, 115, 0.1)"
                            : "rgba(34, 181, 115, 0.05)"
                          : "transparent",
                      }}
                    >
                      <td
                        className="p-4 sticky left-0 z-10 group-hover:bg-black/5 dark:group-hover:bg-white/5 transition-colors"
                        style={{
                          backgroundColor: isDark
                            ? isSelected
                              ? "#1e293b"
                              : "#0f172a"
                            : isSelected
                              ? "#f0fdf4"
                              : "#ffffff",
                        }}
                      >
                        <Checkbox
                          checked={Boolean(rowId && selectedIds.has(rowId))}
                          onCheckedChange={() => rowId && toggleSelect(rowId)}
                          className={isDark ? "border-slate-500" : "border-slate-300"}
                        />
                      </td>
                      <td
                        className="p-4 text-sm font-medium group-hover:bg-black/5 dark:group-hover:bg-white/5 transition-colors"
                        style={{ color: isDark ? "#cbd5e1" : "#64748b" }}
                      >
                        {(Number(page) - 1) * LIMIT + index + 1}
                      </td>
                      <td className="p-4 whitespace-nowrap group-hover:bg-black/5 dark:group-hover:bg-white/5 transition-colors">
                        <div
                          className="flex items-center gap-2 text-sm font-semibold"
                          style={{ color: isDark ? "#f8fafc" : "#071028" }}
                        >
                          <Mail className="w-4 h-4 text-gray-400 shrink-0" />
                          {maskPiiDisplay(row?._id, isTablesMasked)}
                        </div>
                      </td>
                      <td
                        className="p-4 whitespace-nowrap text-sm group-hover:bg-black/5 dark:group-hover:bg-white/5 transition-colors"
                        style={{ color: isDark ? "#e2e8f0" : "#334155" }}
                      >
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                          {row?.timeInSession ?? "—"}
                        </div>
                      </td>
                      <td
                        className="p-4 whitespace-nowrap text-sm font-medium group-hover:bg-black/5 dark:group-hover:bg-white/5 transition-colors"
                        style={{ color: isDark ? "#e2e8f0" : "#334155" }}
                      >
                        {formatAssignee(row?.reminderAssignedTo)}
                      </td>
                      <td
                        className="p-4 whitespace-nowrap text-sm font-medium group-hover:bg-black/5 dark:group-hover:bg-white/5 transition-colors"
                        style={{ color: isDark ? "#e2e8f0" : "#334155" }}
                      >
                        {formatAssignee(row?.salesAssignedTo)}
                      </td>
                      <td className="p-4 whitespace-nowrap group-hover:bg-black/5 dark:group-hover:bg-white/5 transition-colors">
                        <Badge
                          className="rounded-full border px-2.5 py-1 text-xs font-semibold"
                          style={{
                            backgroundColor: remStyles.bg,
                            color: remStyles.text,
                            borderColor: remStyles.border,
                          }}
                        >
                          {remLabel}
                        </Badge>
                      </td>
                      <td className="p-4 whitespace-nowrap group-hover:bg-black/5 dark:group-hover:bg-white/5 transition-colors">
                        <Badge
                          className="rounded-full border px-2.5 py-1 text-xs font-semibold"
                          style={{
                            backgroundColor: salesStyles.bg,
                            color: salesStyles.text,
                            borderColor: salesStyles.border,
                          }}
                        >
                          {salesLabel}
                        </Badge>
                      </td>
                      <td
                        className="p-4 text-center text-sm font-bold group-hover:bg-black/5 dark:group-hover:bg-white/5 transition-colors"
                        style={{ color: isDark ? "#f8fafc" : "#071028" }}
                      >
                        {row?.registeredWebinarCount ?? "—"}
                      </td>
                      <td
                        className="p-4 text-center text-sm font-bold group-hover:bg-black/5 dark:group-hover:bg-white/5 transition-colors"
                        style={{ color: "#22B573" }}
                      >
                        {row?.attendedWebinarCount ?? "—"}
                      </td>
                      <td
                        className="p-4 whitespace-nowrap text-sm group-hover:bg-black/5 dark:group-hover:bg-white/5 transition-colors max-w-[220px]"
                        style={{ color: isDark ? "#cbd5e1" : "#475569" }}
                      >
                        <div className="flex items-start gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0 mt-0.5" />
                          <span className="line-clamp-2">
                            {joinListField(row?.locations) || "—"}
                          </span>
                        </div>
                      </td>
                      <td
                        className="p-4 whitespace-nowrap text-sm group-hover:bg-black/5 dark:group-hover:bg-white/5 transition-colors max-w-[200px]"
                        style={{ color: isDark ? "#cbd5e1" : "#475569" }}
                      >
                        <span className="line-clamp-2">
                          {joinListField(row?.sources) || "—"}
                        </span>
                      </td>
                      <td
                        className="p-4 whitespace-nowrap text-sm group-hover:bg-black/5 dark:group-hover:bg-white/5 transition-colors max-w-[200px]"
                        style={{ color: isDark ? "#cbd5e1" : "#475569" }}
                      >
                        <div className="flex items-start gap-1.5">
                          <Briefcase className="w-3.5 h-3.5 text-gray-400 shrink-0 mt-0.5" />
                          <span className="line-clamp-2">
                            {joinListField(row?.professions) || "—"}
                          </span>
                        </div>
                      </td>
                      <td className="p-4 whitespace-nowrap group-hover:bg-black/5 dark:group-hover:bg-white/5 transition-colors max-w-[260px]">
                        <div className="flex gap-1.5 flex-wrap">
                          {Array.isArray(row?.tags) && row.tags.length ? (
                            row.tags.map((t, i) => (
                              <span
                                key={`${rowId}-tag-${i}`}
                                className="px-2 py-0.5 rounded text-[11px] font-medium bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-slate-600 inline-flex items-center gap-1"
                              >
                                <Tag className="w-2.5 h-2.5 shrink-0" />
                                {t}
                              </span>
                            ))
                          ) : (
                            <span
                              className="text-sm italic"
                              style={{ color: isDark ? "#64748b" : "#94a3b8" }}
                            >
                              —
                            </span>
                          )}
                        </div>
                      </td>
                      <td
                        className="p-4 text-center text-sm font-bold group-hover:bg-black/5 dark:group-hover:bg-white/5 transition-colors"
                        style={{ color: "#8b5cf6" }}
                      >
                        {enrollVal != null ? enrollVal : "—"}
                      </td>
                      <td
                        className="p-4 text-right sticky right-0 z-10 transition-colors"
                        style={{
                          backgroundColor: isDark
                            ? isSelected
                              ? "#1e293b"
                              : "#0f172a"
                            : isSelected
                              ? "#f0fdf4"
                              : "#ffffff",
                          boxShadow: "-4px 0 10px rgba(0,0,0,0.05)",
                        }}
                      >
                        <div className="flex justify-end gap-1">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="w-8 h-8 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-500/10"
                            onClick={() =>
                              navigate(
                                `/particularContact?email=${row?._id}&attendeeId=${row?.attendeeId}`
                              )
                            }
                          >
                            <Eye className="w-4 h-4 text-blue-500" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="w-8 h-8 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10"
                            onClick={() => setDeleteModal(row)}
                          >
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </Button>
                        </div>
                      </td>
                    </motion.tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div
          className="p-4 border-t flex flex-col sm:flex-row items-center justify-between gap-4 flex-shrink-0"
          style={{
            borderColor: isDark ? "#334155" : "rgba(0,0,0,0.05)",
            backgroundColor: isDark ? "rgba(15,23,42,0.4)" : "#F9FAFB",
          }}
        >
          <div
            className="text-sm"
            style={{ color: isDark ? "#94a3b8" : "#64748b" }}
          >
            Showing {startRow} to {endRow} of {total} entries
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              disabled={Number(page) <= 1}
              onClick={() => setPage((p) => Math.max(1, Number(p) - 1))}
              className="px-3 py-1.5 rounded-lg text-sm transition-colors disabled:opacity-50"
              style={{
                backgroundColor: isDark ? "#1e293b" : "white",
                color: isDark ? "#f8fafc" : "#071028",
                border: `1px solid ${isDark ? "#334155" : "#e2e8f0"}`,
                textAlign: "center",
              }}
            >
              Previous
            </Button>
            <Button
              type="button"
              disabled={Number(page) >= totalPages || totalPages === 0}
              onClick={() =>
                setPage((p) => Math.min(totalPages, Number(p) + 1))
              }
              className="px-3 py-1.5 rounded-lg text-sm transition-colors disabled:opacity-50"
              style={{
                backgroundColor: isDark ? "#1e293b" : "white",
                color: isDark ? "#f8fafc" : "#071028",
                border: `1px solid ${isDark ? "#334155" : "#e2e8f0"}`,
                textAlign: "center",
              }}
            >
              Next
            </Button>
          </div>
        </div>
      </motion.div>
    </>
  );

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto space-y-6 transition-all duration-300">
      <motion.div
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
      >
        <div>
          <h2
            className="text-2xl font-bold tracking-tight flex flex-wrap items-center gap-3"
            style={{ color: isDark ? "#f8fafc" : "#071028" }}
          >
            Attendees Directory
            <span
              className="text-xs font-semibold px-2.5 py-1 rounded-lg"
              style={{
                backgroundColor: isDark
                  ? "rgba(59, 130, 246, 0.2)"
                  : "#eff6ff",
                color: isDark ? "#60a5fa" : "#2563eb",
                border: `1px solid ${isDark ? "rgba(59, 130, 246, 0.3)" : "#bfdbfe"}`,
              }}
            >
              Total Records: {total}
            </span>
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Manage your webinar attendees, track engagement, and export data.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button
            type="button"
            onClick={() => dispatch(openModal({ modalName: exportModalName }))}
            className="rounded-xl flex items-center gap-2 px-4 transition-transform hover:scale-105"
            style={{
              backgroundColor: isDark ? "#1e293b" : "white",
              color: isDark ? "#f8fafc" : "#071028",
              border: `1px solid ${isDark ? "#334155" : "#e2e8f0"}`,
              boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
            }}
          >
            <Download className="w-4 h-4 text-gray-500" />{" "}
            <span className="hidden sm:inline">Export CSV</span>
          </Button>
          {userData?.isActive && (
            <Button
              type="button"
              onClick={() => setApplyTagsModalOpen(true)}
              className="rounded-xl flex items-center gap-2 px-4 shadow-sm transition-transform hover:scale-105"
              style={{
                backgroundColor: "#FF6B35",
                color: "white",
                border: "none",
                boxShadow: "0 4px 10px rgba(255, 107, 53, 0.2)",
              }}
            >
              <Tag className="w-4 h-4" />{" "}
              <span className="hidden sm:inline">Apply Tags</span>
            </Button>
          )}
        </div>
      </motion.div>

      {isFullscreen && portalTarget ? (
        createPortal(
          <div
            className={`fixed inset-0 z-[100] p-4 sm:p-6 flex flex-col ${isDark ? "bg-[#0f172a]" : "bg-[#F2F4F6]"}`}
          >
            {TableUI}
          </div>,
          portalTarget
        )
      ) : (
        TableUI
      )}

      {presetModalOpen && (
        <FilterPresetModal
          open={presetModalOpen}
          setIsPresetModalOpen={setPresetModalOpen}
          tableName={tableHeader}
          filters={allAttendeesFilters}
          setFilters={(f) => {
            dispatch(setAllAttendeesFilters({ filters: f || {} }));
            setPage(1);
          }}
        />
      )}

          <GroupedAttendeeFilterModal
            handleCopy={handleCopy}
            setPage={setPage}
            modalName={AttendeesFilterModalName}
        onOpenPresetModal={() => setPresetModalOpen(true)}
      />
      {exportModalOpen &&
        createPortal(
          <GroupedAttendeesExportModal
            modalName={exportModalName}
            filters={allAttendeesFilters}
            sort={allAttendeesSortBy?.sortBy ? allAttendeesSortBy : DEFAULT_API_SORT}
          />,
          document.body
        )}

      {deleteModal &&
        createPortal(
          <Suspense fallback={<ModalFallback />}>
            <ConfirmDeleteModal
              setModal={setDeleteModal}
              triggerDelete={() =>
                dispatch(
                  deleteAllAttendeesData({
                    attendees: [deleteModal?._id],
                  })
                )
              }
              isLoading={isDeleting}
            />
          </Suspense>,
          document.body
        )}
      {userData?.isActive &&
        applyTagsModalOpen &&
        createPortal(
          <Suspense fallback={<ModalFallback />}>
              <ApplyTagsModal
                onClose={() => setApplyTagsModalOpen(false)}
                onSubmit={async (tag) => {
                  await applyTagsToAllAttendees({
                    filters: allAttendeesFilters,
                  sort: allAttendeesSortBy?.sortBy ? allAttendeesSortBy : DEFAULT_API_SORT,
                    tag,
                  });
                }}
                isLoading={isApplyingTags}
              />
          </Suspense>,
          document.body
        )}
    </div>
  );
};

export default WebinarAttendees;
