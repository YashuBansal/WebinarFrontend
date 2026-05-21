/**
 * Types for WhatsApp Program and Program Assignment (aligned with backend whatsapp-program).
 */

export type IntervalUnit = 'day' | 'week';
export type ProgramMessageType = 'template' | 'session';
export type ProgramAssignmentStatus =
  | 'scheduled'
  | 'running'
  | 'paused'
  | 'completed'
  | 'cancelled';

export type ProgramSlotStatus = 'pending' | 'enqueued' | 'sent' | 'failed' | 'skipped';

export interface ProgramSlot {
  _id: string;
  programId: string;
  programAssignmentId: string;
  occurrenceIndex: number;
  timeSlotIndex: number;
  scheduledAt: string;
  status: ProgramSlotStatus;
  lastError?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ProgramVariableMapping {
  variable: string;
  isDynamic: boolean;
  contactField?: string;
  staticValue?: string;
  fallbackValue?: string;
}

export interface ProgramMessageConfig {
  messageType: ProgramMessageType;
  templateName: string;
  language?: string;
  variableMappings?: ProgramVariableMapping[];
  headerMediaAssetId?: string;
}

export interface ProgramTimeSlot {
  time: string; // HH:mm
  timezone: string; // IANA e.g. Asia/Kolkata
  messageConfig: ProgramMessageConfig;
}

/** Returns a new default time slot (no shared refs). Use for initial state and when adding a slot. */
export function getDefaultProgramTimeSlot(): ProgramTimeSlot {
  return {
    time: '09:00',
    timezone: 'Asia/Kolkata',
    messageConfig: {
      messageType: 'template',
      templateName: '',
      language: 'en_US',
      variableMappings: [],
    },
  };
}

export interface Program {
  _id: string;
  name: string;
  adminId: string;
  projectId: string;
  occurrenceCount: number;
  intervalValue: number;
  intervalUnit: IntervalUnit;
  /** When intervalUnit is 'week', optional weekdays 1-7 (1=Mon .. 7=Sun). Total occurrences = occurrenceCount * (weekdays?.length ?? 1). */
  weekdays?: number[];
  /** occurrenceTimeSlots[i] = time slots for occurrence i+1 */
  occurrenceTimeSlots: ProgramTimeSlot[][];
  isActive: boolean;
  isAutoAssignable?: boolean;
  autoAssignCriteria?: any;
  isDeleted?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

const WEEKDAY_NAMES: Record<number, string> = {
  1: 'Monday',
  2: 'Tuesday',
  3: 'Wednesday',
  4: 'Thursday',
  5: 'Friday',
  6: 'Saturday',
  7: 'Sunday',
};

/** Total occurrence slots: day => occurrenceCount; week => occurrenceCount * (weekdays.length or 1). */
export function getTotalOccurrenceCount(program: {
  occurrenceCount: number;
  intervalUnit: IntervalUnit;
  weekdays?: number[];
}): number {
  if (program.intervalUnit === 'week' && program.weekdays?.length) {
    return program.occurrenceCount * program.weekdays.length;
  }
  return program.occurrenceCount;
}

/** Label for occurrence at 0-based index: "Day 1", "Monday 1", "Wednesday 2", etc. */
export function getOccurrenceLabel(
  intervalUnit: IntervalUnit,
  intervalValue: number,
  weekdays: number[] | undefined,
  occIndex: number,
): string {
  if (intervalUnit === 'day') {
    return `Day ${occIndex + 1}`;
  }
  const days = weekdays?.length ? weekdays : [intervalValue];
  const weekNum = Math.floor(occIndex / days.length) + 1;
  const weekday = days[occIndex % days.length];
  const name = WEEKDAY_NAMES[weekday] ?? 'Day';
  return `${name} ${weekNum}`;
}

export interface ProgramAssignmentStats {
  totalSlots: number;
  completedSlots: number;
  pendingSlots: number;
  failedSlots: number;
  nextSlotDate: string | null;
  currentOccurrence: number;
}

export interface ProgramAssignment {
  _id: string;
  programId: string | { _id: string; name?: string; occurrenceCount?: number; intervalValue?: number; intervalUnit?: string; weekdays?: number[] };
  phone: string;
  adminId: string;
  projectId: string;
  startAt: string;
  timezone: string;
  status: ProgramAssignmentStatus;
  dynamicVariables: Record<string, string>;
  currentOccurrence: number;
  source: 'manual' | 'auto';
  lastProcessedAt?: string;
  pausedAt?: string;
  completedAt?: string;
  failureCount: number;
  createdAt?: string;
  updatedAt?: string;
  stats?: ProgramAssignmentStats;
}

/** Create program payload */
export interface CreateProgramDto {
  name: string;
  projectId: string;
  occurrenceCount: number;
  intervalValue: number;
  intervalUnit: IntervalUnit;
  /** When intervalUnit is 'week', optional weekdays 1-7. Total = occurrenceCount * weekdays.length */
  weekdays?: number[];
  occurrenceTimeSlots: ProgramTimeSlot[][];
  isActive?: boolean;
  isAutoAssignable?: boolean;
  autoAssignCriteria?: any;
}

/** Update program payload (all fields optional) */
export type UpdateProgramDto = Partial<CreateProgramDto>;

/** Create assignment payload */
export interface CreateProgramAssignmentDto {
  programId: string;
  phone: string;
  projectId: string;
  startAt: string; // ISO date string
  timezone: string;
  dynamicVariables?: Record<string, string>;
  source?: 'manual' | 'auto';
}

/** Programs list response */
export interface ProgramsListResponse {
  programs: Program[];
  total: number;
  page: number;
  limit: number;
}

/** Assignments list response */
export interface ProgramAssignmentsListResponse {
  assignments: ProgramAssignment[];
  total: number;
  page: number;
  limit: number;
}
