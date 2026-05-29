import { Edit2, Calendar, User, Phone, MapPin, Briefcase, Clock, FileText, ShieldCheck, Bell, History, Globe, Layers, ExternalLink, Pencil, Eye } from "lucide-react";
import ComponentGuard from "../../components/AccessControl/ComponentGuard";
import { useEffect, useMemo, useRef, useState } from "react";
import useMediaQuery from "../../hooks/useMediaQuery";
import { motion } from "framer-motion";
import { formatDateAsNumber, formatDateAsNumberWithTime } from "../../utils/extra";
import { useTheme } from "../../contexts/ThemeContext";

const formatFullName = (item) => {
  const firstName = item?.firstName;
  const rawLastName = item?.lastName;
  const lastName = rawLastName?.includes(":-)") ? "" : rawLastName;
  if (firstName && lastName) return `${firstName} ${lastName}`;
  if (firstName) return firstName;
  if (lastName) return lastName;
  return "-";
};

const HistoryHeader = ({ counts, onOpenNewPage }) => (
  <div className="flex flex-col md:flex-row items-center justify-between gap-6 p-6 bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700/50">
    <div className="flex items-center gap-3">
      <div className="p-2 bg-orange-50 dark:bg-orange-900/30 rounded-xl">
        <Calendar className="w-5 h-5 text-[#FF6B35] dark:text-[#FF8C61]" />
      </div>
      <div>
        <h3 className="text-xl font-bold text-slate-800 dark:text-slate-200">Webinar Participation</h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Historical attendance and registration data</p>
      </div>
    </div>

    <div className="flex items-center gap-4">
      <div className="px-4 py-2 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col items-center min-w-[100px]">
        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Registered</span>
        <span className="text-xl font-black text-[#FF6B35]">{counts.registeredWebinarCount}</span>
      </div>
      <div className="px-4 py-2 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col items-center min-w-[100px]">
        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Attended</span>
        <span className="text-xl font-black text-emerald-600 dark:text-emerald-400">{counts.attendedWebinarCount}</span>
      </div>
      <button
        onClick={onOpenNewPage}
        className="p-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-all group"
        title="Full History"
      >
        <ExternalLink className="w-5 h-5 text-slate-400 group-hover:text-[#FF6B35]" />
      </button>
    </div>
  </div>
);

