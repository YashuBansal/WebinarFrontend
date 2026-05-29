import { useCallback, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Download,
  Filter,
  LayoutGrid,
  Eye,
  LayoutDashboard,
  Pencil,
  Power,
  Table2,
  Search,
  Bookmark,
} from "lucide-react";
import AppLoader from "../AppLoader";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Checkbox } from "../ui/checkbox";
import PageLimitEditor from "../PageLimitEditor";
import { getRoleNameByID } from "../../utils/roles";

function initialsFromRow(row) {
  const n = String(row?.userName || row?.email || "?").trim();
  const parts = n.split(/\s+/).filter(Boolean);
  if (parts.length >= 2)
    return (parts[0][0] + parts[1][0]).toUpperCase().slice(0, 2);
  return n.slice(0, 2).toUpperCase();
}

function roleBadgeClass(roleId, isDark) {
  const name = getRoleNameByID(roleId).toUpperCase();
  if (name.includes("SALES"))
    return isDark
      ? "border-orange-500/40 bg-orange-500/15 text-orange-300"
      : "border-orange-200 bg-orange-50 text-orange-700";
  if (name.includes("REMINDER"))
    return isDark
      ? "border-blue-500/40 bg-blue-500/15 text-blue-300"
      : "border-blue-200 bg-blue-50 text-blue-700";
  if (name.includes("ADMIN"))
    return isDark
      ? "border-violet-500/40 bg-violet-500/15 text-violet-300"
      : "border-violet-200 bg-violet-50 text-violet-700";
  return isDark
    ? "border-slate-500/40 bg-slate-500/15 text-slate-300"
    : "border-slate-200 bg-slate-100 text-slate-700";
}

function compareVal(row, field) {
  switch (field) {
    case "userName":
      return String(row?.userName || "").toLowerCase();
    case "email":
      return String(row?.email || "").toLowerCase();
    case "role":
      return String(getRoleNameByID(row?.role) || "").toLowerCase();
    case "isActive":
      return row?.isActive ? 1 : 0;
    case "phone":
      return String(row?.phone || "").toLowerCase();
    case "validCallTime":
      return Number(row?.validCallTime) || 0;
    case "dailyContactLimit":
      return Number(row?.dailyContactLimit) || 0;
    case "dailyContactCount":
      return Number(row?.dailyContactCount) || 0;
    case "inactivityTime":
      return Number(row?.inactivityTime) || 0;
    default:
      return "";
  }
}

