import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Clock, ChevronDown, ChevronUp, LayoutList } from 'lucide-react';
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
    <Card className="group relative rounded-2xl border border-slate-200 overflow-hidden bg-white dark:bg-slate-900 shadow-sm hover:border-green-400 dark:hover:border-green-500 hover:shadow-xl hover:shadow-green-900/5 dark:hover:shadow-green-500/10 transition-all duration-300 dark:border-slate-800">
      <CardContent className="p-0">
        <div
          className="px-6 py-2 sm:px-6 sm:py-2 flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer transition-colors"
          onClick={() => setShowDetails(!showDetails)}
        >
          <div className="flex items-center gap-4">
            <div className="h-11 w-11 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 flex items-center justify-center text-slate-400 group-hover:text-green-600 group-hover:bg-green-50 dark:group-hover:bg-green-950 transition-all">
              <Clock className="h-5 w-5" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-black text-slate-900 dark:text-white tracking-tight leading-none">Schedule Details</h3>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Timeline Analytics</span>
                <span className="h-1 w-1 rounded-full bg-slate-200 dark:bg-slate-700" />
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">{totalSlots} Total Slots</span>
              </div>
            </div>
          </div>

          <Button
            variant="outline"
            size="sm"
            className={`h-10 px-5 rounded-xl border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 font-bold text-xs gap-2 transition-all shadow-sm ${showDetails ? 'bg-slate-100 dark:bg-slate-800' : 'bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
          >
            {showDetails ? (
              <>
                <ChevronUp className="h-4 w-4" />
                Collapse View
              </>
            ) : (
              <>
                <ChevronDown className="h-4 w-4" />
                View Full Timeline
              </>
            )}
          </Button>
        </div>

        <AnimatePresence>
          {showDetails && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="overflow-hidden border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950"
            >
              <div className="p-6 sm:p-8">
                {!hasSlots ? (
                  <div className="flex flex-col items-center justify-center py-12 px-6 rounded-[24px] border-2 border-dashed border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
                    <div className="h-12 w-12 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
                      <Clock className="h-6 w-6 text-slate-200" />
                    </div>
                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest">No slots configured for this sequence</p>
                  </div>
                ) : (
                  <div className="space-y-8">
                    <ProgramTimeSlotsList program={program} />
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}
