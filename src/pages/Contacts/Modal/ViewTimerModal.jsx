import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { useDispatch, useSelector } from "react-redux";
import { getAttendeeAlarm, setAlarm } from "../../../features/actions/alarm";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import Select from "react-select";
import { motion, AnimatePresence } from "framer-motion";
import { X, Timer, Calendar, Clock, StickyNote, PhoneCall, BellRing, AlertCircle } from "lucide-react";
import { toast } from "sonner";

const ViewTimerModal = ({ setModal, email, attendeeId, dateFormat, logUserActivity, noteData, uniquePhones }) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  const { userData } = useSelector((state) => state.auth);
  const dispatch = useDispatch();

  const now = new Date();
  now.setMinutes(now.getMinutes() + 1);

  const initHourRaw = now.getHours();
  const initMinute = now.getMinutes().toString().padStart(2, "0");
  const initAmPm = initHourRaw >= 12 ? "PM" : "AM";
  const initHour12 = (initHourRaw % 12 || 12).toString().padStart(2, "0");

  const [selectedDate, setSelectedDate] = useState(now);
  const [hour, setHour] = useState(initHour12);
  const [minute, setMinute] = useState(initMinute);
  const [ampm, setAmPm] = useState(initAmPm);

  const hours = Array.from({ length: 12 }, (_, i) => ({
    value: (i + 1).toString().padStart(2, "0"),
    label: (i + 1).toString().padStart(2, "0"),
  }));
  const minutes = Array.from({ length: 60 }, (_, i) => ({
    value: i.toString().padStart(2, "0"),
    label: i.toString().padStart(2, "0"),
  }));

  const ampmOptions = [
    { value: "AM", label: "AM" },
    { value: "PM", label: "PM" },
  ];

  const customSelectStyles = {
    control: (provided, state) => ({
      ...provided,
      borderRadius: '10px',
      minHeight: '38px',
      fontSize: '13px',
      fontWeight: '700',
      border: state.isFocused ? '2px solid #FF6B35' : '1px solid #E2E8F0',
      backgroundColor: 'white',
      boxShadow: 'none',
      '&:hover': { border: '1px solid #CBD5E1' }
    }),
    option: (provided, state) => ({
      ...provided,
      backgroundColor: state.isSelected ? '#FF6B35' : state.isFocused ? '#FFF4F0' : 'white',
      color: state.isSelected ? 'white' : '#1E293B',
      fontWeight: '600',
      fontSize: '13px',
    }),
    menu: (provided) => ({
      ...provided,
      borderRadius: '10px',
      overflow: 'hidden',
      zIndex: 9999,
    }),
    menuPortal: (provided) => ({ ...provided, zIndex: 999999 })
  };

  const formatIndianPhoneNumber = (phone) => {
    if (!phone) return "Number not Available";
    const phoneStr = String(phone).trim().replace(/\D/g, "");
    if (phoneStr.length === 10) return `+91${phoneStr}`;
    if (phoneStr.length === 12 && phoneStr.startsWith("91")) return `+${phoneStr}`;
    return "Number not Available";
  };

  const findAndFormatFirstValidPhone = (noteData = [], uniquePhones = []) => {
    for (const item of noteData) {
      const formattedPhone = formatIndianPhoneNumber(item?.phone);
      if (formattedPhone !== "Number not Available") return formattedPhone;
    }
    for (const rawPhone of uniquePhones) {
      const formattedPhone = formatIndianPhoneNumber(rawPhone);
      if (formattedPhone !== "Number not Available") return formattedPhone;
    }
    return "Number not Available";
  };

  const onSubmit = (data) => {
    if (data.note) data.note = data.note.trim();
    let finalDate = new Date(selectedDate);
    let hr = parseInt(hour, 10);
    const min = parseInt(minute, 10);
    if (ampm === "PM" && hr < 12) hr += 12;
    if (ampm === "AM" && hr === 12) hr = 0;
    finalDate.setHours(hr, min, 0, 0);

    const payload = {
      ...data,
      email,
      createdBy: userData?.userName,
      attendeeId,
      date: finalDate.toISOString(),
      attendeePhone: findAndFormatFirstValidPhone(noteData, uniquePhones)
    };

    dispatch(setAlarm(payload)).then((res) => {
      if (res.meta.requestStatus === "fulfilled") {
        toast.success("Alarm scheduled successfully");
        logUserActivity({
          action: "setAlarm",
          type: "contact",
          detailItem: email,
          activityItem: email,
        });
        dispatch(getAttendeeAlarm({ email }));
      }
    });
    setModal(false);
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={() => setModal(false)}
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="relative w-full max-w-md bg-white dark:bg-slate-800 rounded-2xl shadow-2xl shadow-slate-900/20 overflow-hidden"
      >
        {/* Top Gradient Bar */}
        <div className="h-1.5 w-full bg-gradient-to-r from-[#FF6B35] to-[#FF8C61]" />

        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700/50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-50 dark:bg-orange-900/30 rounded-xl">
              <BellRing className="w-5 h-5 text-[#FF6B35] dark:text-[#FF8C61]" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-800 dark:text-slate-200 uppercase tracking-tight">Set Reminder</h2>
              <p className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Schedule Follow-up</p>
            </div>
          </div>
          <button
            onClick={() => setModal(false)}
            className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-5 space-y-4">
          {/* Date & Time Selection */}
          <div className="grid grid-cols-1 gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 mb-0.5">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Select Date</label>
              </div>
              <DatePicker
                selected={selectedDate}
                onChange={(date) => setSelectedDate(date)}
                minDate={new Date()}
                dateFormat={dateFormat}
                className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50 text-sm font-bold text-slate-700 dark:text-slate-200 focus:border-[#FF6B35] outline-none transition-all"
              />
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2 mb-0.5">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Select Time</label>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <Select
                  value={hours.find((h) => h.value === hour)}
                  onChange={(opt) => setHour(opt.value)}
                  options={hours}
                  styles={customSelectStyles}
                  isSearchable={false}
                  menuPortalTarget={document.body}
                />
                <Select
                  value={minutes.find((m) => m.value === minute)}
                  onChange={(opt) => setMinute(opt.value)}
                  options={minutes}
                  styles={customSelectStyles}
                  isSearchable={false}
                  menuPortalTarget={document.body}
                />
                <Select
                  value={ampmOptions.find((ap) => ap.value === ampm)}
                  onChange={(opt) => setAmPm(opt.value)}
                  options={ampmOptions}
                  styles={customSelectStyles}
                  isSearchable={false}
                  menuPortalTarget={document.body}
                />
              </div>
            </div>
          </div>

          {/* Note Input */}
          <div className="space-y-1">
            <div className="flex items-center gap-2 mb-0.5">
              <StickyNote className="w-3.5 h-3.5 text-slate-400" />
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Follow-up Note</label>
            </div>
            <textarea
              {...register("note", {
                required: "Please provide a reason for the follow-up",
                maxLength: { value: 600, message: "Note too long" }
              })}
              rows={2}
              placeholder="What needs to be discussed?"
              className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50 text-sm font-medium text-slate-700 dark:text-slate-200 focus:border-[#FF6B35] outline-none transition-all resize-none"
            />
            {errors.note && (
              <span className="text-[10px] font-bold text-rose-500 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> {errors.note.message}
              </span>
            )}
          </div>

          {/* Secondary Phone */}
          <div className="space-y-1">
            <div className="flex items-center gap-2 mb-0.5">
              <PhoneCall className="w-3.5 h-3.5 text-slate-400" />
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Alternate Number (Optional)</label>
            </div>
            <input
              {...register("secondaryNumber", {
                pattern: { value: /^\+91\d+$/, message: "Format: +91XXXXXXXXXX" }
              })}
              type="tel"
              placeholder="+91XXXXXXXXXX"
              className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50 text-sm font-bold text-slate-700 dark:text-slate-200 focus:border-[#FF6B35] outline-none transition-all"
            />
            {errors.secondaryNumber && (
              <span className="text-[10px] font-bold text-rose-500 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> {errors.secondaryNumber.message}
              </span>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => setModal(false)}
              className="flex-1 h-11 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-200 text-[10px] font-black rounded-xl transition-all uppercase tracking-widest"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-[2] h-11 bg-[#FF6B35] hover:bg-[#e85a24] text-white text-[10px] font-black rounded-xl transition-all shadow-lg shadow-[#FF6B35]/20 uppercase tracking-widest"
            >
              Schedule Alarm
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default ViewTimerModal;
