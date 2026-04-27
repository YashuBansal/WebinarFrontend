import { useCallback, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  Bell,
  Calendar as CalendarIcon,
  Clock,
  Mail,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Search,
  X,
} from "lucide-react";

import { useTheme } from "../../contexts/ThemeContext";
import { Calendar } from "../../components/ui/calendar";
import { Button } from "../../components/ui/button";
import {
  getUserAlarms,
  getUnAcknowledgedAlarms,
  cancelAlarm,
} from "../../features/actions/alarm";
import { formatDateAsNumberWithTime, successToast, errorToast } from "../../utils/extra";

/** Allowed until scheduled time; once that moment has passed, alarm cannot be removed from the calendar. */
function canCancelScheduledAlarm(alarm) {
  const raw = alarm?.raw ?? alarm;
  const d = raw?.date ? new Date(raw.date) : null;
  if (!d || Number.isNaN(d.getTime())) return false;
  return Date.now() < d.getTime();
}

function mapAlarmForUi(alarm) {
  const d = alarm?.date ? new Date(alarm.date) : null;
  const valid = d && !Number.isNaN(d.getTime());
  return {
    id: alarm._id,
    raw: alarm,
    email: alarm.email || "",
    note: alarm.note || "",
    dateObj: valid ? d : null,
    timeStr: valid
      ? d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      : "—",
    dateKey: valid ? d.toDateString() : "",
    isActive: Boolean(alarm.isActive),
    isAcknowledged: Boolean(alarm.isAcknowledged),
    attendeeId: alarm.attendeeId,
    createdAt: alarm.createdAt,
  };
}

function getStatusBadge(status, acknowledged) {
  if (!acknowledged && status === "Active") {
    return {
      bg: "rgba(245, 158, 11, 0.15)",
      text: "#f59e0b",
      border: "rgba(245, 158, 11, 0.3)",
      icon: <AlertCircle className="w-3.5 h-3.5" />,
      label: "Unacknowledged",
    };
  }
  if (status === "Active") {
    return {
      bg: "rgba(34, 181, 115, 0.15)",
      text: "#22B573",
      border: "rgba(34, 181, 115, 0.3)",
      icon: <CheckCircle2 className="w-3.5 h-3.5" />,
      label: "Active",
    };
  }
  return {
    bg: "rgba(100, 116, 139, 0.15)",
    text: "#64748b",
    border: "rgba(100, 116, 139, 0.3)",
    icon: <XCircle className="w-3.5 h-3.5" />,
    label: "Inactive",
  };
}

const CalendarPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const { employeeModeData } = useSelector((state) => state.employee);
  const { userAlarms, unAckData, isLoading } = useSelector((state) => state.alarm);
  const { userData } = useSelector((state) => state.auth);

  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const [calendarMonth, setCalendarMonth] = useState(() => new Date());
  const [activeTab, setActiveTab] = useState("Active");
  const [searchQuery, setSearchQuery] = useState("");
  const [dateMapping, setDateMapping] = useState(() => new Map());

  const [detailAlarm, setDetailAlarm] = useState(null);

  const alarmUserId = useMemo(
    () => (employeeModeData?._id ? employeeModeData._id : userData?._id),
    [employeeModeData, userData]
  );

  const refetchAlarms = useCallback(() => {
    if (!alarmUserId) return;
    const m = calendarMonth.getMonth() + 1;
    const y = calendarMonth.getFullYear();
    dispatch(getUserAlarms({ id: alarmUserId, month: m, year: y }));
    dispatch(getUnAcknowledgedAlarms({ id: alarmUserId }));
  }, [dispatch, alarmUserId, calendarMonth]);

  useEffect(() => {
    if (!alarmUserId) return;
    const m = calendarMonth.getMonth() + 1;
    const y = calendarMonth.getFullYear();
    dispatch(getUserAlarms({ id: alarmUserId, month: m, year: y }));
  }, [dispatch, alarmUserId, calendarMonth]);

  useEffect(() => {
    if (!Array.isArray(userAlarms)) return;
    const next = new Map();
    userAlarms.forEach((el) => {
      const d = new Date(el.date);
      if (!Number.isNaN(d.getTime())) {
        const key = d.toDateString();
        if (!next.has(key)) next.set(key, []);
        next.get(key).push(el);
      }
    });
    setDateMapping(next);
  }, [userAlarms]);

  const mappedAlarms = useMemo(
    () => (Array.isArray(userAlarms) ? userAlarms.map(mapAlarmForUi) : []),
    [userAlarms]
  );

  const selectedKey = selectedDate?.toDateString?.() ?? "";
  const alarmsForSelectedDate = useMemo(() => {
    const list = dateMapping.get(selectedKey) || [];
    return list.map(mapAlarmForUi);
  }, [dateMapping, selectedKey]);

  const unackList = useMemo(
    () => (Array.isArray(unAckData) ? unAckData.map(mapAlarmForUi) : []),
    [unAckData]
  );

  const tableRows = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const bySearch = (a) => {
      const blob = `${a.email} ${a.note}`.toLowerCase();
      return !q || blob.includes(q);
    };
    if (activeTab === "Unacknowledged") {
      return unackList.filter(bySearch);
    }
    return mappedAlarms.filter((a) => {
      if (!bySearch(a)) return false;
      if (activeTab === "Active") return a.isActive;
      return !a.isActive;
    });
  }, [mappedAlarms, unackList, activeTab, searchQuery]);

  const panelBg = isDark ? "#1e293b" : "#ffffff";
  const panelBorder = isDark ? "#334155" : "#e5e7eb";
  const textColor = isDark ? "#f8fafc" : "#0f172a";
  const mutedText = isDark ? "#94a3b8" : "#64748b";

  const formatDisplayDate = (date) => {
    if (!date) return "No date selected";
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

  const openContact = (alarm) => {
    const r = alarm.raw || alarm;
    if (r.email && r.attendeeId) {
      navigate(
        `/particularContact?email=${encodeURIComponent(r.email)}&attendeeId=${r.attendeeId}`
      );
      setDetailAlarm(null);
    } else {
      successToast("Link this alarm to an attendee to open the contact view.");
    }
  };

  const handleAcknowledge = (alarm) => {
    openContact(alarm);
  };

  const handleDeleteAlarm = async (alarm) => {
    if (!canCancelScheduledAlarm(alarm)) {
      errorToast("This alarm’s time has passed; it can’t be removed.");
      return;
    }
    const r = alarm.raw || alarm;
    dispatch(
      cancelAlarm({
        id: r._id,
        date: r.date,
        createdBy: userData?.userName,
      })
    ).then((res) => {
      if (res.meta?.requestStatus === "fulfilled") {
        refetchAlarms();
        setDetailAlarm(null);
      }
    });
  };

  const shellBorder = isDark ? "#334155" : "#e2e8f0";

  const portalTarget = typeof document !== "undefined" ? document.body : null;

  const detailModal =
    portalTarget &&
    createPortal(
      <AnimatePresence>
        {detailAlarm && (
        <motion.div
          key={detailAlarm.id}
          className="fixed inset-0 z-[200] flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setDetailAlarm(null)}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", duration: 0.4, bounce: 0 }}
            className="relative w-full max-w-md rounded-2xl shadow-2xl z-10 overflow-hidden"
            style={{
              backgroundColor: isDark ? "#1e293b" : "#ffffff",
              border: `1px solid ${shellBorder}`,
            }}
            onMouseDown={(ev) => ev.stopPropagation()}
          >
            <div
              className="flex items-center justify-between p-4 border-b"
              style={{ borderColor: shellBorder }}
            >
              <h3 className="text-lg font-bold" style={{ color: textColor }}>
                Alarm details
              </h3>
              <button
                type="button"
                aria-label="Close"
                onClick={() => setDetailAlarm(null)}
                className="rounded-lg p-2 hover:bg-black/5 dark:hover:bg-white/10"
                style={{ color: mutedText }}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 space-y-3 text-sm" style={{ color: mutedText }}>
              <p>
                <span className="font-semibold" style={{ color: textColor }}>
                  When:{" "}
                </span>
                {formatDateAsNumberWithTime(detailAlarm.raw?.date)}
              </p>
              <p>
                <span className="font-semibold" style={{ color: textColor }}>
                  Email:{" "}
                </span>
                {detailAlarm.email || "—"}
              </p>
              <p>
                <span className="font-semibold" style={{ color: textColor }}>
                  Note:{" "}
                </span>
                {detailAlarm.note || "—"}
              </p>
              <p>
                <span className="font-semibold" style={{ color: textColor }}>
                  Status:{" "}
                </span>
                {detailAlarm.isActive ? "Active" : "Inactive"} ·{" "}
                {detailAlarm.isAcknowledged
                  ? "Acknowledged"
                  : "Unacknowledged"}
              </p>
            </div>
            <div
              className="p-4 border-t flex flex-wrap gap-2"
              style={{ borderColor: shellBorder }}
            >
              <Button
                type="button"
                variant="outline"
                className="rounded-xl flex-1 min-w-[120px]"
                onClick={() => {
                  openContact(detailAlarm);
                  setDetailAlarm(null);
                }}
              >
                View contact
              </Button>
              {!detailAlarm.isAcknowledged && (
                <Button
                  type="button"
                  className="rounded-xl flex-1 min-w-[120px] font-semibold"
                  style={{
                    backgroundColor: "#22B573",
                    color: "#fff",
                    border: "none",
                  }}
                  onClick={() => handleAcknowledge(detailAlarm)}
                >
                  Acknowledge
                </Button>
              )}
              {canCancelScheduledAlarm(detailAlarm) ? (
                <Button
                  type="button"
                  variant="outline"
                  className="rounded-xl text-red-600 border-red-200 hover:bg-red-50 dark:hover:bg-red-500/10"
                  onClick={() => handleDeleteAlarm(detailAlarm)}
                >
                  Cancel alarm
                </Button>
              ) : (
                <p
                  className="w-full text-xs py-2 px-1"
                  style={{ color: mutedText }}
                >
                  After the scheduled time, alarms can’t be removed here.
                </p>
              )}
            </div>
          </motion.div>
        </motion.div>
        )}
      </AnimatePresence>,
      portalTarget
    );

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto space-y-6 transition-all duration-300">
      <motion.div
        className="mb-2"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
      >
        <h2
          className="text-2xl font-bold tracking-tight flex items-center gap-3"
          style={{ color: textColor }}
        >
          Alarm Calendar
        </h2>
        <p className="text-sm mt-1" style={{ color: mutedText }}>
          Manage and track all scheduled attendee follow-ups.
        </p>
      </motion.div>

      <motion.div
        className="grid grid-cols-1 xl:grid-cols-3 gap-6"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          delay: 0.08,
          duration: 0.35,
          ease: [0.22, 1, 0.36, 1],
        }}
      >
        <div
          className="xl:col-span-1 rounded-2xl shadow-sm border overflow-hidden flex flex-col"
          style={{ backgroundColor: panelBg, borderColor: panelBorder }}
        >
          <div
            className="p-4 border-b font-bold flex items-center gap-2"
            style={{ borderColor: panelBorder, color: textColor }}
          >
            <CalendarIcon className="w-5 h-5 text-blue-500" /> Date selector
          </div>
          <div className="p-4 flex-1 flex justify-center">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(d) => d && setSelectedDate(d)}
              month={calendarMonth}
              onMonthChange={(m) => setCalendarMonth(m)}
              className="rounded-xl mx-auto w-fit"
              modifiers={{
                hasAlarm: (d) => dateMapping.has(d.toDateString()),
              }}
              modifiersClassNames={{
                hasAlarm:
                  "rdp-day_has_alarm font-semibold text-[#FF6B35] relative",
              }}
            />
          </div>
        </div>

        <div
          className="xl:col-span-2 rounded-2xl shadow-sm border flex flex-col"
          style={{ backgroundColor: panelBg, borderColor: panelBorder }}
        >
          <div
            className="p-4 border-b font-bold flex items-center justify-between"
            style={{ borderColor: panelBorder, color: textColor }}
          >
            <div className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-[#FF6B35]" />
              Alarms for {formatDisplayDate(selectedDate)}
            </div>
            <div
              className="text-xs font-semibold px-2.5 py-1 rounded-lg"
              style={{
                backgroundColor:
                  theme === "dark" ? "rgba(59, 130, 246, 0.2)" : "#eff6ff",
                color: theme === "dark" ? "#60a5fa" : "#2563eb",
              }}
            >
              Count: {alarmsForSelectedDate.length}
            </div>
          </div>

          <div className="flex-1 p-5 overflow-y-auto max-h-[400px]">
            {alarmsForSelectedDate.length === 0 ? (
              <div
                className="flex flex-col justify-center items-center text-center h-[200px]"
                style={{ color: mutedText }}
              >
                <CheckCircle2 className="w-12 h-12 mb-3 opacity-20" />
                <p className="font-medium">No alarms for this date.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {alarmsForSelectedDate.map((alarm, idx) => (
                  <motion.div
                    key={alarm.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      delay: idx * 0.05,
                      duration: 0.35,
                      ease: [0.22, 1, 0.36, 1],
                    }}
                    role="button"
                    tabIndex={0}
                    onClick={() => setDetailAlarm(alarm)}
                    onKeyDown={(e) =>
                      e.key === "Enter" && setDetailAlarm(alarm)
                    }
                    className="p-4 rounded-xl border flex flex-col sm:flex-row justify-between gap-4 transition-all hover:shadow-md cursor-pointer"
                    style={{
                      backgroundColor: isDark ? "#0f172a" : "#f8fafc",
                      borderColor: panelBorder,
                    }}
                  >
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-blue-500" />
                        <span className="font-bold" style={{ color: textColor }}>
                          {alarm.timeStr}
                        </span>
                      </div>
                      <div
                        className="flex flex-col gap-0.5 text-sm"
                        style={{ color: mutedText }}
                      >
                        <div className="flex items-center gap-2 font-semibold min-w-0" style={{ color: textColor }}>
                          <Mail className="w-3.5 h-3.5 shrink-0 opacity-70" />
                          <span className="truncate">{alarm.email || "—"}</span>
                        </div>
                      </div>
                    </div>
                    <div
                      className="flex-1 sm:px-4 sm:border-l"
                      style={{ borderColor: panelBorder }}
                    >
                      <div
                        className="text-xs font-bold uppercase tracking-wider mb-1"
                        style={{ color: mutedText }}
                      >
                        Note
                      </div>
                      <p
                        className="text-sm font-medium line-clamp-3"
                        style={{ color: textColor }}
                      >
                        {alarm.note || "—"}
                      </p>
                    </div>
                    <div className="flex items-center justify-end gap-2">
                      {!alarm.isAcknowledged && (
                        <Button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAcknowledge(alarm);
                          }}
                          className="font-semibold px-4 py-2 rounded-xl text-xs h-9"
                          style={{
                            backgroundColor: "#22B573",
                            color: "#fff",
                          }}
                        >
                          Acknowledge
                        </Button>
                      )}
                      {canCancelScheduledAlarm(alarm) ? (
                        <Button
                          type="button"
                          variant="ghost"
                          className="h-9 w-9 p-0 rounded-xl hover:bg-red-50 dark:hover:bg-red-500/10"
                          title="Remove alarm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteAlarm(alarm);
                          }}
                        >
                          <XCircle className="w-4 h-4 text-red-500" />
                        </Button>
                      ) : (
                        <span
                          className="text-[10px] font-semibold uppercase tracking-wide max-w-[100px] text-right leading-tight"
                          style={{ color: mutedText }}
                          title="Scheduled time has passed"
                        >
                          Locked
                        </span>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>
      </motion.div>

      <motion.div
        className="rounded-2xl shadow-sm border flex flex-col overflow-hidden"
        style={{ backgroundColor: panelBg, borderColor: panelBorder }}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          delay: 0.08,
          duration: 0.35,
          ease: [0.22, 1, 0.36, 1],
        }}
      >
        <div
          className="p-4 border-b flex flex-col sm:flex-row items-center justify-between gap-4"
          style={{ borderColor: panelBorder }}
        >
          <div className="flex gap-2 bg-gray-100 dark:bg-slate-800/50 p-1 rounded-xl w-full sm:w-auto overflow-x-auto">
            {["Active", "Inactive", "Unacknowledged"].map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className="px-4 py-2 rounded-lg text-sm font-semibold transition-all whitespace-nowrap"
                style={{
                  backgroundColor:
                    activeTab === tab
                      ? theme === "dark"
                        ? "#3b82f6"
                        : "#ffffff"
                      : "transparent",
                  color:
                    activeTab === tab
                      ? theme === "dark"
                        ? "#ffffff"
                        : "#3b82f6"
                      : mutedText,
                  boxShadow:
                    activeTab === tab && theme === "light"
                      ? "0 2px 4px rgba(0,0,0,0.05)"
                      : "none",
                }}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search email or notes…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2 w-full rounded-xl text-sm focus:outline-none focus:ring-2 transition-all"
              style={{
                backgroundColor: isDark ? "#0f172a" : "#ffffff",
                border: `1px solid ${panelBorder}`,
                color: textColor,
              }}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[900px]">
            <thead>
              <tr
                style={{
                  backgroundColor: isDark ? "rgba(15,23,42,0.95)" : "#F9FAFB",
                }}
              >
                {["Status", "Acknowledged", "Date & time", "Attendee", "Note", "Created"].map(
                  (h) => (
                    <th
                      key={h}
                      className="p-4 font-semibold text-xs uppercase tracking-wider whitespace-nowrap"
                      style={{ color: mutedText }}
                    >
                      {h}
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody>
              {isLoading && tableRows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center" style={{ color: mutedText }}>
                    Loading…
                  </td>
                </tr>
              ) : tableRows.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="p-8 text-center opacity-60"
                    style={{ color: mutedText }}
                  >
                    No {activeTab.toLowerCase()} alarms found.
                  </td>
                </tr>
              ) : (
                tableRows.map((alarm, index) => {
                  const status = alarm.isActive ? "Active" : "Inactive";
                  const badge = getStatusBadge(status, alarm.isAcknowledged);
                  return (
                    <motion.tr
                      key={alarm.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{
                        delay: index * 0.03,
                        duration: 0.35,
                        ease: [0.22, 1, 0.36, 1],
                      }}
                      className="border-b transition-colors hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer"
                      style={{ borderColor: panelBorder }}
                      onClick={() => setDetailAlarm(alarm)}
                    >
                      <td className="p-4 whitespace-nowrap">
                        <span
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border"
                          style={{
                            backgroundColor: badge.bg,
                            color: badge.text,
                            borderColor: badge.border,
                          }}
                        >
                          {badge.icon} {badge.label}
                        </span>
                      </td>
                      <td
                        className="p-4 whitespace-nowrap font-medium"
                        style={{ color: textColor }}
                      >
                        {alarm.isAcknowledged ? "Yes" : "No"}
                      </td>
                      <td
                        className="p-4 whitespace-nowrap text-sm font-bold"
                        style={{ color: textColor }}
                      >
                        {formatDateAsNumberWithTime(alarm.raw?.date)}
                      </td>
                      <td className="p-4 whitespace-nowrap">
                        <div className="flex flex-col">
                          <span
                            className="text-sm font-bold"
                            style={{ color: textColor }}
                          >
                            {alarm.email || "—"}
                          </span>
                        </div>
                      </td>
                      <td className="p-4 text-sm max-w-xs truncate" style={{ color: mutedText }}>
                        {alarm.note || "—"}
                      </td>
                      <td
                        className="p-4 whitespace-nowrap text-sm"
                        style={{ color: mutedText }}
                      >
                        {formatDateAsNumberWithTime(alarm.raw?.createdAt)}
                      </td>
                    </motion.tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div
          className="p-4 border-t flex items-center justify-between"
          style={{
            borderColor: panelBorder,
            backgroundColor: isDark ? "rgba(15,23,42,0.4)" : "#F9FAFB",
          }}
        >
          <div className="text-sm" style={{ color: mutedText }}>
            Showing {tableRows.length} entries
          </div>
        </div>
      </motion.div>

      {detailModal}
    </div>
  );
};

export default CalendarPage;
