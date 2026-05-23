import React, { useMemo } from "react";
import { formatIsoStringAsLocalAmPm } from "../../../utils/extra";
import { Download, AlertCircle, Users, Loader2 } from "lucide-react";

const WebinarParticipantsTable = ({
  chartData,
  minMaxRange,
  loading,
  error,
  onDownload,
}) => {
  const filteredData = useMemo(() => {
    if (!chartData || chartData.length === 0) {
      return [];
    }

    if (!minMaxRange || !minMaxRange.min || !minMaxRange.max) {
      return chartData;
    }

    return chartData.filter(
      (item) => item.x >= minMaxRange.min && item.x <= minMaxRange.max
    );
  }, [chartData, minMaxRange]);

  if (loading) {
    return (
      <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl rounded-[24px] p-6 border border-slate-200/40 dark:border-slate-800/30 shadow-xl h-full min-h-[400px] flex flex-col justify-center items-center gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
        <span className="text-sm font-semibold text-slate-500">Loading summary...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl rounded-[24px] p-6 border border-slate-200/40 dark:border-slate-800/30 shadow-xl h-full min-h-[400px] flex flex-col justify-center items-center gap-3 text-red-500">
        <AlertCircle className="h-8 w-8" />
        <span className="text-sm font-semibold text-center">{error.message || "Failed to load summary."}</span>
      </div>
    );
  }

  if (!chartData || chartData.length === 0) {
    return (
      <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl rounded-[24px] p-6 border border-slate-200/40 dark:border-slate-800/30 shadow-xl h-full min-h-[400px] flex flex-col justify-center items-center gap-3 text-slate-400">
        <Users className="h-8 w-8 text-slate-300" />
        <span className="text-sm font-semibold">No activity summary available.</span>
      </div>
    );
  }

  return (
    <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl rounded-[24px] p-6 border border-slate-200/40 dark:border-slate-800/30 shadow-xl shadow-slate-100/50 dark:shadow-none h-full flex flex-col max-h-[85vh]">
      <div className="flex items-center gap-2 mb-4">
        <div className="h-6 w-6 rounded bg-violet-50 dark:bg-violet-950 flex items-center justify-center text-violet-500">
          <Users className="h-4.5 w-4.5" />
        </div>
        <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
          Timeline Activity Ticks
        </h3>
      </div>

      <div className="overflow-auto flex-1 pr-1 custom-scrollbar max-h-[60vh] rounded-2xl border border-slate-100 dark:border-slate-800">
        <table className="min-w-full divide-y divide-slate-100 dark:divide-slate-800">
          <thead className="bg-slate-50/70 dark:bg-slate-900/50 sticky top-0 z-10 whitespace-nowrap backdrop-blur-md">
            <tr>
              <th className="w-10 px-4 py-3"></th>
              <th
                scope="col"
                className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest text-slate-400"
              >
                Time
              </th>
              <th
                scope="col"
                className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest text-slate-400"
              >
                Count
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white/20 dark:bg-transparent">
            {filteredData.map((dataPoint, index) => (
              <tr 
                key={index}
                className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors group"
              >
                <td className="px-4 py-2.5 text-center whitespace-nowrap">
                  <button
                    onClick={() => onDownload(dataPoint)}
                    className="inline-flex items-center justify-center h-8 w-8 rounded-xl bg-green-50 dark:bg-green-950/30 text-green-600 dark:text-green-400 opacity-60 hover:opacity-100 hover:scale-105 hover:shadow-md hover:shadow-green-500/10 active:scale-95 transition-all"
                    title="Export participants active at this time"
                  >
                    <Download className="h-4 w-4" />
                  </button>
                </td>
                <td className="px-4 py-2.5 whitespace-nowrap text-xs font-semibold text-slate-700 dark:text-slate-300">
                  {formatIsoStringAsLocalAmPm(
                    new Date(dataPoint.x).toISOString()
                  )}
                </td>
                <td className="px-4 py-2.5 whitespace-nowrap text-xs">
                  <span className="inline-flex items-center justify-center px-2 py-1 rounded-lg bg-indigo-50/70 dark:bg-indigo-950/40 font-bold text-indigo-600 dark:text-indigo-400 min-w-8 text-center group-hover:scale-105 transition-transform">
                    {dataPoint.y}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredData.length === 0 && (
          <div className="text-center text-slate-400 py-8 text-xs font-medium">
            No data points found for this range.
          </div>
        )}
      </div>
    </div>
  );
};

export default WebinarParticipantsTable;
