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
    if (hours > 0) parts.push(`${hours}h`)
    if (minutes > 0) parts.push(`${minutes}m`)
    if (secs > 0 && hours === 0) parts.push(`${secs}s`)

    return parts.length > 0 ? parts.join(' ') : '0s'
  }

  const calculateOnlineDuration = (lastJoinAt?: string): number | undefined => {
    if (!lastJoinAt) return undefined
    try {
      const joinTime = new Date(lastJoinAt).getTime()
      const durationMs = Date.now() - joinTime
      if (durationMs > 0) return Math.floor(durationMs / 1000)
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

    if (participantsToExport.length === 0) return

    const maxPhoneCount = Math.max(
      ...participantsToExport.map((p) => p.attendeeData?.phones?.length || 0),
      1
    )

    const exportData = participantsToExport.map((participant) => {
      const name = participant.participantName || participant.participantEmail || participant.participantUserId || participant.participantId || 'Unknown'
      const email = participant.participantEmail || ''
      const attendeeData = participant.attendeeData

      let duration: number | undefined
      if (selectedTab === 'online' && participant.lastJoinAt) {
        duration = calculateOnlineDuration(participant.lastJoinAt)
      } else if (selectedTab === 'left') {
        duration = participant.onlineDuration
      } else {
        duration = participant.onlineDuration
      }

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
    XLSX.writeFile(workbook, `participants-${tabLabel}-${timestamp}.xlsx`)
  }

  if (isLoading) {
    return (
      <div className="p-8 space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-20 bg-slate-100 dark:bg-slate-800/50 rounded-2xl animate-pulse" />
          ))}
        </div>
        <div className="h-64 bg-slate-100 dark:bg-slate-800/50 rounded-[32px] animate-pulse" />
      </div>
    )
  }

  if (error) {
    return (
      <Alert className="bg-red-50 dark:bg-red-900/20 border-red-100 dark:border-red-900/30 rounded-2xl">
        <AlertDescription className="text-red-600 dark:text-red-400 font-bold">
          Failed to load live status data. Please try again.
        </AlertDescription>
      </Alert>
    )
  }

  if (!data) return null

  return (
    <div className="space-y-8">
      {/* Premium Summary Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          { label: 'Online Now', value: data.counts.online, color: 'emerald' },
          { label: 'Left Session', value: data.counts.joinedButLeft, color: 'blue' },
          { label: 'Unique Joined', value: data.counts.totalUniqueParticipants, color: 'indigo' },
          { label: 'Not Joined', value: data.counts.totalNotJoined, color: 'amber' },
          { label: 'Registrations', value: data.counts.totalRegistrations, color: 'slate' },
        ].map((stat, i) => (
          <div key={i} className="bg-white dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/50 rounded-2xl p-4 shadow-sm group hover:scale-[1.02] transition-all">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">{stat.label}</p>
            <p className={`text-2xl font-black text-${stat.color}-600 dark:text-${stat.color}-400`}>
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      <div className="bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 rounded-[32px] p-2 overflow-hidden shadow-sm">
        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-4 pt-4 mb-6">
            <TabsList className="bg-slate-100/50 dark:bg-slate-900/50 p-1.5 rounded-2xl border border-slate-200/50 dark:border-slate-800/50 h-auto gap-1">
              <TabsTrigger 
                value="online" 
                className="px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:text-blue-600 dark:data-[state=active]:text-blue-400 data-[state=active]:shadow-sm transition-all"
              >
                Online ({data.counts.online})
              </TabsTrigger>
              <TabsTrigger 
                value="left" 
                className="px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:text-blue-600 dark:data-[state=active]:text-blue-400 data-[state=active]:shadow-sm transition-all"
              >
                Left ({data.counts.joinedButLeft})
              </TabsTrigger>
              <TabsTrigger 
                value="not-joined" 
                className="px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:text-blue-600 dark:data-[state=active]:text-blue-400 data-[state=active]:shadow-sm transition-all"
              >
                Not Joined ({data.counts.totalNotJoined})
              </TabsTrigger>
            </TabsList>

            <Button
              variant="outline"
              size="sm"
              onClick={handleExportToExcel}
              className="rounded-xl h-11 px-6 font-bold text-xs gap-2 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 shadow-sm"
              disabled={
                (selectedTab === 'online' && data.participants.online.length === 0) ||
                (selectedTab === 'left' && data.participants.left.length === 0) ||
                (selectedTab === 'not-joined' && data.participants.notJoined.length === 0)
              }
            >
              <FileSpreadsheet className="h-4 w-4 text-emerald-500" />
              Export Report
            </Button>
          </div>
          
          <div className="min-h-[400px]">
            <TabsContent value="online" className="m-0 focus-visible:outline-none">
              <ParticipantTable 
                participants={data.participants.online}
                showJoinTime={true}
                showOnlineDuration={true}
                emptyMessage="No participants are currently online."
              />
            </TabsContent>
            
            <TabsContent value="left" className="m-0 focus-visible:outline-none">
              <ParticipantTable 
                participants={data.participants.left}
                showJoinTime={true} 
                showLeaveTime={true}
                showOnlineDuration={true}
                emptyMessage="No participants have left the session yet."
              />
            </TabsContent>
            
            <TabsContent value="not-joined" className="m-0 focus-visible:outline-none">
              <ParticipantTable 
                participants={data.participants.notJoined}
                emptyMessage="All registered participants have joined."
              />
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  )
}
