"use client";

import * as React from "react";
import { useWebinars } from "@/hooks/useWebinars";
import { useWLHTags } from "@/hooks/useTags";
import { useAdvanceFilterCount } from "@/hooks/useAdvanceFilters";
import { useEmployees } from "@/hooks/useEmployees";

import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, Plus, RotateCcw, Filter, CheckCircle2, AlertCircle } from "lucide-react";

import type { Dispatch, SetStateAction } from "react";
import type {
  WlhAttendeeFilterState,
  WlhFiltersSelection,
} from "@/schemas/campaignSchema";

import type { FilterCondition } from "./WLHContacts/types";
import {
  createEmptyCondition,
  createConditionId,
  serializeConditions,
} from "./WLHContacts/utils";
import { FilterConditionCard } from "./WLHContacts/components/FilterConditionCard";
import { FilterResults } from "./WLHContacts/components/FilterResults";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { mapConditionsToAdvanceUnits } from "./WLHContacts/advanceFilterMapper";
import { WebinarSelector } from "./WLHContacts/components/WebinarSelector";
import { motion, AnimatePresence } from "framer-motion";

export default function WLHContacts({
  onNext,
  onPrevious,
  wlhAttendeeFilters,
  setWlhAttendeeFilters,
}: {
  onNext: () => void;
  onPrevious: () => void;
  wlhAttendeeFilters: WlhAttendeeFilterState;
  setWlhAttendeeFilters: Dispatch<SetStateAction<WlhAttendeeFilterState>>;
}) {
  const [conditions, setConditions] = React.useState<FilterCondition[]>([
    createEmptyCondition(),
  ]);
  const [activeTab, setActiveTab] = React.useState<"all" | "single">("single");
  const [selectedWebinarIds, setSelectedWebinarIds] = React.useState<string[]>(
    []
  );
  const [isAttended, setIsAttended] = React.useState<boolean | null>(
    wlhAttendeeFilters.isAttended ?? null
  );

  const { data: webinarsData } = useWebinars();
  const { data: WLHTags } = useWLHTags();

  const employeeRoleFilter = React.useMemo(() => {
    if (isAttended === true) {
      // Sales
      return "EMPLOYEE_SALES" as const;
    }
    if (isAttended === false) {
      // Reminder
      return "EMPLOYEE_REMINDER" as const;
    }
    return undefined;
  }, [isAttended]);

  const { data: employeesData } = useEmployees({
    roleFilter: employeeRoleFilter,
  });
  const {
    mutateAsync: fetchAdvanceCount,
    data: advanceCountData,
    isPending: advanceCountIsPending,
  } = useAdvanceFilterCount();

  React.useEffect(() => {
    if (wlhAttendeeFilters.filters) {
      const nonWebinarConditions = wlhAttendeeFilters.filters.conditions;

      setConditions(
        nonWebinarConditions.length > 0
          ? nonWebinarConditions.map((condition) => ({
            id: createConditionId(),
            mode: condition.mode,
            field: condition.field,
            operator: condition.operator,
            logicOperator: condition.logicOperator ?? "AND",
            value:
              condition.field === "tags" || condition.field === "assignedTo"
                ? condition.value
                : condition.value.join(", "),
          }))
          : [createEmptyCondition()]
      );

      // Restore previously selected webinars (supports multiple webinars)
      setSelectedWebinarIds(wlhAttendeeFilters.filters.webinarIds ?? []);
    } else {
      setConditions([createEmptyCondition()]);
      setSelectedWebinarIds([]);
    }

    setIsAttended(wlhAttendeeFilters.isAttended ?? null);
  }, [wlhAttendeeFilters.filters, wlhAttendeeFilters.isAttended]);

  const handleConditionUpdate = (
    id: string,
    updates: Partial<FilterCondition>
  ) => {
    setConditions((prev) =>
      prev.map((condition) =>
        condition.id === id ? { ...condition, ...updates } : condition
      )
    );
  };

  const handleRemoveCondition = (id: string) => {
    setConditions((prev) => {
      if (prev.length === 1) {
        return [createEmptyCondition()];
      }
      return prev.filter((condition) => condition.id !== id);
    });
  };

  const handleAddCondition = () => {
    setConditions((prev) => [...prev, createEmptyCondition()]);
  };

  const handleApply = async () => {
    const normalizedConditions = serializeConditions(conditions);

    if (activeTab === "single") {
      if (selectedWebinarIds.length === 0 || isAttended === null) {
        return;
      }

      const units = mapConditionsToAdvanceUnits(conditions);

      const payload: WlhFiltersSelection = {
        webinarIds: selectedWebinarIds,
        conditions: normalizedConditions,
      };

      try {
        const result = await fetchAdvanceCount({
          responseType: "count",
          webinarIds: selectedWebinarIds,
          isAttended,
          units,
        });

        const count = result.count ?? 0;

        setWlhAttendeeFilters({
          filters: payload,
          contactCount: count,
          isAttended,
        });
      } catch (_error) {
        // Silently fail for now; could add toast/logging here
      }

      return;
    }

    // "All" tab behavior is not yet implemented for advance filters
  };

  const handleReset = () => {
    setConditions([createEmptyCondition()]);
    setSelectedWebinarIds([]);
    setIsAttended(null);
    setWlhAttendeeFilters({
      filters: null,
      contactCount: 0,
      isAttended: null,
    });
  };

  const isApplyDisabled =
    activeTab === "single"
      ? selectedWebinarIds.length === 0 ||
      isAttended === null ||
      advanceCountIsPending
      : true;

  const handleNext = () => {
    // Filters and counts are already stored on apply
    onNext();
  };

  return (
    <div className="space-y-6">
      <div className="p-6 rounded-2xl border border-slate-200 bg-white/50 backdrop-blur-sm shadow-sm">
        <div className="space-y-8">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <div className="flex items-center gap-2 mb-1">
                <div className="h-4 w-1 bg-[#22B573] rounded-full" />
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Target Webinar</span>
              </div>
              <WebinarSelector
                webinars={(webinarsData as any)?.data ?? []}
                selectedWebinarIds={selectedWebinarIds}
                onSelectionChange={setSelectedWebinarIds}
                placeholder="Select one or more webinars..."
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 mb-1">
                <div className="h-4 w-1 bg-blue-500 rounded-full" />
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Attendance Type</span>
              </div>
              <div className="flex p-1 bg-slate-100 rounded-xl w-fit">
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  className={`h-9 px-6 rounded-lg text-xs font-bold transition-all ${isAttended === true ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
                  onClick={() => setIsAttended(true)}
                >
                  Sales
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  className={`h-9 px-6 rounded-lg text-xs font-bold transition-all ${isAttended === false ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
                  onClick={() => setIsAttended(false)}
                >
                  Reminder
                </Button>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-slate-400" />
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Advanced Segmentation Rules</span>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleAddCondition}
                className="h-8 text-[#22B573] hover:text-[#1a8d58] hover:bg-[#22B573]/5 font-bold text-[10px] uppercase tracking-wider"
              >
                <Plus className="mr-1.5 h-3.5 w-3.5" />
                Add Condition
              </Button>
            </div>

            <div className="space-y-3">
              <AnimatePresence initial={false}>
                {conditions.map((condition, index) => (
                  <motion.div
                    key={condition.id}
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <FilterConditionCard
                      condition={condition}
                      index={index}
                      webinars={(webinarsData as any)?.data ?? []}
                      tags={(WLHTags as any)?.data ?? []}
                      employees={(employeesData as any)?.data ?? []}
                      onUpdate={(updates) =>
                        handleConditionUpdate(condition.id, updates)
                      }
                      onRemove={() => handleRemoveCondition(condition.id)}
                    />
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-slate-50 border border-slate-100">
             <FilterResults
                isLoading={advanceCountIsPending}
                count={advanceCountData?.count}
              />
          </div>

          <div className="flex flex-col-reverse gap-4 sm:flex-row sm:items-center sm:justify-between pt-4">
            <Button
              type="button"
              variant="ghost"
              onClick={handleReset}
              className="h-10 px-4 rounded-xl text-slate-400 hover:text-slate-600 font-bold text-xs"
            >
              <RotateCcw className="mr-2 h-3.5 w-3.5" />
              Reset Filters
            </Button>
            
            <Button
              type="button"
              variant="default"
              disabled={isApplyDisabled}
              onClick={handleApply}
              className="h-11 px-8 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md shadow-blue-200 transition-all active:scale-[0.98] disabled:opacity-30"
            >
              {advanceCountIsPending ? (
                <>
                  <div className="h-4 w-4 border-2 border-white border-t-transparent animate-spin mr-2 rounded-full" />
                  Calculating...
                </>
              ) : (
                <>
                  <Filter className="mr-2 h-4 w-4" />
                  Apply Segment
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
