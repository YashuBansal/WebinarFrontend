import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { useDispatch, useSelector } from "react-redux";
import { Search } from "lucide-react";
import {
  getDashboardCardsData,
  getDashboardPlansData,
  getDashboardRevenueData,
  getDashboardUsersData,
} from "../../features/actions/globalData";
import {
  ContactUsageChart,
  PlanPopularityChart,
  RevenueByDateChart,
  UserGrowthByDate,
} from "../../components/Dashboard";
import { errorToast } from "../../utils/extra";
import { resetDashboardData } from "../../features/slices/globalData";
import { useTheme } from "../../contexts/ThemeContext";

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

const metricPalette = (color) => {
  switch (color) {
    case "primary":
      return {
        border: "border-blue-200 dark:border-blue-900/50",
        bg: "bg-blue-50/90 dark:bg-blue-500/10",
        value: "text-blue-700 dark:text-blue-400",
        label: "text-blue-600/80 dark:text-blue-300/80",
      };
    case "success":
      return {
        border: "border-emerald-200 dark:border-emerald-900/50",
        bg: "bg-emerald-50/90 dark:bg-emerald-500/10",
        value: "text-emerald-700 dark:text-emerald-400",
        label: "text-emerald-600/80 dark:text-emerald-300/80",
      };
    case "error":
      return {
        border: "border-red-200 dark:border-red-900/50",
        bg: "bg-red-50/90 dark:bg-red-500/10",
        value: "text-red-700 dark:text-red-400",
        label: "text-red-600/80 dark:text-red-300/80",
      };
    case "warning":
      return {
        border: "border-amber-200 dark:border-amber-900/50",
        bg: "bg-amber-50/90 dark:bg-amber-500/10",
        value: "text-amber-800 dark:text-amber-400",
        label: "text-amber-700/80 dark:text-amber-300/80",
      };
    case "secondary":
      return {
        border: "border-violet-200 dark:border-violet-900/50",
        bg: "bg-violet-50/90 dark:bg-violet-500/10",
        value: "text-violet-800 dark:text-violet-400",
        label: "text-violet-700/80 dark:text-violet-300/80",
      };
    case "textPrimary":
    default:
      return {
        border: "border-slate-200 dark:border-slate-800",
        bg: "bg-slate-50/90 dark:bg-slate-800/50",
        value: "text-slate-800 dark:text-slate-200",
        label: "text-slate-600 dark:text-slate-400",
      };
  }
};

function SuperMetricTile({ label, value, color, staggerIndex = 0 }) {
  const p = metricPalette(color);
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: staggerIndex * 0.03 }}
      className={`rounded-2xl border p-4 transition-shadow hover:shadow-md ${p.border} ${p.bg}`}
    >
      <div
        className={`mb-1 text-xs font-semibold uppercase tracking-wide ${p.label}`}
        style={{ fontFamily: "Inter, sans-serif" }}
      >
        {label}
      </div>
      <div
        className={`text-2xl font-bold ${p.value}`}
        style={{ fontFamily: "Inter, sans-serif" }}
      >
        {value}
      </div>
    </motion.div>
  );
}

