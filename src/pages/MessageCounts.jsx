import React, { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useSelector } from "react-redux";
import DataTable from "../components/Table/DataTable";
import { messageCountsColumns } from "../utils/columnData";
import { instance } from "../services/axiosInterceptor";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

const TABLE_HEADER = "Message Counts";

const fetchMessageCounts = async ({ page, limit, startDate, endDate }) => {
  const params = new URLSearchParams();
  params.set("page", String(page));
  params.set("limit", String(limit));
  if (startDate) params.set("startDate", startDate);
  if (endDate) params.set("endDate", endDate);
  const { data } = await instance.get(`/waba-message/counts?${params.toString()}`);
  return data;
};

const MessageCounts = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [page, setPage] = useState(Number(searchParams.get("page")) || 1);
  const limit = useSelector((state) => state.pageLimits[TABLE_HEADER] || 20);
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [appliedStartDate, setAppliedStartDate] = useState(null);
  const [appliedEndDate, setAppliedEndDate] = useState(null);

  const appliedStartStr = appliedStartDate
    ? appliedStartDate.toISOString().split("T")[0]
    : null;
  const appliedEndStr = appliedEndDate
    ? appliedEndDate.toISOString().split("T")[0]
    : null;

  const {
    data: apiData,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["wabaMessageCounts", page, limit, appliedStartStr, appliedEndStr],
    queryFn: () =>
      fetchMessageCounts({
        page,
        limit,
        startDate: appliedStartStr,
        endDate: appliedEndStr,
      }),
  });

  const handleApplyDates = () => {
    setAppliedStartDate(startDate);
    setAppliedEndDate(endDate);
    setPage(1);
  };

  const rows = useMemo(() => {
    const list = apiData?.data ?? [];
    return list.map((row) => ({
      ...row,
      id: `${row.adminId}-${row.projectId}`,
    }));
  }, [apiData?.data]);

  const total = apiData?.total ?? 0;
  const totalPages = apiData?.totalPages ?? 1;
  const totalReceived = apiData?.totalReceived ?? 0;
  const totalSent = apiData?.totalSent ?? 0;

  const tableData = useMemo(
    () => ({
      columns: messageCountsColumns,
      rows,
      totalRecords: total,
    }),
    [rows, total]
  );

  React.useEffect(() => {
    const currentInUrl = searchParams.get("page");
    if (String(page) !== (currentInUrl || "")) {
      setSearchParams({ page: String(page) }, { replace: true });
    }
  }, [page, searchParams, setSearchParams]);

  return (
    <div className="w-full pt-14 sm:px-5 pb-8">
      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm mb-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700 whitespace-nowrap">
                Start Date
              </label>
              <DatePicker
                className="border border-gray-300 rounded-lg px-3 py-2 min-w-[150px] text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                selected={startDate}
                onChange={(date) => setStartDate(date)}
                placeholderText="All time"
                dateFormat="dd-MM-yyyy"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700 whitespace-nowrap">
                End Date
              </label>
              <DatePicker
                className="border border-gray-300 rounded-lg px-3 py-2 min-w-[150px] text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                selected={endDate}
                onChange={(date) => setEndDate(date)}
                placeholderText="All time"
                dateFormat="dd-MM-yyyy"
              />
            </div>
            <button
              type="button"
              onClick={handleApplyDates}
              className="px-5 py-2.5 bg-indigo-600 text-white text-sm font-semibold rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors shrink-0"
            >
              Apply
            </button>
          </div>
          <div className="flex gap-4 flex-wrap">
            <div className="flex-1 min-w-[160px] rounded-lg bg-emerald-50 border-l-4 border-emerald-500 px-4 py-3.5">
              <div className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
                Total Received
              </div>
              <div className="mt-1 text-2xl font-bold text-emerald-900 tabular-nums">
                {isLoading ? "—" : totalReceived.toLocaleString()}
              </div>
            </div>
            <div className="flex-1 min-w-[160px] rounded-lg bg-blue-50 border-l-4 border-blue-500 px-4 py-3.5">
              <div className="text-xs font-semibold uppercase tracking-wide text-blue-700">
                Total Sent
              </div>
              <div className="mt-1 text-2xl font-bold text-blue-900 tabular-nums">
                {isLoading ? "—" : totalSent.toLocaleString()}
              </div>
            </div>
          </div>
        </div>
      </div>

      {isError && (
        <div className="mb-5 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700 text-sm">
          {error?.message ?? "Failed to load message counts."}
        </div>
      )}

      <DataTable
        tableHeader={TABLE_HEADER}
        tableUniqueKey="messageCountsTable"
        tableData={tableData}
        totalPages={totalPages}
        page={page}
        setPage={setPage}
        limit={limit}
        isLoading={isLoading}
        filterModalName=""
        exportModalName=""
        actions={[]}
      />
    </div>
  );
};

export default MessageCounts;
