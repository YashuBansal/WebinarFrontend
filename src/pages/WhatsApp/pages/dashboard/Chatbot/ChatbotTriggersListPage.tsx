import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { 
  Plus, 
  Pencil, 
  Trash2, 
  Power, 
  PowerOff, 
  MessageSquare, 
  Bot, 
  Zap, 
  ExternalLink, 
  Type,
  AlertTriangle,
  X,
  Play,
  Pause,
  Sparkles
} from "lucide-react";
import { useProjectContext } from "@/context/ProjectContext";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import ConfirmDeleteModal from "../../../../../components/ConfirmDeleteModal";
import { 
  useChatbotTriggers, 
  useDeleteChatbotTrigger, 
  useToggleChatbotTrigger 
} from "@/hooks/useChatbotTriggers";
import type { ChatbotTriggerResponse } from "@/api/modules/chatbotTriggers";
import { toastUtils } from "../../../lib/utils";

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
      { 
        onSuccess: () => { 
          toastUtils.success("Trigger deleted successfully");
          setDeleteOpen(false); 
          setSelected(null); 
        },
        onError: (err) => {
          toastUtils.error(err, "Failed to delete trigger");
        }
      }
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
      { 
        onSuccess: () => { 
          toastUtils.success(`Trigger ${!selected.enabled ? 'activated' : 'paused'} successfully`);
          setToggleOpen(false); 
          setSelected(null); 
        },
        onError: (err) => {
          toastUtils.error(err, `Failed to ${!selected.enabled ? 'activate' : 'pause'} trigger`);
        }
      }
    );
  };

  const preview = (t: ChatbotTriggerResponse) => {
    const v = t.responseValue || "";
    return v.length > 80 ? v.slice(0, 80) + "…" : v;
  };

  return (
    <div className="min-h-full w-full min-w-0 max-w-full box-border p-2 transition-colors duration-500 sm:p-2 md:p-0 lg:p-0 xl:p-2 2xl:p-4">
      {/* Premium Header */}
      <motion.div
        className="mb-6 rounded-2xl border border-slate-200/60 p-4 sm:p-5 bg-white dark:bg-slate-800/50 shadow-sm dark:border-slate-700/50"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-green-600 dark:text-green-400 font-bold text-xs uppercase tracking-widest mb-1">
              <Bot className="h-3.5 w-3.5" />
              Automations
            </div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-2xl">
              Chatbot Triggers
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-xs font-medium">
              Configure keyword-based <span className="text-slate-900 dark:text-white font-bold">Auto Replies</span> for your WhatsApp messages
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link to={`/whatsapp/dashboard/${projectId}/chatbot/create`}>
              <Button
                className="h-11 px-6 rounded-xl flex items-center gap-2 font-bold text-sm shadow-lg shadow-green-600/20 bg-[#22B573] hover:bg-[#1da467] text-white transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">Create Trigger</span>
                <span className="sm:hidden">Create</span>
              </Button>
            </Link>
          </div>
        </div>
      </motion.div>

      <main className="container mx-auto pb-12">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-24 space-y-4">
            <div className="h-12 w-12 rounded-2xl bg-green-50 dark:bg-green-500/10 flex items-center justify-center">
              <div className="h-6 w-6 border-2 border-green-600 border-t-transparent rounded-full animate-spin" />
            </div>
            <p className="text-slate-400 text-sm font-medium animate-pulse">Fetching triggers...</p>
          </div>
        ) : triggers.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center py-24 px-4 text-center bg-white dark:bg-slate-800/50 border border-dashed border-slate-200 dark:border-slate-700/50 rounded-2xl"
          >
            <div className="h-20 w-20 rounded-3xl bg-slate-50 dark:bg-slate-900/50 flex items-center justify-center mb-6">
              <Zap className="h-10 w-10 text-slate-300" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">No Triggers Found</h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm max-w-xs mb-8">
              Start by creating your first chatbot trigger to automate your customer interactions.
            </p>
            <Link to={`/whatsapp/dashboard/${projectId}/chatbot/create`}>
              <Button
                variant="outline"
                className="h-11 px-8 rounded-xl font-bold text-sm hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-all active:scale-95"
              >
                Create your first trigger
              </Button>
            </Link>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            <AnimatePresence mode="popLayout">
              {triggers.map((trigger, index) => (
                <motion.div
                  key={trigger._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: index * 0.05 }}
                  className="group relative bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 hover:border-green-400/50 dark:hover:border-green-500/50 hover:shadow-xl hover:shadow-green-900/5 dark:hover:shadow-green-500/10 rounded-2xl p-5 sm:p-6 transition-all duration-300 overflow-hidden"
                >
                  <div className="absolute top-0 right-0 -mr-12 -mt-12 h-32 w-32 rounded-full bg-green-500/5 blur-[40px] opacity-0 group-hover:opacity-100 transition-opacity" />

                  <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${trigger.enabled ? 'bg-green-50 dark:bg-green-500/10 text-green-600 dark:text-green-400' : 'bg-slate-50 dark:bg-slate-900/50 text-slate-400'}`}>
                          <MessageSquare className="h-5 w-5" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <h3 className="text-lg font-black text-slate-900 dark:text-white truncate">
                              &quot;{trigger.keyword}&quot;
                            </h3>
                            <Badge variant="outline" className={`rounded-lg px-2 py-0 h-5 text-[10px] font-bold uppercase tracking-wider ${trigger.responseType === 'link' ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-100 dark:border-blue-500/20' : 'bg-green-50 dark:bg-green-500/10 text-green-600 dark:text-green-400 border-green-100 dark:border-green-500/20'}`}>
                              {trigger.responseType === 'link' ? (
                                <span className="flex items-center gap-1"><ExternalLink className="h-2.5 w-2.5" /> Link</span>
                              ) : (
                                <span className="flex items-center gap-1"><Type className="h-2.5 w-2.5" /> Text</span>
                              )}
                            </Badge>
                          </div>
                          <p className="text-slate-500 dark:text-slate-400 text-xs font-medium truncate max-w-md">
                            Response: {preview(trigger)}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <div className="flex items-center bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-700/50 rounded-xl p-1 gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleToggleClick(trigger)}
                          disabled={toggling}
                          className={`h-9 px-3 rounded-lg flex items-center gap-2 font-bold text-xs transition-all ${trigger.enabled
                            ? "bg-white dark:bg-slate-800/50 text-green-600 dark:text-green-400 shadow-sm border border-slate-100 dark:border-slate-700/50"
                            : "text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-900/60"
                            }`}
                        >
                          {trigger.enabled ? <Power className="h-3.5 w-3.5" /> : <PowerOff className="h-3.5 w-3.5" />}
                          {trigger.enabled ? "Active" : "Paused"}
                        </Button>

                        <Link to={`/whatsapp/dashboard/${projectId}/chatbot/${trigger._id}/edit`}>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-9 w-9 p-0 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/50 transition-all"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                        </Link>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteClick(trigger)}
                          disabled={deleting}
                          className="h-9 w-9 p-0 rounded-lg text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </main>

      {/* Premium Delete Confirmation Modal */}
      {deleteOpen && selected && (
        <ConfirmDeleteModal
          setModal={(val) => {
            if (!val) {
              setDeleteOpen(false);
              setSelected(null);
            }
          }}
          triggerDelete={handleDelete}
          isLoading={deleting}
          itemName={selected.keyword}
        />
      )}

      {/* Premium Toggle (Pause/Activate) Modal */}
      <Dialog
        open={toggleOpen}
        onOpenChange={(open) => {
          if (!open) {
            setToggleOpen(false);
            setSelected(null);
          }
        }}
      >
        <DialogContent
          className="max-w-sm border-0 bg-transparent p-0 shadow-none outline-none"
          onPointerDownOutside={(e) => e.preventDefault()}
          showCloseButton={false}
        >
          <div className="relative w-full rounded-2xl p-6 shadow-2xl flex flex-col bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${selected?.enabled ? 'bg-orange-50 text-orange-500' : 'bg-green-50 dark:bg-green-500/10 text-green-500'}`}>
                  {selected?.enabled ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  {selected?.enabled ? 'Pause' : 'Activate'} Trigger
                </h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setToggleOpen(false);
                  setSelected(null);
                }}
                className="p-1.5 rounded-lg hover:bg-black/5 transition-colors"
              >
                <X className="w-5 h-5 text-gray-500 dark:text-slate-400" />
              </button>
            </div>

            <div className="mb-8">
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400 leading-relaxed">
                Are you sure you want to <span className={`font-bold ${selected?.enabled ? 'text-orange-600' : 'text-green-600 dark:text-green-400'}`}>{selected?.enabled ? 'pause' : 'activate'}</span> the chatbot trigger for <span className="text-slate-900 dark:text-white font-bold">"{selected?.keyword}"</span>?
              </p>
              {selected?.enabled && (
                <div className="mt-4 p-3 rounded-xl bg-orange-50 border border-orange-100 flex items-start gap-3">
                  <AlertTriangle className="h-4 w-4 text-orange-500 mt-0.5 shrink-0" />
                  <p className="text-[11px] font-medium text-orange-700">
                    While paused, the chatbot will not automatically respond to this keyword.
                  </p>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 mt-auto w-full">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setToggleOpen(false);
                  setSelected(null);
                }}
                disabled={toggling}
                className="rounded-xl px-4 py-2.5 font-medium border-slate-200 dark:border-slate-700/50 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900/50 flex-1"
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleToggleConfirm}
                disabled={toggling}
                className={`rounded-xl px-6 py-2.5 font-bold hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 text-white shadow-lg flex-1 ${
                  selected?.enabled 
                    ? 'bg-orange-500 hover:bg-orange-600 shadow-orange-600/20' 
                    : 'bg-[#22B573] hover:bg-[#1da467] shadow-green-600/20'
                }`}
              >
                {toggling && <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }} className="mr-2"><Sparkles className="h-4 w-4" /></motion.div>}
                Confirm {selected?.enabled ? 'Pause' : 'Activate'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}


