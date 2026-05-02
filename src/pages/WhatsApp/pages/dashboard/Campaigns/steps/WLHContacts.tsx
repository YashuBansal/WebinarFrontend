"use client";

import * as React from "react";
import { useWebinars } from "@/hooks/useWebinars";
import { useWLHTags } from "@/hooks/useTags";
import { useAdvanceFilterCount } from "@/hooks/useAdvanceFilters";
import { useEmployees } from "@/hooks/useEmployees";

import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, Plus } from "lucide-react";

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
    <div className="p-4 sm:py-6 md:py-8 grid grid-cols-1 rounded-md border border-gray-200">
      <div className="w-full flex justify-center my-2 ">
        <Tabs
          value={activeTab}
          onValueChange={(value) =>
            setActiveTab(value as "all" | "single")
          }
        >
          <TabsList>
            {/* <TabsTrigger value="all">All</TabsTrigger> */}
            <TabsTrigger value="single">Single</TabsTrigger>
          </TabsList>
          <TabsContent value="all"></TabsContent>

          <TabsContent value="single">
            <div className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="flex flex-col gap-2">
                  <span className="text-xs font-medium text-muted-foreground">
                    Webinars
                  </span>
                  <WebinarSelector
                    webinars={webinarsData ?? []}
                    selectedWebinarIds={selectedWebinarIds}
                    onSelectionChange={setSelectedWebinarIds}
                    placeholder="Select webinars..."
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <span className="text-xs font-medium text-muted-foreground">
                    Attendance
                  </span>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant={
                        isAttended === true ? "default" : "outline"
                      }
                      onClick={() => setIsAttended(true)}
                    >
                      Sales
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant={
                        isAttended === false ? "default" : "outline"
                      }
                      onClick={() => setIsAttended(false)}
                    >
                      Reminder
                    </Button>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                {conditions.map((condition, index) => (
                  <FilterConditionCard
                    key={condition.id}
                    condition={condition}
                    index={index}
                    webinars={webinarsData ?? []}
                    tags={WLHTags ?? []}
                    employees={employeesData ?? []}
                    onUpdate={(updates) =>
                      handleConditionUpdate(condition.id, updates)
                    }
                    onRemove={() => handleRemoveCondition(condition.id)}
                  />
                ))}

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddCondition}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Condition
                </Button>
              </div>

              <FilterResults
                isLoading={advanceCountIsPending}
                count={advanceCountData?.count}
              />

              <div className="mt-4 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onPrevious}
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back
                </Button>
                <div className="flex flex-wrap gap-2 sm:justify-end">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={handleReset}
                  >
                    Reset
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    disabled={isApplyDisabled}
                    onClick={handleApply}
                  >
                    Apply Filters
                  </Button>
                  <Button
                    type="button"
                    onClick={handleNext}
                    disabled={wlhAttendeeFilters.contactCount <= 0}
                  >
                    Next
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
      
    </div>
  );
}
