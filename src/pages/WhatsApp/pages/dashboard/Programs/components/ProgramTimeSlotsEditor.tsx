import { useState, useCallback, useEffect, startTransition, memo } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { ProgramTimeSlot, ProgramMessageConfig } from '@/schemas/programSchema';
import { getDefaultProgramTimeSlot } from '@/schemas/programSchema';
import { Plus, Trash2 } from 'lucide-react';
import { TemplateSelectionDialog } from '@/components/common/TemplateSelectionDialog';
import type { VariableMapping } from '@/api/modules/autoMessage';

type SetSlotsForOccurrence = (
  occIndex: number,
  newSlotsOrUpdater:
    | ProgramTimeSlot[]
    | ((prev: ProgramTimeSlot[]) => ProgramTimeSlot[]),
) => void;

interface ProgramTimeSlotsEditorProps {
  timeSlots: ProgramTimeSlot[];
  occIndex: number;
  setSlotsForOccurrence: SetSlotsForOccurrence;
  slotErrors?: { time?: string; template?: string; variables?: string }[];
}

function ProgramTimeSlotsEditorInner({
  timeSlots,
  occIndex,
  setSlotsForOccurrence,
  slotErrors,
}: ProgramTimeSlotsEditorProps) {
  const updateTimeSlot = useCallback(
    (index: number, updates: Partial<ProgramTimeSlot>) => {
      setSlotsForOccurrence(occIndex, (prev) =>
        prev.map((slot, i) => (i === index ? { ...slot, ...updates } : slot)),
      );
    },
    [setSlotsForOccurrence, occIndex],
  );

  const updateMessageConfig = useCallback(
    (index: number, updates: Partial<ProgramMessageConfig>) => {
      setSlotsForOccurrence(occIndex, (prev) =>
        prev.map((slot, i) =>
          i === index
            ? {
                ...slot,
                messageConfig: { ...slot.messageConfig, ...updates },
              }
            : slot,
        ),
      );
    },
    [setSlotsForOccurrence, occIndex],
  );

  const addTimeSlot = useCallback(() => {
    requestAnimationFrame(() => {
      startTransition(() => {
        setSlotsForOccurrence(occIndex, (prev) => [
          ...prev,
          getDefaultProgramTimeSlot(),
        ]);
      });
    });
  }, [setSlotsForOccurrence, occIndex]);

  const removeTimeSlot = useCallback(
    (index: number) => {
      requestAnimationFrame(() => {
        startTransition(() => {
          setSlotsForOccurrence(occIndex, (prev) =>
            prev.filter((_, i) => i !== index),
          );
        });
      });
    },
    [setSlotsForOccurrence, occIndex],
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-semibold">Time slots</Label>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addTimeSlot}
          className="gap-1"
        >
          <Plus className="h-4 w-4" />
          Add slot
        </Button>
      </div>

      <div className="space-y-3">
        {timeSlots.map((slot, index) => (
          <ProgramTimeSlotRow
            key={index}
            index={index}
            slot={slot}
            updateTimeSlot={updateTimeSlot}
            updateMessageConfig={updateMessageConfig}
            removeTimeSlot={removeTimeSlot}
            disableRemove={false}
            error={slotErrors?.[index]}
          />
        ))}
      </div>
    </div>
  );
}

export const ProgramTimeSlotsEditor = memo(ProgramTimeSlotsEditorInner);

interface ProgramTimeSlotRowProps {
  index: number;
  slot: ProgramTimeSlot;
  updateTimeSlot: (index: number, updates: Partial<ProgramTimeSlot>) => void;
  updateMessageConfig: (
    index: number,
    updates: Partial<ProgramMessageConfig>,
  ) => void;
  removeTimeSlot: (index: number) => void;
  disableRemove: boolean;
  error?: { time?: string; template?: string; variables?: string };
}

