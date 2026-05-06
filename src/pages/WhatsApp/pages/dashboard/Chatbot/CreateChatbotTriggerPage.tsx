import { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  ArrowLeft,
  Loader2,
  Save,
  Sparkles,
  Bot,
  MessageSquare,
  Hash,
  Settings2,
  Zap,
  Info
} from "lucide-react";
import { useCreateChatbotTrigger } from "@/hooks/useChatbotTriggers";
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

export default function CreateChatbotTriggerPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const { selectedProject } = useProjectContext();
  const navigate = useNavigate();
  const pid = selectedProject?._id ?? projectId ?? "";

  const [keyword, setKeyword] = useState("");
  const [responseType, setResponseType] = useState<ResponseType>("text");
  const [responseValue, setResponseValue] = useState("");
  const [enabled, setEnabled] = useState(true);

  const { mutate: createTrigger, isPending: saving } = useCreateChatbotTrigger();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pid || !keyword.trim() || !responseValue.trim()) return;
    createTrigger(
      {
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

  return (
    <div className="min-h-full w-full min-w-0 max-w-full box-border p-2 transition-colors duration-500 sm:p-2 md:p-0 lg:p-0 xl:p-2 2xl:p-4">
      {/* Premium Header */}
      <motion.div
        className="mb-6 rounded-2xl border border-slate-200/60 p-4 sm:p-5"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
          backgroundColor: "#ffffff",
          boxShadow: "0 1px 3px rgba(0, 0, 0, 0.05), 0 1px 2px rgba(0, 0, 0, 0.06)",
        }}
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <Link to={`/whatsapp/dashboard/${projectId}/chatbot`}>
              <Button
                variant="ghost"
                size="icon"
                className="h-10 w-10 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-100 transition-all text-slate-500"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-green-600 font-bold text-xs uppercase tracking-widest mb-0.5">
                <Sparkles className="h-3.5 w-3.5" />
                New Automation
              </div>
              <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
                Create Trigger
              </h1>
              <p className="text-slate-500 text-xs font-medium">
                Set up a new keyword-based <span className="text-slate-900 font-bold">Auto Response</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button
              onClick={handleSubmit}
              disabled={saving}
              className="h-11 px-8 rounded-xl flex items-center gap-2 bg-[#22B573] hover:bg-[#1da467] text-white font-bold text-sm shadow-lg shadow-green-600/10 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {saving ? "Creating..." : "Create Trigger"}
            </Button>
          </div>
        </div>
      </motion.div>

      <main className="container mx-auto max-w-4xl space-y-6 pb-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="group relative bg-white border border-slate-200 hover:border-green-400/50 hover:shadow-xl hover:shadow-green-900/5 rounded-[20px] p-6 sm:p-8 transition-all duration-300 overflow-hidden"
        >
          <div className="absolute top-0 right-0 -mr-24 -mt-24 h-64 w-64 rounded-full bg-green-500/5 blur-[80px] opacity-0 group-hover:opacity-100 transition-opacity" />

          <div className="relative z-10">
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Keyword Section */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <div className="h-8 w-8 rounded-lg bg-green-50 flex items-center justify-center text-green-600">
                    <Hash className="h-4 w-4" />
                  </div>
                  <h2 className="text-lg font-black text-slate-900">Trigger Keyword</h2>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="keyword" className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">
                    Keyword (Case-insensitive)
                  </Label>
                  <Input
                    id="keyword"
                    value={keyword}
                    onChange={(e) => setKeyword(e.target.value)}
                    placeholder="e.g. Price, Help, Menu"
                    className="h-12 rounded-xl border-slate-200 bg-slate-50/50 focus:bg-white focus:ring-green-500/20 transition-all font-medium"
                    required
                  />
                  <p className="text-[11px] text-slate-400 font-medium ml-1">
                    The bot will respond if the user's message contains this keyword as a substring.
                  </p>
                </div>
              </div>

              <hr className="border-slate-100" />

              {/* Response Section */}
              <div className="space-y-6">
                <div className="flex items-center gap-2 mb-4">
                  <div className="h-8 w-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                    <MessageSquare className="h-4 w-4" />
                  </div>
                  <h2 className="text-lg font-black text-slate-900">Response Action</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">
                      Response Type
                    </Label>
                    <Select
                      value={responseType}
                      onValueChange={(v) => setResponseType(v as ResponseType)}
                    >
                      <SelectTrigger className="h-12 rounded-xl border-slate-200 bg-slate-50/50 focus:ring-green-500/20 transition-all font-medium">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl border-slate-200 shadow-xl">
                        <SelectItem value="text" className="font-medium">Text Message</SelectItem>
                        <SelectItem value="link" className="font-medium">Web Link / URL</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="md:col-span-2 space-y-2">
                    <Label htmlFor="responseValue" className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">
                      {responseType === "link" ? "Target URL" : "Message Content"}
                    </Label>
                    {responseType === "link" ? (
                      <Input
                        id="responseValue"
                        type="url"
                        value={responseValue}
                        onChange={(e) => setResponseValue(e.target.value)}
                        placeholder="https://yourlink.com"
                        className="h-12 rounded-xl border-slate-200 bg-slate-50/50 focus:bg-white focus:ring-green-500/20 transition-all font-medium"
                        required
                      />
                    ) : (
                      <textarea
                        id="responseValue"
                        className="flex min-h-[120px] w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-400 transition-all custom-scrollbar resize-none"
                        value={responseValue}
                        onChange={(e) => setResponseValue(e.target.value)}
                        placeholder="Type the message to send automatically..."
                        required
                      />
                    )}
                  </div>
                </div>
              </div>

              <hr className="border-slate-100" />

              {/* Status Section */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                  <div className="h-8 w-8 rounded-lg bg-orange-50 flex items-center justify-center text-orange-600">
                    <Settings2 className="h-4 w-4" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-slate-900">Initial Status</h2>
                    <p className="text-[11px] text-slate-400 font-medium">Triggers can be paused anytime</p>
                  </div>
                </div>

                <div
                  className={`flex items-center gap-3 px-4 py-2 rounded-xl border transition-all cursor-pointer ${enabled ? 'bg-green-50 border-green-200 text-green-700 shadow-sm' : 'bg-slate-50 border-slate-200 text-slate-400'}`}
                  onClick={() => setEnabled(!enabled)}
                >
                  <Checkbox
                    id="enabled"
                    checked={enabled}
                    onCheckedChange={(c) => setEnabled(c === true)}
                    className="border-green-500 data-[state=checked]:bg-green-600"
                  />
                  <Label htmlFor="enabled" className="text-xs font-bold cursor-pointer">
                    {enabled ? "Active & Ready" : "Create as Paused"}
                  </Label>
                </div>
              </div>

              {/* Quick Info */}
              <div className="p-4 rounded-2xl bg-blue-50 border border-blue-100 flex gap-4 items-start">
                <div className="h-8 w-8 rounded-lg bg-white border border-blue-100 flex items-center justify-center text-blue-600 shrink-0">
                  <Info className="h-4 w-4" />
                </div>
                <p className="text-[11px] font-medium text-blue-700 leading-relaxed">
                  <span className="font-bold">Pro Tip:</span> Use concise keywords like <span className="italic">"price"</span> or <span className="italic">"address"</span> to capture the most user queries. Avoid long sentences as keywords.
                </p>
              </div>

              <div className="flex items-center gap-3 pt-4">
                <Button
                  type="submit"
                  disabled={saving}
                  className="h-11 flex-1 sm:flex-none sm:px-12 rounded-xl flex items-center justify-center gap-2 bg-[#22B573] hover:bg-[#1da467] text-white font-bold text-sm shadow-lg shadow-green-600/10 transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
                  {saving ? "Creating Trigger..." : "Create Trigger Now"}
                </Button>
                <Link to={`/whatsapp/dashboard/${projectId}/chatbot`}>
                  <Button
                    type="button"
                    variant="ghost"
                    className="h-11 px-8 rounded-xl font-bold text-sm text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all"
                  >
                    Cancel
                  </Button>
                </Link>
              </div>
            </form>
          </div>
        </motion.div>
      </main>
    </div>
  );
}


