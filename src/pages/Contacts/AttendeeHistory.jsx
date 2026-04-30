import { useEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import useAddUserActivity from "../../hooks/useAddUserActivity";
import EditModal from "./Modal/EditModal";
import { getAttendee, updateAttendee } from "../../features/actions/attendees";
import ComponentGuard from "../../components/AccessControl/ComponentGuard";
import { formatDateAsNumber } from "../../utils/extra";
import { useNavigate } from "react-router-dom";
import useMediaQuery from "../../hooks/useMediaQuery";
import { StatRow } from "./AttendeeHistoryTable";
import { useTheme } from "../../contexts/ThemeContext";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Calendar,
  Clock,
  User,
  Phone,
  MapPin,
  Briefcase,
  Globe,
  ShieldCheck,
  Bell,
  Layers,
  History,
  Pencil,
  TrendingUp,
  CheckCircle2,
  BookOpen,
} from "lucide-react";

const formatFullName = (item) => {
  const firstName = item?.firstName;
  const rawLastName = item?.lastName;
  const lastName = rawLastName?.includes(":-)") ? "" : rawLastName;
  if (firstName && lastName) return `${firstName} ${lastName}`;
  if (firstName) return firstName;
  if (lastName) return lastName;
  return "-";
};

// ─── Stat Badge ────────────────────────────────────────────────────────────────
const StatBadge = ({ label, value, accent, icon: Icon }) => (
  <div
    className="flex flex-col items-center justify-center px-5 py-3 rounded-2xl border min-w-[110px]"
    style={{
      background: accent + "18",
      borderColor: accent + "33",
    }}
  >
    <div className="flex items-center gap-1.5 mb-0.5">
      {Icon && <Icon className="w-3.5 h-3.5" style={{ color: accent }} />}
      <span
        className="text-[10px] font-black uppercase tracking-widest"
        style={{ color: accent }}
      >
        {label}
      </span>
    </div>
    <span className="text-2xl font-black" style={{ color: accent }}>
      {value}
    </span>
  </div>
);

// ─── Header ─────────────────────────────────────────────────────────────────────
const HistoryHeader = ({ counts, isDark }) => {
  const navigate = useNavigate();
  return (
    <div
      className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 sm:p-6 border-b"
      style={{ borderColor: isDark ? "#1e293b" : "#f1f5f9" }}
    >
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate(-1)}
          className="p-2.5 rounded-xl border transition-all hover:scale-105 active:scale-95"
          style={{
            background: isDark ? "#1e293b" : "#f8fafc",
            borderColor: isDark ? "#334155" : "#e2e8f0",
            color: isDark ? "#94a3b8" : "#64748b",
          }}
          title="Go Back"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="flex items-center gap-3">
          <div
            className="p-2.5 rounded-xl"
            style={{ background: "rgba(255,107,53,0.12)" }}
          >
            <History className="w-5 h-5" style={{ color: "#FF6B35" }} />
          </div>
          <div>
            <h1
              className="text-lg font-black"
              style={{ color: isDark ? "#f1f5f9" : "#0f172a" }}
            >
              Attendee History
            </h1>
            <p
              className="text-[11px] font-medium"
              style={{ color: isDark ? "#64748b" : "#94a3b8" }}
            >
              Full participation &amp; registration timeline
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 self-end sm:self-auto">
        <StatBadge
          label="Registered"
          value={counts.registeredWebinarCount}
          accent="#FF6B35"
          icon={BookOpen}
        />
        <StatBadge
          label="Attended"
          value={counts.attendedWebinarCount}
          accent="#22c55e"
          icon={CheckCircle2}
        />
      </div>
    </div>
  );
};

