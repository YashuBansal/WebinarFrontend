import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Plus, Settings, ShieldCheck, HelpCircle, Save, Calculator, AlertCircle, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
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
    } catch { }
  };

  return (
    <Card className="rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden bg-white dark:bg-slate-900 shadow-xl shadow-slate-200/40">
      <CardHeader className="bg-slate-50 dark:bg-slate-950 p-6 sm:p-8 border-b border-slate-100 dark:border-slate-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="h-12 w-12 rounded-2xl bg-orange-50 flex items-center justify-center text-orange-600 border border-orange-100 shrink-0 shadow-sm">
              <Settings className="h-6 w-6" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-orange-600 font-bold text-[10px] uppercase tracking-widest mb-1">
                Automation Logic
              </div>
              <CardTitle className="text-xl font-black text-slate-900 dark:text-white tracking-tight">Auto-Assign Rules</CardTitle>
              <CardDescription className="text-slate-600 dark:text-slate-400 text-xs font-medium max-w-md">
                Configure rules for automatically assigning attendees directly to this sequence based on webinar and attendance data.
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-3 bg-white dark:bg-slate-900 px-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm self-start sm:self-center">
            <div className="flex items-center gap-2 mr-2">
              <div className={`h-2 w-2 rounded-full ${isAutoAssignable ? 'bg-green-500 animate-pulse' : 'bg-slate-300'}`} />
              <Label htmlFor="auto-assign-rt" className="text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-400 cursor-pointer">
                {isAutoAssignable ? 'Running' : 'Disabled'}
              </Label>
            </div>
            <Switch
              checked={isAutoAssignable}
              onCheckedChange={disabled ? () => { } : onAutoAssignableChange}
              id="auto-assign-rt"
              disabled={disabled}
              className="data-[state=checked]:bg-green-600"
            />
          </div>
        </div>
      </CardHeader>

      <AnimatePresence>
        {isAutoAssignable && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.4, ease: "easeInOut" }}
          >
            <CardContent className="p-6 sm:p-8 space-y-10">
              {/* Primary Filters */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-3">
                  <Label className="text-xs font-black uppercase tracking-widest text-slate-600 dark:text-slate-400">Target Webinars</Label>
                  <WebinarSelector
                    webinars={(webinarsData as any) ?? []}
                    selectedWebinarIds={selectedWebinarIds}
                    onSelectionChange={setSelectedWebinarIds}
                    placeholder="Select webinars..."
                  />
                  <div className="flex items-center gap-1.5 text-[12px] text-slate-600 dark:text-slate-400 font-medium italic">
                    <HelpCircle className="h-3 w-3" />
                    Select one or more webinars to pull attendees from
                  </div>
                </div>

                <div className="space-y-3">
                  <Label className="text-xs font-black uppercase tracking-widest text-slate-600 dark:text-slate-400">Attendance Status</Label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-1.5 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-100 dark:border-slate-800">
                    <Button
                      type="button"
                      variant={isAttended === true ? 'default' : 'ghost'}
                      onClick={() => setIsAttended(true)}
                      className={`h-8 rounded-xl text-xs font-bold transition-all px-4 ${isAttended === true
                        ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-md border-slate-200 dark:border-slate-800'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                        }`}
                    >
                      <ShieldCheck className={`h-4 w-4 mr-2 shrink-0 ${isAttended === true ? 'text-green-500' : 'text-slate-600 dark:text-slate-400'}`} />
                      <span className="truncate">Attended (Sales)</span>
                    </Button>
                    <Button
                      type="button"
                      variant={isAttended === false ? 'default' : 'ghost'}
                      onClick={() => setIsAttended(false)}
                      className={`h-8 rounded-xl text-xs font-bold transition-all px-4 ${isAttended === false
                        ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-md border-slate-200 dark:border-slate-800'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                        }`}
                    >
                      <AlertCircle className={`h-4 w-4 mr-2 shrink-0 ${isAttended === false ? 'text-blue-500' : 'text-slate-600 dark:text-slate-400'}`} />
                      <span className="truncate">Missed (Reminder)</span>
                    </Button>
                  </div>
                  <div className="flex items-center gap-1.5 text-[12px] text-slate-600 dark:text-slate-400 font-medium italic">
                    <HelpCircle className="h-3 w-3" />
                    Determine which segment of leads to target
                  </div>
                </div>
              </div>

              {/* Advanced Conditions */}
              <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-black uppercase tracking-widest text-slate-600 dark:text-slate-400">Advanced Filter Conditions</h3>
                  <Badge variant="outline" className="text-[12px] bg-blue-50 dark:bg-blue-900 text-blue-600 dark:text-blue-400 border-blue-100 dark:border-blue-900">{conditions.length} Active</Badge>
                </div>

                <div className="space-y-4">
                  {conditions.map((condition, index) => (
                    <motion.div
                      key={condition.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <FilterConditionCard
                        condition={condition}
                        index={index}
                        webinars={(webinarsData as any) ?? []}
                        tags={(WLHTags as any) ?? []}
                        employees={employeesData ?? []}
                        onUpdate={(updates) => handleConditionUpdate(condition.id, updates)}
                        onRemove={() => handleRemoveCondition(condition.id)}
                      />
                    </motion.div>
                  ))}
                </div>

                <Button
                  type="button"
                  variant="outline"
                  onClick={handleAddCondition}
                  disabled={disabled}
                  className="h-10 px-5 rounded-xl border-dashed border-slate-200 dark:border-slate-700/50 text-slate-600 dark:text-slate-400 font-bold text-xs gap-2 hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-all active:scale-[0.98] w-full sm:w-auto"
                >
                  <Plus className="h-4 w-4" />
                  Add Additional Condition
                </Button>
              </div>

              {/* Action Bar */}
              <div className="pt-8 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-6">
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={testCount}
                    disabled={disabled || isPending || selectedWebinarIds.length === 0 || isAttended === null}
                    className="h-11 px-6 rounded-xl border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs gap-2 bg-white dark:bg-slate-900 shadow-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-all active:scale-[0.95]"
                  >
                    {isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Calculator className="h-4 w-4 text-blue-500" />
                    )}
                    Test Match Count
                  </Button>

                  {advanceCountData?.count !== undefined && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="px-4 py-2.5 rounded-xl bg-blue-50 dark:bg-blue-900 border border-blue-100 dark:border-blue-900 text-blue-700 font-bold text-xs flex items-center gap-2 shadow-sm"
                    >
                      <span className="text-sm font-black underline decoration-2 underline-offset-4">{advanceCountData.count}</span>
                      <span>Attendees match these rules</span>
                    </motion.div>
                  )}
                </div>

                {onSave && (
                  <Button
                    onClick={onSave}
                    disabled={disabled || isSaving}
                    className="h-11 px-10 rounded-xl bg-[#22B573] hover:bg-[#1da467] text-white font-bold text-xs shadow-lg shadow-green-600/20 transition-all hover:scale-[1.02] active:scale-[0.98] gap-2"
                  >
                    {isSaving ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4" />
                    )}
                    Save Automation Rules
                  </Button>
                )}
              </div>
            </CardContent>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
}


