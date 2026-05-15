import React from 'react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@zoom/components/ui/table'
import { Badge } from '@zoom/components/ui/badge'
import { Button } from '@zoom/components/ui/button'
import { ExternalLink } from 'lucide-react'

type AttendeeData = {
  _id?: string
  phones?: string[]
  fullNames?: string[]
  tags?: string[]
  timeInSession?: number
  attendedWebinarCount?: number
  registeredWebinarCount?: number
  locations?: string[]
  sources?: string[]
  leadType?: string
  salesAssignedTo?: string
  salesLastStatus?: string
  reminderAssignedTo?: string
  reminderLastStatus?: string
}

type Registrant = {
  id?: string
  first_name?: string
  last_name?: string
  email?: string
  phone?: string
  phone_number?: string
  attendeeData?: AttendeeData | null
}

interface RegistrantsTableProps {
  rows: Registrant[]
  className?: string
}

export function RegistrantsTable({ rows, className }: RegistrantsTableProps) {
  const dashboardBaseUrl = import.meta.env.VITE_REACT_APP_DASHBOARD_BASE_URL || 'https://dashboard.ajaybansal.com'

  const getContactUrl = (email: string) => {
    if (!email) return '#'
    return `${dashboardBaseUrl}/particularContact?email=${encodeURIComponent(email)}`
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

    const tooltipText = values.join(', ')

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

    const visible = values.slice(0, maxVisible)
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
    <div className={className}>
      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>First name</TableHead>
              <TableHead>Last name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Phone number</TableHead>
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
            {rows.map((r, i) => {
              const attendeeData = r.attendeeData
              return (
                <TableRow key={r.id || r.email || i}>
                  <TableCell>{r.first_name || ''}</TableCell>
                  <TableCell>{r.last_name || ''}</TableCell>
                  <TableCell>{r.email || ''}</TableCell>
                  <TableCell>{r.phone || r.phone_number || ''}</TableCell>
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
                    {r.email ? (
                      <div className="flex justify-end">
                        <Button
                          variant="outline"
                          size="sm"
                          asChild
                        >
                          <a
                            href={getContactUrl(r.email)}
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
    </div>
  )
}

export default RegistrantsTable


