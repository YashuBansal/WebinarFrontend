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
  userName: "",
  phone: "",
  isActive: "",
  role: "",
  "validCallTime.$gte": "",
  "validCallTime.$lte": "",
  "dailyContactLimit.$gte": "",
  "dailyContactLimit.$lte": "",
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

function stripExcludedEmployeeFields(data, rows) {
  const out = { ...data };
  for (const r of rows) {
    if (r.mode !== "exclude" || !r.fieldKey) continue;
    if (r.fieldKey === "validCallTime") {
      delete out.validCallTime;
      delete out["validCallTime.$gte"];
      delete out["validCallTime.$lte"];
    } else if (r.fieldKey === "dailyContactLimit") {
      delete out.dailyContactLimit;
      delete out["dailyContactLimit.$gte"];
      delete out["dailyContactLimit.$lte"];
    }
  }
  return out;
}

function applyEmployeeConditionalSanitize(data, rows) {
  let out = stripExcludedEmployeeFields(data, rows);
  const isActiveRow = rows.find((r) => r.fieldKey === "isActive");
  if (isActiveRow?.mode === "exclude" && out.isActive) {
    out = {
      ...out,
      isActive: out.isActive === "active" ? "inactive" : "active",
    };
  }
  const roleRow = rows.find((r) => r.fieldKey === "role");
  if (roleRow?.mode === "exclude" && out.role) {
    const { role, ...rest } = out;
    out = { ...rest, roleNe: role };
  }
  return out;
}

