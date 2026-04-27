import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import Select from "react-select";

import { getAttendeeLogs } from "../../../features/actions/attendees";
import { Pagination } from "@mui/material";
import PageLimitEditor from "../../../components/PageLimitEditor"; // Assuming this component exists
import {
  AttendeeAction,
  formatDateAsNumberWithTime,
} from "../../../utils/extra"; // Assuming this provides the action options

// Import react-datepicker components and styles
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import useMediaQuery from "../../../hooks/useMediaQuery";

const LogsModal = ({ setModal, email, logUserActivity }) => {
  const tableHeader = "Attendee Logs";
  const dispatch = useDispatch();

  const { attendeeLogs, isLogsLoading, attendeeLogsPagination } = useSelector(
    (state) => state.attendee
  );

  const isSmallScreen = useMediaQuery("(max-width: 768px)");
  const allActionsOption = "All Actions"; // This will be used as value and label

  // Prepare options for react-select, including "All Actions"
  const attendeeActionOptions = [
    { label: allActionsOption, value: allActionsOption },
    ...Object.values(AttendeeAction).map((item) => ({
      label: item,
      value: item,
    })),
  ];

  const { totalPages = 1 } = attendeeLogsPagination || {};
  const LIMIT = useSelector((state) => state.pageLimits[tableHeader] || 10);

  // State for pagination
  const [page, setPage] = useState(1);

  // Applied filters (used for fetching data)
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [selectedAction, setSelectedAction] = useState(allActionsOption);

  // Temporary filters (for user input before applying)
  const [tempStartDate, setTempStartDate] = useState(null);
  const [tempEndDate, setTempEndDate] = useState(null);
  const [tempSelectedAction, setTempSelectedAction] =
    useState(allActionsOption);

  const getStartOfDayISO = (date) => {
    if (!date || !(date instanceof Date)) return null;
    const newDate = new Date(date);
    newDate.setHours(0, 0, 0, 0);
    return newDate.toISOString();
  };

  const getEndOfDayISO = (date) => {
    if (!date || !(date instanceof Date)) return null;
    const newDate = new Date(date);
    newDate.setHours(23, 59, 59, 999);
    return newDate.toISOString();
  };

  // Effect to fetch logs whenever pagination or APPLIED filter parameters change
  useEffect(() => {
    if (email) {
      const filters = {
        email,
        page,
        limit: LIMIT,
        startDate: getStartOfDayISO(startDate),
        endDate: getEndOfDayISO(endDate),
        action: selectedAction === allActionsOption ? null : selectedAction,
      };
      dispatch(getAttendeeLogs(filters));
    }
  }, [
    dispatch,
    email,
    page,
    LIMIT,
    startDate,
    endDate,
    selectedAction,
    allActionsOption,
  ]);

  const handlePageChange = (event, value) => {
    setPage(value);
    logUserActivity({
      action: "Page changed",
      details: `User changed page for ${tableHeader} to ${value}`,
    });
  };

  const handleTempStartDateChange = (date) => {
    setTempStartDate(date);
    // If new start date is after current temp end date, user should adjust end date or it will be corrected on apply
  };

  const handleTempEndDateChange = (date) => {
    // DatePicker's minDate prop handles UI restriction.
    // Further validation/correction happens on apply.
    setTempEndDate(date);
  };

  const handleTempActionChange = (selectedOption) => {
    if (selectedOption && selectedOption.value) {
      setTempSelectedAction(selectedOption.value);
    } else {
      // This case should ideally not be hit if isClearable is false
      // and an option is always selected.
      setTempSelectedAction(allActionsOption);
    }
  };

  const handleApplyFilters = () => {
    let finalAppliedStartDate = tempStartDate;
    let finalAppliedEndDate = tempEndDate;

    // Ensure end date is not before start date if both are set
    if (
      finalAppliedStartDate &&
      finalAppliedEndDate &&
      finalAppliedEndDate < finalAppliedStartDate
    ) {
      // Auto-correct: set end date to be the same as start date
      finalAppliedEndDate = finalAppliedStartDate;
    }

    setStartDate(finalAppliedStartDate);
    setEndDate(finalAppliedEndDate);
    setSelectedAction(tempSelectedAction);
    setPage(1); // Reset to page 1 when filters are applied

    const logDetails = `User applied filters for ${tableHeader}. StartDate: ${
      finalAppliedStartDate
        ? finalAppliedStartDate.toISOString().split("T")[0]
        : "None"
    }, EndDate: ${
      finalAppliedEndDate
        ? finalAppliedEndDate.toISOString().split("T")[0]
        : "None"
    }, Action: ${tempSelectedAction}`;

    logUserActivity({
      action: "Applied filters",
      details: logDetails,
    });
  };

  const handleClearFilters = () => {
    // Clear temporary states
    setTempStartDate(null);
    setTempEndDate(null);
    setTempSelectedAction(allActionsOption);

    // Apply cleared states (which triggers useEffect)
    setStartDate(null);
    setEndDate(null);
    setSelectedAction(allActionsOption);
    setPage(1);

    logUserActivity({
      action: "Cleared filters",
      details: `User cleared filters for ${tableHeader}`,
    });
  };

  const hasLogs =
    attendeeLogs && Array.isArray(attendeeLogs) && attendeeLogs.length > 0;

  return (
    <div className="fixed z-50 inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg w-full max-w-4xl p-6 h-[90vh] overflow-y-auto min-h-0">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-semibold">{tableHeader}</h2>
          <button
            onClick={() => setModal(false)}
            className="text-gray-500 hover:text-gray-700 text-2xl"
            aria-label="Close Modal"
          >
            ×
          </button>
        </div>

        {/* Filters Area */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 items-end">
          {/* Date Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date Range
            </label>
            <div className="flex gap-2">
              <DatePicker
                selected={tempStartDate}
                onChange={handleTempStartDateChange}
                selectsStart
                startDate={tempStartDate}
                endDate={tempEndDate}
                placeholderText="Start Date"
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 h-[38px]"
                dateFormat="yyyy-MM-dd"
                isClearable
              />
              <DatePicker
                selected={tempEndDate}
                onChange={handleTempEndDateChange}
                selectsEnd
                startDate={tempStartDate}
                endDate={tempEndDate}
                minDate={tempStartDate} // Prevent selecting end date before start date
                placeholderText="End Date"
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 h-[38px]"
                dateFormat="yyyy-MM-dd"
                isClearable
              />
            </div>
          </div>

          {/* Action Filter */}
          <div>
            <label
              htmlFor="action-filter-select"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Action Type
            </label>
            <Select
              id="action-filter-select"
              value={
                attendeeActionOptions.find(
                  (item) => item.value === tempSelectedAction
                ) // Should always find a value
              }
              onChange={handleTempActionChange}
              options={attendeeActionOptions}
              isClearable={false}
              isSearchable={true}
              placeholder="Select Action"
              className="react-select-container block w-full rounded-md shadow-sm sm:text-sm"
              classNamePrefix="react-select"
              styles={{
                control: (base, state) => ({
                  ...base,
                  borderColor: state.isFocused ? "#3b82f6" : "#d1d5db",
                  boxShadow: state.isFocused
                    ? "0 0 0 1px #3b82f6"
                    : base.boxShadow,
                  "&:hover": {
                    borderColor: state.isFocused ? "#3b82f6" : "#d1d5db",
                  },
                  minHeight: "38px",
                  height: "38px",
                }),
                valueContainer: (base) => ({
                  ...base,
                  padding: "0px 8px", // Adjust padding to vertically center if needed
                  height: "38px",
                  alignItems: "center",
                }),
                input: (base) => ({ ...base, margin: "0", padding: "0" }),
                indicatorSeparator: () => ({ display: "none" }),
                dropdownIndicator: (base, state) => ({
                  ...base,
                  color: state.isFocused ? "#3b82f6" : base.color,
                }),
              }}
            />
          </div>

          {/* Filter Buttons */}
          <div className="flex flex-col sm:flex-row sm:items-end gap-2 pt-3 sm:pt-0 md:pt-[22px]">
            {" "}
            {/* md:pt to align with inputs that have labels */}
            <button
              onClick={handleApplyFilters}
              className="w-full sm:w-auto inline-flex justify-center items-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 h-[38px]"
            >
              Apply Filters
            </button>
            <button
              onClick={handleClearFilters}
              className="w-full sm:w-auto inline-flex justify-center items-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 h-[38px]"
            >
              Clear Filters
            </button>
          </div>
        </div>

        {/* Modal Body - Loading or Logs */}
        {hasLogs ? (
          <>
            <div className="flex-grow overflow-y-auto h-96 md:h-[26rem]">
              {isSmallScreen ? (
                // --- CARD VIEW for Small Screens ---
                <div className="space-y-4 p-4 ">
                  {attendeeLogs.map((log) => (
                    <LogCard key={log._id} log={log} />
                  ))}
                </div>
              ) : (
                // --- TABLE VIEW for Larger Screens (Your Original Code) ---
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="sticky top-0 z-10 bg-gray-50">
                      <tr>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
                        >
                          Action
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
                        >
                          Details
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
                        >
                          Date/Time
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 bg-white">
                      {attendeeLogs.map((log) => (
                        <tr key={log._id}>
                          <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">
                            {log.action}
                          </td>
                          <td
                            className="whitespace-pre-wrap px-6 py-4 text-sm text-gray-500"
                            dangerouslySetInnerHTML={{
                              __html: log.details || "-",
                            }}
                          />
                          <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                            {formatDateAsNumberWithTime(log.createdAt)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
            <div className="flex gap-4 md:flex-row flex-col flex-wrap items-center justify-between py-4 mt-auto flex-shrink-0">
              <Pagination
                onChange={handlePageChange}
                count={totalPages}
                page={Number(page)}
                variant="outlined"
                shape="rounded"
                disabled={isLogsLoading}
              />
              <PageLimitEditor pageId={tableHeader} setPage={setPage} />
            </div>
          </>
        ) : (
          <div className="text-center text-gray-500 py-8 flex-grow flex items-center justify-center">
            No logs found for this attendee with the current filters.
          </div>
        )}
      </div>
    </div>
  );
};

export default LogsModal;

const LogCard = ({ log }) => {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
      {/* Card Header: Action and Timestamp */}
      <div className="mb-3 flex items-start justify-between gap-4 border-b border-gray-100 pb-3">
        <span className="inline-block rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-800">
          {log.action}
        </span>
        <span className="flex-shrink-0 text-right text-xs text-gray-500">
          {formatDateAsNumberWithTime(log.createdAt)}
        </span>
      </div>

      {/* Card Body: Details */}
      {/* Using `prose` ensures the HTML from the DB is styled nicely */}
      <div
        className="prose prose-sm max-w-none text-gray-700"
        dangerouslySetInnerHTML={{ __html: log.details || "<p>-</p>" }}
      />
    </div>
  );
};
