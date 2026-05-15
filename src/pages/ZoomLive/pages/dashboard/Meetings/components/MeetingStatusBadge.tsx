interface MeetingStatusBadgeProps {
  meetingState: string
  isStatusLoading: boolean
  statusError: any
}

export default function MeetingStatusBadge({ meetingState, isStatusLoading, statusError }: MeetingStatusBadgeProps) {

  const statusText = isStatusLoading ? 'Loading…' : (statusError ? 'Unknown' : meetingState)

  return (
    <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700">
      Status: {statusText}
    </span>
  )
}