// ─── Desktop Table Row ──────────────────────────────────────────────────────────
const TableRow = ({ item, idx, total, onEdit, showEditButton, isDark }) => {
  const webinar =
    Array.isArray(item?.webinar) && item.webinar.length > 0
      ? item.webinar[0]
      : null;

  return (
    <motion.tr
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: idx * 0.03, duration: 0.25 }}
      className="group transition-colors"
      style={{
        background: isDark
          ? idx % 2 === 0
            ? "rgba(15,23,42,0.4)"
            : "rgba(30,41,59,0.3)"
          : idx % 2 === 0
          ? "#ffffff"
          : "#f8fafc",
        borderBottom: `1px solid ${isDark ? "#1e293b" : "#f1f5f9"}`,
      }}
    >
      {/* S.No */}
      <td className="py-3 px-5 w-14">
        <span
          className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black"
          style={{
            background: "rgba(255,107,53,0.12)",
            color: "#FF6B35",
          }}
        >
          {idx + 1}
        </span>
      </td>

      {/* Webinar */}
      <td className="py-3 px-3 min-w-[180px]">
        <p
          className="text-sm font-bold leading-tight"
          style={{ color: isDark ? "#e2e8f0" : "#1e293b" }}
        >
          {webinar?.webinarName || "-"}
        </p>
        <p className="text-[11px] font-bold mt-0.5" style={{ color: "#FF6B35" }}>
          {webinar ? formatDateAsNumber(webinar.webinarDate) : "-"}
        </p>
      </td>

      {/* Type */}
      <td className="py-3 px-3">
        <span
          className="px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider"
          style={
            item?.isAttended
              ? {
                  background: "rgba(34,197,94,0.12)",
                  color: "#16a34a",
                }
              : {
                  background: "rgba(255,107,53,0.12)",
                  color: "#FF6B35",
                }
          }
        >
          {item?.isAttended ? "Sales" : "Reminder"}
        </span>
      </td>

      {/* Full Name */}
      <td
        className="py-3 px-3 text-sm font-bold"
        style={{ color: isDark ? "#cbd5e1" : "#334155" }}
      >
        {formatFullName(item)}
      </td>

      {/* Phone */}
      <td
        className="py-3 px-3 text-sm font-bold"
        style={{ color: isDark ? "#94a3b8" : "#64748b" }}
      >
        {item?.phone || "N/A"}
      </td>

      {/* Gender */}
      <td
        className="py-3 px-3 text-sm font-bold capitalize"
        style={{ color: isDark ? "#94a3b8" : "#64748b" }}
      >
        {item?.gender || "N/A"}
      </td>

      {/* Assignments */}
      <td className="py-3 px-3">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-1.5">
            <span
              className="text-[9px] font-black uppercase w-10"
              style={{ color: isDark ? "#475569" : "#94a3b8" }}
            >
              Sales:
            </span>
            <span
              className="text-[11px] font-bold"
              style={{ color: isDark ? "#94a3b8" : "#475569" }}
            >
              {item?.assignedToUserName || "N/A"}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span
              className="text-[9px] font-black uppercase w-10"
              style={{ color: isDark ? "#475569" : "#94a3b8" }}
            >
              Rem:
            </span>
            <span
              className="text-[11px] font-bold"
              style={{ color: isDark ? "#94a3b8" : "#475569" }}
            >
              {item?.reminderAssignedTo || "N/A"}
            </span>
          </div>
        </div>
      </td>

      {/* Duration */}
      <td className="py-3 px-3">
        <div className="flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-orange-400" />
          <span
            className="text-sm font-bold"
            style={{ color: isDark ? "#cbd5e1" : "#334155" }}
          >
            {item?.timeInSession}{" "}
            <span
              className="text-[10px] font-normal"
              style={{ color: isDark ? "#64748b" : "#94a3b8" }}
            >
              mins
            </span>
          </span>
        </div>
      </td>

      {/* Location */}
      <td
        className="py-3 px-3 text-[12px] font-bold capitalize"
        style={{ color: isDark ? "#94a3b8" : "#64748b" }}
      >
        {item?.location || "N/A"}
      </td>

      {/* Profession */}
      <td
        className="py-3 px-3 text-[12px] font-bold"
        style={{ color: isDark ? "#94a3b8" : "#64748b" }}
      >
        {item?.profession || "N/A"}
      </td>

      {/* Source */}
      <td
        className="py-3 px-3 text-[12px] font-bold"
        style={{ color: isDark ? "#64748b" : "#94a3b8" }}
      >
        {item?.source || "N/A"}
      </td>

      {/* Actions */}
      <ComponentGuard conditions={[showEditButton]}>
        <td
          className="py-3 px-3 text-center sticky right-0 transition-colors"
          style={{
            background: isDark ? "#0f172a" : "#ffffff",
            boxShadow: "-8px 0 16px -4px rgba(0,0,0,0.06)",
          }}
        >
          <button
            onClick={() => onEdit(item)}
            className="p-2 rounded-lg transition-all hover:scale-110 active:scale-95"
            style={{
              background: isDark ? "#1e293b" : "#f1f5f9",
              color: isDark ? "#94a3b8" : "#64748b",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "#FF6B35";
              e.currentTarget.style.color = "#ffffff";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = isDark ? "#1e293b" : "#f1f5f9";
              e.currentTarget.style.color = isDark ? "#94a3b8" : "#64748b";
            }}
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
        </td>
      </ComponentGuard>
    </motion.tr>
  );
};

