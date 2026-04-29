import React, { memo, useEffect, useState, useMemo, useCallback, useRef } from "react";
import { X, Filter, CalendarDays, ChevronDown, RotateCcw, Save, Copy } from "lucide-react";
import { useForm, Controller } from "react-hook-form";
import { useDispatch, useSelector } from "react-redux";
import { closeModal } from "../../features/slices/modalSlice";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { cn } from "../../lib/utils";
import {
  DateFormat,
  filterTruthyValues,
  successToast,
} from "../../utils/extra";
import useAddUserActivity from "../../hooks/useAddUserActivity";
import { getCustomOptionsForFilters } from "../../features/actions/globalData";
import {
  salesAttendeesSortByOptions,
  webinarAttendeesSortByOptions,
} from "../../utils/columnData";
import { setWebinarAttendeesFilters } from "../../features/slices/filters.slice";
import tagsService from "../../services/tagsService";
import { getAllProductsByAdminId } from "../../features/actions/product";
import { getAllEmployees } from "../../features/actions/employee";
import { clearEmployeeData } from "../../features/slices/employee";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import useUserSubscription from "../../hooks/useUserSubscription";
import Select from "react-select";
import CreatableSelect from "react-select/creatable";
import { Dialog, DialogContent } from "../ui/dialog";
import { useTheme } from "../../contexts/ThemeContext";

import AttendeeConditionalLogicPanel from "../Filter/AttendeeConditionalLogicPanel";

const FONT = "Inter, sans-serif";

const normalizePickerDate = (v) => {
  if (v == null || v === "") return null;
  if (v instanceof Date && !Number.isNaN(v.getTime())) return v;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d;
};

