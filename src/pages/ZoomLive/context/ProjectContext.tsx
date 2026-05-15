import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import type { ZoomProject } from '@zoom/schemas/zoom'

type ProjectContextValue = {
  project: ZoomProject | null
  setProject: (project: ZoomProject | null) => void
}

const ProjectContext = createContext<ProjectContextValue | undefined>(undefined)

export function ProjectProvider({ children }: { children: React.ReactNode }) {
  const [project, setProjectState] = useState<ZoomProject | null>(null)

  useEffect(() => {
    const stored = localStorage.getItem('wlh-zoom:selectedProject')
    if (stored) {
      try {
        setProjectState(JSON.parse(stored))
      } catch {}
    }
  }, [])

  const setProject = (p: ZoomProject | null) => {
    setProjectState(p)
    if (p) localStorage.setItem('wlh-zoom:selectedProject', JSON.stringify(p))
    else localStorage.removeItem('wlh-zoom:selectedProject')
  }

  const value = useMemo(() => ({ project, setProject }), [project])
  return <ProjectContext.Provider value={value}>{children}</ProjectContext.Provider>
}

export function useProject() {
  const ctx = useContext(ProjectContext)
  if (!ctx) throw new Error('useProject must be used within ProjectProvider')
  return ctx
}


