import { Badge } from '@/components/ui/badge';
import { FileText } from 'lucide-react';
import type { ProgramTimeSlot } from '@/schemas/programSchema';

interface ProgramTimeSlotRowProps {
  slot: ProgramTimeSlot;
  slotIndex: number;
}

function formatSlotTime(time: string | undefined): string {
  if (!time) return '—';
  const [hStr, mStr] = time.split(':');
  const minutes = (mStr ?? '00').padStart(2, '0');
  let hours = parseInt(hStr ?? '0', 10);
  if (Number.isNaN(hours)) return time;
  const period = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  if (hours === 0) hours = 12;
  const hoursStr = String(hours).padStart(2, '0');
  return `${hoursStr}:${minutes} ${period}`;
}

export function ProgramTimeSlotRow({ slot, slotIndex }: ProgramTimeSlotRowProps) {
  const cfg = slot.messageConfig;
  const templateName = cfg?.templateName?.trim() || 'No template';
  const language = cfg?.language || '—';
  const variableCount = cfg?.variableMappings?.length ?? 0;
  const hasHeaderMedia = !!cfg?.headerMediaAssetId;

  return (
    <div className="rounded-lg border bg-muted/30 p-3 space-y-1.5 text-sm">
      <div className="flex items-center justify-between gap-2">
        <span className="font-medium">Slot {slotIndex + 1}</span>
        <span className="text-muted-foreground text-xs">
          {formatSlotTime(slot.time)} {slot.timezone ? `(${slot.timezone})` : ''}
        </span>
      </div>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <FileText className="h-3.5 w-3.5" />
          {templateName}
        </span>
        {language !== '—' && <span>Language: {language}</span>}
        {variableCount > 0 ? (
          <span>{variableCount} variable(s) mapped</span>
        ) : (
          <span>No body variables</span>
        )}
        {hasHeaderMedia && (
          <Badge variant="outline" className="text-xs">
            Header media set
          </Badge>
        )}
      </div>
    </div>
  );
}
