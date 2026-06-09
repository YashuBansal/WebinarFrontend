import { useState, useEffect } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  Search,
  Plus,
  RefreshCw,
  Maximize,
  Minimize,
  Zap,
  Calendar,
  Pencil,
  Clock,
  Loader2,
  Activity,
  Trash2,
} from "lucide-react";
import { useProjectContext } from "@/context/ProjectContext";
import { listAutomations, deleteAutomation, updateAutomation } from "@/api/modules/automations";
import type { AutomationFlow } from "@/api/modules/automations";
import { formatDateTime12 } from "@/lib/date";
// @ts-ignore
import ConfirmDeleteModal from "../../../../../components/ConfirmDeleteModal";
// @ts-ignore
import ConfirmStatusModal from "../../../../../components/ConfirmStatusModal";
// @ts-ignore
import { useTheme } from "../../../../../contexts/ThemeContext";

export default function AutomationsList() {
  const { projectId } = useParams<{ projectId: string }>();
  const { selectedProject } = useProjectContext();
  const navigate = useNavigate();

  const [workflows, setWorkflows] = useState<AutomationFlow[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Deletion Modals State
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [flowToDelete, setFlowToDelete] = useState<AutomationFlow | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Status Toggling Confirmation Modals State
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [statusTargetFlow, setStatusTargetFlow] = useState<AutomationFlow | null>(null);

  const { theme } = useTheme();
  const isDark = theme === "dark";

  const fetchFlows = async () => {
    if (!projectId) return;
    setLoading(true);
    try {
      const res = await listAutomations(projectId);
      setWorkflows(res || []);
    } catch (err) {
      console.error("Failed to fetch WhatsApp automations:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFlows();
  }, [projectId]);

  const resolveTriggerType = (graph: any) => {
    if (!graph || !graph.nodes || !Array.isArray(graph.nodes)) return "Chatbot Trigger";
    const triggerNode = graph.nodes.find(
      (n: any) => n.type?.startsWith("trigger") || n.type === "input"
    );
    if (!triggerNode || !triggerNode.data || !triggerNode.data.type) return "Chatbot Trigger";

    const triggerLabelMap: Record<string, string> = {
      "trigger:webinar": "Webinar Onboarding",
      "trigger:incoming": "Incoming Message Match",
      "trigger:keyword": "Keyword Trigger",
    };

    return triggerLabelMap[triggerNode.data.type] || "Chatbot Trigger";
  };

  const handleToggleClick = (flow: AutomationFlow) => {
    setStatusTargetFlow(flow);
    setStatusModalOpen(true);
  };

  const confirmToggleStatus = async () => {
    if (!statusTargetFlow || !projectId) return;

    const flowId = statusTargetFlow._id;
    const currentStatus = statusTargetFlow.status;
    const nextStatus = currentStatus === "active" ? "inactive" : "active";

    // Optimistic UI update
    setWorkflows((prev) =>
      prev.map((w) => (w._id === flowId ? { ...w, status: nextStatus } : w))
    );
    setStatusModalOpen(false);

    try {
      await updateAutomation(projectId, flowId, { status: nextStatus });
    } catch (err) {
      console.error("Failed to toggle status:", err);
      // Rollback state on failure
      setWorkflows((prev) =>
        prev.map((w) => (w._id === flowId ? { ...w, status: currentStatus } : w))
      );
    }
  };

  const handleDeleteClick = (flow: AutomationFlow) => {
    setFlowToDelete(flow);
    setDeleteModalOpen(true);
  };

  const confirmDeleteFlow = async () => {
    if (!projectId || !flowToDelete) return;
    setIsDeleting(true);
    try {
      await deleteAutomation(projectId, flowToDelete._id);
      setWorkflows((prev) => prev.filter((i) => i._id !== flowToDelete._id));
      setDeleteModalOpen(false);
      setFlowToDelete(null);
    } catch (err) {
      console.error("Failed to delete flow:", err);
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredWorkflows = workflows.filter((flow) => {
    const matchesSearch = flow.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const cardBorder = isDark ? "rgba(255,255,255,0.05)" : "rgba(255,255,255,0.4)";
  const cardBg = isDark
    ? "linear-gradient(135deg, rgba(30,41,59,0.7) 0%, rgba(15,23,42,0.8) 100%)"
    : "linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(248,250,252,0.9) 100%)";
  const stickyEdgeBg = isDark ? "#1e293b" : "#ffffff";

  const TableUI = (
    <motion.div
      initial={isFullscreen ? {} : { opacity: 0, y: 15 }}
      animate={isFullscreen ? {} : { opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      style={{
        background: cardBg,
        borderColor: isDark ? "#1e293b" : "rgba(226, 232, 240, 0.8)",
      }}
      className={`border backdrop-blur-md rounded-2xl overflow-hidden flex flex-col ${isFullscreen ? "w-full h-full shadow-2xl" : "shadow-xl shadow-slate-100/50 dark:shadow-none"
        }`}
    >
      {/* Table Inner Actions Controls Header */}
      <div
        className="p-4 border-b flex flex-col sm:flex-row items-center justify-between gap-4"
        style={{
          borderColor: isDark ? "#334155" : "rgba(0,0,0,0.05)",
        }}
      >
        {/* Left: Search input */}
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search WABA workflows..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 pr-4 py-2 w-full rounded-xl text-sm focus:outline-none focus:ring-2 transition-all"
            style={{
              backgroundColor: isDark ? "#0f172a" : "#ffffff",
              border: `1px solid ${isDark ? "#334155" : "#e2e8f0"}`,
              color: isDark ? "#f8fafc" : "#0f172a",
            }}
          />
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2 self-end sm:self-auto w-full sm:w-auto justify-end">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={fetchFlows}
            className="w-9 h-9 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400"
            title="Refresh List"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="w-9 h-9 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400"
            title={isFullscreen ? "Exit Fullscreen" : "Fullscreen Mode"}
          >
            {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
          </Button>
        </div>
      </div>

      {/* Table Content Area */}
      <div className={`overflow-x-auto custom-scrollbar ${isFullscreen ? "flex-1 overflow-y-auto" : ""}`}>
        <table className="w-full text-left border-collapse">
          <thead className={isFullscreen ? "sticky top-0 z-20" : ""}>
            <tr
              style={{
                backgroundColor: isDark ? "rgba(15,23,42,0.95)" : "#F9FAFB",
                backdropFilter: isFullscreen ? "blur(8px)" : "none",
              }}
            >
              <th
                className="p-4 text-left align-middle font-semibold text-xs uppercase tracking-wider border-b border-slate-100 dark:border-slate-800/40 w-12"
                style={{
                  color: isDark ? "#94a3b8" : "#64748b",
                }}
              >
                S.No
              </th>
              <th
                className="p-4 text-left align-middle font-semibold text-xs uppercase tracking-wider border-b border-slate-100 dark:border-slate-800/40"
                style={{
                  color: isDark ? "#94a3b8" : "#64748b",
                }}
              >
                Flow Details
              </th>
              <th
                className="p-4 text-left align-middle font-semibold text-xs uppercase tracking-wider border-b border-slate-100 dark:border-slate-800/40"
                style={{ color: isDark ? "#94a3b8" : "#64748b" }}
              >
                Trigger Action
              </th>
              <th
                className="p-4 text-center align-middle font-semibold text-xs uppercase tracking-wider border-b border-slate-100 dark:border-slate-800/40 w-28"
                style={{ color: isDark ? "#94a3b8" : "#64748b" }}
              >
                Active Switch
              </th>
              <th
                className="p-4 text-left align-middle font-semibold text-xs uppercase tracking-wider border-b border-slate-100 dark:border-slate-800/40"
                style={{ color: isDark ? "#94a3b8" : "#64748b" }}
              >
                Created On
              </th>
              <th
                className="p-4 text-right align-middle font-semibold text-xs uppercase tracking-wider border-b border-slate-100 dark:border-slate-800/40 w-28"
                style={{ color: isDark ? "#94a3b8" : "#64748b" }}
              >
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="border-b border-slate-100 dark:border-slate-850">
                  <td className="p-4"><div className="h-4 w-4 bg-slate-200 dark:bg-slate-850 animate-pulse rounded" /></td>
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 bg-slate-200 dark:bg-slate-850 animate-pulse rounded-xl" />
                      <div className="space-y-1">
                        <div className="h-4 w-32 bg-slate-200 dark:bg-slate-850 animate-pulse rounded" />
                        <div className="h-3 w-20 bg-slate-200 dark:bg-slate-850 animate-pulse rounded" />
                      </div>
                    </div>
                  </td>
                  <td className="p-4"><div className="h-6 w-24 bg-slate-200 dark:bg-slate-850 animate-pulse rounded-lg" /></td>
                  <td className="p-4"><div className="h-6 w-12 bg-slate-200 dark:bg-slate-850 animate-pulse rounded-full mx-auto" /></td>
                  <td className="p-4"><div className="h-4 w-28 bg-slate-200 dark:bg-slate-850 animate-pulse rounded" /></td>
                  <td className="p-4 text-right"><div className="h-8 w-16 bg-slate-200 dark:bg-slate-850 animate-pulse rounded-lg inline-block" /></td>
                </tr>
              ))
            ) : filteredWorkflows.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-8 text-center text-slate-500 dark:text-slate-400">
                  <div className="flex flex-col items-center justify-center gap-2 py-8">
                    <Zap className="w-8 h-8 opacity-25 text-green-500 fill-green-500/10" />
                    <p className="text-sm font-semibold">No WABA automation flows found.</p>
                  </div>
                </td>
              </tr>
            ) : (
              filteredWorkflows.map((flow, index) => {
                const isActive = flow.status === "active";
                const triggerLabel = resolveTriggerType(flow.graph);

                return (
                  <tr
                    key={flow._id}
                    onClick={() => navigate(`/whatsapp/dashboard/${projectId}/automations/${flow._id}`)}
                    className="border-b transition-colors group cursor-pointer border-slate-150 dark:border-slate-850"
                  >
                    {/* S.No Column */}
                    <td
                      className="p-4 text-sm font-semibold text-slate-500 dark:text-slate-400 transition-colors w-12"
                      style={{ backgroundColor: stickyEdgeBg }}
                    >
                      {index + 1}
                    </td>

                    {/* Flow Details Column */}
                    <td className="p-4 text-sm font-bold text-slate-900 dark:text-slate-100 group-hover:bg-slate-100/50 dark:group-hover:bg-slate-800/30 transition-colors">
                      <div className="flex items-center gap-3">
                        <div
                          className={`p-2 rounded-xl border ${isActive
                            ? "bg-green-500/10 border-green-500/20 text-green-600 dark:text-green-400 shadow-sm"
                            : "bg-slate-100 border-slate-250 dark:bg-slate-800 dark:border-slate-700 text-slate-400"
                            }`}
                        >
                          <Zap className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="font-extrabold text-slate-800 dark:text-slate-100">
                              {flow.name || "Untitled Flow"}
                            </h4>
                            {isActive ? (
                              <span className="px-2 py-0.5 text-[9px] font-black uppercase tracking-wider rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 animate-pulse">
                                Live
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 text-[9px] font-black uppercase tracking-wider rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                                Draft
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold mt-0.5">
                            ID: {flow._id}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Trigger Column */}
                    <td className="p-4 text-sm font-medium text-slate-500 dark:text-slate-400 group-hover:bg-slate-100/50 dark:group-hover:bg-slate-800/30 transition-colors">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-500/5 dark:bg-blue-500/10 border border-blue-500/10 text-[10px] font-bold text-blue-600 dark:text-blue-400">
                        {triggerLabel}
                      </span>
                    </td>

                    {/* Status Switch Toggle */}
                    <td
                      className="p-4 text-center align-middle group-hover:bg-slate-100/50 dark:group-hover:bg-slate-800/30 transition-colors w-28"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex flex-col items-center gap-1 justify-center">
                        <button
                          type="button"
                          onClick={() => handleToggleClick(flow)}
                          className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${isActive ? "bg-green-600" : "bg-slate-200 dark:bg-slate-800"
                            }`}
                        >
                          <span
                            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${isActive ? "translate-x-5" : "translate-x-0"
                              }`}
                          />
                        </button>
                        <span
                          className={`text-[9px] font-black uppercase tracking-wide ${isActive ? "text-green-600" : "text-slate-400"
                            }`}
                        >
                          {isActive ? "Published" : "Saved Draft"}
                        </span>
                      </div>
                    </td>

                    {/* Created Date */}
                    <td className="p-4 text-sm font-medium text-slate-500 dark:text-slate-400 group-hover:bg-slate-100/50 dark:group-hover:bg-slate-800/30 transition-colors">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 opacity-60" />
                        {formatDateTime12(flow.createdAt)}
                      </div>
                    </td>

                    {/* Actions Column */}
                    <td
                      className="p-4 text-right align-middle transition-colors w-28"
                      onClick={(e) => e.stopPropagation()}
                      style={{ backgroundColor: stickyEdgeBg }}
                    >
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => navigate(`/whatsapp/dashboard/${projectId}/automations/${flow._id}`)}
                          className="w-8 h-8 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-500/10"
                          title="Edit Workflow"
                        >
                          <Pencil className="w-4 h-4 text-blue-500" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteClick(flow)}
                          className="w-8 h-8 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-500/10"
                          title="Delete Workflow"
                        >
                          <Trash2 className="w-4 h-4 text-rose-500" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </motion.div>
  );

  return (
    <div className="min-h-full w-full min-w-0 max-w-full box-border p-2 transition-colors duration-500 sm:p-2 md:p-0 lg:p-0 xl:p-2 2xl:p-4">
      {/* Premium Header matching Programs.tsx */}
      <motion.div
        className="mb-6 rounded-2xl border border-slate-200 p-4 sm:p-5 bg-white dark:bg-slate-900 shadow-sm dark:border-slate-800"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5 text-green-600 dark:text-green-400 font-bold text-[10px] uppercase tracking-[0.2em] mb-0.5">
              <Zap className="h-3 w-3 animate-pulse" />
              Automated Workflows
            </div>
            <h1 className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-2xl flex items-center gap-2">
              Automations Console
              <span className="px-2 text-[9px] font-black uppercase tracking-wider rounded-lg bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/30">
                Total Flows: {filteredWorkflows.length}
              </span>
            </h1>
            <p className="text-slate-600 dark:text-slate-400 text-xs font-medium">
              Build and monitor project-specific WhatsApp Loops, triggers, keyword triggers, and auto-responses for{" "}
              <span className="text-slate-900 dark:text-white font-bold">{selectedProject?.projectName}</span>.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              type="button"
              onClick={() => navigate('/automations/history', { state: { defaultTab: 'whatsapp' } })}
              variant="outline"
              className="h-10 px-4 rounded-xl flex items-center gap-2 border-slate-200 dark:border-slate-700/50 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900/50 font-bold text-xs transition-all active:scale-[0.98]"
            >
              <Activity className="h-3.5 w-3.5" />
              Execution Logs
            </Button>
            <Link to={`/whatsapp/dashboard/${projectId}/automations/new`}>
              <Button
                className="h-10 px-5 rounded-xl flex items-center gap-2 text-white font-bold text-xs shadow-xl shadow-green-600/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
                style={{ backgroundColor: "#22B573" }}
              >
                <Plus className="w-4 h-4" />
                Create Automation
              </Button>
            </Link>
          </div>
        </div>
      </motion.div>

      <main className="container mx-auto space-y-6 pb-12">
        {/* Embedded Table UI with optional fullscreen portal render */}
        {isFullscreen && typeof document !== "undefined" ? (
          createPortal(
            <div
              className={`fixed inset-0 z-[100] p-4 sm:p-6 flex flex-col ${isDark ? "bg-[#0f172a]" : "bg-[#F2F4F6]"
                }`}
            >
              {TableUI}
            </div>,
            document.body
          )
        ) : (
          TableUI
        )}
      </main>

      {/* Dynamic Security Deletion Confirmation Modal */}
      {deleteModalOpen && flowToDelete && (
        <ConfirmDeleteModal
          setModal={setDeleteModalOpen}
          triggerDelete={confirmDeleteFlow}
          isLoading={isDeleting}
          itemName={flowToDelete.name || "Untitled Flow"}
        />
      )}

      {/* Dynamic Status Toggling Confirmation Modal */}
      {statusModalOpen && statusTargetFlow && (
        <ConfirmStatusModal
          isOpen={statusModalOpen}
          onClose={() => {
            setStatusModalOpen(false);
            setStatusTargetFlow(null);
          }}
          onConfirm={confirmToggleStatus}
          title={statusTargetFlow.status === "active" ? "Deactivate Workflow" : "Activate Workflow"}
          message={
            statusTargetFlow.status === "active"
              ? "Are you sure you want to DEACTIVATE this live sequence and set it back to DRAFT? It will temporarily stop processing chatbot triggers and keyword rules."
              : "Are you sure you want to ACTIVATE this workflow sequence and make it LIVE? It will start processing incoming WhatsApp session messages immediately."
          }
          confirmText={statusTargetFlow.status === "active" ? "Deactivate Draft" : "Activate Live"}
          confirmVariant={statusTargetFlow.status === "active" ? "rose" : "emerald"}
          itemName={statusTargetFlow.name || "Untitled Flow"}
        />
      )}
    </div>
  );
}