const AttendeeHistoryTable = ({
  attendeeHistoryData,
  navigate,
  email,
  employeeModeData,
  userData,
  setEditModalData,
  selectedAttendee,
}) => {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const scrollRef = useRef(null);
  const isSmallScreen = useMediaQuery("(max-width: 1024px)");
  const handleViewDetails = (item) => {
    navigate(`/particularContact/attendee-webinar-detail?email=${email}&id=${item._id}`);
  };

  const counts = useMemo(() => {
    const countsData = { registeredWebinarCount: 0, attendedWebinarCount: 0 };
    if (Array.isArray(selectedAttendee) && selectedAttendee.length > 0 && Array.isArray(selectedAttendee[0]?.data)) {
      const data = selectedAttendee[0]?.data;
      data.forEach((item) => {
        if (!item.isAttended) countsData.registeredWebinarCount += 1;
        else if (item.isAttended && item.timeInSession > 0) countsData.attendedWebinarCount += 1;
      });
    }
    return countsData;
  }, [selectedAttendee]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [attendeeHistoryData]);

  const shouldShowNoRecord = !Array.isArray(attendeeHistoryData) || attendeeHistoryData.length <= 0;

  return (
    <div className="w-full bg-white dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700/50 shadow-sm overflow-hidden">
      <HistoryHeader
        counts={counts}
        onOpenNewPage={() => navigate(`/particularContact/attendee-History?email=${email}`)}
      />

      {shouldShowNoRecord ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-400 space-y-4">
          <History className="w-16 h-16 opacity-10" />
          <p className="text-lg font-bold italic">No participation history found</p>
        </div>
      ) : (
        <div className="flex flex-col">
          <div ref={scrollRef} className={`overflow-auto custom-scrollbar ${isSmallScreen ? 'p-4' : ''}`}>
            {isSmallScreen ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {attendeeHistoryData.map((item, idx) => (
                  <HistoryCard
                    key={item._id || idx}
                    item={item}
                    index={idx}
                    totalCount={attendeeHistoryData.length}
                    onEdit={setEditModalData}
                    onView={handleViewDetails}
                    showEditButton={!employeeModeData && userData?.isActive}
                  />
                ))}
              </div>
            ) : (
              <table className="w-full text-left border-collapse min-w-[1600px]">
                <thead>
                  <tr className="bg-slate-50/50 dark:bg-slate-900/30 text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-slate-800">
                    <th className="py-4 px-6 w-16">S.No</th>
                    <th className="py-4 px-2 min-w-[120px]">Webinar Details</th>
                    <th className="py-4 px-2">Type</th>
                    <th className="py-4 px-2">Full Name</th>
                    <th className="py-4 px-2">Phone</th>
                    <th className="py-4 px-2">Gender</th>
                    <th className="py-4 px-2">Assignments</th>
                    <th className="py-4 px-2">Duration</th>
                    <th className="py-4 px-2">Location</th>
                    <th className="py-4 px-2">Profession</th>
                    <th className="py-4 px-2">Source</th>
                    <ComponentGuard conditions={[!employeeModeData, userData?.isActive]}>
                      <th className="py-4 px-2 text-center sticky right-0 bg-white dark:bg-slate-900 z-10 w-[100px]">Actions</th>
                    </ComponentGuard>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                  {attendeeHistoryData.map((item, idx) => {
                    const webinar = Array.isArray(item?.webinar) && item.webinar.length > 0 ? item.webinar[0] : null;
                    return (
                      <tr
                        key={idx}
                        onClick={() => handleViewDetails(item)}
                        className="bg-slate-50/40 dark:bg-slate-900/20 hover:bg-slate-100/50 dark:hover:bg-slate-800/80 transition-colors group cursor-pointer"
                      >
                        <td className="py-3 px-6 text-sm font-bold text-slate-400">{idx + 1}</td>
                        <td className="py-3 px-2">
                          <div className="flex flex-col">
                            <span className="text-sm font-bold text-slate-700 dark:text-slate-200">
                              {webinar?.webinarName || "-"}
                            </span>
                            <span className="text-[11px] text-[#FF6B35] font-bold">
                              {webinar ? formatDateAsNumber(webinar.webinarDate) : "-"}
                            </span>
                          </div>
                        </td>
                        <td className="py-4 px-2">
                          <span className={`px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider ${item?.isAttended ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30' : 'bg-orange-100 text-[#FF6B35] dark:bg-orange-900/30'}`}>
                            {item?.isAttended ? "Sales" : "Reminder"}
                          </span>
                        </td>
                        <td className="py-4 px-2 text-sm font-bold text-slate-700 dark:text-slate-300">
                          {formatFullName(item)}
                        </td>
                        <td className="py-4 px-2 text-sm font-bold text-slate-500 dark:text-slate-400">
                          {item?.phone || "N/A"}
                        </td>
                        <td className="py-4 px-2 text-sm font-bold text-slate-400 dark:text-slate-500 capitalize">
                          {item?.gender || "N/A"}
                        </td>
                        <td className="py-4 px-2">
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-2">
                              <span className="text-[9px] font-black text-slate-400 uppercase w-10">Sales:</span>
                              <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400">{item?.assignedToUserName || "N/A"}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-[9px] font-black text-slate-400 uppercase w-10">Rem:</span>
                              <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400">{item?.reminderAssignedTo || "N/A"}</span>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-2">
                          <div className="flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-orange-400" />
                            <span className="text-sm font-bold text-slate-600 dark:text-slate-300">{item?.timeInSession} <span className="text-[10px] font-normal text-slate-400 italic">mins</span></span>
                          </div>
                        </td>
                        <td className="py-4 px-2 text-[12px] font-bold text-slate-600 dark:text-slate-400 capitalize">
                          {item?.location || "N/A"}
                        </td>
                        <td className="py-4 px-2 text-[12px] font-bold text-slate-600 dark:text-slate-400">
                          {item?.profession || "N/A"}
                        </td>
                        <td className="py-4 px-2 text-[12px] font-bold text-slate-400">
                          {item?.source || "N/A"}
                        </td>
                        <ComponentGuard conditions={[!employeeModeData, userData?.isActive]}>
                          <td
                            className="py-4 px-2 text-center sticky right-0 bg-white dark:bg-slate-900 group-hover:bg-white dark:group-hover:bg-slate-950 transition-colors shadow-[-10px_0_15px_-5px_rgba(0,0,0,0.05)] w-[100px]"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() => handleViewDetails(item)}
                                className="p-2 bg-slate-100 dark:bg-slate-700 hover:bg-indigo-600 hover:text-white rounded-lg transition-all"
                                title="View Details"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => setEditModalData(item)}
                                className="p-2 bg-slate-100 dark:bg-slate-700 hover:bg-[#FF6B35] hover:text-white rounded-lg transition-all"
                                title="Edit Details"
                              >
                                <Pencil className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </ComponentGuard>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export const StatRow = ({ icon: Icon, label, value, color }) => (
  <div className="flex justify-between items-center py-2 border-b border-slate-50 dark:border-slate-800 last:border-0">
    <div className="flex items-center gap-2">
      <Icon className={`w-3.5 h-3.5 ${color || 'text-slate-300'}`} />
      <dt className="text-[11px] font-black text-slate-400 uppercase tracking-wider">{label}</dt>
    </div>
    <dd className="text-xs font-bold text-slate-700 dark:text-slate-200 text-right capitalize">{value}</dd>
  </div>
);

const HistoryCard = ({ item, index, totalCount, onEdit, onView, showEditButton }) => {
  const webinar = Array.isArray(item?.webinar) && item.webinar.length > 0 ? item.webinar[0] : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      onClick={() => onView(item)}
      className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all group cursor-pointer"
    >
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-orange-100 dark:bg-[#FF6B35]/20 rounded-xl flex items-center justify-center text-xs font-black text-[#FF6B35]">
            {index + 1}
          </div>
          <div>
            <h4 className="font-bold text-slate-800 dark:text-slate-200 leading-tight line-clamp-1">{webinar?.webinarName || "-"}</h4>
            <span className="text-[10px] font-black text-[#FF6B35] uppercase tracking-widest">{webinar ? formatDateAsNumber(webinar.webinarDate) : "-"}</span>
          </div>
        </div>
        <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => onView(item)}
            className="p-2 bg-slate-50 dark:bg-slate-700 hover:bg-indigo-600 hover:text-white rounded-xl transition-all"
            title="View Details"
          >
            <Eye className="w-4 h-4" />
          </button>
          {showEditButton && (
            <button
              onClick={() => onEdit(item)}
              className="p-2 bg-slate-50 dark:bg-slate-700 hover:bg-[#FF6B35] hover:text-white rounded-xl transition-all"
              title="Edit Details"
            >
              <Pencil className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      <dl className="space-y-1 pt-2 border-t border-slate-50 dark:border-slate-800">
        <StatRow icon={User} label="Name" value={formatFullName(item)} />
        <StatRow icon={Phone} label="Phone" value={item?.phone || "N/A"} />
        <StatRow icon={ShieldCheck} label="Sales" value={item?.assignedToUserName || "N/A"} color="text-emerald-400" />
        <StatRow icon={Bell} label="Reminder" value={item?.reminderAssignedTo || "N/A"} color="text-blue-400" />
        <StatRow icon={Clock} label="Duration" value={`${item?.timeInSession || "0"} mins`} color="text-orange-400" />
        <StatRow icon={Layers} label="Type" value={item?.isAttended ? "Sales" : "Reminder"} color="text-purple-400" />
        <StatRow icon={MapPin} label="Location" value={item?.location || "N/A"} color="text-rose-400" />
        <StatRow icon={Briefcase} label="Profession" value={item?.profession || "N/A"} color="text-amber-400" />
        <StatRow icon={Globe} label="Source" value={item?.source || "N/A"} color="text-indigo-400" />
      </dl>
    </motion.div>
  );
};

export default AttendeeHistoryTable;