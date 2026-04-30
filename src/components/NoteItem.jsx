import React from "react";
import { formatDate } from "../utils/extra";
import { Clock, Phone, User, Calendar, MessageSquare, ShieldCheck } from "lucide-react";
import { motion } from "framer-motion";

const NoteItem = ({ item, index, setNoteModalData, roles }) => {
  function convertToMinutes(totalSeconds) {
    let minutes = 0;
    if (typeof totalSeconds === "number") {
      minutes = Math.floor(totalSeconds / 60);
    }
    return minutes.toString().padStart(2, "0");
  }

  function convertToSecons(totalSeconds) {
    let seconds = 0;
    if (typeof totalSeconds === "number") {
      seconds = totalSeconds % 60;
    }
    return seconds.toString().padStart(2, "0");
  }

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'converted':
      case 'called':
        return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400';
      case 'interested':
      case 'wants demo':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
      case 'not interested':
      case 'fake lead':
      case 'wrong number':
        return 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400';
      default:
        return 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      whileHover={{ y: -1 }}
      className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all cursor-pointer group"
      onClick={() => setNoteModalData(item)}
    >
      {/* Header */}
      <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50">
        <div className="flex justify-between items-start mb-1">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 bg-[#FF6B35] text-white text-[9px] font-black rounded-md flex items-center justify-center">
              {index}
            </div>
            <span className={`text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-full ${getStatusColor(item?.status)}`}>
              {item?.status || 'No Status'}
            </span>
          </div>
          <div className="flex items-center gap-1 text-slate-400 dark:text-slate-500">
            <Calendar className="w-2.5 h-2.5" />
            <span className="text-[9px] font-bold">{formatDate(item?.updatedAt)}</span>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-x-3 gap-y-0.5">
          <div className="flex items-center gap-1">
            <Phone className="w-2.5 h-2.5 text-slate-400" />
            <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300">{item?.phone}</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="w-2.5 h-2.5 text-slate-400" />
            <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300">
              {`${convertToMinutes(item?.callDuration)}:${convertToSecons(item?.callDuration)}`}
            </span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-3 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-4 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center">
              <User className="w-2.5 h-2.5 text-slate-500" />
            </div>
            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">
              {item?.createdBy?.userName || "N/A"}
              <span className="ml-1 opacity-60 font-medium">({roles.getRoleNameById(item?.createdBy?.role)})</span>
            </span>
          </div>
        </div>

        <div className="relative">
          <p className="text-[12px] text-slate-600 dark:text-slate-300 leading-relaxed italic border-l-2 border-slate-200 dark:border-slate-700 pl-2">
            {item?.note}
          </p>
        </div>
      </div>
      
      <div className="h-1 w-full bg-gradient-to-r from-transparent via-[#FF6B35]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
    </motion.div>
  );
};

export default NoteItem;
