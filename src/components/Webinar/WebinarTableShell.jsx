import { useCallback, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { Button } from "@mui/material";
import AppLoader from "../AppLoader";
import { Checkbox } from "../ui/checkbox";
import { useTheme } from "../../contexts/ThemeContext";
import {
  Plus,
  Search,
  Filter,
  Download,
  Maximize,
  Minimize,
  Bookmark,
  TrendingUp,
  Users,
  UserCheck,
  UserX,
  Eye,
  Pencil,
  Copy,
  Trash2,
  Calendar,
  RotateCcw,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import { formatDateAsNumber } from "../../utils/extra";
import { motion } from "framer-motion";

const inputStyle = {
  backgroundColor: "#ffffff",
  border: "1px solid #e2e8f0",
  color: "#0f172a",
  fontFamily: "Inter, sans-serif",
};

const cardStyle = {
  backgroundColor: "white",
  borderColor: "#e5e7eb",
  boxShadow: "0 1px 3px rgba(0, 0, 0, 0.04)",
};

export default function WebinarTableShell({
  tableHeader,
  rows = [],
  totalRecords = 0,
  totalPages = 1,
  page,
  setPage,
  limit,
  isLoading,
  filters,
  userData,
  assignmentMetrics,
  onAssignmentMetrics,
  onCreateWebinar,
  onExportClick,
  onPresetsClick,
  onFiltersClick,
  onResetFilters,
  onView,
  onEdit,
  onDelete,
  onCopy,
  logUserActivity,
  sortField,
  sortDirection,
  onSort,
}) {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState(() => new Set());

  const toggleSelect = useCallback((id) => {
    if (!id) return;
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  useEffect(() => {
    setSelectedIds(new Set());
  }, [page, searchQuery]);

  const hasActiveFilters =
    filters && typeof filters === "object" && Object.keys(filters).length > 0;

  const displayedRows = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((row) => {
      const name = String(row?.webinarName ?? "").toLowerCase();
      const date = String(row?.webinarDate ?? "").toLowerCase();
      return name.includes(q) || date.includes(q);
    });
  }, [rows, searchQuery]);

  const toggleSelectAll = useCallback(
    (checked) => {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        if (checked) {
          displayedRows.forEach((r) => {
            if (r?._id) next.add(r._id);
          });
        } else {
          displayedRows.forEach((r) => {
            if (r?._id) next.delete(r._id);
          });
        }
        return next;
      });
    },
    [displayedRows]
  );

  const stats = useMemo(() => {
    return rows.reduce(
      (acc, row) => {
        acc.registrations += Number(row?.totalRegistrations || 0);
        acc.participants += Number(row?.totalParticipants || 0);
        acc.attendees += Number(row?.totalAttendees || 0);
        acc.unAttended += Number(row?.totalUnAttended || 0);
        return acc;
      },
      { registrations: 0, participants: 0, attendees: 0, unAttended: 0 },
    );
  }, [rows]);

  useEffect(() => {
    setSearchQuery("");
  }, [page]);

  const startIndex = rows.length === 0 ? 0 : (Number(page) - 1) * limit + 1;
  const endIndex = (Number(page) - 1) * limit + rows.length;

  const SortIcon = ({ field }) => {
    if (sortField !== field) {
      return <ArrowUpDown className="w-3.5 h-3.5 opacity-40" />;
    }
    if (sortDirection === "asc") {
      return <ArrowUp className="w-3.5 h-3.5" style={{ color: "#3b82f6" }} />;
    }
    return <ArrowDown className="w-3.5 h-3.5" style={{ color: "#3b82f6" }} />;
  };

  const tableUI = (
    <motion.div
      className={`rounded-2xl overflow-hidden border flex flex-col transition-all duration-300 ${isFullscreen ? "flex-1 h-full min-h-0 shadow-2xl" : ""
        }`}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: 0.08 }}
      style={{
        background: isFullscreen
          ? isDark
            ? "#1e293b"
            : "#ffffff"
          : isDark
            ? "rgba(30, 41, 59, 0.7)"
            : "rgba(255, 255, 255, 0.7)",
        backdropFilter: isFullscreen ? "none" : "blur(16px)",
        borderColor: isDark ? "rgba(255,255,255,0.05)" : "rgba(255,255,255,0.4)",
        boxShadow:
          !isFullscreen && !isDark
            ? "0 10px 40px rgba(7, 16, 40, 0.04)"
            : "none",
      }}
    >
      <div
        className="p-4 border-b flex flex-col sm:flex-row items-center justify-between gap-4"
        style={{ borderColor: "rgba(0,0,0,0.05)" }}
      >
        <div className="relative w-full sm:w-80 flex-shrink-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search webinars..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 pr-9 py-2 w-full rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#22B573]/35 transition-all"
            style={inputStyle}
          />
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto w-full sm:w-auto">
          {hasActiveFilters && (
            <button
              onClick={onResetFilters}
              className="rounded-xl flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium transition-all flex-1 sm:flex-none"
              style={{
                backgroundColor: "transparent",
                color: "#ef4444",
                border: "1px solid rgba(239, 68, 68, 0.3)",
              }}
            >
              <RotateCcw className="w-4 h-4" />{" "}
              <span className="hidden sm:inline">Reset</span>
            </button>
          )}
          <button
            onClick={onPresetsClick}
            className="rounded-xl flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium hover:bg-black/5 transition-all flex-1 sm:flex-none"
            style={inputStyle}
          >
            <Bookmark className="w-4 h-4 text-gray-500" />{" "}
            <span className="hidden sm:inline">Presets</span>
          </button>
          <button
            onClick={onFiltersClick}
            className="rounded-xl flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium hover:bg-black/5 transition-all flex-1 sm:flex-none relative"
            style={inputStyle}
          >
            <Filter className="w-4 h-4 text-gray-500" />{" "}
            <span className="hidden sm:inline">Filters</span>
            {hasActiveFilters && (
              <span className="ml-1 bg-blue-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                {Object.keys(filters).length}
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="rounded-xl flex items-center justify-center p-2.5 flex-shrink-0 hover:bg-black/5 transition-all"
            style={inputStyle}
            title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
          >
            {isFullscreen ? (
              <Minimize className="w-4 h-4 text-gray-500" />
            ) : (
              <Maximize className="w-4 h-4 text-gray-500" />
            )}
          </button>
        </div>
      </div>

      <div
        className={`hidden lg:block overflow-x-auto custom-scrollbar ${isFullscreen ? "flex-1 overflow-y-auto min-h-0" : ""
          }`}
      >
        <table className="w-full min-w-[1180px] text-left border-collapse">
          <thead className={isFullscreen ? "sticky top-0 z-20" : ""}>
            <tr style={{ backgroundColor: "#F9FAFB" }}>
              <th
                className="p-4 text-left align-middle font-semibold text-xs uppercase tracking-wider sticky left-0 z-30"
                style={{
                  backgroundColor: "#F9FAFB",
                  color: "#64748b",
                  width: 52,
                  minWidth: 52,
                }}
              >
                <Checkbox
                  checked={
                    displayedRows.length > 0 &&
                    displayedRows.every(
                      (r) => r._id && selectedIds.has(r._id)
                    )
                  }
                  onCheckedChange={(c) => toggleSelectAll(Boolean(c))}
                  className="border-slate-300"
                />
              </th>
              <th
                className="p-4 text-left font-semibold text-xs uppercase tracking-wider text-gray-500 cursor-pointer hover:bg-black/5 transition-colors"
                onClick={() => onSort?.("serial")}
              >
                <div className="flex items-center gap-2">
                  S.NO
                  <SortIcon field="serial" />
                </div>
              </th>
              <th
                className="p-4 text-left font-semibold text-xs uppercase tracking-wider text-gray-500 cursor-pointer hover:bg-black/5 transition-colors"
                onClick={() => onSort?.("name")}
              >
                <div className="flex items-center gap-2">
                  Webinar Name
                  <SortIcon field="name" />
                </div>
              </th>
              <th
                className="p-4 text-left font-semibold text-xs uppercase tracking-wider text-gray-500 cursor-pointer hover:bg-black/5 transition-colors"
                onClick={() => onSort?.("date")}
              >
                <div className="flex items-center gap-2">
                  Date
                  <SortIcon field="date" />
                </div>
              </th>
              <th
                className="p-4 text-left font-semibold text-xs uppercase tracking-wider text-gray-500 cursor-pointer hover:bg-black/5 transition-colors"
                onClick={() => onSort?.("registrations")}
              >
                <div className="flex items-center gap-2">
                  Registrations
                  <SortIcon field="registrations" />
                </div>
              </th>
              <th
                className="p-4 text-left font-semibold text-xs uppercase tracking-wider text-gray-500 cursor-pointer hover:bg-black/5 transition-colors"
                onClick={() => onSort?.("participants")}
              >
                <div className="flex items-center gap-2">
                  Participants
                  <SortIcon field="participants" />
                </div>
              </th>
              <th
                className="p-4 text-left font-semibold text-xs uppercase tracking-wider text-gray-500 cursor-pointer hover:bg-black/5 transition-colors"
                onClick={() => onSort?.("attendees")}
              >
                <div className="flex items-center gap-2">
                  Attendees
                  <SortIcon field="attendees" />
                </div>
              </th>
              <th
                className="p-4 text-left font-semibold text-xs uppercase tracking-wider text-gray-500 cursor-pointer hover:bg-black/5 transition-colors"
                onClick={() => onSort?.("unAttended")}
              >
                <div className="flex items-center gap-2">
                  Un-Attended
                  <SortIcon field="unAttended" />
                </div>
              </th>
              <th className="p-4 text-center font-semibold text-xs uppercase tracking-wider text-gray-500 sticky right-0 bg-[#F9FAFB] z-10">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={9} className="px-6 py-20 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <AppLoader size="xl" />
                    <p className="text-sm font-medium text-gray-400">
                      Loading webinars...
                    </p>
                  </div>
                </td>
              </tr>
            ) : displayedRows.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-6 py-20 text-center">
                  <div className="flex flex-col items-center gap-3 opacity-40">
                    <Search className="w-10 h-10" />
                    <p className="text-sm font-medium">No webinars found.</p>
                  </div>
                </td>
              </tr>
            ) : (
              displayedRows.map((row, index) => {
                const rowId = row?._id;
                const isSelected = Boolean(rowId && selectedIds.has(rowId));
                const currentIndex = (Number(page) - 1) * limit + index;
                const serialDesc = totalRecords - currentIndex;
                const serialAsc = currentIndex + 1;
                const serial =
                  sortField === "serial"
                    ? sortDirection === "asc"
                      ? serialAsc
                      : serialDesc
                    : serialDesc;
                const webinarDate =
                  formatDateAsNumber(row?.webinarDate) ||
                  row?.webinarDate ||
                  "N/A";
                const selectedBg = "#f0fdf4";
                const cellBg = isSelected ? selectedBg : undefined;
                const stickyEdgeBg = isSelected ? selectedBg : "#ffffff";
                return (
                  <motion.tr
                    key={row?._id || index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.03 }}
                    className={`group border-b transition-all duration-200 ${isSelected ? "" : "hover:bg-black/5"
                      }`}
                    style={{
                      borderColor: "rgba(0,0,0,0.05)",
                      backgroundColor: cellBg,
                    }}
                  >
                    <td
                      className="p-4 align-middle sticky left-0 z-10 transition-colors"
                      style={{
                        backgroundColor: stickyEdgeBg,
                      }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => rowId && toggleSelect(rowId)}
                        className="border-slate-300"
                      />
                    </td>
                    <td
                      className="p-4 text-sm font-medium transition-colors"
                      style={{ color: "#64748b", backgroundColor: cellBg }}
                      onClick={() => onView(row)}
                    >
                      {serial}
                    </td>
                    <td
                      className="p-4 transition-colors"
                      style={{ backgroundColor: cellBg }}
                      onClick={() => onView(row)}
                    >
                      <button className="hover:underline text-sm font-semibold text-[#071028] text-left whitespace-nowrap">
                        {row?.webinarName || "N/A"}
                      </button>
                    </td>
                    <td
                      className="p-4 transition-colors"
                      style={{ backgroundColor: cellBg }}
                      onClick={() => onView(row)}
                    >
                      <div className="flex items-center gap-2 whitespace-nowrap text-sm font-medium text-[#64748b]">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <span>{webinarDate}</span>
                      </div>
                    </td>
                    <td
                      className="p-4 text-sm font-bold text-[#071028] transition-colors"
                      style={{ backgroundColor: cellBg }}
                    >
                      {row?.totalRegistrations ?? 0}
                    </td>
                    <td
                      className="p-4 text-sm font-bold text-[#071028] transition-colors"
                      style={{ backgroundColor: cellBg }}
                    >
                      {row?.totalParticipants ?? 0}
                    </td>
                    <td
                      className="p-4 text-sm font-bold transition-colors"
                      style={{
                        backgroundColor: cellBg,
                        color:
                          Number(row?.totalAttendees || 0) > 0
                            ? "#22B573"
                            : "#64748b",
                      }}
                    >
                      {row?.totalAttendees ?? 0}
                    </td>
                    <td
                      className="p-4 text-sm font-bold transition-colors"
                      style={{
                        backgroundColor: cellBg,
                        color:
                          Number(row?.totalUnAttended || 0) > 0
                            ? "#ef4444"
                            : "#64748b",
                      }}
                    >
                      {row?.totalUnAttended ?? 0}
                    </td>
                    <td
                      className="p-4 text-right sticky right-0 z-10 transition-colors"
                      style={{ backgroundColor: stickyEdgeBg }}
                    >
                      <div className="flex items-center justify-center gap-1">
                        <Button
                          variant="text"
                          size="small"
                          onClick={() => onView(row)}
                          className="!min-w-0 !p-2"
                          title="View"
                        >
                          <Eye className="w-4 h-4 text-purple-500" />
                        </Button>
                        {userData?.isActive && (
                          <Button
                            variant="text"
                            size="small"
                            onClick={() => onEdit(row)}
                            className="!min-w-0 !p-2"
                            title="Edit"
                          >
                            <Pencil className="w-4 h-4 text-green-500" />
                          </Button>
                        )}
                        <Button
                          variant="text"
                          size="small"
                          onClick={() => onCopy(row)}
                          className="!min-w-0 !p-2"
                          title="Copy Webinar Id"
                        >
                          <Copy className="w-4 h-4 text-blue-500" />
                        </Button>
                        {userData?.isActive && (
                          <Button
                            variant="text"
                            size="small"
                            onClick={() => onDelete(row)}
                            className="!min-w-0 !p-2"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </motion.tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <div className="lg:hidden p-4 space-y-4">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <AppLoader size="xl" />
            <p className="text-sm font-medium text-gray-400">
              Loading webinars...
            </p>
          </div>
        ) : displayedRows.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3 opacity-40">
            <Search className="w-10 h-10" />
            <p className="text-sm font-medium">No webinars found.</p>
          </div>
        ) : (
          displayedRows.map((row, index) => {
            const currentIndex = (Number(page) - 1) * limit + index;
            const serialDesc = totalRecords - currentIndex;
            const serialAsc = currentIndex + 1;
            const serial =
              sortField === "serial"
                ? sortDirection === "asc"
                  ? serialAsc
                  : serialDesc
                : serialDesc;
            const webinarDate =
              formatDateAsNumber(row?.webinarDate) || row?.webinarDate || "N/A";
            const rowId = row?._id;
            const isSelected = Boolean(rowId && selectedIds.has(rowId));
            return (
              <motion.div
                key={row?._id || index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.03 }}
                className={`rounded-xl border p-4 border-gray-200 ${isSelected ? "bg-green-50/80 ring-1 ring-[#22B573]/25" : "bg-white"
                  }`}
              >
                <div className="flex items-start justify-between mb-3 gap-2">
                  <div className="flex items-start gap-2 min-w-0 flex-1">
                    <div
                      className="pt-0.5 shrink-0"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => rowId && toggleSelect(rowId)}
                        className="border-slate-300"
                      />
                    </div>
                    <button
                      onClick={() => onView(row)}
                      className="text-base font-bold text-slate-800 text-left min-w-0"
                    >
                      {row?.webinarName || "N/A"}
                    </button>
                  </div>
                  <span className="text-xs rounded bg-slate-100 px-2 py-1 text-slate-600 shrink-0">
                    #{serial}
                  </span>
                </div>
                <div className="flex items-center gap-2 mb-3 text-sm text-slate-500">
                  <Calendar className="w-4 h-4" />
                  <span>{webinarDate}</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-lg px-3 py-2 bg-violet-50">
                    <p className="text-[11px] text-slate-500 mb-1">
                      Registrations
                    </p>
                    <p className="text-base font-bold text-slate-800">
                      {row?.totalRegistrations ?? 0}
                    </p>
                  </div>
                  <div className="rounded-lg px-3 py-2 bg-blue-50">
                    <p className="text-[11px] text-slate-500 mb-1">
                      Participants
                    </p>
                    <p className="text-base font-bold text-slate-800">
                      {row?.totalParticipants ?? 0}
                    </p>
                  </div>
                  <div className="rounded-lg px-3 py-2 bg-green-50">
                    <p className="text-[11px] text-slate-500 mb-1">Attendees</p>
                    <p className="text-base font-bold text-[#22B573]">
                      {row?.totalAttendees ?? 0}
                    </p>
                  </div>
                  <div className="rounded-lg px-3 py-2 bg-red-50">
                    <p className="text-[11px] text-slate-500 mb-1">
                      Un-Attended
                    </p>
                    <p className="text-base font-bold text-red-500">
                      {row?.totalUnAttended ?? 0}
                    </p>
                  </div>
                </div>
                <div className="mt-3 flex items-center justify-end gap-1">
                  <Button
                    variant="text"
                    size="small"
                    onClick={() => onView(row)}
                  >
                    <Eye className="w-4 h-4 text-purple-500" />
                  </Button>
                  {userData?.isActive && (
                    <Button
                      variant="text"
                      size="small"
                      onClick={() => onEdit(row)}
                    >
                      <Pencil className="w-4 h-4 text-green-500" />
                    </Button>
                  )}
                  <Button
                    variant="text"
                    size="small"
                    onClick={() => onCopy(row)}
                  >
                    <Copy className="w-4 h-4 text-blue-500" />
                  </Button>
                  {userData?.isActive && (
                    <Button
                      variant="text"
                      size="small"
                      onClick={() => onDelete(row)}
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  )}
                </div>
              </motion.div>
            );
          })
        )}
      </div>

      <div
        className="p-4 border-t flex flex-col sm:flex-row items-center justify-between gap-4 flex-shrink-0"
        style={{
          borderColor: "rgba(0,0,0,0.05)",
          backgroundColor: "#F9FAFB",
        }}
      >
        <div className="text-sm text-slate-500">
          Showing {Math.min(startIndex, totalRecords)} to{" "}
          {Math.min(endIndex, totalRecords)} of {totalRecords} webinars
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              const nextPage = Math.max(1, Number(page) - 1);
              if (nextPage !== Number(page)) {
                setPage(nextPage);
                logUserActivity({
                  action: "Page changed",
                  details: `User changed page For ${tableHeader} to ${nextPage} `,
                });
              }
            }}
            disabled={Number(page) === 1}
            className="px-3 py-1.5 rounded-lg text-sm border hover:bg-black/5 disabled:opacity-50"
            style={{ borderColor: "#e2e8f0", color: "#0f172a" }}
          >
            Previous
          </button>
          <div className="flex items-center gap-1">
            {Array.from({ length: Math.min(5, totalPages || 1) }, (_, i) => {
              let pageNum = i + 1;
              if ((totalPages || 1) > 5) {
                if (Number(page) > 3) {
                  pageNum = Number(page) - 3 + i;
                  if (pageNum + (5 - i - 1) > (totalPages || 1)) {
                    pageNum = (totalPages || 1) - 4 + i;
                  }
                }
              }
              return (
                <button
                  key={pageNum}
                  onClick={() => {
                    setPage(pageNum);
                    logUserActivity({
                      action: "Page changed",
                      details: `User changed page For ${tableHeader} to ${pageNum} `,
                    });
                  }}
                  className={`w-8 h-8 rounded-lg text-sm flex items-center justify-center transition-colors ${Number(page) === pageNum
                      ? "bg-blue-600 text-white"
                      : "hover:bg-black/5"
                    }`}
                  style={{
                    color: Number(page) !== pageNum ? "#0f172a" : undefined,
                  }}
                >
                  {pageNum}
                </button>
              );
            })}
          </div>
          <button
            onClick={() => {
              const maxPage = totalPages || 1;
              const nextPage = Math.min(maxPage, Number(page) + 1);
              if (nextPage !== Number(page)) {
                setPage(nextPage);
                logUserActivity({
                  action: "Page changed",
                  details: `User changed page For ${tableHeader} to ${nextPage} `,
                });
              }
            }}
            disabled={Number(page) === (totalPages || 1)}
            className="px-3 py-1.5 rounded-lg text-sm border hover:bg-black/5 disabled:opacity-50"
            style={{ borderColor: "#e2e8f0", color: "#0f172a" }}
          >
            Next
          </button>
        </div>
      </div>
    </motion.div>
  );

  const portalTarget =
    typeof document !== "undefined" ? document.body : null;

  return (
    <div className="space-y-6">
      <motion.div
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
      >
        <div>
          <h2 className="text-2xl font-bold tracking-tight flex items-center gap-3 text-[#071028]">
            All Webinars
            <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-green-50 text-[#22B573] border border-green-100">
              Total: {totalRecords}
            </span>
          </h2>
          <div className="flex flex-wrap items-center gap-3 mt-1">
            <p className="text-sm text-gray-500">
              Manage your scheduled webinars, track attendance, and assign
              teams.
            </p>
            <button
              onClick={onAssignmentMetrics}
              className="rounded-lg flex items-center justify-center gap-1.5 px-2.5 py-1 text-xs font-bold transition-all hover:scale-105 text-blue-500 border border-blue-200 bg-blue-50"
            >
              <TrendingUp className="w-3.5 h-3.5" />
              Assignment Metrics
            </button>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={onExportClick}
            className="rounded-xl flex items-center gap-2 px-4 py-2 text-sm font-medium transition-transform hover:scale-105 bg-white border border-slate-200 text-[#071028]"
          >
            <Download className="w-4 h-4 text-gray-500" />
            <span className="hidden sm:inline">Export</span>
          </button>
          <button
            onClick={onCreateWebinar}
            className="rounded-xl flex items-center gap-2 px-4 py-2 text-sm font-bold text-white shadow-sm transition-transform hover:scale-105 bg-[#22B573]"
          >
            <Plus className="w-4 h-4" />
            <span>Create Webinar</span>
          </button>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 mb-6">
        <motion.div
          className="rounded-lg px-4 py-2.5 border flex items-center gap-3"
          style={cardStyle}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0 }}
        >
          <div className="w-8 h-8 rounded-md flex items-center justify-center bg-violet-100">
            <Users className="w-4 h-4 text-violet-500" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-xl font-bold text-slate-800">
              {stats.registrations}
            </h3>
            <p className="text-xs text-slate-500">Total Registrations</p>
          </div>
          <TrendingUp className="w-3.5 h-3.5 text-green-500" />
        </motion.div>
        <motion.div
          className="rounded-lg px-4 py-2.5 border flex items-center gap-3"
          style={cardStyle}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.03 }}
        >
          <div className="w-8 h-8 rounded-md flex items-center justify-center bg-blue-100">
            <Users className="w-4 h-4 text-blue-500" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-xl font-bold text-slate-800">
              {stats.participants}
            </h3>
            <p className="text-xs text-slate-500">Total Participants</p>
          </div>
          <TrendingUp className="w-3.5 h-3.5 text-green-500" />
        </motion.div>
        <motion.div
          className="rounded-lg px-4 py-2.5 border flex items-center gap-3"
          style={cardStyle}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.06 }}
        >
          <div className="w-8 h-8 rounded-md flex items-center justify-center bg-green-100">
            <UserCheck className="w-4 h-4 text-[#22B573]" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-xl font-bold text-slate-800">
              {stats.attendees}
            </h3>
            <p className="text-xs text-slate-500">Total Attendees</p>
          </div>
        </motion.div>
        <motion.div
          className="rounded-lg px-4 py-2.5 border flex items-center gap-3"
          style={cardStyle}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.09 }}
        >
          <div className="w-8 h-8 rounded-md flex items-center justify-center bg-red-100">
            <UserX className="w-4 h-4 text-red-500" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-xl font-bold text-slate-800">
              {stats.unAttended}
            </h3>
            <p className="text-xs text-slate-500">Un-Attended</p>
          </div>
        </motion.div>
      </div>

      {isFullscreen && portalTarget
        ? createPortal(
          <div
            className={`fixed inset-0 z-[100] p-4 sm:p-6 flex flex-col ${isDark ? "bg-[#0f172a]" : "bg-[#F2F4F6]"
              }`}
          >
            {tableUI}
          </div>,
          portalTarget
        )
        : tableUI}
    </div>
  );
}
