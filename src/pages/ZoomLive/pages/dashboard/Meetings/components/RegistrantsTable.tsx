import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@zoom/components/ui/table';
import { Badge } from '@zoom/components/ui/badge';
import { Button } from '@zoom/components/ui/button';
import { ExternalLink, User, Phone, Tag, MapPin, Globe } from 'lucide-react';
import { cn } from "@zoom/lib/utils";

type AttendeeData = {
  _id?: string;
  phones?: string[];
  fullNames?: string[];
  tags?: string[];
  timeInSession?: number;
  attendedWebinarCount?: number;
  registeredWebinarCount?: number;
  locations?: string[];
  sources?: string[];
  leadType?: string;
  salesAssignedTo?: string;
  salesLastStatus?: string;
  reminderAssignedTo?: string;
  reminderLastStatus?: string;
};

type Registrant = {
  id?: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  phone_number?: string;
  attendeeData?: AttendeeData | null;
};

interface RegistrantsTableProps {
  rows: Registrant[];
  className?: string;
}

export function RegistrantsTable({ rows, className }: RegistrantsTableProps) {
  const dashboardBaseUrl = import.meta.env.VITE_REACT_APP_DASHBOARD_BASE_URL || 'https://dashboard.ajaybansal.com';

  const getContactUrl = (email: string) => {
    if (!email) return '#';
    return `${dashboardBaseUrl}/particularContact?email=${encodeURIComponent(email)}`;
  };

  const truncateString = (str: string, maxLength: number = 20): string => {
    if (!str || str.length <= maxLength) return str;
    return str.slice(0, maxLength) + '...';
  };

  const renderArrayWithTooltip = (
    values: string[] | undefined,
    icon: React.ElementType,
    badgeVariant: "default" | "secondary" | "outline" | "destructive" = "secondary",
    maxVisible: number = 1
  ) => {
    if (!values || values.length === 0) return <span className="text-slate-300 dark:text-slate-700">—</span>;

    const Icon = icon;
    const visible = values.slice(0, maxVisible);
    const remaining = values.length - maxVisible;

    return (
      <div className="flex items-center gap-1.5 flex-wrap min-w-[120px]">
        {visible.map((val, i) => (
          <Badge 
            key={i} 
            variant={badgeVariant}
            className="h-6 px-2 text-[10px] font-bold bg-slate-100 dark:bg-slate-900/50 border-slate-200/50 dark:border-slate-800/50 text-slate-600 dark:text-slate-300"
          >
            <Icon className="h-2.5 w-2.5 mr-1 text-slate-400" />
            {truncateString(val, 15)}
          </Badge>
        ))}
        {remaining > 0 && (
          <Badge variant="outline" className="h-6 px-2 text-[10px] font-black border-dashed">
            +{remaining}
          </Badge>
        )}
      </div>
    );
  };

  return (
    <div className={cn("relative", className)}>
      <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-800">
        <Table>
          <TableHeader className="bg-slate-50/50 dark:bg-slate-900/50">
            <TableRow className="border-slate-100 dark:border-slate-800 hover:bg-transparent">
              <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400 py-4 pl-6">Participant Info</TableHead>
              <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400 py-4">CRM Details</TableHead>
              <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400 py-4">Tags & Meta</TableHead>
              <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400 py-4 text-center">Stats</TableHead>
              <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400 py-4 pr-6 text-right">Profile</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((r, i) => {
              const attendeeData = r.attendeeData;
              const fullName = `${r.first_name || ''} ${r.last_name || ''}`.trim() || 'Anonymous';
              
              return (
                <TableRow key={r.id || r.email || i} className="border-slate-100 dark:border-slate-800 hover:bg-slate-50/30 dark:hover:bg-slate-900/30 transition-colors">
                  <TableCell className="py-4 pl-6">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 flex items-center justify-center text-slate-500 font-bold text-xs border border-white dark:border-slate-700 shadow-sm">
                        {fullName.charAt(0)}
                      </div>
                      <div className="flex flex-col">
                        <span className="font-bold text-sm text-slate-900 dark:text-white leading-tight">{fullName}</span>
                        <span className="text-[10px] font-medium text-slate-500 mt-0.5">{r.email || 'No Email'}</span>
                      </div>
                    </div>
                  </TableCell>

                  <TableCell className="py-4">
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <Phone className="h-3 w-3 text-slate-400" />
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{r.phone || r.phone_number || '—'}</span>
                      </div>
                      {renderArrayWithTooltip(attendeeData?.fullNames, User)}
                    </div>
                  </TableCell>

                  <TableCell className="py-4">
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        {renderArrayWithTooltip(attendeeData?.tags, Tag)}
                        {renderArrayWithTooltip(attendeeData?.locations, MapPin)}
                      </div>
                      <div className="flex gap-2">
                        {renderArrayWithTooltip(attendeeData?.sources, Globe)}
                      </div>
                    </div>
                  </TableCell>

                  <TableCell className="py-4">
                    <div className="flex items-center justify-center gap-4">
                      <div className="text-center">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Attended</p>
                        <p className="text-sm font-black text-blue-600 dark:text-blue-400">{attendeeData?.attendedWebinarCount ?? 0}</p>
                      </div>
                      <div className="w-[1px] h-6 bg-slate-100 dark:bg-slate-800" />
                      <div className="text-center">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Registered</p>
                        <p className="text-sm font-black text-slate-900 dark:text-white">{attendeeData?.registeredWebinarCount ?? 0}</p>
                      </div>
                    </div>
                  </TableCell>

                  <TableCell className="py-4 pr-6 text-right">
                    {r.email ? (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-10 w-10 rounded-xl hover:bg-blue-50 dark:hover:bg-blue-500/10 hover:text-blue-600 transition-all group"
                        asChild
                      >
                        <a
                          href={getContactUrl(r.email)}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label="View Contact"
                        >
                          <ExternalLink className="h-4 w-4 transition-transform group-hover:scale-110" />
                        </a>
                      </Button>
                    ) : (
                      <span className="text-slate-300 dark:text-slate-700">—</span>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

export default RegistrantsTable;


