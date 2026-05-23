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
import { Plus, Trash2, AlertCircle } from 'lucide-react';
import { TemplateSelectionDialog } from '@/components/common/TemplateSelectionDialog';
import { Badge } from '@/components/ui/badge';
import type { VariableMapping } from '@/api/modules/autoMessage';
import { useTemplates } from '@/hooks/useTemplates';
import { useMediaAssets } from '@/hooks/useMediaAssets';

type SetSlotsForOccurrence = (
  occIndex: number,
  newSlotsOrUpdater:
    | ProgramTimeSlot[]
    | ((prev: ProgramTimeSlot[]) => ProgramTimeSlot[]),
) => void;

interface ProgramTimeSlotsEditorProps {
  projectId?: string;
  timeSlots: ProgramTimeSlot[];
  occIndex: number;
  setSlotsForOccurrence: SetSlotsForOccurrence;
  slotErrors?: { time?: string; template?: string; variables?: string }[];
}

function ProgramTimeSlotsEditorInner({
  projectId,
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
    <div className="space-y-6">
      <div className="flex items-center justify-between px-3">
        <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-400">
          <span>Message Queue</span>
          <span className="h-1 w-1 rounded-full bg-slate-300" />
          <span className="text-slate-600 dark:text-slate-400">{timeSlots.length} Slots</span>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addTimeSlot}
          className="h-8 px-3 rounded-lg border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 font-bold text-[10px] uppercase tracking-wider gap-1.5 hover:bg-slate-50 dark:hover:bg-slate-900 transition-all active:scale-[0.98]"
        >
          <Plus className="h-3.5 w-3.5" />
          Add Slot
        </Button>
      </div>

      <div className="space-y-5">
        {timeSlots.map((slot, index) => (
          <ProgramTimeSlotRow
            key={index}
            index={index}
            slot={slot}
            projectId={projectId}
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
  projectId?: string;
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
  projectId,
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

  // Fetch templates to find the details of existing template by name
  const { data: templatesResp } = useTemplates(projectId || '');

  useEffect(() => {
    if (templatesResp?.data && slot.messageConfig.templateName && !selectedTemplate) {
      const matched = templatesResp.data.find(
        (t: any) => t.name === slot.messageConfig.templateName
      );
      if (matched) {
        setSelectedTemplate(matched);
      }
    }
  }, [templatesResp, slot.messageConfig.templateName, selectedTemplate]);

  // Fetch media assets to find the details of existing media asset by ID
  const { data: mediaAssetsData } = useMediaAssets({
    projectId: projectId || '',
    page: 1,
    limit: 50,
  });

  useEffect(() => {
    if (mediaAssetsData?.data && slot.messageConfig.headerMediaAssetId && !selectedMediaAsset) {
      const asset = mediaAssetsData.data.find(
        (file: any) => file._id === slot.messageConfig.headerMediaAssetId
      );
      if (asset) {
        setSelectedMediaAsset(asset);
        setUploadedFileName(asset.fileName);
      }
    }
  }, [mediaAssetsData, slot.messageConfig.headerMediaAssetId, selectedMediaAsset]);

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
  }, [slot.time]);

  const { hour12, minute, period } = localTime;

  return (
    <div className="group/slot relative rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-6 sm:p-8 space-y-6 transition-all hover:border-blue-200 hover:bg-white dark:hover:bg-slate-900 hover:shadow-lg hover:shadow-blue-900/5 overflow-hidden">
      <div className="absolute top-2 right-2">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => removeTimeSlot(index)}
          disabled={disableRemove}
          className="h-8 w-8 rounded-lg text-slate-600 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 transition-all"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="h-9 w-9 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-400 font-bold text-xs group-hover/slot:text-blue-600 group-hover/slot:bg-blue-50 group-hover/slot:border-blue-100 transition-all">
            S{index + 1}
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-sm font-black text-slate-900 dark:text-white tracking-tight">Slot Schedule</span>
              {slot.time && (
                <Badge variant="outline" className="bg-slate-50 dark:bg-slate-900 text-[9px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 rounded-md py-0 px-2 h-5">
                  {slot.time}
                </Badge>
              )}
            </div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-400">Content & Timing</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          {/* Time Picker */}
          <div className="space-y-1.5">
            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-400 ml-1">Send Time</Label>
            <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
              <Select
                value={hour12 || undefined}
                onValueChange={(value) => {
                  setLocalTime((prev) => ({ ...prev, hour12: value }));
                  const newTime = to24Hour(value, minute || '00', period);
                  updateTimeSlot(index, { ...slot, time: newTime });
                }}
              >
                <SelectTrigger className="h-8 w-14 bg-white dark:bg-slate-950 border-none shadow-none text-xs font-bold focus:ring-0">
                  <SelectValue placeholder="HH" />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-slate-200 dark:border-slate-800">
                  {Array.from({ length: 12 }, (_, i) => {
                    const h = String(i + 1).padStart(2, '0');
                    return (
                      <SelectItem key={h} value={h} className="rounded-lg text-xs font-bold">
                        {h}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>

              <span className="text-slate-300 font-bold text-xs">:</span>

              <Select
                value={minute || undefined}
                onValueChange={(value) => {
                  setLocalTime((prev) => ({ ...prev, minute: value }));
                  const safeHour = hour12 || '12';
                  const newTime = to24Hour(safeHour, value, period);
                  updateTimeSlot(index, { ...slot, time: newTime });
                }}
              >
                <SelectTrigger className="h-8 w-14 bg-white dark:bg-slate-950 border-none shadow-none text-xs font-bold focus:ring-0">
                  <SelectValue placeholder="MM" />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-slate-200 dark:border-slate-800">
                  {Array.from({ length: 12 }, (_, i) => {
                    const m = String(i * 5).padStart(2, '0');
                    return (
                      <SelectItem key={m} value={m} className="rounded-lg text-xs font-bold">
                        {m}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>

              <button
                type="button"
                onClick={() => {
                  const newPeriod = period === 'AM' ? 'PM' : 'AM';
                  setLocalTime((prev) => ({ ...prev, period: newPeriod }));
                  const safeHour = hour12 || '12';
                  const safeMinute = minute || '00';
                  const newTime = to24Hour(safeHour, safeMinute, newPeriod);
                  updateTimeSlot(index, { ...slot, time: newTime });
                }}
                className={`
                  h-8 px-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all
                  ${period === 'AM' ? 'bg-blue-500 text-white shadow-sm' : 'bg-slate-900 text-white shadow-sm'}
                `}
              >
                {period}
              </button>
            </div>
          </div>

          {/* Template Picker */}
          <div className="space-y-1.5 flex-1 min-w-[200px]">
            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-400 ml-1">Message Content</Label>
            <div className="flex items-center gap-2">
              <TemplateSelectionDialog
                projectId={projectId}
                triggerLabel={
                  slot.messageConfig.templateName ? slot.messageConfig.templateName : 'Select template'
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
                triggerClassName={`
                  flex-1 h-10 px-4 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-bold transition-all text-left
                  ${slot.messageConfig.templateName 
                    ? 'bg-blue-50/50 text-blue-700 border-blue-100 dark:border-blue-500/20 hover:bg-blue-50 dark:hover:bg-blue-500/10' 
                    : 'bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900'}
                `}
              />
            </div>
          </div>
        </div>
      </div>

      {(error?.time || error?.template || error?.variables) && (
        <div className="pt-2 flex flex-wrap gap-x-4 gap-y-1 border-t border-slate-100 dark:border-slate-800 mt-2">
          {error?.time && (
            <p className="text-[10px] font-bold text-red-500 uppercase tracking-wider flex items-center gap-1">
              <AlertCircle className="h-3 w-3" /> Time: {error.time}
            </p>
          )}
          {(!slot.messageConfig?.templateName?.trim() && error?.template) && (
            <p className="text-[10px] font-bold text-red-500 uppercase tracking-wider flex items-center gap-1">
              <AlertCircle className="h-3 w-3" /> Template: {error.template}
            </p>
          )}
          {error?.variables && (
            <p className="text-[10px] font-bold text-red-500 uppercase tracking-wider flex items-center gap-1">
              <AlertCircle className="h-3 w-3" /> Variables: {error.variables}
            </p>
          )}
        </div>
      )}
    </div>
  );
});
