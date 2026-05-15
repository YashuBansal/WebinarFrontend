import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@zoom/components/ui/card'
import { Alert, AlertDescription } from '@zoom/components/ui/alert'
import { Button } from '@zoom/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@zoom/components/ui/select'
import RegistrantsTable from '../../Meetings/components/RegistrantsTable'
import { getQueryErrorMessage } from '@zoom/lib/apiErrors'

interface PaginationData {
  page: number
  pageSize: number
  totalRecords: number
  pageCount: number
}

interface WebinarsRegistrationsTabProps {
  registrants: any[]
  totalRegistrations: number
  isRegLoading: boolean
  regError: any
  pagination?: PaginationData
  page: number
  pageSize: number
  onPageChange: (page: number) => void
  onPageSizeChange: (pageSize: number) => void
}

export default function WebinarsRegistrationsTab({
  registrants,
  totalRegistrations,
  isRegLoading,
  regError,
  pagination,
  page,
  pageSize,
  onPageChange,
  onPageSizeChange,
}: WebinarsRegistrationsTabProps) {
  const totalPages = pagination?.pageCount ?? 1
  const hasPrevPage = page > 1
  const hasNextPage = page < totalPages

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-2">
          <div>
            <CardTitle>Registrations</CardTitle>
            <CardDescription>Approved registrants</CardDescription>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-sm text-muted-foreground">
              Total: {pagination?.totalRecords ?? totalRegistrations}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Show:</span>
              <Select
                value={pageSize.toString()}
                onValueChange={(value) => onPageSizeChange(parseInt(value, 10))}
              >
                <SelectTrigger className="w-[80px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                <SelectItem value="10">10</SelectItem>
                  <SelectItem value="30">30</SelectItem>
                  <SelectItem value="60">60</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isRegLoading ? (
          <div className="animate-pulse h-24 bg-gray-100 rounded" />
        ) : regError ? (
          <Alert>
            <AlertDescription className="whitespace-pre-wrap">
              {getQueryErrorMessage(regError, 'Failed to load registrants.')}
            </AlertDescription>
          </Alert>
        ) : registrants.length === 0 ? (
          <div className="text-sm text-muted-foreground">No registrants yet.</div>
        ) : (
          <>
            <RegistrantsTable rows={registrants} />
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 pt-4 mt-4 border-t">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!hasPrevPage}
                  onClick={() => hasPrevPage && onPageChange(page - 1)}
                >
                  Previous
                </Button>
                <span className="text-sm">
                  Page {page} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!hasNextPage}
                  onClick={() => hasNextPage && onPageChange(page + 1)}
                >
                  Next
                </Button>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}

