import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Loader2,
  Pause,
  Play,
  XCircle,
  Eye,
  AlertTriangle,
  Plus,
  RefreshCw,
  Clock,
  UserCheck,
  CheckCircle2,
  Activity,
  History,
  Info,
  Calendar,
  Globe,
  Variable,
  Phone,
  AlertCircle,
} from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useProjectContext } from '@/context/ProjectContext';
import {
  useProgramAssignments,
  useCreateProgramAssignment,
  usePauseProgramAssignment,
  useResumeProgramAssignment,
  useCancelProgramAssignment,
  useProgramAssignmentSlots,
} from '@/hooks/usePrograms';
import type { Program } from '@/schemas/programSchema';
import { getTotalOccurrenceCount } from '@/schemas/programSchema';
import { toastUtils } from '@/lib/utils';
import {
  formatProgramDateTime,
  formatProgramTime,
} from '@/lib/programDateTime';
import { ConfirmationDialog } from '@/components/ui/ConfirmationDialog';

const ASSIGNMENT_STATUS_COLORS: Record<string, string> = {
  scheduled: 'bg-blue-50 text-blue-600 border-blue-100',
  running: 'bg-green-50 text-green-600 border-green-100',
  paused: 'bg-yellow-50 text-yellow-600 border-yellow-100',
  completed: 'bg-slate-50 text-slate-600 border-slate-100',
  cancelled: 'bg-red-50 text-red-600 border-red-100',
};

interface ProgramAssignmentsSectionProps {
  programId: string;
  program: Program;
}