export default function EmployeesTableShell({
  theme = "light",
  listView = "table",
  onListViewChange,
  isDark,
  isLoading,
  rows,
  employeeInactivity,
  userData,
  page,
  setPage,
  totalPages,
  limit,
  tableHeader,
  onOpenFilters,
  onOpenExport,
  onView,
  onDashboard,
  onEdit,
  onToggleStatus,
  searchQuery,
  setSearchQuery,
  onOpenPresets,
}) {
  const [sortField, setSortField] = useState(null);
  const [sortDir, setSortDir] = useState("asc");
  const [selectedIds, setSelectedIds] = useState(() => new Set());

  const sortedRows = useMemo(() => {
    if (!sortField) return rows;
    const dir = sortDir === "asc" ? 1 : -1;
    return [...rows].sort(
      (a, b) =>
        compareVal(a, sortField) < compareVal(b, sortField)
          ? -1 * dir
          : compareVal(a, sortField) > compareVal(b, sortField)
            ? 1 * dir
            : 0
    );
  }, [rows, sortField, sortDir]);

  const handleSortClick = useCallback(
    (field) => {
      if (sortField !== field) {
        setSortField(field);
        setSortDir("asc");
        return;
      }
      if (sortDir === "asc") {
        setSortDir("desc");
        return;
      }
      setSortField(null);
      setSortDir("asc");
    },
    [sortField, sortDir]
  );

  const SortIcon = ({ field }) => {
    if (sortField !== field) {
      return <ArrowUpDown className="w-3.5 h-3.5 opacity-40" />;
    }
    if (sortDir === "asc") {
      return <ArrowUp className="w-3.5 h-3.5" style={{ color: "#3b82f6" }} />;
    }
    return <ArrowDown className="w-3.5 h-3.5" style={{ color: "#3b82f6" }} />;
  };

  const toggleOne = (id) => {
    if (!id) return;
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = (checked) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (checked) {
        sortedRows.forEach((r) => {
          if (r?._id) next.add(r._id);
        });
      } else {
        sortedRows.forEach((r) => {
          if (r?._id) next.delete(r._id);
        });
      }
      return next;
    });
  };

  const allSelected =
    sortedRows.length > 0 &&
    sortedRows.every((r) => r._id && selectedIds.has(r._id));

  const cardBorder = isDark ? "rgba(255,255,255,0.05)" : "rgba(255,255,255,0.4)";
  const cardBg = isDark ? "rgba(30, 41, 59, 0.7)" : "rgba(255, 255, 255, 0.7)";
  const startRow =
    sortedRows.length > 0 ? (Number(page) - 1) * limit + 1 : 0;
  const endRow = (Number(page) - 1) * limit + sortedRows.length;

  const thClass =
    "p-4 text-left font-semibold text-xs uppercase tracking-wider whitespace-nowrap text-gray-500 cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 transition-colors";
  /** Match Webinar attendees table S.No: normal weight, text-sm, gray body text */
  const thSnoClass =
    "p-4 text-left text-sm font-normal whitespace-nowrap select-none text-gray-600 dark:text-gray-400";

  return (
    <motion.div
      className="rounded-2xl overflow-hidden border flex flex-col transition-all duration-300"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: 0.08 }}
      style={{
        background: cardBg,
        backdropFilter: "blur(16px)",
        borderColor: cardBorder,
        boxShadow:
          !isDark ? "0 10px 40px rgba(7, 16, 40, 0.04)" : "none",
      }}
    >
      <div
        className="p-4 border-b flex flex-col sm:flex-row items-center justify-between gap-4"
        style={{ borderColor: isDark ? "#334155" : "rgba(0,0,0,0.05)" }}
      >
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search employees..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl text-sm focus:outline-none focus:ring-2 transition-all"
            style={{
              backgroundColor: isDark ? "rgba(15, 23, 42, 0.5)" : "#ffffff",
              border: `1px solid ${isDark ? "#334155" : "#e2e8f0"}`,
              color: isDark ? "#f8fafc" : "#0f172a",
            }}
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            className="rounded-xl flex items-center gap-2 px-4 shadow-sm"
            style={{
              backgroundColor: isDark ? "#1e293b" : "white",
              color: isDark ? "#f8fafc" : "#071028",
              border: `1px solid ${isDark ? "#334155" : "#e2e8eb"}`,
            }}
            onClick={onOpenPresets}
          >
            <Bookmark className="w-4 h-4 text-gray-500" />
            Presets
          </Button>
          <Button
            type="button"
            variant="outline"
            className="rounded-xl flex items-center gap-2 px-4 shadow-sm"
            style={{
              backgroundColor: isDark ? "#1e293b" : "white",
              color: isDark ? "#f8fafc" : "#071028",
              border: `1px solid ${isDark ? "#334155" : "#e2e8eb"}`,
            }}
            onClick={onOpenFilters}
          >
            <Filter className="w-4 h-4 shrink-0" />
            Filters
          </Button>
          {typeof onListViewChange === "function" && (
            <div
              className="flex rounded-xl p-0.5 shrink-0 border"
              style={{
                backgroundColor: isDark ? "#0f172a" : "#f1f5f9",
                borderColor: isDark ? "#334155" : "#e2e8f0",
              }}
              role="group"
              aria-label="View mode"
            >
              <button
                type="button"
                title="Table view"
                aria-pressed={listView === "table"}
                onClick={() => onListViewChange("table")}
                className="flex items-center justify-center p-2 rounded-[10px] transition-all"
                style={{
                  backgroundColor:
                    listView === "table"
                      ? isDark
                        ? "#1e293b"
                        : "#ffffff"
                      : "transparent",
                  color:
                    listView === "table"
                      ? isDark
                        ? "#f8fafc"
                        : "#071028"
                      : isDark
                        ? "#94a3b8"
                        : "#64748b",
                  boxShadow:
                    listView === "table" && theme === "light"
                      ? "0 1px 3px rgba(0,0,0,0.08)"
                      : "none",
                }}
              >
                <Table2 className="w-4 h-4 shrink-0" />
              </button>
              <button
                type="button"
                title="Card view"
                aria-pressed={listView === "cards"}
                onClick={() => onListViewChange("cards")}
                className="flex items-center justify-center p-2 rounded-[10px] transition-all"
                style={{
                  backgroundColor:
                    listView === "cards"
                      ? isDark
                        ? "#1e293b"
                        : "#ffffff"
                      : "transparent",
                  color:
                    listView === "cards"
                      ? isDark
                        ? "#f8fafc"
                        : "#071028"
                      : isDark
                        ? "#94a3b8"
                        : "#64748b",
                  boxShadow:
                    listView === "cards" && theme === "light"
                      ? "0 1px 3px rgba(0,0,0,0.08)"
                      : "none",
                }}
              >
                <LayoutGrid className="w-4 h-4 shrink-0" />
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="overflow-x-auto flex-1 min-h-0">
        <table className="w-full text-sm border-collapse min-w-[1100px]">
          <thead>
            <tr
              style={{
                backgroundColor: isDark ? "#1e293b" : "#F9FAFB",
                borderBottom: `1px solid ${isDark ? "#334155" : "#e2e8f0"}`,
              }}
            >
              <th className="p-4 w-12">
                <Checkbox
                  checked={allSelected}
                  onCheckedChange={(v) => toggleAll(Boolean(v))}
                  aria-label="Select all"
                />
              </th>
              <th className={thSnoClass}>S.No</th>
              <th className={thClass} onClick={() => handleSortClick("userName")}>
                <div className="flex items-center gap-2">
                  Employee <SortIcon field="userName" />
                </div>
              </th>
              <th className={thClass} onClick={() => handleSortClick("role")}>
                <div className="flex items-center gap-2">
                  Role <SortIcon field="role" />
                </div>
              </th>
              <th className={thClass} onClick={() => handleSortClick("isActive")}>
                <div className="flex items-center gap-2">
                  Status <SortIcon field="isActive" />
                </div>
              </th>
              <th className={thClass} onClick={() => handleSortClick("phone")}>
                <div className="flex items-center gap-2">
                  Phone <SortIcon field="phone" />
                </div>
              </th>
              <th
                className={thClass}
                onClick={() => handleSortClick("validCallTime")}
              >
                <div className="flex items-center gap-2">
                  Valid call (sec) <SortIcon field="validCallTime" />
                </div>
              </th>
              <th
                className={thClass}
                onClick={() => handleSortClick("dailyContactLimit")}
              >
                <div className="flex items-center gap-2">
                  Daily limit <SortIcon field="dailyContactLimit" />
                </div>
              </th>
              <th
                className={thClass}
                onClick={() => handleSortClick("dailyContactCount")}
              >
                <div className="flex items-center gap-2">
                  Daily count <SortIcon field="dailyContactCount" />
                </div>
              </th>
              {employeeInactivity && (
                <th
                  className={thClass}
                  onClick={() => handleSortClick("inactivityTime")}
                >
                  <div className="flex items-center gap-2">
                    Inactivity (sec) <SortIcon field="inactivityTime" />
                  </div>
                </th>
              )}
              <th
                className="p-4 text-left font-semibold text-xs uppercase tracking-wider whitespace-nowrap"
                style={{ color: isDark ? "#94a3b8" : "#64748b" }}
              >
                Tags
              </th>
              <th className="p-4 text-right font-semibold text-xs uppercase tracking-wider whitespace-nowrap sticky right-0 z-30"
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
                  colSpan={employeeInactivity ? 12 : 11}
                  className="p-8 text-center"
                  style={{ color: isDark ? "#94a3b8" : "#64748b" }}
                >
                  <div className="flex flex-col items-center justify-center gap-3">
                    <AppLoader size="lg" />
                    <p>Loading employees...</p>
                  </div>
                </td>
              </tr>
            ) : sortedRows.length === 0 ? (
              <tr>
                <td
                  colSpan={employeeInactivity ? 12 : 11}
                  className="p-8 text-center"
                  style={{ color: isDark ? "#94a3b8" : "#64748b" }}
                >
                  No employees found.
                </td>
              </tr>
            ) : (
              sortedRows.map((row, index) => {
                const id = row?._id;
                const selected = id && selectedIds.has(id);
                const sno = (Number(page) - 1) * Number(limit) + index + 1;
                return (
                  <motion.tr
                    key={id || index}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.02 }}
                    onClick={() => onView && onView(row)}
                    className="border-b transition-colors cursor-pointer"
                    style={{
                      borderColor: isDark ? "#334155" : "#e2e8f0",
                      backgroundColor: selected
                        ? isDark
                          ? "rgba(34, 181, 115, 0.08)"
                          : "rgba(34, 181, 115, 0.05)"
                        : "transparent",
                    }}
                  >
                    <td className="p-4 w-12" onClick={(e) => e.stopPropagation()}>
                      <Checkbox
                        checked={Boolean(id && selectedIds.has(id))}
                        onCheckedChange={() => toggleOne(id)}
                        aria-label="Select row"
                      />
                    </td>
                    <td className="p-4 text-sm font-normal whitespace-nowrap text-gray-600 dark:text-gray-400">
                      {sno}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold shrink-0 border-2 shadow-sm"
                          style={{
                            backgroundColor: isDark ? "#0f172a" : "#f1f5f9",
                            borderColor: isDark ? "#334155" : "#ffffff",
                            color: isDark ? "#e2e8f0" : "#071028",
                          }}
                        >
                          {initialsFromRow(row)}
                        </div>
                        <div className="min-w-0">
                          <div
                            className="font-semibold truncate"
                            style={{
                              color: isDark ? "#f8fafc" : "#071028",
                            }}
                          >
                            {row?.userName || "—"}
                          </div>
                          <div
                            className="text-xs truncate"
                            style={{ color: isDark ? "#94a3b8" : "#64748b" }}
                          >
                            {row?.email || ""}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <Badge
                        variant="outline"
                        className={roleBadgeClass(row?.role, isDark)}
                      >
                        {getRoleNameByID(row?.role)}
                      </Badge>
                    </td>
                    <td className="p-4">
                      {row?.isActive ? (
                        <Badge
                          variant="outline"
                          className={
                            isDark
                              ? "border-emerald-500/40 bg-emerald-500/15 text-emerald-300"
                              : "border-emerald-200 bg-emerald-50 text-emerald-700"
                          }
                        >
                          Active
                        </Badge>
                      ) : (
                        <Badge
                          variant="outline"
                          className={
                            isDark
                              ? "border-red-500/40 bg-red-500/15 text-red-300"
                              : "border-red-200 bg-red-50 text-red-700"
                          }
                        >
                          Inactive
                        </Badge>
                      )}
                    </td>
                    <td
                      className="p-4 whitespace-nowrap"
                      style={{ color: isDark ? "#e2e8f0" : "#334155" }}
                    >
                      {row?.phone || "—"}
                    </td>
                    <td
                      className="p-4"
                      style={{ color: isDark ? "#e2e8f0" : "#334155" }}
                    >
                      {row?.validCallTime ?? "—"}
                    </td>
                    <td
                      className="p-4"
                      style={{ color: isDark ? "#e2e8f0" : "#334155" }}
                    >
                      {row?.dailyContactLimit ?? "—"}
                    </td>
                    <td
                      className="p-4"
                      style={{ color: isDark ? "#e2e8f0" : "#334155" }}
                    >
                      {row?.dailyContactCount ?? "—"}
                    </td>
                    {employeeInactivity && (
                      <td
                        className="p-4"
                        style={{ color: isDark ? "#e2e8f0" : "#334155" }}
                      >
                        {row?.inactivityTime ?? "—"}
                      </td>
                    )}
                    <td className="p-4 max-w-[180px]">
                      <div className="flex flex-wrap gap-1">
                        {Array.isArray(row?.tags) && row.tags.length > 0 ? (
                          row.tags.slice(0, 4).map((t, i) => (
                            <Badge
                              key={`${id}-tag-${i}`}
                              variant="outline"
                              className={
                                isDark
                                  ? "border-slate-500/40 text-slate-200 text-[10px]"
                                  : "border-slate-200 text-slate-700 text-[10px]"
                              }
                            >
                              {String(t)}
                            </Badge>
                          ))
                        ) : (
                          <span
                            className="text-xs"
                            style={{ color: isDark ? "#64748b" : "#94a3b8" }}
                          >
                            —
                          </span>
                        )}
                      </div>
                    </td>
                    <td
                      className="p-4 text-right sticky right-0 z-10"
                      onClick={(e) => e.stopPropagation()}
                      style={{
                        backgroundColor: isDark
                          ? selected
                            ? "#1e293b"
                            : "#0f172a"
                          : selected
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
                          onClick={() => onView(row)}
                        >
                          <Eye className="w-4 h-4 text-blue-500" />
                        </Button>
                        {userData?.isActive && (
                          <>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="w-8 h-8 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10"
                              onClick={() => onDashboard(row)}
                            >
                              <LayoutDashboard className="w-4 h-4 text-slate-600 dark:text-slate-300" />
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="w-8 h-8 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-500/10"
                              onClick={() => onEdit(row)}
                            >
                              <Pencil className="w-4 h-4 text-blue-500" />
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="w-8 h-8 rounded-lg hover:bg-orange-50 dark:hover:bg-orange-500/10"
                              onClick={() => onToggleStatus(row)}
                            >
                              <Power
                                className={`w-4 h-4 ${row?.isActive ? "text-orange-500" : "text-emerald-500"}`}
                              />
                            </Button>
                          </>
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

      <div
        className="p-4 border-t flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 flex-shrink-0"
        style={{
          borderColor: isDark ? "#334155" : "rgba(0,0,0,0.05)",
          backgroundColor: isDark ? "rgba(15,23,42,0.4)" : "#F9FAFB",
        }}
      >
        <div className="flex flex-col sm:flex-row flex-wrap items-center gap-3 min-w-0">
          <PageLimitEditor pageId={tableHeader} setPage={setPage} />
          <div
            className="text-sm"
            style={{ color: isDark ? "#94a3b8" : "#64748b" }}
          >
            Showing {startRow} to {endRow} on this page (page {page} of{" "}
            {totalPages || 1})
          </div>
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
            }}
          >
            Previous
          </Button>
          <Button
            type="button"
            disabled={Number(page) >= totalPages || totalPages === 0}
            onClick={() =>
              setPage((p) => Math.min(totalPages || 1, Number(p) + 1))
            }
            className="px-3 py-1.5 rounded-lg text-sm transition-colors disabled:opacity-50"
            style={{
              backgroundColor: isDark ? "#1e293b" : "white",
              color: isDark ? "#f8fafc" : "#071028",
              border: `1px solid ${isDark ? "#334155" : "#e2e8f0"}`,
            }}
          >
            Next
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
