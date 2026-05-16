import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { useForm, Controller } from "react-hook-form";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { closeModal } from "../../../features/slices/modalSlice";
import { useDispatch, useSelector } from "react-redux";
import {
  DateFormat,
  filterTruthyValues,
  successToast,
} from "../../../utils/extra";
import Select from "react-select";
import { setAllAttendeesFilters } from "../../../features/slices/filters.slice";
import { allAttendeesSortByOptions } from "../../../utils/columnData";
import { getCustomOptionsForFilters } from "../../../features/actions/globalData";
import { getAllProductsByAdminId } from "../../../features/actions/product";
import tagsService from "../../../services/tagsService";
import CreatableSelect from "react-select/creatable";
import useUserSubscription from "../../../hooks/useUserSubscription";
import {
  CalendarDays,
  Copy,
  Filter,
  RotateCcw,
  Save,
  X,
  ChevronDown,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "../../../components/ui/dropdown-menu";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { useTheme } from "../../../contexts/ThemeContext";
import AttendeeConditionalLogicPanel from "./AttendeeConditionalLogicPanel";

const FONT = "Inter, sans-serif";

const getDefaultFilterForm = () => ({
  email: "",
  "timeInSession.$gte": "",
  "timeInSession.$lte": "",
  "createdAt.$gte": null,
  "createdAt.$lte": null,
  "attendedWebinarCount.$gte": "",
  "attendedWebinarCount.$lte": "",
  "registeredWebinarCount.$gte": "",
  "registeredWebinarCount.$lte": "",
  leadType: [],
  lastAssignedTo: "",
  enrollments: [],
  tags: [],
  reminderAssignedTo: [],
  salesAssignedTo: [],
  reminderLastStatus: [],
  salesLastStatus: [],
  locations: [],
  professions: [],
  sources: [],
});

const normalizePickerDate = (v) => {
  if (v == null || v === "") return null;
  if (v instanceof Date && !Number.isNaN(v.getTime())) return v;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d;
};

const GroupedAttendeeFilterModal = ({
  modalName,
  setPage,
  handleCopy,
  onOpenPresetModal,
}) => {
  const dispatch = useDispatch();
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const { modals } = useSelector((state) => state.modals);
  const open = Boolean(modals[modalName]);
  const { userData } = useSelector((state) => state.auth);
  const pickerDateFormat =
    userData?.dateFormat || DateFormat.MM_DD_YYYY;

  const { control, handleSubmit, reset, watch, setValue, getValues } =
    useForm();

  const { leadTypeData } = useSelector((state) => state.assign);
  const { data: subscription } = useUserSubscription();
  const tableConfig = subscription?.plan?.attendeeTableConfig || {};
  const { allAttendeesFilters, allAttendeesSortBy } = useSelector(
    (state) => state.filters
  );
  const { productDropdownData } = useSelector((state) => state.product);
  const { customOptionsForFilters } = useSelector((state) => state.globalData);
  const { employeeData } = useSelector((state) => state.employee);

  const [sortBy, setSortBy] = useState(
    allAttendeesSortBy || {
      sortBy: allAttendeesSortByOptions[0].value,
      sortOrder: "asc",
    }
  );
  const [filterTab, setFilterTab] = useState("simple");
  const [conditionalHasOr, setConditionalHasOr] = useState(false);
  const [leadTypeOptions, setLeadTypeOptions] = useState([]);
  const [productOptions, setProductOptions] = useState([]);
  const [tagData, setTagData] = useState([]);
  const [salesOptions, setSalesOptions] = useState([]);
  const [reminderOptions, setReminderOptions] = useState([]);

  const isFilterEnabled = useCallback(
    (key) => tableConfig?.[key]?.filterable !== false,
    [tableConfig]
  );

  const handleConditionalChainMeta = useCallback((meta) => {
    setConditionalHasOr(Boolean(meta?.hasOr));
  }, []);

  const labelStyle = useMemo(
    () => ({
      fontFamily: FONT,
      fontSize: "10px",
      fontWeight: 700,
      textTransform: "uppercase",
      letterSpacing: "0.04em",
      color: isDark ? "#94a3b8" : "#64748b",
      marginBottom: "4px",
      display: "block",
    }),
    [isDark]
  );

  const inputStyle = useMemo(
    () => ({
      fontFamily: FONT,
      backgroundColor: isDark ? "#0f172a" : "#ffffff",
      border: `1px solid ${isDark ? "#334155" : "#e2e8f0"}`,
      color: isDark ? "#f8fafc" : "#0f172a",
    }),
    [isDark]
  );

  const rsStyles = useMemo(
    () => ({
      control: (base) => ({
        ...base,
        minHeight: 38,
        borderRadius: 12,
        fontSize: 14,
        backgroundColor: isDark ? "#0f172a" : "#ffffff",
        borderColor: isDark ? "#334155" : "#e2e8f0",
        boxShadow: "none",
      }),
      menuPortal: (base) => ({ ...base, zIndex: 10000 }),
      multiValue: (base) => ({
        ...base,
        backgroundColor: isDark ? "#334155" : "#e2e8f0",
      }),
      multiValueLabel: (base) => ({
        ...base,
        color: isDark ? "#f8fafc" : "#0f172a",
      }),
      singleValue: (base) => ({
        ...base,
        color: isDark ? "#f8fafc" : "#0f172a",
      }),
      input: (base) => ({
        ...base,
        color: isDark ? "#f8fafc" : "#0f172a",
      }),
      placeholder: (base) => ({
        ...base,
        color: isDark ? "#64748b" : "#94a3b8",
      }),
      menu: (base) => ({
        ...base,
        backgroundColor: isDark ? "#1e293b" : "#ffffff",
        border: `1px solid ${isDark ? "#334155" : "#e2e8f0"}`,
        borderRadius: "12px",
        boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)",
        overflow: "hidden",
      }),
      option: (base, { isFocused, isSelected }) => ({
        ...base,
        backgroundColor: isSelected
          ? "#22B573"
          : isFocused
          ? isDark
            ? "rgba(255,255,255,0.1)"
            : "rgba(0,0,0,0.05)"
          : "transparent",
        color: isSelected ? "#ffffff" : isDark ? "#f8fafc" : "#0f172a",
        cursor: "pointer",
        ":active": {
          backgroundColor: isDark ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.1)",
        },
      }),
    }),
    [isDark]
  );

  const onSubmit = (data) => {
    if (conditionalHasOr) {
      toast.message(
        "OR between conditions is not supported by the API yet; filters were applied as AND."
      );
    }
    const filterData = filterTruthyValues(data);
    if (Object.keys(filterData).length) {
      successToast("Filters Applied");
    }
    dispatch(
      setAllAttendeesFilters({
        filters: filterData,
        sortBy: sortBy,
      })
    );
    setPage(1);
    onClose();
  };

  const onCopy = (e) => {
    e.preventDefault();
    const formValues = watch();
    const filterData = filterTruthyValues(formValues);
    handleCopy(filterData, sortBy);
  };

  const onClose = () => {
    dispatch(closeModal(modalName));
  };

  const resetForm = () => {
    reset(getDefaultFilterForm());
    setSortBy({
      sortBy: allAttendeesSortByOptions[0].value,
      sortOrder: "asc",
    });
  };

  useEffect(() => {
    if (!open) return undefined;
    document.body.style.overflow = "hidden";
    setSortBy(
      allAttendeesSortBy || {
        sortBy: allAttendeesSortByOptions[0].value,
        sortOrder: "asc",
      }
    );
    reset({
      ...getDefaultFilterForm(),
      ...allAttendeesFilters,
    });
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [open]);

  useEffect(() => {
    if (open) setFilterTab("simple");
  }, [open]);

  useEffect(() => {
    dispatch(getCustomOptionsForFilters());
    dispatch(getAllProductsByAdminId());

    tagsService.getTags().then((res) => {
      if (res?.success) {
        if (Array.isArray(res?.data)) {
          setTagData(
            res.data.map((tag) => ({
              label: tag.name,
              value: tag.name,
            }))
          );
        }
      }
    });
  }, [dispatch]);

  useEffect(() => {
    if (!leadTypeData) return;
    const options = leadTypeData.map((item) => ({
      value: item._id,
      label: item.label,
      color: item.color,
    }));
    setLeadTypeOptions(options);
  }, [leadTypeData]);

  useEffect(() => {
    if (!Array.isArray(employeeData)) return;

    setReminderOptions(
      employeeData
        .filter((emp) => emp.role === "EMPLOYEE_REMINDER")
        .map((item) => ({
          value: item._id,
          label: item.userName,
        }))
    );
    setSalesOptions(
      employeeData
        .filter((emp) => emp.role === "EMPLOYEE_SALES")
        .map((item) => ({
          value: item._id,
          label: item.userName,
        }))
    );
  }, [employeeData]);

  useEffect(() => {
    if (!productDropdownData) return;
    const options = productDropdownData.map((item) => ({
      value: item._id,
      label: `${item.name} | Level - ${item.level}`,
    }));
    setProductOptions(options);
  }, [productDropdownData]);

  const shellBorder = isDark ? "#334155" : "#e5e7eb";
  const titleColor = isDark ? "#f8fafc" : "#0f172a";
  const tabInactive = isDark ? "#94a3b8" : "#64748b";
  const footerBg = isDark ? "rgba(15,23,42,0.85)" : "#F9FAFB";
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

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          key="attendee-filter-modal-container"
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
            className="relative w-full max-w-[1200px] max-h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden z-10"
            style={{
              backgroundColor: isDark ? "#1e293b" : "#ffffff",
              border: `1px solid ${shellBorder}`,
            }}
            onMouseDown={(e) => e.stopPropagation()}
          >
            <form
              onSubmit={handleSubmit(onSubmit)}
              className="flex h-full min-h-0 flex-col"
            >
              <div
                className="flex items-center justify-between p-4 border-b flex-shrink-0"
                style={{ borderColor: shellBorder }}
              >
                <h3
                  className="text-lg font-bold flex items-center gap-2"
                  style={{ fontFamily: FONT, color: titleColor }}
                >
                  <Filter className="w-5 h-5 text-gray-500 shrink-0" />
                  Attendee Filters
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
                    color: filterTab === "simple" ? "#22B573" : tabInactive,
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
                    color: filterTab === "advanced" ? "#22B573" : tabInactive,
                  }}
                >
                  Conditional Logic
                  {filterTab === "advanced" && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#22B573] rounded-t-full" />
                  )}
                </button>
              </div>

              <div className="p-4 overflow-y-auto max-h-[60vh] custom-scrollbar flex-1 min-h-0">
                {filterTab === "simple" ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-4 gap-y-3">
                    {isFilterEnabled("email") && (
                      <div>
                        <span style={labelStyle}>Email</span>
                        <Controller
                          name="email"
                          control={control}
                          render={({ field }) => (
                            <Input
                              {...field}
                              type="text"
                              placeholder="example@mail.com"
                              className="w-full p-2 rounded-xl text-sm focus:outline-none focus:ring-2"
                              style={inputStyle}
                            />
                          )}
                        />
                      </div>
                    )}

                    {isFilterEnabled("locations") && (
                      <div>
                        <span style={labelStyle}>Locations</span>
                        <Controller
                          control={control}
                          name="locations"
                          defaultValue={[]}
                          render={({ field }) => (
                            <CreatableSelect
                              isMulti
                              isClearable
                              styles={{
                                ...rsStyles,
                                menu: (provided, state) => ({
                                  ...provided,
                                  display: state.options?.length
                                    ? "block"
                                    : "none",
                                }),
                              }}
                              value={
                                field.value?.map((location) => ({
                                  value: location,
                                  label: location,
                                })) || []
                              }
                              onChange={(selectedOptions) => {
                                field.onChange(
                                  selectedOptions
                                    ? selectedOptions.map((o) => o.value)
                                    : []
                                );
                              }}
                              className="w-full text-sm"
                              placeholder="Mumbai, Delhi..."
                              menuPortalTarget={document.body}
                              components={{
                                DropdownIndicator: () => null,
                                IndicatorSeparator: () => null,
                              }}
                            />
                          )}
                        />
                      </div>
                    )}

                    {isFilterEnabled("professions") && (
                      <div>
                        <span style={labelStyle}>Professions</span>
                        <Controller
                          control={control}
                          name="professions"
                          defaultValue={[]}
                          render={({ field }) => (
                            <CreatableSelect
                              isMulti
                              isClearable
                              styles={{
                                ...rsStyles,
                                menu: (provided, state) => ({
                                  ...provided,
                                  display: state.options?.length
                                    ? "block"
                                    : "none",
                                }),
                              }}
                              value={
                                field.value?.map((prof) => ({
                                  value: prof,
                                  label: prof,
                                })) || []
                              }
                              onChange={(selectedOptions) => {
                                field.onChange(
                                  selectedOptions
                                    ? selectedOptions.map((o) => o.value)
                                    : []
                                );
                              }}
                              className="w-full text-sm"
                              placeholder="Developer..."
                              menuPortalTarget={document.body}
                              components={{
                                DropdownIndicator: () => null,
                                IndicatorSeparator: () => null,
                              }}
                            />
                          )}
                        />
                      </div>
                    )}

                    {isFilterEnabled("sources") && (
                      <div>
                        <span style={labelStyle}>Sources</span>
                        <Controller
                          control={control}
                          name="sources"
                          defaultValue={[]}
                          render={({ field }) => (
                            <CreatableSelect
                              isMulti
                              isClearable
                              styles={{
                                ...rsStyles,
                                menu: (provided, state) => ({
                                  ...provided,
                                  display: state.options?.length
                                    ? "block"
                                    : "none",
                                }),
                              }}
                              value={
                                field.value?.map((source) => ({
                                  value: source,
                                  label: source,
                                })) || []
                              }
                              onChange={(selectedOptions) => {
                                field.onChange(
                                  selectedOptions
                                    ? selectedOptions.map((o) => o.value)
                                    : []
                                );
                              }}
                              className="w-full text-sm"
                              placeholder="Facebook Ads..."
                              menuPortalTarget={document.body}
                              components={{
                                DropdownIndicator: () => null,
                                IndicatorSeparator: () => null,
                              }}
                            />
                          )}
                        />
                      </div>
                    )}

                    {isFilterEnabled("leadType") && (
                      <div>
                        <span style={labelStyle}>Lead Type</span>
                        <Controller
                          control={control}
                          name="leadType"
                          render={({ field }) => (
                            <Select
                              isMulti
                              value={leadTypeOptions.filter((option) =>
                                field.value?.includes(option.value)
                              )}
                              onChange={(selectedOptions) => {
                                field.onChange(
                                  selectedOptions?.map((o) => o.value) ?? []
                                );
                              }}
                              className="w-full text-sm"
                              options={leadTypeOptions}
                              isClearable
                              placeholder="All Types"
                              menuPlacement="auto"
                              menuPortalTarget={document.body}
                              styles={rsStyles}
                              getOptionLabel={(e) => (
                                <div className="flex items-center gap-2">
                                  <div
                                    style={{ backgroundColor: e.color }}
                                    className="w-8 h-4 rounded-sm shrink-0"
                                  />
                                  {e.label}
                                </div>
                              )}
                            />
                          )}
                        />
                      </div>
                    )}

                    {isFilterEnabled("enrollments") && (
                      <div>
                        <span style={labelStyle}>Enrollments</span>
                        <Controller
                          control={control}
                          name="enrollments"
                          render={({ field }) => (
                            <Select
                              isMulti
                              value={productOptions.filter((option) =>
                                field.value?.includes(option.value)
                              )}
                              className="w-full text-sm"
                              options={productOptions}
                              onChange={(selectedOptions) => {
                                field.onChange(
                                  selectedOptions?.map((o) => o.value) ?? []
                                );
                              }}
                              isClearable
                              placeholder="Any"
                              menuPlacement="auto"
                              menuPortalTarget={document.body}
                              styles={rsStyles}
                            />
                          )}
                        />
                      </div>
                    )}

                    {isFilterEnabled("createdAt") && (
                      <>
                        <div>
                          <span style={labelStyle}>Start Date</span>
                          <div className="relative">
                            <Controller
                              name="createdAt.$gte"
                              control={control}
                              render={({ field }) => (
                                <DatePicker
                                  selected={normalizePickerDate(field.value)}
                                  onChange={(date) => field.onChange(date)}
                                  placeholderText="mm/dd/yyyy"
                                  dateFormat={pickerDateFormat}
                                  isClearable
                                  customInput={
                                    <Input
                                      className="w-full p-2 rounded-xl text-sm focus:outline-none focus:ring-2 pr-9"
                                      style={inputStyle}
                                    />
                                  }
                                />
                              )}
                            />
                            <CalendarDays className="pointer-events-none absolute right-3 top-2.5 h-4 w-4 text-gray-500" />
                          </div>
                        </div>
                        <div>
                          <span style={labelStyle}>End Date</span>
                          <div className="relative">
                            <Controller
                              name="createdAt.$lte"
                              control={control}
                              render={({ field }) => (
                                <DatePicker
                                  selected={normalizePickerDate(field.value)}
                                  onChange={(date) => field.onChange(date)}
                                  placeholderText="mm/dd/yyyy"
                                  dateFormat={pickerDateFormat}
                                  isClearable
                                  customInput={
                                    <Input
                                      className="w-full p-2 rounded-xl text-sm focus:outline-none focus:ring-2 pr-9"
                                      style={inputStyle}
                                    />
                                  }
                                />
                              )}
                            />
                            <CalendarDays className="pointer-events-none absolute right-3 top-2.5 h-4 w-4 text-gray-500" />
                          </div>
                        </div>
                      </>
                    )}

                    {isFilterEnabled("timeInSession") && (
                      <div>
                        <span style={labelStyle}>Time In Session (mins)</span>
                        <div className="flex gap-2">
                          <Controller
                            name="timeInSession.$gte"
                            control={control}
                            rules={{ min: 0 }}
                            render={({ field }) => (
                              <Input
                                {...field}
                                type="number"
                                min="0"
                                placeholder="Min"
                                className="w-full p-2 rounded-xl text-sm focus:outline-none focus:ring-2"
                                style={inputStyle}
                                onChange={(e) => {
                                  const value = e.target.value;
                                  field.onChange(
                                    value === "" ? "" : Number(value)
                                  );
                                }}
                              />
                            )}
                          />
                          <Controller
                            name="timeInSession.$lte"
                            control={control}
                            rules={{ min: 0 }}
                            render={({ field }) => (
                              <Input
                                {...field}
                                type="number"
                                min="0"
                                placeholder="Max"
                                className="w-full p-2 rounded-xl text-sm focus:outline-none focus:ring-2"
                                style={inputStyle}
                                onChange={(e) => {
                                  const value = e.target.value;
                                  field.onChange(
                                    value === "" ? "" : Number(value)
                                  );
                                }}
                              />
                            )}
                          />
                        </div>
                      </div>
                    )}

                    {isFilterEnabled("registeredWebinarCount") && (
                      <div>
                        <span style={labelStyle}>Webinar Reg.</span>
                        <div className="flex gap-2">
                          <Controller
                            name="registeredWebinarCount.$gte"
                            control={control}
                            rules={{ min: 0 }}
                            render={({ field }) => (
                              <Input
                                {...field}
                                type="number"
                                min="0"
                                placeholder="Min"
                                className="w-full p-2 rounded-xl text-sm focus:outline-none focus:ring-2"
                                style={inputStyle}
                                onChange={(e) => {
                                  const value = e.target.value;
                                  field.onChange(
                                    value === "" ? "" : Number(value)
                                  );
                                }}
                              />
                            )}
                          />
                          <Controller
                            name="registeredWebinarCount.$lte"
                            control={control}
                            rules={{ min: 0 }}
                            render={({ field }) => (
                              <Input
                                {...field}
                                type="number"
                                min="0"
                                placeholder="Max"
                                className="w-full p-2 rounded-xl text-sm focus:outline-none focus:ring-2"
                                style={inputStyle}
                                onChange={(e) => {
                                  const value = e.target.value;
                                  field.onChange(
                                    value === "" ? "" : Number(value)
                                  );
                                }}
                              />
                            )}
                          />
                        </div>
                      </div>
                    )}

                    {isFilterEnabled("attendedWebinarCount") && (
                      <div>
                        <span style={labelStyle}>Webinar Att.</span>
                        <div className="flex gap-2">
                          <Controller
                            name="attendedWebinarCount.$gte"
                            control={control}
                            rules={{ min: 0 }}
                            render={({ field }) => (
                              <Input
                                {...field}
                                type="number"
                                min="0"
                                placeholder="Min"
                                className="w-full p-2 rounded-xl text-sm focus:outline-none focus:ring-2"
                                style={inputStyle}
                                onChange={(e) => {
                                  const value = e.target.value;
                                  field.onChange(
                                    value === "" ? "" : Number(value)
                                  );
                                }}
                              />
                            )}
                          />
                          <Controller
                            name="attendedWebinarCount.$lte"
                            control={control}
                            rules={{ min: 0 }}
                            render={({ field }) => (
                              <Input
                                {...field}
                                type="number"
                                min="0"
                                placeholder="Max"
                                className="w-full p-2 rounded-xl text-sm focus:outline-none focus:ring-2"
                                style={inputStyle}
                                onChange={(e) => {
                                  const value = e.target.value;
                                  field.onChange(
                                    value === "" ? "" : Number(value)
                                  );
                                }}
                              />
                            )}
                          />
                        </div>
                      </div>
                    )}

                    {isFilterEnabled("tags") && (
                      <div>
                        <span style={labelStyle}>Tags</span>
                        <Controller
                          control={control}
                          name="tags"
                          render={({ field }) => (
                            <Select
                              isMulti
                              value={tagData.filter((option) =>
                                field.value?.includes(option.value)
                              )}
                              className="w-full text-sm"
                              options={tagData}
                              onChange={(selectedOptions) => {
                                field.onChange(
                                  selectedOptions?.map((o) => o.value) ?? []
                                );
                              }}
                              isClearable
                              placeholder="Select Tags..."
                              menuPlacement="auto"
                              menuPortalTarget={document.body}
                              styles={rsStyles}
                            />
                          )}
                        />
                      </div>
                    )}

                    {isFilterEnabled("reminderAssignedTo") && (
                      <div>
                        <span style={labelStyle}>Reminder Assigned To</span>
                        <Controller
                          control={control}
                          name="reminderAssignedTo"
                          render={({ field }) => (
                            <Select
                              isMulti
                              value={reminderOptions.filter((option) =>
                                field.value?.includes(option.value)
                              )}
                              onChange={(selectedOptions) => {
                                field.onChange(
                                  selectedOptions?.map((o) => o.value) ?? []
                                );
                              }}
                              className="w-full text-sm"
                              options={reminderOptions}
                              isClearable
                              menuPlacement="auto"
                              menuPortalTarget={document.body}
                              styles={rsStyles}
                              placeholder="Any User"
                            />
                          )}
                        />
                      </div>
                    )}

                    {isFilterEnabled("salesAssignedTo") && (
                      <div>
                        <span style={labelStyle}>Sales Assigned To</span>
                        <Controller
                          control={control}
                          name="salesAssignedTo"
                          render={({ field }) => (
                            <Select
                              isMulti
                              value={salesOptions.filter((option) =>
                                field.value?.includes(option.value)
                              )}
                              onChange={(selectedOptions) => {
                                field.onChange(
                                  selectedOptions?.map((o) => o.value) ?? []
                                );
                              }}
                              className="w-full text-sm"
                              options={salesOptions}
                              isClearable
                              menuPlacement="auto"
                              menuPortalTarget={document.body}
                              styles={rsStyles}
                              placeholder="Any User"
                            />
                          )}
                        />
                      </div>
                    )}

                    {isFilterEnabled("reminderLastStatus") && (
                      <div>
                        <span style={labelStyle}>Reminder Last Status</span>
                        <Controller
                          control={control}
                          name="reminderLastStatus"
                          render={({ field }) => (
                            <Select
                              isMulti
                              value={customOptionsForFilters.filter((option) =>
                                field.value?.includes(option.label)
                              )}
                              onChange={(selectedOptions) => {
                                field.onChange(
                                  selectedOptions?.map((o) => o.label) ?? []
                                );
                              }}
                              className="w-full text-sm"
                              options={customOptionsForFilters}
                              isClearable
                              placeholder="All Statuses"
                              menuPlacement="top"
                              menuPortalTarget={document.body}
                              styles={rsStyles}
                            />
                          )}
                        />
                      </div>
                    )}

                    {isFilterEnabled("salesLastStatus") && (
                      <div>
                        <span style={labelStyle}>Sales Last Status</span>
                        <Controller
                          control={control}
                          name="salesLastStatus"
                          render={({ field }) => (
                            <Select
                              isMulti
                              value={customOptionsForFilters.filter((option) =>
                                field.value?.includes(option.label)
                              )}
                              onChange={(selectedOptions) => {
                                field.onChange(
                                  selectedOptions?.map((o) => o.label) ?? []
                                );
                              }}
                              className="w-full text-sm"
                              options={customOptionsForFilters}
                              isClearable
                              placeholder="All Statuses"
                              menuPlacement="top"
                              menuPortalTarget={document.body}
                              styles={rsStyles}
                            />
                          )}
                        />
                      </div>
                    )}
                  </div>
                ) : (
                  <AttendeeConditionalLogicPanel
                    active={filterTab === "advanced"}
                    onChainMeta={handleConditionalChainMeta}
                    control={control}
                    setValue={setValue}
                    getValues={getValues}
                    isFilterEnabled={isFilterEnabled}
                    isDark={isDark}
                    labelStyle={labelStyle}
                    inputStyle={inputStyle}
                    rsStyles={rsStyles}
                    pickerDateFormat={pickerDateFormat}
                    normalizePickerDate={normalizePickerDate}
                    leadTypeOptions={leadTypeOptions}
                    productOptions={productOptions}
                    tagData={tagData}
                    salesOptions={salesOptions}
                    reminderOptions={reminderOptions}
                    customOptionsForFilters={customOptionsForFilters}
                  />
                )}
              </div>

              <div
                className="p-4 border-t flex-shrink-0"
                style={{ borderColor: shellBorder, backgroundColor: footerBg }}
              >
                <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                  <div className="flex flex-wrap items-center gap-4">
                    <div className="flex items-center gap-2">
                      <span style={{ ...labelStyle, marginBottom: 0 }}>
                        Sort By:
                      </span>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="outline"
                            className="flex h-9 min-w-[140px] items-center justify-between rounded-lg px-3 py-1.5 text-sm outline-none transition-all duration-200 hover:bg-black/5 dark:hover:bg-white/10"
                            style={inputStyle}
                          >
                            <span className="truncate">
                              {allAttendeesSortByOptions.find(
                                (o) => o.value === sortBy.sortBy
                              )?.label || "Sort By"}
                            </span>
                            <ChevronDown className="h-4 w-4 opacity-50 shrink-0" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                          align="start"
                          className="w-[var(--radix-dropdown-menu-trigger-width)] min-w-[var(--radix-dropdown-menu-trigger-width)] max-h-[300px] z-[10000] overflow-y-auto overflow-x-hidden custom-scrollbar bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-xl p-1"
                        >
                          {allAttendeesSortByOptions.map((o) => (
                            <DropdownMenuItem
                              key={o.value}
                              onClick={() =>
                                setSortBy((prev) => ({ ...prev, sortBy: o.value }))
                              }
                              className="cursor-pointer rounded-lg px-3 py-2 text-sm hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200"
                            >
                              {o.label}
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    <div className="flex items-center gap-2">
                      <span style={{ ...labelStyle, marginBottom: 0 }}>
                        Order:
                      </span>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="outline"
                            className="flex h-9 min-w-[100px] items-center justify-between rounded-lg px-3 py-1.5 text-sm outline-none transition-all duration-200 hover:bg-black/5 dark:hover:bg-white/10"
                            style={inputStyle}
                          >
                            <span className="truncate">
                              {sortBy.sortOrder === "asc" ? "A - Z" : "Z - A"}
                            </span>
                            <ChevronDown className="h-4 w-4 opacity-50 shrink-0" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                          align="start"
                          className="w-[var(--radix-dropdown-menu-trigger-width)] min-w-[var(--radix-dropdown-menu-trigger-width)] max-h-[300px] z-[10000] overflow-y-auto overflow-x-hidden custom-scrollbar bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-xl p-1"
                        >
                          <DropdownMenuItem
                            onClick={() =>
                              setSortBy((prev) => ({ ...prev, sortOrder: "asc" }))
                            }
                            className="cursor-pointer rounded-lg px-3 py-2 text-sm hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200"
                          >
                            A - Z
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() =>
                              setSortBy((prev) => ({ ...prev, sortOrder: "desc" }))
                            }
                            className="cursor-pointer rounded-lg px-3 py-2 text-sm hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200"
                          >
                            Z - A
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-end">
                    <Button
                      type="button"
                      onClick={resetForm}
                      className="px-3 py-1.5 rounded-xl font-medium transition-colors hover:bg-black/5 flex items-center gap-2"
                      style={ghostBtn}
                    >
                      <RotateCcw className="w-3.5 h-3.5" /> Reset
                    </Button>
                    <Button
                      type="button"
                      onClick={() => {
                        onClose();
                        onOpenPresetModal?.();
                      }}
                      className="px-3 py-1.5 rounded-xl font-medium transition-colors hover:bg-black/5 flex items-center gap-2"
                      style={ghostBtn}
                    >
                      <Save className="w-3.5 h-3.5" /> Save as Preset
                    </Button>
                    <Button
                      type="button"
                      onClick={onCopy}
                      className="px-3 py-1.5 rounded-xl font-medium transition-colors hover:bg-black/5 flex items-center gap-2"
                      style={ghostBtn}
                    >
                      <Copy className="w-3.5 h-3.5" /> Copy API
                    </Button>
                    <Button
                      type="button"
                      onClick={onClose}
                      className="px-4 py-1.5 rounded-xl font-medium transition-colors hover:bg-black/5"
                      style={cancelBtn}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      className="px-5 py-1.5 rounded-xl font-semibold transition-all hover:scale-105"
                      style={applyBtn}
                    >
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

export default GroupedAttendeeFilterModal;
