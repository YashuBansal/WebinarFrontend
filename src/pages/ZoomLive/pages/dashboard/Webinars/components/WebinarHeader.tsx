import { motion } from "framer-motion";
import { Badge } from '@zoom/components/ui/badge';
import { Calendar, Clock, Presentation, Link2 } from 'lucide-react';
import MeetingStatusBadge from '../../Meetings/components/MeetingStatusBadge';
import { cn } from "@zoom/lib/utils";

interface WebinarHeaderProps {
  details: {
    topic?: string;
    id: string;
    startTime?: string;
    duration?: number;
    status?: string;
    join_url?: string;
  };
  statusData?: {
    meetingStartedAt: string | null;
    meetingEndedAt: string | null;
  } | null;
  isStatusLoading?: boolean;
  statusError?: any;
}

export default function WebinarHeader({ details, statusData, isStatusLoading, statusError }: WebinarHeaderProps) {
  const start = details.startTime ? new Date(details.startTime) : null;
  const status = (details.status || '').toLowerCase();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="group relative bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 rounded-[32px] p-8 shadow-sm overflow-hidden"
    >
      <div className="absolute top-0 right-0 -mr-24 -mt-24 h-48 w-48 rounded-full bg-blue-500/5 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
      
      <div className="relative z-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-10">
          <div className="flex items-center gap-6">
            <div className="h-16 w-16 rounded-3xl bg-indigo-600 text-white flex items-center justify-center shadow-xl shadow-indigo-600/20 group-hover:scale-110 transition-transform duration-500">
              <Presentation className="h-8 w-8" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                  {details.topic || 'Untitled Webinar'}
                </h1>
                {(statusData !== undefined || isStatusLoading !== undefined) && (
                  <MeetingStatusBadge 
                    meetingState={details.status || ''}
                    isStatusLoading={isStatusLoading || false}
                    statusError={statusError}
                  />
                )}
              </div>
              <p className="text-slate-500 dark:text-slate-400 font-mono text-xs font-bold uppercase tracking-widest">
                Webinar ID: <span className="text-slate-900 dark:text-white">{details.id}</span>
              </p>
            </div>
          </div>

          {details.join_url && (
            <a 
              href={details.join_url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="h-12 px-8 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl flex items-center gap-2 font-black text-sm transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg"
            >
              <Link2 className="h-4 w-4" />
              Join Webinar
            </a>
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[
            { icon: Calendar, label: "Scheduled Date", value: start ? start.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : 'Not set' },
            { icon: Clock, label: "Start Time", value: start ? start.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '—' },
            { icon: Clock, label: "Duration", value: `${details.duration ?? 0} Minutes` },
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50/50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800/50">
              <div className="h-10 w-10 rounded-xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 flex items-center justify-center text-slate-400 dark:text-slate-300">
                <item.icon className="h-4 w-4" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{item.label}</p>
                <p className="text-sm font-bold text-slate-700 dark:text-slate-200">{item.value}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}


