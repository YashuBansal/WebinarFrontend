import type { FormEvent } from 'react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useZoomProjectMutations } from '@zoom/hooks/useZoomProjects'
import { Input } from '@zoom/components/ui/input'
import { Button } from '@zoom/components/ui/button'
import { Loader2, Briefcase, AlertCircle } from 'lucide-react'

interface OAuthProjectCreateFormProps {
  onSuccess?: () => void
}

export function OAuthProjectCreateForm({ onSuccess }: OAuthProjectCreateFormProps) {
  const navigate = useNavigate()
  const [projectName, setProjectName] = useState('')
  const [error, setError] = useState<string | null>(null)

  const { useCreateZoomProject } = useZoomProjectMutations()
  const createMutation = useCreateZoomProject()

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    setError(null)

    const name = projectName.trim()
    if (!name) {
      setError('Project name is required')
      return
    }

    createMutation.mutate(
      { projectName: name },
      {
        onSuccess: (createdProject) => {
          onSuccess?.()
        },
        onError: (err: unknown) => {
          const message =
            err instanceof Error
              ? err.message
              : typeof err === 'object' && err
                ? 'message' in err && typeof (err as { message?: string }).message === 'string'
                  ? (err as { message: string }).message
                  : undefined
                : undefined

          setError(message || 'Failed to create project')
        },
      },
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <label
          htmlFor="projectName"
          className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1"
        >
          Project Name
        </label>
        <div className="relative group">
          <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
          <Input
            id="projectName"
            type="text"
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            placeholder="e.g., Marketing Webinar"
            className="pl-10 h-12 rounded-xl border-slate-200 dark:border-slate-700/50 focus:ring-blue-500/20 bg-slate-50/50 dark:bg-slate-900/50"
            disabled={createMutation.isPending}
            required
          />
        </div>
        <p className="text-[10px] text-slate-400 ml-1">Give your project a name to identify it later.</p>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 text-red-600 dark:text-red-400 text-sm">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <p>{error}</p>
        </div>
      )}

      <Button
        type="submit"
        disabled={createMutation.isPending || !projectName.trim()}
        className="w-full h-12 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-xl shadow-blue-600/20 transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50"
      >
        {createMutation.isPending ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin mr-2" />
            Creating...
          </>
        ) : (
          'Create Project'
        )}
      </Button>
    </form>
  )
}
