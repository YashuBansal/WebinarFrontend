import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { getFlowsByProject, updateFlowStatus, deleteAutomationFlow } from '../../services/flowApi';
import { Edit3, Plus, Zap, Calendar, Search, RefreshCw, Maximize, Minimize, Trash2, Activity } from 'lucide-react';
import { motion } from 'framer-motion';
import { useTheme } from '../../contexts/ThemeContext';
import { Button } from '../ui/button';
import { createPortal } from 'react-dom';
import { setSelectedProject } from '../../features/slices/globalData';
import { instance as axiosInstance } from '../../services/axiosInterceptor';
import ConfirmDeleteModal from '../ConfirmDeleteModal';
import ConfirmStatusModal from '../ConfirmStatusModal';

// Modern, micro-animated skeleton row loader matching ViewAttendees / DynamicLeadsTable
const TableRowSkeleton = ({ columnsCount }) => {
  return (
    <tr className="animate-pulse border-b border-slate-100 dark:border-slate-800/40">
      <td className="p-4 align-middle">
        <div className="h-4 w-4 bg-slate-200 dark:bg-slate-700/50 rounded animate-pulse" />
      </td>
      {Array.from({ length: columnsCount }).map((_, i) => (
        <td key={i} className="p-4">
          <div className="h-4 bg-slate-200 dark:bg-slate-700/50 rounded w-2/3 animate-pulse" />
        </td>
      ))}
    </tr>
  );
};

