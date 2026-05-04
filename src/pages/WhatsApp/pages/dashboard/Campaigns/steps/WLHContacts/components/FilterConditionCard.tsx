import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Trash2, Hash, Layers, Settings2, Database } from "lucide-react";
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
    <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-5 shadow-sm hover:border-slate-300 transition-colors">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-7 w-7 rounded-lg bg-slate-900 flex items-center justify-center">
            <span className="text-[10px] font-black text-white">{index + 1}</span>
          </div>
          
          <div className="flex p-0.5 bg-slate-100 rounded-lg">
            {(["include", "exclude"] as const).map((modeOption) => (
              <Button
                key={modeOption}
                type="button"
                size="sm"
                variant="ghost"
                className={`h-7 px-4 rounded-md text-[10px] font-black uppercase tracking-wider transition-all ${condition.mode === modeOption ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
                onClick={() => onUpdate({ mode: modeOption })}
              >
                {modeOption}
              </Button>
            ))}
          </div>

          {index > 0 && (
            <div className="flex items-center gap-2 border-l pl-3 ml-1 border-slate-200">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Logic</span>
              <div className="flex p-0.5 bg-slate-100 rounded-lg">
                {LOGIC_OPTIONS.map((logic) => (
                  <Button
                    key={logic}
                    type="button"
                    size="sm"
                    variant="ghost"
                    className={`h-7 px-4 rounded-md text-[10px] font-black uppercase tracking-wider transition-all ${condition.logicOperator === logic ? "bg-slate-900 text-white shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
                    onClick={() => onUpdate({ logicOperator: logic })}
                  >
                    {logic}
                  </Button>
                ))}
              </div>
            </div>
          )}
        </div>

        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={onRemove}
          className="h-8 w-8 text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors rounded-lg"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-12">
        <div className="md:col-span-4 space-y-2">
          <div className="flex items-center gap-2">
            <Database className="h-3 w-3 text-slate-400" />
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Data Field</span>
          </div>
          <Select
            value={condition.field}
            onValueChange={(value: ConditionField) => handleFieldChange(value)}
          >
            <SelectTrigger className="h-10 rounded-xl border-slate-200 bg-slate-50/50 text-xs font-bold focus:ring-[#22B573]/10 focus:border-[#22B573] transition-all">
              <SelectValue placeholder="Select field" />
            </SelectTrigger>
            <SelectContent className="rounded-xl border-slate-200 shadow-xl">
              {(Object.keys(FIELD_CONFIG) as ConditionField[]).map(
                (fieldKey) => (
                  <SelectItem key={fieldKey} value={fieldKey} className="text-xs font-medium py-2.5 rounded-lg">
                    {FIELD_CONFIG[fieldKey].label}
                  </SelectItem>
                )
              )}
            </SelectContent>
          </Select>
        </div>

        <div className="md:col-span-3 space-y-2">
          <div className="flex items-center gap-2">
            <Settings2 className="h-3 w-3 text-slate-400" />
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Operator</span>
          </div>
          <Select
            value={condition.operator}
            onValueChange={(value: ConditionOperator) =>
              onUpdate({ operator: value })
            }
          >
            <SelectTrigger className="h-10 rounded-xl border-slate-200 bg-slate-50/50 text-xs font-bold focus:ring-[#22B573]/10 focus:border-[#22B573] transition-all">
              <SelectValue placeholder="Select operator" />
            </SelectTrigger>
            <SelectContent className="rounded-xl border-slate-200 shadow-xl">
              {operatorOptionsForField.map((option) => (
                <SelectItem key={option.value} value={option.value} className="text-xs font-medium py-2.5 rounded-lg">
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="md:col-span-5 space-y-2">
          <div className="flex items-center gap-2">
            <Layers className="h-3 w-3 text-slate-400" />
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Criteria Value</span>
          </div>
          <div className="relative group">
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
    </div>
  );
}

