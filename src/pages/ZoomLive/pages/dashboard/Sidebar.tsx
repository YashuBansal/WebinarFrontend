import { NavLink, useParams } from "react-router-dom"
import { Button } from "@zoom/components/ui/button"
import { Home, Settings, User, Video } from "lucide-react"
import { useProject } from "@zoom/context/ProjectContext"
import { isProjectConfigured } from "@zoom/lib/projectUtils"
import { useZoomProject } from "@zoom/hooks/useZoomProjects"

function Sidebar() {
  const { projectId } = useParams<{ projectId: string }>()
  const { project } = useProject()
  const { data: projectData } = useZoomProject(projectId)

  // Prefer fresh API data so sidebar updates right after OAuth (context/localStorage can be stale)
  const effectiveProject = projectData ?? project
  const isConfigured = isProjectConfigured(effectiveProject)

  // Show configuration only when not configured
  const configurationItems = [
    { name: "Configuration", path: `/zoom/dashboard/${projectId}/configuration`, icon: Settings },
  ]

  // Show these items only if project is configured
  const configuredOnlyItems = [
    { name: "Profile", path: `/zoom/dashboard/${projectId}/profile`, icon: User },
    { name: "Meetings", path: `/zoom/dashboard/${projectId}/meetings`, icon: Video },
    { name: "Webinars", path: `/zoom/dashboard/${projectId}/webinars`, icon: Video },
  ]

  // Combine items based on configuration status
  const navItems = isConfigured
    ? configuredOnlyItems
    : configurationItems

  return (
    <aside className="w-56 md:w-64 bg-white/90 dark:bg-gray-800/90 border-r min-h-screen p-4 flex flex-col gap-6 shadow-sm">
      <div className="flex items-center gap-2 mb-2 px-2">
        <Home className="h-6 w-6 text-primary" />
        <span className="font-bold text-lg tracking-tight text-primary">
          {effectiveProject?.projectName || 'Zoom Project'}
        </span>
      </div>
      <nav className="flex flex-col gap-2">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              [
                "group flex items-center px-4 py-2 rounded-md transition-colors font-medium text-sm",
                isActive
                  ? "bg-primary/10 text-primary"
                  : "hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200"
              ].join(" ")
            }
          >
            <Button variant="ghost" className="w-full justify-start px-0 py-0 h-auto text-inherit cursor-pointer">
              {item.icon && <item.icon className="mr-2 h-4 w-4" />}
              {item.name}
            </Button>
          </NavLink>
        ))}
      </nav>

      {/* Configuration Status Indicator */}
      <div className="mt-auto">
        <div className={`px-3 py-2 rounded-md text-xs font-medium ${isConfigured
            ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
            : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
          }`}>
          {isConfigured ? "✅ Configured" : "⚠️ Setup Required"}
        </div>
      </div>
    </aside>
  )
}

export default Sidebar
