import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { serializeFlowPayload, saveAutomationFlow, publishAutomationFlow } from '../../services/flowApi';
import { setFlowInfo } from '../../features/slices/flowSlice';

export default function FlowHeader({ onBack }) {
  const dispatch = useDispatch();
  const [workflowName, setWorkflowName] = useState('Webinar Welcome Sequence');
  const [isSaving, setIsSaving] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);

  const nodes = useSelector((state) => state.flow?.nodes || []);
  const edges = useSelector((state) => state.flow?.edges || []);
  const activeFlowId = useSelector((state) => state.flow?.flowId);
  const activeFlowName = useSelector((state) => state.flow?.name);
  const flowCategory = useSelector((state) => state.flow?.flowCategory || 'general');

  // Synchronize dynamic name changes when workflow changes (editing vs creating)
  useEffect(() => {
    if (activeFlowName) {
      setWorkflowName(activeFlowName);
    } else {
      setWorkflowName('Webinar Welcome Sequence');
    }
  }, [activeFlowName]);

  // Retrieve route params and Redux global configurations with secure fallback chains
  const { projectId: routeProjectId } = useParams();
  const selectedProject = useSelector((state) => state.globalData?.selectedProject);
  const userData = useSelector((state) => state.auth?.userData);

  const adminId = userData?._id || localStorage.getItem('adminId') || "";
  const projectId = routeProjectId || selectedProject?._id || localStorage.getItem('projectId') || "";

  // Synchronize resolved session IDs to local storage for persistence
  useEffect(() => {
    if (userData?._id) {
      localStorage.setItem('adminId', userData._id);
    }
    if (projectId) {
      localStorage.setItem('projectId', projectId);
    }
  }, [userData, projectId]);

  const handleSave = async () => {
    if (!workflowName.trim()) {
      toast.error("Please enter a valid name for your workflow.");
      return;
    }

    if (!adminId || !projectId) {
      toast.error("Missing project or user session.");
      return;
    }

    setIsSaving(true);
    toast.info("Saving draft sequence... Please wait.");

    try {
      const payload = {
        ...serializeFlowPayload(workflowName, nodes, edges),
        adminId,
        projectId,
        flowCategory,
        status: 'inactive',
        ...(activeFlowId ? { id: activeFlowId } : {}),
      };
      const result = await saveAutomationFlow(payload);

      if (result.success) {
        toast.dismiss();
        toast.success(`Draft "${workflowName}" saved successfully!`);

        const savedFlowId = result.data?.flowId || result.flowId;
        if (savedFlowId) {
          dispatch(setFlowInfo({ flowId: savedFlowId, name: workflowName, flowCategory }));
        }
      } else {
        toast.dismiss();
        toast.error(result.error || "Failed to save draft workflow.");
      }
    } catch (err) {
      console.error(err);
      toast.dismiss();
      toast.error("An unexpected error occurred while saving the draft workflow.");
    } finally {
      setIsSaving(false);
    }
  };

  const handlePublish = async () => {
    if (!workflowName.trim()) {
      toast.error("Please enter a valid name for your workflow.");
      return;
    }

    if (!adminId || !projectId) {
      toast.error("Missing project or user session.");
      return;
    }

    setIsPublishing(true);
    toast.info("Publishing workflow live... Please wait.");

    try {
      // 1. First, save latest workflow draft details to get valid flowId
      const payload = {
        ...serializeFlowPayload(workflowName, nodes, edges),
        adminId,
        projectId,
        flowCategory,
        ...(activeFlowId ? { id: activeFlowId } : {}),
      };
      const saveResult = await saveAutomationFlow(payload);

      if (!saveResult.success) {
        toast.dismiss();
        toast.error(saveResult.error || "Failed to save workflow state before publishing.");
        setIsPublishing(false);
        return;
      }

      const flowId = saveResult.data?.flowId;
      if (!flowId) {
        toast.dismiss();
        toast.error("Invalid response from server: missing flow ID.");
        setIsPublishing(false);
        return;
      }

      // Sync active state back to Redux so we know we are now editing this saved flow
      dispatch(setFlowInfo({ flowId, name: workflowName, flowCategory }));

      // 2. Publish immediately via flowId patching
      const publishResult = await publishAutomationFlow(flowId, adminId, projectId);

      if (publishResult.success) {
        toast.dismiss();
        toast.success("Workflow is now LIVE!");

      } else {
        toast.dismiss();
        toast.error(publishResult.error || "Failed to activate workflow status.");
      }
    } catch (err) {
      console.error(err);
      toast.dismiss();
      toast.error("An unexpected error occurred while publishing the workflow.");
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <header className="h-16 px-6 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800/80 flex items-center justify-between z-25 relative shadow-sm transition-colors duration-300">
      {/* Title / Description Block */}
      <div className="flex items-center gap-4">
        {onBack && (
          <button
            onClick={onBack}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 rounded-xl transition-all cursor-pointer flex items-center justify-center border border-slate-200 dark:border-slate-800/80"
            title="Back to Dashboard"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        )}
        <div className="flex items-center gap-2">
          {/* Neon Glow Bullet */}
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-purple-500"></span>
          </span>
          <div>
            <h1 className="text-xs font-bold tracking-wider text-slate-500 dark:text-slate-400 uppercase">
              Orchestrator Workspace
            </h1>
          </div>
        </div>
        <div className="h-6 w-px bg-slate-200 dark:bg-slate-800" />
        {/* Interactive workflow name input */}
        <input
          type="text"
          value={workflowName}
          onChange={(e) => setWorkflowName(e.target.value)}
          placeholder="Workflow Name (e.g. Webinar Welcome Sequence)"
          className="bg-slate-50 text-slate-800 dark:bg-slate-950/70 dark:text-slate-100 font-semibold border border-slate-200 dark:border-slate-800/80 rounded-xl px-3 py-1.5 w-64 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/20 transition-all nodrag"
        />
      </div>

      {/* Primary Actions Button Group */}
      <div className="flex items-center gap-3">
        {/* Save Draft Button */}
        <button
          onClick={handleSave}
          disabled={isSaving || isPublishing}
          className={`px-4 py-2 rounded-xl text-xs font-semibold shadow-lg transition-all active:scale-95 flex items-center gap-2 ${
            isSaving
              ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed border border-slate-200 dark:border-slate-700'
              : 'bg-slate-800 hover:bg-slate-750 text-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-700/80 shadow-slate-900/10 cursor-pointer'
          }`}
        >
          {isSaving ? 'Saving Draft...' : 'Save Draft'}
        </button>

        {/* Publish Live Button */}
        <button
          onClick={handlePublish}
          disabled={isSaving || isPublishing}
          className={`px-4 py-2 rounded-xl text-xs font-semibold shadow-lg transition-all active:scale-95 flex items-center gap-2 ${
            isPublishing
              ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed border border-slate-200 dark:border-slate-700'
              : 'bg-purple-600 hover:bg-purple-500 text-slate-50 shadow-purple-600/10 hover:shadow-purple-500/20 cursor-pointer'
          }`}
        >
          {isPublishing ? (
            <>
              {/* Spinner icon */}
              <svg
                className="animate-spin -ml-1 mr-1 h-3 w-3 text-slate-50 w-3 h-3"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              Publishing...
            </>
          ) : (
            'Publish Workflow'
          )}
        </button>
      </div>
    </header>
  );
}