const SuperAdminDashboard = () => {
  const dispatch = useDispatch();
  const { isDark } = useTheme();
  const { dashBoardCardsData } = useSelector((state) => state.globalData);

  const apiUrl = `${
    import.meta.env.VITE_REACT_APP_WORKING_ENVIRONMENT === "development"
      ? import.meta.env.VITE_REACT_APP_API_BASE_URL_DEVELOPMENT
      : import.meta.env.VITE_REACT_APP_API_BASE_URL_MAIN_PRODUCTION
  }`;

  const {
    data: uniqueEmailMetrics,
    isPending: isUniqueEmailPending,
    refetch: refetchUniqueAttendeeEmails,
  } = useQuery({
    queryKey: ["uniqueAttendeeEmailsSuperAdmin"],
    queryFn: async () => {
      const response = await fetch(
        `${apiUrl}/attendees/metrics/unique-email-count`,
        { credentials: "include" },
      );
      if (!response.ok) {
        throw new Error("Failed to fetch unique attendee email count");
      }
      return response.json();
    },
  });

  const cardData = useMemo(
    () => [
      {
        label: "Accounts Created",
        value:
          (dashBoardCardsData?.adminCount?.totalCount || 0) +
          (dashBoardCardsData?.employeeCount?.totalCount || 0),
        color: "primary",
      },
      {
        label: "Active Accounts",
        value:
          (dashBoardCardsData?.adminCount?.activeCount || 0) +
          (dashBoardCardsData?.employeeCount?.activeCount || 0),
        color: "success",
      },
      {
        label: "In-Active Accounts",
        value:
          (dashBoardCardsData?.adminCount?.inactiveCount || 0) +
          (dashBoardCardsData?.employeeCount?.inactiveCount || 0),
        color: "error",
      },
      {
        label: "Total Admins",
        value: dashBoardCardsData?.adminCount?.totalCount || 0,
        color: "primary",
      },
      {
        label: "Total Active Admins",
        value: dashBoardCardsData?.adminCount?.activeCount || 0,
        color: "primary",
      },
      {
        label: "Total In-Active Admins",
        value: dashBoardCardsData?.adminCount?.inactiveCount || 0,
        color: "primary",
      },
      {
        label: "Total Employees",
        value: dashBoardCardsData?.employeeCount?.totalCount || 0,
        color: "success",
      },
      {
        label: "Total Active Employees",
        value: dashBoardCardsData?.employeeCount?.activeCount || 0,
        color: "primary",
      },
      {
        label: "Total In-Active Employees",
        value: dashBoardCardsData?.employeeCount?.inactiveCount || 0,
        color: "primary",
      },
      {
        label: "Contacts",
        value: `${dashBoardCardsData?.totalContactsUsed || 0} / ${
          dashBoardCardsData?.totalContactsLimit || 0
        }`,
        color: "textPrimary",
      },
      {
        label: "Overall Revenue",
        value: `\u20B9 ${
          dashBoardCardsData?.totalRevenue
            ? dashBoardCardsData?.totalRevenue.toFixed(2)
            : 0
        }`,
        color: "secondary",
      },
      {
        label: "Unique attendee emails",
        value: isUniqueEmailPending
          ? "…"
          : (uniqueEmailMetrics?.uniqueEmailCount ?? 0),
        color: "primary",
      },
    ],
    [dashBoardCardsData, isUniqueEmailPending, uniqueEmailMetrics],
  );

  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [visibleCards, setVisibleCards] = useState([
    "Accounts Created",
    "Active Accounts",
    "In-Active Accounts",
    "Overall Revenue",
    "Total Admins",
    "Total Employees",
    "Contacts",
    "Unique attendee emails",
  ]);

  useEffect(() => {
    const today = new Date();
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(today.getDate() - 7);
    setStartDate(oneWeekAgo);
    setEndDate(today);

    if (oneWeekAgo && today) {
      dispatch(
        getDashboardCardsData({ startDate: oneWeekAgo, endDate: today }),
      );
      dispatch(
        getDashboardPlansData({ startDate: oneWeekAgo, endDate: today }),
      );
      dispatch(
        getDashboardUsersData({ startDate: oneWeekAgo, endDate: today }),
      );
      dispatch(
        getDashboardRevenueData({ startDate: oneWeekAgo, endDate: today }),
      );
    }
    return () => {
      dispatch(resetDashboardData());
    };
  }, [dispatch]);

  const handleToggleModal = () => setModalOpen(!modalOpen);

  const handleCardSelection = (label) => {
    setVisibleCards((prev) =>
      prev.includes(label)
        ? prev.filter((item) => item !== label)
        : [...prev, label],
    );
  };

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

  const formatDateForApi = (date) =>
    date ? date.toISOString().split("T")[0] : null;

  const {
    data: wabaAnalytics,
    isLoading: isWabaLoading,
    isError: isWabaError,
  } = useQuery({
    queryKey: [
      "wabaMessageAnalytics",
      {
        startDate: startDate ? startDate.getTime() : null,
        endDate: endDate ? endDate.getTime() : null,
      },
    ],
    enabled: !!startDate && !!endDate,
    queryFn: async () => {
      if (!startDate || !endDate) return null;

      const start = formatDateForApi(startDate);
      const end = formatDateForApi(endDate);

      const params = new URLSearchParams();
      params.set("startDate", start);
      params.set("endDate", end);

      const response = await fetch(
        `${apiUrl}/waba-message/analytics?${params.toString()}`,
        {
          credentials: "include",
        },
      );

      if (!response.ok) {
        throw new Error("Failed to fetch WABA analytics");
      }

      return response.json();
    },
  });

  const fetchData = () => {
    if (startDate && endDate) {
      dispatch(getDashboardCardsData({ startDate, endDate }));
      dispatch(getDashboardPlansData({ startDate, endDate }));
      dispatch(getDashboardUsersData({ startDate, endDate }));
      dispatch(getDashboardRevenueData({ startDate, endDate }));
    }
    refetchUniqueAttendeeEmails();
  };

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
          <div className="flex min-w-0 w-full flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center lg:w-auto">
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
                    value={startDate ? toYMD(startDate) : ""}
                    max={endDate ? toYMD(endDate) : ""}
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
                    value={endDate ? toYMD(endDate) : ""}
                    min={startDate ? toYMD(startDate) : ""}
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
              onClick={fetchData}
              className="flex w-full items-center justify-center gap-2 rounded-xl px-6 py-2.5 transition-all duration-200 hover:scale-[1.02] hover:shadow-lg active:scale-[0.98] sm:w-auto"
              style={{
                backgroundColor: "#22B573",
                fontFamily: "Inter, sans-serif",
                fontSize: "14px",
                fontWeight: 600,
                color: "#ffffff",
                border: "none",
              }}
            >
              <Search className="h-4 w-4" />
              Find
            </button>
          </div>
          <button
            type="button"
            onClick={handleToggleModal}
            className="w-full rounded-xl border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-800 px-5 py-2.5 text-sm font-semibold text-slate-800 dark:text-slate-200 shadow-sm transition hover:bg-slate-50 dark:hover:bg-slate-700 lg:ml-auto lg:w-auto"
            style={{ fontFamily: "Inter, sans-serif" }}
          >
            Filter Cards
          </button>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {cardData
          .filter((item) => visibleCards.includes(item.label))
          .map((item, index) => (
            <SuperMetricTile key={item.label} staggerIndex={index} {...item} />
          ))}
      </div>

      <div className="mt-10">
        <h2
          className="mb-4 text-lg font-bold text-[#071028] dark:text-slate-100"
          style={{ fontFamily: "Inter, sans-serif" }}
        >
          WhatsApp Message Analytics
        </h2>

        {isWabaLoading && (
          <p
            className="text-sm text-slate-500"
            style={{ fontFamily: "Inter, sans-serif" }}
          >
            Loading WhatsApp message analytics...
          </p>
        )}

        {isWabaError && (
          <p
            className="text-sm text-red-600"
            style={{ fontFamily: "Inter, sans-serif" }}
          >
            Failed to load WhatsApp message analytics.
          </p>
        )}

        {!isWabaLoading && !isWabaError && wabaAnalytics && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <SuperMetricTile
              label="Total Messages"
              value={wabaAnalytics.totalMessages || 0}
              color="primary"
              staggerIndex={0}
            />
            <SuperMetricTile
              label="Pending Messages"
              value={wabaAnalytics.pending || 0}
              color="warning"
              staggerIndex={1}
            />
            <SuperMetricTile
              label="Sent Messages"
              value={wabaAnalytics.sent || 0}
              color="success"
              staggerIndex={2}
            />
            <SuperMetricTile
              label="Delivered Messages"
              value={wabaAnalytics.delivered || 0}
              color="success"
              staggerIndex={3}
            />
            <SuperMetricTile
              label="Read Messages"
              value={wabaAnalytics.read || 0}
              color="primary"
              staggerIndex={4}
            />
            <SuperMetricTile
              label="Failed Messages"
              value={wabaAnalytics.failed || 0}
              color="error"
              staggerIndex={5}
            />
          </div>
        )}
      </div>

      <div className="mt-10 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <PlanPopularityChart />
        <ContactUsageChart />
        <UserGrowthByDate />
        <RevenueByDateChart />
      </div>

      {modalOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4"
          onClick={handleToggleModal}
          role="presentation"
        >
          <div
            className="custom-scrollbar max-h-[90vh] w-full max-w-md overflow-y-auto rounded-xl bg-white dark:bg-slate-900 p-6 shadow-xl border dark:border-slate-800"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="super-admin-filter-cards-title"
          >
            <h2
              id="super-admin-filter-cards-title"
              className="mb-3 text-lg font-semibold text-[#071028] dark:text-slate-100"
              style={{ fontFamily: "Inter, sans-serif" }}
            >
              Select Cards to Display
            </h2>
            <div className="my-3 border-t border-gray-200 dark:border-slate-800" />
            <div className="custom-scrollbar grid max-h-[50vh] grid-cols-1 gap-2 overflow-y-auto pr-1 sm:grid-cols-2">
              {cardData.map((item, index) => (
                <label
                  key={index}
                  className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-2 text-sm hover:bg-gray-50 dark:hover:bg-slate-800 dark:text-slate-300"
                  style={{ fontFamily: "Inter, sans-serif" }}
                >
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-gray-300 dark:border-slate-700 dark:bg-slate-800"
                    checked={visibleCards.includes(item.label)}
                    onChange={() => handleCardSelection(item.label)}
                  />
                  {item.label}
                </label>
              ))}
            </div>
            <div className="mt-5 flex justify-end gap-3 border-t border-gray-100 dark:border-slate-800 pt-4">
              <button
                type="button"
                onClick={handleToggleModal}
                className="rounded-xl border border-slate-300 dark:border-slate-800 px-4 py-2 text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleToggleModal}
                className="rounded-xl px-4 py-2 text-sm font-semibold text-white"
                style={{ backgroundColor: "#22B573" }}
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SuperAdminDashboard;
