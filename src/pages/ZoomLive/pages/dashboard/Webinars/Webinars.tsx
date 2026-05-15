import { useEffect, useMemo, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@zoom/components/ui/card'
import { Button } from '@zoom/components/ui/button'
import { Badge } from '@zoom/components/ui/badge'
import { Alert, AlertDescription } from '@zoom/components/ui/alert'
import { Video, Calendar, Clock, AlertCircle, ExternalLink, Search } from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { useProjectWebinars, webinarsKeys } from '@zoom/hooks/useZoom'
import { getQueryErrorMessage } from '@zoom/lib/apiErrors'
import { socketManager } from '@zoom/lib/socket'

const Webinars = () => {
  const { projectId } = useParams<{ projectId: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const [type, setType] = useState<'upcoming'>('upcoming')
  const [fromDate, setFromDate] = useState<string>('')
  const [toDate, setToDate] = useState<string>('')
  const [searchTerm, setSearchTerm] = useState<string>('')

  const toIsoStart = (d: string) => (d ? new Date(d + 'T00:00:00Z').toISOString() : undefined)
  const toIsoEnd = (d: string) => (d ? new Date(d + 'T23:59:59.999Z').toISOString() : undefined)

  // Ensure date range only fetches current and future webinars
  const formatLocalDate = (d: Date) => {
    const yr = d.getFullYear()
    const mo = String(d.getMonth() + 1).padStart(2, '0')
    const da = String(d.getDate()).padStart(2, '0')
    return `${yr}-${mo}-${da}`
  }
  const todayStr = formatLocalDate(new Date())
  const clampFrom = fromDate && fromDate < todayStr ? todayStr : fromDate
  const clampTo = toDate && toDate < todayStr ? todayStr : toDate

  const { data, isLoading, error } = useProjectWebinars(projectId, {
    type,
    pageSize: 30,
    from: toIsoStart(clampFrom),
    to: toIsoEnd(clampTo),
  })
  const webinars = data?.webinars ?? []

  useEffect(() => {
    const socket = socketManager.getSocket()
    if (!socket || !projectId) {
      return
    }

    const handleZoomUpdate = (payload: { resource?: string; projectId?: string }) => {
      if (payload.resource !== 'webinars' || payload.projectId !== projectId) {
        return
      }
      queryClient.invalidateQueries({ queryKey: webinarsKeys.all })
    }

    socket.on('zoom-update', handleZoomUpdate)
    return () => {
      socket.off('zoom-update', handleZoomUpdate)
    }
  }, [projectId, queryClient])

  const sortedWebinars = useMemo(() => {
    const copy = [...webinars]
    copy.sort((a, b) => {
      const aTime = new Date((a.startTime as any) || (a.createdAt as any) || 0).getTime()
      const bTime = new Date((b.startTime as any) || (b.createdAt as any) || 0).getTime()
      return bTime - aTime
    })
    return copy
  }, [webinars])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled':
        return 'default'
      case 'in-progress':
        return 'secondary'
      case 'completed':
        return 'outline'
      default:
        return 'secondary'
    }
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight">Webinars</h1>
          <p className="text-muted-foreground">Browse and filter your Zoom webinars across types and dates.</p>
        </div>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col lg:flex-row lg:items-end gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 overflow-x-auto">
                {(['upcoming'] as const).map((t) => (
                  <Button
                    key={t}
                    variant={type === t ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setType(t)}
                    className="whitespace-nowrap"
                  >
                    {t.charAt(0).toUpperCase() + t.slice(1)}
                  </Button>
                ))}
              </div>
            </div>
            <div className="flex flex-1 flex-col sm:flex-row gap-3">
              <div className="flex-1">
                <label className="block text-xs text-muted-foreground mb-1">Search topic</label>
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Search by topic"
                    className="w-full border rounded pl-8 pr-3 py-2 text-sm"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs text-muted-foreground mb-1">From</label>
                <input
                  type="date"
                  className="border rounded px-2 py-2 text-sm"
                  min={todayStr}
                  value={fromDate}
                  onChange={(e) => {
                    const v = e.target.value
                    setFromDate(v && v < todayStr ? todayStr : v)
                  }}
                />
              </div>
              <div>
                <label className="block text-xs text-muted-foreground mb-1">To</label>
                <input
                  type="date"
                  className="border rounded px-2 py-2 text-sm"
                  min={todayStr}
                  value={toDate}
                  onChange={(e) => {
                    const v = e.target.value
                    setToDate(v && v < todayStr ? todayStr : v)
                  }}
                />
              </div>
              <div className="flex items-end">
                <Button variant="ghost" size="sm" onClick={() => { setFromDate(''); setToDate(''); setSearchTerm(''); }}>
                  Clear
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Video className="h-5 w-5" />
            Webinars
          </CardTitle>
          <CardDescription>
            Results matching current filters
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="animate-pulse space-y-4">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              <div className="h-64 bg-gray-200 rounded"></div>
            </div>
          ) : error ? (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="whitespace-pre-wrap">
                {getQueryErrorMessage(error, 'Failed to load webinars.')}
              </AlertDescription>
            </Alert>
          ) : sortedWebinars.length === 0 ? (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                No webinars found for the selected filters.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-3">
              {sortedWebinars
                .filter((w) => (searchTerm ? (w.topic || '').toLowerCase().includes(searchTerm.toLowerCase()) : true))
                .map((webinar) => (
                  <div
                    key={webinar.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="font-semibold truncate" title={webinar.topic || 'Untitled'}>{webinar.topic || 'Untitled'}</h3>
                        <Badge variant={getStatusColor(webinar.status || '')}>
                          {webinar.status || 'scheduled'}
                        </Badge>
                      </div>
                      <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {webinar.startTime ? formatDate(new Date(webinar.startTime)) : '—'}
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {webinar.startTime ? formatTime(new Date(webinar.startTime)) : '—'}
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {webinar.duration ?? 0} min
                        </div>
                        <div className="hidden md:block text-xs">ID: {webinar.id}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      {webinar.status === 'scheduled' && webinar.joinUrl && (
                        <Button variant="outline" size="sm" asChild>
                          <a href={webinar.joinUrl} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="h-3 w-3 mr-1" />
                            Join
                          </a>
                        </Button>
                      )}
                      <Button className='cursor-pointer bg-neutral-200 hover:bg-neutral-300' variant="ghost" size="sm" onClick={() => navigate(`/zoom/dashboard/${projectId}/webinars/${encodeURIComponent(webinar.id)}?start-time=${encodeURIComponent(webinar.startTime || "")}`)}>
                        View Details
                      </Button>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default Webinars


