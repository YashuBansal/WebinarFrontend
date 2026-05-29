import React, { useState, useEffect, Suspense, useMemo } from "react";
import multiService from "../../services/multiService";
import { errorToast, formatDateAsNumber } from "../../utils/extra";
import useRoles from "../../hooks/useRoles";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  getAllWebinars,
  getEmployeeWebinars,
} from "../../features/actions/webinarContact";
import { socket } from "../../socket";
import ModalFallback from "../../components/Fallback/ModalFallback";
import EmpAssignModal from "./EmpAssignModal";
import { VisibilityIcon } from "../../components/SVGs";
import useMediaQuery from "../../hooks/useMediaQuery";
import useUserSubscription from "../../hooks/useUserSubscription";
import { useTheme } from "../../contexts/ThemeContext";
import { motion, AnimatePresence } from "framer-motion";
import {
  BarChart,
  CheckCircle,
  Clock,
  Calendar,
  ChevronDown,
  Filter,
  ArrowLeft,
  ArrowRight,
  LayoutGrid,
  List,
  Search,
  Download,
  Eye,
  Activity,
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
  RotateCcw
} from "lucide-react";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import AppLoader from "../../components/AppLoader";

const EmployeeAssignMetrics = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const roles = useRoles();
  const { userData } = useSelector((state) => state.auth);
  const { data: subscription } = useUserSubscription();
  const { webinarData } = useSelector((state) => state.webinarContact);
  const { employeeModeData } = useSelector((state) => state.employee);
  const employeeId = employeeModeData?._id;

  const role = userData?.role;
  const [startDate, setStartDate] = useState(
    new Date(new Date().setDate(new Date().getDate() - 7))
      .toISOString()
      .split("T")[0]
  );
  const [endDate, setEndDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    completed: 0,
    active: 0,
    daily: [],
  });
  const webinarInQuery = searchParams.get("webinarId");
  const [currentWebinar, setCurrentWebinar] = useState(
    webinarInQuery ? webinarInQuery : "all"
  );
  const [selectedData, setSelectedData] = useState(null);
  const [isTableView, setIsTableView] = useState(true);

  const fetchMetrics = async (webinarId) => {
    try {
      setLoading(true);
      const adjustEndDate = (dateString) => {
        const date = new Date(dateString);
        date.setDate(date.getDate() + 1);
        return date.toISOString().split("T")[0];
      };

      const adjustStartDate = (dateString) => {
        const date = new Date(dateString);
        date.setDate(date.getDate() - 1);
        return date.toISOString().split("T")[0];
      };

      if (roles.isEmployeeId(role) || employeeModeData) {
        const dailyRes = await multiService.getDailyAssignmentStats({
          start: adjustStartDate(startDate),
          end: endDate,
          webinarId,
          employeeId: employeeId || userData?._id,
        });
        if (dailyRes?.success) {
          const dailyData = dailyRes.data || [];

          const statsData = { total: 0, completed: 0, active: 0 };
          dailyData.forEach((item) => {
            statsData.total += item.count;
            statsData.completed += item.completed;
            statsData.active += item.count - item.completed;
          });

          setStats({
            ...statsData,
            daily: dailyData || [],
          });
        }
      } else {
        const allRes = await multiService.getAllAssignmentsByDateRange({
          start: adjustStartDate(startDate),
          end: endDate,
          webinarId,
        });

        if (allRes?.success) {
          const allData = allRes.data || [];
          const result = { total: 0, completed: 0, active: 0 };
          const dataByDate = {};
          allData.forEach((item) => {
            result.total += item.count;
            result.completed += item.completed;
            result.active += item.count - item.completed;
            if (!dataByDate[item.date]) {
              dataByDate[item.date] = {
                count: item.count,
                completed: item.completed,
                active: item.count - item.completed,
                date: item.date,
                data: [item],
              };
            } else {
              dataByDate[item.date].count += item.count;
              dataByDate[item.date].completed += item.completed;
              dataByDate[item.date].active += item.count - item.completed;
              dataByDate[item.date].data.push(item);
            }
          });
          const dailyData = Object.values(dataByDate);

          setStats((prev) => ({ ...prev, ...result, daily: dailyData }));
        }
      }
    } catch (error) {
      errorToast(error.message || "Error loading metrics");
    } finally {
      setLoading(false);
    }
  };

  const handleDateApply = () => {
    if (new Date(startDate) > new Date(endDate)) {
      errorToast("End date cannot be before start date");
      return;
    }
    const webinarId =
      currentWebinar && currentWebinar !== "all" ? currentWebinar : undefined;
    fetchMetrics(webinarId);
  };

  const isSmallScreen = useMediaQuery("(max-width: 768px)");

  useEffect(() => {
    const webinarId =
      webinarInQuery && webinarInQuery !== "all" ? webinarInQuery : undefined;
    fetchMetrics(webinarId);
  }, [searchParams]);

  useEffect(() => {
    if (!webinarData.length) {
      if (roles.isEmployeeId(role) || employeeModeData) {
        dispatch(getEmployeeWebinars({ employeeId }));
      } else dispatch(getAllWebinars({}));
    }
  }, []);

  useEffect(() => {
    function onNoteCreation() {
      const webinarId =
        webinarInQuery && webinarInQuery !== "all" ? webinarInQuery : undefined;
      fetchMetrics(webinarId);
    }
    socket.on("note-creation", onNoteCreation);
    return () => {
      socket.off("note-creation", onNoteCreation);
    };
  }, [searchParams]);

  const assignmentMetrics = subscription?.plan?.assignmentMetrics || false;
  if (!assignmentMetrics) {
    return null;
  }

  // --- STYLING HELPERS ---
  const panelBg = isDark ? "#1e293b" : "#ffffff";
  const panelBorder = isDark ? "#334155" : "#e5e7eb";
  const textColor = isDark ? "#f8fafc" : "#0f172a";
  const mutedText = isDark ? "#94a3b8" : "#64748b";
  const glassBg = isDark ? "rgba(30, 41, 59, 0.7)" : "rgba(255, 255, 255, 0.7)";

  const inputStyle = {
    backgroundColor: isDark ? "#0f172a" : "#ffffff",
    border: `1px solid ${panelBorder}`,
    color: textColor,
  };

  return (
    <div className="px-6 md:px-10 pt-12">
      <div className="mx-auto">
        {/* Header Section */}
        <div className="mb-8 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(-1)}
              className="p-2.5 rounded-xl transition-all hover:scale-105 border flex-shrink-0"
              style={{
                backgroundColor: panelBg,
                borderColor: panelBorder,
                color: textColor,
              }}
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-3xl font-bold tracking-tight" style={{ color: textColor }}>
                Assignment Metrics
              </h1>
              <p className="mt-1 text-sm" style={{ color: mutedText }}>
                Monitor and analyze assignment completion rates and performance.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="relative group">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                <Activity className="w-4 h-4 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
              </div>
              <select
                value={currentWebinar}
                onChange={(e) => {
                  const webinarId = e.target.value;
                  const webinar = webinarData.find((web) => web._id === webinarId);
                  if (webinar) {
                    setStartDate(new Date(webinar.webinarDate).toISOString().split("T")[0]);
                  }
                  setCurrentWebinar(webinarId);
                  setSearchParams({ webinarId });
                }}
                className="pl-10 pr-10 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 appearance-none cursor-pointer font-medium transition-all hover:border-blue-400 w-full sm:w-64"
                style={inputStyle}
              >
                <option value="all">All Webinars</option>
                {webinarData.map((webinar, index) => (
                  <option key={index} value={webinar._id}>
                    {webinar?.webinarName} - {formatDateAsNumber(webinar?.webinarDate)}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none text-gray-400" />
            </div>

            <div className="flex items-center gap-1 p-1 rounded-xl bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/10">
              <button
                onClick={() => setIsTableView(true)}
                className={`p-2 rounded-lg transition-all ${isTableView ? "bg-white dark:bg-slate-800 shadow-sm text-blue-500" : "text-gray-500 hover:text-gray-700"}`}
                title="Table View"
              >
                <List className="w-4 h-4" />
              </button>
              <button
                onClick={() => setIsTableView(false)}
                className={`p-2 rounded-lg transition-all ${!isTableView ? "bg-white dark:bg-slate-800 shadow-sm text-blue-500" : "text-gray-500 hover:text-gray-700"}`}
                title="Grid View"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Date Filter Bar */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 p-4 rounded-2xl border flex flex-col md:flex-row items-center gap-6"
          style={{
            background: glassBg,
            backdropFilter: "blur(16px)",
            borderColor: panelBorder,
          }}
        >
          <div className="flex flex-col sm:flex-row items-center gap-6 w-full md:w-auto">
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <div className="p-2 rounded-lg bg-blue-500/10 text-blue-500">
                <Calendar className="w-4 h-4" />
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] uppercase font-bold tracking-wider" style={{ color: mutedText }}>From</span>
                <input
                  type="date"
                  value={startDate}
                  max={endDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="bg-transparent border-none p-0 text-sm focus:ring-0 cursor-pointer font-medium"
                  style={{ color: textColor }}
                />
              </div>
            </div>

            <div className="h-8 w-px bg-gray-200 dark:bg-gray-700 hidden sm:block"></div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <div className="p-2 rounded-lg bg-purple-500/10 text-purple-500">
                <Calendar className="w-4 h-4" />
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] uppercase font-bold tracking-wider" style={{ color: mutedText }}>To</span>
                <input
                  type="date"
                  value={endDate}
                  min={startDate}
                  max={new Date().toISOString().split("T")[0]}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="bg-transparent border-none p-0 text-sm focus:ring-0 cursor-pointer font-medium"
                  style={{ color: textColor }}
                />
              </div>
            </div>
          </div>

          <div className="flex-1"></div>

          <Button
            onClick={handleDateApply}
            disabled={loading}
            className="w-full md:w-auto rounded-xl bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 h-auto font-semibold shadow-lg shadow-blue-500/20 transition-all active:scale-95 disabled:opacity-50"
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <RotateCcw className="w-4 h-4 animate-spin" />
                <span>Applying...</span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4" />
                <span>Apply Dates</span>
              </div>
            )}
          </Button>
        </motion.div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <motion.div
            whileHover={{ y: -5 }}
            transition={{ type: "spring", stiffness: 300 }}
            className="p-6 rounded-2xl border flex items-center gap-5 shadow-sm"
            style={{
              background: glassBg,
              backdropFilter: "blur(16px)",
              borderColor: panelBorder,
            }}
          >
            <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-500">
              <BarChart className="w-7 h-7" />
            </div>
            <div>
              <p className="text-sm font-medium" style={{ color: mutedText }}>Total Assignments</p>
              <h3 className="text-3xl font-bold mt-1" style={{ color: textColor }}>{loading ? "..." : stats.total}</h3>
            </div>
          </motion.div>

          <motion.div
            whileHover={{ y: -5 }}
            transition={{ type: "spring", stiffness: 300 }}
            className="p-6 rounded-2xl border flex items-center gap-5 shadow-sm"
            style={{
              background: glassBg,
              backdropFilter: "blur(16px)",
              borderColor: panelBorder,
            }}
          >
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
              <CheckCircle className="w-7 h-7" />
            </div>
            <div>
              <p className="text-sm font-medium" style={{ color: mutedText }}>Completed</p>
              <h3 className="text-3xl font-bold mt-1 text-emerald-600">{loading ? "..." : stats.completed}</h3>
            </div>
          </motion.div>

          <motion.div
            whileHover={{ y: -5 }}
            transition={{ type: "spring", stiffness: 300 }}
            className="p-6 rounded-2xl border flex items-center gap-5 shadow-sm"
            style={{
              background: glassBg,
              backdropFilter: "blur(16px)",
              borderColor: panelBorder,
            }}
          >
            <div className="w-14 h-14 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-500">
              <Clock className="w-7 h-7" />
            </div>
            <div>
              <p className="text-sm font-medium" style={{ color: mutedText }}>Pending</p>
              <h3 className="text-3xl font-bold mt-1 text-amber-600">{loading ? "..." : stats.active}</h3>
            </div>
          </motion.div>
        </div>

        {/* Data View Section */}
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div
              key="loader"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="py-20 flex flex-col items-center justify-center"
            >
              <AppLoader size="xl" />
              <p className="mt-4 text-sm font-medium text-gray-500">Loading performance data...</p>
            </motion.div>
          ) : isTableView && !isSmallScreen ? (
            <motion.div
              key="table-view"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="rounded-2xl border overflow-hidden shadow-sm transition-all"
              style={{
                background: glassBg,
                backdropFilter: "blur(16px)",
                borderColor: panelBorder,
              }}
            >
              <div className="overflow-x-auto custom-scrollbar">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr style={{ backgroundColor: isDark ? "rgba(15, 23, 42, 0.5)" : "rgba(249, 250, 251, 0.5)" }}>
                      <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest" style={{ color: mutedText }}>Date</th>
                      <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-center" style={{ color: mutedText }}>Total</th>
                      <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-center" style={{ color: mutedText }}>Completed</th>
                      <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-center" style={{ color: mutedText }}>Pending</th>
                      <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-center" style={{ color: mutedText }}>Completion Rate</th>
                      {!roles.isEmployeeId(role) && !employeeModeData && (
                        <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-right" style={{ color: mutedText }}>Actions</th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y" style={{ borderColor: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)" }}>
                    {stats.daily.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-20 text-center">
                          <div className="flex flex-col items-center opacity-40">
                            <Search className="w-10 h-10 mb-3" />
                            <p className="text-sm font-medium">No metrics data found for the selected range.</p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      stats.daily.map((day, idx) => {
                        const showAction = !roles.isEmployeeId(role) && !employeeModeData;
                        return (
                          <motion.tr
                            key={day.date}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.05 }}
                            onClick={() => showAction && setSelectedData(day)}
                            className={`hover:bg-black/5 dark:hover:bg-white/5 transition-colors group ${showAction ? "cursor-pointer" : ""}`}
                          >
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium" style={{ color: textColor }}>
                            {day.date}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-center font-semibold" style={{ color: textColor }}>
                            {day.count}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                            <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 hover:bg-emerald-500/20 rounded-lg px-3 py-1">
                              {day.completed}
                            </Badge>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                            <Badge className="bg-amber-500/10 text-amber-500 border-amber-500/20 hover:bg-amber-500/20 rounded-lg px-3 py-1">
                              {day.count - day.completed}
                            </Badge>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex flex-col items-center gap-1.5">
                              <span className="text-xs font-bold" style={{ color: textColor }}>
                                {((day.completed / day.count) * 100 || 0).toFixed(1)}%
                              </span>
                              <div className="w-32 h-1.5 rounded-full bg-black/5 dark:bg-white/10 overflow-hidden">
                                <motion.div
                                  initial={{ width: 0 }}
                                  animate={{ width: `${(day.completed / day.count) * 100 || 0}%` }}
                                  className={`h-full rounded-full ${(day.completed / day.count) >= 0.8 ? "bg-emerald-500" :
                                    (day.completed / day.count) >= 0.5 ? "bg-blue-500" : "bg-amber-500"
                                    }`}
                                />
                              </div>
                            </div>
                          </td>
                          {!roles.isEmployeeId(role) && !employeeModeData && (
                            <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setSelectedData(day)}
                                className="rounded-xl hover:bg-blue-500/10 text-blue-500 hover:text-blue-600 transition-all"
                              >
                                <Eye className="w-5 h-5" />
                              </Button>
                            </td>
                          )}
                        </motion.tr>
                      );
                    })
                    )}
                  </tbody>
                </table>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="grid-view"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {stats.daily.length === 0 ? (
                <div className="col-span-full py-20 flex flex-col items-center opacity-40">
                  <Search className="w-10 h-10 mb-3" />
                  <p className="text-sm font-medium">No metrics data found for the selected range.</p>
                </div>
              ) : (
                stats.daily.map((day, idx) => (
                  <DailyStatCard
                    key={day.date}
                    idx={idx}
                    day={day}
                    onViewDetails={setSelectedData}
                    showViewButton={!roles.isEmployeeId(role) && !employeeModeData}
                    isDark={isDark}
                    panelBorder={panelBorder}
                    glassBg={glassBg}
                    textColor={textColor}
                    mutedText={mutedText}
                  />
                ))
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <Suspense fallback={<ModalFallback />}>
        {selectedData && (
          <EmpAssignModal
            selectedData={selectedData}
            setSelectedData={setSelectedData}
          />
        )}
      </Suspense>
    </div>
  );
};

