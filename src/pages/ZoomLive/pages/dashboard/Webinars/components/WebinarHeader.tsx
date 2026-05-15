import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@zoom/components/ui/card'
import { Badge } from '@zoom/components/ui/badge'
import { Calendar, Clock, Users } from 'lucide-react'
import MeetingStatusBadge from '../../Meetings/components/MeetingStatusBadge'

interface WebinarHeaderProps {
  details: {
    topic?: string
    id: string
    startTime?: string
    duration?: number
    status?: string
    join_url?: string
  }
  statusData?: {
    meetingStartedAt: string | null
    meetingEndedAt: string | null
  } | null
  isStatusLoading?: boolean
  statusError?: any
}

export default function WebinarHeader({ details, statusData, isStatusLoading, statusError }: WebinarHeaderProps) {
  const start = details.startTime ? new Date(details.startTime) : null
  const status = (details.status || '').toLowerCase()

  const statusVariant: 'default' | 'secondary' | 'outline' =
    status === 'scheduled' ? 'default' : status === 'in-progress' ? 'secondary' : 'outline'

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-3">
          <span>{details.topic || 'Untitled'}</span>
          {status && <Badge variant={statusVariant}>{details.status}</Badge>}
        </CardTitle>
        <CardDescription>Webinar ID: {details.id}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4" />
          {start ? start.toLocaleString() : '—'}
        </div>
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4" />
          Duration: {details.duration ?? 0} min
        </div>
        {(statusData !== undefined || isStatusLoading !== undefined) && (
          <div className="flex items-center gap-2">
            <MeetingStatusBadge 
              meetingState={details.status || ''}
              isStatusLoading={isStatusLoading || false}
              statusError={statusError}
            />
          </div>
        )}
        {details.join_url && (
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            <a className="text-blue-600" href={details.join_url} target="_blank" rel="noopener noreferrer">
              Join URL
            </a>
          </div>
        )}
      </CardContent>
    </Card>
  )
}


