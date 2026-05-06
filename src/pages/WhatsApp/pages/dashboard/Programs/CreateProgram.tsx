import { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
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
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ArrowLeft, Loader2, ListTodo, AlertCircle, Plus, ListTree, Calendar, Clock, Save, X } from 'lucide-react';
import { useProjectContext } from '@/context/ProjectContext';
import { useCreateProgram, useProgramById, useUpdateProgram } from '@/hooks/usePrograms';
import type {
  CreateProgramDto,
  UpdateProgramDto,
  ProgramTimeSlot,
  Program,
} from '@/schemas/programSchema';
import { getOccurrenceLabel, getTotalOccurrenceCount, getDefaultProgramTimeSlot } from '@/schemas/programSchema';
import { ProgramTimeSlotsEditor } from './components/ProgramTimeSlotsEditor';
import { Checkbox } from '@/components/ui/checkbox';
import { toastUtils } from '@/lib/utils';

const INTERVAL_UNITS = [
  { value: 'day', label: 'Day(s)' },
  { value: 'week', label: 'Week' },
] as const;

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
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

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
      <div className="min-h-full flex items-center justify-center p-8">
        <Alert variant="destructive" className="max-w-md rounded-[32px] p-8 border-none shadow-2xl bg-white">
          <AlertCircle className="h-8 w-8 mb-4 text-red-500" />
          <AlertTitle className="text-xl font-black text-slate-900 mb-2">No Project Selected</AlertTitle>
          <AlertDescription className="text-slate-600 font-medium">
            Please select a project to configure sequences.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (isEditMode && programLoading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="relative">
            <div className="h-12 w-12 rounded-full border-4 border-green-100 border-t-green-500 animate-spin" />
            <Loader2 className="h-6 w-6 text-green-500 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
          </div>
          <p className="text-slate-600 font-bold text-xs uppercase tracking-widest animate-pulse">Loading sequence...</p>
        </div>
      </div>
    );
  }

  if (isEditMode && (programError || (!program && !programLoading))) {
    return (
      <div className="min-h-full flex items-center justify-center p-8">
        <Alert variant="destructive" className="max-w-md rounded-[32px] p-8 border-none shadow-2xl bg-white">
          <AlertCircle className="h-8 w-8 mb-4 text-red-500" />
          <AlertTitle className="text-xl font-black text-slate-900 mb-2">Error Loading Sequence</AlertTitle>
          <AlertDescription className="text-slate-600 font-medium">
            Failed to load sequence. It may not exist or you don't have access.
          </AlertDescription>
          <Link to={`/whatsapp/dashboard/${projectId}/programs`} className="mt-6 block">
            <Button variant="outline" className="w-full rounded-xl border-slate-200">Back to Sequences</Button>
          </Link>
        </Alert>
      </div>
    );
  }

  const isPending = createProgramMutation.isPending || updateProgramMutation.isPending;

  return (
    <div className="min-h-full w-full min-w-0 max-w-full box-border p-2 transition-colors duration-500 sm:p-2 md:p-0 lg:p-0 xl:p-2 2xl:p-4">
      {/* Premium Header */}
      <motion.div
        className="mb-6 rounded-2xl border border-slate-200/60 p-4 sm:p-5"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
          backgroundColor: "#ffffff",
          boxShadow: "0 1px 3px rgba(0, 0, 0, 0.05), 0 1px 2px rgba(0, 0, 0, 0.06)",
        }}
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <Link
                to={isEditMode && programId ? `/whatsapp/dashboard/${projectId}/programs/${programId}` : `/whatsapp/dashboard/${projectId}/programs`}
                className="h-10 w-10 rounded-xl border border-slate-200 flex items-center justify-center text-slate-600 hover:text-slate-600 hover:bg-slate-50 transition-all shadow-sm"
              >
                <ArrowLeft className="h-5 w-5" />
              </Link>
              <div>
                <div className="flex items-center gap-1.5 text-green-600 font-bold text-[10px] uppercase tracking-[0.2em] mb-0.5">
                  <ListTree className="h-3 w-3" />
                  Sequence Builder
                </div>
                <h1 className="text-xl font-extrabold tracking-tight text-slate-900 sm:text-2xl flex items-center gap-2">
                  {isEditMode ? 'Edit Sequence' : 'Create Sequence'}
                </h1>
                <p className="text-slate-600 text-xs font-medium mt-1">
                  {isEditMode
                    ? 'Update sequence name and time slots for your automated workflow.'
                    : 'Design a recurring message sequence with custom schedules and templates.'}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={() => navigate(-1)}
              className="h-11 px-6 rounded-xl border-slate-200 text-slate-600 font-bold text-sm transition-all hover:bg-slate-50"
            >
              Cancel
            </Button>
            <Button
              form="program-form"
              type="submit"
              disabled={isPending}
              className="h-11 px-8 rounded-xl flex items-center gap-2 text-white font-bold text-sm shadow-xl shadow-green-600/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
              style={{ backgroundColor: "#22B573" }}
            >
              {isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {isEditMode ? 'Saving...' : 'Creating...'}
                </>
              ) : (
                <>
                  {isEditMode ? <Save className="h-4 w-4" /> : <ListTree className="h-4 w-4" />}
                  {isEditMode ? 'Save Changes' : 'Launch Sequence'}
                </>
              )}
            </Button>
          </div>
        </div>
      </motion.div>

      <main className="container mx-auto space-y-6 pb-20">
        <form id="program-form" onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column - Configuration */}
          <div className="lg:col-span-12 space-y-6">
            {/* Sequence Basics Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="group relative bg-white border border-slate-200 hover:border-green-400/50 hover:shadow-xl hover:shadow-green-900/5 rounded-2xl p-6 sm:p-8 transition-all duration-300 overflow-hidden"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="h-8 w-8 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-600 group-hover:text-green-600 transition-colors">
                  <ListTodo className="h-4 w-4" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-600">Sequence Configuration</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                <div className="space-y-2.5 md:col-span-2">
                  <Label htmlFor="name" className="text-[10px] font-black uppercase tracking-widest text-slate-600 ml-1">Sequence Name</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Welcome Series - Premium"
                    className="h-11 bg-slate-50/50 border-slate-200 rounded-xl focus:ring-green-500/20 focus:border-green-500 transition-all font-medium text-sm"
                    required
                    maxLength={100}
                  />
                  {formErrors.form && (
                    <p className="text-[10px] font-bold text-red-500 uppercase tracking-wider flex items-center gap-1 mt-2 ml-1">
                      <AlertCircle className="h-3 w-3" /> {formErrors.form}
                    </p>
                  )}
                </div>

                <div className="space-y-2.5">
                  <Label htmlFor="occurrenceCount" className="text-[10px] font-black uppercase tracking-widest text-slate-600 ml-1">Total Occurrences</Label>
                  <Input
                    id="occurrenceCount"
                    type="number"
                    min={1}
                    value={occurrenceCount}
                    onChange={(e) => setOccurrenceCount(Number(e.target.value) || 1)}
                    className="h-11 bg-slate-50/50 border-slate-200 rounded-xl focus:ring-green-500/20 focus:border-green-500 transition-all font-medium text-sm"
                  />
                </div>

                {isEditMode ? (
                  <div className="space-y-2.5">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-600 ml-1">Frequency</Label>
                    <div className="h-11 px-4 flex items-center gap-2 bg-slate-100/50 border border-slate-200 rounded-xl text-slate-600 font-bold text-xs italic">
                      <Calendar className="h-3.5 w-3.5 text-slate-600" />
                      {intervalUnit === 'day'
                        ? `Every ${intervalValue} day${intervalValue !== 1 ? 's' : ''}`
                        : weekdays.length > 0
                          ? `Repeats on: ${weekdays.map((d) => WEEKDAY_OPTIONS.find((o) => o.value === d)?.label.slice(0, 3) ?? '').filter(Boolean).join(', ')}`
                          : 'Weekly'}
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="space-y-2.5">
                      <Label htmlFor="intervalUnit" className="text-[10px] font-black uppercase tracking-widest text-slate-600 ml-1">Interval Unit</Label>
                      <Select value={intervalUnit} onValueChange={handleIntervalUnitChange}>
                        <SelectTrigger id="intervalUnit" className="h-11 bg-slate-50/50 border-slate-200 rounded-xl font-medium text-sm focus:ring-green-500/20 focus:border-green-500">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl border-slate-200">
                          {INTERVAL_UNITS.map((u) => (
                            <SelectItem key={u.value} value={u.value} className="rounded-lg py-2.5 text-sm">
                              {u.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="md:col-span-2 lg:col-span-4 space-y-4 pt-2">
                      {intervalUnit === 'day' ? (
                        <div className="max-w-xs space-y-2.5">
                          <Label htmlFor="intervalValue" className="text-[10px] font-black uppercase tracking-widest text-slate-600 ml-1">Interval (Every N Days)</Label>
                          <Input
                            id="intervalValue"
                            type="number"
                            min={1}
                            value={intervalValue}
                            onChange={(e) => setIntervalValue(Number(e.target.value) || 1)}
                            className="h-11 bg-slate-50/50 border-slate-200 rounded-xl focus:ring-green-500/20 focus:border-green-500 transition-all font-medium text-sm"
                          />
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <Label className="text-[10px] font-black uppercase tracking-widest text-slate-600 ml-1">Select Repeat Days</Label>
                          <div className="flex flex-wrap gap-2.5">
                            {WEEKDAY_OPTIONS.map((opt) => (
                              <label
                                key={opt.value}
                                className={`
                                  flex items-center gap-2 rounded-xl px-4 py-2 border transition-all cursor-pointer
                                  ${weekdays.includes(opt.value)
                                    ? "bg-green-50 border-green-200 text-green-700 shadow-sm"
                                    : "bg-slate-50/50 border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50"}
                                `}
                              >
                                <Checkbox
                                  checked={weekdays.includes(opt.value)}
                                  onCheckedChange={() => toggleWeekday(opt.value)}
                                  className="border-slate-300 data-[state=checked]:bg-green-600 data-[state=checked]:border-green-600"
                                />
                                <span className="text-xs font-bold">{opt.label}</span>
                              </label>
                            ))}
                          </div>
                          {weekdays.length === 0 && (
                            <p className="text-[10px] font-bold text-red-500 uppercase tracking-wider mt-1 ml-1 flex items-center gap-1">
                              <AlertCircle className="h-3 w-3" /> Select at least one day.
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            </motion.div>

            {/* Time Slots Section */}
            <div className="space-y-6">
              <div className="flex items-center justify-between px-2">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-lg bg-green-50 flex items-center justify-center text-green-600 border border-green-100">
                      <Clock className="h-4 w-4" />
                    </div>
                    <h3 className="text-lg font-black text-slate-900 tracking-tight">Timeline & Content</h3>
                  </div>
                  <p className="text-slate-600 text-[10px] font-medium ml-10">
                    Configure message templates for each of the <span className="text-slate-900 font-bold">{totalOccurrences} scheduled occurrences</span>.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-6">
                {occurrenceTimeSlots.map((slots, occIndex) => (
                  <motion.div
                    key={occIndex}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 + occIndex * 0.05 }}
                    className="group relative bg-white border border-slate-200 hover:border-green-400/50 hover:shadow-xl hover:shadow-green-900/5 rounded-[24px] p-6 sm:p-8 transition-all duration-300 overflow-hidden"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-6">
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-600 group-hover:text-green-600 group-hover:bg-green-50 group-hover:border-green-100 transition-all font-black text-sm">
                          {occIndex + 1}
                        </div>
                        <div>
                          <h4 className="text-lg font-black text-slate-900 tracking-tight">
                            {getOccurrenceLabel(
                              intervalUnit,
                              intervalValue,
                              intervalUnit === 'week' ? weekdays : undefined,
                              occIndex,
                            )}
                          </h4>
                          <p className="text-[10px] font-black uppercase tracking-widest text-slate-600 mt-0.5">Occurrence Entry</p>
                        </div>
                      </div>

                      {occurrenceTimeSlots.length > 1 && (
                        <div className="flex items-center gap-2">
                          <Select
                            value=""
                            onValueChange={(val) => {
                              if (!val) return;
                              const fromIndex = parseInt(val, 10);
                              if (!isNaN(fromIndex) && occurrenceTimeSlots[fromIndex]) {
                                setSlotsForOccurrence(occIndex, JSON.parse(JSON.stringify(occurrenceTimeSlots[fromIndex])));
                                toastUtils.success(`Copied content from ${getOccurrenceLabel(intervalUnit, intervalValue, intervalUnit === 'week' ? weekdays : undefined, fromIndex)}`);
                              }
                            }}
                          >
                            <SelectTrigger className="w-[200px] h-10 bg-slate-50/50 border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-600 focus:ring-green-500/20 focus:border-green-500">
                              <SelectValue placeholder="Copy from other day..." />
                            </SelectTrigger>
                            <SelectContent className="rounded-xl border-slate-200">
                              {occurrenceTimeSlots.map((_, i) => {
                                if (i === occIndex) return null;
                                return (
                                  <SelectItem key={i} value={i.toString()} className="rounded-lg text-xs font-bold py-2.5">
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
                        </div>
                      )}
                    </div>

                    <div className="rounded-2xl bg-slate-50/30 border border-slate-100/50 p-1 transition-all group-hover:bg-white group-hover:border-slate-100">
                      <ProgramTimeSlotsEditor
                        timeSlots={slots}
                        occIndex={occIndex}
                        setSlotsForOccurrence={setSlotsForOccurrence}
                        slotErrors={formErrors.slotErrorsPerOccurrence?.[occIndex]}
                      />
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </form>
      </main>
    </div>
  );
}