export default EmployeeAssignMetrics;

const DailyStatCard = ({
  day,
  idx,
  onViewDetails,
  showViewButton,
  isDark,
  panelBorder,
  glassBg,
  textColor,
  mutedText
}) => {
  const pendingCount = day.count - day.completed;
  const completionRate = (day.completed / day.count) * 100 || 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: idx * 0.05 }}
      whileHover={{ scale: 1.02 }}
      onClick={() => showViewButton && onViewDetails(day)}
      className={`rounded-2xl border p-5 shadow-sm transition-all ${showViewButton ? "cursor-pointer" : ""}`}
      style={{
        background: glassBg,
        backdropFilter: "blur(16px)",
        borderColor: panelBorder,
      }}
    >
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-blue-500/10 text-blue-500">
            <Calendar className="w-4 h-4" />
          </div>
          <p className="font-bold text-sm" style={{ color: textColor }}>{day.date}</p>
        </div>
        {showViewButton && (
          <div onClick={(e) => e.stopPropagation()}>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onViewDetails(day)}
              className="rounded-xl h-8 w-8 hover:bg-blue-500/10 text-blue-500 transition-all"
            >
              <Eye className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium" style={{ color: mutedText }}>Total Assignments</span>
          <span className="text-sm font-bold" style={{ color: textColor }}>{day.count}</span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-xs font-medium" style={{ color: mutedText }}>Completed</span>
          <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 rounded-lg px-2 py-0.5 text-[10px]">
            {day.completed}
          </Badge>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-xs font-medium" style={{ color: mutedText }}>Pending</span>
          <Badge className="bg-amber-500/10 text-amber-500 border-amber-500/20 rounded-lg px-2 py-0.5 text-[10px]">
            {pendingCount}
          </Badge>
        </div>

        <div className="pt-2 border-t" style={{ borderColor: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)" }}>
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-bold" style={{ color: textColor }}>Progress</span>
            <span className="text-xs font-bold text-blue-500">{completionRate.toFixed(1)}%</span>
          </div>
          <div className="h-2 w-full rounded-full bg-black/5 dark:bg-white/10 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${completionRate}%` }}
              className={`h-full rounded-full ${completionRate >= 80 ? "bg-emerald-500" :
                completionRate >= 50 ? "bg-blue-500" : "bg-amber-500"
                }`}
            />
          </div>
        </div>
      </div>
    </motion.div>
  );
};
