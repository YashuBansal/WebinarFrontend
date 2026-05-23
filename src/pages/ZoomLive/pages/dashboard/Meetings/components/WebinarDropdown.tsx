import { useEffect, useState } from 'react';
import { Alert, AlertDescription } from '@zoom/components/ui/alert';
import { Button } from '@zoom/components/ui/button';
import { useWebinars } from '@zoom/hooks/useZoom';
import { getQueryErrorMessage } from '@zoom/lib/apiErrors';
import type { Webinar } from '@zoom/api/zoomApi';
import { Check, ChevronsUpDown, Presentation } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@zoom/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandItem, CommandList } from '@zoom/components/ui/command';
import { cn } from "@zoom/lib/utils";

interface WebinarDropdownProps {
  currentMeetingId: string;
  currentOccurrenceId?: string;
  onWebinarChange?: (webinar: Webinar | null) => void;
  onSave?: (webinarId: string) => void;
}

export default function WebinarDropdown({ currentMeetingId, currentOccurrenceId, onWebinarChange, onSave }: WebinarDropdownProps) {
  const [selectedWebinarId, setSelectedWebinarId] = useState<string>('');
  const [open, setOpen] = useState(false);
  const { data: webinars, isLoading, error } = useWebinars();

  const currentWebinar = currentOccurrenceId
    ? webinars?.find(w => w.meetingId === currentMeetingId && w.occurrenceId === currentOccurrenceId)
    : webinars?.find(w => w.meetingId === currentMeetingId);

  useEffect(() => {
    setSelectedWebinarId(currentWebinar?._id || '');
  }, [currentWebinar?._id]);

  const handleWebinarSelect = (webinarId: string) => {
    setSelectedWebinarId(webinarId);
    setOpen(false);
    if (webinarId === '') {
      onWebinarChange?.(null);
      return;
    }
    const selectedWebinar = webinars?.find(w => w._id === webinarId);
    onWebinarChange?.(selectedWebinar || null);
  };

  const handleSave = () => {
    onSave?.(selectedWebinarId);
  };

  const hasChanges = selectedWebinarId !== (currentWebinar?._id || '');
  const selectedWebinar = webinars?.find(w => w._id === selectedWebinarId);

  if (isLoading) {
    return <div className="text-xs font-bold text-slate-400 animate-pulse py-2">Syncing Workspaces...</div>;
  }

  if (error) {
    return (
      <Alert className="bg-rose-50 border-rose-100 dark:bg-rose-500/10 dark:border-rose-500/20">
        <AlertDescription className="text-rose-600 dark:text-rose-400 text-xs font-bold">
          {getQueryErrorMessage(error, 'Failed to load webinars.')}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between px-1">
        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Workspace Assignment</label>
        {currentWebinar && (
          <span className="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-tight bg-blue-50 dark:bg-blue-500/10 px-2 py-0.5 rounded-md">
            Currently Linked
          </span>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={open}
              className="flex-1 h-12 justify-between px-4 rounded-xl border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50 hover:bg-white dark:hover:bg-slate-800 transition-all font-bold text-sm"
            >
              <div className="flex items-center gap-3">
                <Presentation className={cn("h-4 w-4", selectedWebinar ? "text-blue-500" : "text-slate-400")} />
                {selectedWebinar ? selectedWebinar.webinarName : "Select workspace webinar..."}
              </div>
              <ChevronsUpDown className="h-4 w-4 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-2 rounded-2xl border-slate-200 dark:border-slate-700 shadow-2xl" align="start">
            <Command className="rounded-xl">
              <CommandList>
                <CommandEmpty className="p-4 text-center text-xs text-slate-500 font-bold">No webinars found</CommandEmpty>
                <CommandGroup>
                  <CommandItem
                    onSelect={() => handleWebinarSelect('')}
                    className="rounded-lg py-2.5 cursor-pointer"
                  >
                    <Check className={cn("mr-2 h-4 w-4 text-blue-500", selectedWebinarId === '' ? 'opacity-100' : 'opacity-0')} />
                    <span className="font-bold text-xs">Unlinked (No Association)</span>
                  </CommandItem>
                  {webinars?.map((webinar) => {
                    const isAlreadyAssociated = webinar.meetingId && (
                      webinar.meetingId !== currentMeetingId ||
                      (currentOccurrenceId && webinar.occurrenceId && webinar.occurrenceId !== currentOccurrenceId)
                    );
                    return (
                      <CommandItem
                        key={webinar._id}
                        onSelect={() => handleWebinarSelect(webinar._id)}
                        className="rounded-lg py-2.5 cursor-pointer"
                      >
                        <Check className={cn("mr-2 h-4 w-4 text-blue-500", selectedWebinarId === webinar._id ? 'opacity-100' : 'opacity-0')} />
                        <div className="flex flex-col">
                          <span className={cn("font-black text-xs", isAlreadyAssociated ? "text-slate-400" : "text-slate-700 dark:text-slate-200")}>
                            {webinar.webinarName}
                          </span>
                          {isAlreadyAssociated && (
                            <span className="text-[9px] font-black uppercase text-amber-500">Linked to another event</span>
                          )}
                        </div>
                      </CommandItem>
                    );
                  })}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>

        <Button
          onClick={handleSave}
          disabled={!hasChanges}
          className={cn(
            "h-12 px-8 rounded-xl font-black text-xs uppercase tracking-widest transition-all shadow-lg",
            hasChanges 
              ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-slate-900/10 dark:shadow-white/5" 
              : "bg-slate-100 dark:bg-slate-800 text-slate-400 border-transparent shadow-none"
          )}
        >
          {hasChanges ? "Confirm Change" : "No Changes"}
        </Button>
      </div>

      {currentWebinar && !hasChanges && (
        <p className="text-[10px] font-bold text-slate-500 italic px-1 flex items-center gap-2">
          <Check className="h-3 w-3 text-emerald-500" />
          Synchronized with <span className="text-slate-900 dark:text-slate-200">{currentWebinar.webinarName}</span>
        </p>
      )}
    </div>
  );
}
