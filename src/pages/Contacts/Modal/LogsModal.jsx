import React, { useEffect, useState } from "react";
import AppLoader from "../../../components/AppLoader";
import { useDispatch, useSelector } from "react-redux";
import Select from "react-select";
import { motion, AnimatePresence } from "framer-motion";
import { getAttendeeLogs } from "../../../features/actions/attendees";
import { Pagination } from "@mui/material";
import PageLimitEditor from "../../../components/PageLimitEditor";
import {
  AttendeeAction,
  formatDateAsNumberWithTime,
} from "../../../utils/extra";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import useMediaQuery from "../../../hooks/useMediaQuery";
import { X, ScrollText, Calendar, Filter, RefreshCw, ChevronRight, Activity, Search } from "lucide-react";

const LogsModal = ({ setModal, email, logUserActivity }) => {
  const tableHeader = "Attendee Logs";
  const dispatch = useDispatch();
  const { attendeeLogs, isLogsLoading, attendeeLogsPagination } = useSelector((state) => state.attendee);
  const isSmallScreen = useMediaQuery("(max-width: 768px)");
  const allActionsOption = "All Actions";

  const attendeeActionOptions = [
    { label: allActionsOption, value: allActionsOption },
    ...Object.values(AttendeeAction).map((item) => ({ label: item, value: item })),
  ];

  const { totalPages = 1 } = attendeeLogsPagination || {};
  const LIMIT = useSelector((state) => state.pageLimits[tableHeader] || 10);
  const [page, setPage] = useState(1);
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [selectedAction, setSelectedAction] = useState(allActionsOption);
  const [tempStartDate, setTempStartDate] = useState(null);
  const [tempEndDate, setTempEndDate] = useState(null);
  const [tempSelectedAction, setTempSelectedAction] = useState(allActionsOption);

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

  useEffect(() => {
    if (email) {
      dispatch(getAttendeeLogs({
        email, page, limit: LIMIT,
        startDate: getStartOfDayISO(startDate),
        endDate: getEndOfDayISO(endDate),
        action: selectedAction === allActionsOption ? null : selectedAction,
      }));
    }
  }, [dispatch, email, page, LIMIT, startDate, endDate, selectedAction]);

  const handlePageChange = (event, value) => {
    setPage(value);
  };

  const handleApplyFilters = () => {
    setStartDate(tempStartDate);
    setEndDate(tempEndDate);
    setSelectedAction(tempSelectedAction);
    setPage(1);
  };

  const handleClearFilters = () => {
    setTempStartDate(null); setTempEndDate(null); setTempSelectedAction(allActionsOption);
    setStartDate(null); setEndDate(null); setSelectedAction(allActionsOption);
    setPage(1);
  };

  const customSelectStyles = {
    control: (provided, state) => ({
      ...provided,
      borderRadius: '10px',
      minHeight: '36px',
      fontSize: '12px',
      fontWeight: '600',
      border: state.isFocused ? '2px solid #6366F1' : '1px solid #E2E8F0',
      backgroundColor: 'white',
      boxShadow: 'none',
      '&:hover': { border: '1px solid #CBD5E1' }
    }),
    option: (provided, state) => ({
      ...provided,
      backgroundColor: state.isSelected ? '#6366F1' : state.isFocused ? '#EEF2FF' : 'white',
      color: state.isSelected ? 'white' : '#1E293B',
      fontWeight: '600',
      fontSize: '12px',
    }),
    menu: (provided) => ({ ...provided, borderRadius: '10px', overflow: 'hidden', zIndex: 9999 })
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={() => setModal(false)}
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-md"
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="relative w-full max-w-5xl bg-white dark:bg-slate-900/90 rounded-2xl shadow-2xl shadow-slate-900/20 flex flex-col h-[85vh] overflow-hidden"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm relative">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-sky-500 to-indigo-500" />
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-50 dark:bg-indigo-900/30 rounded-xl">
              <ScrollText className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-800 dark:text-slate-200 uppercase tracking-tight">Attendee Logs</h2>
              <p className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none">{email}</p>
            </div>
          </div>
          <button onClick={() => setModal(false)} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        {/* Filters Toolbar */}
        <div className="px-6 py-3 bg-slate-50/50 dark:bg-slate-800/30 border-b border-slate-100 dark:border-slate-800 grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
          <div className="space-y-1">
            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
              <Calendar className="w-3 h-3" /> Date Range
            </label>
            <div className="flex gap-2">
              <DatePicker
                selected={tempStartDate}
                onChange={setTempStartDate}
                placeholderText="Start"
                className="w-full h-9 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold text-slate-700 dark:text-slate-200 focus:border-indigo-500 outline-none"
              />
              <DatePicker
                selected={tempEndDate}
                onChange={setTempEndDate}
                minDate={tempStartDate}
                placeholderText="End"
                className="w-full h-9 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold text-slate-700 dark:text-slate-200 focus:border-indigo-500 outline-none"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
              <Activity className="w-3 h-3" /> Action Type
            </label>
            <Select
              value={attendeeActionOptions.find(o => o.value === tempSelectedAction)}
              onChange={o => setTempSelectedAction(o.value)}
              options={attendeeActionOptions}
              styles={customSelectStyles}
              isSearchable={false}
            />
          </div>

          <div className="md:col-span-2 flex gap-2">
            <button
              onClick={handleApplyFilters}
              className="flex-1 h-9 bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-black rounded-lg transition-all shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2 uppercase tracking-widest"
            >
              <Search className="w-3 h-3" /> Apply
            </button>
            <button
              onClick={handleClearFilters}
              className="px-3 h-9 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-200 text-[10px] font-black rounded-lg transition-all uppercase tracking-widest"
            >
              <RefreshCw className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-hidden flex flex-col bg-slate-50/20 dark:bg-slate-900/20">
          {isLogsLoading ? (
            <div className="flex-1 flex items-center justify-center">
              <AppLoader size="lg" />
            </div>
          ) : attendeeLogs?.length > 0 ? (
            <div className="flex-1 overflow-y-auto px-6 py-4 scrollbar-thin">
              <div className="space-y-2.5">
                {attendeeLogs.map((log, idx) => (
                  <motion.div
                    key={log._id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="group bg-white dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 hover:border-indigo-200 dark:hover:border-indigo-500/30 rounded-xl p-3 shadow-sm transition-all flex flex-col md:flex-row md:items-center gap-3"
                  >
                    <div className="flex-shrink-0 flex items-center gap-3 md:w-40">
                      <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 shadow-sm shadow-indigo-500/50" />
                      <span className="text-[10px] font-black text-slate-900 dark:text-slate-100 uppercase tracking-wider line-clamp-1">{log.action}</span>
                    </div>

                    <div className="flex-1">
                      <div
                        className="text-[13px] font-medium text-slate-600 dark:text-slate-400 line-clamp-2 group-hover:line-clamp-none transition-all"
                        dangerouslySetInnerHTML={{ __html: log.details || "-" }}
                      />
                    </div>

                    <div className="flex-shrink-0 text-right">
                      <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                        {formatDateAsNumberWithTime(log.createdAt)}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400 gap-4">
              <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-full">
                <ScrollText className="w-12 h-12 opacity-20" />
              </div>
              <p className="text-sm font-bold uppercase tracking-widest opacity-50">No activity logs found</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-100 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 flex flex-col md:flex-row items-center justify-between gap-4">
          <Pagination
            onChange={handlePageChange}
            count={totalPages}
            page={Number(page)}
            variant="outlined"
            shape="rounded"
            disabled={isLogsLoading}
            size="small"
            sx={{
              '& .MuiPaginationItem-root': {
                borderRadius: '8px',
                fontWeight: 700,
                fontSize: '11px',
                border: '1px solid #E2E8F0',
                '&.Mui-selected': {
                  backgroundColor: '#6366F1',
                  color: 'white',
                  border: 'none'
                }
              }
            }}
          />
          <PageLimitEditor pageId={tableHeader} setPage={setPage} />
        </div>
      </motion.div>
    </div>
  );
};

export default LogsModal;
