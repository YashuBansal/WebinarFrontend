import { Badge } from '@zoom/components/ui/badge';
import { Loader2, Circle } from 'lucide-react';
import { cn } from "@zoom/lib/utils";

interface MeetingStatusBadgeProps {
  meetingState: string;
  isStatusLoading: boolean;
  statusError: any;
  className?: string;
}

export default function MeetingStatusBadge({ meetingState, isStatusLoading, statusError, className }: MeetingStatusBadgeProps) {
  const status = (meetingState || '').toLowerCase();
  
  if (isStatusLoading) {
    return (
      <Badge variant="secondary" className={cn("gap-1.5 px-3 py-1 rounded-lg font-black uppercase tracking-widest text-[9px]", className)}>
        <Loader2 className="h-2.5 w-2.5 animate-spin text-slate-400" />
        Syncing
      </Badge>
    );
  }

  if (statusError) {
    return (
      <Badge variant="destructive" className={cn("gap-1.5 px-3 py-1 rounded-lg font-black uppercase tracking-widest text-[9px]", className)}>
        <Circle className="h-2 w-2 fill-current" />
        Status Unknown
      </Badge>
    );
  }

  const getStatusStyles = () => {
    switch (status) {
      case 'in-progress':
      case 'started':
        return "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 border-emerald-200/50 dark:border-emerald-500/20";
      case 'scheduled':
      case 'waiting':
        return "bg-blue-50 text-blue-600 dark:bg-blue-500/10 border-blue-200/50 dark:border-blue-500/20";
      case 'finished':
      case 'ended':
      case 'completed':
        return "bg-slate-50 text-slate-600 dark:bg-slate-700/50 border-slate-200/50 dark:border-slate-700/20";
      default:
        return "bg-amber-50 text-amber-600 dark:bg-amber-500/10 border-amber-200/50 dark:border-amber-500/20";
    }
  };

  return (
    <Badge 
      variant="outline" 
      className={cn(
        "gap-1.5 px-3 py-1 rounded-lg font-black uppercase tracking-widest text-[9px] shadow-sm",
        getStatusStyles(),
        className
      )}
    >
      <Circle className={cn("h-2 w-2 fill-current", status === 'in-progress' || status === 'started' ? "animate-pulse" : "")} />
      {meetingState || 'Pending'}
    </Badge>
  );
}
