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
    <div className="group/item relative rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-950 p-4 transition-all hover:border-blue-200 hover:shadow-lg hover:shadow-blue-900/5 overflow-hidden">
      <div className="flex items-center justify-between gap-4 mb-4">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 flex items-center justify-center text-slate-400 font-black text-[10px] group-hover/item:text-blue-600 group-hover/item:bg-blue-50 dark:group-hover/item:bg-blue-900/40 transition-all">
            #{slotIndex + 1}
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Scheduled Time</span>
            <span className="text-xs font-bold text-slate-900 dark:text-white leading-none mt-0.5">
              {formatSlotTime(slot.time)}
            </span>
          </div>
        </div>
        {hasHeaderMedia && (
          <Badge variant="outline" className="bg-blue-50/30 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border-blue-100 dark:border-blue-900 rounded-md py-0 px-1.5 h-4 text-[8px] font-black uppercase tracking-widest">
            Media
          </Badge>
        )}
      </div>

      <div className="space-y-3">
        <div className="flex items-center gap-3 p-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 group-hover/item:bg-white dark:group-hover/item:bg-slate-950 group-hover/item:border-slate-100 dark:group-hover/item:border-slate-800 transition-all">
          <div className="h-7 w-7 rounded-lg bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-800 flex items-center justify-center text-slate-400">
            <FileText className="h-3.5 w-3.5" />
          </div>
          <div className="flex flex-col overflow-hidden">
            <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Template</span>
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 truncate tracking-tight">{templateName}</span>
          </div>
        </div>

        <div className="flex items-center gap-4 px-1">
          <div className="flex items-center gap-1.5">
            <div className="h-1.5 w-1.5 rounded-full bg-slate-300" />
            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-tight">{language}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-1.5 w-1.5 rounded-full bg-slate-300" />
            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-tight">{variableCount} Vars</span>
          </div>
        </div>
      </div>
    </div>
  );
}
