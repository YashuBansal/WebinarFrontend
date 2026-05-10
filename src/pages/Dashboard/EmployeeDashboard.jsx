import { useCallback, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getEmployeeDashboardData } from "../../features/actions/globalData";
import { errorToast, formatDateAsNumber } from "../../utils/extra";
import { useNavigate, useParams } from "react-router-dom";
import { getEmployeeWebinars } from "../../features/actions/webinarContact";
import { clearEmplyeeDashboardData } from "../../features/slices/globalData";
import { setTableMasked } from "../../features/slices/tableSlice";
import { setWebinarAttendeesFilters } from "../../features/slices/filters.slice";
import { Search, ChevronDown } from "lucide-react";
import AppLoader from "../../components/AppLoader";
import { getIconConfig, statusToAccentColor } from "../../components/Dashboard/dashboardNewUiHelpers";
import { motion } from "framer-motion";
import { Card } from "../../components/ui/card";
import { useTheme } from "../../contexts/ThemeContext";

const BRAND = "#22B573";

function toYMD(d) {
  if (!(d instanceof Date) || Number.isNaN(d.getTime())) return "";
  return d.toISOString().split("T")[0];
}

function ymdToLocalDate(ymd) {
  if (!ymd || typeof ymd !== "string") return null;
  const parts = ymd.split("-").map(Number);
  if (parts.length !== 3 || parts.some((n) => Number.isNaN(n))) return null;
  const [y, m, day] = parts;
  return new Date(y, m - 1, day);
}

