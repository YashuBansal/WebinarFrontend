// src/components/AlarmPopup.js
import React, { useEffect, useMemo } from "react";
import { useSelector } from "react-redux";
import { getUnAckAlarmData } from "../features/slices/alarm";
import { useNavigate } from "react-router-dom";
import { formatDateAsNumberWithTime } from "../utils/extra";

const FIVE_MINUTES_IN_MS = 5 * 60 * 1000; // Corrected to 5 minutes

const AlarmPopup = ({
  isPopupVisible,
  setPopupVisible,
  closeBanner,
  bannerData,
}) => {
  const navigate = useNavigate();

  // 1. Get the unacknowledged alarm data from the Redux store for reminders
  const unAcknowledgedData = useSelector(getUnAckAlarmData);

  // 2. Derive reminder-specific state from Redux state.
  //    useMemo will re-calculate these values only when unAcknowledgedData changes.
  const { alarmCount, lastAlarm } = useMemo(() => {
    const count = unAcknowledgedData?.length || 0;
    const last = count > 0 ? unAcknowledgedData[count - 1] : null;
    return { alarmCount: count, lastAlarm: last };
  }, [unAcknowledgedData]);

  // 3. The core logic for showing a reminder popup after a delay
  useEffect(() => {
    let timerId = null;
    // If there are unacknowledged alarms and no new alarm is currently being shown,
    // start a 5-minute timer to show a reminder popup.
    if (alarmCount > 0 && !bannerData) {
      
      timerId = setInterval(() => {
        setPopupVisible(true);
      }, FIVE_MINUTES_IN_MS);
    } else if (alarmCount === 0) {
      // If all alarms are acknowledged, ensure any existing popup is hidden.
      closeBanner();
    }

    // Cleanup function to clear the timer when the component unmounts
    // or when alarmCount/bannerData changes.
    return () => {
      if (timerId) {
        clearTimeout(timerId);
      }
    };
    // This effect runs when the number of alarms changes or if a new banner is shown/hidden
  }, [alarmCount, bannerData]);

  const isNewAlarm = !!bannerData;
  const displayData = isNewAlarm ? bannerData : lastAlarm;

  // --- Event Handlers ---
  const handleIgnore = () => {
    closeBanner();
  };

  const handleNavigate = () => {
    if (!displayData) return;
    navigate(
      `/particularContact?email=${displayData?.email}&attendeeId=${displayData?.attendeeId}`
    );
    closeBanner();
  };

  // Do not render anything if the popup is not visible or if there's no data to show.
  if (!isPopupVisible || !displayData) {
    return null;
  }

  // 4. The JSX for the dynamically styled popup
  return (
    // Backdrop
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="alarm-popup-title"
      style={{ zIndex: 100000000 }}
      className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm"
    >
      {/* Popup Modal */}
      <div className="relative w-full max-w-md p-6 m-4 bg-white rounded-lg shadow-2xl dark:bg-gray-800">
        {/* Header */}
        <div className="flex items-center gap-4 mb-4">
          <div
            className={`flex-shrink-0 p-3 rounded-full ${
              isNewAlarm
                ? "bg-red-100 dark:bg-red-900/50"
                : "bg-yellow-100 dark:bg-yellow-900/50"
            }`}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className={`w-6 h-6 ${
                isNewAlarm
                  ? "text-red-600 dark:text-red-400"
                  : "text-yellow-600 dark:text-yellow-400"
              }`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
              />
            </svg>
          </div>
          <div>
            <h2
              id="alarm-popup-title"
              className="text-xl font-bold text-gray-800 dark:text-gray-100"
            >
              {isNewAlarm
                ? "New Alarm Triggered"
                : "Unacknowledged Alarm Reminder"}
            </h2>
            {/* Conditionally display the total count only for reminders */}
            {!isNewAlarm && alarmCount > 1 && (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                You have {alarmCount} unacknowledged alarms in total.
              </p>
            )}
          </div>
        </div>

        {/* Body (Details of the displayed alarm) */}
        <div
          className={`p-4 mb-6 border-l-4 ${
            isNewAlarm ? "border-red-500" : "border-yellow-500"
          } bg-gray-50 dark:bg-gray-700/50`}
        >
          <h3 className="mb-2 font-semibold text-gray-900 dark:text-white">
            {displayData?.message}
          </h3>
          <div className="space-y-1 text-sm text-gray-600 dark:text-gray-300">
            <p>
              <strong>E-Mail:</strong>
              <span className="ml-2 font-mono">{displayData?.email}</span>
            </p>
            <p>
              <strong>Note:</strong>
              <span className="ml-2">{displayData?.note}</span>
            </p>
             <p>
              <strong>Alarm Date:</strong>
              <span className="ml-2">{formatDateAsNumberWithTime(displayData.date)}</span>
            </p>
            <p>
              <strong>Created At:</strong>
              <span className="ml-2">{formatDateAsNumberWithTime(displayData.createdAt)}</span>
            </p>
          </div>
        </div>

        {/* Footer with Action Buttons */}
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            onClick={handleIgnore}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:bg-gray-600 dark:text-gray-200 dark:border-gray-500 dark:hover:bg-gray-500"
          >
            {isNewAlarm ? "Dismiss" : "Ignore"}
          </button>
          <button
            onClick={handleNavigate}
            className={`px-4 py-2 text-sm font-medium text-white border border-transparent rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 ${
              isNewAlarm
                ? "bg-red-600 hover:bg-red-700 focus:ring-red-500"
                : "bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-500"
            }`}
          >
            View Details
          </button>
        </div>
      </div>
    </div>
  );
};

export default AlarmPopup;
