import React, { useState, useEffect } from 'react';
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
  Clock
} from 'lucide-react';
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
  scheduled: 'bg-blue-500',
  running: 'bg-green-500',
  paused: 'bg-yellow-500',
  completed: 'bg-gray-500',
  cancelled: 'bg-red-500',
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

  // Calculate missed slots for Day 1
  const missedSlotsCount = React.useMemo(() => {
    if (!startAtDate || !startAtTime || !program.occurrenceTimeSlots?.[0]) return 0;
    const startDateObj = new Date(`${startAtDate}T${startAtTime}`);
    if (isNaN(startDateObj.getTime())) return 0;

    let missed = 0;
    const firstDaySlots = program.occurrenceTimeSlots[0];
    
    // Check if the selected date is today
    const isToday = startAtDate === today;

    firstDaySlots.forEach((slot) => {
       // A slot is missed if we are scheduling for today and the slot time has already passed
       // OR if we compare the combined start time directly. 
       // The backend uses getScheduledAtUTC base logic, but for the UI a simple local time string comparison 
       // works because `slot.time` is relative to the user's `timezone` input day layout.
       const slotTimeString = slot.time;
       if (isToday) {
         // If startdate is today, and the slot time is < the time right now OR < selected start time
         const nowTime = new Date().toTimeString().slice(0, 5);
         if (slotTimeString < startAtTime || slotTimeString < nowTime) {
            missed++;
         }
       } else {
         // If startdate is in the future, it's only missed if the slot time < selected start time 
         // (meaning they explicitly chose a start time later in the day than the slots happen)
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

  // Auto-refresh every 30 seconds
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
    }, 30000); // 30 seconds

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
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold">Assignments</h2>
            {lastRefreshTime && (
              <span className="text-xs text-muted-foreground ml-2">
                Last updated: {formatProgramTime(lastRefreshTime)}
              </span>
            )}
          </div>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            {autoRefreshEnabled && (
              <div className="flex items-center gap-2 text-sm text-green-600">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="hidden sm:inline">Auto-refresh active</span>
              </div>
            )}
            
            <div className="flex items-center gap-2">
              <Button 
                onClick={handleRefresh} 
                variant="outline" 
                size="sm"
                disabled={isRefreshing}
                className="flex items-center gap-2"
              >
                <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">{isRefreshing ? 'Refreshing...' : 'Refresh'}</span>
              </Button>
              
              <Button 
                onClick={() => setAutoRefreshEnabled(!autoRefreshEnabled)}
                variant={autoRefreshEnabled ? "default" : "outline"}
                size="sm"
                className="flex items-center gap-2 w-32"
              >
                <Clock className="h-4 w-4" />
                <span className="hidden sm:inline">{autoRefreshEnabled ? 'Disable Auto' : 'Enable Auto'}</span>
              </Button>

              <Button onClick={() => setAddAssignmentOpen(true)} size="sm">
                <Plus className="h-4 w-4 mr-1" />
                Add assignment
              </Button>
            </div>
          </div>
        </div>

        {assignmentsLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : assignments.length === 0 ? (
          <div className="border rounded-lg py-8 text-center text-muted-foreground">
            No assignments yet. Add one to start sending messages for this program.
          </div>
        ) : (
          <div className="border rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium uppercase">
                    Phone
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium uppercase">
                    Status
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium uppercase">
                    Source
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium uppercase">
                    Start at
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium uppercase">
                    Progress
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium uppercase">
                    Next Message
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium uppercase">
                    Failures
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {assignments.map((a) => (
                  <tr key={a._id} className="hover:bg-muted/30">
                    <td className="px-4 py-2 text-sm font-medium">{a.phone}</td>
                    <td className="px-4 py-2">
                      <Badge
                        className={
                          ASSIGNMENT_STATUS_COLORS[a.status] ?? 'bg-gray-500'
                        }
                      >
                        {a.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-2">
                       <Badge variant="outline" className={a.source === 'auto' ? 'text-blue-600 border-blue-600' : 'text-gray-600 border-gray-600'}>
                         {a.source === 'auto' ? 'Auto' : 'Manual'}
                       </Badge>
                    </td>
                    <td className="px-4 py-2 text-sm text-muted-foreground">
                      {formatProgramDateTime(a.startAt)}
                    </td>
                    <td className="px-4 py-2 text-sm">
                      {a.stats ? (
                        <>
                          <div>
                            {a.stats.completedSlots} / {a.stats.totalSlots} slots
                          </div>
                          <div className="text-muted-foreground text-xs">
                            Occ {a.stats.currentOccurrence} / {getTotalOccurrenceCount(program)}
                          </div>
                        </>
                      ) : (
                        `${a.currentOccurrence} / ${getTotalOccurrenceCount(program)}`
                      )}
                    </td>
                    <td className="px-4 py-2 text-sm text-muted-foreground">
                      {a.stats?.nextSlotDate
                        ? formatProgramDateTime(a.stats.nextSlotDate)
                        : '-'}
                    </td>
                    <td className="px-4 py-2 text-sm">
                      {a.stats ? a.stats.failedSlots + (a.failureCount || 0) : (a.failureCount ?? 0)}
                    </td>
                    <td className="px-4 py-2">
                      <div className="flex items-center gap-1">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedAssignmentId(a._id);
                            setViewSlotsOpen(true);
                          }}
                        >
                          <Eye className="h-3 w-3" />
                        </Button>
                        {(a.status === 'running' || a.status === 'scheduled') && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => pauseMutation.mutate(a._id)}
                            disabled={pauseMutation.isPending}
                          >
                            <Pause className="h-3 w-3" />
                          </Button>
                        )}
                        {a.status === 'paused' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => resumeMutation.mutate(a._id)}
                            disabled={resumeMutation.isPending}
                          >
                            <Play className="h-3 w-3" />
                          </Button>
                        )}
                        {(a.status === 'scheduled' ||
                          a.status === 'running' ||
                          a.status === 'paused') && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => cancelMutation.mutate(a._id)}
                            disabled={cancelMutation.isPending}
                          >
                            <XCircle className="h-3 w-3 text-destructive" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Dialog open={addAssignmentOpen} onOpenChange={setAddAssignmentOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add assignment</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="phone">Phone number</Label>
              <Input
                id="phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="919876543210"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="startAtDate">Start date</Label>
                <Input
                  id="startAtDate"
                  type="date"
                  value={startAtDate}
                  onChange={(e) => setStartAtDate(e.target.value)}
                  min={today}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="startAtTime">Start time</Label>
                <Input
                  id="startAtTime"
                  type="time"
                  value={startAtTime}
                  onChange={(e) => setStartAtTime(e.target.value)}
                  min={startAtDate === today ? new Date().toTimeString().slice(0, 5) : undefined}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="timezone">Timezone</Label>
              <Input
                id="timezone"
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                placeholder="Asia/Kolkata"
              />
            </div>
            
            {missedSlotsCount > 0 && (
              <div className="flex items-start gap-2 rounded-md bg-yellow-500/15 border border-yellow-500/20 p-3 text-yellow-600 dark:text-yellow-500">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                <div className="text-sm">
                  <strong>Warning:</strong> Based on your selected start time, {missedSlotsCount} out of {program.occurrenceTimeSlots?.[0]?.length || 0} slots for Day 1 will be permanently skipped because their configured time is earlier than the start time.
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label>
                Dynamic variables (optional)
              </Label>
              {requiredVariables.length > 0 ? (
                <div className="space-y-3">
                  {requiredVariables.map((key) => (
                    <div key={key} className="flex items-center gap-2">
                      <Label htmlFor={`dynamic-${key}`} className="text-xs font-medium w-30">
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
                        placeholder={`Value for ${key} (optional)`}
                      />
                    </div>
                  ))}
                  <p className="text-xs text-muted-foreground">
                    You don&apos;t have to provide values for all variables. If you skip a value,
                    the template&apos;s default/fallback will be used where configured.
                  </p>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">
                  This sequence does not define any dynamic template variables.
                </p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setAddAssignmentOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddAssignment}
              disabled={
                !phone.trim() ||
                !startAtDate ||
                createAssignmentMutation.isPending
              }
            >
              {createAssignmentMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                'Add'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={viewSlotsOpen} onOpenChange={setViewSlotsOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Assignment Slots</DialogTitle>
          </DialogHeader>
          <div className="py-2">
            {slotsLoading ? (
              <div className="flex justify-center p-4">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : (!slotsData || slotsData.length === 0) ? (
              <div className="text-center text-muted-foreground p-4">
                No slots found for this assignment.
              </div>
            ) : (
              <div className="border rounded-md overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="px-3 py-2 text-left font-medium">Occurrence</th>
                      <th className="px-3 py-2 text-left font-medium">Slot</th>
                      <th className="px-3 py-2 text-left font-medium">Scheduled At</th>
                      <th className="px-3 py-2 text-left font-medium">Status</th>
                      <th className="px-3 py-2 text-left font-medium">Error</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {slotsData.map((slot) => (
                      <tr key={slot._id} className="hover:bg-muted/20">
                        <td className="px-3 py-2">{slot.occurrenceIndex}</td>
                        <td className="px-3 py-2">{slot.timeSlotIndex + 1}</td>
                        <td className="px-3 py-2">
                          {formatProgramDateTime(slot.scheduledAt)}
                        </td>
                        <td className="px-3 py-2">
                          {(() => {
                            const displayStatus = slot.wabaMessage?.status || slot.status;
                            let colorClass = 'text-gray-500 border-gray-500';
                            if (displayStatus === 'pending') colorClass = 'text-yellow-600 border-yellow-600';
                            if (['sent', 'enqueued', 'delivered'].includes(displayStatus)) colorClass = 'text-green-600 border-green-600';
                            if (displayStatus === 'read') colorClass = 'text-blue-600 border-blue-600';
                            if (displayStatus === 'failed') colorClass = 'text-red-600 border-red-600';
                            return (
                              <div className="flex flex-col gap-1">
                                <Badge variant="outline" className={`w-fit ${colorClass}`}>
                                  {displayStatus}
                                </Badge>
                                {slot.wabaMessage?.readAt ? (
                                  <span className="text-[10px] text-muted-foreground">
                                    Read: {formatProgramTime(slot.wabaMessage.readAt)}
                                  </span>
                                ) : slot.wabaMessage?.deliveredAt ? (
                                  <span className="text-[10px] text-muted-foreground">
                                    Delivered: {formatProgramTime(slot.wabaMessage.deliveredAt)}
                                  </span>
                                ) : null}
                              </div>
                            );
                          })()}
                        </td>
                        <td className="px-3 py-2 text-xs text-destructive max-w-[150px] truncate" title={slot.wabaMessage?.failureReason || slot.lastError || ''}>
                          {slot.wabaMessage?.failureReason || slot.lastError || '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewSlotsOpen(false)}>
              Close
            </Button>
          </DialogFooter>
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
        title="Proceed without some variables?"
        description={`No value was provided for: ${missingVars.join(
          ', ',
        )}. The template's default/fallback values will be used where configured. Do you want to continue?`}
        confirmText="Continue"
        cancelText="Go back"
        variant="default"
        isLoading={createAssignmentMutation.isPending}
      />
    </>
  );
}

