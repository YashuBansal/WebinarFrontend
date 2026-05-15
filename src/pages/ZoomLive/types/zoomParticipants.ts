export interface AttendeeData {
  fullNames?: string[];
  phones?: string[];
  tags?: string[];
  locations?: string[];
  sources?: string[];
  timeInSession?: number;
  attendedWebinarCount?: number;
  registeredWebinarCount?: number;
}

export interface Participant {
  participantId?: string;
  participantUserId?: string;
  participantEmail?: string;
  participantName?: string;
  lastJoinAt?: string;
  lastLeftAt?: string;
  onlineDuration?: number; // Duration in seconds
  attendeeData?: AttendeeData | null;
}

