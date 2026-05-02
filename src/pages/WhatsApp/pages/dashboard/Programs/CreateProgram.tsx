import { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowLeft, Loader2, ListTodo, AlertCircle } from 'lucide-react';
import { useProjectContext } from '@/context/ProjectContext';
import { useCreateProgram, useProgramById, useUpdateProgram } from '@/hooks/usePrograms';
import type {
  CreateProgramDto,
  UpdateProgramDto,
  ProgramTimeSlot,
  Program,
} from '@/schemas/programSchema';
import { getOccurrenceLabel, getTotalOccurrenceCount } from '@/schemas/programSchema';
import { getDefaultProgramTimeSlot } from '@/schemas/programSchema';
import { ProgramTimeSlotsEditor } from './components/ProgramTimeSlotsEditor';
import { Checkbox } from '@/components/ui/checkbox';
import { toastUtils } from '@/lib/utils';

const INTERVAL_UNITS = [
  { value: 'day', label: 'Day(s)' },
  { value: 'week', label: 'Week' },
] as const;

/** When unit is week, intervalValue is day of week: 1=Monday .. 7=Sunday */
const WEEKDAY_OPTIONS = [
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' },
  { value: 7, label: 'Sunday' },
] as const;

type SlotError = { time?: string; template?: string; variables?: string };

function validateSlots(slots: ProgramTimeSlot[]): SlotError[] {
  return slots.map((slot) => {
    const errors: SlotError = {};
    if (!slot.time) errors.time = 'Time is required.';
    const cfg = slot.messageConfig;
    if (!cfg?.templateName?.trim()) errors.template = 'Template is required.';
    const mappings = cfg?.variableMappings ?? [];
    const hasInvalidMapping = mappings.some((vm: any) => {
      if (vm.isDynamic) return !vm.contactField?.trim() || !vm.fallbackValue?.trim();
      return !vm.staticValue?.trim();
    });
    if (hasInvalidMapping) errors.variables = 'Please complete all variable mappings.';
    return errors;
  });
}

function normalizeSlotsFromProgram(program: Program): ProgramTimeSlot[][] {
  const total = getTotalOccurrenceCount(program);
  const raw = program.occurrenceTimeSlots ?? [];
  const result: ProgramTimeSlot[][] = [];
  for (let i = 0; i < total; i++) {
    const arr = raw[i];
    const slots = Array.isArray(arr)
      ? arr.map((s) => ({
          time: s.time ?? getDefaultProgramTimeSlot().time,
          timezone: s.timezone ?? getDefaultProgramTimeSlot().timezone,
          messageConfig: {
            messageType: s.messageConfig?.messageType ?? 'template',
            templateName: s.messageConfig?.templateName ?? '',
            language: s.messageConfig?.language ?? 'en_US',
            variableMappings: s.messageConfig?.variableMappings ?? [],
            headerMediaAssetId: s.messageConfig?.headerMediaAssetId,
          },
        }))
      : [];
    result.push(slots);
  }
  return result;
}

