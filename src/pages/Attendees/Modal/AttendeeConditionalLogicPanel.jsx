import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Controller } from "react-hook-form";
import DatePicker from "react-datepicker";
import Select from "react-select";
import CreatableSelect from "react-select/creatable";
import { CalendarDays, Filter, Plus, Trash2, ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "../../../components/ui/dropdown-menu";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";

const makeRowId = () =>
  `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

const emptyDefaults = () => ({
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

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** Compiles UI state into Mongo $regex string for grouped attendees email filter */
const compileEmailFilter = (raw, operator, mode) => {
  const v = String(raw ?? "").trim();
  if (!v) return "";
  const esc = escapeRegex(v);
  if (mode === "exclude") {
    if (operator === "contains") return `^(?!.*${esc})`;
    if (operator === "equals") return `^(?!${esc}$)`;
    if (operator === "startsWith") return `^(?!${esc})`;
    return `^(?!.*${esc})`;
  }
  if (operator === "equals") return `^${esc}$`;
  if (operator === "startsWith") return `^${esc}`;
  return v;
};

const clearFieldFromForm = (setValue, fieldKey) => {
  const d = emptyDefaults();
  switch (fieldKey) {
    case "email":
      setValue("email", d.email);
      break;
    case "locations":
      setValue("locations", d.locations);
      break;
    case "professions":
      setValue("professions", d.professions);
      break;
    case "sources":
      setValue("sources", d.sources);
      break;
    case "leadType":
      setValue("leadType", d.leadType);
      break;
    case "enrollments":
      setValue("enrollments", d.enrollments);
      break;
    case "createdAt":
      setValue("createdAt.$gte", d["createdAt.$gte"]);
      setValue("createdAt.$lte", d["createdAt.$lte"]);
      break;
    case "timeInSession":
      setValue("timeInSession.$gte", d["timeInSession.$gte"]);
      setValue("timeInSession.$lte", d["timeInSession.$lte"]);
      break;
    case "registeredWebinarCount":
      setValue("registeredWebinarCount.$gte", d["registeredWebinarCount.$gte"]);
      setValue("registeredWebinarCount.$lte", d["registeredWebinarCount.$lte"]);
      break;
    case "attendedWebinarCount":
      setValue("attendedWebinarCount.$gte", d["attendedWebinarCount.$gte"]);
      setValue("attendedWebinarCount.$lte", d["attendedWebinarCount.$lte"]);
      break;
    case "tags":
      setValue("tags", d.tags);
      break;
    case "reminderAssignedTo":
      setValue("reminderAssignedTo", d.reminderAssignedTo);
      break;
    case "salesAssignedTo":
      setValue("salesAssignedTo", d.salesAssignedTo);
      break;
    case "reminderLastStatus":
      setValue("reminderLastStatus", d.reminderLastStatus);
      break;
    case "salesLastStatus":
      setValue("salesLastStatus", d.salesLastStatus);
      break;
    default:
      break;
  }
};

const fieldHasValue = (v, fieldKey) => {
  if (!v) return false;
  switch (fieldKey) {
    case "email":
      return Boolean(String(v.email || "").trim());
    case "locations":
    case "professions":
    case "sources":
    case "leadType":
    case "enrollments":
    case "tags":
    case "reminderAssignedTo":
    case "salesAssignedTo":
    case "reminderLastStatus":
    case "salesLastStatus":
      return Array.isArray(v[fieldKey]) && v[fieldKey].length > 0;
    case "createdAt": {
      const c = v.createdAt;
      if (c?.$gte || c?.$lte) return true;
      return Boolean(v["createdAt.$gte"]) || Boolean(v["createdAt.$lte"]);
    }
    case "timeInSession":
    case "registeredWebinarCount":
    case "attendedWebinarCount": {
      const o = v[fieldKey];
      const gte = o?.$gte ?? v[`${fieldKey}.$gte`];
      const lte = o?.$lte ?? v[`${fieldKey}.$lte`];
      return (
        (gte !== undefined && gte !== "" && gte !== null) ||
        (lte !== undefined && lte !== "" && lte !== null)
      );
    }
    default:
      return false;
  }
};

const defaultOperator = (fieldKey) => {
  if (fieldKey === "email") return "contains";
  if (
    fieldKey === "timeInSession" ||
    fieldKey === "registeredWebinarCount" ||
    fieldKey === "attendedWebinarCount"
  ) {
    return "between";
  }
  return "anyOf";
};

const buildRowsFromValues = (values, isFilterEnabled) => {
  const order = [
    "email",
    "locations",
    "professions",
    "sources",
    "leadType",
    "enrollments",
    "createdAt",
    "timeInSession",
    "registeredWebinarCount",
    "attendedWebinarCount",
    "tags",
    "reminderAssignedTo",
    "salesAssignedTo",
    "reminderLastStatus",
    "salesLastStatus",
  ];
  const rows = [];
  for (const key of order) {
    if (!isFilterEnabled(key)) continue;
    if (fieldHasValue(values, key)) {
      rows.push({
        id: makeRowId(),
        fieldKey: key,
        mode: "include",
        operator: defaultOperator(key),
        chain: "and",
      });
    }
  }
  return rows.length
    ? rows
    : [
        {
          id: makeRowId(),
          fieldKey: "",
          mode: "include",
          operator: "contains",
          chain: "and",
        },
      ];
};

const FIELD_LABELS = {
  email: "Email",
  locations: "Locations",
  professions: "Professions",
  sources: "Sources",
  leadType: "Lead Type",
  enrollments: "Enrollments",
  createdAt: "Created date",
  timeInSession: "Time in session (mins)",
  registeredWebinarCount: "Webinar registered",
  attendedWebinarCount: "Webinar attended",
  tags: "Tags",
  reminderAssignedTo: "Reminder assigned to",
  salesAssignedTo: "Sales assigned to",
  reminderLastStatus: "Reminder last status",
  salesLastStatus: "Sales last status",
};

const EMAIL_OPERATORS = [
  { value: "contains", label: "Contains" },
  { value: "equals", label: "Equals" },
  { value: "startsWith", label: "Starts with" },
];

const RANGE_OPERATORS = [{ value: "between", label: "Between" }];
const MULTI_OPERATORS = [{ value: "anyOf", label: "Is any of" }];

const pillBase =
  "px-3 py-1.5 text-xs font-semibold rounded-full border transition-colors";

export default function AttendeeConditionalLogicPanel({
  active,
  control,
  setValue,
  getValues,
  isFilterEnabled,
  onChainMeta,
  isDark,
  labelStyle,
  inputStyle,
  rsStyles,
  pickerDateFormat,
  normalizePickerDate,
  leadTypeOptions,
  productOptions,
  tagData,
  salesOptions,
  reminderOptions,
  customOptionsForFilters,
}) {
  const [rows, setRows] = useState(() => [
    {
      id: makeRowId(),
      fieldKey: "",
      mode: "include",
      operator: "contains",
      chain: "and",
    },
  ]);
  const [emailLocal, setEmailLocal] = useState("");
  const prevAdvancedActive = useRef(false);
  const lastEmailRowId = useRef(null);

  const statusOptions = useMemo(
    () =>
      Array.isArray(customOptionsForFilters) ? customOptionsForFilters : [],
    [customOptionsForFilters]
  );

  const enabledFieldEntries = useMemo(() => {
    return Object.entries(FIELD_LABELS).filter(([key]) =>
      isFilterEnabled(key)
    );
  }, [isFilterEnabled]);

  const usedKeys = useMemo(
    () => new Set(rows.map((r) => r.fieldKey).filter(Boolean)),
    [rows]
  );

  const canAddRow = usedKeys.size < enabledFieldEntries.length;

  const emailRow = useMemo(
    () => rows.find((r) => r.fieldKey === "email"),
    [rows]
  );

  const flushEmailToForm = useCallback(() => {
    if (!emailRow) return;
    const compiled = compileEmailFilter(
      emailLocal,
      emailRow.operator,
      emailRow.mode
    );
    setValue("email", compiled, { shouldDirty: true, shouldValidate: false });
  }, [emailLocal, emailRow, setValue]);

  useEffect(() => {
    if (!active) {
      prevAdvancedActive.current = false;
      return;
    }
    if (!prevAdvancedActive.current) {
      const v = getValues();
      setRows(buildRowsFromValues(v, isFilterEnabled));
    }
    prevAdvancedActive.current = true;
  }, [active, getValues, isFilterEnabled]);

  useEffect(() => {
    if (!active) {
      onChainMeta?.({ hasOr: false });
      return;
    }
    const hasOr = rows.some((r, i) => i > 0 && (r.chain || "and") === "or");
    onChainMeta?.({ hasOr });
  }, [rows, active, onChainMeta]);

  useEffect(() => {
    if (!emailRow) {
      lastEmailRowId.current = null;
      return;
    }
    if (lastEmailRowId.current !== emailRow.id) {
      lastEmailRowId.current = emailRow.id;
      setEmailLocal(String(getValues("email") || ""));
    }
  }, [emailRow, getValues]);

  useEffect(() => {
    if (!active || !emailRow) return;
    const t = window.setTimeout(() => {
      setValue(
        "email",
        compileEmailFilter(
          emailLocal,
          emailRow.operator,
          emailRow.mode
        ),
        { shouldDirty: true, shouldValidate: false }
      );
    }, 200);
    return () => window.clearTimeout(t);
  }, [active, emailLocal, emailRow, setValue]);

  const updateRow = useCallback((rowId, patch) => {
    setRows((prev) =>
      prev.map((r) => (r.id === rowId ? { ...r, ...patch } : r))
    );
  }, []);

  const handleFieldChange = useCallback(
    (rowId, newKey) => {
      setRows((prev) => {
        const current = prev.find((r) => r.id === rowId);
        const prevKey = current?.fieldKey;
        if (prevKey && prevKey !== newKey) {
          clearFieldFromForm(setValue, prevKey);
        }
        return prev.map((r) => {
          if (r.id === rowId) {
            return {
              ...r,
              fieldKey: newKey,
              mode: "include",
              operator: newKey ? defaultOperator(newKey) : "contains",
              chain: r.chain ?? "and",
            };
          }
          if (newKey && r.fieldKey === newKey && r.id !== rowId) {
            return {
              ...r,
              fieldKey: "",
              mode: "include",
              operator: "contains",
              chain: r.chain || "and",
            };
          }
          return r;
        });
      });
    },
    [setValue]
  );

  const addRow = useCallback(() => {
    if (!canAddRow) return;
    setRows((prev) => [
      ...prev,
      {
        id: makeRowId(),
        fieldKey: "",
        mode: "include",
        operator: "contains",
        chain: "and",
      },
    ]);
  }, [canAddRow]);

  const removeRow = useCallback(
    (rowId) => {
      setRows((prev) => {
        const row = prev.find((r) => r.id === rowId);
        if (row?.fieldKey) clearFieldFromForm(setValue, row.fieldKey);
        const next = prev.filter((r) => r.id !== rowId);
        return next.length
          ? next
          : [
              {
                id: makeRowId(),
                fieldKey: "",
                mode: "include",
                operator: "contains",
                chain: "and",
              },
            ];
      });
    },
    [setValue]
  );

  const creatableMenuHide = (provided, state) => ({
    ...provided,
    display: state.options?.length ? "block" : "none",
  });

  const operatorOptionsForField = (fieldKey) => {
    if (fieldKey === "email") return EMAIL_OPERATORS;
    if (
      fieldKey === "timeInSession" ||
      fieldKey === "registeredWebinarCount" ||
      fieldKey === "attendedWebinarCount"
    ) {
      return RANGE_OPERATORS;
    }
    if (!fieldKey) return EMAIL_OPERATORS;
    return MULTI_OPERATORS;
  };

  const renderIncludeExclude = (row) => {
    const inactiveText = isDark ? "#94a3b8" : "#64748b";
    return (
      <div
        className="inline-flex rounded-full border p-0.5 shrink-0"
        style={{
          borderColor: isDark ? "#334155" : "#e2e8f0",
          backgroundColor: isDark ? "#0f172a" : "#f8fafc",
        }}
      >
        <button
          type="button"
          onClick={() => updateRow(row.id, { mode: "include" })}
          className={pillBase}
          style={{
            backgroundColor:
              row.mode === "include" ? "#22B573" : "transparent",
            color: row.mode === "include" ? "#ffffff" : inactiveText,
            borderColor: "transparent",
          }}
        >
          Include
        </button>
        <button
          type="button"
          onClick={() => updateRow(row.id, { mode: "exclude" })}
          className={pillBase}
          style={{
            backgroundColor:
              row.mode === "exclude" ? "#dc2626" : "transparent",
            color: row.mode === "exclude" ? "#ffffff" : inactiveText,
            borderColor: "transparent",
          }}
        >
          Exclude
        </button>
      </div>
    );
  };

  const renderAndOrToggle = (row, index) => {
    if (index === 0) return null;
    const inactiveText = isDark ? "#94a3b8" : "#64748b";
    const chain = row.chain || "and";
    return (
      <div
        className="inline-flex rounded-full border p-0.5 shrink-0"
        style={{
          borderColor: isDark ? "#334155" : "#e2e8f0",
          backgroundColor: isDark ? "#0f172a" : "#f8fafc",
        }}
      >
        <button
          type="button"
          onClick={() => updateRow(row.id, { chain: "and" })}
          className={`${pillBase} px-2.5 text-[11px]`}
          style={{
            backgroundColor: chain === "and" ? "#2563eb" : "transparent",
            color: chain === "and" ? "#ffffff" : inactiveText,
            borderColor: "transparent",
          }}
        >
          AND
        </button>
        <button
          type="button"
          onClick={() => updateRow(row.id, { chain: "or" })}
          className={`${pillBase} px-2.5 text-[11px]`}
          style={{
            backgroundColor: chain === "or" ? "#2563eb" : "transparent",
            color: chain === "or" ? "#ffffff" : inactiveText,
            borderColor: "transparent",
          }}
        >
          OR
        </button>
      </div>
    );
  };

  const renderValueEditor = (row) => {
    const { fieldKey } = row;
    if (!fieldKey) {
      return (
        <div
          className="w-full min-w-[160px] flex-1 max-w-md"
          style={{ color: isDark ? "#94a3b8" : "#64748b" }}
        >
          <Input
            readOnly
            placeholder="Enter value…"
            className="w-full p-2 rounded-lg text-sm opacity-60"
            style={inputStyle}
          />
        </div>
      );
    }

    switch (fieldKey) {
      case "email":
        return (
          <div className="w-full min-w-[160px] flex-1 max-w-md">
            <Input
              value={emailLocal}
              onChange={(e) => setEmailLocal(e.target.value)}
              onBlur={() => flushEmailToForm()}
              type="text"
              placeholder="Enter value…"
              className="w-full p-2 rounded-lg text-sm focus:outline-none focus:ring-2"
              style={inputStyle}
            />
          </div>
        );
      case "locations":
        return (
          <div className="w-full min-w-[200px] flex-1">
            <Controller
              control={control}
              name="locations"
              render={({ field }) => (
                <CreatableSelect
                  isMulti
                  isClearable
                  styles={{
                    ...rsStyles,
                    menu: creatableMenuHide,
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
                  placeholder="Enter value…"
                  menuPortalTarget={document.body}
                  components={{
                    DropdownIndicator: () => null,
                    IndicatorSeparator: () => null,
                  }}
                />
              )}
            />
          </div>
        );
      case "professions":
        return (
          <div className="w-full min-w-[200px] flex-1">
            <Controller
              control={control}
              name="professions"
              render={({ field }) => (
                <CreatableSelect
                  isMulti
                  isClearable
                  styles={{
                    ...rsStyles,
                    menu: creatableMenuHide,
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
                  placeholder="Enter value…"
                  menuPortalTarget={document.body}
                  components={{
                    DropdownIndicator: () => null,
                    IndicatorSeparator: () => null,
                  }}
                />
              )}
            />
          </div>
        );
      case "sources":
        return (
          <div className="w-full min-w-[200px] flex-1">
            <Controller
              control={control}
              name="sources"
              render={({ field }) => (
                <CreatableSelect
                  isMulti
                  isClearable
                  styles={{
                    ...rsStyles,
                    menu: creatableMenuHide,
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
                  placeholder="Enter value…"
                  menuPortalTarget={document.body}
                  components={{
                    DropdownIndicator: () => null,
                    IndicatorSeparator: () => null,
                  }}
                />
              )}
            />
          </div>
        );
      case "leadType":
        return (
          <div className="w-full min-w-[200px] flex-1">
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
                  placeholder="Enter value…"
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
        );
      case "enrollments":
        return (
          <div className="w-full min-w-[200px] flex-1">
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
                  placeholder="Enter value…"
                  menuPlacement="auto"
                  menuPortalTarget={document.body}
                  styles={rsStyles}
                />
              )}
            />
          </div>
        );
      case "createdAt":
        return (
          <div className="w-full flex flex-wrap gap-2 flex-1 min-w-[240px]">
            <div className="relative flex-1 min-w-[120px]">
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
                        className="w-full p-2 rounded-lg text-sm pr-9"
                        style={inputStyle}
                        placeholder="Start"
                      />
                    }
                  />
                )}
              />
              <CalendarDays className="pointer-events-none absolute right-2 top-2.5 h-4 w-4 text-gray-500" />
            </div>
            <div className="relative flex-1 min-w-[120px]">
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
                        className="w-full p-2 rounded-lg text-sm pr-9"
                        style={inputStyle}
                        placeholder="End"
                      />
                    }
                  />
                )}
              />
              <CalendarDays className="pointer-events-none absolute right-2 top-2.5 h-4 w-4 text-gray-500" />
            </div>
          </div>
        );
      case "timeInSession":
      case "registeredWebinarCount":
      case "attendedWebinarCount": {
        const gteName = `${fieldKey}.$gte`;
        const lteName = `${fieldKey}.$lte`;
        return (
          <div className="flex gap-2 flex-1 min-w-[180px]">
            <Controller
              name={gteName}
              control={control}
              rules={{ min: 0 }}
              render={({ field }) => (
                <Input
                  {...field}
                  type="number"
                  min="0"
                  placeholder="Min"
                  className="w-full p-2 rounded-lg text-sm"
                  style={inputStyle}
                  onChange={(e) => {
                    const value = e.target.value;
                    field.onChange(value === "" ? "" : Number(value));
                  }}
                />
              )}
            />
            <Controller
              name={lteName}
              control={control}
              rules={{ min: 0 }}
              render={({ field }) => (
                <Input
                  {...field}
                  type="number"
                  min="0"
                  placeholder="Max"
                  className="w-full p-2 rounded-lg text-sm"
                  style={inputStyle}
                  onChange={(e) => {
                    const value = e.target.value;
                    field.onChange(value === "" ? "" : Number(value));
                  }}
                />
              )}
            />
          </div>
        );
      }
      case "tags":
        return (
          <div className="w-full min-w-[200px] flex-1">
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
                  placeholder="Enter value…"
                  menuPlacement="auto"
                  menuPortalTarget={document.body}
                  styles={rsStyles}
                />
              )}
            />
          </div>
        );
      case "reminderAssignedTo":
        return (
          <div className="w-full min-w-[200px] flex-1">
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
                  placeholder="Enter value…"
                />
              )}
            />
          </div>
        );
      case "salesAssignedTo":
        return (
          <div className="w-full min-w-[200px] flex-1">
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
                  placeholder="Enter value…"
                />
              )}
            />
          </div>
        );
      case "reminderLastStatus":
        return (
          <div className="w-full min-w-[200px] flex-1">
            <Controller
              control={control}
              name="reminderLastStatus"
              render={({ field }) => (
                <Select
                  isMulti
                  value={statusOptions.filter((option) =>
                    field.value?.includes(option.label)
                  )}
                  onChange={(selectedOptions) => {
                    field.onChange(
                      selectedOptions?.map((o) => o.label) ?? []
                    );
                  }}
                  className="w-full text-sm"
                  options={statusOptions}
                  isClearable
                  placeholder="Enter value…"
                  menuPlacement="top"
                  menuPortalTarget={document.body}
                  styles={rsStyles}
                />
              )}
            />
          </div>
        );
      case "salesLastStatus":
        return (
          <div className="w-full min-w-[200px] flex-1">
            <Controller
              control={control}
              name="salesLastStatus"
              render={({ field }) => (
                <Select
                  isMulti
                  value={statusOptions.filter((option) =>
                    field.value?.includes(option.label)
                  )}
                  onChange={(selectedOptions) => {
                    field.onChange(
                      selectedOptions?.map((o) => o.label) ?? []
                    );
                  }}
                  className="w-full text-sm"
                  options={statusOptions}
                  isClearable
                  placeholder="Enter value…"
                  menuPlacement="top"
                  menuPortalTarget={document.body}
                  styles={rsStyles}
                />
              )}
            />
          </div>
        );
      default:
        return null;
    }
  };

  const addBtnStyle = {
    backgroundColor: "#2563eb",
    color: "#ffffff",
    border: "none",
    boxShadow: "0 2px 8px rgba(37, 99, 235, 0.35)",
  };

  return (
    <div className="space-y-4 max-w-5xl mx-auto">
      <div
        className="p-3 rounded-xl border"
        style={{
          backgroundColor: isDark ? "rgba(30,58,138,0.25)" : "#eff6ff",
          borderColor: isDark ? "#1e3a8a" : "#bfdbfe",
        }}
      >
        <span
          className="text-[12px] font-medium flex items-start gap-2 leading-relaxed"
          style={{ color: isDark ? "#93c5fd" : "#1e40af" }}
        >
          <div className="p-1 rounded bg-blue-500/20 shrink-0 mt-0.5">
            <Filter className="w-3.5 h-3.5" />
          </div>
          <span>
            Use AND/OR toggles in each condition to control precise filtering
            logic.
          </span>
        </span>
      </div>

      <div className="space-y-3">
        {rows.map((row, index) => (
          <div
            key={row.id}
            className="rounded-xl border p-3 sm:p-4"
            style={{
              borderColor: isDark ? "#334155" : "#e2e8f0",
              backgroundColor: isDark ? "rgba(15,23,42,0.35)" : "#ffffff",
            }}
          >
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <div
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
                style={{ backgroundColor: "#22B573" }}
              >
                {index + 1}
              </div>

              {renderIncludeExclude(row)}

              {renderAndOrToggle(row, index)}

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    className="min-w-[140px] flex-1 max-w-[200px] flex h-10 items-center justify-between rounded-lg border px-3 py-2 text-sm outline-none transition-all duration-200 hover:bg-black/5 dark:hover:bg-white/10"
                    style={inputStyle}
                  >
                    <span className="truncate">
                      {row.fieldKey ? FIELD_LABELS[row.fieldKey] : "Choose field…"}
                    </span>
                    <ChevronDown className="h-4 w-4 opacity-50 shrink-0" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="start"
                  className="w-[var(--radix-dropdown-menu-trigger-width)] min-w-[var(--radix-dropdown-menu-trigger-width)] max-h-[300px] z-[10000] overflow-y-auto overflow-x-hidden custom-scrollbar bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-xl p-1"
                >
                  <DropdownMenuItem
                    onClick={() => handleFieldChange(row.id, "")}
                    className="cursor-pointer rounded-lg px-3 py-2 text-sm hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200"
                  >
                    Choose field…
                  </DropdownMenuItem>
                  {enabledFieldEntries.map(([key, label]) => (
                    <DropdownMenuItem
                      key={key}
                      disabled={row.fieldKey !== key && usedKeys.has(key)}
                      onClick={() => handleFieldChange(row.id, key)}
                      className="cursor-pointer rounded-lg px-3 py-2 text-sm hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200"
                    >
                      {label}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              <DropdownMenu>
                <DropdownMenuTrigger asChild disabled={!row.fieldKey}>
                  <Button
                    variant="outline"
                    disabled={!row.fieldKey}
                    className="min-w-[120px] max-w-[150px] flex h-10 items-center justify-between rounded-lg border px-3 py-2 text-sm outline-none transition-all duration-200 disabled:opacity-50 hover:bg-black/5 dark:hover:bg-white/10"
                    style={inputStyle}
                  >
                    <span className="truncate">
                      {row.fieldKey
                        ? operatorOptionsForField(row.fieldKey).find(
                            (op) => op.value === row.operator
                          )?.label || "Operator"
                        : "Operator"}
                    </span>
                    <ChevronDown className="h-4 w-4 opacity-50 shrink-0" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="start"
                  className="w-[var(--radix-dropdown-menu-trigger-width)] min-w-[var(--radix-dropdown-menu-trigger-width)] max-h-[300px] z-[10000] overflow-y-auto overflow-x-hidden custom-scrollbar bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-xl p-1"
                >
                  {operatorOptionsForField(row.fieldKey).map((op) => (
                    <DropdownMenuItem
                      key={op.value}
                      onClick={() => updateRow(row.id, { operator: op.value })}
                      className="cursor-pointer rounded-lg px-3 py-2 text-sm hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200"
                    >
                      {op.label}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              {renderValueEditor(row)}

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => removeRow(row.id)}
                className="rounded-lg shrink-0 h-9 w-9 p-0 hover:opacity-90"
                style={{
                  borderColor: isDark ? "#991b1b" : "#fca5a5",
                  color: "#dc2626",
                  backgroundColor: isDark
                    ? "rgba(127, 29, 29, 0.2)"
                    : "rgba(254, 242, 242, 0.95)",
                }}
                aria-label="Remove condition"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      <div>
        <Button
          type="button"
          onClick={addRow}
          disabled={!canAddRow}
          className="rounded-lg flex items-center gap-2 px-4 py-2 font-semibold"
          style={addBtnStyle}
        >
          <Plus className="w-4 h-4" /> Add Condition
        </Button>
        {!canAddRow && (
          <p
            className="text-xs mt-2"
            style={{ color: isDark ? "#94a3b8" : "#64748b" }}
          >
            All available fields are in use. Remove a row to add another.
          </p>
        )}
      </div>
    </div>
  );
}
