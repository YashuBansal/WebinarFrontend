import { Controller, useForm } from "react-hook-form";
import { useEffect, useState } from "react";
import Select from "react-select";
import { useDispatch, useSelector } from "react-redux";
import { addNote } from "../../features/actions/assign";
import AppLoader from "../../components/AppLoader";
import {
  getAllProductsByAdminId,
} from "../../features/actions/product";
import { getCustomOptions } from "../../features/actions/globalData";
import { resetFormSuccess } from "../../features/slices/assign";
import { getUnAckAlarmData, removeAckAlarm } from "../../features/slices/alarm";
import { Phone, CheckCircle2, Clock, FileText, Send, AlertCircle, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "../../components/ui/dropdown-menu";
import { Button } from "../../components/ui/button";

const AddNoteForm = (props) => {
  const { customOptions } = useSelector((state) => state.globalData);
  const dispatch = useDispatch();
  const { isFormLoading, isFormSuccess } = useSelector((state) => state.assign);
  const unAcknowledgedData = useSelector(getUnAckAlarmData);
  const {
    email,
    attendeeId,
    uniquePhones,
    addUserActivityLog,
    employeeModeData,
    userData,
  } = props;
  const [selectedStatus, setSelectedStatus] = useState(null);
  const [isNoteRequired, setNoteRequired] = useState(false);
  const [IsNumberInValid, setNumberInvalid] = useState(false);
  const [isAckPending, setAckPending] = useState(false);

  const {
    register,
    control,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm({
    defaultValues: {
      attendee: attendeeId,
      email: email,
      phone: "",
      callDuration: { hr: "", min: "", sec: "" },
      status: "",
      note: "",
      image: null,
    },
  });

  useEffect(() => {
    if (userData) {
      dispatch(getAllProductsByAdminId());
      dispatch(getCustomOptions());
    }
  }, []);

  useEffect(() => {
    if (userData && email && Array.isArray(unAcknowledgedData)) {
      const hasPendingAlarm = unAcknowledgedData.some(
        (item) => item.email === email
      );
      setAckPending(hasPendingAlarm);
    }
  }, [unAcknowledgedData, email, userData]);

  useEffect(() => {
    if (isAckPending) {
      const ackStatusValue = "Alarm Acknowledgement";
      setValue("status", ackStatusValue, { shouldValidate: true });
      setSelectedStatus(ackStatusValue);
      setNoteRequired(true);
      setNumberInvalid(false);
    }
  }, [isAckPending, setValue]);

  useEffect(() => {
    if (isFormSuccess) {
      reset({
        attendee: attendeeId,
        email: email,
        phone: "",
        callDuration: { hr: "", min: "", sec: "" },
        status: "",
        note: "",
        image: null,
      });
      setSelectedStatus(null);
      dispatch(resetFormSuccess());
    }
  }, [isFormSuccess, reset, attendeeId, email, dispatch]);

  const onSubmit = (data) => {
    data.callDuration.hr = data.callDuration.hr ? data.callDuration.hr : "00";
    data.callDuration.min = data.callDuration.min
      ? data.callDuration.min
      : "00";
    data.callDuration.sec = data.callDuration.sec
      ? data.callDuration.sec
      : "00";

    data.isWorked = !isNoteRequired;
    data.isInvalidPhone = IsNumberInValid;
    data["createdBy"] = userData?.userName;

    if (isAckPending) {
      const alarm = unAcknowledgedData.find((item) => item.email === email);
      if (alarm) {
        data["alarmId"] = alarm._id;
      }
    }

    dispatch(addNote(data)).then((res) => {
      if (res?.meta?.requestStatus === "fulfilled") {
        setNoteRequired(false);
        addUserActivityLog({
          action: "note",
          type: "contact",
          detailItem: data?.email,
          activityItem: data?.email,
        });
        if (isAckPending) {
          dispatch(removeAckAlarm(email));
          setAckPending(false);
        }
      }
    });
  };

  const handleInput = (e, maxValue, numAllowed = 2) => {
    let value = e.target.value;
    value = value.replace(/[^0-9]/g, "");
    if (value.length > numAllowed) value = value.slice(0, numAllowed);
    const num = Number(value);
    if (num > maxValue) value = maxValue.toString().padStart(2, "0");
    e.target.value = value;
  };

  const inputStyle = {
    backgroundColor: "white",
    border: "1px solid #E2E8F0",
    color: "#1E293B",
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="p-4 space-y-4 flex flex-col h-full"
    >
      <div className="space-y-4 flex-grow">

        {/* Phone Number Field */}
        <div className="space-y-1.5">
          <div className="flex items-center gap-1.5 mb-0.5">
            <Phone className="w-3.5 h-3.5 text-[#FF6B35]" />
            <label className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Phone</label>
          </div>
          <Controller
            name="phone"
            control={control}
            rules={{ required: "Phone number is required" }}
            render={({ field }) => (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    className="flex h-10 w-full items-center justify-between rounded-xl px-4 py-2 text-xs font-bold outline-none transition-all duration-200 hover:bg-black/5 dark:hover:bg-white/10 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700"
                  >
                    <span className="truncate">
                      {field.value || "Select phone..."}
                    </span>
                    <ChevronDown className="h-4 w-4 opacity-50 shrink-0" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="start"
                  className="w-[var(--radix-dropdown-menu-trigger-width)] min-w-[var(--radix-dropdown-menu-trigger-width)] max-h-[300px] z-[10000] overflow-y-auto overflow-x-hidden custom-scrollbar bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-xl p-1"
                >
                  {uniquePhones.map((phone) => (
                    <DropdownMenuItem
                      key={phone}
                      onClick={() => field.onChange(phone)}
                      className="cursor-pointer rounded-lg px-3 py-2 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200"
                    >
                      {phone}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          />
        </div>

        {/* Status Select */}
        <div className="space-y-1.5">
          <div className="flex items-center gap-1.5 mb-0.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            <label className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Status</label>
          </div>
          <Controller
            name="status"
            control={control}
            rules={{ required: "Status is required" }}
            render={({ field }) => {
              const statusOptions = isAckPending
                ? [{ value: "Alarm Acknowledgement", label: "Alarm Acknowledgement", isWorked: true, isInvalid: false }]
                : customOptions.map((option) => ({
                  value: option?.label,
                  label: option?.label,
                  isWorked: option?.isWorked,
                  isInvalid: option?.isInvalid,
                }));

              return (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild disabled={isAckPending}>
                    <Button
                      variant="outline"
                      className="flex h-10 w-full items-center justify-between rounded-xl px-4 py-2 text-xs font-bold outline-none transition-all duration-200 hover:bg-black/5 dark:hover:bg-white/10 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 disabled:opacity-50"
                    >
                      <span className="truncate">
                        {field.value || "Set result..."}
                      </span>
                      <ChevronDown className="h-4 w-4 opacity-50 shrink-0" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="start"
                    className="w-[var(--radix-dropdown-menu-trigger-width)] min-w-[var(--radix-dropdown-menu-trigger-width)] max-h-[300px] z-[10000] overflow-y-auto overflow-x-hidden custom-scrollbar bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-xl p-1"
                  >
                    {statusOptions.map((option) => (
                      <DropdownMenuItem
                        key={option.value}
                        onClick={() => {
                          field.onChange(option.value);
                          setSelectedStatus(option.value);
                          setNoteRequired(!option.isWorked);
                          setNumberInvalid(option.isInvalid);
                        }}
                        className="cursor-pointer rounded-lg px-3 py-2 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200"
                      >
                        {option.label}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              );
            }}
          />
        </div>

        <div className="space-y-4">
          {/* Call Duration */}
          <div className={`p-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-800 flex items-center justify-between transition-all ${!isNoteRequired ? 'opacity-40 pointer-events-none grayscale-[0.5]' : ''}`}>
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-orange-50 dark:bg-orange-900/30 rounded-lg">
                <Clock className="w-3.5 h-3.5 text-[#FF6B35]" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider">Duration</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                <span className="text-[9px] font-black text-slate-600 dark:text-slate-400 uppercase tracking-tighter">min</span>
                <input
                  {...register("callDuration.min")}
                  type="text"
                  disabled={!isNoteRequired}
                  placeholder="00"
                  className="w-9 h-8 rounded-lg border border-slate-200 bg-white dark:bg-slate-800 dark:border-slate-700 text-center font-black text-[11px] text-slate-700 dark:text-slate-200 focus:border-[#FF6B35] outline-none disabled:bg-slate-100 dark:disabled:bg-slate-950 transition-colors"
                  onInput={(e) => handleInput(e, 150, 3)}
                  onClick={(e) => e.target.select()}
                />
              </div>
              
              <span className="font-black text-slate-400 dark:text-slate-600 text-[10px]">:</span>
              
              <div className="flex items-center gap-1">
                <span className="text-[9px] font-black text-slate-600 dark:text-slate-400 uppercase tracking-tighter">sec</span>
                <input
                  {...register("callDuration.sec")}
                  type="text"
                  disabled={!isNoteRequired}
                  placeholder="00"
                  className="w-9 h-8 rounded-lg border border-slate-200 bg-white dark:bg-slate-800 dark:border-slate-700 text-center font-black text-[11px] text-slate-700 dark:text-slate-200 focus:border-[#FF6B35] outline-none disabled:bg-slate-100 dark:disabled:bg-slate-950 transition-colors"
                  onInput={(e) => handleInput(e, 59)}
                  onClick={(e) => e.target.select()}
                />
              </div>
            </div>
          </div>

          {/* Note Textarea */}
          <div className={`space-y-1.5 transition-all ${!isNoteRequired ? 'opacity-40 pointer-events-none grayscale-[0.5]' : ''}`}>
            <div className="flex items-center gap-1.5 mb-0.5">
              <FileText className="w-3.5 h-3.5 text-amber-500" />
              <label className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Discussion</label>
            </div>
            <textarea
              {...register("note", { required: isNoteRequired })}
              disabled={!isNoteRequired}
              placeholder={isNoteRequired ? "Interaction highlights..." : "Note not required for this status"}
              rows={3}
              className="w-full p-3 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-[#FF6B35] outline-none transition-all resize-none disabled:bg-slate-100 dark:disabled:bg-slate-950"
            />
          </div>
        </div>
      </div>

      {/* Submit Button */}
      <div className="pt-2">
        <button
          type="submit"
          disabled={isFormLoading || employeeModeData || !userData?.isActive}
          className="group w-full h-11 bg-[#FF6B35] hover:bg-[#e85a24] disabled:bg-slate-200 text-white font-black rounded-xl transition-all shadow-md shadow-[#FF6B35]/20 flex items-center justify-center gap-2"
        >
          {isFormLoading ? (
            <AppLoader size="sm" variant="muted" />
          ) : (
            <>
              <span className="text-xs">SAVE NOTE</span>
              <Send className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </>
          )}
        </button>
      </div>
    </form>
  );
};

export default AddNoteForm;
