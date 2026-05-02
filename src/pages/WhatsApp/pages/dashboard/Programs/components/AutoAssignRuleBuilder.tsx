import * as React from 'react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { FilterConditionCard } from '../../Campaigns/steps/WLHContacts/components/FilterConditionCard';
import { WebinarSelector } from '../../Campaigns/steps/WLHContacts/components/WebinarSelector';
import { createEmptyCondition } from '../../Campaigns/steps/WLHContacts/utils';
import type { FilterCondition } from '../../Campaigns/steps/WLHContacts/types';
import { 
  mapConditionsToAdvanceUnits, 
  mapAdvanceUnitsToConditions 
} from '../../Campaigns/steps/WLHContacts/advanceFilterMapper';
import { useAdvanceFilterCount } from '@/hooks/useAdvanceFilters';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useWebinars } from '@/hooks/useWebinars';
import { useWLHTags } from '@/hooks/useTags';
import { useEmployees } from '@/hooks/useEmployees';

export interface AutoAssignCriteriaPayload {
  webinarIds: string[];
  isAttended: boolean | null;
  conditions: any[]; // mapped AdvanceFilterUnitDTO[]
}

interface AutoAssignRuleBuilderProps {
  isAutoAssignable: boolean;
  onAutoAssignableChange: (val: boolean) => void;
  criteria: AutoAssignCriteriaPayload | null;
  onCriteriaChange: (val: AutoAssignCriteriaPayload | null) => void;
  onSave?: () => void;
  isSaving?: boolean;
  /** When true, UI is read-only and users cannot change or save rules. */
  disabled?: boolean;
}

