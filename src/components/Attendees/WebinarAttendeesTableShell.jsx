import { motion } from "framer-motion";
import { createPortal } from "react-dom";
import { Filter, Download, Bookmark, Maximize, Minimize, Settings2, Tag, ChevronDown, Activity, UserCheck } from "lucide-react";
import PageLimitEditor from "../PageLimitEditor";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "../ui/dropdown-menu";
import { Button } from "../ui/button";
import { cn } from "../../lib/utils";

export default function WebinarAttendeesTableShell({
  theme = "light",
  isDark,
  tabValue,
  total,
  selectedActivity,
  setSelectedActivity,
  selectedAssignmentType,
  setSelectedAssignmentType,
  isFullScreen,
  setIsFullScreen,
  onOpenFilters,
  onOpenExport,
  onOpenPresets,
  filters,
  setApplyTagsModalOpen,
  page,
  setPage,
  totalPages,
  limit,
  tableHeader,
  showAssignmentType = true,
  showActivityStatus = true,
  showExport = true,
  children,
}) {
  const cardBorder = isDark ? "rgba(255,255,255,0.05)" : "rgba(255,255,255,0.4)";
  const cardBg = isDark ? "rgba(15, 23, 42, 0.7)" : "rgba(255, 255, 255, 0.8)";

  const portalTarget = typeof document !== "undefined" ? document.body : null;

  const startRow = total > 0 ? (Number(page) - 1) * limit + 1 : 0;
  const endRow = Math.min((Number(page) - 1) * limit + (total > limit ? limit : total), total);

  const inputStyle = {
    backgroundColor: isDark ? "#0f172a" : "#ffffff",
    border: `1px solid ${isDark ? "#334155" : "rgba(0,0,0,0.1)"}`,
    color: isDark ? "#f8fafc" : "#0f172a",
  };

  const selectClasses = cn(
    "px-3 h-10 rounded-xl text-sm font-medium transition-all outline-none appearance-none cursor-pointer pr-10",
    isDark
      ? "bg-slate-900 border-slate-800 text-slate-200 focus:ring-blue-500/20"
      : "bg-white border-slate-200 text-slate-700 focus:ring-blue-500/10 shadow-sm"
  );

  const TableUI = (
    <motion.div
      className={cn(
        "rounded-2xl overflow-hidden border flex flex-col transition-all duration-500 ease-in-out shadow-2xl shadow-slate-900/10",
        isFullScreen ? "flex-1 h-full" : ""
      )}
      initial={{ opacity: 0, scale: 0.98, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      style={{
        background: isFullScreen ? (isDark ? "#1e293b" : "#ffffff") : cardBg,
        backdropFilter: isFullScreen ? "none" : "blur(24px)",
        borderColor: cardBorder,
        minHeight: isFullScreen ? "auto" : "600px",
      }}
    >
      {/* Controls Bar */}
      <div className="p-5 border-b border-slate-100 dark:border-slate-800/60 bg-white/40 dark:bg-slate-950/20 backdrop-blur-md">
        <div className="flex flex-col xl:flex-row items-center justify-between gap-6">
          {/* Left: Info and Status Selects */}
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6 w-full xl:w-auto">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-500/10 rounded-2xl">
                <UserCheck className="w-6 h-6 text-blue-500" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 leading-tight">
                  {tabValue === "preWebinar" ? "Reminder Leads" : "Sales Leads"}
                </h2>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-0.5">
                  Total Records: <span className="text-blue-500 font-bold">{total?.toLocaleString()}</span>
                </p>
              </div>
            </div>

            <div className="h-10 w-px bg-slate-200 dark:bg-slate-800 hidden md:block" />

            <div className="flex flex-wrap items-center gap-4 w-full md:w-auto">
              {showActivityStatus && (
                <div className="flex flex-col gap-1.5 flex-1 md:flex-none">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 ml-1">Activity Status</label>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(selectClasses, "flex items-center justify-between pr-3")}
                        style={inputStyle}
                      >
                        <span className="truncate">
                          {selectedActivity === "All" ? "All Activities" : selectedActivity}
                        </span>
                        <ChevronDown className="ml-2 h-4 w-4 opacity-50 shrink-0" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      align="start"
                      className="w-[var(--radix-dropdown-menu-trigger-width)] min-w-[var(--radix-dropdown-menu-trigger-width)] max-h-[300px] z-[100] overflow-y-auto overflow-x-hidden custom-scrollbar bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-xl p-1"
                    >
                      {["All", "Worked", "Pending"].map((o) => (
                        <DropdownMenuItem
                          key={o}
                          onClick={() => {
                            setSelectedActivity(o);
                            setPage(1);
                          }}
                          className="cursor-pointer rounded-lg px-3 py-2 text-sm hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200"
                        >
                          {o === "All" ? "All Activities" : o}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              )}

              {showAssignmentType && (
                <div className="flex flex-col gap-1.5 flex-1 md:flex-none">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 ml-1">Assignment</label>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(selectClasses, "flex items-center justify-between pr-3")}
                        style={inputStyle}
                      >
                        <span className="truncate">
                          {selectedAssignmentType === "All" ? "All Assignments" : selectedAssignmentType}
                        </span>
                        <ChevronDown className="ml-2 h-4 w-4 opacity-50 shrink-0" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      align="start"
                      className="w-[var(--radix-dropdown-menu-trigger-width)] min-w-[var(--radix-dropdown-menu-trigger-width)] max-h-[300px] z-[100] overflow-y-auto overflow-x-hidden custom-scrollbar bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-xl p-1"
                    >
                      {["All", "Assigned", "Not Assigned"].map((o) => (
                        <DropdownMenuItem
                          key={o}
                          onClick={() => {
                            setSelectedAssignmentType(o);
                            setPage(1);
                          }}
                          className="cursor-pointer rounded-lg px-3 py-2 text-sm hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200"
                        >
                          {o === "All" ? "All Assignments" : o}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              )}
            </div>
          </div>

          {/* Right: Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5 w-full xl:w-auto justify-end">
            {showExport && (
              <button
                type="button"
                onClick={onOpenExport}
                className="rounded-xl flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium hover:bg-black/5 transition-all flex-1 sm:flex-none"
                style={inputStyle}
              >
                <Download className="w-4 h-4 text-gray-500" />
                <span className="hidden sm:inline">Export</span>
              </button>
            )}
            <button
              type="button"
              onClick={onOpenPresets}
              className="rounded-xl flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium hover:bg-black/5 transition-all flex-1 sm:flex-none"
              style={inputStyle}
            >
              <Bookmark className="w-4 h-4 text-gray-500" />
              <span className="hidden sm:inline">Presets</span>
            </button>
            <button
              type="button"
              onClick={onOpenFilters}
              className="rounded-xl flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium hover:bg-black/5 transition-all flex-1 sm:flex-none relative"
              style={inputStyle}
            >
              <Filter className="w-4 h-4 text-gray-500" />
              <span className="hidden sm:inline">Filters</span>
              {Object.keys(filters || {}).length > 0 && (
                <span className="ml-1 bg-blue-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                  {Object.keys(filters).length}
                </span>
              )}
            </button>
            <button
              type="button"
              onClick={() => setIsFullScreen(!isFullScreen)}
              className="rounded-xl flex items-center justify-center p-2.5 flex-shrink-0 hover:bg-black/5 transition-all"
              style={inputStyle}
              title={isFullScreen ? "Exit Fullscreen" : "Fullscreen"}
            >
              {isFullScreen ? (
                <Minimize className="w-4 h-4 text-gray-500" />
              ) : (
                <Maximize className="w-4 h-4 text-gray-500" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Table Area */}
      <div className="flex-1 overflow-auto custom-scrollbar relative bg-white/20 dark:bg-slate-950/20">
        <table className="w-full text-left border-collapse" style={{ minWidth: "2000px" }}>
          {children}
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="p-4 border-t border-slate-100 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-950/40 backdrop-blur-md flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <PageLimitEditor pageId={tableHeader} setPage={setPage} />
          <div className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
            Showing <span className="text-slate-900 dark:text-slate-200">{startRow}</span> to <span className="text-slate-900 dark:text-slate-200">{endRow}</span> of <span className="text-blue-500">{total?.toLocaleString()}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            disabled={Number(page) <= 1}
            onClick={() => setPage((p) => Math.max(1, Number(p) - 1))}
            className="h-9 px-4 rounded-lg text-xs font-bold border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 disabled:opacity-40"
          >
            Previous
          </Button>
          <div className="px-3 h-9 flex items-center justify-center rounded-lg bg-blue-500 text-white text-xs font-bold shadow-lg shadow-blue-500/20">
            {page}
          </div>
          <Button
            variant="outline"
            disabled={Number(page) >= totalPages || totalPages === 0}
            onClick={() => setPage((p) => Math.min(totalPages || 1, Number(p) + 1))}
            className="h-9 px-4 rounded-lg text-xs font-bold border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 disabled:opacity-40"
          >
            Next
          </Button>
        </div>
      </div>
    </motion.div>
  );

  if (isFullScreen && portalTarget) {
    return createPortal(
      <div
        className={cn(
          "fixed inset-0 z-[100] p-4 sm:p-6 flex flex-col",
          isDark ? "bg-[#0f172a]" : "bg-[#F2F4F6]"
        )}
      >
        {TableUI}
      </div>,
      portalTarget
    );
  }

  return TableUI;
}
