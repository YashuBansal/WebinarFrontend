/* eslint-disable react/prop-types -- internal dashboard modal; caller guarantees props */
import { useEffect } from "react";
import { useTheme } from "../../contexts/ThemeContext";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Controller } from "react-hook-form";
import { Filter, RotateCcw, X } from "lucide-react";

function dateToYMD(d) {
  if (!d || !(d instanceof Date) || Number.isNaN(d.getTime())) return "";
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function ymdToLocalDateStart(ymd) {
  if (!ymd || typeof ymd !== "string") return null;
  const parts = ymd.split("-").map(Number);
  if (parts.length !== 3 || parts.some((n) => Number.isNaN(n))) return null;
  const [y, mo, day] = parts;
  return new Date(y, mo - 1, day, 0, 0, 0, 0);
}

function ymdToLocalDateEnd(ymd) {
  if (!ymd || typeof ymd !== "string") return null;
  const parts = ymd.split("-").map(Number);
  if (parts.length !== 3 || parts.some((n) => Number.isNaN(n))) return null;
  const [y, mo, day] = parts;
  const d = new Date(y, mo - 1, day, 23, 59, 59, 999);
  return d;
}

const getInputStyle = (isDark) => ({
  backgroundColor: isDark ? "#1e293b" : "#ffffff",
  border: isDark ? "1px solid #334155" : "1px solid #e2e8f0",
  color: isDark ? "#f8fafc" : "#0f172a",
  fontFamily: "Inter, sans-serif",
});

const getLabelStyle = (isDark) => ({
  color: isDark ? "#94a3b8" : "#475569",
  fontSize: "11px",
  fontWeight: 600,
  marginBottom: "2px",
  display: "block",
  textTransform: "uppercase",
  letterSpacing: "0.5px",
});

/**
 * Filter dialog for admin activity logs — matches `frontend UI New` AdminActivityLogs filter panel.
 */
export default function AdminActivityLogsFilterModal({
  open,
  onClose,
  control,
  handleSubmit,
  onSubmit,
  resetForm,
  actionOptions,
}) {
  const { isDark } = useTheme();
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (typeof document === "undefined") return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          key="admin-activity-filter-modal"
          className="fixed inset-0 z-[200] flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            aria-hidden
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", duration: 0.4, bounce: 0 }}
            className="relative z-10 flex max-h-[90dvh] w-full max-w-[800px] flex-col overflow-hidden rounded-2xl shadow-2xl"
            style={{
              backgroundColor: isDark ? "#0f172a" : "#ffffff",
              border: isDark ? "1px solid #1e293b" : "1px solid #e5e7eb",
            }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="admin-activity-filter-title"
          >
            <div
              className="flex flex-shrink-0 items-center justify-between border-b p-4"
              style={{ borderColor: isDark ? "#1e293b" : "#e5e7eb" }}
            >
              <h3
                id="admin-activity-filter-title"
                className="flex items-center gap-2 text-lg font-bold"
                style={{ color: isDark ? "#f8fafc" : "#0f172a", fontFamily: "Inter, sans-serif" }}
              >
                <Filter className="h-5 w-5 text-gray-500 dark:text-slate-400" />
                User Activity Logs Filters
              </h3>
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg p-1.5 transition-colors hover:bg-black/5 dark:hover:bg-white/5"
                aria-label="Close filters"
              >
                <X className="h-5 w-5 text-gray-500 dark:text-slate-400" />
              </button>
            </div>

            <form
              onSubmit={handleSubmit(onSubmit)}
              className="flex min-h-0 flex-1 flex-col"
            >
              <div className="grid flex-1 grid-cols-1 gap-6 overflow-y-auto p-6 md:grid-cols-3">
                <div>
                  <span style={getLabelStyle(isDark)}>Action</span>
                  <Controller
                    name="action"
                    control={control}
                    defaultValue=""
                    render={({ field }) => (
                      <select
                        {...field}
                        value={field.value || ""}
                        className="w-full cursor-pointer appearance-none rounded-xl p-2.5 text-sm transition-all focus:outline-none focus:ring-2 focus:ring-[#22B573]/35"
                        style={getInputStyle(isDark)}
                      >
                        <option value="">All Actions</option>
                        {actionOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    )}
                  />
                </div>
                <div>
                  <span style={getLabelStyle(isDark)}>Date (From)</span>
                  <Controller
                    name="fromDate"
                    control={control}
                    render={({ field }) => (
                      <input
                        type="date"
                        value={dateToYMD(field.value)}
                        onChange={(e) => {
                          const v = e.target.value;
                          field.onChange(v ? ymdToLocalDateStart(v) : null);
                        }}
                        className="w-full rounded-xl p-2.5 text-sm transition-all focus:outline-none focus:ring-2 focus:ring-[#22B573]/35"
                        style={getInputStyle(isDark)}
                      />
                    )}
                  />
                </div>
                <div>
                  <span style={getLabelStyle(isDark)}>Date (To)</span>
                  <Controller
                    name="toDate"
                    control={control}
                    render={({ field }) => (
                      <input
                        type="date"
                        value={dateToYMD(field.value)}
                        onChange={(e) => {
                          const v = e.target.value;
                          field.onChange(v ? ymdToLocalDateEnd(v) : null);
                        }}
                        className="w-full rounded-xl p-2.5 text-sm transition-all focus:outline-none focus:ring-2 focus:ring-[#22B573]/35"
                        style={getInputStyle(isDark)}
                      />
                    )}
                  />
                </div>
              </div>

              <div
                className="flex-shrink-0 border-t p-4"
                style={{
                  borderColor: isDark ? "#1e293b" : "#e5e7eb",
                  backgroundColor: isDark ? "#1e293b" : "#F9FAFB",
                }}
              >
                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      resetForm();
                    }}
                    className="flex items-center gap-2 rounded-xl px-4 py-2 font-medium transition-colors hover:bg-black/5 dark:hover:bg-white/5"
                    style={{
                      backgroundColor: "transparent",
                      border: isDark ? "1px solid #334155" : "1px solid #cbd5e1",
                      color: isDark ? "#94a3b8" : "#475569",
                      fontFamily: "Inter, sans-serif",
                    }}
                  >
                    <RotateCcw className="h-4 w-4" />
                    Reset
                  </button>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={onClose}
                      className="rounded-xl px-5 py-2 font-medium transition-colors hover:bg-black/5 dark:hover:bg-white/5"
                      style={{
                        backgroundColor: "transparent",
                        border: "none",
                        color: isDark ? "#64748b" : "#64748b",
                        fontFamily: "Inter, sans-serif",
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="rounded-xl px-6 py-2 font-semibold transition-all hover:scale-105"
                      style={{
                        backgroundColor: "#22B573",
                        color: "#ffffff",
                        border: "none",
                        boxShadow: "0 4px 10px rgba(34, 181, 115, 0.25)",
                        fontFamily: "Inter, sans-serif",
                      }}
                    >
                      Apply Filters
                    </button>
                  </div>
                </div>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
