import React, { useState, useEffect, useCallback } from "react";
import { X, Webhook, Plus, Trash2, Edit2, RefreshCw } from "lucide-react";
import tagsService from "../../../services/tagsService";
import AppLoader from "../../../components/AppLoader";
import { Button } from "../../../components/ui/button";
import { Dialog, DialogContent } from "../../../components/ui/dialog";
import { useTheme } from "../../../contexts/ThemeContext";
import CreateWebhookForm from "./components/CreateWebhookForm";
import WebhookList from "./components/WebhookList";

const FONT = "Inter, sans-serif";

const WebinarWebhooksListDialog = ({ webinarId, onClose, isOpen, onRefresh }) => {
  const [webhooks, setWebhooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const fetchWebhooks = useCallback(async () => {
    if (!webinarId) return;
    
    setLoading(true);
    try {
      const response = await tagsService.getWebinarWebhooks(webinarId);
      if (response?.success) {
        setWebhooks(response.data || []);
      } else {
        setWebhooks([]);
      }
    } catch (error) {
      console.error("Error fetching webhooks:", error);
      setWebhooks([]);
    } finally {
      setLoading(false);
    }
  }, [webinarId]);

  useEffect(() => {
    if (isOpen && webinarId) {
      fetchWebhooks();
    }
  }, [isOpen, webinarId, fetchWebhooks]);

  const handleCreateSuccess = useCallback(() => {
    fetchWebhooks();
    if (onRefresh) onRefresh();
  }, [fetchWebhooks, onRefresh]);

  const handleUpdate = useCallback(() => {
    fetchWebhooks();
    if (onRefresh) onRefresh();
  }, [fetchWebhooks, onRefresh]);

  const handleDelete = useCallback(() => {
    fetchWebhooks();
    if (onRefresh) onRefresh();
  }, [fetchWebhooks, onRefresh]);

  const shellBorder = isDark ? "#334155" : "#e5e7eb";
  const titleColor = isDark ? "#f8fafc" : "#0f172a";
  const footerBg = isDark ? "rgba(15,23,42,0.85)" : "#F9FAFB";

  const cancelBtn = {
    backgroundColor: "transparent",
    border: "none",
    color: isDark ? "#94a3b8" : "#64748b",
  };
  const applyBtn = {
    backgroundColor: "#22B573",
    color: "#ffffff",
    border: "none",
    boxShadow: "0 4px 10px rgba(34, 181, 115, 0.25)",
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[900px] p-0 overflow-hidden rounded-2xl shadow-2xl border" style={{ backgroundColor: isDark ? "#1e293b" : "#ffffff", borderColor: shellBorder }}>
        <div className="flex flex-col max-h-[90vh]">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b flex-shrink-0" style={{ borderColor: shellBorder }}>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-50 dark:bg-indigo-500/10 rounded-xl">
                <Webhook className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div>
                <h3 className="text-lg font-bold" style={{ fontFamily: FONT, color: titleColor }}>
                  Webinar Webhooks
                </h3>
                <p className="text-xs text-slate-500">Manage external integration endpoints</p>
              </div>
            </div>
            <button type="button" onClick={onClose} className="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/10">
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto custom-scrollbar flex-1 min-h-0">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 gap-4">
                <AppLoader size="lg" />
                <p className="text-sm text-slate-500 animate-pulse">Fetching webhooks...</p>
              </div>
            ) : (
              <div className="space-y-8">
                <div className="p-6 rounded-2xl border bg-slate-50/50 dark:bg-slate-800/30" style={{ borderColor: shellBorder }}>
                  <h4 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-4">Create New Webhook</h4>
                  <CreateWebhookForm
                    webinarId={webinarId}
                    onCreateSuccess={handleCreateSuccess}
                  />
                </div>
                
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-sm font-bold uppercase tracking-wider text-slate-400">Active Webhooks</h4>
                    <Button variant="ghost" size="sm" onClick={fetchWebhooks} className="h-8 gap-2">
                      <RefreshCw className="w-3 h-3" /> Refresh
                    </Button>
                  </div>
                  <WebhookList
                    webhooks={webhooks}
                    onUpdate={handleUpdate}
                    onDelete={handleDelete}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t flex-shrink-0" style={{ backgroundColor: footerBg, borderColor: shellBorder }}>
            <div className="flex justify-end items-center gap-2">
              <Button onClick={onClose} style={applyBtn} className="rounded-xl h-10 px-8 font-bold transition-all hover:scale-105">
                Close
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default WebinarWebhooksListDialog;