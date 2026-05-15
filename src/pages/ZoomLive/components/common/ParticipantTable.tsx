import React, { useState, useEffect } from 'react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@zoom/components/ui/table'
import { Badge } from '@zoom/components/ui/badge'
import { Button } from '@zoom/components/ui/button'
import { ExternalLink } from 'lucide-react'
import type { Participant } from '@zoom/types/zoomParticipants'

interface ParticipantTableProps {
  participants: Participant[]
  showJoinTime?: boolean
  showLeaveTime?: boolean
  showOnlineDuration?: boolean
  emptyMessage: string
}

export default function ParticipantTable({ participants, showJoinTime = false, showLeaveTime = false, showOnlineDuration = false, emptyMessage }: ParticipantTableProps) {
  if (participants?.length === 0) {
    return <div className="text-sm text-muted-foreground">{emptyMessage}</div>
  }

  const dashboardBaseUrl = import.meta.env.VITE_REACT_APP_DASHBOARD_BASE_URL || 'https://dashboard.ajaybansal.com'

  const formatDateTime = (dateString?: string) => {
    if (!dateString) return '—'
    try {
      return new Date(dateString).toLocaleString()
    } catch {
      return '—'
    }
  }

  const getContactUrl = (email: string) => {
    if (!email) return '#'
    return `${dashboardBaseUrl}/particularContact?email=${encodeURIComponent(email)}`
  }

  // Helper to format duration in seconds to readable format (e.g., "12m 30s", "1h 5m")
  const formatDuration = (seconds?: number): string => {
    if (seconds === undefined || seconds === null || seconds < 0) {
      return '—'
    }

    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60

    const parts: string[] = []
    if (hours > 0) {
      parts.push(`${hours}h`)
    }
    if (minutes > 0) {
      parts.push(`${minutes}m`)
    }
    if (secs > 0 && hours === 0) {
      // Only show seconds if less than an hour
      parts.push(`${secs}s`)
    }

    return parts?.length > 0 ? parts.join(' ') : '0s'
  }

  // State for real-time updates (triggers re-render every second for online participants)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [, setTick] = useState(0)

  // Update time every second for real-time duration display (only needed for online participants)
  // Check if any participant is online (has lastJoinAt but no lastLeftAt)
  const hasOnlineParticipants = participants.some(
    (p) => p.lastJoinAt && !p.lastLeftAt
  )

  useEffect(() => {
    if (!showOnlineDuration || !hasOnlineParticipants) return

    const interval = setInterval(() => {
      setTick((prev) => prev + 1)
    }, 1000)

    return () => clearInterval(interval)
  }, [showOnlineDuration, hasOnlineParticipants])

  // Calculate real-time duration for online participants
  const calculateOnlineDuration = (lastJoinAt?: string): number | undefined => {
    if (!lastJoinAt) return undefined
    try {
      const joinTime = new Date(lastJoinAt).getTime()
      const now = Date.now()
      const durationMs = now - joinTime
      if (durationMs > 0) {
        return Math.floor(durationMs / 1000) // Convert to seconds
      }
    } catch {
      return undefined
    }
    return undefined
  }

  // Helper to truncate long strings
  const truncateString = (str: string, maxLength: number = 20): string => {
    if (str?.length <= maxLength) return str
    return str?.slice(0, maxLength) + '...'
  }

  // Helper to format array values with tooltip
  const renderArrayWithTooltip = (
    values: string[] | undefined,
    renderItem: (value: string, index: number, fullValue: string) => React.ReactNode,
    maxVisible: number = 2,
    maxStringLength: number = 20
  ) => {
    if (!values || values?.length === 0) {
      return <span className="text-muted-foreground text-xs">-</span>
    }

    const tooltipText = values?.join(', ')

    if (values?.length === 1) {
      const value = values[0]
      const truncated = truncateString(value, maxStringLength)
      return (
        <div 
          className="flex items-center gap-1 whitespace-nowrap overflow-hidden" 
          title={value?.length > maxStringLength ? value : undefined}
        >
          {renderItem(truncated, 0, value)}
        </div>
      )
    }

    const visible = values?.slice(0, maxVisible)
    const remaining = values?.length - maxVisible

    return (
      <div 
        className="flex items-center gap-1 whitespace-nowrap overflow-hidden cursor-help" 
        title={tooltipText}
      >
        {visible.map((value, i) => {
          const truncated = truncateString(value, maxStringLength)
          return (
            <React.Fragment key={i}>
              {renderItem(truncated, i, value)}
            </React.Fragment>
          )
        })}
        {remaining > 0 && (
          <span className="text-xs text-muted-foreground shrink-0" title={tooltipText}>
            +{remaining}
          </span>
        )}
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Email</TableHead>
          {showJoinTime && <TableHead>Join Time</TableHead>}
          {showLeaveTime && <TableHead>Leave Time</TableHead>}
          {showOnlineDuration && <TableHead>Online Duration</TableHead>}
          <TableHead>Attendee Names</TableHead>
          <TableHead>Attendee Phones</TableHead>
          <TableHead>Tags</TableHead>
          <TableHead>Locations</TableHead>
          <TableHead>Sources</TableHead>
          <TableHead>Attended Count</TableHead>
          <TableHead>Registered Count</TableHead>
          <TableHead className="sticky right-0 text-right bg-background z-10">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {participants.map((participant, idx) => {
          const name = participant.participantName || participant.participantEmail || participant.participantUserId || participant.participantId || 'Unknown'
          const email = participant.participantEmail || ''
          const attendeeData = participant.attendeeData
          
          return (
            <TableRow key={idx}>
              <TableCell className="font-medium">{name}</TableCell>
              <TableCell>{email || '—'}</TableCell>
              {showJoinTime && <TableCell>{formatDateTime(participant.lastJoinAt)}</TableCell>}
              {showLeaveTime && <TableCell>{formatDateTime(participant.lastLeftAt)}</TableCell>}
              {showOnlineDuration && (
                <TableCell>
                  <span className="text-sm font-medium">
                    {formatDuration(
                      // For online participants: calculate real-time from lastJoinAt
                      // For left participants: use backend-calculated total duration
                      participant.lastLeftAt
                        ? participant.onlineDuration // Left participant: use aggregated total from backend
                        : participant.lastJoinAt
                        ? calculateOnlineDuration(participant.lastJoinAt) // Online participant: real-time calculation
                        : participant.onlineDuration // Fallback to backend value
                    )}
                  </span>
                </TableCell>
              )}
              <TableCell>
                {renderArrayWithTooltip(
                  attendeeData?.fullNames,
                  (name, i, fullName) => (
                    <span 
                      key={i} 
                      className="text-xs"
                      title={fullName?.length > 20 ? fullName : undefined}
                    >
                      {name}
                    </span>
                  )
                )}
              </TableCell>
              <TableCell>
                {renderArrayWithTooltip(
                  attendeeData?.phones,
                  (phone, i, fullPhone) => (
                    <span 
                      key={i} 
                      className="text-xs"
                      title={fullPhone?.length > 20 ? fullPhone : undefined}
                    >
                      {phone}
                    </span>
                  )
                )}
              </TableCell>
              <TableCell>
                {renderArrayWithTooltip(
                  attendeeData?.tags,
                  (tag, i, fullTag) => (
                    <Badge 
                      key={i} 
                      variant="secondary" 
                      className="text-xs"
                      title={fullTag?.length > 20 ? fullTag : undefined}
                    >
                      {tag}
                    </Badge>
                  )
                )}
              </TableCell>
              <TableCell>
                {renderArrayWithTooltip(
                  attendeeData?.locations,
                  (loc, i, fullLoc) => (
                    <Badge 
                      key={i} 
                      variant="outline" 
                      className="text-xs"
                      title={fullLoc?.length > 20 ? fullLoc : undefined}
                    >
                      {loc}
                    </Badge>
                  )
                )}
              </TableCell>
              <TableCell>
                {renderArrayWithTooltip(
                  attendeeData?.sources,
                  (src, i, fullSrc) => (
                    <Badge 
                      key={i} 
                      variant="outline" 
                      className="text-xs"
                      title={fullSrc?.length > 20 ? fullSrc : undefined}
                    >
                      {src}
                    </Badge>
                  )
                )}
              </TableCell>
              <TableCell>
                {attendeeData?.attendedWebinarCount !== undefined ? (
                  <span className="text-sm font-medium">{attendeeData.attendedWebinarCount}</span>
                ) : (
                  <span className="text-muted-foreground text-xs">-</span>
                )}
              </TableCell>
              <TableCell>
                {attendeeData?.registeredWebinarCount !== undefined ? (
                  <span className="text-sm font-medium">{attendeeData.registeredWebinarCount}</span>
                ) : (
                  <span className="text-muted-foreground text-xs">-</span>
                )}
              </TableCell>
              <TableCell className="sticky right-0 text-right bg-background z-10">
                {email ? (
                  <div className="flex justify-end">
                    <Button
                      variant="outline"
                      size="sm"
                      asChild
                    >
                      <a
                        href={getContactUrl(email)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center"
                        aria-label="View Contact"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    </Button>
                  </div>
                ) : (
                  <span className="text-muted-foreground text-xs">—</span>
                )}
              </TableCell>
            </TableRow>
          )
        })}
        </TableBody>
      </Table>
    </div>
  )
}
