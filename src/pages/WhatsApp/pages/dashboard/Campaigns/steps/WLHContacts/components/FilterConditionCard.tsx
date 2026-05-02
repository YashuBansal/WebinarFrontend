import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Trash2 } from "lucide-react";
import type {
  FilterCondition,
  ConditionField,
  ConditionOperator,
} from "../types";
import {
  FIELD_CONFIG,
  OPERATOR_OPTIONS,
  FIELD_OPERATOR_CONFIG,
  LOGIC_OPTIONS,
} from "../types";
import { ConditionValueInput } from "./ConditionValueInput";
import React from "react";
import type { Employee } from "@/api/modules/employeesApi";

interface Webinar {
  _id: string;
  webinarName: string;
}

interface Tag {
  _id: string;
  name: string;
}

interface FilterConditionCardProps {
  condition: FilterCondition;
  index: number;
  webinars?: Webinar[];
  tags?: Tag[];
  employees?: Employee[];
  onUpdate: (updates: Partial<FilterCondition>) => void;
  onRemove: () => void;
}

export function FilterConditionCard({
  condition,
  index,
  webinars = [],
  tags = [],
  employees = [],
  onUpdate,
  onRemove,
}: FilterConditionCardProps) {
  const handleFieldChange = (field: ConditionField) => {
    const newValue = field === "tags" ? [] : "";
    onUpdate({ field, value: newValue });
  };

  const operatorOptionsForField = React.useMemo(() => {
    const allowed = FIELD_OPERATOR_CONFIG[condition.field];
    return OPERATOR_OPTIONS.filter((opt) => allowed.includes(opt.value));
  }, [condition.field]);

  return (
    <div className="rounded-lg border p-4 space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
          {index + 1}
        </span>
        <div className="flex items-center gap-2">
          {(["include", "exclude"] as const).map((modeOption) => (
            <Button
              key={modeOption}
              type="button"
              size="sm"
              variant={condition.mode === modeOption ? "default" : "outline"}
              onClick={() => onUpdate({ mode: modeOption })}
            >
              {modeOption === "include" ? "Include" : "Exclude"}
            </Button>
          ))}
        </div>

        {index > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-muted-foreground">
              Logic
            </span>
            {LOGIC_OPTIONS.map((logic) => (
              <Button
                key={logic}
                type="button"
                size="sm"
                variant={
                  condition.logicOperator === logic ? "default" : "outline"
                }
                onClick={() => onUpdate({ logicOperator: logic })}
              >
                {logic}
              </Button>
            ))}
          </div>
        )}

        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={onRemove}
          className="ml-auto text-muted-foreground hover:text-destructive"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <div className="flex flex-col gap-1">
          <span className="text-xs font-medium text-muted-foreground">
            Field
          </span>
          <Select
            value={condition.field}
            onValueChange={(value: ConditionField) => handleFieldChange(value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select field" />
            </SelectTrigger>
            <SelectContent className="max-h-60 overflow-y-auto">
              {(Object.keys(FIELD_CONFIG) as ConditionField[]).map(
                (fieldKey) => (
                  <SelectItem key={fieldKey} value={fieldKey}>
                    {FIELD_CONFIG[fieldKey].label}
                  </SelectItem>
                )
              )}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-1">
          <span className="text-xs font-medium text-muted-foreground">
            Operator
          </span>
          <Select
            value={condition.operator}
            onValueChange={(value: ConditionOperator) =>
              onUpdate({ operator: value })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Select operator" />
            </SelectTrigger>
            <SelectContent>
              {operatorOptionsForField.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-1 md:col-span-1">
          <span className="text-xs font-medium text-muted-foreground">
            Value
          </span>
          <ConditionValueInput
            condition={condition}
            webinars={webinars}
            tags={tags}
            employees={employees}
            onValueChange={(value) => onUpdate({ value })}
          />
        </div>
      </div>
    </div>
  );
}