const EmployeeDashboard = () => {
  const employeeId = useParams()?.id;
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isDark } = useTheme();

  const { isLoading, employeeDashboardData } = useSelector(
    (state) => state.globalData
  );

  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());

  const { webinarData } = useSelector((state) => state.webinarContact);
  const [currentWebinar, setCurrentWebinar] = useState("select");
  const { isTablesMasked } = useSelector((state) => state.table);
  const [webinarOpen, setWebinarOpen] = useState(false);

  const fetchData = useCallback(() => {
    const formattedStartDate = startDate.toISOString().split("T")[0];
    const formattedEndDate = endDate.toISOString().split("T")[0];
    dispatch(
      getEmployeeDashboardData({
        startDate: formattedStartDate,
        endDate: formattedEndDate,
        webinarId: currentWebinar,
        employeeId,
      })
    );
  }, [dispatch, startDate, endDate, currentWebinar, employeeId]);

  useEffect(() => {
    fetchData();
    dispatch(getEmployeeWebinars({ employeeId }));
    return () => {
      dispatch(clearEmplyeeDashboardData());
    };
  }, []);

  const handleStartDateChange = (date) => {
    if (endDate && date > endDate) {
      errorToast("Start date cannot be later than end date.");
      return;
    }
    setStartDate(date);
  };

  const handleEndDateChange = (date) => {
    if (startDate && date < startDate) {
      errorToast("End date cannot be earlier than start date.");
      return;
    }
    setEndDate(date);
  };

  const handleMaskedTablesChange = (event) => {
    dispatch(setTableMasked(event.target.checked));
  };

  const [totalAssignments, setTotalAssignments] = useState(0);
  const [totalWorked, setTotalWorked] = useState(0);
  const [totalPending, setTotalPending] = useState(0);
  const [statusCounts, setStatusCounts] = useState([]);

  useEffect(() => {
    if (employeeDashboardData) {
      const { assignmentsCount = {} } = employeeDashboardData;

      setTotalAssignments(assignmentsCount?.totalAssignments || 0);
      setTotalWorked(assignmentsCount?.statusExists || 0);
      setTotalPending(assignmentsCount?.statusNotExists || 0);
      setStatusCounts(
        Array.isArray(assignmentsCount?.groupedStatuse)
          ? assignmentsCount?.groupedStatuse
          : []
      );
    }
  }, [employeeDashboardData]);

  const handleCardClick = (obj) => {
    const { tabValue = "", activity = "", status } = obj;
    const startDateForFilter = new Date(startDate);
    startDateForFilter.setHours(0, 0, 0, 0);
    const endDateForFilter = new Date(endDate);
    endDateForFilter.setHours(23, 59, 59, 999);
    const startDateForSomething = startDateForFilter || new Date();
    const endDateForSomething = endDateForFilter || new Date();

    dispatch(
      setWebinarAttendeesFilters({
        filters: {
          createdAt: {
            $gte: startDateForSomething.toISOString(),
            $lte: endDateForSomething.toISOString(),
          },
          status: status ? [status] : undefined,
        },
      })
    );
    navigate(
      `/assignments?page=1&webinarId=${currentWebinar}&tabValue=${tabValue}&activity=${activity}`
    );
  };

  const webinarLabel = () => {
    if (currentWebinar === "select") return "Select webinar";
    if (currentWebinar === "all") return "All webinars";
    const w = webinarData?.find((x) => x._id === currentWebinar);
    if (!w) return "Webinar";
    return `${w.webinarName} — ${formatDateAsNumber(w.webinarDate)}`;
  };

  const onWebinarPick = (selectedWebinarId) => {
    setCurrentWebinar(selectedWebinarId);
    setWebinarOpen(false);
    if (selectedWebinarId === "all") {
      const oneYearAgo = new Date();
      oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
      setStartDate(oneYearAgo);
      setEndDate(new Date());
    } else if (selectedWebinarId === "select") {
      const today = new Date();
      setStartDate(today);
      setEndDate(today);
    } else {
      const selectedWebinarData = webinarData.find(
        (webinar) => webinar._id === selectedWebinarId
      );
      if (selectedWebinarData) {
        const webinarCreationDate = new Date(selectedWebinarData.createdAt);
        setStartDate(webinarCreationDate);
      } else {
        setStartDate(new Date());
      }
      setEndDate(new Date());
    }
  };

  const webinarHasRows = Array.isArray(webinarData) && webinarData.length > 0;

  return (
    <div className="min-h-full w-full min-w-0 max-w-full box-border p-2 transition-colors duration-500 sm:p-2 lg:p-4 xl:p-6 2xl:p-8">
      <motion.div
        className="mb-6 rounded-2xl p-4 sm:p-5"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        style={{
          backgroundColor: isDark ? "#0f172a" : "#ffffff",
          boxShadow: isDark 
            ? "0 4px 6px -1px rgba(0, 0, 0, 0.2)"
            : "0 1px 3px rgba(0, 0, 0, 0.05), 0 1px 2px rgba(0, 0, 0, 0.06)",
        }}
      >
        <div className="flex min-w-0 flex-col items-start justify-between gap-4 lg:flex-row lg:items-center lg:gap-6">
          <div className="flex min-w-0 w-full items-center gap-4 lg:w-auto">
            <div className="relative w-full min-w-0 sm:w-[250px]">
              <button
                type="button"
                onClick={() => {
                  if (webinarHasRows) setWebinarOpen(!webinarOpen);
                }}
                className={`flex w-full items-center justify-between gap-2 rounded-xl px-4 py-2.5 transition-all duration-200 ${
                  webinarHasRows
                    ? "cursor-pointer hover:shadow-md"
                    : "cursor-not-allowed opacity-70"
                }`}
                style={{
                  backgroundColor: isDark ? "#1e293b" : "#F9FAFB",
                  border: isDark ? "1px solid #334155" : "1px solid #e5e7eb",
                  fontFamily: "Inter, sans-serif",
                  fontSize: "14px",
                  fontWeight: 500,
                  color: isDark ? "#f8fafc" : "#071028",
                  textAlign: "left",
                }}
              >
                <span className="truncate">{webinarLabel()}</span>
                <ChevronDown
                  className="h-4 w-4 shrink-0 transition-transform duration-200"
                  style={{
                    color: isDark ? "#94a3b8" : "#64748b",
                    transform: webinarOpen ? "rotate(180deg)" : "rotate(0deg)",
                  }}
                />
              </button>
              {webinarOpen && webinarHasRows && (
                <div
                  className="absolute left-0 top-full z-20 mt-2 w-full overflow-hidden rounded-xl"
                  style={{
                    backgroundColor: isDark ? "#1e293b" : "#ffffff",
                    border: isDark ? "1px solid #334155" : "1px solid #e5e7eb",
                    boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.3)",
                  }}
                >
                  <div className="custom-scrollbar max-h-[300px] overflow-y-auto">
                    <button
                      type="button"
                      disabled
                      className="w-full cursor-not-allowed px-4 py-2.5 text-left"
                      style={{
                        fontFamily: "Inter, sans-serif",
                        fontSize: "13px",
                        fontWeight: 500,
                        color: isDark ? "#64748b" : "#94a3b8",
                        borderBottom: isDark ? "1px solid #334155" : "1px solid #f3f4f6",
                      }}
                    >
                      Select
                    </button>
                    <button
                      type="button"
                      onClick={() => onWebinarPick("all")}
                      className="w-full border-b border-gray-100 dark:border-slate-800 px-4 py-2.5 text-left transition-colors hover:bg-gray-50 dark:hover:bg-slate-800"
                      style={{
                        fontFamily: "Inter, sans-serif",
                        fontSize: "13px",
                        fontWeight: 500,
                        color: isDark ? "#f8fafc" : "#071028",
                      }}
                    >
                      All
                    </button>
                    {(webinarData || []).map((webinar, idx) => (
                      <button
                        type="button"
                        key={webinar._id || idx}
                        onClick={() => onWebinarPick(webinar._id)}
                        className="w-full px-4 py-2.5 text-left transition-colors hover:bg-gray-50 dark:hover:bg-slate-800"
                        style={{
                          fontFamily: "Inter, sans-serif",
                          fontSize: "13px",
                          fontWeight: 500,
                          color: isDark ? "#f8fafc" : "#071028",
                          borderBottom:
                            idx !== webinarData.length - 1
                              ? isDark ? "1px solid #334155" : "1px solid #f3f4f6"
                              : "none",
                        }}
                      >
                        {webinar.webinarName}
                        {" — "}
                        {formatDateAsNumber(webinar.webinarDate)}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="ml-auto flex w-full min-w-0 flex-col items-center gap-3 sm:flex-row sm:gap-4 lg:w-auto">
            <div className="flex min-w-0 max-w-full flex-wrap items-center gap-3 rounded-xl border border-gray-100 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-800/50 p-1.5 sm:gap-4">
              <div className="flex items-center gap-2 px-3">
                <span
                  style={{
                    fontFamily: "Inter, sans-serif",
                    fontSize: "12px",
                    fontWeight: 600,
                    color: isDark ? "#94a3b8" : "#64748b",
                    textTransform: "uppercase",
                  }}
                >
                  From
                </span>
                <div className="relative min-w-0">
                  <input
                    type="date"
                    value={toYMD(startDate)}
                    max={toYMD(endDate)}
                    onChange={(e) => {
                      const d = ymdToLocalDate(e.target.value);
                      if (d) handleStartDateChange(d);
                    }}
                    className="max-w-full cursor-pointer rounded-lg py-1.5 pl-3 pr-2 outline-none transition-colors hover:bg-white"
                    style={{
                      backgroundColor: "transparent",
                      border: isDark ? "1px solid #334155" : "1px solid #e5e7eb",
                      fontFamily: "Inter, sans-serif",
                      fontSize: "13px",
                      fontWeight: 500,
                      color: isDark ? "#f8fafc" : "#071028",
                    }}
                  />
                </div>
              </div>
              <div className="hidden h-4 w-px bg-gray-200 dark:bg-slate-700 sm:block" />
              <div className="flex items-center gap-2 px-3">
                <span
                  style={{
                    fontFamily: "Inter, sans-serif",
                    fontSize: "12px",
                    fontWeight: 600,
                    color: isDark ? "#94a3b8" : "#64748b",
                    textTransform: "uppercase",
                  }}
                >
                  To
                </span>
                <div className="relative min-w-0">
                  <input
                    type="date"
                    value={toYMD(endDate)}
                    min={toYMD(startDate)}
                    max={toYMD(new Date())}
                    onChange={(e) => {
                      const d = ymdToLocalDate(e.target.value);
                      if (d) handleEndDateChange(d);
                    }}
                    className="max-w-full cursor-pointer rounded-lg py-1.5 pl-3 pr-2 outline-none transition-colors hover:bg-white"
                    style={{
                      backgroundColor: "transparent",
                      border: isDark ? "1px solid #334155" : "1px solid #e5e7eb",
                      fontFamily: "Inter, sans-serif",
                      fontSize: "13px",
                      fontWeight: 500,
                      color: isDark ? "#f8fafc" : "#071028",
                    }}
                  />
                </div>
              </div>
            </div>
            <button
              type="button"
              disabled={isLoading}
              onClick={fetchData}
              className="flex w-full items-center justify-center gap-2 rounded-xl px-6 py-2.5 transition-all duration-200 hover:scale-[1.02] hover:shadow-lg active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
              style={{
                backgroundColor: "#22B573",
                fontFamily: "Inter, sans-serif",
                fontSize: "14px",
                fontWeight: 600,
                color: "#ffffff",
                border: "none",
              }}
            >
              {isLoading ? (
                <AppLoader size="sm" variant="inverse" />
              ) : (
                <Search className="h-4 w-4" />
              )}
              Find
            </button>
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.05 }}
      >
      <Card
        className="border p-5 sm:p-6 lg:p-7"
        style={{
          backgroundColor: isDark ? "#0f172a" : "#ffffff",
          borderColor: isDark ? "#1e293b" : "#e5e7eb",
          borderRadius: "16px",
          boxShadow: isDark 
            ? "0 4px 6px -1px rgba(0, 0, 0, 0.2)"
            : "0 1px 3px rgba(0, 0, 0, 0.05)",
        }}
      >
        <h2
          className="mb-6"
          style={{
            fontFamily: "Inter, sans-serif",
            fontSize: "clamp(18px, 3vw, 22px)",
            fontWeight: 700,
            color: isDark ? "#f8fafc" : "#071028",
          }}
        >
          Your activity on assignments
        </h2>

        <h3
          className="mb-4"
          style={{
            fontFamily: "Inter, sans-serif",
            fontSize: "14px",
            fontWeight: 600,
            color: isDark ? "#f8fafc" : "#071028",
            textTransform: "uppercase",
            letterSpacing: "0.5px",
          }}
        >
          Overall Summary
        </h3>
        <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
          <motion.div
            role="button"
            tabIndex={0}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0 }}
            onClick={() => handleCardClick({ tabValue: "active", activity: "All" })}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ")
                handleCardClick({ tabValue: "active", activity: "All" });
            }}
            className="cursor-pointer rounded-2xl p-4 transition-all hover:shadow-lg"
            style={{
              backgroundColor: isDark ? "rgba(59, 130, 246, 0.1)" : "rgba(147, 197, 253, 0.15)",
              border: isDark ? "1px solid rgba(59, 130, 246, 0.2)" : "1px solid rgba(59, 130, 246, 0.3)",
            }}
          >
            <div className="mb-2 flex items-start justify-between">
              <div
                style={{
                  fontFamily: "Inter, sans-serif",
                  fontSize: "11px",
                  fontWeight: 500,
                  color: isDark ? "#94a3b8" : "#64748b",
                }}
              >
                Assignments
              </div>
              <div
                className={`rounded-lg p-1.5 ${getIconConfig("Assignments", "#3b82f6").anim}`}
                style={{ backgroundColor: "rgba(59, 130, 246, 0.15)" }}
              >
                {getIconConfig("Assignments", "#3b82f6").icon}
              </div>
            </div>
            <div
              style={{
                fontFamily: "Inter, sans-serif",
                fontSize: "clamp(18px, 3vw, 22px)",
                fontWeight: 700,
                color: "#3b82f6",
              }}
            >
              {totalAssignments}
            </div>
          </motion.div>

          <motion.div
            role="button"
            tabIndex={0}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.03 }}
            onClick={() =>
              handleCardClick({ tabValue: "active", activity: "Worked" })
            }
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ")
                handleCardClick({ tabValue: "active", activity: "Worked" });
            }}
            className="cursor-pointer rounded-2xl p-4"
            style={{
              backgroundColor: "rgba(134, 239, 172, 0.15)",
              border: "1px solid rgba(34, 197, 94, 0.3)",
            }}
          >
            <div className="mb-2 flex items-start justify-between">
              <div
                style={{
                  fontFamily: "Inter, sans-serif",
                  fontSize: "11px",
                  fontWeight: 500,
                  color: isDark ? "#94a3b8" : "#64748b",
                }}
              >
                Worked
              </div>
              <div
                className={`rounded-lg p-1.5 ${getIconConfig("Worked", BRAND).anim}`}
                style={{ backgroundColor: "rgba(34, 197, 94, 0.15)" }}
              >
                {getIconConfig("Worked", BRAND).icon}
              </div>
            </div>
            <div
              style={{
                fontFamily: "Inter, sans-serif",
                fontSize: "clamp(18px, 3vw, 22px)",
                fontWeight: 700,
                color: "#22B573",
              }}
            >
              {totalWorked}
            </div>
          </motion.div>

          <motion.div
            role="button"
            tabIndex={0}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.06 }}
            onClick={() =>
              handleCardClick({ tabValue: "active", activity: "Pending" })
            }
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ")
                handleCardClick({ tabValue: "active", activity: "Pending" });
            }}
            className="cursor-pointer rounded-2xl p-4"
            style={{
              backgroundColor: "rgba(254, 202, 202, 0.15)",
              border: "1px solid rgba(239, 68, 68, 0.3)",
            }}
          >
            <div className="mb-2 flex items-start justify-between">
              <div
                style={{
                  fontFamily: "Inter, sans-serif",
                  fontSize: "11px",
                  fontWeight: 500,
                  color: isDark ? "#94a3b8" : "#64748b",
                }}
              >
                Pending
              </div>
              <div
                className={`rounded-lg p-1.5 ${getIconConfig("Pending", "#ef4444").anim}`}
                style={{ backgroundColor: "rgba(239, 68, 68, 0.15)" }}
              >
                {getIconConfig("Pending", "#ef4444").icon}
              </div>
            </div>
            <div
              style={{
                fontFamily: "Inter, sans-serif",
                fontSize: "clamp(18px, 3vw, 22px)",
                fontWeight: 700,
                color: "#ef4444",
              }}
            >
              {totalPending}
            </div>
          </motion.div>
        </div>

        {statusCounts.length > 0 && (
          <div>
            <h4
              className="mb-4"
              style={{
                fontFamily: "Inter, sans-serif",
                fontSize: "14px",
                fontWeight: 600,
                color: isDark ? "#f8fafc" : "#071028",
                textTransform: "uppercase",
                letterSpacing: "0.5px",
              }}
            >
              Status Breakdown
            </h4>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {statusCounts.map((statusItem, idx) => {
                const c = statusToAccentColor(statusItem.status);
                const iconConf = getIconConfig(statusItem.status, c);
                return (
                  <motion.div
                    role="button"
                    tabIndex={0}
                    key={`emp-status-${idx}-${String(statusItem.status)}`}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.03 }}
                    onClick={() =>
                      handleCardClick({
                        tabValue: "active",
                        activity: "All",
                        status: statusItem.status,
                      })
                    }
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ")
                        handleCardClick({
                          tabValue: "active",
                          activity: "All",
                          status: statusItem.status,
                        });
                    }}
                    className="cursor-pointer rounded-xl p-3.5 transition-all duration-200 hover:shadow-sm"
                    style={{
                      backgroundColor: isDark ? "#1e293b" : "#F9FAFB",
                      border: `1px solid ${c}${isDark ? "40" : "30"}`,
                    }}
                  >
                    <div className="mb-2 flex items-start justify-between">
                      <div
                        style={{
                          fontFamily: "Inter, sans-serif",
                          fontSize: "11px",
                          fontWeight: 500,
                          color: isDark ? "#94a3b8" : "#64748b",
                        }}
                      >
                        {statusItem.status}
                      </div>
                      <div
                        className={`rounded-lg p-1.5 ${iconConf.anim}`}
                        style={{ backgroundColor: `${c}15` }}
                      >
                        {iconConf.icon}
                      </div>
                    </div>
                    <div
                      style={{
                        fontFamily: "Inter, sans-serif",
                        fontSize: "clamp(16px, 2.5vw, 20px)",
                        fontWeight: 700,
                        color: c,
                      }}
                    >
                      {statusItem.count}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}

        {totalAssignments === 0 && statusCounts.length === 0 && (
          <p
            className="mt-4 text-center text-sm text-slate-500"
            style={{ fontFamily: "Inter, sans-serif" }}
          >
            No activity data available for this user in this period.
          </p>
        )}
      </Card>
      </motion.div>

      <div className="mt-6 flex cursor-pointer items-center justify-center gap-3 rounded-2xl border border-emerald-100 dark:border-emerald-900/30 bg-white dark:bg-slate-900 py-5 text-lg font-semibold text-emerald-700 dark:text-emerald-400 shadow-sm transition hover:shadow-md">
        <label className="flex cursor-pointer items-center gap-3">
          <input
            type="checkbox"
            className="h-5 w-5 rounded border-gray-300 text-green-600 focus:ring-green-500"
            checked={isTablesMasked}
            onChange={handleMaskedTablesChange}
          />
          <span style={{ fontFamily: "Inter, sans-serif" }}>Masked tables</span>
        </label>
      </div>
    </div>
  );
};

export default EmployeeDashboard;
