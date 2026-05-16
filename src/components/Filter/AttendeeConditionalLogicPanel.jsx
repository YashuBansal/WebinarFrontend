import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Controller } from "react-hook-form";
import { Filter, Plus, Trash2, ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "../ui/dropdown-menu";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import Select from "react-select";

const makeRowId = () =>
  `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

const emptyDefaults = () => ({
  email: "",
  firstName: "",
  lastName: "",
  phone: "",
  location: "",
  profession: "",
  tags: [],
  enrollments: [],
  lastAssignedTo: "",
  "timeInSession.$gte": "",
  "timeInSession.$lte": "",
  "attendedCount.$gte": "",
  "attendedCount.$lte": null,
  "registeredCount.$gte": "",
  "registeredCount.$lte": "",
});

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const compileTextFilter = (raw, operator, mode) => {
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

function stripExcludedAttendeeFields(data, rows) {
  const out = { ...data };
  for (const r of rows) {
    if (r.mode !== "exclude" || !r.fieldKey) continue;
    const k = r.fieldKey;
    // For text fields, we use regex so we don't delete them, but for others we might need to
    if (["email", "firstName", "lastName", "phone", "location", "profession"].includes(k)) continue;
    
    if (k === "tags") delete out.tags;
    else if (k === "enrollments") delete out.enrollments;
    else if (k === "lastAssignedTo") delete out.lastAssignedTo;
    else if (["timeInSession", "attendedCount", "registeredCount"].includes(k)) {
        delete out[k];
        delete out[`${k}.$gte`];
        delete out[`${k}.$lte`];
    }
  }
  return out;
}

const FIELD_LABELS = {
  email: "Email",
  firstName: "First Name",
  lastName: "Last Name",
  phone: "Phone",
  location: "Location",
  profession: "Profession",
  tags: "Tags",
  enrollments: "Enrollments",
  lastAssignedTo: "Assigned To",
  timeInSession: "Time In Session",
  attendedCount: "Attended Count",
  registeredCount: "Registered Count",
  gender: "Gender",
  status: "Status",
  source: "Source",
  leadType: "Lead Type",
};

const TEXT_OPERATORS = [
  { value: "contains", label: "Contains" },
  { value: "equals", label: "Equals" },
  { value: "startsWith", label: "Starts with" },
];

const SELECT_OPERATORS = [{ value: "equals", label: "Is" }];
const RANGE_OPERATORS = [{ value: "between", label: "Between" }];

const pillBase = "px-3 py-1.5 text-xs font-semibold rounded-full border transition-colors";

export default function AttendeeConditionalLogicPanel({
  active,
  control,
  setValue,
  getValues,
  tagOptions = [],
  productOptions = [],
  employeeOptions = [],
  statusOptions = [],
  sourceOptions = [],
  leadTypeOptions = [],
  onChainMeta,
  sanitizerRef,
  inputStyle,
  rsStyles,
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

  const [localTextFields, setLocalTextFields] = useState({});
  const prevAdvancedActive = useRef(false);

  const enabledFieldEntries = useMemo(() => Object.entries(FIELD_LABELS), []);
  const usedKeys = useMemo(() => new Set(rows.map((r) => r.fieldKey).filter(Boolean)), [rows]);
  const canAddRow = usedKeys.size < enabledFieldEntries.length;

  const fieldHasValue = (v, fieldKey) => {
    if (!v) return false;
    if (["email", "firstName", "lastName", "phone", "location", "profession"].includes(fieldKey)) {
        return Boolean(String(v[fieldKey] || "").trim());
    }
    if (fieldKey === "tags" || fieldKey === "enrollments") {
        return Array.isArray(v[fieldKey]) && v[fieldKey].length > 0;
    }
    if (fieldKey === "lastAssignedTo") {
        return Boolean(v[fieldKey]);
    }
    if (["timeInSession", "attendedCount", "registeredCount"].includes(fieldKey)) {
        const gte = v[`${fieldKey}.$gte`];
        const lte = v[`${fieldKey}.$lte`];
        return (gte !== undefined && gte !== "" && gte !== null) || (lte !== undefined && lte !== "" && lte !== null);
    }
    return false;
  };

  const defaultOperator = (fieldKey) => {
    if (["email", "firstName", "lastName", "phone", "location", "profession"].includes(fieldKey)) return "contains";
    if (["tags", "enrollments", "lastAssignedTo"].includes(fieldKey)) return "equals";
    if (["timeInSession", "attendedCount", "registeredCount"].includes(fieldKey)) return "between";
    return "contains";
  };

  const buildRowsFromValues = (values) => {
    const order = Object.keys(FIELD_LABELS);
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
    return rows.length ? rows : [{ id: makeRowId(), fieldKey: "", mode: "include", operator: "contains", chain: "and" }];
  };

  useEffect(() => {
    if (!active) {
      prevAdvancedActive.current = false;
      return;
    }
    if (!prevAdvancedActive.current) {
      const v = getValues();
      setRows(buildRowsFromValues(v));
      
      const locals = {};
      ["email", "firstName", "lastName", "phone", "location", "profession"].forEach(k => {
        locals[k] = String(v[k] || "");
      });
      setLocalTextFields(locals);
    }
    prevAdvancedActive.current = true;
  }, [active, getValues]);

  useEffect(() => {
    if (!active) {
      onChainMeta?.({ hasOr: false });
      return;
    }
    const hasOr = rows.some((r, i) => i > 0 && (r.chain || "and") === "or");
    onChainMeta?.({ hasOr });
  }, [rows, active, onChainMeta]);

  useEffect(() => {
    if (!active) {
      if (sanitizerRef) sanitizerRef.current = (d) => d;
      return;
    }
    if (sanitizerRef) {
      sanitizerRef.current = (data) => stripExcludedAttendeeFields(data, rows);
    }
  }, [active, rows, sanitizerRef]);

  // Sync text fields to form with debounce
  useEffect(() => {
    if (!active) return;
    const t = window.setTimeout(() => {
      rows.forEach(row => {
        if (["email", "firstName", "lastName", "phone", "location", "profession"].includes(row.fieldKey)) {
            const val = localTextFields[row.fieldKey] || "";
            const compiled = compileTextFilter(val, row.operator, row.mode);
            setValue(row.fieldKey, compiled, { shouldDirty: true });
        }
      });
    }, 300);
    return () => window.clearTimeout(t);
  }, [active, localTextFields, rows, setValue]);

  const updateRow = (rowId, patch) => {
    setRows((prev) => prev.map((r) => (r.id === rowId ? { ...r, ...patch } : r)));
  };

  const handleFieldChange = (rowId, newKey) => {
    setRows((prev) => {
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
        return r;
      });
    });
  };

  const addRow = () => {
    if (!canAddRow) return;
    setRows((prev) => [...prev, { id: makeRowId(), fieldKey: "", mode: "include", operator: "contains", chain: "and" }]);
  };

  const removeRow = (rowId) => {
    setRows((prev) => {
      const next = prev.filter((r) => r.id !== rowId);
      return next.length ? next : [{ id: makeRowId(), fieldKey: "", mode: "include", operator: "contains", chain: "and" }];
    });
  };

  const operatorOptionsForField = (fieldKey) => {
    if (["email", "firstName", "lastName", "phone", "location", "profession"].includes(fieldKey)) return TEXT_OPERATORS;
    if (["tags", "enrollments", "lastAssignedTo"].includes(fieldKey)) return SELECT_OPERATORS;
    if (["timeInSession", "attendedCount", "registeredCount"].includes(fieldKey)) return RANGE_OPERATORS;
    return TEXT_OPERATORS;
  };

  const inactiveText = isDark ? "#94a3b8" : "#64748b";

  const renderIncludeExclude = (row) => (
    <div className="inline-flex rounded-full border p-0.5 shrink-0" style={{ borderColor: isDark ? "#334155" : "#e2e8f0", backgroundColor: isDark ? "#0f172a" : "#f8fafc" }}>
      <button type="button" onClick={() => updateRow(row.id, { mode: "include" })} className={pillBase} style={{ backgroundColor: row.mode === "include" ? "#22B573" : "transparent", color: row.mode === "include" ? "#ffffff" : inactiveText, borderColor: "transparent" }}>Include</button>
      <button type="button" onClick={() => updateRow(row.id, { mode: "exclude" })} className={pillBase} style={{ backgroundColor: row.mode === "exclude" ? "#dc2626" : "transparent", color: row.mode === "exclude" ? "#ffffff" : inactiveText, borderColor: "transparent" }}>Exclude</button>
    </div>
  );

  const renderAndOrToggle = (row, index) => {
    if (index === 0) return null;
    const chain = row.chain || "and";
    return (
      <div className="inline-flex rounded-full border p-0.5 shrink-0" style={{ borderColor: isDark ? "#334155" : "#e2e8f0", backgroundColor: isDark ? "#0f172a" : "#f8fafc" }}>
        <button type="button" onClick={() => updateRow(row.id, { chain: "and" })} className={`${pillBase} px-2.5 text-[11px]`} style={{ backgroundColor: chain === "and" ? "#2563eb" : "transparent", color: chain === "and" ? "#ffffff" : inactiveText, borderColor: "transparent" }}>AND</button>
        <button type="button" onClick={() => updateRow(row.id, { chain: "or" })} className={`${pillBase} px-2.5 text-[11px]`} style={{ backgroundColor: chain === "or" ? "#2563eb" : "transparent", color: chain === "or" ? "#ffffff" : inactiveText, borderColor: "transparent" }}>OR</button>
      </div>
    );
  };

  const renderValueEditor = (row) => {
    const { fieldKey } = row;
    if (!fieldKey) return <div className="w-full min-w-[160px] flex-1 max-w-md"><Input readOnly placeholder="Enter value…" style={inputStyle} className="opacity-60" /></div>;

    if (["email", "firstName", "lastName", "phone", "location", "profession"].includes(fieldKey)) {
      return (
        <div className="w-full min-w-[160px] flex-1 max-w-md">
          <Input
            value={localTextFields[fieldKey] || ""}
            onChange={(e) => setLocalTextFields(prev => ({ ...prev, [fieldKey]: e.target.value }))}
            placeholder="Enter value…"
            style={inputStyle}
          />
        </div>
      );
    }

    if (fieldKey === "tags" || fieldKey === "enrollments") {
        const options = fieldKey === "tags" ? tagOptions : productOptions;
        return (
            <div className="w-full min-w-[200px] flex-1 max-w-md">
                <Controller
                    control={control}
                    name={fieldKey}
                    render={({ field }) => (
                        <Select
                            isMulti
                            options={options}
                            value={options.filter(o => field.value?.includes(o.value))}
                            onChange={(val) => field.onChange(val.map(v => v.value))}
                            styles={rsStyles}
                            placeholder={`Select ${fieldKey}...`}
                            menuPortalTarget={document.body}
                        />
                    )}
                />
            </div>
        );
    }

    if (fieldKey === "lastAssignedTo") {
        return (
            <div className="w-full min-w-[180px] flex-1 max-w-md">
                <Controller
                    control={control}
                    name="lastAssignedTo"
                    render={({ field }) => (
                        <Select
                            options={employeeOptions}
                            value={employeeOptions.find(o => o.value === field.value)}
                            onChange={(val) => field.onChange(val?.value)}
                            styles={rsStyles}
                            placeholder="Select Employee..."
                            isClearable
                            menuPortalTarget={document.body}
                        />
                    )}
                />
            </div>
        );
    }

    if (["gender", "status", "source", "leadType"].includes(fieldKey)) {
        let options = [];
        if (fieldKey === "gender") options = [{ label: "Male", value: "Male" }, { label: "Female", value: "Female" }, { label: "Other", value: "Other" }];
        else if (fieldKey === "status") options = statusOptions;
        else if (fieldKey === "source") options = sourceOptions;
        else if (fieldKey === "leadType") options = leadTypeOptions;

        return (
            <div className="w-full min-w-[180px] flex-1 max-w-md">
                <Controller
                    control={control}
                    name={fieldKey}
                    render={({ field }) => (
                        <Select
                            options={options}
                            value={options.find(o => o.value === field.value)}
                            onChange={(val) => field.onChange(val?.value)}
                            styles={rsStyles}
                            placeholder={`Select ${FIELD_LABELS[fieldKey]}...`}
                            isClearable
                            menuPortalTarget={document.body}
                        />
                    )}
                />
            </div>
        );
    }

    if (["timeInSession", "attendedCount", "registeredCount"].includes(fieldKey)) {
        return (
            <div className="flex gap-2 flex-1 min-w-[180px]">
                <Controller
                    name={`${fieldKey}.$gte`}
                    control={control}
                    render={({ field }) => (
                        <Input {...field} value={field.value ?? ""} type="number" placeholder="Min" style={inputStyle} />
                    )}
                />
                <Controller
                    name={`${fieldKey}.$lte`}
                    control={control}
                    render={({ field }) => (
                        <Input {...field} value={field.value ?? ""} type="number" placeholder="Max" style={inputStyle} />
                    )}
                />
            </div>
        );
    }

    return null;
  };

  return (
    <div className="space-y-4">
      <div className="p-3 rounded-xl border bg-blue-50/50 dark:bg-blue-900/10 border-blue-100 dark:border-blue-800/30">
        <span className="text-[12px] font-medium flex items-start gap-2 leading-relaxed text-blue-700 dark:text-blue-300">
          <Filter className="w-4 h-4 shrink-0 mt-0.5" />
          <span>Advanced logic allows complex filtering. Text fields support Includes/Excludes via regex. Numeric fields support ranges.</span>
        </span>
      </div>

      <div className="space-y-3">
        {rows.map((row, index) => (
          <div key={row.id} className="rounded-xl border p-3 sm:p-4 bg-white dark:bg-slate-900/50 border-slate-200 dark:border-slate-800">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold bg-green-500 text-white">
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
              <Button type="button" variant="ghost" onClick={() => removeRow(row.id)} className="h-9 w-9 p-0 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20">
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      <Button type="button" onClick={addRow} disabled={!canAddRow} className="rounded-xl gap-2 bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/20">
        <Plus className="w-4 h-4" /> Add Condition
      </Button>
    </div>
  );
}