export function AutoAssignRuleBuilder({
  isAutoAssignable,
  onAutoAssignableChange,
  criteria,
  onCriteriaChange,
  onSave,
  isSaving,
  disabled = false,
}: AutoAssignRuleBuilderProps) {
  const [conditions, setConditions] = React.useState<FilterCondition[]>([
    createEmptyCondition(),
  ]);
  const [selectedWebinarIds, setSelectedWebinarIds] = React.useState<string[]>([]);
  const [isAttended, setIsAttended] = React.useState<boolean | null>(null);

  const { data: webinarsData } = useWebinars();
  const { data: WLHTags } = useWLHTags();

  const employeeRoleFilter = React.useMemo(() => {
    if (isAttended === true) return 'EMPLOYEE_SALES' as const;
    if (isAttended === false) return 'EMPLOYEE_REMINDER' as const;
    return undefined;
  }, [isAttended]);

  const { data: employeesData } = useEmployees({
    roleFilter: employeeRoleFilter,
  });

  const hasInitialized = React.useRef(false);

  // Initialize from props if editing (only once, when criteria is first available)
  React.useEffect(() => {
    if (criteria && !hasInitialized.current) {
      setSelectedWebinarIds(criteria.webinarIds || []);
      setIsAttended(criteria.isAttended ?? null);
      
      if (criteria.conditions && criteria.conditions.length > 0) {
        try {
          const mappedConditions = mapAdvanceUnitsToConditions(criteria.conditions);
          setConditions(mappedConditions);
        } catch (e) {
          console.error("Failed to parse conditions", e);
        }
      }
      hasInitialized.current = true;
    }
  }, [criteria]);

  const handleConditionUpdate = (id: string, updates: Partial<FilterCondition>) => {
    setConditions((prev) =>
      prev.map((condition) => (condition.id === id ? { ...condition, ...updates } : condition)),
    );
  };

  const handleRemoveCondition = (id: string) => {
    setConditions((prev) => {
      if (prev.length === 1) return [createEmptyCondition()];
      return prev.filter((condition) => condition.id !== id);
    });
  };

  const handleAddCondition = () => {
    setConditions((prev) => [...prev, createEmptyCondition()]);
  };

  const { mutateAsync: fetchAdvanceCount, data: advanceCountData, isPending } = useAdvanceFilterCount();

  // Every time something changes, we should push it up
  React.useEffect(() => {
    if (!isAutoAssignable) {
      onCriteriaChange(null);
      return;
    }

    const units = mapConditionsToAdvanceUnits(conditions);
    onCriteriaChange({
      webinarIds: selectedWebinarIds,
      isAttended: isAttended,
      conditions: units,
    });
  }, [conditions, selectedWebinarIds, isAttended, isAutoAssignable]);

  const testCount = async () => {
    if (selectedWebinarIds.length === 0 || isAttended === null) return;
    try {
      await fetchAdvanceCount({
        responseType: 'count',
        webinarIds: selectedWebinarIds,
        isAttended,
        units: mapConditionsToAdvanceUnits(conditions),
      });
    } catch {}
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 border-b border-border">
        <div className="space-y-1">
          <CardTitle className="text-base text-foreground">Auto-Assign Rules configuration</CardTitle>
          <CardDescription className="text-xs">
            Configure rules for automatically assigning attendees directly to this program
          </CardDescription>
        </div>
        <div className="flex items-center space-x-2">
          <Switch
            checked={isAutoAssignable}
            onCheckedChange={disabled ? () => {} : onAutoAssignableChange}
            id="auto-assign-rt"
            disabled={disabled}
          />
          <Label htmlFor="auto-assign-rt" className="text-sm cursor-pointer whitespace-nowrap">
            {isAutoAssignable ? 'Enabled' : 'Disabled'}
          </Label>
        </div>
      </CardHeader>

      {isAutoAssignable && (
        <CardContent className="pt-6 space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="flex flex-col gap-2">
              <span className="text-xs font-medium text-muted-foreground">Webinars</span>
              <WebinarSelector
                webinars={webinarsData ?? []}
                selectedWebinarIds={selectedWebinarIds}
                onSelectionChange={setSelectedWebinarIds}
                placeholder="Select webinars..."
              />
            </div>

            <div className="flex flex-col gap-2">
              <span className="text-xs font-medium text-muted-foreground">Attendance</span>
              <div className="flex gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant={isAttended === true ? 'default' : 'outline'}
                  onClick={() => setIsAttended(true)}
                >
                  Sales
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant={isAttended === false ? 'default' : 'outline'}
                  onClick={() => setIsAttended(false)}
                >
                  Reminder
                </Button>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-medium text-foreground">Filter Conditions</h3>
            <div className="space-y-3">
              {conditions.map((condition, index) => (
                <FilterConditionCard
                  key={condition.id}
                  condition={condition}
                  index={index}
                  webinars={webinarsData ?? []}
                  tags={WLHTags ?? []}
                  employees={employeesData ?? []}
                  onUpdate={(updates) => handleConditionUpdate(condition.id, updates)}
                  onRemove={() => handleRemoveCondition(condition.id)}
                />
              ))}
            </div>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddCondition}
                  disabled={disabled}
                  className="mt-4 gap-2 border-dashed w-full sm:w-auto text-muted-foreground hover:text-foreground hover:bg-muted"
                >
              <Plus className="h-4 w-4" />
              Add Condition
            </Button>
          </div>

          <div className="pt-4 border-t border-border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
             <div className="flex items-center gap-4">
               <Button
                 type="button"
                 variant="secondary"
                 onClick={testCount}
                 disabled={
                   disabled ||
                   isPending ||
                   selectedWebinarIds.length === 0 ||
                   isAttended === null
                 }
               >
                 {isPending ? 'Calculating...' : 'Test Match Count'}
               </Button>
               {advanceCountData?.count !== undefined && (
                  <p className="text-sm text-muted-foreground">
                    <strong className="text-foreground">{advanceCountData.count}</strong> attendees currently match.
                  </p>
               )}
             </div>
             {onSave && (
               <Button 
                onClick={onSave} 
                disabled={disabled || isSaving}
              >
                {isSaving ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent mr-2" />
                ) : null}
                Update
              </Button>
             )}
          </div>
        </CardContent>
      )}
    </Card>
  );
}
