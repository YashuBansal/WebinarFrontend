import type { FilterCondition } from "./types";
import { parseConditionValue } from "./utils";
import type { AdvanceFilterUnit } from "@/api/modules/attendeesApi";

export const mapConditionsToAdvanceUnits = (
  conditions: FilterCondition[]
): AdvanceFilterUnit[] => {
  return conditions.reduce<AdvanceFilterUnit[]>((acc, condition, index) => {
    const values = parseConditionValue(condition.value);

    if (values.length === 0) {
      return acc;
    }

    let fieldType: AdvanceFilterUnit["fieldType"] = "string";
    let isMultiple = values.length > 1;
    const field = condition.field as AdvanceFilterUnit["field"];

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

    acc.push({
      mode: condition.mode,
      operator: condition.operator,
      logicOperator: index === 0 ? "AND" : condition.logicOperator,
      value: values,
      field,
      fieldType,
      isMultiple,
    });

    return acc;
  }, []);
};

export const mapAdvanceUnitsToConditions = (
  units: AdvanceFilterUnit[]
): FilterCondition[] => {
  return units.map((unit) => {
    let value: string | string[] = unit.value.join(", ");
    
    // For tags, we expect an array of strings in the UI state
    if (unit.field === "tags") {
      value = unit.value;
    }

    return {
      id: crypto.randomUUID(),
      mode: unit.mode as any,
      field: unit.field as any,
      operator: unit.operator as any,
      logicOperator: unit.logicOperator as any,
      value,
    };
  });
};
