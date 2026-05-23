import { useState } from 'react'
import { useZoomProjectMutations } from '@zoom/hooks/useZoomProjects'

interface ZoomProjectConfigurationFormProps {
  onSuccess?: () => void
}

export function ZoomProjectConfigurationForm({ onSuccess }: ZoomProjectConfigurationFormProps) {
  const [projectName, setProjectName] = useState('')
  const [accountId, setAccountId] = useState('')
  const [clientId, setClientId] = useState('')
  const [clientSecret, setClientSecret] = useState('')
  const [secretToken, setSecretToken] = useState('')
  const [error, setError] = useState<string | null>(null)
  
  const { useValidateAndCreateZoomProject } = useZoomProjectMutations()
  const { mutate: validateAndCreate, isPending } = useValidateAndCreateZoomProject()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!projectName.trim()) return setError('Project name is required')
    if (!accountId.trim()) return setError('Account ID is required')
    if (!clientId.trim()) return setError('Client ID is required')
    if (!clientSecret.trim()) return setError('Client Secret is required')

    validateAndCreate(
      { projectName: projectName.trim(), accountId: accountId.trim(), clientId: clientId.trim(), clientSecret: clientSecret.trim(), secretToken: secretToken.trim() || undefined },
      {
        onSuccess: () => {
          setProjectName('')
          setAccountId('')
          setClientId('')
          setClientSecret('')
          setSecretToken('')
          onSuccess?.()
        },
        onError: (error: any) => {
          setError(error?.message || 'Failed to create project')
        },
      }
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="projectName" className="block text-sm font-medium text-gray-700 mb-2">
          Project Name
        </label>
        <input
          id="projectName"
          type="text"
          value={projectName}
          onChange={(e) => setProjectName(e.target.value)}
          placeholder="e.g., Marketing Campaign"
          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          disabled={isPending}
        />
        {error && (
          <p className="mt-1 text-sm text-red-600">{error}</p>
        )}
      </div>

      <div>
        <label htmlFor="accountId" className="block text-sm font-medium text-gray-700 mb-2">
          Account ID
        </label>
        <input
          id="accountId"
          type="text"
          value={accountId}
          onChange={(e) => setAccountId(e.target.value)}
          placeholder="Zoom Account ID"
          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          disabled={isPending}
        />
      </div>

      <div>
        <label htmlFor="clientId" className="block text-sm font-medium text-gray-700 mb-2">
          Client ID
        </label>
        <input
          id="clientId"
          type="text"
          value={clientId}
          onChange={(e) => setClientId(e.target.value)}
          placeholder="Zoom Client ID"
          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          disabled={isPending}
        />
      </div>

      <div>
        <label htmlFor="clientSecret" className="block text-sm font-medium text-gray-700 mb-2">
          Client Secret
        </label>
        <input
          id="clientSecret"
          type="password"
          value={clientSecret}
          onChange={(e) => setClientSecret(e.target.value)}
          placeholder="Zoom Client Secret"
          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          disabled={isPending}
        />
      </div>

      <div>
        <label htmlFor="secretToken" className="block text-sm font-medium text-gray-700 mb-2">
          Webhook Secret Token (optional)
        </label>
        <input
          id="secretToken"
          type="text"
          value={secretToken}
          onChange={(e) => setSecretToken(e.target.value)}
          placeholder="Webhook secret token"
          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          disabled={isPending}
        />
      </div>

      <button
        type="submit"
        disabled={isPending || !projectName.trim() || !accountId.trim() || !clientId.trim() || !clientSecret.trim()}
        className="w-full bg-black text-white py-2 px-4 rounded-md hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isPending ? 'Validating...' : 'Validate & Create Project'}
      </button>
    </form>
  )
}
