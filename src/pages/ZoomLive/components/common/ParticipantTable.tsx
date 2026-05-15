import React, { useState, useEffect } from 'react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@zoom/components/ui/table'
import { Badge } from '@zoom/components/ui/badge'
import { Button } from '@zoom/components/ui/button'
import { ExternalLink, User, Clock, Phone, Tag, MapPin, Globe, ArrowRight } from 'lucide-react'
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
    return (
      <div className="flex flex-col items-center justify-center py-20 px-4">
        <div className="h-16 w-16 rounded-2xl bg-slate-50 dark:bg-slate-900/50 flex items-center justify-center mb-4">
          <User className="h-8 w-8 text-slate-300" />
        </div>
        <p className="text-slate-500 dark:text-slate-400 font-medium text-sm text-center max-w-[200px]">{emptyMessage}</p>
      </div>
    )
  }

  const dashboardBaseUrl = import.meta.env.VITE_REACT_APP_DASHBOARD_BASE_URL || 'https://dashboard.ajaybansal.com'

  const formatDateTime = (dateString?: string) => {
    if (!dateString) return '—'
    try {
      const date = new Date(dateString)
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    } catch {
      return '—'
    }
  }

  const getContactUrl = (email: string) => {
    if (!email) return '#'
    return `${dashboardBaseUrl}/particularContact?email=${encodeURIComponent(email)}`
  }

  const formatDuration = (seconds?: number): string => {
    if (seconds === undefined || seconds === null || seconds < 0) return '—'
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    const parts: string[] = []
    if (hours > 0) parts.push(`${hours}h`)
    if (minutes > 0) parts.push(`${minutes}m`)
    if (secs > 0 && hours === 0) parts.push(`${secs}s`)
    return parts.length > 0 ? parts.join(' ') : '0s'
  }

  const [, setTick] = useState(0)
  const hasOnlineParticipants = participants.some((p) => p.lastJoinAt && !p.lastLeftAt)

  useEffect(() => {
    if (!showOnlineDuration || !hasOnlineParticipants) return
    const interval = setInterval(() => setTick((prev) => prev + 1), 1000)
    return () => clearInterval(interval)
  }, [showOnlineDuration, hasOnlineParticipants])

  const calculateOnlineDuration = (lastJoinAt?: string): number | undefined => {
    if (!lastJoinAt) return undefined
    try {
      const joinTime = new Date(lastJoinAt).getTime()
      const durationMs = Date.now() - joinTime
      if (durationMs > 0) return Math.floor(durationMs / 1000)
    } catch { return undefined }
    return undefined
  }

  const truncateString = (str: string, maxLength: number = 20): string => {
    if (!str || str.length <= maxLength) return str
    return str.slice(0, maxLength) + '...'
  }

  const renderArrayBadge = (
    values: string[] | undefined,
    icon: React.ElementType,
    variant: "default" | "secondary" | "outline" | "destructive" = "secondary",
    maxVisible: number = 1
  ) => {
    if (!values || values.length === 0) return <span className="text-slate-300 dark:text-slate-700">—</span>
    const Icon = icon
    const visible = values.slice(0, maxVisible)
    const remaining = values.length - maxVisible

    return (
      <div className="flex items-center gap-1.5 flex-wrap">
        {visible.map((val, i) => (
          <Badge 
            key={i} 
            variant={variant}
            className="h-6 px-2 text-[10px] font-bold bg-slate-50 dark:bg-slate-900/40 border-slate-200/60 dark:border-slate-800/60 text-slate-600 dark:text-slate-300"
          >
            <Icon className="h-2.5 w-2.5 mr-1 text-slate-400" />
            {truncateString(val, 12)}
          </Badge>
        ))}
        {remaining > 0 && (
          <Badge variant="outline" className="h-6 px-1.5 text-[9px] font-black border-dashed opacity-60">
            +{remaining}
          </Badge>
        )}
      </div>
    )
  }

  return (
    <div className="relative overflow-x-auto">
      <Table>
        <TableHeader className="bg-slate-50/50 dark:bg-slate-900/50">
          <TableRow className="border-slate-100 dark:border-slate-800 hover:bg-transparent">
            <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400 py-4 pl-6">Participant</TableHead>
            {showJoinTime && <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400 py-4">Joined</TableHead>}
            {showLeaveTime && <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400 py-4">Left</TableHead>}
            {showOnlineDuration && <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400 py-4">Duration</TableHead>}
            <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400 py-4">Phone / CRM Names</TableHead>
            <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400 py-4">Tags & Context</TableHead>
            <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400 py-4 text-center">Global Stats</TableHead>
            <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400 py-4 pr-6 text-right">View CRM</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {participants.map((participant, idx) => {
            const name = participant.participantName || participant.participantEmail || participant.participantUserId || participant.participantId || 'Unknown'
            const email = participant.participantEmail || ''
            const attendeeData = participant.attendeeData
            
            return (
              <TableRow key={idx} className="border-slate-100 dark:border-slate-800 hover:bg-slate-50/30 dark:hover:bg-slate-900/30 transition-colors">
                <TableCell className="py-4 pl-6">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 flex items-center justify-center text-slate-500 font-bold text-xs border border-white dark:border-slate-700 shadow-sm">
                      {name.charAt(0)}
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="font-bold text-sm text-slate-900 dark:text-white leading-tight truncate max-w-[140px]">{name}</span>
                      <span className="text-[10px] font-medium text-slate-500 truncate max-w-[140px]">{email || 'No email'}</span>
                    </div>
                  </div>
                </TableCell>

                {showJoinTime && (
                  <TableCell className="py-4">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300">
                      <Clock className="h-3 w-3 text-emerald-500" />
                      {formatDateTime(participant.lastJoinAt)}
                    </div>
                  </TableCell>
                )}

                {showLeaveTime && (
                  <TableCell className="py-4">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300">
                      <Clock className="h-3 w-3 text-red-400" />
                      {formatDateTime(participant.lastLeftAt)}
                    </div>
                  </TableCell>
                )}

                {showOnlineDuration && (
                  <TableCell className="py-4">
                    <Badge variant="outline" className="h-7 px-2.5 rounded-lg border-blue-200 dark:border-blue-500/30 bg-blue-50/50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 font-black text-[10px] uppercase tracking-tighter">
                      {formatDuration(
                        participant.lastLeftAt
                          ? participant.onlineDuration 
                          : participant.lastJoinAt
                          ? calculateOnlineDuration(participant.lastJoinAt) 
                          : participant.onlineDuration 
                      )}
                    </Badge>
                  </TableCell>
                )}

                <TableCell className="py-4">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300">
                      <Phone className="h-3 w-3 text-slate-400" />
                      {attendeeData?.phones?.[0] || '—'}
                    </div>
                    {renderArrayBadge(attendeeData?.fullNames, User)}
                  </div>
                </TableCell>

                <TableCell className="py-4">
                  <div className="space-y-1.5">
                    {renderArrayBadge(attendeeData?.tags, Tag)}
                    <div className="flex gap-1.5">
                      {renderArrayBadge(attendeeData?.locations, MapPin)}
                      {renderArrayBadge(attendeeData?.sources, Globe)}
                    </div>
                  </div>
                </TableCell>

                <TableCell className="py-4 text-center">
                  <div className="flex items-center justify-center gap-3">
                    <div className="flex flex-col">
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">Attended</span>
                      <span className="text-xs font-black text-blue-600 dark:text-blue-400">{attendeeData?.attendedWebinarCount ?? 0}</span>
                    </div>
                    <div className="w-[1px] h-6 bg-slate-100 dark:bg-slate-800" />
                    <div className="flex flex-col">
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">Registered</span>
                      <span className="text-xs font-black text-slate-900 dark:text-white">{attendeeData?.registeredWebinarCount ?? 0}</span>
                    </div>
                  </div>
                </TableCell>

                <TableCell className="py-4 pr-6 text-right">
                  {email ? (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-10 w-10 rounded-xl hover:bg-blue-50 dark:hover:bg-blue-500/10 hover:text-blue-600 transition-all group"
                      asChild
                    >
                      <a href={getContactUrl(email)} target="_blank" rel="noopener noreferrer">
                        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                      </a>
                    </Button>
                  ) : (
                    <span className="text-slate-300 dark:text-slate-700">—</span>
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
