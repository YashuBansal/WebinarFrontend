import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { useForm, Controller } from "react-hook-form";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "../../../components/ui/dropdown-menu";
import { ChevronDown, X, Filter, RotateCcw } from "lucide-react";
import { closeModal } from "../../../features/slices/modalSlice";
import { setWebinarAttendeesFilters } from "../../../features/slices/filters.slice";
import { filterTruthyValues, successToast } from "../../../utils/extra";
import useAddUserActivity from "../../../hooks/useAddUserActivity";
import { useTheme } from "../../../contexts/ThemeContext";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { getCustomOptionsForFilters } from "../../../features/actions/globalData";
import tagsService from "../../../services/tagsService";
import EmployeeAssignmentsConditionalLogicPanel from "../../../components/Filter/EmployeeAssignmentsConditionalLogicPanel";
import { DatePicker } from "../../../components/ui/date-picker";

const FONT = "Inter, sans-serif";

const formatDateForInput = (dateStr) => {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  return Number.isNaN(d.getTime()) ? null : d;
};

const EmployeeAssignmentsFilterModal = ({
  modalName,
  setPage,
  tabValue,
}) => {
  const dispatch = useDispatch();
  const logUserActivity = useAddUserActivity();
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const { modals } = useSelector((state) => state.modals);
  const open = modals[modalName] ? true : false;
  
  const { webinarAttendeesFilters: filters } = useSelector((state) => state.filters);
  const { customOptionsForFilters } = useSelector((state) => state.globalData);
  const { leadTypeData } = useSelector((state) => state.assign);
  
  const [tagData, setTagData] = useState([]);
  const [leadTypeOptions, setLeadTypeOptions] = useState([]);
  const [statusOptions, setStatusOptions] = useState([]);

  const [filterTab, setFilterTab] = useState("simple");
  const [conditionalMeta, setConditionalMeta] = useState({
    hasOr: false,
    hadExcludeRange: false,
  });
  const conditionalSanitizeRef = useRef((d) => d);

  const { control, handleSubmit, reset, setValue, getValues } = useForm();

  const handleConditionalChainMeta = useCallback((meta) => {
    setConditionalMeta({
      hasOr: Boolean(meta?.hasOr),
      hadExcludeRange: Boolean(meta?.hadExcludeRange),
    });
  }, []);

  const onSubmit = (data) => {
    if (filterTab === "advanced") {
      if (conditionalMeta.hasOr) {
        toast.info(
          "OR between conditions is not supported by the API yet; filters were applied as AND."
        );
      }
      if (conditionalMeta.hadExcludeRange) {
        toast.info(
          "Exclude on numeric ranges was omitted from the request."
        );
      }
    }

    const processedData = filterTab === "advanced"
        ? conditionalSanitizeRef.current(data)
        : { ...data };

    // Map time and date to proper backend fields
    if (processedData.minTime !== "" || processedData.maxTime !== "") {
      processedData.timeInSession = {};
      if (processedData.minTime !== "") processedData.timeInSession.$gte = processedData.minTime;
      if (processedData.maxTime !== "") processedData.timeInSession.$lte = processedData.maxTime;
    }
    delete processedData.minTime;
    delete processedData.maxTime;

    if (processedData.dateFrom !== "" || processedData.dateTo !== "") {
      processedData.createdAt = {};
      if (processedData.dateFrom !== "") processedData.createdAt.$gte = processedData.dateFrom;
      if (processedData.dateTo !== "") processedData.createdAt.$lte = processedData.dateTo;
    }
    delete processedData.dateFrom;
    delete processedData.dateTo;

    // Wrap single select values into arrays as expected by backend DTO
    if (filterTab === "simple") {
      if (processedData.status) processedData.status = [processedData.status];
      if (processedData.leadType) processedData.leadType = [processedData.leadType];
      if (processedData.tags) processedData.tags = [processedData.tags];
      if (processedData.gender) processedData.gender = processedData.gender.toLowerCase();
    }

    const { sortBy, sortOrder, ...payload } = processedData;
    
    const filterData = filterTruthyValues(payload);

    let actualSortBy = "timeInSession";
    if (sortBy === "Name") actualSortBy = "email";
    else if (sortBy === "Date Added") actualSortBy = "createdAt";
    
    let actualSortOrder = sortOrder === "A - Z" ? "asc" : "desc";
    
    if (Object.keys(filterData).length) {
      successToast("Filters Applied");
    }
    dispatch(setWebinarAttendeesFilters({ 
      filters: filterData,
      sortBy: { sortBy: actualSortBy, sortOrder: actualSortOrder },
      recordType: tabValue
    }));
    if (typeof setPage === "function") setPage(1);
    logUserActivity({
      action: "filter",
      type: "to Table",
      detailItem: "Employee Assignments",
    });
    dispatch(closeModal(modalName));
  };

  const resetForm = () => {
    setFilterTab("simple");
    const d = {
      email: "",
      firstName: "",
      lastName: "",
      gender: "",
      minTime: "",
      maxTime: "",
      phone: "",
      location: "",
      profession: "",
      source: "",
      status: "",
      leadType: "",
      tags: "",
      dateFrom: "",
      dateTo: "",
      sortBy: "Time in Session",
      sortOrder: "Z - A",
    };
    reset(d);
    dispatch(setWebinarAttendeesFilters({ filters: {} }));
    if (typeof setPage === "function") setPage(1);
  };

  const onClose = () => {
    dispatch(closeModal(modalName));
  };

  useEffect(() => {
    dispatch(getCustomOptionsForFilters());
    tagsService.getTags().then((res) => {
      if (res?.success && Array.isArray(res?.data)) {
        setTagData(
          res.data.map((tag) => ({
            label: tag.name,
            value: tag.name,
          }))
        );
      }
    });
  }, [dispatch]);

  useEffect(() => {
    if (!leadTypeData) return;
    setLeadTypeOptions(
      leadTypeData.map((item) => ({
        value: item._id,
        label: item.label,
        color: item.color,
      }))
    );
  }, [leadTypeData]);

  useEffect(() => {
    if (Array.isArray(customOptionsForFilters)) {
      setStatusOptions(customOptionsForFilters);
    }
  }, [customOptionsForFilters]);

  useEffect(() => {
    if (!open) {
      return;
    }
    setFilterTab("simple");
    reset({
      email: filters?.email ?? "",
      firstName: filters?.firstName ?? "",
      lastName: filters?.lastName ?? "",
      gender: filters?.gender ?? "",
      minTime: filters?.minTime ?? "",
      maxTime: filters?.maxTime ?? "",
      phone: filters?.phone ?? "",
      location: filters?.location ?? "",
      profession: filters?.profession ?? "",
      source: filters?.source ?? "",
      status: filters?.status ?? "",
      leadType: filters?.leadType ?? "",
      tags: filters?.tags ?? "",
      dateFrom: filters?.dateFrom ?? "",
      dateTo: filters?.dateTo ?? "",
      sortBy: "Time in Session",
      sortOrder: "Z - A",
    });
  }, [open, filters, reset]);

  const shellBorder = isDark ? "#334155" : "#e5e7eb";
  const titleColor = isDark ? "#f8fafc" : "#0f172a";
  const inactiveTabColor = isDark ? "#94a3b8" : "#64748b";
  const labelStyle = {
    fontFamily: FONT,
    fontSize: "10px",
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: "0.04em",
    color: isDark ? "#94a3b8" : "#64748b",
    marginBottom: "6px",
    display: "block",
  };
  const inputStyle = {
    fontFamily: FONT,
    backgroundColor: isDark ? "#0f172a" : "#ffffff",
    border: `1px solid ${isDark ? "#334155" : "#e2e8f0"}`,
    color: isDark ? "#f8fafc" : "#0f172a",
  };
  const ghostBtn = {
    backgroundColor: "transparent",
    border: `1px solid ${isDark ? "#475569" : "#cbd5e1"}`,
    color: isDark ? "#cbd5e1" : "#475569",
  };
  const cancelBtn = {
    backgroundColor: "transparent",
    border: "none",
    color: isDark ? "#94a3b8" : "#64748b",
  };
  const applyBtn = {
    backgroundColor: "#22B573",
    color: "#ffffff",
    border: "none",
    boxShadow: "0 4px 10px rgba(34, 181, 115, 0.25)",
  };

  const portalTarget =
    typeof document !== "undefined" ? document.body : null;
  if (!portalTarget) return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          key="employee-assignment-filter-modal"
          className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6"
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
            className="relative w-full max-w-5xl max-h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden z-10"
            style={{
              backgroundColor: isDark ? "#1e293b" : "#ffffff",
              border: `1px solid ${shellBorder}`,
            }}
            onMouseDown={(e) => e.stopPropagation()}
          >
            <form
              onSubmit={handleSubmit(onSubmit)}
              className="flex flex-col min-h-0 max-h-[90vh]"
            >
              {/* HEADER */}
              <div
                className="flex items-center justify-between p-4 border-b flex-shrink-0"
                style={{ borderColor: shellBorder }}
              >
                <h3
                  className="text-lg font-bold flex items-center gap-2"
                  style={{ fontFamily: FONT, color: titleColor }}
                >
                  <Filter className="w-5 h-5 text-gray-500 shrink-0" />
                  Employee Assignments Filter
                </h3>
                <button
                  type="button"
                  onClick={onClose}
                  className="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/10"
                  aria-label="Close"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              {/* TABS */}
              <div
                className="flex gap-2 px-4 pt-2 border-b flex-shrink-0"
                style={{ borderColor: shellBorder }}
              >
                <button
                  type="button"
                  onClick={() => setFilterTab("simple")}
                  className="px-4 py-2 transition-all duration-300 relative"
                  style={{
                    fontFamily: FONT,
                    fontSize: "13px",
                    fontWeight: 600,
                    color: filterTab === "simple" ? "#22B573" : inactiveTabColor,
                  }}
                >
                  Simple Filters
                  {filterTab === "simple" && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#22B573] rounded-t-full" />
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setFilterTab("advanced")}
                  className="px-4 py-2 transition-all duration-300 relative"
                  style={{
                    fontFamily: FONT,
                    fontSize: "13px",
                    fontWeight: 600,
                    color:
                      filterTab === "advanced" ? "#22B573" : inactiveTabColor,
                  }}
                >
                  Conditional Logic
                  {filterTab === "advanced" && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#22B573] rounded-t-full" />
                  )}
                </button>
              </div>

              {/* BODY */}
              <div
                className="flex-1 min-h-0 overflow-y-auto p-4 space-y-4 custom-scrollbar"
                style={{ borderColor: shellBorder }}
              >
                {filterTab === "simple" ? (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                      {/* Text Fields */}
                      {["email", "firstName", "lastName", "phone", "location", "profession", "source"].map(key => (
                         <div key={key}>
                           <label htmlFor={`filter-${key}`} style={labelStyle}>
                             {key.replace(/([A-Z])/g, ' $1').trim()}
                           </label>
                           <Controller
                             name={key}
                             control={control}
                             defaultValue=""
                             render={({ field }) => (
                               <Input
                                 id={`filter-${key}`}
                                 {...field}
                                 value={field.value || ""}
                                 placeholder={key.replace(/([A-Z])/g, ' $1').trim()}
                                 className="focus:ring-[#22B573]/40"
                                 style={inputStyle}
                               />
                             )}
                           />
                         </div>
                      ))}

                      {/* Select Fields */}
                      <div>
                        <span style={labelStyle}>Gender</span>
                        <Controller
                          name="gender"
                          control={control}
                          defaultValue=""
                          render={({ field }) => (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="outline"
                                  className="flex h-10 w-full items-center justify-between rounded-xl px-4 py-2 text-sm font-medium outline-none transition-all duration-200 hover:bg-black/5 dark:hover:bg-white/10 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700"
                                >
                                  <span className="truncate">
                                    {field.value
                                      ? field.value.charAt(0).toUpperCase() + field.value.slice(1)
                                      : "All"}
                                  </span>
                                  <ChevronDown className="h-4 w-4 opacity-50 shrink-0" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent
                                align="start"
                                className="w-[var(--radix-dropdown-menu-trigger-width)] min-w-[var(--radix-dropdown-menu-trigger-width)] max-h-[300px] z-[10000] overflow-y-auto overflow-x-hidden custom-scrollbar bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-xl p-1"
                              >
                                <DropdownMenuItem
                                  onClick={() => field.onChange("")}
                                  className="cursor-pointer rounded-lg px-3 py-2 text-sm font-bold hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200"
                                >
                                  All
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => field.onChange("male")}
                                  className="cursor-pointer rounded-lg px-3 py-2 text-sm font-bold hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200"
                                >
                                  Male
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => field.onChange("female")}
                                  className="cursor-pointer rounded-lg px-3 py-2 text-sm font-bold hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200"
                                >
                                  Female
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => field.onChange("others")}
                                  className="cursor-pointer rounded-lg px-3 py-2 text-sm font-bold hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200"
                                >
                                  Other
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}
                        />
                      </div>
                      <div>
                        <span style={labelStyle}>Status</span>
                        <Controller
                          name="status"
                          control={control}
                          defaultValue=""
                          render={({ field }) => (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="outline"
                                  className="flex h-10 w-full items-center justify-between rounded-xl px-4 py-2 text-sm font-medium outline-none transition-all duration-200 hover:bg-black/5 dark:hover:bg-white/10 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700"
                                >
                                  <span className="truncate">
                                    {field.value || "All"}
                                  </span>
                                  <ChevronDown className="h-4 w-4 opacity-50 shrink-0" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent
                                align="start"
                                className="w-[var(--radix-dropdown-menu-trigger-width)] min-w-[var(--radix-dropdown-menu-trigger-width)] max-h-[300px] z-[10000] overflow-y-auto overflow-x-hidden custom-scrollbar bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-xl p-1"
                              >
                                <DropdownMenuItem
                                  onClick={() => field.onChange("")}
                                  className="cursor-pointer rounded-lg px-3 py-2 text-sm font-bold hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200"
                                >
                                  All
                                </DropdownMenuItem>
                                {statusOptions.map((opt) => (
                                  <DropdownMenuItem
                                    key={opt.value}
                                    onClick={() => field.onChange(opt.label)}
                                    className="cursor-pointer rounded-lg px-3 py-2 text-sm font-bold hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200"
                                  >
                                    {opt.label}
                                  </DropdownMenuItem>
                                ))}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}
                        />
                      </div>
                      <div>
                        <span style={labelStyle}>Lead Type</span>
                        <Controller
                          name="leadType"
                          control={control}
                          defaultValue=""
                          render={({ field }) => (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="outline"
                                  className="flex h-10 w-full items-center justify-between rounded-xl px-4 py-2 text-sm font-medium outline-none transition-all duration-200 hover:bg-black/5 dark:hover:bg-white/10 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700"
                                >
                                  <span className="truncate">
                                    {field.value
                                      ? leadTypeOptions.find((o) => o.value === field.value)?.label
                                      : "All"}
                                  </span>
                                  <ChevronDown className="h-4 w-4 opacity-50 shrink-0" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent
                                align="start"
                                className="w-[var(--radix-dropdown-menu-trigger-width)] min-w-[var(--radix-dropdown-menu-trigger-width)] max-h-[300px] z-[10000] overflow-y-auto overflow-x-hidden custom-scrollbar bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-xl p-1"
                              >
                                <DropdownMenuItem
                                  onClick={() => field.onChange("")}
                                  className="cursor-pointer rounded-lg px-3 py-2 text-sm font-bold hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200"
                                >
                                  All
                                </DropdownMenuItem>
                                {leadTypeOptions.map((opt) => (
                                  <DropdownMenuItem
                                    key={opt.value}
                                    onClick={() => field.onChange(opt.value)}
                                    className="cursor-pointer rounded-lg px-3 py-2 text-sm font-bold hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 flex items-center gap-2"
                                  >
                                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: opt.color }} />
                                    {opt.label}
                                  </DropdownMenuItem>
                                ))}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}
                        />
                      </div>
                      <div>
                        <span style={labelStyle}>Tags</span>
                        <Controller
                          name="tags"
                          control={control}
                          defaultValue=""
                          render={({ field }) => (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="outline"
                                  className="flex h-10 w-full items-center justify-between rounded-xl px-4 py-2 text-sm font-medium outline-none transition-all duration-200 hover:bg-black/5 dark:hover:bg-white/10 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700"
                                >
                                  <span className="truncate">
                                    {field.value || "All"}
                                  </span>
                                  <ChevronDown className="h-4 w-4 opacity-50 shrink-0" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent
                                align="start"
                                className="w-[var(--radix-dropdown-menu-trigger-width)] min-w-[var(--radix-dropdown-menu-trigger-width)] max-h-[300px] z-[10000] overflow-y-auto overflow-x-hidden custom-scrollbar bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-xl p-1"
                              >
                                <DropdownMenuItem
                                  onClick={() => field.onChange("")}
                                  className="cursor-pointer rounded-lg px-3 py-2 text-sm font-bold hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200"
                                >
                                  All
                                </DropdownMenuItem>
                                {tagData.map((opt) => (
                                  <DropdownMenuItem
                                    key={opt.value}
                                    onClick={() => field.onChange(opt.value)}
                                    className="cursor-pointer rounded-lg px-3 py-2 text-sm font-bold hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200"
                                  >
                                    {opt.label}
                                  </DropdownMenuItem>
                                ))}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}
                        />
                      </div>

                      {/* Number Fields */}
                      <div>
                        <label htmlFor="minTime" style={labelStyle}>
                          Time in Session (Min)
                        </label>
                        <Controller
                          name="minTime"
                          control={control}
                          defaultValue=""
                          render={({ field }) => (
                            <Input
                              id="minTime"
                              type="number"
                              min={0}
                              {...field}
                              onChange={(e) => {
                                const val = e.target.value;
                                field.onChange(val === "" ? "" : Number(val));
                              }}
                              value={field.value ?? ""}
                              className="focus:ring-[#22B573]/40"
                              style={inputStyle}
                            />
                          )}
                        />
                      </div>
                      <div>
                        <label htmlFor="maxTime" style={labelStyle}>
                          Time in Session (Max)
                        </label>
                        <Controller
                          name="maxTime"
                          control={control}
                          defaultValue=""
                          render={({ field }) => (
                            <Input
                              id="maxTime"
                              type="number"
                              min={0}
                              {...field}
                              onChange={(e) => {
                                const val = e.target.value;
                                field.onChange(val === "" ? "" : Number(val));
                              }}
                              value={field.value ?? ""}
                              className="focus:ring-[#22B573]/40"
                              style={inputStyle}
                            />
                          )}
                        />
                      </div>
                      
                      {/* Date Fields */}
                      <div>
                        <label htmlFor="dateFrom" style={labelStyle}>
                          Assignment Date (From)
                        </label>
                        <Controller
                          name="dateFrom"
                          control={control}
                          defaultValue=""
                          render={({ field }) => (
                            <DatePicker
                              date={formatDateForInput(field.value)}
                              setDate={(date) => {
                                field.onChange(
                                  date
                                    ? `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`
                                    : ""
                                );
                              }}
                              className="w-full h-10"
                              style={inputStyle}
                              placeholder="From"
                            />
                          )}
                        />
                      </div>
                      <div>
                        <label htmlFor="dateTo" style={labelStyle}>
                          Assignment Date (To)
                        </label>
                        <Controller
                          name="dateTo"
                          control={control}
                          defaultValue=""
                          render={({ field }) => (
                            <DatePicker
                              date={formatDateForInput(field.value)}
                              setDate={(date) => {
                                field.onChange(
                                  date
                                    ? `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`
                                    : ""
                                );
                              }}
                              className="w-full h-10"
                              style={inputStyle}
                              placeholder="To"
                            />
                          )}
                        />
                      </div>
                    </div>
                  </>
                ) : (
                  <EmployeeAssignmentsConditionalLogicPanel
                    active={filterTab === "advanced"}
                    control={control}
                    setValue={setValue}
                    getValues={getValues}
                    onChainMeta={handleConditionalChainMeta}
                    sanitizerRef={conditionalSanitizeRef}
                    inputStyle={inputStyle}
                    isDark={isDark}
                    customOptionsForFilters={statusOptions}
                    leadTypeOptions={leadTypeOptions}
                    tagData={tagData}
                  />
                )}
              </div>

              {/* FOOTER */}
              <div
                className="p-4 border-t flex flex-wrap items-end md:items-center justify-between gap-3 flex-shrink-0"
                style={{ borderColor: shellBorder, backgroundColor: isDark ? "rgba(15,23,42,0.85)" : "#F9FAFB" }}
              >
                {/* SORT OPTIONS */}
                <div className="flex gap-3 w-full sm:w-auto">
                  <div>
                    <label style={labelStyle}>Sort By</label>
                    <Controller
                      name="sortBy"
                      control={control}
                      defaultValue="Time in Session"
                      render={({ field }) => (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="outline"
                              className="flex h-10 min-w-[160px] items-center justify-between rounded-xl px-4 py-2 text-sm font-medium outline-none transition-all duration-200 hover:bg-black/5 dark:hover:bg-white/10 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700"
                            >
                              <span className="truncate">
                                {field.value || "Time in Session"}
                              </span>
                              <ChevronDown className="h-4 w-4 opacity-50 shrink-0" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent
                            align="start"
                            className="w-[var(--radix-dropdown-menu-trigger-width)] min-w-[var(--radix-dropdown-menu-trigger-width)] max-h-[300px] z-[10000] overflow-y-auto overflow-x-hidden custom-scrollbar bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-xl p-1"
                          >
                            {["Time in Session", "Name", "Date Added"].map((opt) => (
                              <DropdownMenuItem
                                key={opt}
                                onClick={() => field.onChange(opt)}
                                className="cursor-pointer rounded-lg px-3 py-2 text-sm font-bold hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200"
                              >
                                {opt}
                              </DropdownMenuItem>
                            ))}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>Order</label>
                    <Controller
                      name="sortOrder"
                      control={control}
                      defaultValue="Z - A"
                      render={({ field }) => (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="outline"
                              className="flex h-10 min-w-[100px] items-center justify-between rounded-xl px-4 py-2 text-sm font-medium outline-none transition-all duration-200 hover:bg-black/5 dark:hover:bg-white/10 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700"
                            >
                              <span className="truncate">
                                {field.value || "Z - A"}
                              </span>
                              <ChevronDown className="h-4 w-4 opacity-50 shrink-0" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent
                            align="start"
                            className="w-[var(--radix-dropdown-menu-trigger-width)] min-w-[var(--radix-dropdown-menu-trigger-width)] max-h-[300px] z-[10000] overflow-y-auto overflow-x-hidden custom-scrollbar bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-xl p-1"
                          >
                            {["Z - A", "A - Z"].map((opt) => (
                              <DropdownMenuItem
                                key={opt}
                                onClick={() => field.onChange(opt)}
                                className="cursor-pointer rounded-lg px-3 py-2 text-sm font-bold hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200"
                              >
                                {opt}
                              </DropdownMenuItem>
                            ))}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    />
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 w-full md:w-auto justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={resetForm}
                    className="rounded-xl flex items-center gap-2"
                    style={ghostBtn}
                  >
                    <RotateCcw className="w-4 h-4" /> Reset
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={onClose}
                    className="rounded-xl px-4"
                    style={cancelBtn}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="rounded-xl px-5 font-semibold"
                    style={applyBtn}
                  >
                    Apply Filters
                  </Button>
                </div>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    portalTarget
  );
};

export default EmployeeAssignmentsFilterModal;