const AttendeesFilterModal = ({
  modalName,
  setPage,
  notAllowed = [],
  tabValue,
  label,
  handleCopy,
  onTrigger = () => {},
}) => {
  const dispatch = useDispatch();
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const { modals } = useSelector((state) => state.modals);
  const open = Boolean(modals[modalName]);
  
  const logUserActivity = useAddUserActivity();
  const { leadTypeData } = useSelector((state) => state.assign);
  const { userData } = useSelector((state) => state.auth);
  const { data: subscription } = useUserSubscription();
  const pickerDateFormat = userData?.dateFormat || DateFormat.MM_DD_YYYY;

  const { customOptionsForFilters } = useSelector((state) => state.globalData);
  const { control, handleSubmit, reset, watch, setValue, getValues } = useForm();
  const {
    webinarAttendeesFilters,
    webinarAttendeesSortBy,
    salesAttendeesSortBy,
  } = useSelector((state) => state.filters);
  const { productDropdownData } = useSelector((state) => state.product);

  const [filterTab, setFilterTab] = useState("simple");
  const [conditionalMeta, setConditionalMeta] = useState({ hasOr: false });
  const conditionalSanitizeRef = useRef((d) => d);

  const sortByOption =
    tabValue === "preWebinar"
      ? webinarAttendeesSortBy || {
          sortBy: webinarAttendeesSortByOptions[0].value,
          sortOrder: "desc",
        }
      : salesAttendeesSortBy || {
          sortBy: salesAttendeesSortByOptions[0].value,
          sortOrder: "desc",
        };

  const [sortBy, setSortBy] = useState(sortByOption);
  const [tagData, setTagData] = useState([]);
  const [leadTypeOptions, setLeadTypeOptions] = useState([]);
  const tableConfig = subscription?.plan?.attendeeTableConfig || {};

  const selectedType =
    tabValue === "preWebinar" ? "EMPLOYEE_REMINDER" : "EMPLOYEE_SALES";
  const { employeeData: assignedEmployees } = useSelector(
    (state) => state.employee
  );
  
  const employeeOptions = useMemo(() => 
    (assignedEmployees || [])
      .filter((item) => item?.role === selectedType)
      .map((item) => ({
        value: item?._id,
        label: item?.userName,
      })), [assignedEmployees, selectedType]
  );

  const handleConditionalChainMeta = useCallback((meta) => {
    setConditionalMeta({
      hasOr: Boolean(meta?.hasOr),
    });
  }, []);

  const isFilterEnabled = useCallback(
    (key) => !notAllowed.includes(key) && tableConfig?.[key]?.filterable !== false,
    [tableConfig, notAllowed]
  );

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
    }),
    [isDark]
  );

  const onSubmit = (data) => {
    if (filterTab === "advanced") {
      if (conditionalMeta.hasOr) {
        toast.message(
          "OR between conditions is not supported by the API yet; filters were applied as AND."
        );
      }
    }

    const payload = filterTab === "advanced" ? conditionalSanitizeRef.current(data) : data;
    const filterData = filterTruthyValues(payload);

    if (Object.keys(filterData).length) {
      successToast("Filters Applied");
    }

    if (Object.keys(webinarAttendeesFilters || {})?.length === 0) {
      onTrigger();
    }
    setPage(1);
    dispatch(
      setWebinarAttendeesFilters({
        filters: filterData,
        sortBy: sortBy,
        recordType: tabValue,
      })
    );
    dispatch(closeModal(modalName));
    logUserActivity({
      action: "filter",
      type: "to Table",
      detailItem: "Attendees",
    });
  };

  const onCopy = (e) => {
    e.preventDefault();
    const formValues = watch();
    const filterData = filterTruthyValues(formValues);
    handleCopy(filterData);
  };

  const onClose = () => {
    dispatch(closeModal(modalName));
  };

  const resetForm = (e) => {
    e.preventDefault();
    setFilterTab("simple");
    reset({
      email: "",
      firstName: "",
      lastName: "",
      "timeInSession.$gte": null,
      "timeInSession.$lte": null,
      "attendedCount.$gte": null,
      "attendedCount.$lte": null,
      "registeredCount.$gte": null,
      "registeredCount.$lte": null,
      gender: "",
      phone: "",
      location: "",
      profession: "",
      tags: [],
      enrollments: [],
      lastAssignedTo: "",
      status: "",
      source: "",
      leadType: "",
    });
  };

  useEffect(() => {
    if (!open) return;
    
    tagsService.getTags().then((res) => {
      if (res.success) {
        setTagData(res.data.map(t => ({ label: t.name, value: t.name })));
      }
    });
    dispatch(getCustomOptionsForFilters());
    dispatch(getAllProductsByAdminId());
    
    if (!notAllowed.includes("enrollments")) {
      dispatch(
        getAllEmployees({
          page: 1,
          limit: 100,
          filters: { isActive: "active" },
        })
      );
    }

    reset({
      ...webinarAttendeesFilters,
    });

    return () => {
      dispatch(clearEmployeeData());
    };
  }, [open, dispatch, webinarAttendeesFilters]);

  useEffect(() => {
    if (!leadTypeData) return;
    const options = leadTypeData.map((item) => ({
      value: item._id,
      label: item.label,
      color: item.color,
    }));
    setLeadTypeOptions(options);
  }, [leadTypeData]);

  const shellBorder = isDark ? "#334155" : "#e5e7eb";
  const titleColor = isDark ? "#f8fafc" : "#0f172a";
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

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-[1200px] p-0 overflow-hidden rounded-2xl shadow-2xl border" style={{ backgroundColor: isDark ? "#1e293b" : "#ffffff", borderColor: shellBorder }}>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col max-h-[90vh]">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b flex-shrink-0" style={{ borderColor: shellBorder }}>
            <h3 className="text-lg font-bold flex items-center gap-2" style={{ fontFamily: FONT, color: titleColor }}>
              <Filter className="w-5 h-5 text-gray-500 shrink-0" />
              {label || "Attendees Filter"}
            </h3>
            <button type="button" onClick={onClose} className="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/10">
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 px-4 pt-2 border-b flex-shrink-0" style={{ borderColor: shellBorder }}>
            <button
              type="button"
              onClick={() => setFilterTab("simple")}
              className="px-4 py-2 transition-all duration-300 relative"
              style={{
                fontFamily: FONT,
                fontSize: "13px",
                fontWeight: 600,
                color: filterTab === "simple" ? "#22B573" : (isDark ? "#94a3b8" : "#64748b"),
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
                color: filterTab === "advanced" ? "#22B573" : (isDark ? "#94a3b8" : "#64748b"),
              }}
            >
              Conditional Logic
              {filterTab === "advanced" && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#22B573] rounded-t-full" />
              )}
            </button>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto custom-scrollbar flex-1 min-h-0">
            {filterTab === "simple" ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-4">
                {isFilterEnabled("email") && (
                  <div>
                    <span style={labelStyle}>Email</span>
                    <Controller
                      name="email"
                      control={control}
                      render={({ field }) => (
                        <Input {...field} placeholder="example@mail.com" style={inputStyle} className="rounded-xl h-10" />
                      )}
                    />
                  </div>
                )}

                {isFilterEnabled("firstName") && (
                  <div>
                    <span style={labelStyle}>First Name</span>
                    <Controller
                      name="firstName"
                      control={control}
                      render={({ field }) => (
                        <Input {...field} placeholder="John" style={inputStyle} className="rounded-xl h-10" />
                      )}
                    />
                  </div>
                )}

                {isFilterEnabled("lastName") && (
                  <div>
                    <span style={labelStyle}>Last Name</span>
                    <Controller
                      name="lastName"
                      control={control}
                      render={({ field }) => (
                        <Input {...field} placeholder="Doe" style={inputStyle} className="rounded-xl h-10" />
                      )}
                    />
                  </div>
                )}

                {isFilterEnabled("phone") && (
                  <div>
                    <span style={labelStyle}>Phone</span>
                    <Controller
                      name="phone"
                      control={control}
                      render={({ field }) => (
                        <Input {...field} placeholder="1234567890" style={inputStyle} className="rounded-xl h-10" />
                      )}
                    />
                  </div>
                )}

                {isFilterEnabled("location") && (
                  <div>
                    <span style={labelStyle}>Location</span>
                    <Controller
                      name="location"
                      control={control}
                      render={({ field }) => (
                        <Input {...field} placeholder="City/State" style={inputStyle} className="rounded-xl h-10" />
                      )}
                    />
                  </div>
                )}

                {isFilterEnabled("profession") && (
                  <div>
                    <span style={labelStyle}>Profession</span>
                    <Controller
                      name="profession"
                      control={control}
                      render={({ field }) => (
                        <Input {...field} placeholder="Developer" style={inputStyle} className="rounded-xl h-10" />
                      )}
                    />
                  </div>
                )}

                {isFilterEnabled("tags") && (
                  <div>
                    <span style={labelStyle}>Tags</span>
                    <Controller
                      name="tags"
                      control={control}
                      render={({ field }) => (
                        <Select
                          isMulti
                          options={tagData}
                          value={tagData.filter(o => field.value?.includes(o.value))}
                          onChange={(val) => field.onChange(val.map(v => v.value))}
                          styles={rsStyles}
                          placeholder="Select Tags"
                          menuPortalTarget={document.body}
                        />
                      )}
                    />
                  </div>
                )}

                {isFilterEnabled("enrollments") && (
                  <div>
                    <span style={labelStyle}>Enrollments</span>
                    <Controller
                      name="enrollments"
                      control={control}
                      render={({ field }) => (
                        <Select
                          isMulti
                          options={(productDropdownData || []).map(p => ({ label: p.name, value: p._id }))}
                          value={(productDropdownData || []).filter(p => field.value?.includes(p._id)).map(p => ({ label: p.name, value: p._id }))}
                          onChange={(val) => field.onChange(val.map(v => v.value))}
                          styles={rsStyles}
                          placeholder="Select Products"
                          menuPortalTarget={document.body}
                        />
                      )}
                    />
                  </div>
                )}

                {isFilterEnabled("lastAssignedTo") && (
                  <div>
                    <span style={labelStyle}>Assigned To</span>
                    <Controller
                      name="lastAssignedTo"
                      control={control}
                      render={({ field }) => (
                        <Select
                          options={employeeOptions}
                          value={employeeOptions.find(o => o.value === field.value)}
                          onChange={(val) => field.onChange(val?.value)}
                          styles={rsStyles}
                          placeholder="Select Employee"
                          isClearable
                          menuPortalTarget={document.body}
                        />
                      )}
                    />
                  </div>
                )}

                <div>
                  <span style={labelStyle}>Time In Session (mins)</span>
                  <div className="flex gap-2">
                    <Controller
                      name="timeInSession.$gte"
                      control={control}
                      render={({ field }) => (
                        <Input {...field} type="number" placeholder="Min" style={inputStyle} className="rounded-xl h-10" />
                      )}
                    />
                    <Controller
                      name="timeInSession.$lte"
                      control={control}
                      render={({ field }) => (
                        <Input {...field} type="number" placeholder="Max" style={inputStyle} className="rounded-xl h-10" />
                      )}
                    />
                  </div>
                </div>

                {isFilterEnabled("gender") && (
                  <div>
                    <span style={labelStyle}>Gender</span>
                    <Controller
                      name="gender"
                      control={control}
                      render={({ field }) => (
                        <select {...field} style={inputStyle} className="w-full h-10 rounded-xl px-3 border focus:ring-2 cursor-pointer">
                          <option value="">All</option>
                          <option value="Male">Male</option>
                          <option value="Female">Female</option>
                          <option value="Other">Other</option>
                        </select>
                      )}
                    />
                  </div>
                )}

                {isFilterEnabled("status") && (
                  <div>
                    <span style={labelStyle}>Status</span>
                    <Controller
                      name="status"
                      control={control}
                      render={({ field }) => (
                        <select {...field} style={inputStyle} className="w-full h-10 rounded-xl px-3 border focus:ring-2 cursor-pointer">
                          <option value="">All</option>
                          {(customOptionsForFilters?.status || []).map(o => (
                            <option key={o} value={o}>{o}</option>
                          ))}
                        </select>
                      )}
                    />
                  </div>
                )}

                {isFilterEnabled("source") && (
                  <div>
                    <span style={labelStyle}>Source</span>
                    <Controller
                      name="source"
                      control={control}
                      render={({ field }) => (
                        <select {...field} style={inputStyle} className="w-full h-10 rounded-xl px-3 border focus:ring-2 cursor-pointer">
                          <option value="">All</option>
                          {(customOptionsForFilters?.source || []).map(o => (
                            <option key={o} value={o}>{o}</option>
                          ))}
                        </select>
                      )}
                    />
                  </div>
                )}

                {isFilterEnabled("leadType") && (
                  <div>
                    <span style={labelStyle}>Lead Type</span>
                    <Controller
                      name="leadType"
                      control={control}
                      render={({ field }) => (
                        <select {...field} style={inputStyle} className="w-full h-10 rounded-xl px-3 border focus:ring-2 cursor-pointer">
                          <option value="">All</option>
                          {leadTypeOptions.map(o => (
                            <option key={o.value} value={o.value}>{o.label}</option>
                          ))}
                        </select>
                      )}
                    />
                  </div>
                )}

                <div>
                  <span style={labelStyle}>Registered Count</span>
                  <div className="flex gap-2">
                    <Controller
                      name="registeredCount.$gte"
                      control={control}
                      render={({ field }) => (
                        <Input {...field} type="number" placeholder="Min" style={inputStyle} className="rounded-xl h-10" />
                      )}
                    />
                    <Controller
                      name="registeredCount.$lte"
                      control={control}
                      render={({ field }) => (
                        <Input {...field} type="number" placeholder="Max" style={inputStyle} className="rounded-xl h-10" />
                      )}
                    />
                  </div>
                </div>

                <div>
                  <span style={labelStyle}>Attended Count</span>
                  <div className="flex gap-2">
                    <Controller
                      name="attendedCount.$gte"
                      control={control}
                      render={({ field }) => (
                        <Input {...field} type="number" placeholder="Min" style={inputStyle} className="rounded-xl h-10" />
                      )}
                    />
                    <Controller
                      name="attendedCount.$lte"
                      control={control}
                      render={({ field }) => (
                        <Input {...field} type="number" placeholder="Max" style={inputStyle} className="rounded-xl h-10" />
                      )}
                    />
                  </div>
                </div>
              </div>
            ) : (
              <AttendeeConditionalLogicPanel
                active={filterTab === "advanced"}
                control={control}
                setValue={setValue}
                getValues={getValues}
                tagOptions={tagData}
                productOptions={(productDropdownData || []).map(p => ({ label: p.name, value: p._id }))}
                employeeOptions={employeeOptions}
                statusOptions={(customOptionsForFilters?.status || []).map(o => ({ label: o, value: o }))}
                sourceOptions={(customOptionsForFilters?.source || []).map(o => ({ label: o, value: o }))}
                leadTypeOptions={leadTypeOptions}
                onChainMeta={handleConditionalChainMeta}
                sanitizerRef={conditionalSanitizeRef}
                inputStyle={inputStyle}
                rsStyles={rsStyles}
                isDark={isDark}
              />
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t flex-shrink-0" style={{ backgroundColor: footerBg, borderColor: shellBorder }}>
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <div className="flex items-center gap-3">
                <span style={labelStyle} className="mb-0">Sort By</span>
                <select
                  value={sortBy.sortBy}
                  onChange={(e) => setSortBy(prev => ({ ...prev, sortBy: e.target.value }))}
                  className="px-3 py-1.5 rounded-xl border text-sm focus:outline-none focus:ring-2 cursor-pointer h-10"
                  style={inputStyle}
                >
                  {(tabValue === "preWebinar" ? webinarAttendeesSortByOptions : salesAttendeesSortByOptions).map(o => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
                <select
                  value={sortBy.sortOrder}
                  onChange={(e) => setSortBy(prev => ({ ...prev, sortOrder: e.target.value }))}
                  className="px-3 py-1.5 rounded-xl border text-sm focus:outline-none focus:ring-2 cursor-pointer h-10"
                  style={inputStyle}
                >
                  <option value="asc">A - Z</option>
                  <option value="desc">Z - A</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <Button type="button" onClick={resetForm} style={ghostBtn} className="rounded-xl h-10 gap-2">
                  <RotateCcw className="w-4 h-4" /> Reset
                </Button>
                <Button type="button" onClick={onCopy} style={ghostBtn} className="rounded-xl h-10 gap-2">
                  <Copy className="w-4 h-4" /> Copy API
                </Button>
                <Button type="button" onClick={onClose} style={cancelBtn} className="rounded-xl h-10">
                  Cancel
                </Button>
                <Button type="submit" style={applyBtn} className="rounded-xl h-10 px-8 font-bold transition-all hover:scale-105">
                  Apply Filters
                </Button>
              </div>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default memo(AttendeesFilterModal);
