import { useCallback, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  CheckSquare,
  Clock,
  Download,
  Filter,
  LayoutGrid,
  Pencil,
  PhoneCall,
  Power,
  TrendingUp,
  Table2,
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

function utilizationPct(row) {
  const l = Number(row?.dailyContactLimit);
  const c = Number(row?.dailyContactCount);
  if (!Number.isFinite(l) || l <= 0) return "—";
  return String(Math.min(100, Math.round((c / l) * 100)));
}

export default function EmployeesCardGrid({
  theme,
  listView = "cards",
  onListViewChange,
  isDark,
  isLoading,
  rows,
  userData,
  employeeInactivity,
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
}) {
  const [selectedIds, setSelectedIds] = useState(() => new Set());

  const toggleOne = useCallback((id) => {
    if (!id) return;
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const toggleAll = useCallback(
    (checked) => {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        if (checked) {
          rows.forEach((r) => {
            if (r?._id) next.add(r._id);
          });
        } else {
          rows.forEach((r) => {
            if (r?._id) next.delete(r._id);
          });
        }
        return next;
      });
    },
    [rows]
  );

  const allSelected = useMemo(
    () =>
      rows.length > 0 && rows.every((r) => r._id && selectedIds.has(r._id)),
    [rows, selectedIds]
  );

  const startRow = rows.length > 0 ? (Number(page) - 1) * limit + 1 : 0;
  const endRow = (Number(page) - 1) * limit + rows.length;

  const tileBg = isDark ? "rgba(15,23,42,0.5)" : "#F9FAFB";

  return (
    <motion.div
      className="space-y-4"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: 0.08 }}
    >
      <div
        className="rounded-2xl overflow-hidden border flex flex-col transition-all duration-300"
        style={{
          background: isDark ? "rgba(30, 41, 59, 0.7)" : "rgba(255, 255, 255, 0.7)",
          backdropFilter: "blur(16px)",
          borderColor: isDark ? "rgba(255,255,255,0.05)" : "rgba(255,255,255,0.4)",
          boxShadow: theme === "light" ? "0 10px 40px rgba(7, 16, 40, 0.04)" : "none",
        }}
      >
        <div
          className="p-4 border-b flex flex-col sm:flex-row items-center justify-between gap-4"
          style={{ borderColor: isDark ? "#334155" : "rgba(0,0,0,0.05)" }}
        >
          <div
            className="text-sm font-medium"
            style={{ color: isDark ? "#94a3b8" : "#64748b" }}
          >
            Employee roster
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {!isLoading && rows.length > 0 && (
              <div
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl border mr-1"
                style={{
                  borderColor: isDark ? "#334155" : "#e2e8f0",
                  backgroundColor: isDark ? "rgba(15,23,42,0.5)" : "rgba(248,250,252,0.9)",
                }}
              >
                <Checkbox
                  checked={allSelected}
                  onCheckedChange={(v) => toggleAll(Boolean(v))}
                  aria-label="Select all on page"
                />
                <span
                  className="text-xs font-medium hidden sm:inline"
                  style={{ color: isDark ? "#94a3b8" : "#64748b" }}
                >
                  Select all
                </span>
              </div>
            )}
            <Button
              type="button"
              variant="outline"
              className="rounded-xl flex items-center gap-2 px-4 shadow-sm"
              style={{
                backgroundColor: isDark ? "#1e293b" : "white",
                color: isDark ? "#f8fafc" : "#071028",
                border: `1px solid ${isDark ? "#334155" : "#e2e8eb"}`,
              }}
              onClick={onOpenExport}
            >
              <Download className="w-4 h-4 text-gray-500" />
              <span className="hidden sm:inline">Export</span>
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
              <Filter className="w-4 h-4" />
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
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <AppLoader size="lg" />
          <p
            className="mt-4 text-sm"
            style={{ color: isDark ? "#94a3b8" : "#64748b" }}
          >
            Loading employees...
          </p>
        </div>
      ) : rows.length === 0 ? (
        <div
          className="text-center py-16 text-sm"
          style={{ color: isDark ? "#94a3b8" : "#64748b" }}
        >
          No employees on this page.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 pt-4">
          <AnimatePresence>
            {rows.map((row, idx) => {
              const id = row?._id;
              const selected = id && selectedIds.has(id);
              const roleLabel = getRoleNameByID(row?.role);
              const presenceColor = row?.isActive ? "#22B573" : "#94a3b8";
              const lastLine = row?.isActive ? "Active" : "Inactive";
              const conv = utilizationPct(row);
              const validSec = row?.validCallTime ?? "—";
              const phoneLine = row?.phone
                ? `Phone · ${String(row.phone).slice(0, 18)}${String(row.phone).length > 18 ? "…" : ""}`
                : "Phone · —";

              return (
                <motion.div
                  layout
                  key={id || idx}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: idx * 0.04 }}
                  className={`relative rounded-2xl overflow-hidden transition-all duration-300 group flex flex-col ${
                    selected ? "ring-2 ring-[#22B573]/50 ring-offset-2 ring-offset-transparent" : ""
                  } hover:shadow-xl`}
                  style={{
                    background: isDark
                      ? "rgba(30, 41, 59, 0.6)"
                      : "rgba(255, 255, 255, 0.7)",
                    backdropFilter: "blur(16px)",
                    border: `1px solid ${isDark ? "rgba(255,255,255,0.05)" : "rgba(255,255,255,0.6)"}`,
                    boxShadow:
                      theme === "light"
                        ? "0 10px 40px rgba(7, 16, 40, 0.04)"
                        : "none",
                  }}
                >
                  <div
                    className="absolute top-3 left-3 z-20 p-0.5 rounded-md"
                    style={{
                      backgroundColor: isDark
                        ? "rgba(15,23,42,0.85)"
                        : "rgba(255,255,255,0.9)",
                      boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
                    }}
                  >
                    <Checkbox
                      checked={Boolean(id && selectedIds.has(id))}
                      onCheckedChange={() => toggleOne(id)}
                      aria-label="Select employee"
                      className="size-4"
                    />
                  </div>

                  <div
                    className="absolute -right-6 -bottom-6 w-24 h-24 rounded-full opacity-10 blur-2xl group-hover:scale-150 transition-transform duration-500 pointer-events-none"
                    style={{ backgroundColor: "#22B573" }}
                  />

                  <div
                    className="p-5 border-b flex items-start justify-between gap-3 pl-12"
                    style={{
                      borderColor: isDark ? "#334155" : "rgba(0,0,0,0.05)",
                    }}
                  >
                    <div className="flex items-center gap-4 min-w-0">
                      <div className="relative shrink-0">
                        <div
                          className="w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold shadow-sm border-2"
                          style={{
                            backgroundColor: isDark ? "#0f172a" : "#f1f5f9",
                            borderColor: isDark ? "#1e293b" : "#ffffff",
                            color: isDark ? "#e2e8f0" : "#071028",
                          }}
                        >
                          {initialsFromRow(row)}
                        </div>
                        <div
                          className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2"
                          style={{
                            borderColor: isDark ? "#1e293b" : "#ffffff",
                            backgroundColor: presenceColor,
                          }}
                        />
                      </div>
                      <div className="min-w-0">
                        <h3
                          className="font-bold text-base leading-tight truncate"
                          style={{
                            color: isDark ? "#f8fafc" : "#071028",
                          }}
                        >
                          {row?.userName || "—"}
                        </h3>
                        <p
                          className="text-xs mt-0.5 font-medium truncate"
                          style={{
                            color: isDark ? "#94a3b8" : "#64748b",
                          }}
                          title={roleLabel}
                        >
                          {roleLabel}
                        </p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="flex items-center gap-1.5 justify-end">
                        <Clock
                          className="w-3.5 h-3.5"
                          style={{
                            color: isDark ? "#64748b" : "#94a3b8",
                          }}
                        />
                        <span
                          className="text-xs font-medium whitespace-nowrap"
                          style={{
                            color: isDark ? "#94a3b8" : "#64748b",
                          }}
                        >
                          {lastLine}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="p-5 flex-1 grid grid-cols-2 gap-4 min-h-0">
                    <div className="space-y-1 min-w-0">
                      <p
                        className="text-xs uppercase tracking-wider font-semibold"
                        style={{
                          color: isDark ? "#64748b" : "#94a3b8",
                        }}
                      >
                        My Activity
                      </p>
                      <p
                        className="font-semibold text-sm flex items-start gap-1.5"
                        style={{ color: isDark ? "#e2e8f0" : "#334155" }}
                      >
                        <span
                          className="w-2 h-2 rounded-full shrink-0 mt-1.5"
                          style={{ backgroundColor: "#FF6B35" }}
                        />
                        <span className="line-clamp-2 break-words">
                          {phoneLine}
                        </span>
                      </p>
                      <p
                        className="text-[11px] truncate pl-3.5"
                        style={{ color: isDark ? "#64748b" : "#94a3b8" }}
                        title={row?.email}
                      >
                        {row?.email || "—"}
                      </p>
                    </div>
                    <div className="space-y-1 text-right">
                      <p
                        className="text-xs uppercase tracking-wider font-semibold"
                        style={{
                          color: isDark ? "#64748b" : "#94a3b8",
                        }}
                      >
                        Limit usage
                      </p>
                      <p className="font-bold text-sm" style={{ color: "#22B573" }}>
                        {conv === "—" ? "—" : `${conv}%`}
                      </p>
                      <p
                        className="text-[10px] font-medium"
                        style={{ color: isDark ? "#64748b" : "#94a3b8" }}
                      >
                        of daily limit
                      </p>
                    </div>

                    <div className="col-span-2 grid grid-cols-3 gap-2 mt-1">
                      <div
                        className="text-center p-3 rounded-xl"
                        style={{ backgroundColor: tileBg }}
                      >
                        <PhoneCall
                          className="w-4 h-4 mx-auto mb-1"
                          style={{ color: "#3b82f6" }}
                        />
                        <p
                          className="text-lg font-bold tabular-nums"
                          style={{
                            color: isDark ? "#f1f5f9" : "#071028",
                          }}
                        >
                          {validSec}
                        </p>
                        <p
                          className="text-[10px] uppercase font-bold leading-tight"
                          style={{
                            color: isDark ? "#64748b" : "#94a3b8",
                          }}
                        >
                          Valid call
                          <br />
                          <span className="font-semibold normal-case">(sec)</span>
                        </p>
                      </div>
                      <div
                        className="text-center p-3 rounded-xl"
                        style={{ backgroundColor: tileBg }}
                      >
                        <TrendingUp
                          className="w-4 h-4 mx-auto mb-1"
                          style={{ color: "#22B573" }}
                        />
                        <p
                          className="text-lg font-bold tabular-nums"
                          style={{
                            color: isDark ? "#f1f5f9" : "#071028",
                          }}
                        >
                          {row?.dailyContactCount ?? "—"}
                        </p>
                        <p
                          className="text-[10px] uppercase font-bold"
                          style={{
                            color: isDark ? "#64748b" : "#94a3b8",
                          }}
                        >
                          Daily count
                        </p>
                      </div>
                      <div
                        className="text-center p-3 rounded-xl"
                        style={{ backgroundColor: tileBg }}
                      >
                        <CheckSquare
                          className="w-4 h-4 mx-auto mb-1"
                          style={{ color: "#FF6B35" }}
                        />
                        <p
                          className="text-lg font-bold tabular-nums"
                          style={{
                            color: isDark ? "#f1f5f9" : "#071028",
                          }}
                        >
                          {row?.dailyContactLimit ?? "—"}
                        </p>
                        <p
                          className="text-[10px] uppercase font-bold"
                          style={{
                            color: isDark ? "#64748b" : "#94a3b8",
                          }}
                        >
                          Daily limit
                        </p>
                      </div>
                    </div>

                    {employeeInactivity && (
                      <div
                        className="col-span-2 flex justify-between items-center text-xs px-1 py-2 rounded-lg"
                        style={{
                          backgroundColor: isDark
                            ? "rgba(15,23,42,0.35)"
                            : "rgba(249,250,251,0.9)",
                        }}
                      >
                        <span
                          className="uppercase font-bold tracking-wider"
                          style={{ color: isDark ? "#64748b" : "#94a3b8" }}
                        >
                          Inactivity (sec)
                        </span>
                        <span
                          className="font-semibold tabular-nums"
                          style={{ color: isDark ? "#e2e8f0" : "#334155" }}
                        >
                          {row?.inactivityTime ?? "—"}
                        </span>
                      </div>
                    )}

                    {Array.isArray(row?.tags) && row.tags.length > 0 && (
                      <div className="col-span-2 flex flex-wrap gap-1.5 pt-1">
                        {row.tags.map((t, i) => (
                          <Badge
                            key={`${id}-t-${i}`}
                            variant="outline"
                            className={
                              isDark
                                ? "border-slate-500/35 text-slate-200 text-[10px] font-medium"
                                : "border-slate-200 text-slate-700 text-[10px] font-medium"
                            }
                          >
                            {String(t)}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>

                  <div
                    className="p-4 border-t flex flex-col gap-3"
                    style={{
                      borderColor: isDark ? "#334155" : "rgba(0,0,0,0.05)",
                      backgroundColor: isDark
                        ? "rgba(15,23,42,0.2)"
                        : "rgba(249,250,251,0.5)",
                    }}
                  >
                    <div className="flex gap-3">
                      <Button
                        type="button"
                        className={`rounded-xl transition-colors font-medium text-sm py-2.5 ${userData?.isActive ? "flex-1" : "w-full"}`}
                        style={{
                          backgroundColor: isDark ? "#1e293b" : "white",
                          color: isDark ? "#f8fafc" : "#071028",
                          border: `1px solid ${isDark ? "#334155" : "#e2e8f0"}`,
                          textAlign: "center",
                        }}
                        onClick={() => onView(row)}
                      >
                        View Profile
                      </Button>
                      {userData?.isActive && (
                        <Button
                          type="button"
                          className="flex-1 rounded-xl transition-colors font-medium text-sm py-2.5"
                          style={{
                            backgroundColor: "#071028",
                            color: "white",
                            border: "none",
                            textAlign: "center",
                          }}
                          onClick={() => onDashboard(row)}
                        >
                          Dashboard
                        </Button>
                      )}
                    </div>
                    {userData?.isActive && (
                      <div className="flex justify-center gap-2 pt-0.5">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="w-9 h-9 rounded-xl hover:bg-blue-500/10"
                          onClick={() => onEdit(row)}
                          title="Edit"
                        >
                          <Pencil className="w-4 h-4 text-blue-500" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="w-9 h-9 rounded-xl hover:bg-orange-500/10"
                          onClick={() => onToggleStatus(row)}
                          title="Toggle status"
                        >
                          <Power
                            className={`w-4 h-4 ${row?.isActive ? "text-orange-500" : "text-emerald-500"}`}
                          />
                        </Button>
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      <div
        className="p-4 rounded-2xl border flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4"
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
