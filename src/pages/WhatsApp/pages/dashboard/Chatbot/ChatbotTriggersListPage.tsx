import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Plus, Pencil, Trash2, Power, PowerOff } from "lucide-react";
import { useProjectContext } from "@/context/ProjectContext";
import { Badge } from "@/components/ui/badge";
import { ConfirmationDialog } from "@/components/ui/ConfirmationDialog";
import {
  useChatbotTriggers,
  useDeleteChatbotTrigger,
  useToggleChatbotTrigger,
} from "@/hooks/useChatbotTriggers";
import type { ChatbotTriggerResponse } from "@/api/modules/chatbotTriggers";

export default function ChatbotTriggersListPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const { selectedProject } = useProjectContext();
  const { data: triggers = [], isLoading } = useChatbotTriggers(selectedProject?._id ?? projectId);
  const { mutate: deleteTrigger, isPending: deleting } = useDeleteChatbotTrigger();
  const { mutate: toggleTrigger, isPending: toggling } = useToggleChatbotTrigger();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [toggleOpen, setToggleOpen] = useState(false);
  const [selected, setSelected] = useState<ChatbotTriggerResponse | null>(null);

  const handleDeleteClick = (trigger: ChatbotTriggerResponse) => {
    setSelected(trigger);
    setDeleteOpen(true);
  };

  const handleDelete = () => {
    const pid = selectedProject?._id ?? projectId;
    if (!selected || !pid) return;
    deleteTrigger(
      { triggerId: selected._id, projectId: pid },
      { onSuccess: () => { setDeleteOpen(false); setSelected(null); } }
    );
  };

  const handleToggleClick = (trigger: ChatbotTriggerResponse) => {
    setSelected(trigger);
    setToggleOpen(true);
  };

  const handleToggleConfirm = () => {
    const pid = selectedProject?._id ?? projectId;
    if (!selected || !pid) return;
    toggleTrigger(
      { triggerId: selected._id, projectId: pid, enabled: !selected.enabled },
      { onSuccess: () => { setToggleOpen(false); setSelected(null); } }
    );
  };

  const preview = (t: ChatbotTriggerResponse) => {
    const v = t.responseValue || "";
    return v.length > 50 ? v.slice(0, 50) + "…" : v;
  };

  return (
    <div className="p-6 space-y-6 overflow-y-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Chatbot</h1>
          <p className="text-sm text-muted-foreground">
            Create and configure triggers. When a user&apos;s reply contains a keyword (substring, case-insensitive), send a configured response.
          </p>
        </div>
        <Link to={`/whatsapp/dashboard/${projectId}/chatbot/create`}>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Create trigger
          </Button>
        </Link>
      </div>

      {isLoading && (
        <div className="text-sm text-muted-foreground">Loading triggers…</div>
      )}
      {!isLoading && triggers.length === 0 && (
        <div className="text-sm text-muted-foreground">No triggers yet. Create one to get started.</div>
      )}
      {!isLoading && triggers.length > 0 && (
        <div className="space-y-3">
          {triggers.map((trigger) => (
            <div
              key={trigger._id}
              className="p-4 border rounded-lg bg-card hover:bg-accent/50 transition-colors shadow-sm"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-semibold text-foreground">
                      Keyword: &quot;{trigger.keyword}&quot;
                    </h3>
                    <Badge variant="secondary" className="text-xs">
                      {trigger.responseType === "link" ? "Link" : "Text"}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground break-all">
                    Response: {preview(trigger)}
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Badge
                    variant={trigger.enabled ? "default" : "secondary"}
                    className={trigger.enabled ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" : ""}
                  >
                    {trigger.enabled ? "Enabled" : "Disabled"}
                  </Badge>
                  {trigger.enabled ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleToggleClick(trigger)}
                      disabled={toggling}
                      className="h-8 px-2"
                      title="Disable"
                    >
                      <PowerOff className="h-4 w-4 mr-1" />
                      Disable
                    </Button>
                  ) : (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleToggleClick(trigger)}
                      disabled={toggling}
                      className="h-8 px-2"
                      title="Enable"
                    >
                      <Power className="h-4 w-4 mr-1" />
                      Enable
                    </Button>
                  )}
                  <Link to={`/whatsapp/dashboard/${projectId}/chatbot/${trigger._id}/edit`}>
                    <Button variant="ghost" size="sm" className="h-8 px-2" title="Edit">
                      <Pencil className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                  </Link>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteClick(trigger)}
                    className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                    title="Delete"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <ConfirmationDialog
        isOpen={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDelete}
        title="Delete trigger"
        description={`Are you sure you want to delete the trigger for keyword "${selected?.keyword}"?`}
        confirmText="Delete"
        cancelText="Cancel"
        variant="destructive"
        isLoading={deleting}
      />
      <ConfirmationDialog
        isOpen={toggleOpen}
        onClose={() => setToggleOpen(false)}
        onConfirm={handleToggleConfirm}
        title={selected?.enabled ? "Disable trigger" : "Enable trigger"}
        description={`Are you sure you want to ${selected?.enabled ? "disable" : "enable"} the trigger for "${selected?.keyword}"?`}
        confirmText={selected?.enabled ? "Disable" : "Enable"}
        cancelText="Cancel"
        variant="default"
        isLoading={toggling}
      />
    </div>
  );
}

