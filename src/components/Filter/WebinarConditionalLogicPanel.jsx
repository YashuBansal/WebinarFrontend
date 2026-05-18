import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Controller } from "react-hook-form";
import { DatePicker } from "../ui/date-picker";
import { CalendarDays, Filter, Plus, Trash2, ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "../ui/dropdown-menu";
import { Button } from "../ui/button";
import { Input } from "../ui/input";

const makeRowId = () =>
  `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

const emptyDefaults = () => ({
  webinarName: "",
  assignedEmployee: "",
  "totalRegistrations.$gte": "",
  "totalRegistrations.$lte": "",
  "totalParticipants.$gte": "",
  "totalParticipants.$lte": "",
  "totalAttendees.$gte": "",
  "totalAttendees.$lte": "",
  "totalUnAttended.$gte": "",
  "totalUnAttended.$lte": "",
  "webinarDate.$gte": null,
  "webinarDate.$lte": null,
});

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** Same semantics as grouped attendee email → Mongo $regex for webinarName */
const compileWebinarNameFilter = (raw, operator, mode) => {
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

function stripExcludedWebinarFields(data, rows) {
  const out = { ...data };
  for (const r of rows) {
    if (r.mode !== "exclude" || !r.fieldKey) continue;
    if (r.fieldKey === "webinarName") continue;
    const k = r.fieldKey;
    if (k === "assignedEmployee") delete out.assignedEmployee;
    else if (k === "webinarDate") {
      delete out.webinarDate;
      delete out["webinarDate.$gte"];
      delete out["webinarDate.$lte"];
    } else if (
      k === "totalRegistrations" ||
      k === "totalParticipants" ||
      k === "totalAttendees" ||
      k === "totalUnAttended"
    ) {
      delete out[k];
      delete out[`${k}.$gte`];
      delete out[`${k}.$lte`];
    }
  }
  return out;
}

const clearFieldFromForm = (setValue, fieldKey) => {
  const d = emptyDefaults();
  switch (fieldKey) {
    case "webinarName":
      setValue("webinarName", d.webinarName);
      break;
    case "assignedEmployee":
      setValue("assignedEmployee", d.assignedEmployee);
      break;
    case "totalRegistrations":
      setValue("totalRegistrations.$gte", d["totalRegistrations.$gte"]);
      setValue("totalRegistrations.$lte", d["totalRegistrations.$lte"]);
      break;
    case "totalParticipants":
      setValue("totalParticipants.$gte", d["totalParticipants.$gte"]);
      setValue("totalParticipants.$lte", d["totalParticipants.$lte"]);
      break;
    case "totalAttendees":
      setValue("totalAttendees.$gte", d["totalAttendees.$gte"]);
      setValue("totalAttendees.$lte", d["totalAttendees.$lte"]);
      break;
    case "totalUnAttended":
      setValue("totalUnAttended.$gte", d["totalUnAttended.$gte"]);
      setValue("totalUnAttended.$lte", d["totalUnAttended.$lte"]);
      break;
    case "webinarDate":
      setValue("webinarDate.$gte", d["webinarDate.$gte"]);
      setValue("webinarDate.$lte", d["webinarDate.$lte"]);
      break;
    default:
      break;
  }
};

const fieldHasValue = (v, fieldKey) => {
  if (!v) return false;
  switch (fieldKey) {
    case "webinarName":
      return Boolean(String(v.webinarName || "").trim());
    case "assignedEmployee":
      return Boolean(String(v.assignedEmployee || "").trim());
    case "webinarDate": {
      const gte = v.webinarDate?.$gte ?? v["webinarDate.$gte"];
      const lte = v.webinarDate?.$lte ?? v["webinarDate.$lte"];
      return Boolean(gte) || Boolean(lte);
    }
    case "totalRegistrations":
    case "totalParticipants":
    case "totalAttendees":
    case "totalUnAttended": {
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
  if (fieldKey === "webinarName") return "contains";
  if (fieldKey === "assignedEmployee") return "equals";
  if (
    fieldKey === "totalRegistrations" ||
    fieldKey === "totalParticipants" ||
    fieldKey === "totalAttendees" ||
    fieldKey === "totalUnAttended" ||
    fieldKey === "webinarDate"
  ) {
    return "between";
  }
  return "contains";
};

const buildRowsFromValues = (values) => {
  const order = [
    "webinarName",
    "assignedEmployee",
    "totalRegistrations",
    "totalParticipants",
    "totalAttendees",
    "totalUnAttended",
    "webinarDate",
  ];
  const rows = [];
  for (const key of order) {
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
  webinarName: "Webinar name",
  assignedEmployee: "Assigned employee",
  totalRegistrations: "Registrations",
  totalParticipants: "Participants",
  totalAttendees: "Attendees",
  totalUnAttended: "Un-attended",
  webinarDate: "Webinar date",
};

const TEXT_OPERATORS = [
  { value: "contains", label: "Contains" },
  { value: "equals", label: "Equals" },
  { value: "startsWith", label: "Starts with" },
];

const ASSIGN_OPERATORS = [{ value: "equals", label: "Is" }];
const RANGE_OPERATORS = [{ value: "between", label: "Between" }];

const pillBase =
  "px-3 py-1.5 text-xs font-semibold rounded-full border transition-colors";

const normalizePickerDate = (value) => {
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value;
  if (typeof value === "string" && value.trim()) {
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  return null;
};

export default function WebinarConditionalLogicPanel({
  active,
  control,
  setValue,
  getValues,
  employeeOptions,
  onChainMeta,
  sanitizerRef,
  labelStyle,
  inputStyle,
  pickerDateFormat,
  isDark = false,
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
  const [webinarNameLocal, setWebinarNameLocal] = useState("");
  const prevAdvancedActive = useRef(false);
  const lastNameRowId = useRef(null);

  const enabledFieldEntries = useMemo(
    () => Object.entries(FIELD_LABELS),
    []
  );

  const usedKeys = useMemo(
    () => new Set(rows.map((r) => r.fieldKey).filter(Boolean)),
    [rows]
  );

  const canAddRow = usedKeys.size < enabledFieldEntries.length;

  const nameRow = useMemo(
    () => rows.find((r) => r.fieldKey === "webinarName"),
    [rows]
  );

  const flushNameToForm = useCallback(() => {
    if (!nameRow) return;
    const compiled = compileWebinarNameFilter(
      webinarNameLocal,
      nameRow.operator,
      nameRow.mode
    );
    setValue("webinarName", compiled, {
      shouldDirty: true,
      shouldValidate: false,
    });
  }, [webinarNameLocal, nameRow, setValue]);

  useEffect(() => {
    if (!active) {
      prevAdvancedActive.current = false;
      return;
    }
    if (!prevAdvancedActive.current) {
      const v = getValues();
      setRows(buildRowsFromValues(v));
    }
    prevAdvancedActive.current = true;
  }, [active, getValues]);

  useEffect(() => {
    if (!active) {
      onChainMeta?.({ hasOr: false, hadExcludeNonName: false });
      return;
    }
    const hasOr = rows.some((r, i) => i > 0 && (r.chain || "and") === "or");
    const hadExcludeNonName = rows.some(
      (r) =>
        r.mode === "exclude" &&
        r.fieldKey &&
        r.fieldKey !== "webinarName"
    );
    onChainMeta?.({ hasOr, hadExcludeNonName });
  }, [rows, active, onChainMeta]);

  useEffect(() => {
    if (!active) {
      if (sanitizerRef) sanitizerRef.current = (d) => d;
      return;
    }
    if (sanitizerRef) {
      sanitizerRef.current = (data) =>
        stripExcludedWebinarFields(data, rows);
    }
  }, [active, rows, sanitizerRef]);

  useEffect(() => {
    if (!nameRow) {
      lastNameRowId.current = null;
      return;
    }
    if (lastNameRowId.current !== nameRow.id) {
      lastNameRowId.current = nameRow.id;
      setWebinarNameLocal(String(getValues("webinarName") || ""));
    }
  }, [nameRow, getValues]);

  useEffect(() => {
    if (!active || !nameRow) return;
    const t = window.setTimeout(() => {
      setValue(
        "webinarName",
        compileWebinarNameFilter(
          webinarNameLocal,
          nameRow.operator,
          nameRow.mode
        ),
        { shouldDirty: true, shouldValidate: false }
      );
    }, 200);
    return () => window.clearTimeout(t);
  }, [active, webinarNameLocal, nameRow, setValue]);

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

  const operatorOptionsForField = (fieldKey) => {
    if (fieldKey === "webinarName") return TEXT_OPERATORS;
    if (fieldKey === "assignedEmployee") return ASSIGN_OPERATORS;
    if (
      fieldKey === "totalRegistrations" ||
      fieldKey === "totalParticipants" ||
      fieldKey === "totalAttendees" ||
      fieldKey === "totalUnAttended" ||
      fieldKey === "webinarDate"
    ) {
      return RANGE_OPERATORS;
    }
    if (!fieldKey) return TEXT_OPERATORS;
    return TEXT_OPERATORS;
  };

  const inactiveText = isDark ? "#94a3b8" : "#64748b";

  const renderIncludeExclude = (row) => (
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
          backgroundColor: row.mode === "include" ? "#22B573" : "transparent",
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
          backgroundColor: row.mode === "exclude" ? "#dc2626" : "transparent",
          color: row.mode === "exclude" ? "#ffffff" : inactiveText,
          borderColor: "transparent",
        }}
      >
        Exclude
      </button>
    </div>
  );

  const renderAndOrToggle = (row, index) => {
    if (index === 0) return null;
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
          style={{ color: inactiveText }}
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
      case "webinarName":
        return (
          <div className="w-full min-w-[160px] flex-1 max-w-md">
            <Input
              value={webinarNameLocal}
              onChange={(e) => setWebinarNameLocal(e.target.value)}
              onBlur={() => flushNameToForm()}
              type="text"
              placeholder="Enter value…"
              className="w-full p-2 rounded-lg text-sm focus:outline-none focus:ring-2"
              style={inputStyle}
            />
          </div>
        );
      case "assignedEmployee":
        return (
          <div className="w-full min-w-[180px] flex-1 max-w-md">
            <Controller
              control={control}
              name="assignedEmployee"
              render={({ field }) => (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      className="flex h-11 w-full items-center justify-between rounded-lg border px-3 py-2 text-sm outline-none transition-all duration-200 hover:bg-slate-50 dark:hover:bg-white/10"
                      style={inputStyle}
                    >
                      <span className="truncate">
                        {field.value
                          ? employeeOptions.find((o) => o.value === field.value)
                              ?.label || "Select employee"
                          : "All employees"}
                      </span>
                      <ChevronDown className="h-4 w-4 opacity-50 shrink-0" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="start"
                    className="w-[var(--radix-dropdown-menu-trigger-width)] min-w-[var(--radix-dropdown-menu-trigger-width)] max-h-[300px] z-[300] overflow-y-auto overflow-x-hidden custom-scrollbar bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-xl p-1"
                  >
                    <DropdownMenuItem
                      onClick={() => field.onChange("")}
                      className="cursor-pointer rounded-lg px-3 py-2 text-sm hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200"
                    >
                      All employees
                    </DropdownMenuItem>
                    {(employeeOptions || []).map((employee, idx) => (
                      <DropdownMenuItem
                        key={`emp-${idx}-${employee.value}`}
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
        );
      case "webinarDate":
        return (
          <div className="w-full flex flex-wrap gap-2 flex-1 min-w-[240px]">
            <div className="relative flex-1 min-w-[120px]">
              <Controller
                name="webinarDate.$gte"
                control={control}
                render={({ field }) => (
                  <DatePicker
                    date={normalizePickerDate(field.value)}
                    setDate={(date) => field.onChange(date)}
                    placeholder="From"
                    className="w-full text-sm"
                    style={inputStyle}
                  />
                )}
              />
            </div>
            <div className="relative flex-1 min-w-[120px]">
              <Controller
                name="webinarDate.$lte"
                control={control}
                render={({ field }) => (
                  <DatePicker
                    date={normalizePickerDate(field.value)}
                    setDate={(date) => field.onChange(date)}
                    placeholder="To"
                    className="w-full text-sm"
                    style={inputStyle}
                  />
                )}
              />
            </div>
          </div>
        );
      case "totalRegistrations":
      case "totalParticipants":
      case "totalAttendees":
      case "totalUnAttended": {
        const gteName = `${fieldKey}.$gte`;
        const lteName = `${fieldKey}.$lte`;
        return (
          <div className="flex gap-2 flex-1 min-w-[180px]">
            <Controller
              name={gteName}
              control={control}
              render={({ field }) => (
                <Input
                  {...field}
                  value={field.value ?? ""}
                  type="number"
                  min={0}
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
              render={({ field }) => (
                <Input
                  {...field}
                  value={field.value ?? ""}
                  type="number"
                  min={0}
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
            Use AND/OR between conditions for precise logic. The webinar API
            applies filters as AND; OR chains are noted when you apply.
            Exclude works for webinar name (via pattern); other fields only
            apply on Include.
          </span>
        </span>
      </div>

      <div className="space-y-3">
        {rows.map((row, index) => (
          <div
            key={row.id}
            className="rounded-xl border p-3 sm:p-4"
            style={{
              borderColor: isDark ? "rgba(255,255,255,0.1)" : "#e2e8f0",
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
                    className="min-w-[140px] flex-1 max-w-[220px] flex h-11 items-center justify-between rounded-lg border px-3 py-2 text-sm outline-none transition-all duration-200 hover:bg-slate-50 dark:hover:bg-white/10"
                    style={inputStyle}
                  >
                    <span className="truncate">
                      {row.fieldKey
                        ? FIELD_LABELS[row.fieldKey] || "Choose field…"
                        : "Choose field…"}
                    </span>
                    <ChevronDown className="h-4 w-4 opacity-50 shrink-0" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="start"
                  className="w-[var(--radix-dropdown-menu-trigger-width)] min-w-[var(--radix-dropdown-menu-trigger-width)] max-h-[300px] z-[300] overflow-y-auto overflow-x-hidden custom-scrollbar bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-xl p-1"
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
                      disabled={Boolean(row.fieldKey !== key && usedKeys.has(key))}
                      onClick={() => handleFieldChange(row.id, key)}
                      className="cursor-pointer rounded-lg px-3 py-2 text-sm hover:bg-slate-100 dark:hover:bg-white/10 text-slate-700 dark:text-slate-200"
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
                    className="min-w-[120px] max-w-[160px] flex h-11 items-center justify-between rounded-lg border px-3 py-2 text-sm outline-none transition-all duration-200 disabled:opacity-50 hover:bg-slate-50 dark:hover:bg-white/10"
                    style={inputStyle}
                  >
                    <span className="truncate">
                      {row.fieldKey
                        ? operatorOptionsForField(row.fieldKey).find(
                            (o) => o.value === row.operator
                          )?.label || "Operator"
                        : "Operator"}
                    </span>
                    <ChevronDown className="h-4 w-4 opacity-50 shrink-0" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="start"
                  className="w-[var(--radix-dropdown-menu-trigger-width)] min-w-[var(--radix-dropdown-menu-trigger-width)] max-h-[300px] z-[300] overflow-y-auto overflow-x-hidden custom-scrollbar bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-xl p-1"
                >
                  {operatorOptionsForField(row.fieldKey).map((op) => (
                    <DropdownMenuItem
                      key={op.value}
                      onClick={() => updateRow(row.id, { operator: op.value })}
                      className="cursor-pointer rounded-lg px-3 py-2 text-sm hover:bg-slate-100 dark:hover:bg-white/10 text-slate-700 dark:text-slate-200"
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
          <p className="text-xs mt-2" style={{ color: inactiveText }}>
            All available fields are in use. Remove a row to add another.
          </p>
        )}
      </div>
    </div>
  );
}
