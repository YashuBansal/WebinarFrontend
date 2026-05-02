import { Input } from "@/components/ui/input";
import type { FilterCondition } from "../types";
import { FIELD_CONFIG } from "../types";
import { TagSelector } from "./TagSelector";
import { MultiSelect } from "./MultiSelect";
import type { Employee } from "@/api/modules/employeesApi";

interface Webinar {
  _id: string;
  webinarName: string;
}

interface Tag {
  _id: string;
  name: string;
}

interface ConditionValueInputProps {
  condition: FilterCondition;
  webinars?: Webinar[];
  tags?: Tag[];
  employees?: Employee[];
  onValueChange: (value: string | string[]) => void;
}

export function ConditionValueInput({
  condition,
  tags = [],
  employees = [],
  onValueChange,
}: ConditionValueInputProps) {
  if (condition.field === "tags") {
    const selectedNames = Array.isArray(condition.value)
      ? condition.value
      : [];
    return (
      <TagSelector
        tags={tags}
        selectedTagNames={selectedNames}
        onSelectionChange={(names) => onValueChange(names)}
        placeholder={FIELD_CONFIG.tags.placeholder}
      />
    );
  }

  if (condition.field === "assignedTo") {
    const selectedIds = Array.isArray(condition.value)
      ? condition.value
      : condition.value
      ? condition.value.split(",").map((v) => v.trim()).filter(Boolean)
      : [];

    const options = employees.map((emp) => ({
      id: emp._id,
      label: emp.userName,
      value: emp._id,
    }));

    return (
      <>
        <MultiSelect
          options={options}
          selectedValues={selectedIds}
          onSelectionChange={(values) => onValueChange(values)}
          placeholder={FIELD_CONFIG.assignedTo.placeholder}
          searchPlaceholder="Search employees..."
          emptyMessage="No employees found."
        />
        <p className="text-xs text-muted-foreground">
          {FIELD_CONFIG.assignedTo.helperText}
        </p>
      </>
    );
  }

  // Generic text input for all non-tag / non-assignedTo fields
  const config = FIELD_CONFIG[condition.field];

  return (
    <>
      <Input
        value={typeof condition.value === "string" ? condition.value : ""}
        onChange={(event) => onValueChange(event.target.value)}
        placeholder={config.placeholder}
      />
      <p className="text-xs text-muted-foreground">{config.helperText}</p>
    </>
  );
}

