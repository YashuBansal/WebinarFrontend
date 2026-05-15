import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@zoom/components/ui/card'
import { Calendar, Clock, Users } from 'lucide-react'
import MeetingStatusBadge from './MeetingStatusBadge'

interface MeetingHeaderProps {
  details: {
    topic?: string
    id: string
    start_time?: string
    duration?: number
    join_url?: string
  }
  meetingState: string
  isStatusLoading: boolean
  statusError: any
}

export default function MeetingHeader({ details, meetingState, isStatusLoading, statusError }: MeetingHeaderProps) {
  const start = details.start_time ? new Date(details.start_time) : null

  return (
    <Card>
      <CardHeader>
        <CardTitle>{details.topic || 'Untitled'}</CardTitle>
        <CardDescription>Meeting ID: {details.id}</CardDescription>
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
        <div className="flex items-center gap-2">
          <MeetingStatusBadge 
            meetingState={meetingState}
            isStatusLoading={isStatusLoading}
            statusError={statusError}
          />
        </div>
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
