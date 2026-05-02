import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock, ChevronDown, ChevronUp } from 'lucide-react';
import type { Program } from '@/schemas/programSchema';
import { ProgramTimeSlotsList } from './ProgramTimeSlotsList';

interface ProgramTimeSlotsCardProps {
  program: Program;
}

export function ProgramTimeSlotsCard({ program }: ProgramTimeSlotsCardProps) {
  const [showDetails, setShowDetails] = useState(false);
  const occurrenceTimeSlots = program.occurrenceTimeSlots ?? [];
  const hasSlots = occurrenceTimeSlots.length > 0;
  const totalSlots = occurrenceTimeSlots.reduce(
    (sum, slots) => sum + (slots?.length ?? 0),
    0,
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Clock className="h-4 w-4" />
          Time slots per occurrence
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!hasSlots ? (
          <p className="text-sm text-muted-foreground">No time slots configured.</p>
        ) : !showDetails ? (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              {occurrenceTimeSlots.length} occurrence(s), {totalSlots} total slot(s)
            </p>
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={() => setShowDetails(true)}
            >
              <ChevronDown className="h-4 w-4" />
              Show time slots
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <Button
              variant="ghost"
              size="sm"
              className="gap-2 -ml-2"
              onClick={() => setShowDetails(false)}
            >
              <ChevronUp className="h-4 w-4" />
              Hide time slots
            </Button>
            <ProgramTimeSlotsList program={program} />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
