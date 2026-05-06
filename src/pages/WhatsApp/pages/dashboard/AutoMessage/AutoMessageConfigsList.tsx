import { useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useProjectContext } from "@/context/ProjectContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Trash2, 
  Power, 
  PowerOff, 
  Image as ImageIcon, 
  CheckCircle2, 
  XCircle, 
  Calendar, 
  MessageSquare,
  ChevronRight,
  Sparkles,
  X,
  AlertTriangle,
  Pause,
  Play
} from "lucide-react";
import { useAutoMessageConfigs, useDeleteAutoMessageConfig, useToggleAutoMessageConfig } from "@/hooks/useAutoMessageConfigs";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import ConfirmDeleteModal from "../../../../../components/ConfirmDeleteModal";
import { toastUtils } from "@/lib/utils";

export default function AutoMessageConfigsList() {
  const { selectedProject } = useProjectContext();
  const { data: configs = [], isLoading: loading } = useAutoMessageConfigs(selectedProject?._id);
  const { mutate: deleteConfig, isPending: deleting } = useDeleteAutoMessageConfig();
  const { mutate: toggleConfig, isPending: toggling } = useToggleAutoMessageConfig();
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [toggleModalOpen, setToggleModalOpen] = useState(false);
  const [selectedConfig, setSelectedConfig] = useState<typeof configs[0] | null>(null);

  const handleDeleteClick = (config: typeof configs[0]) => {
    setSelectedConfig(config);
    setDeleteModalOpen(true);
  };

  const handleDelete = () => {
    if (!selectedConfig || !selectedProject?._id) return;
    
    deleteConfig(
      { _id: selectedConfig.id, projectId: selectedProject._id },
      {
        onSuccess: () => {
          toastUtils.success("Configuration deleted successfully");
          setDeleteModalOpen(false);
          setSelectedConfig(null);
        },
        onError: (err) => {
          toastUtils.error(err, "Failed to delete configuration");
        }
      }
    );
  };

  const handleToggleClick = (config: typeof configs[0]) => {
    setSelectedConfig(config);
    setToggleModalOpen(true);
  };

  const handleToggleConfirm = () => {
    if (!selectedConfig || !selectedProject?._id) return;
    toggleConfig(
      {
        _id: selectedConfig.id,
        projectId: selectedProject._id,
        enabled: !selectedConfig.enabled,
      },
      {
        onSuccess: () => {
          toastUtils.success(`Configuration ${!selectedConfig.enabled ? 'activated' : 'paused'} successfully`);
          setToggleModalOpen(false);
          setSelectedConfig(null);
        },
        onError: (err) => {
          toastUtils.error(err, `Failed to ${!selectedConfig.enabled ? 'activate' : 'pause'} configuration`);
        }
      }
    );
  };

  if (loading) {
    return (
      <div className="grid gap-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-[120px] w-full rounded-[20px]" />
        ))}
      </div>
    );
  }

  if (!configs.length) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center justify-center py-20 text-slate-400 bg-white border border-slate-100 rounded-[32px] shadow-sm"
      >
        <div className="h-20 w-20 bg-slate-50 rounded-3xl flex items-center justify-center mb-6">
          <MessageSquare className="h-10 w-10 opacity-20" />
        </div>
        <h3 className="text-xl font-bold text-slate-900 mb-2">No Configurations Found</h3>
        <p className="text-slate-500 font-medium max-w-xs text-center mb-8">
          You haven't set up any auto message configurations yet.
        </p>
        <Link to={`/whatsapp/dashboard/${selectedProject?._id}/auto-message/create`}>
          <Button className="h-12 px-8 rounded-2xl bg-[#22B573] hover:bg-[#1da467] text-white font-black uppercase tracking-widest text-xs shadow-xl shadow-green-600/20 transition-all hover:scale-105 active:scale-95">
            Build First Configuration
          </Button>
        </Link>
      </motion.div>
    );
  }

  return (
    <>
      <div className="grid gap-4">
        <AnimatePresence mode="popLayout">
          {configs.map((cfg, index) => {
            const anyCfg: any = cfg as any;
            const sent = (anyCfg && anyCfg.sent) ?? 0;
            const failed = (anyCfg && anyCfg.failed) ?? 0;
            
            return (
              <motion.div 
                key={cfg.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: index * 0.05 }}
                className="group relative bg-white border border-slate-200 hover:border-green-400/50 hover:shadow-xl hover:shadow-green-900/5 rounded-[20px] p-5 sm:p-6 transition-all duration-300 overflow-hidden"
              >
                {/* Decorative Background Element */}
                <div className="absolute top-0 right-0 -mr-16 -mt-16 h-32 w-32 rounded-full bg-green-500/5 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity" />

                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                  {/* Left: Main Info */}
                  <div className="flex-1 space-y-4">
                    <div className="flex items-start gap-4">
                      <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${cfg.enabled ? 'bg-green-50 text-green-600' : 'bg-slate-50 text-slate-400'}`}>
                        <MessageSquare className="h-5 w-5" />
                      </div>
                      
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-lg font-black text-slate-900">
                            {cfg.webinarName || cfg.webinarId}
                          </h3>
                          {!!cfg.headerMediaAssetId && (
                            <Badge variant="secondary" className="bg-blue-50 text-blue-600 border-blue-100 text-[10px] font-bold px-2 py-0">
                              <ImageIcon className="h-3 w-3 mr-1" />
                              MEDIA
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest">
                          <MessageSquare className="h-3 w-3" />
                          Template: <span className="text-slate-600">{cfg.templateName}</span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Stats Row */}
                    <div className="flex items-center gap-6 pl-16">
                      <div className="flex flex-col">
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Messages Sent</span>
                        <div className="flex items-center gap-1.5 font-bold text-slate-900">
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                          <span>{sent}</span>
                        </div>
                      </div>
                      <div className="h-8 w-px bg-slate-100" />
                      <div className="flex flex-col">
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Failed</span>
                        <div className="flex items-center gap-1.5 font-bold text-slate-900">
                          <XCircle className="h-4 w-4 text-red-500" />
                          <span>{failed}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right: Actions */}
                  <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                    <div className="flex items-center bg-slate-50 border border-slate-100 rounded-xl p-1 gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggleClick(cfg)}
                        disabled={toggling}
                        className={`h-9 px-3 rounded-lg flex items-center gap-2 font-bold text-xs transition-all ${cfg.enabled
                          ? "bg-white text-green-600 shadow-sm border border-slate-100"
                          : "text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                          }`}
                      >
                        {cfg.enabled ? <Power className="h-3.5 w-3.5" /> : <PowerOff className="h-3.5 w-3.5" />}
                        {cfg.enabled ? "Active" : "Paused"}
                      </Button>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteClick(cfg)}
                        disabled={deleting}
                        className="h-9 w-9 p-0 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-all"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Premium Delete Confirmation Modal */}
      {deleteModalOpen && selectedConfig && (
        <ConfirmDeleteModal
          setModal={(val) => {
            if (!val) {
              setDeleteModalOpen(false);
              setSelectedConfig(null);
            }
          }}
          triggerDelete={handleDelete}
          isLoading={deleting}
          itemName={selectedConfig.webinarName || selectedConfig.webinarId}
        />
      )}

      {/* Premium Toggle (Pause/Activate) Modal */}
      <Dialog
        open={toggleModalOpen}
        onOpenChange={(open) => {
          if (!open) {
            setToggleModalOpen(false);
            setSelectedConfig(null);
          }
        }}
      >
        <DialogContent
          className="max-w-sm border-0 bg-transparent p-0 shadow-none outline-none"
          onPointerDownOutside={(e) => e.preventDefault()}
          showCloseButton={false}
        >
          <div className="relative w-full rounded-2xl p-6 shadow-2xl flex flex-col bg-white border border-slate-200">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${selectedConfig?.enabled ? 'bg-orange-50 text-orange-500' : 'bg-green-50 text-green-500'}`}>
                  {selectedConfig?.enabled ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
                </div>
                <h3 className="text-lg font-bold text-slate-900">
                  {selectedConfig?.enabled ? 'Pause' : 'Activate'} Automation
                </h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setToggleModalOpen(false);
                  setSelectedConfig(null);
                }}
                className="p-1.5 rounded-lg hover:bg-black/5 transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="mb-8">
              <p className="text-sm font-medium text-slate-500 leading-relaxed">
                Are you sure you want to <span className={`font-bold ${selectedConfig?.enabled ? 'text-orange-600' : 'text-green-600'}`}>{selectedConfig?.enabled ? 'pause' : 'activate'}</span> the auto message configuration for <span className="text-slate-900 font-bold">"{selectedConfig?.webinarName || selectedConfig?.webinarId}"</span>?
              </p>
              {selectedConfig?.enabled && (
                <div className="mt-4 p-3 rounded-xl bg-orange-50 border border-orange-100 flex items-start gap-3">
                  <AlertTriangle className="h-4 w-4 text-orange-500 mt-0.5 shrink-0" />
                  <p className="text-[11px] font-medium text-orange-700">
                    While paused, new registrants will not receive automated WhatsApp messages.
                  </p>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 mt-auto w-full">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setToggleModalOpen(false);
                  setSelectedConfig(null);
                }}
                disabled={toggling}
                className="rounded-xl px-4 py-2.5 font-medium border-slate-200 text-slate-600 hover:bg-slate-50 flex-1"
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleToggleConfirm}
                disabled={toggling}
                className={`rounded-xl px-6 py-2.5 font-bold hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 text-white shadow-lg flex-1 ${
                  selectedConfig?.enabled 
                    ? 'bg-orange-500 hover:bg-orange-600 shadow-orange-600/20' 
                    : 'bg-[#22B573] hover:bg-[#1da467] shadow-green-600/20'
                }`}
              >
                {toggling && <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }} className="mr-2"><Sparkles className="h-4 w-4" /></motion.div>}
                Confirm {selectedConfig?.enabled ? 'Pause' : 'Activate'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}


