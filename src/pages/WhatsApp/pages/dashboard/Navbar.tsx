
import { useProjectContext } from "@/context/ProjectContext";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export default function Navbar() {
  const { selectedProject } = useProjectContext();
  const navigate = useNavigate();

  const handleChangeProject = () => {
    navigate("/whatsapp");
  };

  return (
    <header className="w-full bg-white/80 dark:bg-gray-900/80 border-b px-4 md:px-8 py-3 flex items-center justify-between shadow-sm">
      <div className="flex items-center gap-3">
        <Avatar className="h-8 w-8">
          <AvatarFallback>PRJ</AvatarFallback>
        </Avatar>
        <h2 className="text-xl font-semibold tracking-tight">Dashboard</h2>
      </div>
      {selectedProject && (
        <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
          <span className="hidden sm:inline">Project:</span>
          <strong className="truncate max-w-[120px] md:max-w-[200px]">{selectedProject.projectName}</strong>
          <Button
            onClick={handleChangeProject}
            size="sm"
            variant="outline"
            className="ml-2 px-2 py-1 text-xs"
            title="Change Project"
          >
            Change
          </Button>
        </div>
      )}
    </header>
  );
}
