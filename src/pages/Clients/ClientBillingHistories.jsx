import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getAdminBillingHistory } from "../../features/actions/pricePlan";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import useMediaQuery from "../../hooks/useMediaQuery"; // Assuming you have this hook

// Import UI components
import { Pagination, Skeleton } from "@mui/material";
import PageLimitEditor from "../../components/PageLimitEditor";
import { formatDate } from "../../utils/extra";
import { exportClientBillings } from "../../features/actions/export-excel";

// --- Helper Components & Functions ---

const TableSkeleton = ({ rows = 10, columns = 6 }) => (
  <div className="p-4 space-y-2">
    {[...Array(rows)].map((_, i) => (
      <div
        key={i}
        className="grid gap-4"
        style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}
      >
        {[...Array(columns)].map((_, j) => (
          <Skeleton key={j} variant="text" height={40} />
        ))}
      </div>
    ))}
  </div>
);

const StatRow = ({ label, value, valueClassName = "text-gray-800" }) => (
  <div className="flex justify-between py-2">
    <dt className="text-sm text-gray-500">{label}</dt>
    <dd className={`text-sm font-medium text-right truncate ${valueClassName}`}>
      {value}
    </dd>
  </div>
);

const formatBillingType = (type) => {
  if (!type) return "N/A";
  return type
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

const BillingHistoryCard = ({ item }) => (
  <div className="rounded-lg border bg-white p-4 shadow-sm">
    <div className="flex flex-col gap-2 border-b pb-3 mb-3">
      <div >
        <div className="flex justify-between items-start gap-4" >
          <p className="font-semibold text-gray-900">
            {item.admin?.userName || "N/A"}
          </p>
          <p className="text-lg font-bold text-gray-900">
          ₹{(item.amount || 0).toFixed(2)}
        </p>
        </div>
          <p className="text-xs text-gray-500">{item.admin?.email || "N/A"}</p>
        
      </div>
      <p className="text-xs text-gray-500">Invoice: {item.invoiceNumber}</p>
    </div>
    <dl className="divide-y divide-gray-100">
      <StatRow label="Plan" value={item.plan.name} />
      <StatRow
        label="Duration"
        value={`${formatDate(item?.startDate || item.createdAt)} - ${formatDate(
          item?.expiryDate
        )}`}
      />
      <StatRow
        label="Billing Type"
        value={formatBillingType(item.billingType)}
      />
      <StatRow
        label="Duration Type"
        value={item.durationType}
        valueClassName="capitalize"
      />
      <div className="pt-2">
        <StatRow
          label="Item Amount"
          value={`₹${(item.itemAmount || 0).toFixed(2)}`}
        />
        <StatRow
          label="Discount"
          value={`- ₹${(item.discountAmount || 0).toFixed(2)}`}
          valueClassName="text-green-600"
        />
        <StatRow
          label="Tax"
          value={`+ ₹${(item.taxAmount || 0).toFixed(2)} (${item.taxPercent}%)`}
          valueClassName="text-red-600"
        />
      </div>
    </dl>
  </div>
);

const ClientBillingHistories = () => {
  const tableHeader = "Client Billing Histories";
  const dispatch = useDispatch();
  const isSmallScreen = useMediaQuery("(max-width: 1280px)"); // Use a wider breakpoint for this complex table

  const [page, setPage] = useState(1);
  const LIMIT = useSelector((state) => state.pageLimits[tableHeader] || 10);
  const { isExportLoading } = useSelector((state) => state.export);
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const { billingHistory, totalPages, isLoading, error } = useSelector(
    (state) => state.pricePlans
  );

  useEffect(() => {
    dispatch(
      getAdminBillingHistory({ page, limit: LIMIT, startDate, endDate })
    );
  }, [dispatch, LIMIT, page, startDate, endDate]);

  useEffect(() => {
    setPage(1);
  }, [LIMIT, startDate, endDate]);

  const handleExport = () => {
    dispatch(exportClientBillings({ startDate, endDate }));
  };

  const renderContent = () => {
    if (isLoading && !billingHistory?.length) {
      return <TableSkeleton rows={LIMIT} columns={isSmallScreen ? 1 : 6} />;
    }
    if (error) {
      return (
        <div className="py-10 text-center text-red-500">
          Error: {error.message || "Failed to fetch data."}
        </div>
      );
    }
    if (!billingHistory || billingHistory.length === 0) {
      return (
        <div className="py-10 text-center text-gray-500">
          No billing history found for the selected criteria.
        </div>
      );
    }

    // --- Responsive Content Rendering ---
    if (isSmallScreen) {
      return (
        <div className="space-y-4">
          {billingHistory.map((item) => (
            <BillingHistoryCard key={item._id} item={item} />
          ))}
        </div>
      );
    }

    return (
      <div className="overflow-x-auto border border-gray-200 rounded-lg">
        <table className="min-w-full bg-white whitespace-nowrap">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Invoice #
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Client
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Email
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Creation Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Start Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Expiry Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Billing Type
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Duration
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Plan
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Item Amt.
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Discount
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Tax %
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Tax Amt.
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Total Amt.
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {billingHistory.map((item) => (
              <tr key={item._id} className="hover:bg-gray-50">
                <td className="px-6 py-4 text-sm font-medium text-gray-900">
                  {item.invoiceNumber}
                </td>
                <td className="px-6 py-4 text-sm text-gray-700">
                  {item.admin?.userName || "N/A"}
                </td>
                <td className="px-6 py-4 text-sm text-gray-700">
                  {item.admin?.email || "N/A"}
                </td>
                <td className="px-6 py-4 text-sm text-gray-700">
                  {formatDate(item.createdAt)}
                </td>
                <td className="px-6 py-4 text-sm text-gray-700">
                  {formatDate(item?.startDate || item.createdAt)}
                </td>
                <td className="px-6 py-4 text-sm text-gray-700">
                  {formatDate(item?.expiryDate)}
                </td>
                <td className="px-6 py-4 text-sm text-gray-700 capitalize">
                  {formatBillingType(item.billingType)}
                </td>
                <td className="px-6 py-4 text-sm text-gray-700 capitalize">
                  {item.durationType}
                </td>
                <td className="px-6 py-4 text-sm text-gray-700">
                  {item.plan.name}
                </td>
                <td className="px-6 py-4 text-sm text-gray-700">
                  ₹{(item.itemAmount || 0).toFixed(2)}
                </td>
                <td className="px-6 py-4 text-sm text-gray-700">
                  ₹{(item.discountAmount || 0).toFixed(2)}
                </td>
                <td className="px-6 py-4 text-sm text-gray-700">
                  {item.taxPercent}
                </td>
                <td className="px-6 py-4 text-sm text-gray-700">
                  ₹{(item.taxAmount || 0).toFixed(2)}
                </td>
                <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                  ₹{(item.amount || 0).toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="p-4 md:p-6 bg-gray-50 min-h-screen mt-8">
      <div className="bg-white p-4 sm:p-6 rounded-lg shadow-md">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">{tableHeader}</h1>
        <div className="flex flex-col md:flex-row gap-4 items-center mb-6">
          <div className="flex-grow flex flex-col sm:flex-row gap-4">
            <DatePicker
              selected={startDate}
              onChange={(date) => setStartDate(date)}
              selectsStart
              startDate={startDate}
              endDate={endDate}
              placeholderText="Start Date"
              className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
              isClearable
            />
            <DatePicker
              selected={endDate}
              onChange={(date) => setEndDate(date)}
              selectsEnd
              startDate={startDate}
              endDate={endDate}
              minDate={startDate}
              placeholderText="End Date"
              className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
              isClearable
            />
          </div>
          <button
            onClick={handleExport}
            disabled={isExportLoading}
            className="w-full md:w-auto px-4 py-2 bg-green-600 text-white font-semibold rounded-md hover:bg-green-700 disabled:opacity-50 transition"
          >
            {isExportLoading ? "Exporting..." : "Export to Excel"}
          </button>
        </div>

        {renderContent()}

        {!isLoading && billingHistory?.length > 0 && (
          <div className="flex gap-4 md:flex-row flex-col flex-wrap items-center justify-between pt-4">
            <Pagination
              onChange={(e, newPage) => setPage(newPage)}
              count={totalPages || 1}
              page={page || 1}
              variant="outlined"
              shape="rounded"
              disabled={isLoading || totalPages <= 1}
            />
            <PageLimitEditor setPage={setPage} pageId={tableHeader} />
          </div>
        )}
      </div>
    </div>
  );
};

export default ClientBillingHistories;