export default function AutomationDashboardList({ onEditFlow, onCreateFlow }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [workflows, setWorkflows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Delete Confirmation Modal State
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [flowToDelete, setFlowToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Status Confirmation Modal State
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [statusTargetFlow, setStatusTargetFlow] = useState(null);

  const { theme } = useTheme();
  const isDark = theme === 'dark';

  // Extract routing context and Redux global state
  const { projectId: routeProjectId } = useParams();
  const selectedProject = useSelector((state) => state.globalData?.selectedProject);
  const userData = useSelector((state) => state.auth?.userData);

  const adminId = userData?._id || localStorage.getItem('adminId') || "";
  const projectId = routeProjectId || selectedProject?._id || localStorage.getItem('projectId') || "";

  // Sync adminId to local storage for persistent fallbacks
  useEffect(() => {
    if (userData?._id) {
      localStorage.setItem('adminId', userData._id);
    }
  }, [userData]);

  // Self-healing project context: if projectId is missing, fetch first available project
  useEffect(() => {
    const autoResolveProject = async () => {
      if (!projectId) {
        try {
          const response = await axiosInstance.get('/projects');
          const projectsList = response.data?.results || response.data || [];
          if (projectsList.length > 0) {
            const firstProj = projectsList[0];
            localStorage.setItem('projectId', firstProj._id);
            dispatch(setSelectedProject(firstProj));
          }
        } catch (e) {
          console.error("Failed to auto-resolve active project context:", e);
        }
      } else {
        localStorage.setItem('projectId', projectId);
      }
    };
    autoResolveProject();
  }, [projectId, dispatch]);

  // Fetch all workflows belonging to this project on mount or when projectId/adminId changes
  useEffect(() => {
    if (projectId && adminId) {
      fetchWorkflows();
    } else {
      setLoading(false);
    }
  }, [projectId, adminId]);

  const fetchWorkflows = async () => {
    if (!projectId || !adminId) return;
    setLoading(true);
    try {
      const result = await getFlowsByProject(projectId, adminId, 'crm');
      if (result.success) {
        setWorkflows(result.data || []);
      } else {
        toast.error(result.error || "Failed to load automation sequences.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error connecting to server.");
    } finally {
      setLoading(false);
    }
  };

  // Helper to resolve the entry trigger description from nodes
  const resolveTriggerType = (graph) => {
    if (!graph || !graph.nodes || !Array.isArray(graph.nodes)) return 'Custom Hook';
    const triggerNode = graph.nodes.find(n => n.type === 'trigger');
    if (!triggerNode || !triggerNode.data || !triggerNode.data.triggerType) return 'Custom Hook';
    
    const triggerLabelMap = {
      webhook: 'Webhook (API Hook)',
      razorpay: 'Razorpay Payment Hook',
      google_sheets: 'Google Sheets Import',
      meta_leads: 'Meta Lead Ads Form',
      contact_added_webinar: 'Webinar Onboarding',
      contact_added_wlh_whatsapp: 'WhatsApp Lead Gen',
    };

    return triggerLabelMap[triggerNode.data.triggerType] || 'Custom Webhook';
  };

  const handleToggleClick = (flow) => {
    setStatusTargetFlow(flow);
    setStatusModalOpen(true);
  };

  const confirmToggleStatus = async () => {
    if (!statusTargetFlow || !adminId || !projectId) {
      toast.error("Required auth context or project ID is missing.");
      return;
    }

    const flowId = statusTargetFlow._id;
    const currentStatus = statusTargetFlow.status;
    const nextStatus = currentStatus === 'active' ? 'inactive' : 'active';
    
    // Optimistic UI update
    setWorkflows(prev => 
      prev.map(w => w._id === flowId ? { ...w, status: nextStatus } : w)
    );

    try {
      const result = await updateFlowStatus(flowId, nextStatus, adminId, projectId);
      if (result.success) {
        toast.success(`Workflow "${result.data?.name || 'Automation'}" status updated to ${nextStatus.toUpperCase()}`);
        setWorkflows(prev => 
          prev.map(w => w._id === flowId ? { ...w, status: nextStatus, updatedAt: result.data?.updatedAt || new Date().toISOString() } : w)
        );
      } else {
        // Rollback state on failure
        setWorkflows(prev => 
          prev.map(w => w._id === flowId ? { ...w, status: currentStatus } : w)
        );
        toast.error(result.error || "Failed to toggle status.");
      }
    } catch (err) {
      console.error(err);
      // Rollback
      setWorkflows(prev => 
        prev.map(w => w._id === flowId ? { ...w, status: currentStatus } : w)
      );
      toast.error("Failed to update status due to a connection error.");
    }
  };

  const handleDeleteClick = (flow) => {
    setFlowToDelete(flow);
    setDeleteModalOpen(true);
  };

  const confirmDeleteFlow = async () => {
    if (!flowToDelete || !adminId || !projectId) {
      toast.error("Required authentication or project context is missing.");
      return;
    }

    setIsDeleting(true);
    try {
      const result = await deleteAutomationFlow(flowToDelete._id, adminId, projectId);
      if (result.success) {
        toast.success(`Workflow "${flowToDelete.name}" deleted successfully!`);
        // Remove from local state list
        setWorkflows(prev => prev.filter(w => w._id !== flowToDelete._id));
        setDeleteModalOpen(false);
        setFlowToDelete(null);
      } else {
        toast.error(result.error || `Failed to delete workflow "${flowToDelete.name}".`);
      }
    } catch (err) {
      console.error(err);
      toast.error("An unexpected error occurred while deleting the workflow.");
    } finally {
      setIsDeleting(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const filteredWorkflows = workflows.filter(flow => {
    const matchesSearch = flow.name.toLowerCase().includes(searchQuery.toLowerCase());
    const flowCat = flow.flowCategory || 'general';
    return matchesSearch && flowCat === 'general';
  });

  const cardBorder = isDark ? "rgba(255,255,255,0.05)" : "rgba(255,255,255,0.4)";
  const cardBg = isDark
    ? isFullscreen
      ? "#1e293b"
      : "rgba(30, 41, 59, 0.7)"
    : isFullscreen
      ? "#ffffff"
      : "rgba(255, 255, 255, 0.7)";

  const TableUI = (
    <motion.div
      className={`rounded-2xl overflow-hidden border flex flex-col transition-all duration-300 ${isFullscreen ? "flex-1 h-full shadow-2xl" : ""}`}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: 0.08 }}
      style={{
        background: cardBg,
        backdropFilter: isFullscreen ? "none" : "blur(16px)",
        borderColor: cardBorder,
        boxShadow: !isDark && !isFullscreen ? "0 10px 40px rgba(7, 16, 40, 0.04)" : "none",
        minHeight: isFullscreen ? "auto" : "500px",
      }}
    >
      {/* Table Inner Controls Bar */}
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
            placeholder="Search workflows..."
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

        {/* Right: Inner Table Icon Actions */}
        <div className="flex items-center gap-2 self-end sm:self-auto w-full sm:w-auto justify-end">
          {/* Refresh List */}
          <Button
            type="button"
            onClick={fetchWorkflows}
            className="rounded-xl flex items-center justify-center p-2.5 flex-shrink-0 hover:bg-black/5 dark:hover:bg-white/5"
            style={{
              backgroundColor: isDark ? "#1e293b" : "white",
              color: isDark ? "#94a3b8" : "#64748b",
              border: `1px solid ${isDark ? "#334155" : "#e2e8f0"}`,
            }}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>

          {/* Fullscreen Toggle */}
          <Button
            type="button"
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="rounded-xl flex items-center justify-center p-2.5 flex-shrink-0 hover:bg-black/5 dark:hover:bg-white/5"
            style={{
              backgroundColor: isDark ? "#1e293b" : "white",
              color: isDark ? "#94a3b8" : "#64748b",
              border: `1px solid ${isDark ? "#334155" : "#e2e8f0"}`,
            }}
            title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
          >
            {isFullscreen ? (
              <Minimize className="w-4 h-4" />
            ) : (
              <Maximize className="w-4 h-4" />
            )}
          </Button>
        </div>
      </div>

      {/* Table Data list view */}
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
                Workflow Name
              </th>
              <th
                className="p-4 text-left align-middle font-semibold text-xs uppercase tracking-wider border-b border-slate-100 dark:border-slate-800/40"
                style={{ color: isDark ? "#94a3b8" : "#64748b" }}
              >
                Entry Trigger
              </th>
              <th
                className="p-4 text-center align-middle font-semibold text-xs uppercase tracking-wider border-b border-slate-100 dark:border-slate-800/40"
                style={{ color: isDark ? "#94a3b8" : "#64748b" }}
              >
                Active Status
              </th>
              <th
                className="p-4 text-left align-middle font-semibold text-xs uppercase tracking-wider border-b border-slate-100 dark:border-slate-800/40"
                style={{ color: isDark ? "#94a3b8" : "#64748b" }}
              >
                Last Updated
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
              Array.from({ length: 6 }).map((_, i) => (
                <TableRowSkeleton key={i} columnsCount={5} />
              ))
            ) : filteredWorkflows.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-8 text-center text-slate-500 dark:text-slate-400">
                  <div className="flex flex-col items-center justify-center gap-2 py-8">
                    <Search className="w-8 h-8 opacity-20" />
                    <p className="text-sm font-semibold">No automations configured matching your criteria.</p>
                  </div>
                </td>
              </tr>
            ) : (
              filteredWorkflows.map((flow, index) => {
                const isActive = flow.status === 'active';
                const triggerLabel = resolveTriggerType(flow.graph);
                const stickyEdgeBg = isDark ? '#1e293b' : '#ffffff';

                return (
                  <motion.tr
                    key={flow._id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.03 }}
                    onClick={() => onEditFlow(flow)}
                    className="border-b transition-colors group cursor-pointer border-slate-150 dark:border-slate-850"
                  >
                    {/* S.No Column */}
                    <td 
                      className="p-4 text-sm font-semibold text-slate-500 dark:text-slate-400 transition-colors w-12"
                      style={{ backgroundColor: stickyEdgeBg }}
                    >
                      {index + 1}
                    </td>

                    {/* Name Column */}
                    <td className="p-4 text-sm font-bold text-slate-900 dark:text-slate-100 group-hover:bg-slate-100 dark:group-hover:bg-slate-800/80 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-xl border ${
                          isActive 
                            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500 shadow-sm' 
                            : 'bg-slate-100 border-slate-200 dark:bg-slate-850 dark:border-slate-800 text-slate-400'
                        }`}>
                          <Zap className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="font-bold text-slate-800 dark:text-slate-100">{flow.name}</h4>
                            {isActive ? (
                              <span className="px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 shadow-sm animate-pulse">
                                Live
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                                Draft
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium mt-0.5">ID: {flow._id}</p>
                        </div>
                      </div>
                    </td>

                    {/* Trigger Column */}
                    <td className="p-4 text-sm font-medium text-slate-500 dark:text-slate-400 group-hover:bg-slate-100 dark:group-hover:bg-slate-800/80 transition-colors">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-500/5 dark:bg-blue-500/10 border border-blue-500/10 text-[10px] font-semibold text-blue-600 dark:text-blue-400">
                        {triggerLabel}
                      </span>
                    </td>

                    {/* Toggle Column */}
                    <td className="p-4 text-center align-middle group-hover:bg-slate-100 dark:group-hover:bg-slate-800/80 transition-colors" onClick={(e) => e.stopPropagation()}>
                      <div className="flex flex-col items-center gap-1 justify-center">
                        <button
                          type="button"
                          onClick={() => handleToggleClick(flow)}
                          className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                            isActive ? 'bg-emerald-500' : 'bg-slate-200 dark:bg-slate-850'
                          }`}
                        >
                          <span
                            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                              isActive ? 'translate-x-5' : 'translate-x-0'
                            }`}
                          />
                        </button>
                        <span className={`text-[9px] font-bold uppercase tracking-wide ${isActive ? 'text-emerald-500' : 'text-slate-400 dark:text-slate-500'}`}>
                          {isActive ? 'Published' : 'Saved Draft'}
                        </span>
                      </div>
                    </td>

                    {/* Last Updated Column */}
                    <td className="p-4 text-sm font-medium text-slate-500 dark:text-slate-400 group-hover:bg-slate-100 dark:group-hover:bg-slate-800/80 transition-colors">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 opacity-60" />
                        {formatDate(flow.updatedAt)}
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
                          onClick={() => onEditFlow(flow)}
                          className="w-8 h-8 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-500/10"
                          title="Edit Workflow"
                        >
                          <Edit3 className="w-4 h-4 text-blue-500" />
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
                  </motion.tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </motion.div>
  );

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto space-y-6 transition-all duration-300">
      {/* Page Header (OUTSIDE the Card) matching ViewAttendees */}
      <motion.div
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
      >
        <div>
          <h2
            className="text-2xl font-bold tracking-tight flex flex-wrap items-center gap-3"
            style={{ color: isDark ? "#f8fafc" : "#071028" }}
          >
            Automations Console
            <span
              className="text-xs font-semibold px-2.5 py-1 rounded-lg"
              style={{
                backgroundColor: isDark ? "rgba(59, 130, 246, 0.2)" : "#eff6ff",
                color: isDark ? "#60a5fa" : "#2563eb",
                border: `1px solid ${isDark ? "rgba(59, 130, 246, 0.3)" : "#bfdbfe"}`,
              }}
            >
              Total Flows: {filteredWorkflows.length}
            </span>
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Build and monitor high-throughput WhatsApp Sequences, Razorpay Webhooks, and Drip Campaigns.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {userData?.isActive !== false && (
            <>
              <Button
                type="button"
                onClick={() => navigate('/automations/history', { state: { defaultTab: 'crm' } })}
                className="rounded-xl flex items-center gap-2 px-4 shadow-sm transition-transform hover:scale-105"
                style={{
                  borderColor: isDark ? "rgba(59, 130, 246, 0.3)" : "#bfdbfe",
                  backgroundColor: isDark ? "rgba(59, 130, 246, 0.1)" : "#eff6ff",
                  color: isDark ? "#60a5fa" : "#2563eb",
                  borderWidth: "1px"
                }}
              >
                <Activity className="w-4 h-4" />
                <span className="font-semibold">Execution Logs</span>
              </Button>
              <Button
                type="button"
                onClick={() => onCreateFlow('general')}
                className="rounded-xl flex items-center gap-2 px-4 shadow-sm transition-transform hover:scale-105"
                style={{
                  backgroundColor: "#7c3aed",
                  color: "white",
                  border: "none",
                  boxShadow: "0 4px 10px rgba(124, 58, 237, 0.2)",
                }}
              >
                <Plus className="w-4 h-4" />
                <span className="font-semibold">Create Automation</span>
              </Button>
            </>
          )}
        </div>
      </motion.div>

      {/* Embedded Table UI with optional fullscreen portal render matching ViewAttendees */}
      {isFullscreen && typeof document !== "undefined" ? (
        createPortal(
          <div className={`fixed inset-0 z-[100] p-4 sm:p-6 flex flex-col ${isDark ? "bg-[#0f172a]" : "bg-[#F2F4F6]"}`}>
            {TableUI}
          </div>,
          document.body
        )
      ) : (
        TableUI
      )}

      {/* Dynamic Security Deletion Confirmation Modal */}
      {deleteModalOpen && flowToDelete && (
        <ConfirmDeleteModal
          setModal={setDeleteModalOpen}
          triggerDelete={confirmDeleteFlow}
          isLoading={isDeleting}
          itemName={flowToDelete.name}
        />
      )}

      {/* Dynamic Status Toggling Confirmation Modal */}
      {statusModalOpen && statusTargetFlow && (
        <ConfirmStatusModal
          isOpen={statusModalOpen}
          onClose={() => { setStatusModalOpen(false); setStatusTargetFlow(null); }}
          onConfirm={confirmToggleStatus}
          title={statusTargetFlow.status === 'active' ? "Deactivate Workflow" : "Activate Workflow"}
          message={
            statusTargetFlow.status === 'active'
              ? "Are you sure you want to DEACTIVATE this live sequence and set it back to DRAFT? It will temporarily stop processing automated triggers and campaigns."
              : "Are you sure you want to ACTIVATE this workflow sequence and make it LIVE? It will start processing lead campaigns immediately."
          }
          confirmText={statusTargetFlow.status === 'active' ? "Deactivate Draft" : "Activate Live"}
          confirmVariant={statusTargetFlow.status === 'active' ? "rose" : "emerald"}
          itemName={statusTargetFlow.name}
        />
      )}
    </div>
  );
}
