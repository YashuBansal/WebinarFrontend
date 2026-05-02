import { useParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import AutoMessageConfigsList from "./AutoMessageConfigsList";

export default function AutoMessageConfigsListPage() {
  const { projectId } = useParams<{ projectId: string }>();

  return (
    <div className="p-6 space-y-6 overflow-y-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">
            Auto Message Configurations
          </h1>
          <p className="text-sm text-muted-foreground">
            Manage auto message configurations for webinar registrations
          </p>
        </div>
        <Link to={`/whatsapp/dashboard/${projectId}/auto-message/create`}>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Create New Configuration
          </Button>
        </Link>
      </div>

      <AutoMessageConfigsList />
    </div>
  );
}


