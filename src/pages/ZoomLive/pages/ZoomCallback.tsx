import { useEffect, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useProject } from '../context/ProjectContext'
import { useExchangeOAuthCode } from '../hooks/useZoom'

export default function ZoomCallback() {
  const [params] = useSearchParams()
  const code = params.get('code')
  const state = params.get('state')
  const navigate = useNavigate()
  const { project } = useProject()
  const hasExchangedRef = useRef(false)

  const projectId = state || project?._id || ''

  const exchangeMutation = useExchangeOAuthCode(
    () => {
      // Project will be updated with Zoom credentials by the backend
      console.log('OAuth success, navigating to profile for project:', projectId)
      navigate(`/zoom/dashboard/${projectId}/profile`, { replace: true })
    },
    (error) => {
      console.error('OAuth error, navigating to configuration:', error)
      navigate(`/zoom/dashboard/${projectId}/configuration`, { replace: true })
    }
  )

  useEffect(() => {
    if (code && !hasExchangedRef.current) {
      hasExchangedRef.current = true
      const redirectUri = `${window.location.origin}/zoom/callback`
      exchangeMutation.mutate({
        code,
        state: state || '',
        redirectUri,
        projectId,
      })
    }
  }, [code, state, projectId, exchangeMutation])

  return (
    <div className="p-6">Connecting your Zoom account...</div>
  )
}


