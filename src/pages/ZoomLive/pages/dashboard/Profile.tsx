import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@zoom/components/ui/card'
import { Button } from '@zoom/components/ui/button'
import { Badge } from '@zoom/components/ui/badge'
import { Separator } from '@zoom/components/ui/separator'
import { Alert, AlertDescription } from '@zoom/components/ui/alert'
import { User, Mail, Calendar, Video, AlertCircle, RefreshCw } from 'lucide-react'
// import { useProject } from '@zoom/context/ProjectContext'
import { useZoomUserProfile, useRefreshZoomToken } from '@zoom/hooks/useZoom'
import { useZoomProject, useZoomProjectMutations } from '@zoom/hooks/useZoomProjects'
import { isProjectConfigured } from '@zoom/lib/projectUtils'
// import { WebhookSubscriptionStatus } from '@zoom/components/WebhookSubscriptionStatus'

const Profile = () => {
  const { projectId } = useParams<{ projectId: string }>()
  const navigate = useNavigate()
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null)
  const { useDisconnectZoomOAuth } = useZoomProjectMutations()
  const disconnectMutation = useDisconnectZoomOAuth()
  
  // Fetch project data
  const { data: projectData, isLoading: isProjectLoading } = useZoomProject(projectId)
  
  // Fetch user profile when account is selected
  const { data: profileResponse, isLoading: isProfileLoading, error: profileError } = useZoomUserProfile(
    selectedAccountId || '', 
    !!selectedAccountId
  )
  
  // Fetch webhook subscription status
  // const {
  //   data: webhookSubscriptionStatus,
  //   isLoading: isLoadingWebhookStatus,
  //   error: webhookStatusError,
  // } = useWebhookSubscriptionStatus(projectId)
  
  const refreshTokenMutation = useRefreshZoomToken()

  useEffect(() => {
    if (projectData?.accountId) {
      setSelectedAccountId(projectData.accountId)
    }
  }, [projectData])

  const handleRefreshToken = () => {
    if (selectedAccountId) {
      refreshTokenMutation.mutate(selectedAccountId)
    }
  }

  const profile = profileResponse?.data

  if (isProjectLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3 mb-6"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  if (!projectData) {
    return (
      <div className="space-y-6">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Project not found or not configured.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Profile</h1>
        <p className="text-muted-foreground">
          View your Zoom account information and manage your settings.
        </p>
      </div>

      <Separator />

      {/* Project Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Project Information
          </CardTitle>
          <CardDescription>
            Basic information about your Zoom project
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Project Name</label>
              <p className="text-sm">{projectData.projectName}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Account ID</label>
              <p className="text-sm font-mono">{projectData.accountId || 'Not connected'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Created</label>
              <p className="text-sm">{new Date(projectData.createdAt).toLocaleDateString()}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Status</label>
              <Badge variant={projectData.accountId ? "default" : "secondary"}>
                {projectData.accountId ? "Connected" : "Not Connected"}
              </Badge>
            </div>
          </div>
          {projectId && isProjectConfigured(projectData) && (
            <div className="pt-4 border-t">
              <p className="text-sm text-muted-foreground mb-2">
                Remove Zoom access for this workspace. You can reconnect anytime via Configuration.
              </p>
              <Button
                type="button"
                variant="outline"
                className="border-destructive/50 text-destructive hover:bg-destructive/10"
                disabled={disconnectMutation.isPending}
                onClick={() => {
                  if (
                    !window.confirm(
                      'Disconnect Zoom from this project? You will need to sign in to Zoom again to use meetings.',
                    )
                  ) {
                    return
                  }
                  disconnectMutation.mutate(projectId, {
                    onSuccess: () => {
                      navigate(`/zoom/dashboard/${projectId}/configuration`, { replace: true })
                    },
                  })
                }}
              >
                {disconnectMutation.isPending ? 'Disconnecting…' : 'Disconnect Zoom'}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Webhook Subscription Status */}
      {/* <WebhookSubscriptionStatus
        status={webhookSubscriptionStatus}
        isLoading={isLoadingWebhookStatus}
        error={webhookStatusError}
      /> */}

      {/* Zoom Profile Information */}
      {selectedAccountId && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Video className="h-5 w-5" />
                Zoom Profile
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefreshToken}
                disabled={refreshTokenMutation.isPending}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${refreshTokenMutation.isPending ? 'animate-spin' : ''}`} />
                Refresh Token
              </Button>
            </CardTitle>
            <CardDescription>
              Your Zoom account profile information
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isProfileLoading ? (
              <div className="animate-pulse space-y-4">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                <div className="h-4 bg-gray-200 rounded w-2/3"></div>
              </div>
            ) : profileError ? (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Failed to load profile information. Please try refreshing the token.
                </AlertDescription>
              </Alert>
            ) : profile ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Display Name</label>
                    <p className="text-sm">{profile.display_name}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Email</label>
                    <p className="text-sm flex items-center gap-1">
                      <Mail className="h-3 w-3" />
                      {profile.email}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">First Name</label>
                    <p className="text-sm">{profile.first_name}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Last Name</label>
                    <p className="text-sm">{profile.last_name}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Account Type</label>
                    <Badge variant="outline">
                      {profile.type === 1 ? 'Basic' : profile.type === 2 ? 'Licensed' : 'On-Prem'}
                    </Badge>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Status</label>
                    <Badge variant={profile.status === 'active' ? 'default' : 'secondary'}>
                      {profile.status}
                    </Badge>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Timezone</label>
                    <p className="text-sm">{profile.timezone}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Created</label>
                    <p className="text-sm flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {new Date(profile?.created_at || '').toLocaleDateString()}
                    </p>
                  </div>
                </div>
                
                {profile.personal_meeting_url && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Personal Meeting URL</label>
                    <p className="text-sm">
                      <a 
                        href={profile.personal_meeting_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        {profile.personal_meeting_url}
                      </a>
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  No profile information available. Please ensure your Zoom account is properly connected.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}

      {!selectedAccountId && (
        <Card>
          <CardContent className="pt-6">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                No Zoom account connected. Please configure your Zoom account first.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default Profile
