import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  AlertCircle,
  CheckCircle,
  Settings,
  Video,
  ChevronRight
} from 'lucide-react'
import { Button } from '@zoom/components/ui/button'
import { Alert, AlertDescription, AlertTitle } from '@zoom/components/ui/alert'
import { useProject } from '@zoom/context/ProjectContext'
import { isProjectConfigured } from '@zoom/lib/projectUtils'
import { useZoomProject } from '@zoom/hooks/useZoomProjects'

const Configuration = () => {
  const { project } = useProject()
  const { projectId } = useParams<{ projectId: string }>()
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)
  const [showSuccessMessage, setShowSuccessMessage] = useState(false)

  const { data: projectData } = useZoomProject(projectId)
  const effectiveProject = projectData ?? project
  const isConfigured = isProjectConfigured(effectiveProject)

  // Redirect if already configured
  useEffect(() => {
    if (isConfigured) {
      navigate(`/zoom/dashboard/${projectId}/profile`, { replace: true })
    }
  }, [isConfigured, navigate, projectId])

  const handleConnectionSuccess = () => {
    setError(null)
    setShowSuccessMessage(true)

    // Hard refresh after successful configuration to update state
    setTimeout(() => {
      sessionStorage.setItem('postConfigRedirect', `/zoom/dashboard/${projectId}/profile`)
      window.location.reload()
    }, 2000)
  }

  const handleConnectZoom = () => {
    const clientId = import.meta.env.VITE_REACT_APP_ZOOM_CLIENT_ID
    const redirectUri = encodeURIComponent(`${window.location.origin}/zoom/callback`
    )
    const state = encodeURIComponent(projectId || 'noproj')

    // Zoom OAuth 2.0 authorize endpoint
    const authorizeUrl = `https://zoom.us/oauth/authorize?response_type=code&client_id=${clientId}&redirect_uri=${redirectUri}&state=${state}`
    window.location.href = authorizeUrl
  }

  if (isConfigured) {
    return (
      <div className="min-h-full w-full flex items-center justify-center p-6 bg-transparent">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full bg-white dark:bg-slate-800/50 rounded-[32px] p-10 border border-slate-200 dark:border-slate-700/50 shadow-2xl text-center"
        >
          <div className="h-20 w-20 bg-blue-50 dark:bg-blue-500/10 rounded-3xl flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="h-10 w-10 text-blue-600 dark:text-blue-400" />
          </div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white mb-3">Configuration Complete!</h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium mb-8">
            Your Zoom account is successfully connected. We're getting your workspace ready.
          </p>
          <div className="flex items-center gap-3 justify-center text-blue-600 dark:text-blue-400 font-bold text-sm">
            <div className="h-2 w-2 rounded-full bg-blue-600 animate-ping" />
            Updating interface...
          </div>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-full w-full min-w-0 max-w-full box-border p-2 transition-colors duration-500 sm:p-2 lg:p-4 xl:p-6 2xl:p-8">
      {/* Premium Header */}
      <motion.div
        className="mb-6 rounded-2xl border border-slate-200/60 p-4 sm:p-5 bg-white dark:bg-slate-800/50 shadow-sm dark:border-slate-700/50"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 font-bold text-[10px] uppercase tracking-widest">
              <Settings className="h-3 w-3" />
              Project Settings
            </div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-2xl">
              Zoom Configuration
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-xs font-medium">
              Project: <span className="text-slate-900 dark:text-white font-bold">{effectiveProject?.projectName || 'No Project Selected'}</span>
            </p>
          </div>
        </div>
      </motion.div>

      <div className="max-w-2xl mx-auto">
        <AnimatePresence mode="wait">
          {showSuccessMessage && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-6"
            >
              <Alert className="bg-green-50 dark:bg-green-500/10 border-green-200 rounded-2xl">
                <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                <AlertTitle className="text-green-800 font-bold">Success</AlertTitle>
                <AlertDescription className="text-green-700 dark:text-green-400 font-medium">
                  Zoom account configured successfully! Refreshing to update interface...
                </AlertDescription>
              </Alert>
            </motion.div>
          )}

          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-6"
            >
              <Alert variant="destructive" className="rounded-2xl">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle className="font-bold">Configuration Error</AlertTitle>
                <AlertDescription className="font-medium">
                  {error}
                </AlertDescription>
              </Alert>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Single OAuth Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="group relative flex flex-col bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 transition-all duration-300 rounded-[24px] p-6 sm:p-8 shadow-xl shadow-blue-900/5">
            <div className="flex items-start justify-between mb-6">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-600/30">
                <Video className="h-7 w-7" />
              </div>
              <div className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-blue-100 text-blue-700 dark:text-blue-400">
                Secure Connection
              </div>
            </div>

            <div className="mb-8">
              <h3 className="text-xl font-black text-slate-900 dark:text-white mb-2">Connect Zoom Account</h3>
              <p className="text-slate-500 dark:text-slate-400 text-sm font-medium leading-relaxed">
                Connect your Zoom account using OAuth 2.0 for secure access to your meetings, webinars, and profile.
              </p>

              <div className="mt-6 space-y-3">
                <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-400 font-medium">
                  <div className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                  Sync your Zoom meetings and webinars
                </div>
                <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-400 font-medium">
                  <div className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                  View real-time participant status
                </div>
                <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-400 font-medium">
                  <div className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                  Manage account profile and settings
                </div>
              </div>
            </div>

            <Button
              onClick={handleConnectZoom}
              className="w-full h-12 rounded-2xl flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98] bg-blue-600 text-white shadow-xl shadow-blue-600/20 font-bold"
            >
              <Video className="h-4 w-4" />
              Sign in with Zoom
            </Button>

            <p className="mt-4 text-center text-[10px] text-slate-400 dark:text-slate-500 font-medium">
              You will be redirected to Zoom's secure authentication page.
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

export default Configuration
