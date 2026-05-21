import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Search,
  Filter,
  Download,
  Maximize,
  Minimize,
  Bookmark,
  ChevronLeft,
} from "lucide-react";
import AppLoader from "../AppLoader";
import PageLimitEditor from "../PageLimitEditor";
import useAddUserActivity from "../../hooks/useAddUserActivity";
import { formatDateAsNumberWithTime } from "../../utils/extra";
import { useTheme } from "../../contexts/ThemeContext";

const getInputStyle = (isDark) => ({
  backgroundColor: isDark ? "#1e293b" : "#ffffff",
  border: isDark ? "1px solid #334155" : "1px solid #e2e8f0",
  color: isDark ? "#f8fafc" : "#0f172a",
  fontFamily: "Inter, sans-serif",
});

/**
 * New UI shell for `/admin-logs` (aligned with frontend UI New `AdminActivityLogs` table).
 * Parent keeps Redux + thunks; this component is presentation + pagination controls only.
 */
export default function AdminActivityLogsTableShell({
  tableHeader,
  onBackClick,
  userActivities = [],
  isLoading,
  page,
  setPage,
  limit,
  totalPages,
  totalRecords = 0,
  onExportClick,
  onFiltersClick,
  onPresetsClick,
  rowClick,
  isRowClickable,
  hideHeader = false,
}) {
  const { isDark } = useTheme();
  const logUserActivity = useAddUserActivity();
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    setSearchQuery("");
  }, [page]);

  /** Client-side only on the current server page — matches new UI search field; does not change Redux/API. */
  const displayedActivities = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return userActivities;
    return userActivities.filter(
      (row) =>
        String(row?.action ?? "")
          .toLowerCase()
          .includes(q) ||
        String(row?.details ?? "")
          .toLowerCase()
          .includes(q),
    );
  }, [userActivities, searchQuery]);

  const maxPage = Math.max(1, Number(totalPages) || 1);
  const startIndex =
    userActivities.length === 0 ? 0 : (Number(page) - 1) * limit + 1;
  const endIndex = (Number(page) - 1) * limit + userActivities.length;
  const totalLabel =
    Number(totalRecords) > 0
      ? Number(totalRecords)
      : userActivities.length > 0 && maxPage <= 1
        ? endIndex
        : 0;
  const rangeTotal = totalLabel || endIndex;

  const TableCard = (
    <div
      className={`flex flex-col overflow-hidden rounded-2xl border transition-all duration-300 ${isFullscreen ? "min-h-0 flex-1 shadow-2xl" : ""
        }`}
      style={{
        background: isFullscreen 
          ? (isDark ? "#0f172a" : "#ffffff") 
          : (isDark ? "rgba(15, 23, 42, 0.7)" : "rgba(255, 255, 255, 0.7)"),
        backdropFilter: isFullscreen ? "none" : "blur(16px)",
        borderColor: isDark ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.4)",
        boxShadow: !isFullscreen 
          ? (isDark ? "0 10px 40px rgba(0, 0, 0, 0.4)" : "0 10px 40px rgba(7, 16, 40, 0.04)") 
          : "none",
      }}
    >
      <div
        className="flex flex-col items-center justify-between gap-4 border-b p-4 sm:flex-row"
        style={{ borderColor: "rgba(0,0,0,0.05)" }}
      >
        <div className="relative w-full sm:w-80">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search actions or details..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl py-2 pl-9 pr-4 text-sm transition-all focus:outline-none focus:ring-2 focus:ring-[#22B573]/35"
            style={getInputStyle(isDark)}
          />
        </div>
        <div className="flex w-full flex-shrink-0 items-center justify-end gap-2 self-end sm:w-auto sm:self-auto">
          {onExportClick && (
            <button
              type="button"
              onClick={onExportClick}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2 transition-colors hover:bg-black/5 sm:flex-none"
              style={getInputStyle(isDark)}
            >
              <Download className="h-4 w-4 text-gray-500 dark:text-slate-400" />
              <span className="hidden sm:inline">Export</span>
            </button>
          )}
          <button
            type="button"
            onClick={onPresetsClick}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2 transition-colors hover:bg-black/5 sm:flex-none"
            style={getInputStyle(isDark)}
          >
            <Bookmark className="h-4 w-4 text-gray-500 dark:text-slate-400" />
            <span className="hidden sm:inline">Presets</span>
          </button>
          <button
            type="button"
            onClick={onFiltersClick}
            className="flex flex-1 items-center gap-2 rounded-xl px-4 py-2 transition-colors hover:bg-black/5 sm:flex-none"
            style={getInputStyle(isDark)}
          >
            <Filter className="h-4 w-4 text-gray-500 dark:text-slate-400" />
            <span className="hidden sm:inline">Filters</span>
          </button>
          <button
            type="button"
            title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
            onClick={() => setIsFullscreen((v) => !v)}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2 transition-colors hover:bg-black/5 sm:flex-none"
            style={getInputStyle(isDark)}
          >
            {isFullscreen ? (
              <Minimize className="h-4 w-4 text-gray-500 dark:text-slate-400" />
            ) : (
              <Maximize className="h-4 w-4 text-gray-500 dark:text-slate-400" />
            )}
          </button>
        </div>
      </div>

      <div
        className={`custom-scrollbar overflow-x-auto ${isFullscreen ? "min-h-0 flex-1 overflow-y-auto" : ""
          }`}
      >
        <table className="w-full min-w-[800px] border-collapse text-left">
          <thead className={isFullscreen ? "sticky top-0 z-20" : ""}>
            <tr style={{ backgroundColor: isDark ? "#1e293b" : "#F9FAFB" }}>
              <th
                className="whitespace-nowrap p-4 text-xs font-semibold uppercase tracking-wider transition-colors"
                style={{ color: isDark ? "#94a3b8" : "#64748b" }}
              >
                S.No
              </th>
              <th
                className="whitespace-nowrap p-4 text-xs font-semibold uppercase tracking-wider transition-colors"
                style={{ color: isDark ? "#94a3b8" : "#64748b" }}
              >
                Actions
              </th>
              <th
                className="whitespace-nowrap p-4 text-xs font-semibold uppercase tracking-wider transition-colors"
                style={{ color: isDark ? "#94a3b8" : "#64748b" }}
              >
                Details
              </th>
              <th
                className="whitespace-nowrap p-4 text-xs font-semibold uppercase tracking-wider transition-colors"
                style={{ color: isDark ? "#94a3b8" : "#64748b" }}
              >
                Date
              </th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td
                  colSpan={4}
                  className="p-8 text-center"
                  style={{ color: "#64748b" }}
                >
                  <div className="flex flex-col items-center justify-center gap-3">
                    <AppLoader size="lg" />
                    <p style={{ fontFamily: "Inter, sans-serif" }}>
                      Loading logs...
                    </p>
                  </div>
                </td>
              </tr>
            ) : userActivities.length === 0 ? (
              <tr>
                <td
                  colSpan={4}
                  className="p-8 text-center transition-colors"
                  style={{ color: isDark ? "#94a3b8" : "#64748b" }}
                >
                  <p style={{ fontFamily: "Inter, sans-serif" }}>
                    No activity logs found.
                  </p>
                </td>
              </tr>
            ) : displayedActivities.length === 0 ? (
              <tr>
                <td
                  colSpan={4}
                  className="p-8 text-center transition-colors"
                  style={{ color: isDark ? "#94a3b8" : "#64748b" }}
                >
                  <p style={{ fontFamily: "Inter, sans-serif" }}>
                    No activity logs found matching your filters.
                  </p>
                </td>
              </tr>
            ) : (
              displayedActivities.map((row, index) => {
                const idxInPage = userActivities.indexOf(row);
                const serial =
                  idxInPage >= 0
                    ? (Number(page) - 1) * limit + idxInPage + 1
                    : (Number(page) - 1) * limit + 1;
                const key = row?._id ?? `log-${serial}`;
                return (
                  <motion.tr
                    key={key}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.03 }}
                    onClick={() => isRowClickable && rowClick?.(row)}
                    className={`border-b transition-colors ${isRowClickable
                      ? "cursor-pointer hover:bg-black/5 dark:hover:bg-white/5"
                      : "hover:bg-black/5 dark:hover:bg-white/5"
                      }`}
                    style={{ borderColor: isDark ? "#1e293b" : "#e2e8f0" }}
                  >
                    <td
                      className="p-4 text-sm font-medium transition-colors"
                      style={{
                        color: isDark ? "#94a3b8" : "#64748b",
                        fontFamily: "Inter, sans-serif",
                      }}
                    >
                      {serial}
                    </td>
                    <td
                      className="whitespace-nowrap p-4 text-sm"
                      style={{
                        color: isDark ? "#cbd5e1" : "#334155",
                        fontFamily: "Inter, sans-serif",
                      }}
                    >
                      {row?.action ?? "—"}
                    </td>
                    <td
                      className="p-4 text-sm transition-colors"
                      style={{
                        color: isDark ? "#cbd5e1" : "#334155",
                        fontFamily: "Inter, sans-serif",
                      }}
                    >
                      <span className={isDark ? "text-slate-100" : "text-slate-900 dark:text-white"}>{row?.details ?? "—"}</span>
                    </td>
                    <td
                      className="whitespace-nowrap p-4 text-sm transition-colors"
                      style={{
                        color: isDark ? "#94a3b8" : "#475569",
                        fontFamily: "Inter, sans-serif",
                      }}
                    >
                      {row?.createdAt
                        ? formatDateAsNumberWithTime(row.createdAt)
                        : "—"}
                    </td>
                  </motion.tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination bar aligned with `WebinarTableShell` + BillingHistory (range + Show + Prev / pages / Next) */}
      <div
        className="flex flex-shrink-0 flex-col gap-4 border-t p-4 sm:flex-row sm:items-center sm:justify-between"
        style={{
          borderColor: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)",
          backgroundColor: isDark ? "#1e293b" : "#F9FAFB",
        }}
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-4">
          <div className="text-sm text-slate-500 dark:text-slate-400">
            {rangeTotal > 0
              ? `Showing ${Math.min(startIndex, rangeTotal)} to ${Math.min(endIndex, rangeTotal)} of ${rangeTotal} activity logs`
              : "Showing 0 to 0 of 0 activity logs"}
            {searchQuery.trim() &&
              displayedActivities.length !== userActivities.length &&
              userActivities.length > 0 && (
                <span className="block text-xs text-slate-400 sm:inline sm:pl-1">
                  ({displayedActivities.length} visible after search on this page)
                </span>
              )}
          </div>
          <PageLimitEditor
            setPage={setPage}
            pageId={tableHeader}
            label="Show"
          />
        </div>
        <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-end">
          <button
            type="button"
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
            className="rounded-lg border px-3 py-1.5 text-sm transition-colors hover:bg-black/5 dark:hover:bg-white/5 disabled:opacity-50"
            style={{ 
              borderColor: isDark ? "#334155" : "#e2e8f0", 
              color: isDark ? "#f8fafc" : "#0f172a",
              backgroundColor: isDark ? "#1e293b" : "transparent"
            }}
          >
            Previous
          </button>
          <div className="flex items-center gap-1">
            {Array.from({ length: Math.min(5, maxPage) }, (_, i) => {
              let pageNum = i + 1;
              if (maxPage > 5) {
                if (Number(page) > 3) {
                  pageNum = Number(page) - 3 + i;
                  if (pageNum + (5 - i - 1) > maxPage) {
                    pageNum = maxPage - 4 + i;
                  }
                }
              }
              return (
                <button
                  type="button"
                  key={pageNum}
                  onClick={() => {
                    setPage(pageNum);
                    logUserActivity({
                      action: "Page changed",
                      details: `User changed page For ${tableHeader} to ${pageNum} `,
                    });
                  }}
                  className={`flex h-8 w-8 items-center justify-center rounded-lg text-sm transition-colors ${Number(page) === pageNum
                    ? "bg-blue-600 text-white"
                    : `${isDark ? "text-slate-300 hover:bg-white/5" : "text-[#0f172a] hover:bg-black/5"}`
                    }`}
                >
                  {pageNum}
                </button>
              );
            })}
          </div>
          <button
            type="button"
            onClick={() => {
              const nextPage = Math.min(maxPage, Number(page) + 1);
              if (nextPage !== Number(page)) {
                setPage(nextPage);
                logUserActivity({
                  action: "Page changed",
                  details: `User changed page For ${tableHeader} to ${nextPage} `,
                });
              }
            }}
            disabled={Number(page) === maxPage}
            className="rounded-lg border px-3 py-1.5 text-sm transition-colors hover:bg-black/5 dark:hover:bg-white/5 disabled:opacity-50"
            style={{ 
              borderColor: isDark ? "#334155" : "#e2e8f0", 
              color: isDark ? "#f8fafc" : "#0f172a",
              backgroundColor: isDark ? "#1e293b" : "transparent"
            }}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );

  useEffect(() => {
    if (isFullscreen) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = prev;
      };
    }
  }, [isFullscreen]);

  if (isFullscreen) {
    return (
      <div
        className="fixed inset-0 z-[100] flex flex-col"
        style={{ backgroundColor: isDark ? "#0f172a" : "#F2F4F6" }}
      >
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden p-4 sm:p-6">
          {TableCard}
        </div>
      </div>
    );
  }

  return (
    <div className={`mx-auto w-full min-w-0 max-w-[1600px] ${!hideHeader ? "space-y-6" : ""}`}>
      {!hideHeader && (
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div className="flex items-center gap-3">
            {typeof onBackClick === "function" && (
              <button
                type="button"
                onClick={onBackClick}
                className="rounded-xl p-2 text-slate-600 dark:text-slate-400 transition-colors hover:bg-gray-200 dark:hover:bg-slate-800"
                aria-label="Go back"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
            )}
            <h2
              className="text-2xl font-bold tracking-tight"
              style={{
                color: isDark ? "#f8fafc" : "#071028",
                fontFamily: "Inter, sans-serif",
              }}
            >
              {tableHeader}
            </h2>
          </div>
        </div>
      )}

      {TableCard}
    </div>
  );
}
