import { useEffect, useState } from 'react'
import { Alert, AlertDescription } from '@zoom/components/ui/alert'
import { Button } from '@zoom/components/ui/button'
import { useWebinars } from '@zoom/hooks/useZoom'
import { getQueryErrorMessage } from '@zoom/lib/apiErrors'
import type { Webinar } from '@zoom/api/zoomApi'

interface WebinarDropdownProps {
  currentMeetingId: string
  currentOccurrenceId?: string
  onWebinarChange?: (webinar: Webinar | null) => void
  onSave?: (webinarId: string) => void
}

export default function WebinarDropdown({ currentMeetingId, currentOccurrenceId, onWebinarChange, onSave }: WebinarDropdownProps) {
  const [selectedWebinarId, setSelectedWebinarId] = useState<string>('')
  const { data: webinars, isLoading, error } = useWebinars()

  // Find the webinar that currently has this meetingId (and occurrenceId if provided)
  // When occurrenceId is available, match by both meetingId and occurrenceId
  // Otherwise, match by meetingId only (for backward compatibility)
  const currentWebinar = currentOccurrenceId
    ? webinars?.find(w => w.meetingId === currentMeetingId && w.occurrenceId === currentOccurrenceId)
    : webinars?.find(w => w.meetingId === currentMeetingId)

  // Keep local selection in sync with current association when it changes
  useEffect(() => {
    setSelectedWebinarId(currentWebinar?._id || '')
  }, [currentWebinar?._id])

  const handleWebinarSelect = (webinarId: string) => {
    setSelectedWebinarId(webinarId)
    if (webinarId === '') {
      onWebinarChange?.(null)
      return
    }
    const selectedWebinar = webinars?.find(w => w._id === webinarId)
    onWebinarChange?.(selectedWebinar || null)
  }

  const handleSave = () => {
    onSave?.(selectedWebinarId)
  }

  const hasChanges = selectedWebinarId !== (currentWebinar?._id || '')

  if (isLoading) {
    return <div className="text-sm text-muted-foreground">Loading webinars...</div>
  }

  if (error) {
    return (
      <Alert>
        <AlertDescription className="whitespace-pre-wrap">
          {getQueryErrorMessage(error, 'Failed to load webinars.')}
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-gray-700">Associate with Webinar</label>
      <div className="flex gap-2">
        <select
          value={selectedWebinarId}
          onChange={(e) => handleWebinarSelect(e.target.value)}
          className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="">No webinar selected</option>
          {webinars?.map((webinar) => {
            // Check if this webinar is already associated with a different meeting/occurrence
            const isAlreadyAssociated = webinar.meetingId && (
              webinar.meetingId !== currentMeetingId ||
              (currentOccurrenceId && webinar.occurrenceId && webinar.occurrenceId !== currentOccurrenceId)
            )
            return (
              <option key={webinar._id} value={webinar._id}>
                {webinar.webinarName}
                {isAlreadyAssociated && ' (Already has meeting)'}
              </option>
            )
          })}
        </select>
        <Button
          onClick={handleSave}
          disabled={!hasChanges}
          size="sm"
          className="px-4"
        >
          Save
        </Button>
      </div>
      {currentWebinar && (
        <div className="text-xs text-muted-foreground">
          Currently associated with: <span className="font-medium">{currentWebinar.webinarName}</span>
        </div>
      )}
    </div>
  )
}