const ProgramTimeSlotRow = memo(function ProgramTimeSlotRow({
  index,
  slot,
  updateTimeSlot,
  updateMessageConfig,
  removeTimeSlot,
  disableRemove,
  error,
}: ProgramTimeSlotRowProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<any | null>(null);
  const [variableMappings, setVariableMappings] = useState<VariableMapping[]>(
    (slot.messageConfig.variableMappings as VariableMapping[]) ?? [],
  );
  const [selectedMediaAsset, setSelectedMediaAsset] = useState<any | null>(null);
  const [uploadedFileName, setUploadedFileName] = useState<string>('');

  const handleTemplateSelect = useCallback(
    (template: any) => {
      if (!template) return;
      updateMessageConfig(index, {
        messageType: 'template',
        templateName: template.name,
        language: template.language ?? slot.messageConfig.language,
      });
    },
    [updateMessageConfig, index, slot.messageConfig.language],
  );

  const handleVariableMappingsChange = useCallback(
    (mappings: VariableMapping[]) => {
      setVariableMappings(mappings);
      updateMessageConfig(index, {
        variableMappings: mappings as any,
      });
    },
    [updateMessageConfig, index],
  );

  const handleSetSelectedMediaAsset: React.Dispatch<
    React.SetStateAction<any | null>
  > = (assetOrUpdater) => {
    setSelectedMediaAsset((prev: any | null) => {
      const next =
        typeof assetOrUpdater === 'function'
          ? (assetOrUpdater as (prev: any | null) => any | null)(prev)
          : assetOrUpdater;
      updateMessageConfig(index, {
        headerMediaAssetId: next?._id,
      });
      return next;
    });
  };

  const getTemplateType = (template: any): 'text' | 'image' | 'video' | 'document' => {
    if (!template) return 'text';
    const header = template.components?.find((c: any) => c.type === 'HEADER');
    const format = (header as any)?.format;
    if (!format) return 'text';
    const upper = String(format).toUpperCase();
    if (upper === 'IMAGE') return 'image';
    if (upper === 'VIDEO') return 'video';
    if (upper === 'DOCUMENT') return 'document';
    return 'text';
  };

  // For display, rely on persisted templateName so UI matches what will be saved.
  const effectiveTemplateName = slot.messageConfig.templateName;
  const effectiveTemplateType =
    effectiveTemplateName && selectedTemplate?.name === effectiveTemplateName
      ? getTemplateType(selectedTemplate)
      : undefined;

  const parseTime = (time: string | undefined) => {
    if (!time) return { hour12: '', minute: '', period: 'AM' as 'AM' | 'PM' };
    const [hStr, mStr] = time.split(':');
    let h = parseInt(hStr || '9', 10);
    const minute = mStr?.padStart(2, '0') || '00';
    let period: 'AM' | 'PM' = 'AM';
    if (h === 0) {
      h = 12;
      period = 'AM';
    } else if (h === 12) {
      period = 'PM';
    } else if (h > 12) {
      h = h - 12;
      period = 'PM';
    } else {
      period = 'AM';
    }
    const hour12 = String(h).padStart(2, '0');
    return { hour12, minute, period };
  };

  const to24Hour = (hour12: string, minute: string, period: 'AM' | 'PM') => {
    let h = parseInt(hour12 || '12', 10);
    if (period === 'AM') {
      if (h === 12) h = 0;
    } else {
      if (h !== 12) h = h + 12;
    }
    const hStr = String(h).padStart(2, '0');
    const mStr = (minute || '00').padStart(2, '0');
    return `${hStr}:${mStr}`;
  };

  const [localTime, setLocalTime] = useState(() => parseTime(slot.time));

  useEffect(() => {
    setLocalTime(parseTime(slot.time));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slot.time]);

  const { hour12, minute, period } = localTime;

  return (
    <div className="rounded-lg border bg-card shadow-sm p-4 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-0.5">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold">Slot {index + 1}</span>
            <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
              {slot.time || 'Not set'}
            </span>
          </div>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => removeTimeSlot(index)}
          disabled={disableRemove}
          className="h-7 w-7"
        >
          <Trash2 className="h-4 w-4 text-destructive" />
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-[minmax(0,0.4fr)_minmax(0,0.6fr)]">
        <div className="space-y-2">
          <Label className="text-xs font-medium">Send time</Label>
          {error?.time && (
            <p className="text-[11px] text-destructive">{error.time}</p>
          )}
          <div className="flex items-center gap-2">
            {/* Hour select (01-12) */}
            <Select
              value={hour12 || undefined}
              onValueChange={(value) => {
                setLocalTime((prev) => ({ ...prev, hour12: value }));
                const newTime = to24Hour(value, minute || '00', period);
                updateTimeSlot(index, { ...slot, time: newTime });
              }}
            >
              <SelectTrigger className="h-9 w-16 text-xs">
                <SelectValue placeholder="HH" />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 12 }, (_, i) => {
                  const h = String(i + 1).padStart(2, '0');
                  return (
                    <SelectItem key={h} value={h}>
                      {h}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>

            <span className="text-sm text-muted-foreground">:</span>

            {/* Minute select (00-55 in steps of 5) */}
            <Select
              value={minute || undefined}
              onValueChange={(value) => {
                setLocalTime((prev) => ({ ...prev, minute: value }));
                const safeHour = hour12 || '12';
                const newTime = to24Hour(safeHour, value, period);
                updateTimeSlot(index, { ...slot, time: newTime });
              }}
            >
              <SelectTrigger className="h-9 w-24 text-xs">
                <SelectValue placeholder="MM" />
              </SelectTrigger>
              <SelectContent className="grid grid-cols-3 gap-1">
                {Array.from({ length: 12 }, (_, i) => {
                  const total = i * 5;
                  const m = String(total).padStart(2, '0');
                  return (
                    <SelectItem key={m} value={m} className="justify-center">
                      {m}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>

            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-9 px-3 text-xs"
              onClick={() => {
                const newPeriod = period === 'AM' ? 'PM' : 'AM';
                setLocalTime((prev) => ({ ...prev, period: newPeriod }));
                const safeHour = hour12 || '12';
                const safeMinute = minute || '00';
                const newTime = to24Hour(safeHour, safeMinute, newPeriod);
                updateTimeSlot(index, { ...slot, time: newTime });
              }}
            >
              {period}
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-xs font-medium">Template</Label>
          <div className="flex items-center gap-2">
            <div className="flex-1 text-xs text-muted-foreground">
              {effectiveTemplateName ? (
                <>
                  Template: {effectiveTemplateName}
                  {effectiveTemplateType && (
                    <span className="ml-1 text-[11px] text-muted-foreground">
                      • {effectiveTemplateType}
                    </span>
                  )}
                </>
              ) : (
                'No template selected'
              )}
            </div>
            <TemplateSelectionDialog
              triggerLabel={
                slot.messageConfig.templateName ? 'Change template' : 'Select template'
              }
              selectedTemplate={selectedTemplate}
              setSelectedTemplate={setSelectedTemplate}
              variableMappings={variableMappings}
              setVariableMappings={setVariableMappings}
              selectedMediaAsset={selectedMediaAsset}
              setSelectedMediaAsset={handleSetSelectedMediaAsset}
              uploadedFileName={uploadedFileName}
              setUploadedFileName={setUploadedFileName}
              onTemplateSelect={handleTemplateSelect}
              onVariableMappingsChange={handleVariableMappingsChange}
              showPreview
              showHeaderMedia
              allowDynamicFields
            />
          </div>
            {((error?.template && !slot.messageConfig?.templateName?.trim()) ||
            error?.variables) && (
            <p className="text-[11px] text-destructive">
              {!slot.messageConfig?.templateName?.trim() && error?.template
                ? error.template
                : error?.variables}
            </p>
          )}
        </div>
      </div>
    </div>
  );
});
