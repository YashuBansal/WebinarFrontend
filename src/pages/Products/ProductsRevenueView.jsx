import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowUpDown, Download, IndianRupee, Layers, Package } from "lucide-react";
import { Button } from "../../components/ui/button";
import { useTheme } from "../../contexts/ThemeContext";
import { formatCurrency, formatDate } from "../../utils/LeadType";
import productRevenueService from "../../services/productRevenueService";
import { exportProductRevenue } from "../../features/actions/export-excel";
import PageLimitEditor from "../../components/PageLimitEditor";

const WEBINAR_PERFORMANCE = "webinar-performance";
const TOP_PRODUCTS = "top-products";
const TOP_ATTENDEES = "top-attendees";

function TableEmpty({ colSpan, theme, message }) {
  return (
    <tr>
      <td
        colSpan={colSpan}
        className="py-12 text-center text-sm"
        style={{ color: theme === "dark" ? "#94a3b8" : "#64748b" }}
      >
        {message}
      </td>
    </tr>
  );
}

export default function ProductsRevenueView({ onBack }) {
  const { theme } = useTheme();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { isExportLoading } = useSelector((s) => s.export);

  const topProductsLimit = useSelector((s) => s.pageLimits[TOP_PRODUCTS] || 5);
  const topAttendeesLimit = useSelector((s) => s.pageLimits[TOP_ATTENDEES] || 5);
  const webinarPerformaceLimit = useSelector(
    (s) => s.pageLimits[WEBINAR_PERFORMANCE] || 5
  );

  const [startDate, setStartDate] = useState(
    () => new Date(new Date().setDate(new Date().getDate() - 7)).toISOString().split("T")[0]
  );
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split("T")[0]);

  const [metrics, setMetrics] = useState({
    totalRevenue: 0,
    totalEnrollments: 0,
    totalCustomers: 0,
  });
  const [revenueByLevel, setRevenueByLevel] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [webinarRevenue, setWebinarRevenue] = useState([]);
  const [topUsers, setTopUsers] = useState([]);
  const [loading, setLoading] = useState(false);

  const labelStyle = useMemo(
    () => ({
      color: theme === "dark" ? "#cbd5e1" : "#475569",
      fontSize: "11px",
      fontWeight: 600,
      marginBottom: "2px",
      display: "block",
      textTransform: "uppercase",
      letterSpacing: "0.5px",
    }),
    [theme]
  );

  const inputStyle = useMemo(
    () => ({
      backgroundColor: theme === "dark" ? "#0f172a" : "#ffffff",
      border: `1px solid ${theme === "dark" ? "#334155" : "#e2e8f0"}`,
      color: theme === "dark" ? "#f8fafc" : "#0f172a",
      fontFamily: "Inter, sans-serif",
    }),
    [theme]
  );

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const commonParams = { start: startDate, end: endDate };
      const [
        totalRevenueRes,
        revenueByLevelRes,
        topProductsRes,
        topUsersRes,
        webinarRevenueRes,
      ] = await Promise.all([
        productRevenueService.getTotalRevenue(commonParams),
        productRevenueService.getRevenueByLevel(commonParams),
        productRevenueService.getTopProducts({
          ...commonParams,
          limit: topProductsLimit,
        }),
        productRevenueService.getTopUsers({
          ...commonParams,
          limit: topAttendeesLimit,
        }),
        productRevenueService.getRevenueByWebinar({
          ...commonParams,
          limit: webinarPerformaceLimit,
        }),
      ]);

      if (totalRevenueRes?.success) {
        setMetrics({
          totalRevenue: totalRevenueRes?.data?.totalRevenue || 0,
          totalEnrollments: totalRevenueRes?.data?.totalEnrollments || 0,
          totalCustomers: totalRevenueRes?.data?.totalCustomers || 0,
        });
      } else {
        setMetrics({ totalRevenue: 0, totalEnrollments: 0, totalCustomers: 0 });
      }

      if (revenueByLevelRes?.success && Array.isArray(revenueByLevelRes.data)) {
        setRevenueByLevel(revenueByLevelRes.data);
      } else setRevenueByLevel([]);

      if (topProductsRes?.success && Array.isArray(topProductsRes.data)) {
        setTopProducts(topProductsRes.data);
      } else setTopProducts([]);

      if (topUsersRes?.success && Array.isArray(topUsersRes.data)) {
        setTopUsers(topUsersRes.data);
      } else setTopUsers([]);

      if (webinarRevenueRes?.success && Array.isArray(webinarRevenueRes.data)) {
        setWebinarRevenue(webinarRevenueRes.data);
      } else setWebinarRevenue([]);
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate, topProductsLimit, topAttendeesLimit, webinarPerformaceLimit]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleExport = (uniqueId) => {
    let limit = 5;
    if (uniqueId === "webinar-performance") limit = webinarPerformaceLimit;
    else if (uniqueId === "top-performing-products") limit = topProductsLimit;
    else if (uniqueId === "top-customers") limit = topAttendeesLimit;
    else if (uniqueId === "revenue-by-product-level") limit = 100;
    dispatch(exportProductRevenue({ uniqueId, startDate, endDate, limit }));
  };

  const stats = [
    {
      label: "Total Revenue",
      value: formatCurrency(metrics.totalRevenue),
      icon: IndianRupee,
      color: "#22B573",
      bg: "rgba(34, 181, 115, 0.1)",
    },
    {
      label: "Total Enrollments",
      value: String(metrics.totalEnrollments ?? 0),
      icon: Layers,
      color: "#1877F2",
      bg: "rgba(24, 119, 242, 0.1)",
    },
    {
      label: "Total Customers",
      value: String(metrics.totalCustomers ?? 0),
      icon: Package,
      color: "#f59e0b",
      bg: "rgba(245, 158, 11, 0.1)",
    },
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto space-y-6 transition-all duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button
            type="button"
            onClick={onBack}
            variant="ghost"
            className="p-2 h-10 w-10 rounded-xl hover:bg-black/5 dark:hover:bg-white/10"
          >
            <ArrowUpDown className="w-5 h-5 -rotate-90" />
          </Button>
          <div>
            <h2
              className="text-2xl font-bold tracking-tight flex items-center gap-3"
              style={{ color: theme === "dark" ? "#f8fafc" : "#071028" }}
            >
              Product Revenue Analytics
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Detailed performance tracking and revenue breakdown.
            </p>
          </div>
        </div>
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
        <div
          className="p-6 rounded-2xl border flex flex-col md:flex-row items-end gap-4 bg-white dark:bg-slate-800 shadow-sm"
          style={{ borderColor: theme === "dark" ? "#334155" : "#e2e8f0" }}
        >
          <div className="flex-1 w-full grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label style={labelStyle}>From</label>
              <input
                type="date"
                value={startDate}
                max={endDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full p-2.5 rounded-lg border text-sm"
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>To</label>
              <input
                type="date"
                value={endDate}
                min={startDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full p-2.5 rounded-lg border text-sm"
                style={inputStyle}
              />
            </div>
          </div>
          <Button
            type="button"
            onClick={() => fetchData()}
            disabled={loading}
            className="px-8 h-[46px] bg-[#1877F2] hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-500/20 transition-all hover:scale-105 disabled:opacity-60"
          >
            {loading ? "Applying…" : "Apply Dates"}
          </Button>
        </div>

        <div className="flex items-center gap-2 px-2">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <p
            className="text-sm font-medium"
            style={{ color: theme === "dark" ? "#94a3b8" : "#64748b" }}
          >
            Showing data from{" "}
            <span className="text-blue-500 font-bold">{formatDate(startDate)}</span> to{" "}
            <span className="text-blue-500 font-bold">{formatDate(endDate)}</span>
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.1 }}
              className="p-6 rounded-2xl border bg-white dark:bg-slate-800 shadow-sm flex flex-col gap-4"
              style={{ borderColor: theme === "dark" ? "#334155" : "#e2e8f0" }}
            >
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center"
                style={{ backgroundColor: stat.bg }}
              >
                <stat.icon className="w-6 h-6" style={{ color: stat.color }} />
              </div>
              <div>
                <p className="text-sm font-bold uppercase tracking-wider text-gray-400">
                  {stat.label}
                </p>
                <h4
                  className="text-3xl font-black mt-1 break-all"
                  style={{ color: theme === "dark" ? "#f8fafc" : "#0f172a" }}
                >
                  {stat.value}
                </h4>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="p-6 rounded-3xl border bg-white dark:bg-slate-800 shadow-sm flex flex-col h-[350px]"
            style={{ borderColor: theme === "dark" ? "#334155" : "#e2e8f0" }}
          >
            <div className="flex items-center justify-between mb-6">
              <h5
                className="font-bold text-base"
                style={{ color: theme === "dark" ? "#cbd5e1" : "#1e293b" }}
              >
                Revenue by Product Level
              </h5>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={isExportLoading}
                onClick={() => handleExport("revenue-by-product-level")}
                className="h-9 px-3 text-blue-500 font-bold rounded-xl hover:bg-blue-50 dark:hover:bg-blue-500/10"
              >
                <Download className="w-4 h-4 mr-2" /> Export
              </Button>
            </div>
            <div className="flex-1 overflow-auto custom-scrollbar">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="text-xs uppercase tracking-wider text-gray-500 border-b dark:border-slate-700">
                    <th className="pb-3 font-bold">Level</th>
                    <th className="pb-3 font-bold text-right">Revenue</th>
                    <th className="pb-3 font-bold text-right">Sales</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {loading ? (
                    <TableEmpty colSpan={3} theme={theme} message="Loading…" />
                  ) : revenueByLevel.length === 0 ? (
                    <TableEmpty
                      colSpan={3}
                      theme={theme}
                      message="No data for this period."
                    />
                  ) : (
                    revenueByLevel.map((item) => (
                      <tr
                        key={item._id ?? item.level}
                        role="button"
                        tabIndex={0}
                        onClick={() => navigate(`/product-enrollments?level=${item._id}`)}
                        onKeyDown={(e) =>
                          e.key === "Enter" && navigate(`/product-enrollments?level=${item._id}`)
                        }
                        className="border-b dark:border-slate-700/50 hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer"
                      >
                        <td
                          className="py-4 font-medium"
                          style={{ color: theme === "dark" ? "#f8fafc" : "#071028" }}
                        >
                          Level {item._id}
                        </td>
                        <td className="py-4 text-right font-bold text-green-600">
                          {formatCurrency(item.totalRevenue)}
                        </td>
                        <td
                          className="py-4 text-right font-medium"
                          style={{ color: theme === "dark" ? "#cbd5e1" : "#475569" }}
                        >
                          {item.count}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="p-6 rounded-3xl border bg-white dark:bg-slate-800 shadow-sm flex flex-col h-[350px]"
            style={{ borderColor: theme === "dark" ? "#334155" : "#e2e8f0" }}
          >
            <div className="flex items-center justify-between mb-6">
              <h5
                className="font-bold text-base"
                style={{ color: theme === "dark" ? "#cbd5e1" : "#1e293b" }}
              >
                Webinar Performance
              </h5>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={isExportLoading}
                onClick={() => handleExport("webinar-performance")}
                className="h-9 px-3 text-blue-500 font-bold rounded-xl hover:bg-blue-50 dark:hover:bg-blue-500/10"
              >
                <Download className="w-4 h-4 mr-2" /> Export
              </Button>
            </div>
            <div className="flex-1 overflow-auto custom-scrollbar">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="text-xs uppercase tracking-wider text-gray-500 border-b dark:border-slate-700">
                    <th className="pb-3 font-bold">Webinar</th>
                    <th className="pb-3 font-bold text-right">Revenue</th>
                    <th className="pb-3 font-bold text-right">Enrollments</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {loading ? (
                    <TableEmpty colSpan={3} theme={theme} message="Loading…" />
                  ) : webinarRevenue.length === 0 ? (
                    <TableEmpty
                      colSpan={3}
                      theme={theme}
                      message="No data for this period."
                    />
                  ) : (
                    webinarRevenue.map((item) => (
                      <tr
                        key={item._id}
                        role="button"
                        tabIndex={0}
                        onClick={() =>
                          navigate(
                            `/webinarDetails/${item._id}?tabValue=enrollments&page=1&subTabValue=attendees`
                          )
                        }
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            navigate(
                              `/webinarDetails/${item._id}?tabValue=enrollments&page=1&subTabValue=attendees`
                            );
                          }
                        }}
                        className="border-b dark:border-slate-700/50 hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer"
                      >
                        <td
                          className="py-4 font-medium"
                          style={{ color: theme === "dark" ? "#f8fafc" : "#071028" }}
                        >
                          {item.webinarName || "N/A"}
                        </td>
                        <td className="py-4 text-right font-bold text-green-600">
                          {formatCurrency(item.totalRevenue)}
                        </td>
                        <td
                          className="py-4 text-right font-medium"
                          style={{ color: theme === "dark" ? "#cbd5e1" : "#475569" }}
                        >
                          {item.totalEnrollments}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <div className="pt-4 mt-auto flex justify-end items-center gap-2 border-t dark:border-slate-700">
              <PageLimitEditor defaultLimit={5} pageId={WEBINAR_PERFORMANCE} label="Limit" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="p-6 rounded-3xl border bg-white dark:bg-slate-800 shadow-sm flex flex-col h-[350px]"
            style={{ borderColor: theme === "dark" ? "#334155" : "#e2e8f0" }}
          >
            <div className="flex items-center justify-between mb-6">
              <h5
                className="font-bold text-base"
                style={{ color: theme === "dark" ? "#cbd5e1" : "#1e293b" }}
              >
                Top Performing Products
              </h5>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={isExportLoading}
                onClick={() => handleExport("top-performing-products")}
                className="h-9 px-3 text-blue-500 font-bold rounded-xl hover:bg-blue-50 dark:hover:bg-blue-500/10"
              >
                <Download className="w-4 h-4 mr-2" /> Export
              </Button>
            </div>
            <div className="flex-1 overflow-auto custom-scrollbar">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="text-xs uppercase tracking-wider text-gray-500 border-b dark:border-slate-700">
                    <th className="pb-3 font-bold">Product</th>
                    <th className="pb-3 font-bold text-right">Revenue</th>
                    <th className="pb-3 font-bold text-right">Sales</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {loading ? (
                    <TableEmpty colSpan={3} theme={theme} message="Loading…" />
                  ) : topProducts.length === 0 ? (
                    <TableEmpty
                      colSpan={3}
                      theme={theme}
                      message="No data for this period."
                    />
                  ) : (
                    topProducts.map((item) => (
                      <tr
                        key={item._id}
                        role="button"
                        tabIndex={0}
                        onClick={() => navigate(`/product-enrollments?productId=${item._id}`)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            navigate(`/product-enrollments?productId=${item._id}`);
                          }
                        }}
                        className="border-b dark:border-slate-700/50 hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer"
                      >
                        <td
                          className="py-4 font-medium"
                          style={{ color: theme === "dark" ? "#f8fafc" : "#071028" }}
                        >
                          {item.name}
                        </td>
                        <td className="py-4 text-right font-bold text-green-600">
                          {formatCurrency(item.totalRevenue)}
                        </td>
                        <td
                          className="py-4 text-right font-medium"
                          style={{ color: theme === "dark" ? "#cbd5e1" : "#475569" }}
                        >
                          {item.totalSales}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <div className="pt-4 mt-auto flex justify-end items-center gap-2 border-t dark:border-slate-700">
              <PageLimitEditor defaultLimit={5} pageId={TOP_PRODUCTS} label="Limit" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="p-6 rounded-3xl border bg-white dark:bg-slate-800 shadow-sm flex flex-col h-[350px]"
            style={{ borderColor: theme === "dark" ? "#334155" : "#e2e8f0" }}
          >
            <div className="flex items-center justify-between mb-6">
              <h5
                className="font-bold text-base"
                style={{ color: theme === "dark" ? "#cbd5e1" : "#1e293b" }}
              >
                Top Customers
              </h5>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={isExportLoading}
                onClick={() => handleExport("top-customers")}
                className="h-9 px-3 text-blue-500 font-bold rounded-xl hover:bg-blue-50 dark:hover:bg-blue-500/10"
              >
                <Download className="w-4 h-4 mr-2" /> Export
              </Button>
            </div>
            <div className="flex-1 overflow-auto custom-scrollbar">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="text-xs uppercase tracking-wider text-gray-500 border-b dark:border-slate-700">
                    <th className="pb-3 font-bold">Email</th>
                    <th className="pb-3 font-bold text-right">Total Spent</th>
                    <th className="pb-3 font-bold text-right">Purchases</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {loading ? (
                    <TableEmpty colSpan={3} theme={theme} message="Loading…" />
                  ) : topUsers.length === 0 ? (
                    <TableEmpty
                      colSpan={3}
                      theme={theme}
                      message="No data for this period."
                    />
                  ) : (
                    topUsers.map((item) => (
                      <tr
                        key={item._id}
                        role="button"
                        tabIndex={0}
                        onClick={() => navigate(`/particularContact?email=${encodeURIComponent(item._id)}`)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            navigate(
                              `/particularContact?email=${encodeURIComponent(item._id)}`
                            );
                          }
                        }}
                        className="border-b dark:border-slate-700/50 hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer"
                      >
                        <td
                          className="py-4 font-medium"
                          style={{ color: theme === "dark" ? "#f8fafc" : "#071028" }}
                        >
                          {item._id}
                        </td>
                        <td className="py-4 text-right font-bold text-green-600">
                          {formatCurrency(item.totalRevenue)}
                        </td>
                        <td
                          className="py-4 text-right font-medium"
                          style={{ color: theme === "dark" ? "#cbd5e1" : "#475569" }}
                        >
                          {item.totalPurchases}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <div className="pt-4 mt-auto flex justify-end items-center gap-2 border-t dark:border-slate-700">
              <PageLimitEditor defaultLimit={5} pageId={TOP_ATTENDEES} label="Limit" />
            </div>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}
