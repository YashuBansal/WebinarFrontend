import { Link, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { formatDateTime12 } from "@/lib/date";
import { listAutomations } from "@/api/modules/automations";
import type { AutomationFlow } from "@/api/modules/automations";

export default function AutomationsList() {
  const { projectId } = useParams<{ projectId: string }>();
  const [items, setItems] = useState<AutomationFlow[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!projectId) return;
    setLoading(true);
    listAutomations(projectId)
      .then((res) => setItems(res))
      .finally(() => setLoading(false));
  }, [projectId]);

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-semibold">Automation Flows</h1>
        <Link to={`/whatsapp/dashboard/${projectId}/automations/new`}>
          <Button>Create New Flow</Button>
        </Link>
      </div>
      {loading ? (
        <div className="text-sm text-muted-foreground">Loading...</div>
      ) : items.length === 0 ? (
        <div className="text-sm text-muted-foreground">No automations yet. Click "Create New Flow" to get started.</div>
      ) : (
        <div className="space-y-2">
          {items.map((a) => (
            <Link key={a._id} to={`/whatsapp/dashboard/${projectId}/automations/${a._id}`} className="block border rounded-md p-3 hover:bg-muted/30">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">{a.name}</div>
                  <div className="text-xs text-muted-foreground">Status: {a.status}</div>
                </div>
                <div className="text-xs text-muted-foreground">{formatDateTime12(a.createdAt)}</div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}



