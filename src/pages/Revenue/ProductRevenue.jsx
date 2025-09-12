import React, { useEffect, useState, useCallback } from "react";
import { formatCurrency, formatDate } from "../../utils/LeadType";
import productRevenueService from "../../services/productRevenueService";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { exportProductRevenue } from "../../features/actions/export-excel";
import useMediaQuery from "../../hooks/useMediaQuery";

import RupeeICon from "../../components/SVGs/rupee-icon.svg";
import ProductIcon from "../../components/SVGs/product.svg";
import CustomerIcon from "../../components/SVGs/customer-icon.svg";
import { GreenDownloadIcon } from "../../components/SVGs";
import PageLimitEditor from "../../components/PageLimitEditor";

const DataListItemCard = ({ title, metric1, metric2, onClick }) => (
  <div
    onClick={onClick}
    className="cursor-pointer rounded-lg border bg-white p-4 shadow-sm transition-shadow hover:shadow-md"
  >
    <p className="truncate font-semibold text-gray-800" title={title}>
      {title}
    </p>
    <div className="mt-2 space-y-1 border-t pt-2 text-sm">
      <div className="flex justify-between">
        <span className="text-gray-500">{metric1.label}</span>
        <span className="font-medium text-gray-900">{metric1.value}</span>
      </div>
      <div className="flex justify-between">
        <span className="text-gray-500">{metric2.label}</span>
        <span className="font-medium text-gray-900">{metric2.value}</span>
      </div>
    </div>
  </div>
);

