import { useState } from 'react'
import { useZoomProjectMutations } from '@zoom/hooks/useZoomProjects'

interface ZoomProjectFormProps {
  onSuccess?: () => void
}

export function ZoomProjectForm({ onSuccess }: ZoomProjectFormProps) {
  const [projectName, setProjectName] = useState('')
  const [error, setError] = useState<string | null>(null)
  
  const { useCreateZoomProject } = useZoomProjectMutations()
  const { mutate: createProject, isPending } = useCreateZoomProject()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!projectName.trim()) {
      setError('Project name is required')
      return
    }

    createProject(
      { projectName: projectName.trim() },
      {
        onSuccess: () => {
          setProjectName('')
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

      <button
        type="submit"
        disabled={isPending || !projectName.trim()}
        className="w-full bg-black text-white py-2 px-4 rounded-md hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isPending ? 'Creating...' : 'Create Project'}
      </button>
    </form>
  )
}