const clearFieldFromForm = (setValue, fieldKey) => {
  const d = emptyDefaults();
  switch (fieldKey) {
    case "email":
      setValue("email", d.email);
      break;
    case "userName":
      setValue("userName", d.userName);
      break;
    case "phone":
      setValue("phone", d.phone);
      break;
    case "isActive":
      setValue("isActive", d.isActive);
      break;
    case "role":
      setValue("role", d.role);
      break;
    case "validCallTime":
      setValue("validCallTime.$gte", d["validCallTime.$gte"]);
      setValue("validCallTime.$lte", d["validCallTime.$lte"]);
      break;
    case "dailyContactLimit":
      setValue("dailyContactLimit.$gte", d["dailyContactLimit.$gte"]);
      setValue("dailyContactLimit.$lte", d["dailyContactLimit.$lte"]);
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
    case "userName":
      return Boolean(String(v.userName || "").trim());
    case "phone":
      return Boolean(String(v.phone || "").trim());
    case "isActive":
      return Boolean(String(v.isActive || "").trim());
    case "role":
      return Boolean(String(v.role || "").trim());
    case "validCallTime":
    case "dailyContactLimit": {
      const gte = v[fieldKey]?.$gte ?? v[`${fieldKey}.$gte`];
      const lte = v[fieldKey]?.$lte ?? v[`${fieldKey}.$lte`];
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
  if (fieldKey === "email" || fieldKey === "userName" || fieldKey === "phone")
    return "contains";
  if (fieldKey === "isActive" || fieldKey === "role") return "equals";
  if (fieldKey === "validCallTime" || fieldKey === "dailyContactLimit")
    return "between";
  return "contains";
};

const buildRowsFromValues = (values) => {
  const order = [
    "email",
    "userName",
    "phone",
    "isActive",
    "role",
    "validCallTime",
    "dailyContactLimit",
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
  userName: "User name",
  phone: "Phone",
  isActive: "Status",
  role: "Role",
  validCallTime: "Valid call time (sec)",
  dailyContactLimit: "Daily contact limit",
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

const TEXT_FIELD_KEYS = ["email", "userName", "phone"];

export default function EmployeeConditionalLogicPanel({
  active,
  control,
  setValue,
  getValues,
  roleOptionValues,
  onChainMeta,
  sanitizerRef,
  inputStyle,
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
  const [emailLocal, setEmailLocal] = useState("");
  const [userNameLocal, setUserNameLocal] = useState("");
  const [phoneLocal, setPhoneLocal] = useState("");
  const prevAdvancedActive = useRef(false);
  const lastEmailRowId = useRef(null);
  const lastUserNameRowId = useRef(null);
  const lastPhoneRowId = useRef(null);

  const enabledFieldEntries = useMemo(
    () => Object.entries(FIELD_LABELS),
    []
  );

  const usedKeys = useMemo(
    () => new Set(rows.map((r) => r.fieldKey).filter(Boolean)),
    [rows]
  );

  const canAddRow = usedKeys.size < enabledFieldEntries.length;

  const emailRow = useMemo(
    () => rows.find((r) => r.fieldKey === "email"),
    [rows]
  );
  const userNameRow = useMemo(
    () => rows.find((r) => r.fieldKey === "userName"),
    [rows]
  );
  const phoneRow = useMemo(
    () => rows.find((r) => r.fieldKey === "phone"),
    [rows]
  );

  const flushTextToForm = useCallback(
    (fieldKey, local, row) => {
      if (!row) return;
      const compiled = compileTextFilter(local, row.operator, row.mode);
      setValue(fieldKey, compiled, {
        shouldDirty: true,
        shouldValidate: false,
      });
    },
    [setValue]
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
        (r.fieldKey === "validCallTime" ||
          r.fieldKey === "dailyContactLimit")
    );
    onChainMeta?.({ hasOr, hadExcludeRange });
  }, [rows, active, onChainMeta]);

  useEffect(() => {
    if (!active) {
      if (sanitizerRef) sanitizerRef.current = (d) => d;
      return;
    }
    if (sanitizerRef) {
      sanitizerRef.current = (data) => applyEmployeeConditionalSanitize(data, rows);
    }
  }, [active, rows, sanitizerRef]);

  useEffect(() => {
    if (!active) return;
    if (!emailRow) {
      lastEmailRowId.current = null;
      return;
    }
    if (lastEmailRowId.current !== emailRow.id) {
      lastEmailRowId.current = emailRow.id;
      setEmailLocal(String(getValues("email") || ""));
    }
  }, [active, emailRow, getValues]);

  useEffect(() => {
    if (!active) return;
    if (!userNameRow) {
      lastUserNameRowId.current = null;
      return;
    }
    if (lastUserNameRowId.current !== userNameRow.id) {
      lastUserNameRowId.current = userNameRow.id;
      setUserNameLocal(String(getValues("userName") || ""));
    }
  }, [active, userNameRow, getValues]);

  useEffect(() => {
    if (!active) return;
    if (!phoneRow) {
      lastPhoneRowId.current = null;
      return;
    }
    if (lastPhoneRowId.current !== phoneRow.id) {
      lastPhoneRowId.current = phoneRow.id;
      setPhoneLocal(String(getValues("phone") || ""));
    }
  }, [active, phoneRow, getValues]);

  useEffect(() => {
    if (!active || !emailRow) return;
    const t = window.setTimeout(() => {
      setValue(
        "email",
        compileTextFilter(emailLocal, emailRow.operator, emailRow.mode),
        { shouldDirty: true, shouldValidate: false }
      );
    }, 200);
    return () => window.clearTimeout(t);
  }, [active, emailLocal, emailRow, setValue]);

  useEffect(() => {
    if (!active || !userNameRow) return;
    const t = window.setTimeout(() => {
      setValue(
        "userName",
        compileTextFilter(userNameLocal, userNameRow.operator, userNameRow.mode),
        { shouldDirty: true, shouldValidate: false }
      );
    }, 200);
    return () => window.clearTimeout(t);
  }, [active, userNameLocal, userNameRow, setValue]);

  useEffect(() => {
    if (!active || !phoneRow) return;
    const t = window.setTimeout(() => {
      setValue(
        "phone",
        compileTextFilter(phoneLocal, phoneRow.operator, phoneRow.mode),
        { shouldDirty: true, shouldValidate: false }
      );
    }, 200);
    return () => window.clearTimeout(t);
  }, [active, phoneLocal, phoneRow, setValue]);

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
    if (TEXT_FIELD_KEYS.includes(fieldKey)) return TEXT_OPERATORS;
    if (fieldKey === "isActive" || fieldKey === "role") return ASSIGN_OPERATORS;
    if (fieldKey === "validCallTime" || fieldKey === "dailyContactLimit")
      return RANGE_OPERATORS;
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
      case "email":
        return (
          <div className="w-full min-w-[160px] flex-1 max-w-md">
            <Input
              value={emailLocal}
              onChange={(e) => setEmailLocal(e.target.value)}
              onBlur={() => flushTextToForm("email", emailLocal, emailRow)}
              placeholder="Enter value…"
              className="w-full p-2 rounded-lg text-sm focus:outline-none focus:ring-2"
              style={inputStyle}
            />
          </div>
        );
      case "userName":
        return (
          <div className="w-full min-w-[160px] flex-1 max-w-md">
            <Input
              value={userNameLocal}
              onChange={(e) => setUserNameLocal(e.target.value)}
              onBlur={() =>
                flushTextToForm("userName", userNameLocal, userNameRow)
              }
              placeholder="Enter value…"
              className="w-full p-2 rounded-lg text-sm focus:outline-none focus:ring-2"
              style={inputStyle}
            />
          </div>
        );
      case "phone":
        return (
          <div className="w-full min-w-[160px] flex-1 max-w-md">
            <Input
              value={phoneLocal}
              onChange={(e) => setPhoneLocal(e.target.value)}
              onBlur={() => flushTextToForm("phone", phoneLocal, phoneRow)}
              placeholder="Enter value…"
              className="w-full p-2 rounded-lg text-sm focus:outline-none focus:ring-2"
              style={inputStyle}
            />
          </div>
        );
      case "isActive":
        return (
          <div className="w-full min-w-[140px] flex-1 max-w-xs">
            <Controller
              name="isActive"
              control={control}
              render={({ field }) => (
                <select
                  {...field}
                  value={field.value || ""}
                  className="w-full p-2 rounded-lg text-sm focus:outline-none focus:ring-2 cursor-pointer"
                  style={inputStyle}
                >
                  <option value="">Select…</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              )}
            />
          </div>
        );
      case "role":
        return (
          <div className="w-full min-w-[180px] flex-1 max-w-md">
            <Controller
              name="role"
              control={control}
              render={({ field }) => (
                <select
                  {...field}
                  value={field.value || ""}
                  className="w-full p-2 rounded-lg text-sm focus:outline-none focus:ring-2 cursor-pointer"
                  style={inputStyle}
                >
                  <option value="">Select role…</option>
                  {(roleOptionValues || []).map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              )}
            />
          </div>
        );
      case "validCallTime":
      case "dailyContactLimit": {
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
                  min={1}
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
                  min={1}
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
            Use AND/OR between conditions for precise logic. The employee API
            applies all conditions as AND; OR chains are noted when you apply.
            Exclude on email, user name, and phone uses regex patterns. Exclude
            on numeric ranges is omitted from the request.
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
                      row.fieldKey !== key && usedKeys.has(key)
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
