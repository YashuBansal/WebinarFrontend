// WebinarParticipantsTable.jsx
import React, { useMemo } from "react";
import {
  formatDateAsNumberWithTime,
  formatIsoStringAsLocalAmPm,
} from "../../../utils/extra";
import { GreenDownloadIcon } from "../../../components/SVGs";

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
      <div className="p-4 text-center text-gray-600">
        Loading participant data...
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-center text-red-600">
        Error: {error.message || "Failed to load data."}
      </div>
    );
  }

  if (!chartData || chartData.length === 0) {
    return (
      <div className="p-4 text-center text-gray-600">
        No participant data available to display.
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-4 h-full max-h-[90vh] flex flex-col">
      <h3 className="text-lg font-semibold mb-4">
        Participant Activity Summary
      </h3>

      <div className="overflow-auto max-h-[70vh] border rounded">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50 sticky top-0 z-10 whitespace-nowrap">
            <tr>
              <th></th>
              <th
                scope="col"
                className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50"
              >
                Time
              </th>
              <th
                scope="col"
                className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50"
              >
                Participants
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredData.map((dataPoint, index) => (
              <tr key={index}>
                <td className="px-4  whitespace-nowrap text-sm text-gray-900">
                  <button
                    onClick={() => {
                      onDownload(dataPoint);
                    }}
                    className="hover:bg-neutral-200  px-2 py-2 rounded-full"
                  >
                    <img
                      src={GreenDownloadIcon}
                      alt="Download"
                      className="h-4 w-4 min-h-4 min-w-4"
                    />
                  </button>
                </td>
                <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                  {formatIsoStringAsLocalAmPm(
                    new Date(dataPoint.x).toISOString()
                  )}
                </td>
                <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                  {dataPoint.y}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredData.length === 0 && (
          <div className="text-center text-gray-500 py-4">
            No data points found for the selected range.
          </div>
        )}
      </div>
    </div>
  );
};

export default WebinarParticipantsTable;
