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
import { motion } from 'framer-motion'
import { Skeleton } from '@mui/material'
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
    <div className="min-h-full w-full min-w-0 max-w-full box-border p-2 transition-colors duration-500 sm:p-2 md:p-0 lg:p-0 xl:p-2 2xl:p-4">
      {/* Premium Header */}
      <motion.div
        className="mb-6 rounded-2xl border border-slate-200/60 p-4 sm:p-5 bg-white dark:bg-slate-800/50 shadow-sm dark:border-slate-700/50"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 font-bold text-xs uppercase tracking-widest mb-1">
              <User className="h-3.5 w-3.5" />
              Account Profile
            </div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-2xl">
              Profile Management
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-xs font-medium">
              Manage your identity and configuration for <span className="text-slate-900 dark:text-white font-bold">{projectData.projectName}</span>
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              onClick={handleRefreshToken}
              disabled={refreshTokenMutation.isPending || isProfileLoading}
              className="h-11 px-6 rounded-xl flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm shadow-lg transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              {refreshTokenMutation.isPending ? <RefreshCw className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
              Refresh Token
            </Button>
          </div>
        </div>
      </motion.div>

      <main className="container mx-auto space-y-6 pb-12">
        {/* Top Section: Zoom Profile & Project Stats */}
        <div className="grid gap-6 md:grid-cols-3 items-stretch">
          {/* Zoom Profile Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="group relative md:col-span-2 bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 hover:border-blue-400/50 dark:hover:border-blue-500/50 hover:shadow-xl hover:shadow-blue-900/5 dark:hover:shadow-blue-500/10 rounded-[20px] p-6 transition-all duration-300 overflow-hidden"
          >
            <div className="absolute top-0 right-0 -mr-16 -mt-16 h-32 w-32 rounded-full bg-blue-500/5 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity" />

            <div className="relative z-10">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                  <div className="h-16 w-16 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-xl shadow-blue-600/20 group-hover:scale-110 transition-transform duration-500">
                    <Video className="h-8 w-8" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-slate-900 dark:text-white">Zoom Account Info</h3>
                    <p className="text-slate-500 dark:text-slate-400 text-xs font-medium">Your connected Zoom identity</p>
                  </div>
                </div>
                {profile?.status && (
                  <Badge variant={profile.status === 'active' ? 'default' : 'secondary'} className="px-3 py-1 rounded-lg font-bold uppercase tracking-widest text-[10px]">
                    {profile.status}
                  </Badge>
                )}
              </div>

              {isProfileLoading ? (
                <div className="grid gap-6 sm:grid-cols-2">
                  {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-20 w-full rounded-2xl" />)}
                </div>
              ) : profileError ? (
                <Alert className="rounded-2xl border-none bg-red-50 dark:bg-red-500/10 text-red-600">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="font-bold">Failed to load profile. Please refresh the token.</AlertDescription>
                </Alert>
              ) : profile ? (
                <div className="grid gap-6 sm:grid-cols-2">
                  {[
                    { icon: User, label: "Display Name", value: profile.display_name },
                    { icon: Mail, label: "Email Address", value: profile.email },
                    { icon: Calendar, label: "Created At", value: new Date(profile.created_at).toLocaleDateString() },
                    { icon: Video, label: "Account Type", value: profile.type === 1 ? 'Basic' : profile.type === 2 ? 'Licensed' : 'On-Prem', badge: true },
                  ].map((item, i) => (
                    <div key={i} className="group/item p-4 rounded-2xl bg-slate-50/50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800/50 hover:bg-white dark:hover:bg-slate-800 transition-all">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="h-7 w-7 rounded-lg bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700/50 flex items-center justify-center text-slate-400 group-hover/item:text-blue-600 transition-colors">
                          <item.icon className="h-3.5 w-3.5" />
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{item.label}</span>
                      </div>
                      {item.badge ? (
                        <Badge variant="outline" className="font-bold border-blue-200 text-blue-700 dark:text-blue-400">{item.value}</Badge>
                      ) : (
                        <p className="text-sm font-bold text-slate-700 dark:text-slate-200 truncate">{item.value}</p>
                      )}
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          </motion.div>

          {/* Project Details Sidebar Card */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 rounded-[20px] p-6 flex flex-col"
          >
            <h3 className="text-lg font-black text-slate-900 dark:text-white mb-6">Workspace Details</h3>

            <div className="space-y-5 flex-1">
              <div className="space-y-1.5">
                <label className="text-[8px] font-black uppercase tracking-widest text-slate-400">Project Name</label>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800/50 font-bold text-sm text-slate-700 dark:text-slate-200">
                  {projectData.projectName}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[8px] font-black uppercase tracking-widest text-slate-400">Account ID</label>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800/50 font-mono text-xs text-slate-500 dark:text-slate-400 truncate">
                  {projectData.accountId || "Not Connected"}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[8px] font-black uppercase tracking-widest text-slate-400">Timezone</label>
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800/50 font-bold text-sm text-slate-700 dark:text-slate-200">
                    {profile?.timezone || "UTC"}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[8px] font-black uppercase tracking-widest text-slate-400">Created At</label>
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800/50 font-bold text-sm text-slate-700 dark:text-slate-200">
                    {projectData.createdAt ? new Date(projectData.createdAt).toLocaleDateString() : '—'}
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800/50">
              <Button
                variant="outline"
                className="w-full h-11 rounded-xl border-red-200/50 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 font-bold text-sm flex items-center justify-center gap-2"
                disabled={disconnectMutation.isPending}
                onClick={() => {
                  if (window.confirm('Disconnect Zoom from this project? You will need to sign in again to use Zoom features.')) {
                    disconnectMutation.mutate(projectId, {
                      onSuccess: () => navigate(`/zoom/dashboard/${projectId}/configuration`, { replace: true }),
                    })
                  }
                }}
              >
                {disconnectMutation.isPending ? <RefreshCw className="h-4 w-4 animate-spin" /> : <AlertCircle className="h-4 w-4" />}
                Disconnect Account
              </Button>
            </div>
          </motion.div>
        </div>

        {/* PMU Card */}
        {profile?.personal_meeting_url && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="group p-6 rounded-[20px] bg-gradient-to-br from-blue-600 to-indigo-700 text-white shadow-xl shadow-blue-600/20"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-blue-100 font-black uppercase tracking-widest text-[10px]">
                  <Video className="h-3.5 w-3.5" />
                  Personal Meeting Room
                </div>
                <h3 className="text-xl font-black">Personal Meeting URL</h3>
                <p className="text-blue-100/80 text-sm font-medium">Use this persistent link for your personal Zoom room.</p>
              </div>
              <a
                href={profile.personal_meeting_url}
                target="_blank"
                rel="noopener noreferrer"
                className="px-8 py-4 bg-white text-blue-600 rounded-2xl font-black text-sm shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all text-center"
              >
                Launch Meeting Room
              </a>
            </div>
          </motion.div>
        )}
      </main>
    </div>
  )
}

export default Profile