export default function CreateProgram() {
  const { projectId, programId } = useParams<{ projectId: string; programId?: string }>();
  const navigate = useNavigate();
  const { selectedProject } = useProjectContext();
  const isEditMode = !!programId;

  const { data: program, isLoading: programLoading, error: programError } = useProgramById(
    programId ?? '',
  );
  const createProgramMutation = useCreateProgram();
  const updateProgramMutation = useUpdateProgram();
  const hasInitializedFromProgram = useRef(false);

  const [name, setName] = useState('');
  const [occurrenceCount, setOccurrenceCount] = useState(5);
  const [intervalValue, setIntervalValue] = useState(1);
  const [intervalUnit, setIntervalUnit] = useState<'day' | 'week'>('day');
  const [weekdays, setWeekdays] = useState<number[]>([1]);
  const [occurrenceTimeSlots, setOccurrenceTimeSlots] = useState<ProgramTimeSlot[][]>(() =>
    Array.from({ length: 5 }, () => []),
  );
  const [formErrors, setFormErrors] = useState<{
    form?: string;
    slotErrorsPerOccurrence?: SlotError[][];
  }>({});

  useEffect(() => {
    if (!programId) hasInitializedFromProgram.current = false;
  }, [programId]);

  useEffect(() => {
    if (!isEditMode || !program || hasInitializedFromProgram.current) return;
    hasInitializedFromProgram.current = true;
    setName(program.name ?? '');
    setOccurrenceCount(program.occurrenceCount ?? 5);
    setIntervalValue(program.intervalValue ?? 1);
    setIntervalUnit((program.intervalUnit as 'day' | 'week') ?? 'day');
    setWeekdays(program.weekdays?.length ? [...program.weekdays] : [1]);
    setOccurrenceTimeSlots(normalizeSlotsFromProgram(program));
  }, [isEditMode, program]);

  const handleIntervalUnitChange = (v: 'day' | 'week') => {
    setIntervalUnit(v);
    if (v === 'week') {
      setWeekdays((prev) => (prev.length ? prev : [1]));
    } else {
      setIntervalValue((prev) => (prev >= 1 ? prev : 1));
    }
  };

  const totalOccurrences =
    intervalUnit === 'week' && weekdays.length > 0
      ? occurrenceCount * weekdays.length
      : occurrenceCount;

  useEffect(() => {
    setOccurrenceTimeSlots((prev) => {
      const next = prev.slice(0, totalOccurrences);
      while (next.length < totalOccurrences) {
        next.push([]);
      }
      return next;
    });
  }, [totalOccurrences]);

  const toggleWeekday = (d: number) => {
    setWeekdays((prev) =>
      prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d].sort((a, b) => a - b),
    );
  };

  const setSlotsForOccurrence = useCallback(
    (
      occIndex: number,
      newSlotsOrUpdater:
        | ProgramTimeSlot[]
        | ((prev: ProgramTimeSlot[]) => ProgramTimeSlot[]),
    ) => {
      setOccurrenceTimeSlots((prev) =>
        prev.map((arr, i) =>
          i === occIndex
            ? typeof newSlotsOrUpdater === 'function'
              ? newSlotsOrUpdater(arr)
              : newSlotsOrUpdater
            : arr,
        ),
      );
    },
    [],
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProject?._id || !projectId) return;

    const slotErrorsPerOccurrence = occurrenceTimeSlots.map((slots) => validateSlots(slots));
    const hasAnySlotErrors = slotErrorsPerOccurrence.some((errs) =>
      errs.some((err) => err.time || err.template || err.variables),
    );

    if (intervalUnit === 'week' && weekdays.length === 0) {
      toastUtils.error('Select at least one day of the week.');
      return;
    }

    if (!name.trim() || hasAnySlotErrors) {
      setFormErrors({
        form: !name.trim() ? 'Sequence name is required.' : undefined,
        slotErrorsPerOccurrence,
      });
      if (!name.trim()) {
        toastUtils.error('Sequence name is required.');
      } else {
        for (let occ = 0; occ < slotErrorsPerOccurrence.length; occ++) {
          const idx = slotErrorsPerOccurrence[occ].findIndex(
            (err) => err.time || err.template || err.variables,
          );
          if (idx !== -1) {
            const err = slotErrorsPerOccurrence[occ][idx];
            const msg = err.time || err.template || err.variables;
            const label = getOccurrenceLabel(intervalUnit, intervalValue, intervalUnit === 'week' ? weekdays : undefined, occ);
            toastUtils.error(`${label}, Slot ${idx + 1}: ${msg}`);
            break;
          }
        }
      }
      return;
    }

    setFormErrors({});
    const normalizedSlots = occurrenceTimeSlots.map((slots) =>
      slots.map((s) => ({
        ...s,
        messageConfig: {
          ...s.messageConfig,
          templateName: s.messageConfig.templateName.trim(),
          variableMappings: s.messageConfig.variableMappings ?? [],
        },
      })),
    );

    if (isEditMode && programId) {
      // User can only update name, occurrence count, and slots (not interval unit/value)
      const updatePayload: UpdateProgramDto = {
        name: name.trim(),
        occurrenceCount,
        occurrenceTimeSlots: normalizedSlots,
      };
      updateProgramMutation.mutate(
        { programId, payload: updatePayload },
        {
          onSuccess: () => {
            navigate(`/whatsapp/dashboard/${projectId}/programs/${programId}`);
          },
          onError: (err: any) => {
            if (err?.response?.status === 409) {
              setFormErrors({
                form: 'A sequence with this name already exists.',
              });
            }
          },
        },
      );
    } else {
      const createPayload: CreateProgramDto = {
        name: name.trim(),
        projectId: selectedProject._id,
        occurrenceCount,
        intervalValue: intervalUnit === 'week' && weekdays.length ? weekdays[0]! : intervalValue,
        intervalUnit,
        ...(intervalUnit === 'week' && weekdays.length ? { weekdays } : {}),
        occurrenceTimeSlots: normalizedSlots,
      } as CreateProgramDto;
      createProgramMutation.mutate(createPayload, {
        onSuccess: () => {
          navigate(`/whatsapp/dashboard/${projectId}/programs`);
        },
        onError: (err: any) => {
          if (err?.response?.status === 409) {
            setFormErrors({
              form: 'A sequence with this name already exists.',
            });
          }
        },
      });
    }
  };

  if (!selectedProject) {
    return (
      <div className="px-4 sm:px-6 py-6">
        <p className="text-sm text-muted-foreground">Please select a project.</p>
      </div>
    );
  }

  if (isEditMode && programLoading) {
    return (
      <div className="flex items-center justify-center h-64 px-4 sm:px-6 py-6">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (isEditMode && (programError || (!program && !programLoading))) {
    return (
      <div className="px-4 sm:px-6 py-6 space-y-4">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Failed to load sequence. It may not exist or you don&apos;t have access.
          </AlertDescription>
        </Alert>
        <Link to={programId ? `/whatsapp/dashboard/${projectId}/programs/${programId}` : `/whatsapp/dashboard/${projectId}/programs`}>
          <Button variant="outline">Back</Button>
        </Link>
      </div>
    );
  }

  if (isEditMode && program && projectId && program.projectId !== projectId) {
    return (
      <div className="px-4 sm:px-6 py-6 space-y-4">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>This sequence belongs to a different project.</AlertDescription>
        </Alert>
        <Link to={`/whatsapp/dashboard/${projectId}/programs`}>
          <Button variant="outline">Back to Sequences</Button>
        </Link>
      </div>
    );
  }

  const isPending = createProgramMutation.isPending || updateProgramMutation.isPending;

  return (
    <div className="px-4 sm:px-6 py-6 space-y-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3 min-w-0">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <ListTodo className="h-5 w-5" />
          </div>
          <div className="space-y-1 min-w-0">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              {isEditMode ? 'Edit sequence' : 'Create sequence'}
            </h1>
            <p className="text-sm text-muted-foreground">
              {isEditMode
                ? 'Update sequence name, number of occurrences, and time slots. Interval cannot be changed.'
                : 'Set up a recurring message sequence with schedules and templates.'}
            </p>
          </div>
        </div>
        <Link
          to={isEditMode && programId ? `/whatsapp/dashboard/${projectId}/programs/${programId}` : `/whatsapp/dashboard/${projectId}/programs`}
          className="shrink-0 self-start sm:self-center"
        >
          <Button variant="outline" size="sm" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            {isEditMode ? 'Back to sequence' : 'Back to Sequences'}
          </Button>
        </Link>
      </header>

      <form onSubmit={handleSubmit} className="space-y-8 max-w-4xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Sequence details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Sequence name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Welcome series"
                  required
                  maxLength={100}
                />
                {formErrors.form && (
                  <p
                    className="text-xs text-destructive"
                    role="alert"
                    aria-live="polite"
                  >
                    {formErrors.form}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="occurrenceCount">Number of occurrences</Label>
                <Input
                  id="occurrenceCount"
                  type="number"
                  min={1}
                  value={occurrenceCount}
                  onChange={(e) => setOccurrenceCount(Number(e.target.value) || 1)}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {isEditMode ? (
                <div className="space-y-2 sm:col-span-2">
                  <Label>Interval (read-only)</Label>
                  <p className="text-sm text-muted-foreground py-2">
                    {intervalUnit === 'day'
                      ? `Every ${intervalValue} day${intervalValue !== 1 ? 's' : ''}`
                      : weekdays.length > 0
                        ? `Week: ${weekdays.map((d) => WEEKDAY_OPTIONS.find((o) => o.value === d)?.label ?? '').filter(Boolean).join(', ')}`
                        : 'Week'}
                  </p>
                </div>
              ) : (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="intervalUnit">Interval unit</Label>
                    <Select
                      value={intervalUnit}
                      onValueChange={handleIntervalUnitChange}
                    >
                      <SelectTrigger id="intervalUnit">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {INTERVAL_UNITS.map((u) => (
                          <SelectItem key={u.value} value={u.value}>
                            {u.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    {intervalUnit === 'day' ? (
                      <>
                        <Label htmlFor="intervalValue">Interval value (every N days)</Label>
                        <Input
                          id="intervalValue"
                          type="number"
                          min={1}
                          value={intervalValue}
                          onChange={(e) => setIntervalValue(Number(e.target.value) || 1)}
                        />
                      </>
                    ) : (
                      <>
                        <Label>Days of week</Label>
                        <div className="flex flex-wrap gap-4 pt-1">
                          {WEEKDAY_OPTIONS.map((opt) => (
                            <label
                              key={opt.value}
                              className="flex items-center gap-2 cursor-pointer text-sm"
                            >
                              <Checkbox
                                checked={weekdays.includes(opt.value)}
                                onCheckedChange={() => toggleWeekday(opt.value)}
                              />
                              {opt.label}
                            </label>
                          ))}
                        </div>
                        {weekdays.length === 0 && (
                          <p className="text-xs text-destructive">Select at least one day.</p>
                        )}
                      </>
                    )}
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Time slots per occurrence</CardTitle>
            <p className="text-sm text-muted-foreground font-normal">
              {totalOccurrences} occurrence{totalOccurrences !== 1 ? 's' : ''} total
              {intervalUnit === 'week' && weekdays.length > 1 && ` (${occurrenceCount} weeks × ${weekdays.length} days)`}
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            {occurrenceTimeSlots.map((slots, occIndex) => (
              <div
                key={occIndex}
                className="rounded-lg border border-border bg-card shadow-sm p-4 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-foreground">
                    {getOccurrenceLabel(
                      intervalUnit,
                      intervalValue,
                      intervalUnit === 'week' ? weekdays : undefined,
                      occIndex,
                    )}
                  </h4>
                  {occurrenceTimeSlots.length > 1 && (
                    <Select
                      value=""
                      onValueChange={(val) => {
                        if (!val) return;
                        const fromIndex = parseInt(val, 10);
                        if (!isNaN(fromIndex) && occurrenceTimeSlots[fromIndex]) {
                          setSlotsForOccurrence(occIndex, JSON.parse(JSON.stringify(occurrenceTimeSlots[fromIndex])));
                          toastUtils.success('Slots copied successfully');
                        }
                      }}
                    >
                      <SelectTrigger className="w-[180px] h-8 text-xs">
                        <SelectValue placeholder="Copy slots from..." />
                      </SelectTrigger>
                      <SelectContent>
                        {occurrenceTimeSlots.map((_, i) => {
                          if (i === occIndex) return null;
                          return (
                            <SelectItem key={i} value={i.toString()} className="text-xs">
                              {getOccurrenceLabel(
                                intervalUnit,
                                intervalValue,
                                intervalUnit === 'week' ? weekdays : undefined,
                                i,
                              )}
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  )}
                </div>
                <ProgramTimeSlotsEditor
                  timeSlots={slots}
                  occIndex={occIndex}
                  setSlotsForOccurrence={setSlotsForOccurrence}
                  slotErrors={formErrors.slotErrorsPerOccurrence?.[occIndex]}
                />
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="pt-6 border-t border-border flex flex-wrap items-center gap-3">
          <Button
            type="submit"
            disabled={isPending}
          >
            {isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                {isEditMode ? 'Saving...' : 'Creating...'}
              </>
            ) : isEditMode ? (
              'Save changes'
            ) : (
              'Create Sequence'
            )}
          </Button>
          <Link to={isEditMode && programId ? `/whatsapp/dashboard/${projectId}/programs/${programId}` : `/whatsapp/dashboard/${projectId}/programs`}>
            <Button type="button" variant="outline">
              Cancel
            </Button>
          </Link>
        </div>
      </form>
    </div>
  );
}