// A reusable block to render either a table or cards based on screen size.
const AnalyticsBlock = ({
  title,
  data,
  columns,
  cardRenderer,
  onExport,
  isExportLoading,
  onRowClick,
  pageLimitId,
  isSmallScreen,
  noDataMessage = "No data available for this period.",
}) => (
  <div className="flex flex-col rounded-lg border border-gray-100 bg-white p-4 shadow-sm sm:p-6">
    {/* Header with Title and Export Button */}
    <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
      <h3 className="text-lg font-semibold">{title}</h3>
      <button
        onClick={onExport}
        disabled={isExportLoading}
        className="flex items-center gap-2 rounded-md border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 shadow-sm transition-colors duration-200 hover:bg-gray-50"
      >
        <img src={GreenDownloadIcon} alt="Download" className="h-4 w-4" />
        <span>Export</span>
      </button>
    </div>

    {/* Content: Table or Cards */}
    <div className="flex-grow overflow-y-auto max-h-[300px]">
      {data.length > 0 ? (
        isSmallScreen ? (
          <div className="space-y-3">{data.map(cardRenderer)}</div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="sticky top-0 z-10 border-b bg-white text-left text-sm text-gray-500">
                {columns.map((col) => (
                  <th key={col.header} className="px-2 pb-3">
                    {col.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.map((item, index) => (
                <tr
                  key={index}
                  onClick={() => onRowClick(item)}
                  className="cursor-pointer border-b transition-colors duration-150 last:border-b-0 hover:bg-gray-100"
                >
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className="px-2 py-3 text-sm text-gray-600"
                    >
                      {col.accessor(item)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        )
      ) : (
        <div className="flex h-full items-center justify-center text-center text-sm text-gray-500">
          <p>{noDataMessage}</p>
        </div>
      )}
    </div>

    {/* Footer with Page Limit Editor */}
    {pageLimitId && (
      <div className="mt-4 ml-auto">
        <PageLimitEditor defaultLimit={5} pageId={pageLimitId} label="Limit" />
      </div>
    )}
  </div>
);

const ProductRevenue = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const isSmallScreen = useMediaQuery("(max-width: 768px)");

  const WEBINAR_PERFORMANCE = "webinar-performance";
  const TOP_PRODUCTS = "top-products";
  const TOP_ATTENDEES = "top-attendees";

  const topProductsLimit = useSelector(
    (state) => state.pageLimits[TOP_PRODUCTS] || 5
  );
  const topAttendeesLimit = useSelector(
    (state) => state.pageLimits[TOP_ATTENDEES] || 5
  );
  const webinarPerformaceLimit = useSelector(
    (state) => state.pageLimits[WEBINAR_PERFORMANCE] || 5
  );

  console.log(topProductsLimit, topAttendeesLimit, webinarPerformaceLimit);

  const { isExportLoading } = useSelector((state) => state.export);

  const [metrics, setMetrics] = useState({
    totalRevenue: 0,
    totalEnrollments: 0,
    totalCustomers: 0,
  });
  const [revenueByLevel, setRevenueByLevel] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [webinarRevenue, setWebinarRevenue] = useState([]);
  const [loading, setLoading] = useState(false);
  const [topUsers, setTopUsers] = useState([]);

  const [startDate, setStartDate] = useState(
    new Date(new Date().setDate(new Date().getDate() - 7))
      .toISOString()
      .split("T")[0]
  );
  const [endDate, setEndDate] = useState(
    new Date().toISOString().split("T")[0]
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
        console.log(totalRevenueRes);
        setMetrics((prev) => ({
          ...prev,
          totalRevenue: totalRevenueRes?.data?.totalRevenue || 0,
          totalEnrollments: totalRevenueRes?.data?.totalEnrollments || 0,
          totalCustomers: totalRevenueRes?.data?.totalCustomers || 0,
        }));
      }

      if (revenueByLevelRes?.success) setRevenueByLevel(revenueByLevelRes.data);
      if (topProductsRes?.success) setTopProducts(topProductsRes.data);
      if (topUsersRes?.success) setTopUsers(topUsersRes.data);
      if (webinarRevenueRes?.success) setWebinarRevenue(webinarRevenueRes.data);
    } catch (error) {
      console.error("Error fetching product revenue data:", error);
    } finally {
      setLoading(false);
    }
  }, [
    startDate,
    endDate,
    topProductsLimit,
    topAttendeesLimit,
    webinarPerformaceLimit,
  ]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleExport = (data, filename) => {
    let limit = 1;
    if (filename === "webinar-performance") limit = webinarPerformaceLimit;
    else if (filename === "top-performing-products") limit = topProductsLimit;
    else if (filename === "top-customers") limit = topAttendeesLimit;
    dispatch(
      exportProductRevenue({ uniqueId: filename, startDate, endDate, limit })
    );
  };

  const MetricCard = ({ icon: Icon, title, value, format = true }) => (
    <div className="p-6 bg-white rounded-lg shadow-sm border border-gray-100">
      <div className="flex items-center gap-4">
        <div className="p-3 bg-indigo-50 rounded-lg">
          <img src={Icon} alt={title} className="min-h-5 h-5 w-5 min-w-5" />
        </div>
        <div>
          <p className="text-sm text-gray-500">{title}</p>
          <p className="mt-1 text-2xl font-semibold text-gray-900">
            {format ? formatCurrency(value) : value}
          </p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="p-4 mt-10 sm:p-6 md:p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          Product Revenue Analytics
        </h1>

        {/* Responsive Header Controls */}
        <div className="flex flex-col sm:flex-row gap-4 mt-4 items-center">
          <div className="flex w-full sm:w-auto items-center gap-2">
            <label htmlFor="startDate" className="text-sm text-gray-600">
              From:
            </label>
            <input
              id="startDate"
              type="date"
              value={startDate}
              max={endDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="px-3 py-2 border rounded-md text-sm focus:ring-indigo-500 focus:border-indigo-500 w-full"
            />
          </div>
          <div className="flex w-full sm:w-auto items-center gap-2">
            <label htmlFor="endDate" className="text-sm text-gray-600">
              To:
            </label>
            <input
              id="endDate"
              type="date"
              value={endDate}
              min={startDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="px-3 py-2 border rounded-md text-sm focus:ring-indigo-500 focus:border-indigo-500 w-full"
            />
          </div>
          <button
            onClick={fetchData}
            disabled={loading}
            className="w-full sm:w-auto px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm transition-colors duration-200"
          >
            {loading ? "Applying..." : "Apply Dates"}
          </button>
        </div>

        <p className="text-gray-500 mt-4 text-sm">
          Showing data from <strong>{formatDate(startDate)}</strong> to{" "}
          <strong>{formatDate(endDate)}</strong>
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <MetricCard
          icon={RupeeICon}
          title="Total Revenue"
          value={metrics.totalRevenue}
        />
        <MetricCard
          icon={ProductIcon}
          title="Total Enrollments"
          format={false}
          value={metrics.totalEnrollments}
        />

        <MetricCard
          icon={CustomerIcon}
          title="Total Customers"
          format={false}
          value={metrics.totalCustomers}
        />
      </div>

      {/* Responsive Data Tables Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AnalyticsBlock
          title="Revenue by Product Level"
          data={revenueByLevel}
          isSmallScreen={isSmallScreen}
          onExport={() =>
            handleExport(revenueByLevel, "revenue-by-product-level")
          }
          isExportLoading={isExportLoading}
          onRowClick={(item) =>
            navigate(`/product-enrollments?level=${item._id}`)
          }
          columns={[
            {
              header: "Level",
              key: "level",
              accessor: (item) => `Level ${item._id}`,
            },
            {
              header: "Revenue",
              key: "revenue",
              accessor: (item) => formatCurrency(item.totalRevenue),
            },
            { header: "Sales", key: "sales", accessor: (item) => item.count },
          ]}
          cardRenderer={(item, index) => (
            <DataListItemCard
              key={index}
              title={`Level ${item._id}`}
              metric1={{
                label: "Revenue",
                value: formatCurrency(item.totalRevenue),
              }}
              metric2={{ label: "Sales", value: item.count }}
              onClick={() => navigate(`/product-enrollments?level=${item._id}`)}
            />
          )}
        />
        <AnalyticsBlock
          title="Webinar Performance"
          data={webinarRevenue}
          isSmallScreen={isSmallScreen}
          pageLimitId={WEBINAR_PERFORMANCE}
          onExport={() => handleExport(webinarRevenue, "webinar-performance")}
          isExportLoading={isExportLoading}
          onRowClick={(item) =>
            navigate(
              `/webinarDetails/${item._id}?tabValue=enrollments&page=1&subTabValue=attendees`
            )
          }
          columns={[
            {
              header: "Webinar",
              key: "webinar",
              accessor: (item) => item.webinarName || "N/A",
            },
            {
              header: "Revenue",
              key: "revenue",
              accessor: (item) => formatCurrency(item.totalRevenue),
            },
            {
              header: "Enrollments",
              key: "enrollments",
              accessor: (item) => item.totalEnrollments,
            },
          ]}
          cardRenderer={(item, index) => (
            <DataListItemCard
              key={index}
              title={item.webinarName || "N/A"}
              metric1={{
                label: "Revenue",
                value: formatCurrency(item.totalRevenue),
              }}
              metric2={{ label: "Enrollments", value: item.totalEnrollments }}
              onClick={() =>
                navigate(
                  `/webinarDetails/${item._id}?tabValue=enrollments&page=1&subTabValue=attendees`
                )
              }
            />
          )}
        />
        <AnalyticsBlock
          title="Top Performing Products"
          data={topProducts}
          isSmallScreen={isSmallScreen}
          pageLimitId={TOP_PRODUCTS}
          onExport={() => handleExport(topProducts, "top-performing-products")}
          isExportLoading={isExportLoading}
          onRowClick={(item) =>
            navigate(`/product-enrollments?productId=${item._id}`)
          }
          columns={[
            {
              header: "Product",
              key: "product",
              accessor: (item) => item.name,
            },
            {
              header: "Revenue",
              key: "revenue",
              accessor: (item) => formatCurrency(item.totalRevenue),
            },
            {
              header: "Sales",
              key: "sales",
              accessor: (item) => item.totalSales,
            },
          ]}
          cardRenderer={(item, index) => (
            <DataListItemCard
              key={index}
              title={item.name}
              metric1={{
                label: "Revenue",
                value: formatCurrency(item.totalRevenue),
              }}
              metric2={{ label: "Sales", value: item.totalSales }}
              onClick={() =>
                navigate(`/product-enrollments?productId=${item._id}`)
              }
            />
          )}
        />
        <AnalyticsBlock
          title="Top Customers"
          data={topUsers}
          isSmallScreen={isSmallScreen}
          pageLimitId={TOP_ATTENDEES}
          onExport={() => handleExport(topUsers, "top-customers")}
          isExportLoading={isExportLoading}
          onRowClick={(item) =>
            navigate(`/particularContact?email=${item._id}`)
          }
          columns={[
            { header: "Email", key: "email", accessor: (item) => item._id },
            {
              header: "Total Spent",
              key: "spent",
              accessor: (item) => formatCurrency(item.totalRevenue),
            },
            {
              header: "Purchases",
              key: "purchases",
              accessor: (item) => item.totalPurchases,
            },
          ]}
          cardRenderer={(item, index) => (
            <DataListItemCard
              key={index}
              title={item._id}
              metric1={{
                label: "Total Spent",
                value: formatCurrency(item.totalRevenue),
              }}
              metric2={{ label: "Purchases", value: item.totalPurchases }}
              onClick={() => navigate(`/particularContact?email=${item._id}`)}
            />
          )}
        />
      </div>
    </div>
  );
};

export default ProductRevenue;
