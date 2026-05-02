import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useUpdateChatbotTrigger, useChatbotTriggers } from "@/hooks/useChatbotTriggers";
import { useProjectContext } from "@/context/ProjectContext";
import type { ResponseType } from "@/api/modules/chatbotTriggers";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";

export default function EditChatbotTriggerPage() {
  const { projectId, triggerId } = useParams<{ projectId: string; triggerId: string }>();
  const { selectedProject } = useProjectContext();
  const navigate = useNavigate();
  const pid = selectedProject?._id ?? projectId ?? "";

  const { data: triggers = [], isLoading } = useChatbotTriggers(pid);
  const trigger = triggers.find((t) => t._id === triggerId);

  const [keyword, setKeyword] = useState("");
  const [responseType, setResponseType] = useState<ResponseType>("text");
  const [responseValue, setResponseValue] = useState("");
  const [enabled, setEnabled] = useState(true);

  useEffect(() => {
    if (trigger) {
      setKeyword(trigger.keyword);
      setResponseType(trigger.responseType);
      setResponseValue(trigger.responseValue ?? "");
      setEnabled(trigger.enabled ?? true);
    }
  }, [trigger]);

  const { mutate: updateTrigger, isPending: saving } = useUpdateChatbotTrigger();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pid || !triggerId || !keyword.trim() || !responseValue.trim()) return;
    updateTrigger(
      {
        triggerId,
        projectId: pid,
        keyword: keyword.trim(),
        responseType,
        responseValue: responseValue.trim(),
        enabled,
      },
      {
        onSuccess: () => navigate(`/whatsapp/dashboard/${projectId}/chatbot`),
      }
    );
  };

  if (isLoading || (!trigger && triggers.length > 0)) {
    return (
      <div className="p-6">
        <div className="text-sm text-muted-foreground">Loading…</div>
      </div>
    );
  }

  if (!trigger) {
    return (
      <div className="p-6 space-y-4">
        <p className="text-sm text-muted-foreground">Trigger not found.</p>
        <Link to={`/whatsapp/dashboard/${projectId}/chatbot`}>
          <Button variant="outline">Back to Chatbot</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-2xl">
      <div className="flex items-center gap-4">
        <Link to={`/whatsapp/dashboard/${projectId}/chatbot`}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-xl font-semibold">Edit trigger</h1>
          <p className="text-sm text-muted-foreground">
            Update keyword and response. Reply is matched if it contains the keyword (substring, case-insensitive).
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="keyword">Keyword</Label>
          <Input
            id="keyword"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="e.g. link"
            required
          />
        </div>

        <div className="space-y-2">
          <Label>Response type</Label>
          <Select
            value={responseType}
            onValueChange={(v) => setResponseType(v as ResponseType)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="link">Link</SelectItem>
              <SelectItem value="text">Text</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="responseValue">
            {responseType === "link" ? "URL" : "Message text"}
          </Label>
          {responseType === "link" ? (
            <Input
              id="responseValue"
              type="url"
              value={responseValue}
              onChange={(e) => setResponseValue(e.target.value)}
              placeholder="https://example.com"
              required
            />
          ) : (
            <textarea
              id="responseValue"
              className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              value={responseValue}
              onChange={(e) => setResponseValue(e.target.value)}
              placeholder="Your reply message..."
              required
            />
          )}
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox
            id="enabled"
            checked={enabled}
            onCheckedChange={(c) => setEnabled(c === true)}
          />
          <Label htmlFor="enabled" className="text-sm font-normal cursor-pointer">
            Enabled (trigger is active)
          </Label>
        </div>

        <div className="flex gap-2">
          <Button type="submit" disabled={saving}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save changes
          </Button>
          <Link to={`/whatsapp/dashboard/${projectId}/chatbot`}>
            <Button type="button" variant="outline">
              Cancel
            </Button>
          </Link>
        </div>
      </form>
    </div>
  );
}

