import { getOccurrenceLabel } from '@/schemas/programSchema';
import type { Program } from '@/schemas/programSchema';
import { ProgramTimeSlotRow } from './ProgramTimeSlotRow';
import { Badge } from '@/components/ui/badge';

interface ProgramTimeSlotsListProps {
  program: Program;
}

export function ProgramTimeSlotsList({ program }: ProgramTimeSlotsListProps) {
  const slotsPerOccurrence = program.occurrenceTimeSlots ?? [];

  return (
    <div className="space-y-10 relative before:absolute before:left-[17px] before:top-2 before:bottom-2 before:w-[2px] before:bg-slate-100 dark:before:bg-slate-800 before:rounded-full">
      {slotsPerOccurrence.map((slots, occIndex) => (
        <div key={occIndex} className="relative pl-10 space-y-4">
          <div className="absolute left-0 top-0 h-9 w-9 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center justify-center text-[10px] font-black text-slate-400 shadow-sm z-10">
            {occIndex + 1}
          </div>
          
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
            <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-widest">
              {getOccurrenceLabel(
                program.intervalUnit,
                program.intervalValue,
                program.weekdays,
                occIndex,
              )}
            </h4>
            <Badge variant="outline" className="bg-slate-50 dark:bg-slate-950 text-[9px] font-black uppercase tracking-widest text-slate-400 border-slate-100 dark:border-slate-800 rounded-md py-0 px-2 h-5">
              {(slots ?? []).length} slots
            </Badge>
          </div>

          {(slots ?? []).length === 0 ? (
            <div className="py-4 px-5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 italic text-[11px] text-slate-400 font-medium">
              No message slots configured for this day
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {(slots ?? []).map((slot, slotIndex) => (
                <ProgramTimeSlotRow key={slotIndex} slot={slot} slotIndex={slotIndex} />
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
