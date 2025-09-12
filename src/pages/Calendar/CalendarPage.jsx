import React, { useEffect, useMemo, useState } from "react";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import "./CalendarPage.css"; // Your custom CSS for the calendar
import { useDispatch, useSelector } from "react-redux";
import { getUserAlarms } from "../../features/actions/alarm";
import { useNavigate } from "react-router-dom";
import { formatDateAsNumberWithTime } from "../../utils/extra";
import useMediaQuery from "../../hooks/useMediaQuery"; // Make sure the path is correct

// A new component for displaying a single alarm in a card format.
// You can place this here or move it to a separate file and import it.
const AlarmCard = ({ alarm, onAlarmClick }) => {
  return (
    <div
      onClick={() => onAlarmClick(alarm)}
      className="cursor-pointer rounded-lg border bg-white p-4 shadow-sm transition-shadow hover:shadow-md"
    >
      {/* Card Header: Status & Acknowledged */}
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 pb-3">
        <span
          className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${
            alarm.isActive
              ? "bg-green-100 text-green-800"
              : "bg-red-100 text-red-800"
          }`}
        >
          <span
            className={`h-2 w-2 rounded-full ${
              alarm.isActive ? "bg-green-500" : "bg-red-500"
            }`}
          />
          {alarm.isActive ? "Active" : "Inactive"}
        </span>
        <span
          className={`text-xs font-medium ${
            alarm.isAcknowledged ? "text-gray-500" : "font-bold text-blue-600"
          }`}
        >
          {alarm.isAcknowledged ? "Acknowledged" : "Unacknowledged"}
        </span>
      </div>

      {/* Card Body: Details */}
      <div className="space-y-2 text-sm">
        <p className="text-gray-800">
          <strong>Email:</strong> {alarm.email}
        </p>
        <p className="break-words text-gray-600">
          <strong>Note:</strong> {alarm.note || "No note provided"}
        </p>
        <div className="pt-2 text-xs text-gray-500">
          <p>
            <strong>Alarm Time:</strong> {formatDateAsNumberWithTime(alarm.date)}
          </p>
          <p>
            <strong>Created:</strong> {formatDateAsNumberWithTime(alarm.createdAt)}
          </p>
        </div>
      </div>
    </div>
  );
};


const CalendarPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const isSmallScreen = useMediaQuery("(max-width: 768px)");

  const [value, onChange] = useState(new Date());

  const { employeeModeData } = useSelector((state) => state.employee);
  const { userAlarms, unAckData } = useSelector((state) => state.alarm);
  const { userData } = useSelector((state) => state.auth);
  
  const [dateMapping, setDateMapping] = useState(new Map());
  const [selectedDateAlarms, setSelectedDateAlarms] = useState([]);
  const [selectedTab, setSelectedTab] = useState("active");

  useEffect(() => {
    if (Array.isArray(userAlarms)) {
      const newDateMapping = new Map();
      userAlarms.forEach((element) => {
        const dateObj = new Date(element.date);
        // Ensure date is valid before processing
        if (!isNaN(dateObj)) {
          const dateKey = dateObj.toDateString();
          if (!newDateMapping.has(dateKey)) {
            newDateMapping.set(dateKey, []);
          }
          newDateMapping.get(dateKey).push(element);
        }
      });
      setDateMapping(newDateMapping);
    }
  }, [userAlarms]);

  useEffect(() => {
    const date = new Date();
    if (userData?._id)
      dispatch(
        getUserAlarms({
          id: employeeModeData ? employeeModeData?._id : userData?._id,
          month: date.getMonth() + 1,
          year: date.getFullYear(),
        })
      );
  }, [userData, dispatch, employeeModeData]);

  const handleMonthChange = ({ activeStartDate }) => {
    const newMonth = activeStartDate.getMonth() + 1;
    const newYear = activeStartDate.getFullYear();
    dispatch(
      getUserAlarms({
        id: userData?._id,
        month: newMonth,
        year: newYear,
      })
    );
  };

  useEffect(() => {
    const selectedDateKey = value.toDateString();
    setSelectedDateAlarms(dateMapping.get(selectedDateKey) || []);
  }, [value, dateMapping]);

  const handleAlarmClick = (alarm) => {
    if (alarm.email && alarm.attendeeId)
      navigate(`/particularContact?email=${alarm.email}&attendeeId=${alarm.attendeeId}`);
  };

  const visibleAlarms = useMemo(() => {
    switch (selectedTab) {
      case "active":
        return userAlarms?.filter((alarm) => alarm.isActive) || [];
      case "inactive":
        return userAlarms?.filter((alarm) => !alarm.isActive) || [];
      case "unacknowledged":
        return Array.isArray(unAckData) ? unAckData : [];
      default:
        return [];
    }
  }, [userAlarms, unAckData, selectedTab]);

  return (
    <div className="flex flex-col items-center px-2 py-14 md:px-6">
      <div className="w-full rounded-lg bg-gray-50 px-3 py-6 md:p-6">
        <div className="mb-7 w-full">
          <h2 className="text-2xl font-bold text-gray-700">Alarm Calendar</h2>
        </div>

        <Calendar
          onChange={onChange}
          value={value}
          className="custom-calendar"
          onActiveStartDateChange={handleMonthChange}
          next2Label={null}
          prev2Label={null}
          tileClassName={({ date }) => {
            const dateKey = date.toDateString();
            const selectedDateKey = value.toDateString();
            if (dateKey === selectedDateKey) return "current-day all-cell";
            if (dateMapping.has(dateKey)) return "has-alarm all-cell";
            return "no-alarm all-cell";
          }}
        />

        <div className="mt-6 w-full">
          <h3 className="text-xl font-semibold text-gray-700">
            Alarms for {value.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </h3>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {selectedDateAlarms.length === 0 ? (
              <p className="col-span-full text-gray-600">No alarms for this date.</p>
            ) : (
              selectedDateAlarms.map((alarm) => (
                <div
                  key={alarm._id}
                  onClick={() => handleAlarmClick(alarm)}
                  className={`p-4 bg-white cursor-pointer shadow-md rounded-md border-l-4 ${
                    alarm.isActive
                      ? "border-green-500 hover:border-green-600"
                      : "border-red-500 hover:border-red-600"
                  } border border-gray-200`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div
                      className={`w-2 h-2 rounded-full ${
                        alarm.isActive ? "bg-green-500" : "bg-red-500"
                      }`}
                    />
                    <span
                      className={`text-xs font-medium ${
                        alarm.isActive ? "text-green-700" : "text-red-700"
                      }`}
                    >
                      {alarm.isActive ? "Active" : "Inactive"}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500">
                    <strong>Date:</strong>{" "}
                    {formatDateAsNumberWithTime(alarm.date)}
                  </p>
                  <p className="text-sm text-gray-500">
                    <strong>Email:</strong> {alarm.email}
                  </p>
                  <p className="text-sm text-gray-500">
                    <strong>Note:</strong> {alarm.note || "No note provided"}
                  </p>
                  <p className="text-sm text-gray-500">
                    <strong>Created At:</strong>{" "}
                    {formatDateAsNumberWithTime(alarm.createdAt)}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>

        {/* --- ALL ALARMS SECTION (REFACTORED) --- */}
        <div className="mt-8 w-full">
          <h3 className="mb-4 text-xl font-semibold text-gray-700">All Alarms</h3>
          
          <div className="mb-4 border-b border-gray-200">
            <nav className="-mb-px flex flex-wrap gap-4" aria-label="Tabs">
              <button
                onClick={() => setSelectedTab("active")}
                className={`whitespace-nowrap px-1 pb-2 text-sm font-medium ${
                  selectedTab === "active"
                    ? "border-b-2 border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
                }`}
              >
                Active
              </button>
              <button
                onClick={() => setSelectedTab("inactive")}
                className={`whitespace-nowrap px-1 pb-2 text-sm font-medium ${
                  selectedTab === "inactive"
                    ? "border-b-2 border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
                }`}
              >
                Inactive
              </button>
              <button
                onClick={() => setSelectedTab("unacknowledged")}
                className={`whitespace-nowrap px-1 pb-2 text-sm font-medium ${
                  selectedTab === "unacknowledged"
                    ? "border-b-2 border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
                }`}
              >
                Unacknowledged
              </button>
            </nav>
          </div>

          <div className="mt-4">
            {visibleAlarms?.length > 0 ? (
              isSmallScreen ? (
                <div className="space-y-4">
                  {visibleAlarms.map((alarm) => (
                    <AlarmCard
                      key={alarm._id}
                      alarm={alarm}
                      onAlarmClick={handleAlarmClick}
                    />
                  ))}
                </div>
              ) : (
                <div className="overflow-x-auto rounded-lg border bg-white shadow-sm">
                  <table className="w-full text-left">
                    <thead className="bg-gray-50 text-xs font-medium uppercase text-gray-500">
                      <tr>
                        <th className="px-6 py-3">Status</th>
                        <th className="px-6 py-3">Acknowledged</th>
                        <th className="px-6 py-3">Date</th>
                        <th className="px-6 py-3">Email</th>
                        <th className="px-6 py-3">Note</th>
                        <th className="px-6 py-3">Created At</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 text-sm">
                      {visibleAlarms.map((alarm) => (
                        <tr
                          key={alarm._id}
                          onClick={() => handleAlarmClick(alarm)}
                          className="cursor-pointer hover:bg-gray-50"
                        >
                          <td className="whitespace-nowrap px-6 py-4">
                            <div className="flex items-center gap-2">
                              <div className={`h-2 w-2 rounded-full ${alarm.isActive ? "bg-green-500" : "bg-red-500"}`}/>
                              <span>{alarm.isActive ? "Active" : "Inactive"}</span>
                            </div>
                          </td>
                          <td className="whitespace-nowrap px-6 py-4 text-gray-500">{alarm.isAcknowledged ? "Yes" : "No"}</td>
                          <td className="whitespace-nowrap px-6 py-4 text-gray-500">{formatDateAsNumberWithTime(alarm.date)}</td>
                          <td className="whitespace-nowrap px-6 py-4 text-gray-500">{alarm.email}</td>
                          <td className="max-w-xs truncate px-6 py-4 text-gray-500" title={alarm.note}>{alarm.note || "N/A"}</td>
                          <td className="whitespace-nowrap px-6 py-4 text-gray-500">{formatDateAsNumberWithTime(alarm.createdAt)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )
            ) : (
              <div className="rounded-md border border-dashed border-gray-300 bg-white p-8 text-center">
                <p className="text-gray-600">No {selectedTab} alarms found.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CalendarPage;