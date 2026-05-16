import React, { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Controller, useForm } from "react-hook-form";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "sonner";
import { CalendarDays, Copy, Filter, RotateCcw, Save, X, ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "../ui/dropdown-menu";
import { closeModal } from "../../features/slices/modalSlice";
import { filterTruthyValues, successToast } from "../../utils/extra";
import useAddUserActivity from "../../hooks/useAddUserActivity";
import { getAllEmployees } from "../../features/actions/employee";
import { clearEmployeeData } from "../../features/slices/employee";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import WebinarConditionalLogicPanel from "./WebinarConditionalLogicPanel";
import { useTheme } from "../../contexts/ThemeContext";

const FilterModal = ({
  modalName,
  setFilters,
  filters,
  dateFormat,
  sortField,
  setSortField,
  sortDirection,
  setSortDirection,
  onOpenPresetModal,
}) => {
  const { isDark } = useTheme();
  const dispatch = useDispatch();
  const logUserActivity = useAddUserActivity();
  const { modals } = useSelector((state) => state.modals);
  const { employeeData } = useSelector((state) => state.employee);
  const open = Boolean(modals[modalName]);

  const { control, handleSubmit, register, reset, setValue, getValues } =
    useForm();
  const [options, setOptions] = useState([]);
  const [filterTab, setFilterTab] = useState("simple");
  const [conditionalMeta, setConditionalMeta] = useState({
    hasOr: false,
    hadExcludeNonName: false,
  });
  const conditionalSanitizeRef = useRef((d) => d);

  const handleConditionalChainMeta = useCallback((meta) => {
    setConditionalMeta({
      hasOr: Boolean(meta?.hasOr),
      hadExcludeNonName: Boolean(meta?.hadExcludeNonName),
    });
  }, []);

  const inputStyle = {
    backgroundColor: isDark ? "#0f172a" : "#ffffff",
    border: `1px solid ${isDark ? "#334155" : "#e2e8f0"}`,
    color: isDark ? "#f8fafc" : "#0f172a",
    fontFamily: "Inter, sans-serif",
  };
  const labelStyle = {
    fontFamily: "Inter, sans-serif",
    fontSize: "10px",
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: "0.04em",
    color: isDark ? "#94a3b8" : "#64748b",
    marginBottom: "4px",
    display: "block",
  };

  const onClose = () => dispatch(closeModal(modalName));

  const onSubmit = (data) => {
    if (filterTab === "advanced") {
      if (conditionalMeta.hasOr) {
        toast.message(
          "OR between conditions is not supported by the API yet; filters were applied as AND."
        );
      }
      if (conditionalMeta.hadExcludeNonName) {
        toast.message(
          "Exclude for webinar name uses patterns; excludes on other fields were omitted from the request."
        );
      }
    }
    let payload =
      filterTab === "advanced"
        ? conditionalSanitizeRef.current(data)
        : { ...data };
    if (payload.assignedEmployee && !Array.isArray(payload.assignedEmployee)) {
      payload = {
        ...payload,
        assignedEmployee: [payload.assignedEmployee],
      };
    }
    const filterData = filterTruthyValues(payload);
    if (Object.keys(filterData).length) successToast("Filters Applied");
    setFilters(filterData);
    logUserActivity({ action: "filter", type: "to Table", detailItem: "Webinars" });
    onClose();
  };

  const resetForm = () => {
    reset({
      webinarName: "",
      webinarDate: null,
      totalRegistrations: null,
      totalParticipants: null,
      totalAttendees: null,
      totalUnAttended: null,
      assignedEmployee: "",
    });
  };

  const handleResetFilters = () => {
    resetForm();
    setFilters({});
    successToast("All filters cleared");
  };

  useEffect(() => {
    if (open) {
      setFilterTab("simple");
      const f = { ...filters };
      if (Array.isArray(f.assignedEmployee)) {
        f.assignedEmployee =
          f.assignedEmployee.length > 0 ? f.assignedEmployee[0] : "";
      }
      reset(f);
    } else resetForm();
  }, [open, filters, reset]);

  useEffect(() => {
    dispatch(getAllEmployees({ page: 1, limit: 100, filters: { isActive: "active" } }));
    return () => dispatch(clearEmployeeData());
  }, [dispatch]);

  useEffect(() => {
    if (!employeeData) return;
    setOptions(
      employeeData.map((employee) => ({
        value: employee._id,
        label: `${employee.userName} - ${employee.role}`,
      }))
    );
  }, [employeeData]);

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          key="filter-modal-container"
          className="fixed inset-0 z-[200] flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", duration: 0.4, bounce: 0 }}
            className={`relative w-full max-w-[1200px] max-h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden z-10 border transition-colors duration-300 ${isDark ? "bg-[#1e293b] border-slate-700/50" : "bg-white border-[#e5e7eb]"}`}
            onMouseDown={(e) => e.stopPropagation()}
          >
        <form onSubmit={handleSubmit(onSubmit)} className="flex h-full flex-col">
          <div className={`flex items-center justify-between p-4 border-b flex-shrink-0 transition-colors duration-300 ${isDark ? "border-slate-700/50" : "border-[#e5e7eb]"}`}>
            <h3 className={`text-lg font-bold flex items-center gap-2 ${isDark ? "text-slate-100" : "text-[#0f172a]"}`} style={{ fontFamily: "Inter, sans-serif" }}>
              <Filter className="w-5 h-5 text-gray-500 dark:text-gray-400" /> Webinar Filters
            </h3>
            <button type="button" onClick={onClose} className="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/5">
              <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
            </button>
          </div>

          <div className={`flex gap-2 px-4 pt-2 border-b flex-shrink-0 transition-colors duration-300 ${isDark ? "border-slate-700/50" : "border-[#e5e7eb]"}`}>
            <button
              type="button"
              onClick={() => setFilterTab("simple")}
              className="px-4 py-2 transition-all duration-300 relative"
              style={{ fontFamily: "Inter, sans-serif", fontSize: "13px", fontWeight: 600, color: filterTab === "simple" ? "#22B573" : (isDark ? "#94a3b8" : "#64748b") }}
            >
              Simple Filters
              {filterTab === "simple" && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#22B573] rounded-t-full" />}
            </button>
            <button
              type="button"
              onClick={() => setFilterTab("advanced")}
              className="px-4 py-2 transition-all duration-300 relative"
              style={{ fontFamily: "Inter, sans-serif", fontSize: "13px", fontWeight: 600, color: filterTab === "advanced" ? "#22B573" : (isDark ? "#94a3b8" : "#64748b") }}
            >
              Conditional Logic
              {filterTab === "advanced" && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#22B573] rounded-t-full" />}
            </button>
          </div>

          <div className="p-4 overflow-y-auto max-h-[60vh] custom-scrollbar flex-1">
            {filterTab === "simple" ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-4 gap-y-3">
                <div>
                  <span style={labelStyle}>Webinar Name</span>
                  <Input {...register("webinarName")} placeholder="Search by webinar name..." className="w-full p-2 rounded-xl text-sm focus:outline-none focus:ring-2" style={inputStyle} />
                </div>
                <div>
                  <span style={labelStyle}>Assigned Employees</span>
                  <Controller
                    control={control}
                    name="assignedEmployee"
                    render={({ field }) => (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="outline"
                            className="flex h-11 w-full items-center justify-between rounded-xl border-gray-200 bg-white px-4 py-2 text-sm dark:border-slate-800 dark:bg-slate-900 text-slate-700 dark:text-slate-200 outline-none hover:bg-gray-50 dark:hover:bg-white/10 transition-all duration-200"
                            style={inputStyle}
                          >
                            <span className="truncate">
                              {field.value
                                ? options.find((o) => o.value === field.value)?.label ||
                                  "Select Employee"
                                : "All Employees"}
                            </span>
                            <ChevronDown className="ml-2 h-4 w-4 opacity-50 shrink-0" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                          align="start"
                          className="w-[var(--radix-dropdown-menu-trigger-width)] min-w-[var(--radix-dropdown-menu-trigger-width)] max-h-[300px] z-[300] overflow-y-auto overflow-x-hidden custom-scrollbar bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-xl p-1"
                        >
                          <DropdownMenuItem
                            onClick={() => field.onChange("")}
                            className="cursor-pointer rounded-lg px-3 py-2 text-sm hover:bg-slate-100 dark:hover:bg-white/10 text-slate-700 dark:text-slate-200"
                          >
                            All Employees
                          </DropdownMenuItem>
                          {options.map((employee, idx) => (
                            <DropdownMenuItem
                              key={`employee-${idx}-${employee.value}`}
                              onClick={() => field.onChange(employee.value)}
                              className="cursor-pointer rounded-lg px-3 py-2 text-sm hover:bg-slate-100 dark:hover:bg-white/10 text-slate-700 dark:text-slate-200"
                            >
                              {employee.label}
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  />
                </div>
                <div>
                  <span style={labelStyle}>Registrations</span>
                  <div className="flex gap-2">
                    <Input {...register("totalRegistrations.$gte")} type="number" placeholder="Min" className="w-full p-2 rounded-xl text-sm focus:outline-none focus:ring-2" style={inputStyle} />
                    <Input {...register("totalRegistrations.$lte")} type="number" placeholder="Max" className="w-full p-2 rounded-xl text-sm focus:outline-none focus:ring-2" style={inputStyle} />
                  </div>
                </div>
                <div>
                  <span style={labelStyle}>Participants</span>
                  <div className="flex gap-2">
                    <Input {...register("totalParticipants.$gte")} type="number" placeholder="Min" className="w-full p-2 rounded-xl text-sm focus:outline-none focus:ring-2" style={inputStyle} />
                    <Input {...register("totalParticipants.$lte")} type="number" placeholder="Max" className="w-full p-2 rounded-xl text-sm focus:outline-none focus:ring-2" style={inputStyle} />
                  </div>
                </div>
                <div>
                  <span style={labelStyle}>Attendees</span>
                  <div className="flex gap-2">
                    <Input {...register("totalAttendees.$gte")} type="number" placeholder="Min" className="w-full p-2 rounded-xl text-sm focus:outline-none focus:ring-2" style={inputStyle} />
                    <Input {...register("totalAttendees.$lte")} type="number" placeholder="Max" className="w-full p-2 rounded-xl text-sm focus:outline-none focus:ring-2" style={inputStyle} />
                  </div>
                </div>
                <div>
                  <span style={labelStyle}>Un-Attended</span>
                  <div className="flex gap-2">
                    <Input {...register("totalUnAttended.$gte")} type="number" placeholder="Min" className="w-full p-2 rounded-xl text-sm focus:outline-none focus:ring-2" style={inputStyle} />
                    <Input {...register("totalUnAttended.$lte")} type="number" placeholder="Max" className="w-full p-2 rounded-xl text-sm focus:outline-none focus:ring-2" style={inputStyle} />
                  </div>
                </div>
                <div>
                  <span style={labelStyle}>Date From</span>
                  <div className="relative">
                    <Controller
                      name="webinarDate.$gte"
                      control={control}
                      render={({ field }) => (
                        <DatePicker
                          selected={field.value}
                          onChange={(date) => field.onChange(date)}
                          placeholderText="mm/dd/yyyy"
                          dateFormat={dateFormat}
                          customInput={<Input className="w-full p-2 rounded-xl text-sm focus:outline-none focus:ring-2 pr-9" style={inputStyle} />}
                        />
                      )}
                    />
                    <CalendarDays className="pointer-events-none absolute right-3 top-2.5 h-4 w-4 text-gray-500 dark:text-gray-400" />
                  </div>
                </div>
                <div>
                  <span style={labelStyle}>Date To</span>
                  <div className="relative">
                    <Controller
                      name="webinarDate.$lte"
                      control={control}
                      render={({ field }) => (
                        <DatePicker
                          selected={field.value}
                          onChange={(date) => field.onChange(date)}
                          placeholderText="mm/dd/yyyy"
                          dateFormat={dateFormat}
                          customInput={<Input className="w-full p-2 rounded-xl text-sm focus:outline-none focus:ring-2 pr-9" style={inputStyle} />}
                        />
                      )}
                    />
                    <CalendarDays className="pointer-events-none absolute right-3 top-2.5 h-4 w-4 text-gray-500 dark:text-gray-400" />
                  </div>
                </div>
              </div>
            ) : (
              <WebinarConditionalLogicPanel
                active={filterTab === "advanced"}
                control={control}
                setValue={setValue}
                getValues={getValues}
                employeeOptions={options}
                onChainMeta={handleConditionalChainMeta}
                sanitizerRef={conditionalSanitizeRef}
                inputStyle={inputStyle}
                pickerDateFormat={dateFormat}
                isDark={isDark}
              />
            )}
          </div>

          <div className={`p-4 border-t flex-shrink-0 transition-colors duration-300 ${isDark ? "border-slate-700/50 bg-[#0f172a]/50" : "border-[#e5e7eb] bg-[#F9FAFB]"}`}>
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2">
                  <span style={{ ...labelStyle, marginBottom: 0 }}>Sort By:</span>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="outline"
                        className="flex h-9 w-[160px] items-center justify-between rounded-lg border px-3 py-1.5 text-sm outline-none transition-all duration-200 hover:bg-slate-50 dark:hover:bg-white/10"
                        style={inputStyle}
                      >
                        <span className="truncate">
                          {{
                            name: "Webinar Name",
                            date: "Date",
                            registrations: "Registrations",
                            participants: "Participants",
                            attendees: "Attendees",
                            unAttended: "Un-Attended",
                          }[sortField] || "Webinar Name"}
                        </span>
                        <ChevronDown className="ml-2 h-4 w-4 opacity-50 shrink-0" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      align="start"
                      className="w-[180px] max-h-[300px] z-[300] overflow-y-auto overflow-x-hidden custom-scrollbar bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-xl p-1"
                    >
                      {[
                        { value: "name", label: "Webinar Name" },
                        { value: "date", label: "Date" },
                        { value: "registrations", label: "Registrations" },
                        { value: "participants", label: "Participants" },
                        { value: "attendees", label: "Attendees" },
                        { value: "unAttended", label: "Un-Attended" },
                      ].map((opt) => (
                        <DropdownMenuItem
                          key={opt.value}
                          onClick={() => setSortField?.(opt.value)}
                          className="cursor-pointer rounded-lg px-3 py-2 text-sm hover:bg-slate-100 dark:hover:bg-white/10 text-slate-700 dark:text-slate-200"
                        >
                          {opt.label}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <div className="flex items-center gap-2">
                  <span style={{ ...labelStyle, marginBottom: 0 }}>Order:</span>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="outline"
                        className="flex h-9 w-[180px] items-center justify-between rounded-lg border px-3 py-1.5 text-sm outline-none transition-all duration-200 hover:bg-slate-50 dark:hover:bg-white/10"
                        style={inputStyle}
                      >
                        <span className="truncate">
                          {sortDirection === "asc"
                            ? "A - Z / Lowest First"
                            : "Z - A / Highest First"}
                        </span>
                        <ChevronDown className="ml-2 h-4 w-4 opacity-50 shrink-0" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      align="start"
                      className="w-[200px] z-[300] bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-xl p-1"
                    >
                      {[
                        { value: "asc", label: "A - Z / Lowest First" },
                        { value: "desc", label: "Z - A / Highest First" },
                      ].map((opt) => (
                        <DropdownMenuItem
                          key={opt.value}
                          onClick={() => setSortDirection?.(opt.value)}
                          className="cursor-pointer rounded-lg px-3 py-2 text-sm hover:bg-slate-100 dark:hover:bg-white/10 text-slate-700 dark:text-slate-200"
                        >
                          {opt.label}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
                <Button onClick={handleResetFilters} className="px-3 py-1.5 rounded-xl font-medium transition-colors hover:bg-black/5 dark:hover:bg-white/5 flex items-center gap-2" style={{ backgroundColor: "transparent", border: `1px solid ${isDark ? "#475569" : "#cbd5e1"}`, color: isDark ? "#94a3b8" : "#475569" }}>
                  <RotateCcw className="w-3.5 h-3.5" /> Reset
                </Button>
                <Button
                  onClick={() => {
                    onClose();
                    onOpenPresetModal?.();
                  }}
                  className="px-3 py-1.5 rounded-xl font-medium transition-colors hover:bg-black/5 dark:hover:bg-white/5 flex items-center gap-2"
                  style={{ backgroundColor: "transparent", border: `1px solid ${isDark ? "#475569" : "#cbd5e1"}`, color: isDark ? "#94a3b8" : "#475569" }}
                >
                  <Save className="w-3.5 h-3.5" /> Save as Preset
                </Button>
                <Button onClick={() => successToast("API link copied!")} className="px-3 py-1.5 rounded-xl font-medium transition-colors hover:bg-black/5 dark:hover:bg-white/5 flex items-center gap-2" style={{ backgroundColor: "transparent", border: `1px solid ${isDark ? "#475569" : "#cbd5e1"}`, color: isDark ? "#94a3b8" : "#475569" }}>
                  <Copy className="w-3.5 h-3.5" /> Copy API
                </Button>
                <Button onClick={onClose} className="px-4 py-1.5 rounded-xl font-medium transition-colors hover:bg-black/5 dark:hover:bg-white/5" style={{ backgroundColor: "transparent", border: "none", color: isDark ? "#94a3b8" : "#64748b" }}>
                  Cancel
                </Button>
                <Button type="submit" className="px-5 py-1.5 rounded-xl font-semibold transition-all hover:scale-105" style={{ backgroundColor: "#22B573", color: "#ffffff", border: "none", boxShadow: "0 4px 10px rgba(34, 181, 115, 0.25)" }}>
                  Apply Filters
                </Button>
              </div>
            </div>
          </div>
        </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
};

export default FilterModal;
