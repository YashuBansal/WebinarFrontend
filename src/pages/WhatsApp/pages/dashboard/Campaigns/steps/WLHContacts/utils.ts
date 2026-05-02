import type { FilterCondition } from "./types";
import type { WlhFilterCondition } from "@/schemas/campaignSchema";

export const createConditionId = () => {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `condition-${Math.random().toString(36).slice(2, 9)}`;
};

export const createEmptyCondition = (): FilterCondition => ({
  id: createConditionId(),
  mode: "include",
  field: "email",
  operator: "equals",
  logicOperator: "AND",
  value: "",
});

export const parseConditionValue = (value: string | string[]): string[] => {
  if (Array.isArray(value)) {
    return value.map((v) => v.trim().toLowerCase()).filter(Boolean);
  }
  return value
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
};

export const serializeConditions = (
  conditions: FilterCondition[]
): WlhFilterCondition[] =>
  conditions.reduce<WlhFilterCondition[]>((acc, condition, index) => {
    const parsed = parseConditionValue(condition.value);
    if (parsed.length === 0) {
      return acc;
    }

    // Derive fieldType and isMultiple in the same way we do for advance filters
    let fieldType: WlhFilterCondition["fieldType"] = "string";
    let isMultiple = parsed.length > 1;

    switch (condition.field) {
      case "tags":
        fieldType = "string";
        isMultiple = true;
        break;
      case "timeInSession":
        fieldType = "number";
        break;
      case "assignedTo":
        fieldType = "mongodb_id";
        break;
      default:
        fieldType = "string";
        break;
    }

    const transformed: WlhFilterCondition = {
      mode: condition.mode,
      field: condition.field,
      operator: condition.operator,
      value: parsed,
      logicOperator: "AND",
      fieldType,
      isMultiple,
    };

    if (index > 0) {
      transformed.logicOperator = condition.logicOperator ?? "AND";
    }

    acc.push(transformed);
    return acc;
  }, []);

