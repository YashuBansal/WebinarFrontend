import { useState } from 'react'
import { Alert, AlertDescription } from '@zoom/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@zoom/components/ui/tabs'
import { Button } from '@zoom/components/ui/button'
import { FileSpreadsheet } from 'lucide-react'
import ParticipantTable from './ParticipantTable'
import { useMeetingStatus } from '@zoom/hooks/useZoom'
import type { Participant } from '@zoom/types/zoomParticipants'
import * as XLSX from 'xlsx'

interface LiveDataTabProps {
  meetingId?: string
  zoomProjectId?: string
  occurrenceId?: string
  isWebinar: boolean
}

export default function LiveDataTab({ meetingId, zoomProjectId, occurrenceId, isWebinar }: LiveDataTabProps) {
  const [selectedTab, setSelectedTab] = useState<string>('online')

  const {
    data,
    isLoading,
    error,
  } = useMeetingStatus({
    meetingId,
    isWebinar,
    zoomProjectId,
    occurrenceId,
  });

  const formatDateTime = (dateString?: string): string => {
    if (!dateString) return '—'
    try {
      return new Date(dateString).toLocaleString()
    } catch {
      return '—'
    }
  }

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
      parts.push(`${secs}s`)
    }

    return parts.length > 0 ? parts.join(' ') : '0s'
  }

  const calculateOnlineDuration = (lastJoinAt?: string): number | undefined => {
    if (!lastJoinAt) return undefined
    try {
      const joinTime = new Date(lastJoinAt).getTime()
      const now = Date.now()
      const durationMs = now - joinTime
      if (durationMs > 0) {
        return Math.floor(durationMs / 1000)
      }
    } catch {
      return undefined
    }
    return undefined
  }

  const handleExportToExcel = () => {
    if (!data) return

    let participantsToExport: Participant[] = []
    let sheetName = 'Participants'
    let tabLabel = ''

    switch (selectedTab) {
      case 'online':
        participantsToExport = data.participants.online
        sheetName = 'Online Participants'
        tabLabel = 'online'
        break
      case 'left':
        participantsToExport = data.participants.left
        sheetName = 'Joined but Left Participants'
        tabLabel = 'left'
        break
      case 'not-joined':
        participantsToExport = data.participants.notJoined
        sheetName = 'Not Joined Participants'
        tabLabel = 'not-joined'
        break
      default:
        return
    }

    if (participantsToExport.length === 0) {
      return
    }

    // Find the maximum number of phone numbers across all participants
    const maxPhoneCount = Math.max(
      ...participantsToExport.map((p) => p.attendeeData?.phones?.length || 0),
      1 // At least 1 column even if no phones
    )

    const exportData = participantsToExport.map((participant) => {
      const name = participant.participantName || participant.participantEmail || participant.participantUserId || participant.participantId || 'Unknown'
      const email = participant.participantEmail || ''
      const attendeeData = participant.attendeeData

      // Determine duration based on participant status
      let duration: number | undefined
      if (selectedTab === 'online' && participant.lastJoinAt) {
        duration = calculateOnlineDuration(participant.lastJoinAt)
      } else if (selectedTab === 'left') {
        duration = participant.onlineDuration
      } else if (selectedTab === 'not-joined') {
        duration = undefined
      } else {
        duration = participant.onlineDuration
      }

      // Build base row data
      const rowData: Record<string, any> = {
        'Name': name,
        'Email': email,
        'Join Time': selectedTab === 'not-joined' ? '—' : formatDateTime(participant.lastJoinAt),
        'Leave Time': selectedTab === 'left' ? formatDateTime(participant.lastLeftAt) : '—',
        'Online Duration': duration !== undefined ? formatDuration(duration) : '—',
        'Attendee Names': attendeeData?.fullNames?.join(', ') || '—',
        'Tags': attendeeData?.tags?.join(', ') || '—',
        'Locations': attendeeData?.locations?.join(', ') || '—',
        'Sources': attendeeData?.sources?.join(', ') || '—',
        'Attended Count': attendeeData?.attendedWebinarCount ?? '—',
        'Registered Count': attendeeData?.registeredWebinarCount ?? '—',
      }

      // Add phone numbers as separate columns
      const phones = attendeeData?.phones || []
      for (let i = 0; i < maxPhoneCount; i++) {
        rowData[`Phone ${i + 1}`] = phones[i] || '—'
      }

      return rowData
    })

    const worksheet = XLSX.utils.json_to_sheet(exportData)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName)

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5)
    const filename = `participants-${tabLabel}-${timestamp}.xlsx`

    XLSX.writeFile(workbook, filename)
  }



  if (isLoading) {
    return <div className="animate-pulse h-24 bg-gray-100 rounded" />
  }

  if (error) {
    return (
      <Alert>
        <AlertDescription>Failed to load live data.</AlertDescription>
      </Alert>
    )
  }

  if (!data) {
    return <div className="text-sm text-muted-foreground">No status available.</div>
  }

  return (
    <div className="space-y-4">
      {/* Summary Stats */}
      <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
        <div>Online: <span className="font-medium text-gray-900">{data.counts.online}</span></div>
        <div>Joined but left: <span className="font-medium text-gray-900">{data.counts.joinedButLeft}</span></div>
        <div>Total unique: <span className="font-medium text-gray-900">{data.counts.totalUniqueParticipants}</span></div>
        <div>Not joined yet: <span className="font-medium text-gray-900">{data.counts.totalNotJoined}</span></div>
        <div>Total registrations: <span className="font-medium text-gray-900">{data.counts.totalRegistrations}</span></div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleExportToExcel}
          className="ml-auto flex items-center gap-2"
          disabled={!data || (
            selectedTab === 'online' && data.participants.online.length === 0 ||
            selectedTab === 'left' && data.participants.left.length === 0 ||
            selectedTab === 'not-joined' && data.participants.notJoined.length === 0
          )}
        >
          <FileSpreadsheet className="h-4 w-4" />
          Export Excel
        </Button>
      </div>

      {/* Sub-tabs for different participant categories */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList>
          <TabsTrigger value="online">Online ({data.counts.online})</TabsTrigger>
          <TabsTrigger value="left">Joined but Left ({data.counts.joinedButLeft})</TabsTrigger>
          <TabsTrigger value="not-joined">Not Joined ({data.counts.totalNotJoined})</TabsTrigger>
        </TabsList>
        
        <TabsContent value="online" className="mt-4">
          <ParticipantTable 
            participants={data.participants.online}
            showJoinTime={true}
            showOnlineDuration={true}
            emptyMessage="No one online."
          />
        </TabsContent>
        
        <TabsContent value="left" className="mt-4">
          <ParticipantTable 
            participants={data.participants.left}
            showJoinTime={true} 
            showLeaveTime={true}
            showOnlineDuration={true}
            emptyMessage="No participants have left yet."
          />
        </TabsContent>
        
        <TabsContent value="not-joined" className="mt-4">
          <ParticipantTable 
            participants={data.participants.notJoined}
            emptyMessage="Everyone has joined."
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
