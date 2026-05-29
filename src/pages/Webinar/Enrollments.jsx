import { lazy, Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import { enrollmentsColumn } from "../../utils/columnData";
import { getWebinarEnrollments } from "../../features/actions/attendees";
import { exportWebinarEnrollments } from "../../features/actions/export-excel";
import ModalFallback from "../../components/Fallback/ModalFallback";
import { motion } from "framer-motion";
import { Download, ChevronDown, Maximize, Minimize, Settings2, Tag, Search, UserCheck, Eye, Upload } from "lucide-react";
import PageLimitEditor from "../../components/PageLimitEditor";
import { Button } from "../../components/ui/button";
import { openModal } from "../../features/slices/modalSlice";
import { cn } from "../../lib/utils";
import { useTheme } from "../../contexts/ThemeContext";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "../../components/ui/dropdown-menu";

const ExportModal = lazy(() => import("../../components/Export/ExportModal"));

const Enrollments = (props) => {
  const tableHeader = "Enrollments";
  const exportModalName = "EnrollmentsModalName";

  const { id } = useParams();
  const { tabValue, page, setPage, webinarData } = props;
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { webinarEnrollments, totalPages, pagination, isLoading } = useSelector((state) => state.attendee);
  const total = pagination?.total || 0;
  
  const [selected, setSelected] = useState("All");
  const [isFullScreen, setIsFullScreen] = useState(false);
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const portalTarget = typeof document !== "undefined" ? document.body : null;

  const inputStyle = {
    backgroundColor: isDark ? "#0f172a" : "#ffffff",
    border: `1px solid ${isDark ? "#334155" : "rgba(0,0,0,0.1)"}`,
    color: isDark ? "#f8fafc" : "#0f172a",
  };

  const modalState = useSelector((state) => state.modals.modals);
  const exportModalOpen = modalState[exportModalName] ? true : false;

  const LIMIT = useSelector((state) => state.pageLimits[tableHeader] || 10);

  const productOptions = useMemo(() => {
    if (Array.isArray(webinarData?.productIds)) {
      return webinarData.productIds.map((product) => ({
        label: product.name,
        value: product._id,
      }));
    }
    return [];
  }, [webinarData]);

  const fetchData = useCallback(() => {
    dispatch(
      getWebinarEnrollments({
        id: id,
        page: page,
        limit: LIMIT,
        product: selected,
      })
    );
  }, [dispatch, id, page, LIMIT, selected]);

  const handleDownload = useCallback(
    ({ limit, columns }) => {
      dispatch(
        exportWebinarEnrollments({
          limit,
          columns,
          product: selected,
          webinarId: webinarData._id,
          webinarname: webinarData.webinarName,
        })
      );
    },
    [selected, webinarData]
  );

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const startRow = total > 0 ? (Number(page) - 1) * LIMIT + 1 : 0;
  const endRow = Math.min((Number(page) - 1) * LIMIT + (total > LIMIT ? LIMIT : total), total);

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
      style={{
        background: isFullScreen ? (isDark ? "#1e293b" : "#ffffff") : (isDark ? "rgba(30, 41, 59, 0.7)" : "rgba(255, 255, 255, 0.8)"),
        backdropFilter: isFullScreen ? "none" : "blur(24px)",
        borderColor: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.06)",
        minHeight: isFullScreen ? "auto" : "600px",
      }}
    >
      <div className={cn("p-5 border-b backdrop-blur-md", isDark ? "border-slate-800 bg-slate-950/20" : "border-slate-100 bg-white/40")}>
        <div className="flex flex-col xl:flex-row items-center justify-between gap-6">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6 w-full xl:w-auto">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-500/10 rounded-2xl">
                <UserCheck className="w-6 h-6 text-blue-500" />
              </div>
              <div>
                <h2 className={cn("text-lg font-bold leading-tight", isDark ? "text-slate-100" : "text-slate-900")}>
                  Enrollments
                </h2>
                <p className={cn("text-xs font-medium mt-0.5", isDark ? "text-slate-400" : "text-slate-500")}>
                  Total Records: <span className="text-blue-500 font-bold">{total?.toLocaleString()}</span>
                </p>
              </div>
            </div>

            <div className={cn("h-10 w-px hidden md:block", isDark ? "bg-slate-800" : "bg-slate-200")} />

            <div className="flex flex-col gap-1.5 w-full md:w-auto">
              <label className={cn("text-[10px] font-black uppercase tracking-widest ml-1", isDark ? "text-slate-500" : "text-slate-400")}>Activity</label>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "flex h-10 min-w-[160px] items-center justify-between rounded-xl px-3 py-2 text-sm font-medium outline-none transition-all duration-200 hover:bg-black/5 dark:hover:bg-white/10",
                      isDark ? "bg-slate-900 border-slate-800 text-slate-200" : "bg-white border-slate-200 text-slate-700 shadow-sm"
                    )}
                  >
                    <span className="truncate">
                      {selected === "All"
                        ? "All Activities"
                        : productOptions.find((p) => p.value === selected)?.label || "All Activities"}
                    </span>
                    <ChevronDown className="h-4 w-4 opacity-50 shrink-0" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="start"
                  className="w-[var(--radix-dropdown-menu-trigger-width)] min-w-[var(--radix-dropdown-menu-trigger-width)] max-h-[300px] z-[10000] overflow-y-auto overflow-x-hidden custom-scrollbar bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-xl p-1"
                >
                  <DropdownMenuItem
                    onClick={() => {
                      setSelected("All");
                      setPage(1);
                    }}
                    className="cursor-pointer rounded-lg px-3 py-2 text-sm hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200"
                  >
                    All Activities
                  </DropdownMenuItem>
                  {productOptions.map((product, index) => (
                    <DropdownMenuItem
                      key={index}
                      onClick={() => {
                        setSelected(product.value);
                        setPage(1);
                      }}
                      className="cursor-pointer rounded-lg px-3 py-2 text-sm hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200"
                    >
                      {product.label}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 w-full xl:w-auto justify-end">
            <button
              type="button"
              onClick={() => dispatch(openModal(exportModalName))}
              className="rounded-xl flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium hover:bg-black/5 transition-all flex-1 sm:flex-none"
              style={inputStyle}
            >
              <Download className="w-4 h-4 text-gray-500" />
              <span className="hidden sm:inline">Export</span>
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

      <div className={cn("flex-1 overflow-auto custom-scrollbar relative", isDark ? "bg-slate-950/20" : "bg-white/20")}>
        <table className="w-full text-left border-collapse min-w-[1000px]">
          <thead className="sticky top-0 z-20">
            <tr className={isDark ? "bg-slate-900" : "bg-[#F9FAFB]"}>
              <th className={cn("p-4 text-left font-semibold text-xs uppercase tracking-wider sticky left-0 z-30 w-16", isDark ? "text-slate-400 bg-slate-900" : "text-slate-500 bg-[#F9FAFB]")}>
                S.NO
              </th>
              {enrollmentsColumn.map((col) => (
                <th key={col.key} className={cn("p-4 text-left font-semibold text-xs uppercase tracking-wider", isDark ? "text-slate-400 bg-slate-900" : "text-slate-500 bg-[#F9FAFB]")}>
                  {col.header}
                </th>
              ))}
              <th className={cn("p-4 text-center font-semibold text-xs uppercase tracking-wider sticky right-0 z-30", isDark ? "text-slate-400 bg-slate-900" : "text-slate-500 bg-[#F9FAFB]")}>
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={enrollmentsColumn.length + 2} className="px-6 py-20 text-center text-slate-400 font-medium">
                  Loading enrollments...
                </td>
              </tr>
            ) : webinarEnrollments?.length > 0 ? (
              webinarEnrollments.map((item, index) => (
                <motion.tr
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.03 }}
                  key={item._id || index}
                  onClick={() => navigate(`/particularContact?email=${item?.attendee}&attendeeId=${item?.attendeeId}`)}
                  className={cn("group border-b transition-all duration-200 cursor-pointer", isDark ? "border-slate-800/60 hover:bg-slate-800/20" : "border-slate-100 hover:bg-black/5")}
                >
                  <td className={cn("p-4 text-sm font-bold sticky left-0 z-10 group-hover:bg-slate-50/80", isDark ? "text-slate-500 bg-slate-950 group-hover:bg-slate-900/80" : "text-slate-400 bg-white")}>
                    {startRow + index}
                  </td>
                  {enrollmentsColumn.map((col) => {
                    const val = item[col.key];
                    return (
                      <td key={col.key} className={cn("p-4 text-sm font-medium", isDark ? "text-slate-300" : "text-slate-700")}>
                        {val != null ? String(val) : "-"}
                      </td>
                    );
                  })}
                  <td className={cn("p-4 sticky right-0 z-10 group-hover:bg-slate-50/80", isDark ? "bg-slate-950 group-hover:bg-slate-900/80" : "bg-white")} onClick={(e) => e.stopPropagation()}>
                    <div className="flex justify-center">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => navigate(`/particularContact?email=${item?.attendee}&attendeeId=${item?.attendeeId}`)}
                        className={cn("h-8 w-8 rounded-lg", isDark ? "hover:bg-purple-500/10" : "hover:bg-purple-50")}
                        title="View Attendee Info"
                      >
                        <Eye className="w-4 h-4 text-purple-500" />
                      </Button>
                    </div>
                  </td>
                </motion.tr>
              ))
            ) : (
              <tr>
                <td colSpan={enrollmentsColumn.length + 2} className="px-6 py-20 text-center">
                  <p className="text-sm font-medium text-slate-400">No enrollments found.</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className={cn("p-4 border-t flex flex-col sm:flex-row items-center justify-between gap-4", isDark ? "border-slate-800 bg-slate-900/50" : "border-slate-100 bg-slate-50/50")}>
        <div className="flex items-center gap-4">
          <PageLimitEditor pageId={tableHeader} setPage={setPage} />
          <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">
            Showing <span className={isDark ? "text-slate-200" : "text-slate-900"}>{startRow}</span> to <span className={isDark ? "text-slate-200" : "text-slate-900"}>{endRow}</span> of <span className="text-blue-500">{total?.toLocaleString()}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            disabled={Number(page) <= 1}
            onClick={() => setPage((p) => Math.max(1, Number(p) - 1))}
            className={cn("h-9 px-4 rounded-lg text-xs font-bold disabled:opacity-40", isDark ? "bg-slate-900 border-slate-800 text-slate-300" : "bg-white border-slate-200")}
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
            className={cn("h-9 px-4 rounded-lg text-xs font-bold disabled:opacity-40", isDark ? "bg-slate-900 border-slate-800 text-slate-300" : "bg-white border-slate-200")}
          >
            Next
          </Button>
        </div>
      </div>
    </motion.div>
  );

  return (
    <>
      {isFullScreen && portalTarget ? (
        createPortal(
          <div
            className={cn(
              "fixed inset-0 z-[100] p-4 sm:p-6 flex flex-col",
              isDark ? "bg-[#0f172a]" : "bg-[#F2F4F6]"
            )}
          >
            {TableUI}
          </div>,
          portalTarget
        )
      ) : (
        TableUI
      )}

      {exportModalOpen && (
        <Suspense fallback={<ModalFallback />}>
          <ExportModal
            modalName={exportModalName}
            columns={enrollmentsColumn}
            tableName={tableHeader}
            handleExport={handleDownload}
          />
        </Suspense>
      )}
    </>
  );
};

export default Enrollments;
