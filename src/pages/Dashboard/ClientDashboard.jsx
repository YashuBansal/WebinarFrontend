import { useEffect, useState, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  getAdminDashboardData,
  getAdminNotesForDashboard,
} from "../../features/actions/globalData";
import {
  errorToast,
  formatDateAsNumber,
  formatDateAsNumberWithTime,
  SocketEvents,
} from "../../utils/extra";
import { socket } from "../../socket";

import { getAllWebinars } from "../../features/actions/webinarContact";
import { clearClientDashboardData } from "../../features/slices/globalData";
import { getUserActivityOfEmployees } from "../../features/actions/userActivity";
import { selectEmployeeActivities } from "../../features/slices/userActivity";
import { useNavigate } from "react-router-dom";
import { setWebinarAttendeesFilters } from "../../features/slices/filters.slice";
import { Search, ChevronDown } from "lucide-react";
import AppLoader, { AppLoaderCenter } from "../../components/AppLoader";
import { getIconConfig, statusToAccentColor } from "../../components/Dashboard/dashboardNewUiHelpers";
import { motion } from "framer-motion";
import { Card } from "../../components/ui/card";

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

const ClientDashboard = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const employeeActivities = useSelector(selectEmployeeActivities);
  const { isLoading: adminDashboardRequestLoading, clientDashboardData } =
    useSelector((state) => state.globalData);
  const { webinarData } = useSelector((state) => state.webinarContact);

  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [dashboardData, setDashboardData] = useState([]);
  const [adminDashboardData, setAdminDashboardData] = useState(null);
  const [currentWebinar, setCurrentWebinar] = useState("select");
  const [isDataLoading, setIsDataLoading] = useState(true);
  const [webinarOpen, setWebinarOpen] = useState(false);

  const fetchData = useCallback(() => {
    setIsDataLoading(true);
    const formattedStartDate = startDate.toISOString().split("T")[0];
    const formattedEndDate = endDate.toISOString().split("T")[0];
    dispatch(
      getAdminDashboardData({
        startDate: formattedStartDate,
        endDate: formattedEndDate,
        webinarId: currentWebinar,
      })
    );
    const newStartDate = new Date(startDate);
    newStartDate.setHours(0, 0, 0, 0);
    const newEndDate = new Date(endDate);
    newEndDate.setHours(23, 59, 59, 999);

    dispatch(
      getAdminNotesForDashboard({
        startDate: newStartDate,
        endDate: newEndDate,
        webinarId: currentWebinar,
      })
    ).then((res) => {
      if (res.meta.requestStatus === "fulfilled") {
        if (Array.isArray(res.payload?.data)) {
          const notesData = res.payload?.data;
          const statusMap = new Map();
          notesData.forEach((notes) => {
            if (Array.isArray(notes.status)) {
              const noteStatus = notes.status;
              noteStatus.forEach((status) => {
                if (statusMap.has(status)) {
                  statusMap.set(status, statusMap.get(status) + 1);
                } else {
                  statusMap.set(status, 1);
                }
              });
            }
          });
          const statusCounts = Array.from(statusMap, ([status, count]) => ({
            status,
            count,
          }));

          setAdminDashboardData({
            totalWorked: notesData?.length,
            statusCounts,
          });
        }
      }
    });
  }, [dispatch, startDate, endDate, currentWebinar]);

  useEffect(() => {
    let interval;
    const fetchDataByInterval = () => {
      interval = setInterval(() => {
        dispatch(getUserActivityOfEmployees());
      }, 10 * 1000);
    };

    dispatch(getUserActivityOfEmployees());
    fetchDataByInterval();
    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, []);

  useEffect(() => {
    fetchData();
    dispatch(getAllWebinars({ page: 1, limit: 100 }));

    return () => {
      dispatch(clearClientDashboardData());
    };
  }, []);

  useEffect(() => {
    setIsDataLoading(true);
    const { assignmentsCount } = clientDashboardData || {};
    if (assignmentsCount == null || employeeActivities == null) {
      setDashboardData([]);
      /* globalData slice exposes `isLoading` (not `loading`) for getAdminDashboardData */
      setIsDataLoading(adminDashboardRequestLoading);
      return;
    }

    try {
      const assignments = Array.isArray(assignmentsCount)
        ? assignmentsCount
        : [];
      const activities = Array.isArray(employeeActivities)
        ? employeeActivities
        : [];

      const sameUser = (a, b) => String(a) === String(b);

      /** All employees with activity + anyone in assignment stats for this period (API IDs may be ObjectId vs string) */
      const byUserId = new Map();
      for (const emp of activities) {
        if (emp?._id != null) {
          byUserId.set(String(emp._id), { ...emp });
        }
      }
      for (const row of assignments) {
        const uid = row?.user != null ? String(row.user) : "";
        if (!uid) continue;
        if (!byUserId.has(uid)) {
          byUserId.set(uid, {
            _id: row.user,
            userRole: undefined,
            userEmail: undefined,
            userName: undefined,
            lastActivity: undefined,
            isOnline: false,
            action: undefined,
          });
        }
      }

      const tempData = Array.from(byUserId.values()).map((emp) => {
        const assignment = assignments.find((assign) =>
          sameUser(assign.user, emp._id)
        );

        const {
          groupedStatuses: statusCounts = [],
          statusExists: pseudoWorked = 0,
          statusNotExists: totalPending = 0,
          totalAssignments = 0,
          validCallCount: totalWorked = 0,
        } = assignment || {};

        return {
          _id: emp._id,
          userRole: emp?.userRole,
          email: emp?.userEmail,
          userName: emp?.userName,
          lastActivity: emp?.createdAt,
          isOnline: emp?.isOnline,
          action: emp?.action,
          totalAssignments,
          totalWorked,
          pseudoWorked,
          totalPending,
          statusCounts,
        };
      });
      setDashboardData(tempData);
    } catch (error) {
      console.error("Error processing dashboard data:", error);
      setDashboardData([]);
      errorToast("Failed to process dashboard data.");
    } finally {
      setIsDataLoading(false);
    }
  }, [clientDashboardData, adminDashboardRequestLoading, employeeActivities]);

  useEffect(() => {
    const handleUpdate = () => {
      console.log(
        "Socket event received: ATTENDEE_STATUS_UPDATE. Refetching data..."
      );
      fetchData();
    };
    if (socket) socket.on(SocketEvents.ATTENDEE_STATUS_UPDATE, handleUpdate);
    return () => {
      if (socket) socket.off(SocketEvents.ATTENDEE_STATUS_UPDATE, handleUpdate);
    };
  }, [fetchData]);

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

  const handleCardClick = (obj) => {
    const { data, tabValue = "assignments", validCall = "", status } = obj;
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
      `/employee/view/${data._id}?page=1&tabValue=${tabValue}&role=${
        data.userRole
      }&webinarId=${
        currentWebinar === "select" || currentWebinar === "all"
          ? "all"
          : currentWebinar
      }&userName=${data.userName}${
        validCall === "" ? "" : `&valid-call=${validCall}`
      }`
    );
  };

  const webinarLabel = () => {
    if (currentWebinar === "select") return "Select webinar";
    if (currentWebinar === "all") return "All webinars";
    const w = webinarData?.find((x) => x._id === currentWebinar);
    if (!w) return "Webinar";
    return `${w?.webinarName} — ${formatDateAsNumber(w?.webinarDate)}`;
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
          backgroundColor: "#ffffff",
          boxShadow:
            "0 1px 3px rgba(0, 0, 0, 0.05), 0 1px 2px rgba(0, 0, 0, 0.06)",
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
                  backgroundColor: "#F9FAFB",
                  border: "1px solid #e5e7eb",
                  fontFamily: "Inter, sans-serif",
                  fontSize: "14px",
                  fontWeight: 500,
                  color: "#071028",
                  textAlign: "left",
                }}
              >
                <span className="truncate">{webinarLabel()}</span>
                <ChevronDown
                  className="h-4 w-4 shrink-0 transition-transform duration-200"
                  style={{
                    color: "#64748b",
                    transform: webinarOpen ? "rotate(180deg)" : "rotate(0deg)",
                  }}
                />
              </button>

              {webinarOpen && webinarHasRows && (
                <div
                  className="absolute left-0 top-full z-20 mt-2 w-full overflow-hidden rounded-xl"
                  style={{
                    backgroundColor: "#ffffff",
                    border: "1px solid #e5e7eb",
                    boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
                  }}
                >
                  <div className="custom-scrollbar max-h-[300px] overflow-y-auto">
                    <button
                      type="button"
                      disabled
                      className="w-full cursor-not-allowed px-4 py-2.5 text-left transition-colors hover:bg-gray-50"
                      style={{
                        fontFamily: "Inter, sans-serif",
                        fontSize: "13px",
                        fontWeight: 500,
                        color: "#94a3b8",
                        borderBottom: "1px solid #f3f4f6",
                      }}
                    >
                      Select
                    </button>
                    <button
                      type="button"
                      onClick={() => onWebinarPick("all")}
                      className="w-full border-b border-gray-100 px-4 py-2.5 text-left transition-colors hover:bg-gray-50"
                      style={{
                        fontFamily: "Inter, sans-serif",
                        fontSize: "13px",
                        fontWeight: 500,
                        color: "#071028",
                      }}
                    >
                      All
                    </button>
                    {webinarData.map((webinar, idx) => (
                      <button
                        type="button"
                        key={webinar._id || idx}
                        onClick={() => onWebinarPick(webinar._id)}
                        className="w-full px-4 py-2.5 text-left transition-colors hover:bg-gray-50"
                        style={{
                          fontFamily: "Inter, sans-serif",
                          fontSize: "13px",
                          fontWeight: 500,
                          color: "#071028",
                          borderBottom:
                            idx !== webinarData.length - 1
                              ? "1px solid #f3f4f6"
                              : "none",
                        }}
                      >
                        {webinar?.webinarName} —{" "}
                        {formatDateAsNumber(webinar?.webinarDate)}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="ml-auto flex w-full min-w-0 flex-col items-center gap-3 sm:flex-row sm:gap-4 lg:w-auto">
            <div className="flex min-w-0 max-w-full flex-wrap items-center gap-3 rounded-xl border border-gray-100 bg-gray-50/50 p-1.5 sm:gap-4">
              <div className="flex items-center gap-2 px-3">
                <span
                  style={{
                    fontFamily: "Inter, sans-serif",
                    fontSize: "12px",
                    fontWeight: 600,
                    color: "#64748b",
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
                      border: "1px solid #e5e7eb",
                      fontFamily: "Inter, sans-serif",
                      fontSize: "13px",
                      fontWeight: 500,
                      color: "#071028",
                    }}
                  />
                </div>
              </div>
              <div className="hidden h-4 w-px bg-gray-200 sm:block" />
              <div className="flex items-center gap-2 px-3">
                <span
                  style={{
                    fontFamily: "Inter, sans-serif",
                    fontSize: "12px",
                    fontWeight: 600,
                    color: "#64748b",
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
                      border: "1px solid #e5e7eb",
                      fontFamily: "Inter, sans-serif",
                      fontSize: "13px",
                      fontWeight: 500,
                      color: "#071028",
                    }}
                  />
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={fetchData}
              disabled={isDataLoading}
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
              {isDataLoading ? (
                <AppLoader size="sm" variant="inverse" />
              ) : (
                <Search className="h-4 w-4" />
              )}
              Find
            </button>
          </div>
        </div>
      </motion.div>

      {isDataLoading && (
        <AppLoaderCenter message="Loading Dashboard Data..." />
      )}

      {adminDashboardData && (
        <motion.div
          className="mb-6"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.05 }}
        >
        <Card
          className="border p-5 sm:p-6 lg:p-7"
          style={{
            backgroundColor: "#ffffff",
            borderColor: "#e5e7eb",
            borderRadius: "16px",
            boxShadow: "0 1px 3px rgba(0, 0, 0, 0.05)",
          }}
        >
          <div
            className="mb-6 flex flex-col justify-between gap-4 pb-5 sm:flex-row sm:items-center"
            style={{ borderBottom: "1px solid #e5e7eb" }}
          >
            <h2
              className="mb-6"
              style={{
                fontFamily: "Inter, sans-serif",
                fontSize: "clamp(18px, 3vw, 22px)",
                fontWeight: 700,
                color: "#071028",
              }}
            >
              My Activity
            </h2>
            <button
              type="button"
              onClick={() => navigate(`admin-logs`)}
              className="rounded-xl px-5 py-2.5 transition-all duration-200 hover:scale-105 hover:shadow-md"
              style={{
                backgroundColor: "#071028",
                fontFamily: "Inter, sans-serif",
                fontSize: "13px",
                fontWeight: 600,
                color: "#ffffff",
                border: "none",
              }}
            >
              View Activity Logs
            </button>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4">
            <motion.div
              className="rounded-2xl p-4 transition-all duration-200 hover:shadow-md"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0 }}
              style={{
                backgroundColor: "rgba(34, 181, 115, 0.08)",
                border: "1px solid #22B573",
              }}
            >
              <div className="mb-2 flex items-start justify-between">
                <div
                  style={{
                    fontFamily: "Inter, sans-serif",
                    fontSize: "12px",
                    fontWeight: 600,
                    color: "#22B573",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                  }}
                >
                  Total Worked
                </div>
                <div
                  className={`rounded-lg p-1.5 ${getIconConfig("worked", "#22B573").anim}`}
                  style={{ backgroundColor: "rgba(34, 181, 115, 0.15)" }}
                >
                  {getIconConfig("worked", "#22B573").icon}
                </div>
              </div>
              <div
                style={{
                  fontFamily: "Inter, sans-serif",
                  fontSize: "clamp(20px, 3vw, 24px)",
                  fontWeight: 800,
                  color: "#22B573",
                }}
              >
                {adminDashboardData.totalWorked ?? 0}
              </div>
            </motion.div>

            {adminDashboardData.statusCounts.map((statusItem, index) => {
              const c = statusToAccentColor(statusItem.status);
              const iconConf = getIconConfig(statusItem.status, c);
              return (
                <motion.div
                  key={`admin-s-${statusItem.status}-${index}`}
                  className="rounded-2xl p-4 transition-all duration-200 hover:shadow-md"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: (index + 1) * 0.03 }}
                  style={{
                    backgroundColor: "#F9FAFB",
                    border: `1px solid ${c}30`,
                  }}
                >
                  <div className="mb-2 flex items-start justify-between">
                    <div
                      style={{
                        fontFamily: "Inter, sans-serif",
                        fontSize: "12px",
                        fontWeight: 500,
                        color: "#64748b",
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
                      fontSize: "clamp(20px, 3vw, 24px)",
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

          {adminDashboardData.totalWorked === 0 &&
            adminDashboardData.statusCounts.length === 0 && (
              <p
                className="mt-4 text-center text-sm text-slate-500"
                style={{ fontFamily: "Inter, sans-serif" }}
              >
                No activity data available in this period.
              </p>
            )}
        </Card>
        </motion.div>
      )}

      {!isDataLoading && (!dashboardData || dashboardData.length === 0) && (
        <div
          className="mb-6 rounded-2xl border border-gray-200 bg-slate-50 p-8 text-center"
          style={{ fontFamily: "Inter, sans-serif" }}
        >
          <h3 className="mb-2 text-lg font-semibold text-slate-700">
            No dashboard data found
          </h3>
          <p className="text-sm text-slate-500">
            No activity recorded for the selected period or user filter.
          </p>
        </div>
      )}

      {!isDataLoading && dashboardData.length > 0 && (
        <div className="space-y-5">
          {dashboardData.map((item, index) => {
            const totalAssignments = item?.totalAssignments ?? 0;
            const totalWorked = item?.pseudoWorked ?? 0;
            const totalPseudoWorked = item?.totalWorked ?? 0;
            const totalPending = item?.totalPending ?? 0;
            const statusCounts = item?.statusCounts ?? [];
            const chipLabel = !item?.isOnline
              ? "Offline"
              : item?.action === "inactive"
                ? "Idle"
                : "Online";

            return (
              <motion.div
                key={item?.email || item._id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.03 }}
              >
              <Card
                className="border p-5 sm:p-6 lg:p-7"
                style={{
                  backgroundColor: "#ffffff",
                  borderColor: "#e5e7eb",
                  borderRadius: "16px",
                  boxShadow: "0 1px 3px rgba(0, 0, 0, 0.05)",
                }}
              >
                <div
                  className="mb-6 flex flex-col justify-between gap-4 pb-5 sm:flex-row sm:items-center"
                  style={{ borderBottom: "1px solid #e5e7eb" }}
                >
                  <div className="flex items-center gap-3">
                    <div className="relative flex items-center justify-center">
                      <div
                        className="h-3 w-3 rounded-full"
                        style={{
                          backgroundColor:
                            chipLabel === "Offline" ? "#ef4444" : "#22B573",
                          animation:
                            "dashboard-dot-pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
                        }}
                      />
                      <div
                        className="absolute h-3 w-3 rounded-full"
                        style={{
                          backgroundColor:
                            chipLabel === "Offline" ? "#ef4444" : "#22B573",
                          opacity: 0.5,
                          animation:
                            "dashboard-dot-ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite",
                        }}
                      />
                    </div>
                    <div>
                      <h3
                        style={{
                          fontFamily: "Inter, sans-serif",
                          fontSize: "clamp(14px, 2vw, 16px)",
                          fontWeight: 600,
                          color: "#071028",
                          marginBottom: "2px",
                        }}
                      >
                        {item?.email || `User ID: ${item._id}`}
                      </h3>
                      <div className="flex items-center gap-2">
                        <span
                          style={{
                            fontFamily: "Inter, sans-serif",
                            fontSize: "12px",
                            fontWeight: 500,
                            color: chipLabel === "Offline" ? "#ef4444" : "#22B573",
                          }}
                        >
                          {chipLabel}
                        </span>
                        <span
                          style={{
                            fontFamily: "Inter, sans-serif",
                            fontSize: "12px",
                            color: "#64748b",
                          }}
                        >
                          • {formatDateAsNumberWithTime(item?.lastActivity)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      navigate(
                        `employee/view/${item?._id}?page=1&tabValue=activityLogs&role=${item?.userRole}&webinarId=all&userName=${item?.userName}`
                      );
                    }}
                    className="rounded-xl px-5 py-2.5 transition-all duration-200 hover:shadow-md"
                    style={{
                      backgroundColor: "#071028",
                      fontFamily: "Inter, sans-serif",
                      fontSize: "13px",
                      fontWeight: 600,
                      color: "#ffffff",
                      border: "none",
                    }}
                  >
                    Logs
                  </button>
                </div>

                <div className="mb-6">
                  <h4
                    className="mb-4"
                    style={{
                      fontFamily: "Inter, sans-serif",
                      fontSize: "14px",
                      fontWeight: 600,
                      color: "#071028",
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                    }}
                  >
                    Overall Summary
                  </h4>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
                    <motion.div
                      role="button"
                      tabIndex={0}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0 }}
                      onClick={() =>
                        handleCardClick({ data: item, tabValue: "assignments" })
                      }
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ")
                          handleCardClick({ data: item, tabValue: "assignments" });
                      }}
                      className="cursor-pointer rounded-2xl p-4"
                      style={{
                        backgroundColor: "rgba(147, 197, 253, 0.15)",
                        border: "1px solid rgba(59, 130, 246, 0.3)",
                      }}
                    >
                      <div className="mb-2 flex items-start justify-between">
                        <div
                          style={{
                            fontFamily: "Inter, sans-serif",
                            fontSize: "11px",
                            fontWeight: 500,
                            color: "#64748b",
                          }}
                        >
                          Assignments
                        </div>
                        <div
                          className={`rounded-lg p-1.5 ${getIconConfig("Assignments", "#3b82f6").anim}`}
                          style={{
                            backgroundColor: "rgba(59, 130, 246, 0.15)",
                          }}
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
                        handleCardClick({ data: item, tabValue: "history" })
                      }
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ")
                          handleCardClick({ data: item, tabValue: "history" });
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
                            color: "#64748b",
                          }}
                        >
                          Worked
                        </div>
                        <div
                          className={`rounded-lg p-1.5 ${getIconConfig("Worked", "#22B573").anim}`}
                          style={{
                            backgroundColor: "rgba(34, 197, 94, 0.15)",
                          }}
                        >
                          {getIconConfig("Worked", "#22B573").icon}
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
                        handleCardClick({
                          data: item,
                          tabValue: "history",
                          validCall: "invalid",
                        })
                      }
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ")
                          handleCardClick({
                            data: item,
                            tabValue: "history",
                            validCall: "invalid",
                          });
                      }}
                      className="cursor-pointer rounded-2xl p-4"
                      style={{
                        backgroundColor: "rgba(196, 181, 253, 0.15)",
                        border: "1px solid rgba(139, 92, 246, 0.3)",
                      }}
                    >
                      <div className="mb-2 flex items-start justify-between">
                        <div
                          style={{
                            fontFamily: "Inter, sans-serif",
                            fontSize: "11px",
                            fontWeight: 500,
                            color: "#64748b",
                          }}
                        >
                          Valid Calls
                        </div>
                        <div
                          className={`rounded-lg p-1.5 ${getIconConfig("Valid Calls", "#8b5cf6").anim}`}
                          style={{
                            backgroundColor: "rgba(139, 92, 246, 0.15)",
                          }}
                        >
                          {getIconConfig("Valid Calls", "#8b5cf6").icon}
                        </div>
                      </div>
                      <div
                        style={{
                          fontFamily: "Inter, sans-serif",
                          fontSize: "clamp(18px, 3vw, 22px)",
                          fontWeight: 700,
                          color: "#8b5cf6",
                        }}
                      >
                        {totalPseudoWorked}
                      </div>
                    </motion.div>

                    <motion.div
                      role="button"
                      tabIndex={0}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.09 }}
                      onClick={() =>
                        handleCardClick({ data: item, tabValue: "assignments" })
                      }
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ")
                          handleCardClick({ data: item, tabValue: "assignments" });
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
                            color: "#64748b",
                          }}
                        >
                          Pending
                        </div>
                        <div
                          className={`rounded-lg p-1.5 ${getIconConfig("Pending", "#ef4444").anim}`}
                          style={{
                            backgroundColor: "rgba(239, 68, 68, 0.15)",
                          }}
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
                </div>

                {statusCounts.length > 0 && (
                  <div>
                    <h4
                      className="mb-4"
                      style={{
                        fontFamily: "Inter, sans-serif",
                        fontSize: "14px",
                        fontWeight: 600,
                        color: "#071028",
                        textTransform: "uppercase",
                        letterSpacing: "0.5px",
                      }}
                    >
                      Status Breakdown
                    </h4>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                      {statusCounts.map((statusItem, statusIndex) => {
                        const c = statusToAccentColor(statusItem.status);
                        const iconConf = getIconConfig(statusItem.status, c);
                        return (
                          <motion.div
                            role="button"
                            tabIndex={0}
                            key={`${item._id}-st-${statusIndex}`}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: statusIndex * 0.03 }}
                            onClick={() =>
                              handleCardClick({
                                data: item,
                                tabValue: "history",
                                status: statusItem.status,
                              })
                            }
                            onKeyDown={(e) => {
                              if (e.key === "Enter" || e.key === " ")
                                handleCardClick({
                                  data: item,
                                  tabValue: "history",
                                  status: statusItem.status,
                                });
                            }}
                            className="cursor-pointer rounded-xl p-3.5 transition-all duration-200 hover:shadow-sm"
                            style={{
                              backgroundColor: "#F9FAFB",
                              border: `1px solid ${c}30`,
                            }}
                          >
                            <div className="mb-2 flex items-start justify-between">
                              <div
                                style={{
                                  fontFamily: "Inter, sans-serif",
                                  fontSize: "11px",
                                  fontWeight: 500,
                                  color: "#64748b",
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
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ClientDashboard;
