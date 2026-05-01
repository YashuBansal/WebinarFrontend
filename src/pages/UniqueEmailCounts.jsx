import React, { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useSelector } from "react-redux";
import * as XLSX from "xlsx";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import DataTable from "../components/Table/DataTable";
import { uniqueEmailCountsColumns } from "../utils/columnData";
import { instance } from "../services/axiosInterceptor";

const TABLE_HEADER = "Unique Email Counts";

const fetchUniqueEmailCounts = async ({
  page,
  limit,
  startDate,
  endDate,
}) => {
  const params = new URLSearchParams();
  params.set("page", String(page));
  params.set("limit", String(limit));
  if (startDate) params.set("startDate", startDate);
  if (endDate) params.set("endDate", endDate);

  const { data } = await instance.get(
    `/attendees/metrics/unique-email-count-by-admin?${params.toString()}`
  );
  return data;
};

const UniqueEmailCounts = () => {
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
    queryKey: ["uniqueEmailCountsByAdmin", page, limit, appliedStartStr, appliedEndStr],
    queryFn: () =>
      fetchUniqueEmailCounts({
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
      id: row.adminId,
    }));
  }, [apiData?.data]);

  const total = apiData?.total ?? 0;
  const totalPages = apiData?.totalPages ?? 1;
  const overallUniqueEmailCount = apiData?.overallUniqueEmailCount ?? 0;

  const tableData = useMemo(
    () => ({
      columns: uniqueEmailCountsColumns,
      rows,
      totalRecords: total,
    }),
    [rows, total]
  );

  const downloadVisibleTableExcel = () => {
    const exportRows = rows.map((row) => ({
      "Admin Name": row.adminName ?? "",
      "Admin Email": row.adminEmail ?? "",
      "Unique Emails": row.uniqueEmailCount ?? 0,
    }));
    const worksheet = XLSX.utils.json_to_sheet(exportRows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Unique Email Counts");
    const filename = `unique-email-counts-${new Date().toISOString().slice(0, 10)}.xlsx`;
    XLSX.writeFile(workbook, filename);
  };

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
            <div className="flex-1 min-w-[220px] rounded-lg bg-indigo-50 border-l-4 border-indigo-500 px-4 py-3.5">
              <div className="text-xs font-semibold uppercase tracking-wide text-indigo-700">
                Overall Unique Emails
              </div>
              <div className="mt-1 text-2xl font-bold text-indigo-900 tabular-nums">
                {isLoading ? "—" : overallUniqueEmailCount.toLocaleString()}
              </div>
            </div>
          </div>
        </div>
      </div>

      {isError && (
        <div className="mb-5 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700 text-sm">
          {error?.message ?? "Failed to load unique email counts."}
        </div>
      )}

      <div className="mb-4 flex justify-end">
        <button
          type="button"
          onClick={downloadVisibleTableExcel}
          disabled={isLoading || !rows?.length}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Download Excel
        </button>
      </div>

      <DataTable
        tableHeader={TABLE_HEADER}
        tableUniqueKey="uniqueEmailCountsTable"
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

export default UniqueEmailCounts;
