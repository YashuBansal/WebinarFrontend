import { getOccurrenceLabel } from '@/schemas/programSchema';
import type { Program } from '@/schemas/programSchema';
import { ProgramTimeSlotRow } from './ProgramTimeSlotRow';

interface ProgramTimeSlotsListProps {
  program: Program;
}

export function ProgramTimeSlotsList({ program }: ProgramTimeSlotsListProps) {
  const slotsPerOccurrence = program.occurrenceTimeSlots ?? [];

  return (
    <div className="space-y-4">
      {slotsPerOccurrence.map((slots, occIndex) => (
        <div key={occIndex} className="space-y-2">
          <h4 className="text-sm font-medium">
            {getOccurrenceLabel(
              program.intervalUnit,
              program.intervalValue,
              program.weekdays,
              occIndex,
            )}
            <span className="text-muted-foreground font-normal ml-2">
              ({(slots ?? []).length} slot(s))
            </span>
          </h4>
          {(slots ?? []).length === 0 ? (
            <p className="text-sm text-muted-foreground pl-2">No slots</p>
          ) : (
            <div className="grid grid-cols-2 gap-3 pl-2">
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
