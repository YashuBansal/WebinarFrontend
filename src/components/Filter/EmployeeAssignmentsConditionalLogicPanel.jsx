/* eslint-disable react/prop-types */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Controller } from "react-hook-form";
import { Filter, Plus, Trash2 } from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";

const makeRowId = () =>
  `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

const emptyDefaults = () => ({
  email: "",
  firstName: "",
  lastName: "",
  phone: "",
  location: "",
  profession: "",
  source: "",
  gender: "",
  status: "",
  leadType: "",
  tags: "",
  minTime: "",
  maxTime: "",
  dateFrom: "",
  dateTo: "",
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

function stripExcludedFields(data, rows) {
  const out = { ...data };
  for (const r of rows) {
    if (r.mode !== "exclude" || !r.fieldKey) continue;
    if (r.fieldKey === "timeInSession") {
      delete out.minTime;
      delete out.maxTime;
    } else if (r.fieldKey === "assignmentDate") {
      delete out.dateFrom;
      delete out.dateTo;
    }
  }
  return out;
}

function applyConditionalSanitize(data, rows) {
  let out = stripExcludedFields(data, rows);

  // Handle other exclusions as generic 'Not Equal' keys if API supports it
  const genericSelects = ["gender", "status", "leadType", "tags"];
  for (const key of genericSelects) {
    const row = rows.find((r) => r.fieldKey === key);
    if (row?.mode === "exclude" && out[key]) {
      const val = out[key];
      delete out[key];
      out[`${key}Ne`] = val;
    } else if (out[key] && ["status", "leadType", "tags"].includes(key)) {
      // Wrap in array for backend DTO
      if (!Array.isArray(out[key])) {
        out[key] = [out[key]];
      }
    } else if (key === "gender" && out[key]) {
      out[key] = out[key].toLowerCase();
    }
  }

  return out;
}

const clearFieldFromForm = (setValue, fieldKey) => {
  const d = emptyDefaults();
  switch (fieldKey) {
    case "email":
      setValue("email", d.email);
      break;
    case "firstName":
      setValue("firstName", d.firstName);
      break;
    case "lastName":
      setValue("lastName", d.lastName);
      break;
    case "phone":
      setValue("phone", d.phone);
      break;
    case "location":
      setValue("location", d.location);
      break;
    case "profession":
      setValue("profession", d.profession);
      break;
    case "source":
      setValue("source", d.source);
      break;
    case "gender":
      setValue("gender", d.gender);
      break;
    case "status":
      setValue("status", d.status);
      break;
    case "leadType":
      setValue("leadType", d.leadType);
      break;
    case "tags":
      setValue("tags", d.tags);
      break;
    case "timeInSession":
      setValue("minTime", d.minTime);
      setValue("maxTime", d.maxTime);
      break;
    case "assignmentDate":
      setValue("dateFrom", d.dateFrom);
      setValue("dateTo", d.dateTo);
      break;
    default:
      break;
  }
};

const fieldHasValue = (v, fieldKey) => {
  if (!v) return false;
  switch (fieldKey) {
    case "email": return Boolean(String(v.email || "").trim());
    case "firstName": return Boolean(String(v.firstName || "").trim());
    case "lastName": return Boolean(String(v.lastName || "").trim());
    case "phone": return Boolean(String(v.phone || "").trim());
    case "location": return Boolean(String(v.location || "").trim());
    case "profession": return Boolean(String(v.profession || "").trim());
    case "source": return Boolean(String(v.source || "").trim());
    case "gender": return Boolean(String(v.gender || "").trim());
    case "status": return Boolean(String(v.status || "").trim());
    case "leadType": return Boolean(String(v.leadType || "").trim());
    case "tags": return Boolean(String(v.tags || "").trim());
    case "timeInSession":
      return (
        (v.minTime !== undefined && v.minTime !== "" && v.minTime !== null) ||
        (v.maxTime !== undefined && v.maxTime !== "" && v.maxTime !== null)
      );
    case "assignmentDate":
      return (
        (v.dateFrom !== undefined && v.dateFrom !== "" && v.dateFrom !== null) ||
        (v.dateTo !== undefined && v.dateTo !== "" && v.dateTo !== null)
      );
    default:
      return false;
  }
};

const defaultOperator = (fieldKey) => {
  if (["email", "firstName", "lastName", "phone", "location", "profession", "source"].includes(fieldKey))
    return "contains";
  if (["gender", "status", "leadType", "tags"].includes(fieldKey)) return "equals";
  if (["timeInSession", "assignmentDate"].includes(fieldKey))
    return "between";
  return "contains";
};

const buildRowsFromValues = (values) => {
  const order = [
    "email", "firstName", "lastName", "phone", "location", "profession", "source",
    "gender", "status", "leadType", "tags",
    "timeInSession", "assignmentDate"
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
  email: "Email",
  firstName: "First Name",
  lastName: "Last Name",
  phone: "Phone",
  location: "Location",
  profession: "Profession",
  source: "Source",
  gender: "Gender",
  status: "Status",
  leadType: "Lead Type",
  tags: "Tags",
  timeInSession: "Time in Session",
  assignmentDate: "Assignment Date",
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

const TEXT_FIELD_KEYS = ["email", "firstName", "lastName", "phone", "location", "profession", "source"];

export default function EmployeeAssignmentsConditionalLogicPanel({
  active,
  control,
  setValue,
  getValues,
  onChainMeta,
  sanitizerRef,
  inputStyle,
  isDark = false,
  customOptionsForFilters = [],
  leadTypeOptions = [],
  tagData = [],
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

  const [localTexts, setLocalTexts] = useState({});
  const lastRowIds = useRef({});
  const prevAdvancedActive = useRef(false);

  const enabledFieldEntries = useMemo(() => Object.entries(FIELD_LABELS), []);

  const usedKeys = useMemo(
    () => new Set(rows.map((r) => r.fieldKey).filter(Boolean)),
    [rows],
  );

  const canAddRow = usedKeys.size < enabledFieldEntries.length;

  const flushTextToForm = useCallback(
    (fieldKey, localValue, row) => {
      if (!row) return;
      const compiled = compileTextFilter(localValue, row.operator, row.mode);
      setValue(fieldKey, compiled, {
        shouldDirty: true,
        shouldValidate: false,
      });
    },
    [setValue],
  );

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
      onChainMeta?.({ hasOr: false, hadExcludeRange: false });
      return;
    }
    const hasOr = rows.some((r, i) => i > 0 && (r.chain || "and") === "or");
    const hadExcludeRange = rows.some(
      (r) =>
        r.mode === "exclude" &&
        r.fieldKey &&
        (r.fieldKey === "timeInSession" || r.fieldKey === "assignmentDate"),
    );
    onChainMeta?.({ hasOr, hadExcludeRange });
  }, [rows, active, onChainMeta]);

  useEffect(() => {
    if (!active) {
      if (sanitizerRef) sanitizerRef.current = (d) => d;
      return;
    }
    if (sanitizerRef) {
      sanitizerRef.current = (data) =>
        applyConditionalSanitize(data, rows);
    }
  }, [active, rows, sanitizerRef]);

  // Handle local text syncing
  useEffect(() => {
    if (!active) return;
    
    setLocalTexts((prevLocal) => {
      let changed = false;
      const nextLocal = { ...prevLocal };

      TEXT_FIELD_KEYS.forEach(key => {
        const row = rows.find((r) => r.fieldKey === key);
        if (!row) {
          if (lastRowIds.current[key] !== null) {
            lastRowIds.current[key] = null;
          }
          return;
        }
        if (lastRowIds.current[key] !== row.id) {
          lastRowIds.current[key] = row.id;
          nextLocal[key] = String(getValues(key) || "");
          changed = true;
        }
      });
      return changed ? nextLocal : prevLocal;
    });
  }, [active, rows, getValues]);

  useEffect(() => {
    if (!active) return;
    const timers = [];
    TEXT_FIELD_KEYS.forEach(key => {
      const row = rows.find((r) => r.fieldKey === key);
      if (row) {
        const val = localTexts[key] || "";
        timers.push(window.setTimeout(() => {
          setValue(
            key,
            compileTextFilter(val, row.operator, row.mode),
            { shouldDirty: true, shouldValidate: false }
          );
        }, 200));
      }
    });
    return () => timers.forEach(window.clearTimeout);
  }, [active, localTexts, rows, setValue]);

  const updateRow = useCallback((rowId, patch) => {
    setRows((prev) =>
      prev.map((r) => (r.id === rowId ? { ...r, ...patch } : r)),
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
    [setValue],
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
    [setValue],
  );

  const operatorOptionsForField = (fieldKey) => {
    if (TEXT_FIELD_KEYS.includes(fieldKey)) return TEXT_OPERATORS;
    if (["gender", "status", "leadType", "tags"].includes(fieldKey)) return ASSIGN_OPERATORS;
    if (["timeInSession", "assignmentDate"].includes(fieldKey))
      return RANGE_OPERATORS;
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

    if (TEXT_FIELD_KEYS.includes(fieldKey)) {
      return (
        <div className="w-full min-w-[160px] flex-1 max-w-md">
          <Input
            value={localTexts[fieldKey] || ""}
            onChange={(e) => setLocalTexts(p => ({ ...p, [fieldKey]: e.target.value }))}
            onBlur={() => flushTextToForm(fieldKey, localTexts[fieldKey], row)}
            placeholder={`Enter ${FIELD_LABELS[fieldKey].toLowerCase()}…`}
            className="w-full p-2 rounded-lg text-sm focus:outline-none focus:ring-2"
            style={inputStyle}
          />
        </div>
      );
    }

    switch (fieldKey) {
      case "gender":
        return (
          <div className="w-full min-w-[140px] flex-1 max-w-xs">
            <Controller
              name="gender"
              control={control}
              render={({ field }) => (
                <select
                  {...field}
                  value={field.value || ""}
                  className="w-full p-2 rounded-lg text-sm focus:outline-none focus:ring-2 cursor-pointer"
                  style={inputStyle}
                >
                  <option value="">Select gender…</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="others">Other</option>
                </select>
              )}
            />
          </div>
        );
      case "status":
        return (
          <div className="w-full min-w-[140px] flex-1 max-w-xs">
            <Controller
              name="status"
              control={control}
              render={({ field }) => (
                <select
                  {...field}
                  value={field.value || ""}
                  className="w-full p-2 rounded-lg text-sm focus:outline-none focus:ring-2 cursor-pointer"
                  style={inputStyle}
                >
                  <option value="">Select status…</option>
                  {customOptionsForFilters.map((opt) => (
                    <option key={opt.value} value={opt.label}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              )}
            />
          </div>
        );
      case "leadType":
        return (
          <div className="w-full min-w-[140px] flex-1 max-w-xs">
            <Controller
              name="leadType"
              control={control}
              render={({ field }) => (
                <select
                  {...field}
                  value={field.value || ""}
                  className="w-full p-2 rounded-lg text-sm focus:outline-none focus:ring-2 cursor-pointer"
                  style={inputStyle}
                >
                  <option value="">Select lead type…</option>
                  {leadTypeOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              )}
            />
          </div>
        );
      case "tags":
        return (
          <div className="w-full min-w-[140px] flex-1 max-w-xs">
            <Controller
              name="tags"
              control={control}
              render={({ field }) => (
                <select
                  {...field}
                  value={field.value || ""}
                  className="w-full p-2 rounded-lg text-sm focus:outline-none focus:ring-2 cursor-pointer"
                  style={inputStyle}
                >
                  <option value="">Select tag…</option>
                  {tagData.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              )}
            />
          </div>
        );
      case "timeInSession": {
        return (
          <div className="flex gap-2 flex-1 min-w-[180px]">
            <Controller
              name="minTime"
              control={control}
              render={({ field }) => (
                <Input
                  {...field}
                  value={field.value ?? ""}
                  type="number"
                  min={0}
                  placeholder="Min Time (m)"
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
              name="maxTime"
              control={control}
              render={({ field }) => (
                <Input
                  {...field}
                  value={field.value ?? ""}
                  type="number"
                  min={0}
                  placeholder="Max Time (m)"
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
      case "assignmentDate": {
        return (
          <div className="flex gap-2 flex-1 min-w-[200px]">
            <Controller
              name="dateFrom"
              control={control}
              render={({ field }) => (
                <Input
                  {...field}
                  value={field.value ?? ""}
                  type="date"
                  className="w-full p-2 rounded-lg text-sm"
                  style={inputStyle}
                />
              )}
            />
            <Controller
              name="dateTo"
              control={control}
              render={({ field }) => (
                <Input
                  {...field}
                  value={field.value ?? ""}
                  type="date"
                  className="w-full p-2 rounded-lg text-sm"
                  style={inputStyle}
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
            Use AND/OR between conditions for precise logic. The employee assignments API
            applies all conditions as AND; OR chains are noted when you apply.
            Exclude on text fields uses regex patterns. Exclude
            on numeric/date ranges is omitted from the request.
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

              <select
                value={row.fieldKey}
                onChange={(e) => handleFieldChange(row.id, e.target.value)}
                className="min-w-[140px] flex-1 max-w-[220px] p-2 rounded-lg text-sm focus:outline-none focus:ring-2 cursor-pointer"
                style={inputStyle}
              >
                <option value="">Choose field…</option>
                {enabledFieldEntries.map(([key, label]) => (
                  <option
                    key={key}
                    value={key}
                    disabled={Boolean(
                      row.fieldKey !== key && usedKeys.has(key),
                    )}
                  >
                    {label}
                  </option>
                ))}
              </select>

              <select
                value={row.operator}
                onChange={(e) =>
                  updateRow(row.id, { operator: e.target.value })
                }
                disabled={!row.fieldKey}
                className="min-w-[120px] max-w-[160px] p-2 rounded-lg text-sm focus:outline-none focus:ring-2 cursor-pointer disabled:opacity-50"
                style={inputStyle}
              >
                {operatorOptionsForField(row.fieldKey).map((op) => (
                  <option key={op.value} value={op.value}>
                    {op.label}
                  </option>
                ))}
              </select>

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
