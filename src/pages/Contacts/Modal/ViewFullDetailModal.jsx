import React from "react";
import { X, Calendar, User, Phone, Clock, MessageSquare, StickyNote, Activity } from "lucide-react";
import { motion } from "framer-motion";
import { formatDate } from "../../../utils/extra";

const InfoRow = ({ icon: Icon, label, value, color = "orange" }) => {
  const colorMap = {
    orange: "bg-orange-50 text-[#FF6B35] border-orange-100",
    emerald: "bg-emerald-50 text-emerald-600 border-emerald-100",
    blue: "bg-blue-50 text-blue-600 border-blue-100",
    amber: "bg-amber-50 text-amber-600 border-amber-100",
    purple: "bg-purple-50 text-purple-600 border-purple-100",
    rose: "bg-rose-50 text-rose-600 border-rose-100",
  };

  const textColor = color === "orange" ? "text-[#FF6B35]" : colorMap[color].split(' ')[1];

  return (
    <div className="group flex items-center gap-3 py-2.5 px-4 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors border-b border-slate-50 dark:border-slate-800/50 last:border-0">
      <div className={`p-1.5 rounded-lg ${colorMap[color].split(' ')[0]} dark:bg-opacity-10 transition-transform group-hover:scale-110`}>
        <Icon className={`w-3.5 h-3.5 ${textColor}`} />
      </div>
      <div className="flex-1">
        <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">{label}</span>
      </div>
      <div className="text-right">
        <p className="text-xs font-extrabold text-slate-800 dark:text-slate-100 uppercase tracking-tight">
          {value || "N/A"}
        </p>
      </div>
    </div>
  );
};

const ViewFullDetailsModal = ({ setModalData, modalData }) => {
  if (!modalData) return null;

  const durationStr = `${modalData?.callDuration?.hr || 0}h ${modalData?.callDuration?.min || 0}m ${modalData?.callDuration?.sec || 0}s`;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={() => setModalData(null)}
        className="absolute inset-0 bg-slate-900/30 backdrop-blur-sm"
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl shadow-slate-900/20 overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Modern Header Section */}
        <div className="relative pt-2 pb-4">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#FF6B35] via-[#FF6B35] to-[#FF8C61]" />
          <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700/50 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-50 dark:bg-orange-900/30 rounded-xl">
                <Activity className="w-5 h-5 text-[#FF6B35] dark:text-[#FF8C61]" />
              </div>
              <div>
                <h2 className="text-lg font-black text-slate-800 dark:text-slate-100 uppercase tracking-tight leading-none mb-1">Session Summary</h2>
                <p className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none">Interaction Record</p>
              </div>
            </div>
            <button
              onClick={() => setModalData(null)}
              className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-all text-slate-400"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 pb-6 space-y-4 scrollbar-thin">
          {/* Table Container */}
          <div className="bg-white dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 rounded-xl overflow-hidden divide-y divide-slate-50 dark:divide-slate-800/50 shadow-sm">
            <InfoRow icon={Calendar} label="Interaction Date" value={formatDate(modalData?.updatedAt)} color="blue" />
            <InfoRow icon={User} label="Recorded By" value={modalData?.createdBy?.userName} color="emerald" />
            <InfoRow icon={Phone} label="Contact Line" value={modalData?.phone} color="orange" />
            <InfoRow icon={Clock} label="Call Duration" value={durationStr} color="amber" />
            <InfoRow icon={MessageSquare} label="Status Outcome" value={modalData?.status} color="purple" />
          </div>

          {/* Notes Block */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 px-1">
              <StickyNote className="w-3.5 h-3.5 text-slate-400" />
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Executive Notes</label>
            </div>
            <div className="p-4 bg-slate-50/50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/80 rounded-xl">
              <p className="text-[13px] font-medium text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap italic">
                "{modalData?.note || "No additional comments were recorded for this session."}"
              </p>
            </div>
          </div>
        </div>

      </motion.div>
    </div>
  );
};

export default ViewFullDetailsModal;