export function ProgramAssignmentsSection({
  programId,
  program,
}: ProgramAssignmentsSectionProps) {
  const { selectedProject } = useProjectContext();
  const [addAssignmentOpen, setAddAssignmentOpen] = useState(false);
  const [phone, setPhone] = useState('');
  const [startAtDate, setStartAtDate] = useState('');
  const [startAtTime, setStartAtTime] = useState('09:00');
  const [timezone, setTimezone] = useState('Asia/Kolkata');
  const [dynamicVars, setDynamicVars] = useState<Record<string, string>>({});

  const [viewSlotsOpen, setViewSlotsOpen] = useState(false);
  const [selectedAssignmentId, setSelectedAssignmentId] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(true);
  const [lastRefreshTime, setLastRefreshTime] = useState<Date | null>(null);
  const [missingVarsDialogOpen, setMissingVarsDialogOpen] = useState(false);
  const [missingVars, setMissingVars] = useState<string[]>([]);
  const [pendingAssignmentPayload, setPendingAssignmentPayload] = useState<{
    programId: string;
    projectId: string;
    phone: string;
    startAt: string;
    timezone: string;
    dynamicVariables?: Record<string, string>;
  } | null>(null);

  const { data: slotsData, isLoading: slotsLoading, refetch: refetchSlots } = useProgramAssignmentSlots(selectedAssignmentId);

  const { data: assignmentsData, isLoading: assignmentsLoading, refetch: refetchAssignments } =
    useProgramAssignments({
      programId,
      projectId: selectedProject?._id ?? '',
      page: 1,
      limit: 50,
    });

  const createAssignmentMutation = useCreateProgramAssignment();
  const pauseMutation = usePauseProgramAssignment();
  const resumeMutation = useResumeProgramAssignment();
  const cancelMutation = useCancelProgramAssignment();

  const assignments = assignmentsData?.assignments ?? [];
  const today = new Date().toISOString().slice(0, 10);

  const requiredVariables = React.useMemo(() => {
    if (!program || !Array.isArray(program.occurrenceTimeSlots)) return [];
    const variables = new Set<string>();

    program.occurrenceTimeSlots.forEach((occurrence) => {
      if (!Array.isArray(occurrence)) return;

      occurrence.forEach((slot) => {
        if (
          !slot ||
          !slot.messageConfig ||
          slot.messageConfig.messageType !== 'template' ||
          !Array.isArray(slot.messageConfig.variableMappings) ||
          slot.messageConfig.variableMappings.length === 0
        ) {
          return;
        }

        slot.messageConfig.variableMappings.forEach((mapping: any) => {
          if (mapping.isDynamic && mapping.contactField) {
            const raw = String(mapping.contactField).trim();
            const cleaned = raw.startsWith('$') ? raw.slice(1) : raw;
            if (cleaned) variables.add(cleaned);
          }
        });
      });
    });

    return Array.from(variables);
  }, [program]);

  // Initialize per-variable inputs when dialog opens
  useEffect(() => {
    if (!addAssignmentOpen) return;
    setDynamicVars((prev) => {
      const next: Record<string, string> = { ...prev };
      requiredVariables.forEach((key) => {
        if (!(key in next)) {
          next[key] = '';
        }
      });
      return next;
    });
  }, [addAssignmentOpen, requiredVariables]);

  const missedSlotsCount = React.useMemo(() => {
    if (!startAtDate || !startAtTime || !program.occurrenceTimeSlots?.[0]) return 0;
    const startDateObj = new Date(`${startAtDate}T${startAtTime}`);
    if (isNaN(startDateObj.getTime())) return 0;

    let missed = 0;
    const firstDaySlots = program.occurrenceTimeSlots[0];
    const isToday = startAtDate === today;

    firstDaySlots.forEach((slot) => {
      const slotTimeString = slot.time;
      if (isToday) {
        const nowTime = new Date().toTimeString().slice(0, 5);
        if (slotTimeString < startAtTime || slotTimeString < nowTime) {
          missed++;
        }
      } else {
        if (slotTimeString < startAtTime) {
          missed++;
        }
      }
    });

    return missed;
  }, [startAtDate, startAtTime, program.occurrenceTimeSlots, today]);

  const triggerCreateAssignment = (
    payload: {
      programId: string;
      projectId: string;
      phone: string;
      startAt: string;
      timezone: string;
      dynamicVariables?: Record<string, string>;
    },
  ) => {
    createAssignmentMutation.mutate(payload, {
      onSuccess: () => {
        setAddAssignmentOpen(false);
        setPhone('');
        setStartAtDate('');
        setStartAtTime('09:00');
        setTimezone('Asia/Kolkata');
        setDynamicVars({});
        setMissingVarsDialogOpen(false);
        setPendingAssignmentPayload(null);
        setMissingVars([]);
      },
    });
  };

  const handleAddAssignment = () => {
    if (!programId || !selectedProject?._id || !phone.trim()) return;

    const startDateObj = new Date(`${startAtDate}T${startAtTime}`);
    if (isNaN(startDateObj.getTime())) return;

    if (startDateObj < new Date()) {
      toastUtils.error('Start date and time cannot be in the past');
      return;
    }

    const startAt = startDateObj.toISOString();

    const cleanedDynamicVars: Record<string, string> = {};
    Object.entries(dynamicVars).forEach(([k, v]) => {
      const value = v.trim();
      if (value) cleanedDynamicVars[k] = value;
    });

    const missingRequired = requiredVariables.filter(
      (key) => !(key in cleanedDynamicVars) || cleanedDynamicVars[key].trim() === '',
    );

    const payload = {
      programId,
      projectId: selectedProject._id,
      phone: phone.trim(),
      startAt,
      timezone: timezone.trim() || 'Asia/Kolkata',
      dynamicVariables:
        Object.keys(cleanedDynamicVars).length > 0
          ? cleanedDynamicVars
          : undefined,
    };

    if (missingRequired.length > 0) {
      setMissingVars(missingRequired);
      setPendingAssignmentPayload(payload);
      setMissingVarsDialogOpen(true);
      return;
    }

    triggerCreateAssignment(payload);
  };

  useEffect(() => {
    if (!autoRefreshEnabled || !selectedProject?._id) return;

    const interval = setInterval(async () => {
      try {
        await refetchAssignments();
        if (selectedAssignmentId) await refetchSlots();
        setLastRefreshTime(new Date());
      } catch (error) {
        console.error('Auto-refresh failed:', error);
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [autoRefreshEnabled, selectedProject?._id, refetchAssignments, refetchSlots, selectedAssignmentId]);

  const handleRefresh = async () => {
    try {
      setIsRefreshing(true);
      await refetchAssignments();
      if (selectedAssignmentId) await refetchSlots();
      setLastRefreshTime(new Date());
    } catch (error) {
      console.error('Failed to refresh assignments:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-2">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-black text-slate-900 tracking-tight">Active Reach</h2>
              {autoRefreshEnabled && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-green-50 text-[10px] font-bold text-green-600 uppercase tracking-wider border border-green-100"
                >
                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
                  Live
                </motion.div>
              )}
            </div>
            <p className="text-slate-500 text-xs font-medium">
              {lastRefreshTime ? `Synced at ${formatProgramTime(lastRefreshTime)}` : 'Real-time assignment tracking'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <Button
              onClick={handleRefresh}
              variant="outline"
              disabled={isRefreshing}
              className="h-10 px-4 rounded-xl border-slate-200 text-slate-600 font-bold text-xs gap-2 hover:bg-slate-50 transition-all"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>

            <Button
              onClick={() => setAutoRefreshEnabled(!autoRefreshEnabled)}
              variant="outline"
              className={`h-10 px-4 rounded-xl border-slate-200 font-bold text-xs gap-2 transition-all ${autoRefreshEnabled ? 'bg-green-50 text-green-700 border-green-200' : 'text-slate-600 hover:bg-slate-50'}`}
            >
              <Clock className="h-3.5 w-3.5" />
              {autoRefreshEnabled ? 'Auto-Sync On' : 'Auto-Sync Off'}
            </Button>

            <Button
              onClick={() => setAddAssignmentOpen(true)}
              className="h-10 px-5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs gap-2 shadow-lg shadow-slate-900/10 transition-all active:scale-[0.98]"
            >
              <Plus className="h-4 w-4" />
              Assign Contact
            </Button>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="group relative bg-white border border-slate-200 rounded-2xl shadow-sm hover:shadow-md transition-all overflow-hidden"
        >
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-slate-50/50">
                <TableRow className="hover:bg-transparent border-slate-100">
                  <TableHead className="h-12 text-[10px] font-black uppercase tracking-widest text-slate-400 pl-6">Contact / Phone</TableHead>
                  <TableHead className="h-12 text-[10px] font-black uppercase tracking-widest text-slate-400">Status</TableHead>
                  <th className="h-12 text-[10px] font-black uppercase tracking-widest text-slate-400 text-left px-4">Start At</th>
                  <TableHead className="h-12 text-[10px] font-black uppercase tracking-widest text-slate-400">Progress</TableHead>
                  <TableHead className="h-12 text-[10px] font-black uppercase tracking-widest text-slate-400">Next Slot</TableHead>
                  <TableHead className="h-12 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right pr-6">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {assignmentsLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-40 text-center">
                      <div className="flex flex-col items-center justify-center gap-3">
                        <Loader2 className="h-6 w-6 animate-spin text-slate-300" />
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Fetching assignments...</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : assignments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-40 text-center">
                      <div className="flex flex-col items-center justify-center gap-3">
                        <UserCheck className="h-8 w-8 text-slate-200" />
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">No active assignments found</p>
                        <Button variant="ghost" size="sm" onClick={() => setAddAssignmentOpen(true)} className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 font-bold text-[10px] uppercase">Assign Now</Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  assignments.map((a) => (
                    <TableRow key={a._id} className="group/row hover:bg-slate-50/50 border-slate-100 transition-colors">
                      <TableCell className="py-4 pl-6">
                        <div className="flex items-center gap-3">
                          <div className={`h-8 w-8 rounded-full flex items-center justify-center border font-bold text-[10px] ${a.source === 'auto' ? 'bg-blue-50 text-blue-600 border-blue-100' : 'bg-slate-50 text-slate-600 border-slate-200'}`}>
                            {a.source === 'auto' ? 'A' : 'M'}
                          </div>
                          <div className="space-y-0.5">
                            <div className="font-bold text-slate-900 text-sm">{a.phone}</div>
                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                              {a.source === 'auto' ? 'Auto-assigned' : 'Manually added'}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="py-4">
                        <Badge className={`rounded-full px-3 py-0.5 text-[10px] font-bold uppercase tracking-wider border shadow-none ${ASSIGNMENT_STATUS_COLORS[a.status] || 'bg-slate-100 text-slate-500 border-slate-200'}`}>
                          {a.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-4 text-xs font-medium text-slate-600">
                        <div className="flex flex-col">
                          <span>{formatProgramDateTime(a.startAt).split(',')[0]}</span>
                          <span className="text-[10px] text-slate-400">{formatProgramDateTime(a.startAt).split(',')[1]}</span>
                        </div>
                      </TableCell>
                      <TableCell className="py-4">
                        <div className="space-y-1.5 max-w-[120px]">
                          <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-slate-400">
                            <span>{Math.round(((a.stats?.completedSlots || 0) / (a.stats?.totalSlots || 1)) * 100)}%</span>
                            <span>{a.stats?.completedSlots || 0}/{a.stats?.totalSlots || 0}</span>
                          </div>
                          <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${((a.stats?.completedSlots || 0) / (a.stats?.totalSlots || 1)) * 100}%` }}
                              className={`h-full rounded-full ${a.status === 'running' ? 'bg-green-500' : 'bg-slate-400'}`}
                            />
                          </div>
                          {a.failureCount > 0 && (
                            <div className="text-[9px] font-bold text-red-500 flex items-center gap-1 mt-1">
                              <AlertTriangle className="h-2.5 w-2.5" />
                              {a.failureCount} Failures
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="py-4">
                        {a.stats?.nextSlotDate ? (
                          <div className="flex items-center gap-2 text-slate-600 font-bold text-xs">
                            <Clock className="h-3.5 w-3.5 text-slate-300" />
                            {formatProgramTime(a.stats.nextSlotDate)}
                          </div>
                        ) : (
                          <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">Queue Finished</span>
                        )}
                      </TableCell>
                      <TableCell className="py-4 text-right pr-6">
                        <div className="flex justify-end items-center gap-1.5">
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => {
                              setSelectedAssignmentId(a._id);
                              setViewSlotsOpen(true);
                            }}
                            className="h-8 w-8 rounded-lg border-slate-200 text-slate-400 hover:text-blue-600 hover:border-blue-200 hover:bg-blue-50 transition-all"
                            title="View timeline"
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </Button>
                          {(a.status === 'running' || a.status === 'scheduled') && (
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => pauseMutation.mutate(a._id)}
                              disabled={pauseMutation.isPending}
                              className="h-8 w-8 rounded-lg border-slate-200 text-slate-400 hover:text-yellow-600 hover:border-yellow-200 hover:bg-yellow-50 transition-all"
                              title="Pause"
                            >
                              <Pause className="h-3.5 w-3.5" />
                            </Button>
                          )}
                          {a.status === 'paused' && (
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => resumeMutation.mutate(a._id)}
                              disabled={resumeMutation.isPending}
                              className="h-8 w-8 rounded-lg border-slate-200 text-slate-400 hover:text-green-600 hover:border-green-200 hover:bg-green-50 transition-all"
                              title="Resume"
                            >
                              <Play className="h-3.5 w-3.5" />
                            </Button>
                          )}
                          {(a.status === 'scheduled' || a.status === 'running' || a.status === 'paused') && (
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => cancelMutation.mutate(a._id)}
                              disabled={cancelMutation.isPending}
                              className="h-8 w-8 rounded-lg border-slate-200 text-slate-400 hover:text-red-600 hover:border-red-200 hover:bg-red-50 transition-all"
                              title="Cancel"
                            >
                              <XCircle className="h-3.5 w-3.5" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </motion.div>
      </div>

      {/* Add Assignment Dialog */}
      <Dialog open={addAssignmentOpen} onOpenChange={setAddAssignmentOpen}>
        <DialogContent className="sm:max-w-xl rounded-[32px] border-none shadow-2xl p-0 overflow-hidden">
          <div className="bg-slate-900 p-8 text-white relative">
            <div className="absolute top-0 right-0 p-8 opacity-10">
              <UserCheck className="h-24 w-24" />
            </div>
            <div className="relative z-10 space-y-1">
              <div className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-400 mb-1">New Manual Entry</div>
              <DialogTitle className="text-2xl font-black tracking-tight">Assign Contact</DialogTitle>
              <p className="text-slate-400 text-xs font-medium">Manually enqueue a contact into the automated sequence.</p>
            </div>
          </div>

          <div className="p-8 space-y-8 bg-white max-h-[70vh] overflow-y-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-3">
                <Label htmlFor="phone" className="text-[10px] font-black uppercase tracking-widest text-slate-400">Phone Number</Label>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    id="phone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="919876543210"
                    className="h-12 pl-11 bg-slate-50 border-slate-200 rounded-xl focus:bg-white font-bold"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <Label htmlFor="timezone" className="text-[10px] font-black uppercase tracking-widest text-slate-400">Timezone</Label>
                <div className="relative">
                  <Globe className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    id="timezone"
                    value={timezone}
                    onChange={(e) => setTimezone(e.target.value)}
                    placeholder="Asia/Kolkata"
                    className="h-12 pl-11 bg-slate-50 border-slate-200 rounded-xl focus:bg-white font-bold"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <Label htmlFor="startAtDate" className="text-[10px] font-black uppercase tracking-widest text-slate-400">Start Date</Label>
                <div className="relative">
                  <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    id="startAtDate"
                    type="date"
                    value={startAtDate}
                    onChange={(e) => setStartAtDate(e.target.value)}
                    min={today}
                    className="h-12 pl-11 bg-slate-50 border-slate-200 rounded-xl focus:bg-white font-bold"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <Label htmlFor="startAtTime" className="text-[10px] font-black uppercase tracking-widest text-slate-400">Start Time</Label>
                <div className="relative">
                  <Clock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    id="startAtTime"
                    type="time"
                    value={startAtTime}
                    onChange={(e) => setStartAtTime(e.target.value)}
                    className="h-12 pl-11 bg-slate-50 border-slate-200 rounded-xl focus:bg-white font-bold"
                  />
                </div>
              </div>
            </div>

            {missedSlotsCount > 0 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex items-start gap-4 rounded-2xl bg-orange-50 border border-orange-100 p-4 text-orange-700"
              >
                <div className="h-10 w-10 rounded-xl bg-white flex items-center justify-center shadow-sm border border-orange-100 shrink-0">
                  <AlertTriangle className="h-5 w-5" />
                </div>
                <div className="text-xs font-medium space-y-1 pt-1">
                  <strong className="text-[10px] font-black uppercase tracking-widest block mb-1">Time Conflict Warning</strong>
                  Based on your selection, <span className="font-black underline decoration-2">{missedSlotsCount}</span> out of {program.occurrenceTimeSlots?.[0]?.length || 0} slots for Day 1 will be <span className="font-bold text-red-600 uppercase tracking-tighter">skipped</span> because their scheduled time has already passed.
                </div>
              </motion.div>
            )}

            <div className="space-y-4 pt-4 border-t border-slate-100">
              <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                <Variable className="h-3 w-3" />
                Dynamic Variable Mappings
              </Label>
              {requiredVariables.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {requiredVariables.map((key) => (
                    <div key={key} className="space-y-1.5">
                      <Label htmlFor={`dynamic-${key}`} className="text-[10px] font-bold text-slate-500 uppercase ml-1">
                        {key}
                      </Label>
                      <Input
                        id={`dynamic-${key}`}
                        value={dynamicVars[key] ?? ''}
                        onChange={(e) =>
                          setDynamicVars((prev) => ({
                            ...prev,
                            [key]: e.target.value,
                          }))
                        }
                        placeholder={`Value for ${key}`}
                        className="h-10 bg-slate-50/50 border-slate-200 rounded-xl font-medium"
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex items-center gap-3 p-4 rounded-xl bg-slate-50 text-slate-400 border border-slate-100 italic text-xs">
                  <Info className="h-4 w-4" />
                  This sequence doesn't require any dynamic variables.
                </div>
              )}
            </div>
          </div>

          <div className="p-8 pt-0 bg-white">
            <Button
              onClick={handleAddAssignment}
              disabled={!phone.trim() || !startAtDate || createAssignmentMutation.isPending}
              className="h-14 w-full rounded-2xl bg-[#22B573] hover:bg-[#1da467] text-white font-black uppercase tracking-[0.1em] shadow-xl shadow-green-600/20 transition-all hover:scale-[1.01] active:scale-[0.98] gap-3"
            >
              {createAssignmentMutation.isPending ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <>
                  <CheckCircle2 className="h-5 w-5" />
                  Confirm & Enqueue
                </>
              )}
            </Button>
            <Button
              variant="ghost"
              onClick={() => setAddAssignmentOpen(false)}
              className="h-12 w-full mt-3 rounded-2xl text-slate-400 font-bold hover:bg-slate-50 transition-all"
            >
              Cancel
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Timeline Dialog */}
      <Dialog open={viewSlotsOpen} onOpenChange={setViewSlotsOpen}>
        <DialogContent className="sm:max-w-4xl rounded-[32px] border-none shadow-2xl p-0 overflow-hidden">
          <div className="bg-slate-900 p-8 text-white relative">
            <div className="absolute top-0 right-0 p-8 opacity-10">
              <History className="h-24 w-24" />
            </div>
            <div className="relative z-10 space-y-1">
              <div className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-400 mb-1">Execution History</div>
              <DialogTitle className="text-2xl font-black tracking-tight">Assignment Timeline</DialogTitle>
              <p className="text-slate-400 text-xs font-medium">Real-time status of each scheduled slot for this assignment.</p>
            </div>
          </div>

          <div className="p-8 bg-white max-h-[60vh] overflow-y-auto">
            {slotsLoading ? (
              <div className="flex flex-col items-center justify-center py-20 gap-3">
                <Loader2 className="h-8 w-8 animate-spin text-slate-300" />
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Loading timeline data...</p>
              </div>
            ) : (!slotsData || slotsData.length === 0) ? (
              <div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-400">
                <Info className="h-12 w-12 opacity-10" />
                <p className="text-sm font-bold uppercase tracking-widest">No slots generated yet</p>
              </div>
            ) : (
              <div className="rounded-2xl border border-slate-100 overflow-hidden shadow-sm bg-white">
                <Table>
                  <TableHeader className="bg-slate-50/50">
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="text-[9px] font-black uppercase tracking-widest text-slate-400">Occ / Slot</TableHead>
                      <TableHead className="text-[9px] font-black uppercase tracking-widest text-slate-400">Scheduled At</TableHead>
                      <TableHead className="text-[9px] font-black uppercase tracking-widest text-slate-400">Status</TableHead>
                      <TableHead className="text-[9px] font-black uppercase tracking-widest text-slate-400">Execution Details / Error</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {slotsData.map((slot) => (
                      <TableRow key={slot._id} className="hover:bg-slate-50/30 border-slate-50 transition-colors">
                        <TableCell className="py-3 font-bold text-xs text-slate-900">
                          Day {slot.occurrenceIndex + 1} · <span className="text-slate-400">Slot {slot.timeSlotIndex + 1}</span>
                        </TableCell>
                        <TableCell className="py-3 text-[10px] font-bold text-slate-600">
                          {formatProgramDateTime(slot.scheduledAt)}
                        </TableCell>
                        <TableCell className="py-3">
                          {(() => {
                            const displayStatus = slot.wabaMessage?.status || slot.status;
                            let badgeStyle = 'bg-slate-100 text-slate-500 border-slate-200';
                            if (displayStatus === 'pending') badgeStyle = 'bg-yellow-50 text-yellow-600 border-yellow-100';
                            if (['sent', 'enqueued', 'delivered'].includes(displayStatus)) badgeStyle = 'bg-green-50 text-green-600 border-green-100';
                            if (displayStatus === 'read') badgeStyle = 'bg-blue-50 text-blue-600 border-blue-100 shadow-sm';
                            if (displayStatus === 'failed') badgeStyle = 'bg-red-50 text-red-600 border-red-100';

                            return (
                              <div className="flex flex-col gap-1">
                                <Badge className={`w-fit rounded-full px-2 py-0.5 text-[9px] font-black uppercase tracking-widest border shadow-none ${badgeStyle}`}>
                                  {displayStatus}
                                </Badge>
                                {slot.wabaMessage?.readAt ? (
                                  <span className="text-[9px] font-medium text-blue-500/70">
                                    Read at {formatProgramTime(slot.wabaMessage.readAt)}
                                  </span>
                                ) : slot.wabaMessage?.deliveredAt ? (
                                  <span className="text-[9px] font-medium text-green-500/70">
                                    Deliv. {formatProgramTime(slot.wabaMessage.deliveredAt)}
                                  </span>
                                ) : null}
                              </div>
                            );
                          })()}
                        </TableCell>
                        <TableCell className="py-3 text-[10px] font-medium text-slate-500 max-w-[200px]">
                          {slot.wabaMessage?.failureReason || slot.lastError ? (
                            <div className="flex items-start gap-1.5 text-red-500 bg-red-50/50 p-2 rounded-lg border border-red-100">
                              <AlertCircle className="h-3 w-3 shrink-0" />
                              <span className="line-clamp-2 leading-tight">{slot.wabaMessage?.failureReason || slot.lastError}</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1.5 opacity-40 italic">
                              <CheckCircle2 className="h-3 w-3" />
                              <span>No execution errors</span>
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>

          <div className="p-8 pt-0 bg-white">
            <Button variant="outline" onClick={() => setViewSlotsOpen(false)} className="h-12 w-full rounded-2xl border-slate-200 text-slate-600 font-bold transition-all hover:bg-slate-50">
              Close History
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmationDialog
        isOpen={missingVarsDialogOpen}
        onClose={() => {
          if (createAssignmentMutation.isPending) return;
          setMissingVarsDialogOpen(false);
        }}
        onConfirm={() => {
          if (!pendingAssignmentPayload) return;
          triggerCreateAssignment(pendingAssignmentPayload);
        }}
        title="Incomplete Variable Mapping"
        description={`You haven't provided values for: ${missingVars.join(', ')}. The system will use template fallbacks or empty strings where applicable. Do you wish to proceed?`}
        confirmText="Yes, Enqueue Anyway"
        cancelText="No, Go Back"
        variant="default"
        isLoading={createAssignmentMutation.isPending}
      />
    </>
  );
}
