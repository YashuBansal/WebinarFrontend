import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@zoom/components/ui/card'
import { Badge } from '@zoom/components/ui/badge'
import { Alert, AlertDescription } from '@zoom/components/ui/alert'
import { CheckCircle, XCircle, Loader2, AlertCircle } from 'lucide-react'
import type { WebhookSubscriptionStatus as WebhookSubscriptionStatusType } from '@zoom/schemas/zoom'

interface WebhookSubscriptionStatusProps {
  status: WebhookSubscriptionStatusType | undefined
  isLoading: boolean
  error: Error | null
}

export const WebhookSubscriptionStatus = ({
  status,
  isLoading,
  error,
}: WebhookSubscriptionStatusProps) => {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            Webhook Subscription Status
          </CardTitle>
          <CardDescription>
            Checking webhook subscription status...
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground">
            Loading subscription information...
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-red-600" />
            Webhook Subscription Status
          </CardTitle>
          <CardDescription>
            Unable to check webhook subscription status
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertDescription>
              Failed to load webhook subscription status. Please try again later.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  const isSubscribed = status?.isSubscribed ?? false

  const getStatusIcon = () => {
    if (isSubscribed) {
      return <CheckCircle className="h-4 w-4 text-green-600" />
    }
    return <XCircle className="h-4 w-4 text-red-600" />
  }

  const getStatusColor = () => {
    if (isSubscribed) {
      return 'bg-green-100 text-green-800 border-green-200'
    }
    return 'bg-red-100 text-red-800 border-red-200'
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {getStatusIcon()}
          Webhook Subscription Status
        </CardTitle>
        <CardDescription>
          Current status of your app's webhook subscription to Zoom
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-3">
          <Badge className={`${getStatusColor()} border`}>
            {isSubscribed ? 'Subscribed' : 'Not Subscribed'}
          </Badge>
        </div>

        <Alert>
          <AlertDescription>
            {isSubscribed ? (
              <>
                <strong>Your app is subscribed to webhook notifications.</strong> You will receive
                real-time updates about meetings, webinars, participants, and other Zoom events.
              </>
            ) : (
              <>
                <strong>Your app is not subscribed to webhook notifications.</strong> You will not
                receive real-time updates. Please configure your webhook subscription in Zoom to enable
                event notifications.
              </>
            )}
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  )
}

