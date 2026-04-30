// src/components/AlarmBanner.jsx
import { useEffect, useMemo } from "react";
import { useSelector } from "react-redux";
import { getUnAckAlarmData } from "../features/slices/alarm";
import { useNavigate } from "react-router-dom";
import { formatDateAsNumberWithTime } from "../utils/extra";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, X, Volume2, VolumeX, Clock, User, MessageSquare, ExternalLink } from "lucide-react";

const FIVE_MINUTES_IN_MS = 5 * 60 * 1000;

const AlarmBanner = ({
  isPopupVisible,
  setPopupVisible,
  closeBanner,
  bannerData,
}) => {
  const navigate = useNavigate();

  // 1. Get the unacknowledged alarm data from the Redux store
  const unAcknowledgedData = useSelector(getUnAckAlarmData);

  // 2. Derive state
  const { alarmCount, lastAlarm } = useMemo(() => {
    const count = unAcknowledgedData?.length || 0;
    const last = count > 0 ? unAcknowledgedData[count - 1] : null;
    return { alarmCount: count, lastAlarm: last };
  }, [unAcknowledgedData]);

  // 3. Logic for reminder popup
  useEffect(() => {
    let timerId = null;
    if (alarmCount > 0 && !bannerData) {
      timerId = setInterval(() => {
        setPopupVisible(true);
      }, FIVE_MINUTES_IN_MS);
    } else if (alarmCount === 0) {
      closeBanner();
    }

    return () => {
      if (timerId) {
        clearInterval(timerId);
      }
    };
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

  return (
    <AnimatePresence>
      {isPopupVisible && displayData && (
        <div 
          className="fixed inset-0 z-[100000000] flex items-center justify-center p-4 bg-black/40 backdrop-blur-md"
          role="dialog"
          aria-modal="true"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.3)] border border-white/20"
          >
            {/* Header section with gradient */}
            <div className={`p-6 flex flex-col items-center text-white relative bg-gradient-to-br ${
              isNewAlarm ? "from-red-500 to-orange-600" : "from-amber-500 to-orange-500"
            }`}>
              <div className="absolute top-4 right-4 animate-ping">
                <Bell className="w-6 h-6 fill-white" />
              </div>
              <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mb-4 animate-bounce">
                <Bell className="w-10 h-10 fill-white" />
              </div>
              <h2 className="text-2xl font-black tracking-tight mb-1 uppercase">
                {isNewAlarm ? "New Alarm!" : "Reminder!"}
              </h2>
              <p className="text-white/80 text-sm font-medium flex items-center gap-2">
                <Clock className="w-4 h-4" />
                {formatDateAsNumberWithTime(displayData.date)}
              </p>
              
              {!isNewAlarm && alarmCount > 1 && (
                <div className="mt-2 px-3 py-1 bg-white/20 rounded-full text-[10px] font-bold uppercase tracking-wider">
                  {alarmCount} Pending Alarms
                </div>
              )}
            </div>

            <div className="p-8 space-y-6">
              <div className="space-y-4">
                {/* Attendee Info Card */}
                <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    isNewAlarm ? "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400" : "bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400"
                  }`}>
                    <User className="w-6 h-6" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">E-Mail</p>
                    <p className="text-lg font-bold text-slate-800 dark:text-slate-100 truncate">
                      {displayData?.email}
                    </p>
                  </div>
                </div>

                {/* Note/Message Card */}
                <div className="flex items-start gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700">
                  <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 flex-shrink-0">
                    <MessageSquare className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Note</p>
                    <p className="text-sm font-medium text-slate-600 dark:text-slate-300 italic line-clamp-3">
                      "{displayData?.note || displayData?.message || "No note attached"}"
                    </p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={handleIgnore}
                  className="py-4 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-2xl font-bold text-sm hover:bg-slate-200 dark:hover:bg-slate-700 transition-all flex items-center justify-center gap-2 uppercase tracking-tight"
                >
                  <X className="w-4 h-4" /> Dismiss
                </button>
                <button
                  onClick={handleNavigate}
                  className={`py-4 text-white rounded-2xl font-black text-sm shadow-lg hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2 uppercase tracking-tight ${
                    isNewAlarm ? "bg-red-600 shadow-red-500/20" : "bg-amber-600 shadow-amber-500/20"
                  }`}
                >
                  <VolumeX className="w-4 h-4" /> Stop & View
                </button>
              </div>

            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default AlarmBanner;