// ─── Mobile Card ────────────────────────────────────────────────────────────────
const MobileCard = ({ item, idx, total, onEdit, showEditButton, isDark }) => {
  const webinar =
    Array.isArray(item?.webinar) && item.webinar.length > 0
      ? item.webinar[0]
      : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: idx * 0.04, duration: 0.28 }}
      className="rounded-2xl border overflow-hidden"
      style={{
        background: isDark ? "rgba(30,41,59,0.7)" : "#ffffff",
        borderColor: isDark ? "#1e293b" : "#e2e8f0",
        boxShadow: isDark ? "none" : "0 2px 12px rgba(0,0,0,0.06)",
      }}
    >
      {/* Card Header */}
      <div
        className="flex items-start justify-between gap-3 p-4 border-b"
        style={{ borderColor: isDark ? "#1e293b" : "#f1f5f9" }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-black flex-shrink-0"
            style={{ background: "rgba(255,107,53,0.12)", color: "#FF6B35" }}
          >
            {total - idx}
          </div>
          <div>
            <p
              className="font-bold text-sm leading-tight line-clamp-1"
              style={{ color: isDark ? "#e2e8f0" : "#1e293b" }}
            >
              {webinar?.webinarName || "-"}
            </p>
            <p
              className="text-[11px] font-bold mt-0.5"
              style={{ color: "#FF6B35" }}
            >
              {webinar ? formatDateAsNumber(webinar.webinarDate) : "-"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span
            className="px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider"
            style={
              item?.isAttended
                ? { background: "rgba(34,197,94,0.12)", color: "#16a34a" }
                : { background: "rgba(255,107,53,0.12)", color: "#FF6B35" }
            }
          >
            {item?.isAttended ? "Sales" : "Reminder"}
          </span>
          {showEditButton && (
            <button
              onClick={() => onEdit(item)}
              className="p-2 rounded-xl transition-all hover:scale-110"
              style={{
                background: isDark ? "#1e293b" : "#f1f5f9",
                color: isDark ? "#94a3b8" : "#64748b",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "#FF6B35";
                e.currentTarget.style.color = "#ffffff";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = isDark ? "#1e293b" : "#f1f5f9";
                e.currentTarget.style.color = isDark ? "#94a3b8" : "#64748b";
              }}
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Card Body */}
      <dl className="p-4 space-y-1">
        <StatRow icon={User} label="Name" value={formatFullName(item)} />
        <StatRow icon={Phone} label="Phone" value={item?.phone || "N/A"} />
        <StatRow
          icon={ShieldCheck}
          label="Sales"
          value={item?.assignedToUserName || "N/A"}
          color="text-emerald-400"
        />
        <StatRow
          icon={Bell}
          label="Reminder"
          value={item?.reminderAssignedTo || "N/A"}
          color="text-blue-400"
        />
        <StatRow
          icon={Clock}
          label="Duration"
          value={`${item?.timeInSession || "0"} mins`}
          color="text-orange-400"
        />
        <StatRow
          icon={MapPin}
          label="Location"
          value={item?.location || "N/A"}
          color="text-rose-400"
        />
        <StatRow
          icon={Briefcase}
          label="Profession"
          value={item?.profession || "N/A"}
          color="text-amber-400"
        />
        <StatRow
          icon={Globe}
          label="Source"
          value={item?.source || "N/A"}
          color="text-indigo-400"
        />
      </dl>
    </motion.div>
  );
};

// ─── Main Page ──────────────────────────────────────────────────────────────────
const AttendeeHistory = () => {
  const addUserActivityLog = useAddUserActivity();
  const dispatch = useDispatch();
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const searchParams = new URLSearchParams(location.search);
  const email = searchParams.get("email") || "";
  const [isDataVisible, setIsDataVisible] = useState(false);
  const [editModalData, setEditModalData] = useState(null);
  const scrollContainerRef = useRef(null);

  const { selectedAttendee } = useSelector((state) => state.attendee);
  const { userData } = useSelector((state) => state.auth);
  const { employeeModeData } = useSelector((state) => state.employee);
  const { globalLocationsData } = useSelector((state) => state.location);
  const [locationsMap, setLocationsMap] = useState(new Map());
  const isSmallScreen = useMediaQuery("(max-width: 1024px)");

  useEffect(() => {
    if (Array.isArray(globalLocationsData)) {
      const tempMap = new Map();
      globalLocationsData.forEach((loc) => {
        if (loc?.name) tempMap.set(loc.name.trim().toLowerCase(), loc.state);
      });
      setLocationsMap(tempMap);
    }
  }, [globalLocationsData]);

  useEffect(() => {
    setIsDataVisible(false);
    if (
      Array.isArray(selectedAttendee) &&
      selectedAttendee.length > 0 &&
      Array.isArray(selectedAttendee[0]?.data) &&
      selectedAttendee[0].data.length > 0
    ) {
      setIsDataVisible(true);
    }
  }, [selectedAttendee]);

  const onConfirmEdit = (data) => {
    dispatch(updateAttendee(data)).then(() => {
      setEditModalData(null);
      addUserActivityLog({
        action: "update",
        details: `User updated information of Attendee with Email: ${email}`,
      });
      setIsDataVisible(false);
      dispatch(getAttendee({ email }));
    });
  };

  useEffect(() => {
    setIsDataVisible(false);
    dispatch(getAttendee({ email }));
    // Layout uses an inner div as scroll container — target it directly
    const el = document.querySelector(".custom-scrollbar.absolute");
    if (el) {
      el.scrollTop = 0;
    } else {
      window.scrollTo({ top: 0, behavior: "instant" });
    }
  }, [email]);

  const tableData = useMemo(() => {
    if (
      Array.isArray(selectedAttendee) &&
      selectedAttendee.length > 0 &&
      Array.isArray(selectedAttendee[0]?.data) &&
      selectedAttendee[0].data.length > 0
    ) {
      return [...selectedAttendee[0].data];
    }
    return [];
  }, [selectedAttendee]);

  const counts = useMemo(() => {
    const countsData = { registeredWebinarCount: 0, attendedWebinarCount: 0 };
    if (
      Array.isArray(selectedAttendee) &&
      selectedAttendee.length > 0 &&
      Array.isArray(selectedAttendee[0]?.data)
    ) {
      selectedAttendee[0].data.forEach((item) => {
        if (!item.isAttended) countsData.registeredWebinarCount += 1;
        else if (item.isAttended && item.timeInSession > 0)
          countsData.attendedWebinarCount += 1;
      });
    }
    return countsData;
  }, [selectedAttendee]);

  const showEditButton = !employeeModeData && userData?.isActive;

  return (
    <div
      style={{ background: isDark ? "#0f172a" : "#f8fafc" }}
    >
      <div className="px-4 sm:px-6 lg:px-10 py-4 max-w-screen-2xl mx-auto">

        {/* Page Card */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="rounded-2xl border overflow-hidden"
          style={{
            background: isDark
              ? "rgba(15,23,42,0.8)"
              : "rgba(255,255,255,0.85)",
            borderColor: isDark ? "#1e293b" : "#e2e8f0",
            backdropFilter: "blur(20px)",
            boxShadow: isDark
              ? "0 0 0 1px rgba(255,255,255,0.03)"
              : "0 8px 32px rgba(0,0,0,0.06)",
          }}
        >
          <HistoryHeader counts={counts} isDark={isDark} />

          {/* Content */}
          <AnimatePresence mode="wait">
            {!isDataVisible ? (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center py-24 gap-4"
              >
                <div
                  className="p-5 rounded-2xl"
                  style={{ background: "rgba(255,107,53,0.08)" }}
                >
                  <History
                    className="w-12 h-12"
                    style={{ color: "#FF6B3530" }}
                  />
                </div>
                <p
                  className="text-base font-bold italic"
                  style={{ color: isDark ? "#334155" : "#cbd5e1" }}
                >
                  No participation history found
                </p>
              </motion.div>
            ) : isSmallScreen ? (
              /* Mobile Grid */
              <motion.div
                key="mobile"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4"
              >
                {tableData.map((item, idx) => (
                  <MobileCard
                    key={item._id || idx}
                    item={item}
                    idx={idx}
                    total={tableData.length}
                    onEdit={setEditModalData}
                    showEditButton={showEditButton}
                    isDark={isDark}
                  />
                ))}
              </motion.div>
            ) : (
              /* Desktop Table */
              <motion.div
                key="desktop"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="overflow-x-auto custom-scrollbar"
              >
                <table className="w-full text-left border-collapse min-w-[1600px]">
                  <thead>
                    <tr
                      className="text-[10px] font-black uppercase tracking-widest"
                      style={{
                        background: isDark
                          ? "rgba(15,23,42,0.95)"
                          : "#F9FAFB",
                        color: isDark ? "#475569" : "#94a3b8",
                        borderBottom: `1px solid ${isDark ? "#1e293b" : "#f1f5f9"}`,
                      }}
                    >
                      <th className="py-4 px-5 w-14">S.No</th>
                      <th className="py-4 px-3 min-w-[180px]">Webinar</th>
                      <th className="py-4 px-3">Type</th>
                      <th className="py-4 px-3">Full Name</th>
                      <th className="py-4 px-3">Phone</th>
                      <th className="py-4 px-3">Gender</th>
                      <th className="py-4 px-3">Assignments</th>
                      <th className="py-4 px-3">Duration</th>
                      <th className="py-4 px-3">Location</th>
                      <th className="py-4 px-3">Profession</th>
                      <th className="py-4 px-3">Source</th>
                      <ComponentGuard conditions={[showEditButton]}>
                        <th
                          className="py-4 px-3 text-center sticky right-0 w-16"
                          style={{
                            background: isDark ? "#0f172a" : "#F9FAFB",
                          }}
                        >
                          Actions
                        </th>
                      </ComponentGuard>
                    </tr>
                  </thead>
                  <tbody>
                    {tableData.map((item, idx) => (
                      <TableRow
                        key={item._id || idx}
                        item={item}
                        idx={idx}
                        total={tableData.length}
                        onEdit={setEditModalData}
                        showEditButton={showEditButton}
                        isDark={isDark}
                      />
                    ))}
                  </tbody>
                </table>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>

      {/* Edit Modal */}
      {editModalData && (
        <EditModal
          setModal={setEditModalData}
          initialData={editModalData}
          onConfirmEdit={onConfirmEdit}
          locationsMap={locationsMap}
          locations={globalLocationsData}
          userData={userData}
        />
      )}
    </div>
  );
};

export default AttendeeHistory;
