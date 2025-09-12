import React, { useEffect, useState, useCallback } from "react";
import { formatCurrency, formatDate } from "../../utils/LeadType";
import revenueService from "../../services/revenueService";
import useMediaQuery from "../../hooks/useMediaQuery"; // Assuming you have this hook

// Import your SVG assets
import RupeeIcon from "../../components/SVGs/rupee-icon.svg";
import TaxIcon from "../../components/SVGs/tax-icon.svg";
import DiscountIcon from "../../components/SVGs/discount-icon.svg";
import CalendarIcon from "../../components/SVGs/indigo-calendar.svg";

// A new, reusable card for displaying a single data row on mobile.
const DataListItemCard = ({ title, metric1, metric2 }) => (
  <div className="rounded-lg border bg-white p-4 shadow-sm">
    <p className="truncate font-semibold text-gray-800 capitalize" title={title}>{title}</p>
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

// A reusable block to render either a table or cards. This cleans up the main component.
const AnalyticsBlock = ({ title, icon, data, columns, cardRenderer, isSmallScreen }) => (
  <div className="flex flex-col rounded-lg border border-gray-100 bg-white p-4 shadow-sm sm:p-6">
    <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold">
      <img src={icon} alt={title} className="h-6 w-6" />
      {title}
    </h3>
    <div className="flex-grow overflow-y-auto">
      {data && data.length > 0 ? (
        isSmallScreen ? (
          <div className="space-y-3">{data.map(cardRenderer)}</div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b text-left text-sm text-gray-500">
                {columns.map((col) => (
                  <th key={col.header} className="pb-3 px-2">{col.header}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.map((item, index) => (
                <tr key={index} className="border-b last:border-b-0 capitalize">
                  {columns.map((col) => (
                    <td key={col.key} className="px-2 py-3 text-sm text-gray-600">{col.accessor(item)}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        )
      ) : (
        <div className="flex h-full items-center justify-center text-center text-sm text-gray-500">
          <p>No data for this period.</p>
        </div>
      )}
    </div>
  </div>
);

const RevenueDashboard = () => {
  const isSmallScreen = useMediaQuery("(max-width: 768px)");

  const [totalData, setTotalData] = useState({ gross: 0, net: 0, final: 0, totalDiscounts: 0, totalTaxes: 0, count: 0 });
  const [billTypeData, setBillTypeData] = useState([]);
  const [durationData, setDurationData] = useState([]);
  const [topPlansData, setTopPlansData] = useState([]);
  const [topAddOnsData, setTopAddOnsData] = useState([]);
  const [loading, setLoading] = useState(false);

  const [startDate, setStartDate] = useState(new Date(new Date().setDate(new Date().getDate() - 7)).toISOString().split("T")[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split("T")[0]);
  
  // Refactored data fetching for better performance and readability
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const commonParams = { start: startDate, end: endDate };
      const [
        totalRes,
        billTypeRes,
        durationRes,
        topPlansRes,
        topAddOnsRes,
      ] = await Promise.all([
        revenueService.getTotalRevenue(commonParams),
        revenueService.getRevenueByType(commonParams),
        revenueService.getDurationRevenue(commonParams),
        revenueService.getTopPlans({ ...commonParams, limit: 5 }),
        revenueService.getTopAddOns({ ...commonParams, limit: 5 }),
      ]);
      setTotalData(totalRes);
      setBillTypeData(billTypeRes);
      setDurationData(durationRes);
      setTopPlansData(topPlansRes);
      setTopAddOnsData(topAddOnsRes);
    } catch (error) {
      console.error("Failed to fetch revenue data:", error);
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const MetricCard = ({ icon: Icon, title, value, helperText }) => (
    <div className="p-6 bg-white rounded-lg shadow-sm border border-gray-100">
      <div className="flex items-center gap-4">
        <div className="p-3 bg-indigo-50 rounded-lg">
          <img src={Icon} alt={title} className="min-h-5 h-5 w-5 min-w-5" />
        </div>
        <div>
          <p className="text-sm text-gray-500">{title}</p>
          <p className="mt-1 text-2xl font-semibold text-gray-900">{loading ? "..." : value || "--"}</p>
          {helperText && <p className="mt-1 text-xs text-gray-500">{loading ? "..." : helperText}</p>}
        </div>
      </div>
    </div>
  );
  
  // Helper to format billing type strings
  const formatBillingType = (type) => type.split("_").map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(" ");

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-7xl mt-10 mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Revenue Dashboard</h1>
        <div className="flex flex-col sm:flex-row gap-4 mt-4 items-center">
          <div className="w-full sm:w-auto flex items-center gap-2">
            <label className="text-sm text-gray-600 w-12 md:w-auto">From:</label>
            <input type="date" value={startDate} max={endDate} onChange={(e) => setStartDate(e.target.value)} className="w-full px-3 py-2 border rounded-md text-sm"/>
          </div>
          <div className="w-full sm:w-auto flex items-center gap-2">
            <label className="text-sm text-gray-600 w-12 md:w-auto">To:</label>
            <input type="date" value={endDate} min={startDate} max={new Date().toISOString().split("T")[0]} onChange={(e) => setEndDate(e.target.value)} className="w-full px-3 py-2 border rounded-md text-sm"/>
          </div>
          <button onClick={fetchData} disabled={loading} className="w-full sm:w-auto px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 text-sm">
            {loading ? "Applying..." : "Apply Dates"}
          </button>
        </div>
        <p className="text-gray-500 mt-4 text-sm">Showing data from <strong>{formatDate(startDate)}</strong> to <strong>{formatDate(endDate)}</strong></p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <MetricCard icon={RupeeIcon} title="Total Revenue" value={formatCurrency(totalData.final)} helperText={`Gross ${formatCurrency(totalData.gross)} • Net ${formatCurrency(totalData.net)}`}/>
        <MetricCard icon={TaxIcon} title="Tax Collected" value={formatCurrency(totalData.totalTaxes)} helperText={`From ${formatCurrency(totalData.final)} revenue`}/>
        <MetricCard icon={DiscountIcon} title="Discounts Given" value={formatCurrency(totalData.totalDiscounts)} helperText={`From ${formatCurrency(totalData.final)} revenue`}/>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AnalyticsBlock
          title="Revenue by Billing Type"
          icon={CalendarIcon}
          data={billTypeData}
          isSmallScreen={isSmallScreen}
          columns={[
            { header: "Type", key: "type", accessor: item => formatBillingType(item.type) },
            { header: "Revenue", key: "revenue", accessor: item => formatCurrency(item.total) },
            { header: "Sales", key: "sales", accessor: item => item.count },
          ]}
          cardRenderer={(item, index) => (
            <DataListItemCard key={index} title={formatBillingType(item.type)} metric1={{label: "Revenue", value: formatCurrency(item.total)}} metric2={{label: "Sales", value: item.count}}/>
          )}
        />
        <AnalyticsBlock
          title="Revenue by Plan Duration"
          icon={CalendarIcon}
          data={durationData}
          isSmallScreen={isSmallScreen}
          columns={[
            { header: "Type", key: "type", accessor: item => item.duration || "N/A" },
            { header: "Revenue", key: "revenue", accessor: item => formatCurrency(item.total) },
            { header: "Sales", key: "sales", accessor: item => item.count },
          ]}
          cardRenderer={({ duration, total, count }, index) => (
            <DataListItemCard key={index} title={duration || "N/A"} metric1={{label: "Revenue", value: formatCurrency(total)}} metric2={{label: "Sales", value: count}}/>
          )}
        />
        <AnalyticsBlock
          title="Top Plans"
          icon={RupeeIcon}
          data={topPlansData}
          isSmallScreen={isSmallScreen}
          columns={[
            { header: "Plan", key: "plan", accessor: item => item.planName || "N/A" },
            { header: "Revenue", key: "revenue", accessor: item => formatCurrency(item.totalRevenue) },
            { header: "Sales", key: "sales", accessor: item => item.count },
          ]}
          cardRenderer={(item, index) => (
            <DataListItemCard key={index} title={item.planName || "N/A"} metric1={{label: "Revenue", value: formatCurrency(item.totalRevenue)}} metric2={{label: "Sales", value: item.count}}/>
          )}
        />
        <AnalyticsBlock
          title="Top Add-Ons"
          icon={RupeeIcon}
          data={topAddOnsData}
          isSmallScreen={isSmallScreen}
          columns={[
            { header: "Add-On", key: "addon", accessor: item => item.addOnName },
            { header: "Revenue", key: "revenue", accessor: item => formatCurrency(item.totalRevenue) },
            { header: "Sales", key: "sales", accessor: item => item.count },
          ]}
          cardRenderer={(item, index) => (
            <DataListItemCard key={index} title={item.addOnName} metric1={{label: "Revenue", value: formatCurrency(item.totalRevenue)}} metric2={{label: "Sales", value: item.count}}/>
          )}
        />
      </div>
    </div>
  );
};

export default React.memo(RevenueDashboard);