import React, { useMemo, useCallback, useRef, useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  MarkerType,
  ReactFlowProvider,
} from "reactflow";
import "reactflow/dist/style.css";
import { getAutomation, createAutomation, updateAutomation } from "@/api/modules/automations";
import { useProjectContext } from "@/context/ProjectContext";
import { toast } from "sonner";
import axiosInstance, { API_BASE_URL } from "@/api/axios";
import { Loader2 } from "lucide-react";

// @ts-ignore
import { useTheme } from "../../../../../contexts/ThemeContext";
// Import global enterprise-grade nodes from core CRM builder to enforce centralized schema compliance
// @ts-ignore
import TriggerSetupDrawer from "../../../../../components/AutomationFlow/TriggerSetupDrawer";
// @ts-ignore
import ActionSetupDrawer from "../../../../../components/AutomationFlow/ActionSetupDrawer";
// @ts-ignore
import TriggerNode from "../../../../../components/AutomationFlow/TriggerNode";
// @ts-ignore
import ConditionNode from "../../../../../components/AutomationFlow/ConditionNode";
// @ts-ignore
import DelayNode from "../../../../../components/AutomationFlow/DelayNode";
// @ts-ignore
import ActionNode from "../../../../../components/AutomationFlow/ActionNode";
// @ts-ignore
import WhatsAppMessageNode from "../../../../../components/AutomationFlow/WhatsAppMessageNode";
// @ts-ignore
import DeletableEdge from "../../../../../components/AutomationFlow/DeletableEdge";

import {
  setNodes,
  setEdges,
  onNodesChange as reduxOnNodesChange,
  onEdgesChange as reduxOnEdgesChange,
  setActiveDrawerNodeId,
  addConnection,
  updateNodeData,
  setFlowInfo,
} from "../../../../../features/slices/flowSlice";

// Types
type NodeKind = "trigger" | "condition" | "delay" | "action";

// DRAG NODES Configuration matching NodeSidebar
const DRAG_NODES = [
  {
    type: "trigger",
    title: "Trigger Event",
    description: "Incoming WhatsApp message or specific keyword match callbacks.",
    colorClass: "border-blue-200 bg-blue-50/50 hover:bg-blue-50 text-blue-600 dark:border-blue-500/30 dark:bg-blue-500/5 dark:hover:bg-blue-500/10 dark:text-blue-400",
    glowClass: "bg-blue-100/50 shadow-blue-100/10 dark:bg-blue-500/20 dark:shadow-blue-500/10",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
  },
  {
    type: "condition",
    title: "CONDITION LOGIC",
    description: "Split your WhatsApp flow based on tags or data.",
    colorClass: "border-amber-200 bg-amber-50/50 hover:bg-amber-50 text-amber-600 dark:border-amber-500/30 dark:bg-amber-500/5 dark:hover:bg-amber-500/10 dark:text-amber-400",
    glowClass: "bg-amber-100/50 shadow-amber-100/10 dark:bg-amber-500/20 dark:shadow-amber-500/10",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 7a3 3 0 100-6 3 3 0 000 6zM8 17a3 3 0 100-6 3 3 0 000 6zM16 12a3 3 0 100-6 3 3 0 000 6zM6.5 7.5A6.002 6.002 0 0116 12m-9.5 4.5a6.003 6.003 0 005.5-4" />
      </svg>
    ),
  },
  {
    type: "delay",
    title: "TIME DELAY",
    description: "Pause execution for a specific duration.",
    colorClass: "border-purple-200 bg-purple-50/50 hover:bg-purple-50 text-purple-600 dark:border-purple-500/30 dark:bg-purple-500/5 dark:hover:bg-purple-500/10 dark:text-purple-400",
    glowClass: "bg-purple-100/50 shadow-purple-100/10 dark:bg-purple-500/20 dark:shadow-purple-500/10",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    type: "action",
    title: "Integration Action",
    description: "Send session text, approved template notifications, or media payloads.",
    colorClass: "border-green-200 bg-green-50/50 hover:bg-green-50 text-green-600 dark:border-green-500/30 dark:bg-green-500/5 dark:hover:bg-green-500/10 dark:text-green-400",
    glowClass: "bg-green-100/50 shadow-green-100/10 dark:bg-green-500/20 dark:shadow-green-500/10",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 19v-8.93a2 2 0 01.89-1.664l8-5.333a2 2 0 012.22 0l8 5.333A2 2 0 0121 10.07V19M3 19a2 2 0 002 2h14a2 2 0 002-2M3 19l6.75-4.5M21 19l-6.75-4.5M3 10l6.75 4.5M21 10l-6.75 4.5m0 0l-5.625-3.75" />
      </svg>
    ),
  },
];

function AutomationBuilderContent() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { projectId, automationId } = useParams<{ projectId: string; automationId: string }>();
  const { selectedProject } = useProjectContext();
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [reactFlowInstance, setReactFlowInstance] = useState<any>(null);

  const [status, setStatus] = useState<"active" | "inactive">("inactive");
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Redux Selectors
  const nodes = useSelector((state: any) => state.flow.nodes || []);
  const edges = useSelector((state: any) => state.flow.edges || []);
  const flowName = useSelector((state: any) => state.flow.name) || "Untitled WABA Flow";
  const activeDrawerNodeId = useSelector((state: any) => state.flow.activeDrawerNodeId);

  // Find current node data
  const currentDrawerNode = useMemo(() => {
    if (!activeDrawerNodeId) return null;
    return nodes.find((n: any) => n.id === activeDrawerNodeId);
  }, [activeDrawerNodeId, nodes]);

  // Listen to open drawer events from nodes
  useEffect(() => {
    const handleOpenTriggerDrawer = (e: any) => {
      if (e.detail?.id) {
        dispatch(setActiveDrawerNodeId(e.detail.id));
      }
    };
    const handleOpenActionDrawer = (e: any) => {
      if (e.detail?.id) {
        dispatch(setActiveDrawerNodeId(e.detail.id));
      }
    };
    window.addEventListener("open-trigger-drawer", handleOpenTriggerDrawer);
    window.addEventListener("open-action-drawer", handleOpenActionDrawer);
    return () => {
      window.removeEventListener("open-trigger-drawer", handleOpenTriggerDrawer);
      window.removeEventListener("open-action-drawer", handleOpenActionDrawer);
    };
  }, [dispatch]);

  const isTriggerActive = currentDrawerNode?.type === "trigger";
  const isActionActive = currentDrawerNode?.type === "action";

  // Node Change Handlers mapping to ReactFlow changes
  const onNodesChange = useCallback(
    (changes: any) => dispatch(reduxOnNodesChange(changes)),
    [dispatch]
  );

  const onEdgesChange = useCallback(
    (changes: any) => dispatch(reduxOnEdgesChange(changes)),
    [dispatch]
  );

  // Load flow configurations
  useEffect(() => {
    if (!projectId) return;

    if (automationId && automationId !== "new") {
      setIsLoading(true);
      axiosInstance.get(`/automations/${automationId}`, {
        params: { projectId }
      })
        .then((res) => {
          const flow = res.data;
          setStatus(flow.status);
          dispatch(setFlowInfo({ flowId: flow._id || flow.id, name: flow.name, flowCategory: "whatsapp" }));
          
          const g = flow.graph || { nodes: [], edges: [] };
          
          const loadedNodes = (g.nodes || []).map((n: any) => ({
            ...n,
            data: n.data || {},
          }));

          const loadedEdges = (g.edges || []).map((e: any) => ({
            ...e,
            type: "deletable",
            animated: true,
            style: { stroke: "#7c3aed", strokeWidth: 2 },
            markerEnd: {
              type: MarkerType.ArrowClosed,
              color: "#7c3aed",
            },
          }));

          dispatch(setNodes(loadedNodes));
          dispatch(setEdges(loadedEdges));
        })
        .catch((err: any) => {
          console.error("Failed to load WABA flow graph:", err);
          toast.error("Failed to load WABA flow configuration.");
          navigate(`/whatsapp/dashboard/${projectId}/automations`);
        })
        .finally(() => {
          setIsLoading(false);
        });
    } else {
      // Create mode: clean reset and add default trigger node
      const triggerId = `trigger-${Date.now()}`;
      const defaultTrigger = {
        id: triggerId,
        type: "trigger",
        position: { x: 250, y: 80 },
        data: {
          label: "Trigger Event",
          triggerType: "incoming_whatsapp",
        },
      };
      dispatch(setNodes([defaultTrigger]));
      dispatch(setEdges([]));
      dispatch(setFlowInfo({ flowId: null, name: "Untitled WABA Flow", flowCategory: "whatsapp" }));
    }
  }, [projectId, automationId, dispatch, navigate]);

  // Connect handler
  const onConnect = useCallback(
    (params: any) => {
      const edgeId = `e-${params.source}-${params.target}-${params.sourceHandle || ""}`;
      const newEdge = {
        ...params,
        id: edgeId,
        type: "deletable",
        animated: true,
        style: { stroke: "#7c3aed", strokeWidth: 2 },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: "#7c3aed",
        },
      };
      dispatch(addConnection(newEdge));
    },
    [dispatch]
  );

  // Drag over
  const onDragOver = useCallback((event: any) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }, []);

  // Drop module
  const onDrop = useCallback(
    (event: any) => {
      event.preventDefault();
      if (!reactFlowInstance || !reactFlowWrapper.current) return;

      const nodeType = event.dataTransfer.getData("application/reactflow");
      if (!nodeType) return;

      const bounds = reactFlowWrapper.current.getBoundingClientRect();
      const position = reactFlowInstance.screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      const id = `${nodeType}_${Date.now()}`;
      const newNode = {
        id,
        type: nodeType,
        position,
        data: {
          label: `${nodeType.charAt(0).toUpperCase() + nodeType.slice(1)} Node`,
          ...(nodeType === "trigger" ? { triggerType: "incoming_whatsapp" } : {}),
          ...(nodeType === "condition" ? { field: "email", operator: "equals", value: "" } : {}),
          ...(nodeType === "action"
            ? { actionType: "whatsapp_send_session_template", templateName: "", variables: [] }
            : {}),
          ...(nodeType === "delay" ? { amount: 5, unit: "minutes" } : {}),
        },
      };

      dispatch(setNodes([...nodes, newNode]));
    },
    [reactFlowInstance, dispatch, nodes]
  );

  // Save workflow graph with Express backend save route
  const handleSaveWorkflow = async (saveStatus: 'draft' | 'published') => {
    if (!projectId) return;

    // Validation: check if nodes array contains at least one trigger node
    const hasTrigger = nodes.some((node: any) => node.type === 'trigger');
    if (!hasTrigger) {
      toast.error("🚨 Your flow must start with a Trigger.");
      return;
    }

    setIsSaving(true);
    const loadingToastId = toast.loading(
      saveStatus === 'published' 
        ? "Publishing workflow live... Please wait." 
        : "Saving draft sequence... Please wait."
    );

    // Strip heavy UI properties and callbacks from nodes to produce a clean layout matching the NestJS Mongoose models
    const sanitizedNodes = nodes.map((node: any) => {
      const {
        width,
        height,
        selected,
        dragging,
        positionAbsolute,
        data,
        ...rest
      } = node || {};

      const { onChange, onDelete, ...sanitizedData } = data || {};

      return {
        ...rest,
        data: sanitizedData,
      };
    });

    // Strip UI classes and callbacks from edges, keeping strictly { id, source, target, sourceHandle }
    const sanitizedEdges = edges.map((edge: any) => ({
      id: edge.id,
      source: edge.source,
      target: edge.target,
      sourceHandle: edge.sourceHandle || null,
    }));

    const payload = {
      id: automationId === "new" ? null : automationId,
      name: flowName || "Untitled WABA Flow",
      status: saveStatus === 'published' ? 'active' : 'inactive',
      flowType: 'whatsapp',
      graph: {
        nodes: sanitizedNodes,
        edges: sanitizedEdges,
      }
    };

    try {
      const res = await axiosInstance.post('/automations/flow', payload, {
        params: { projectId },
      });

      toast.dismiss(loadingToastId);
      toast.success(`✅ Workflow ${saveStatus} successfully!`);

      // Update flow status local state
      setStatus(saveStatus === 'published' ? 'active' : 'inactive');

      if (automationId === "new" && res.data?.flowId) {
        navigate(`/whatsapp/dashboard/${projectId}/automations/${res.data.flowId}`);
      }
    } catch (err: any) {
      toast.dismiss(loadingToastId);
      let errorMsg = "An unexpected error occurred while saving the workflow.";
      if (typeof err === "string") {
        errorMsg = err;
      } else if (err?.response?.data?.error) {
        errorMsg = err.response.data.error;
      } else if (err?.response?.data?.message) {
        errorMsg = err.response.data.message;
      } else if (err?.message) {
        errorMsg = err.message;
      }
      
      if (Array.isArray(errorMsg)) {
        errorMsg = errorMsg[0];
      }
      toast.error(errorMsg);
      console.error("Failed to save WABA flow graph:", err);
    } finally {
      setIsSaving(false);
    }
  };

  // Node registration
  const nodeTypes = useMemo(
    () => ({
      trigger: TriggerNode,
      condition: ConditionNode,
      delay: DelayNode,
      action: WhatsAppMessageNode,
    }),
    []
  );

  // Edge registration
  const edgeTypes = useMemo(
    () => ({
      deletable: DeletableEdge,
    }),
    []
  );

  // Drag start handler for sidebar
  const onDragStart = (event: any, nodeType: string) => {
    event.dataTransfer.setData("application/reactflow", nodeType);
    event.dataTransfer.effectAllowed = "move";
  };

  if (isLoading) {
    return (
      <div className="w-full h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950">
        <Loader2 className="w-10 h-10 animate-spin text-purple-600 dark:text-purple-400 mb-4" />
        <p className="text-sm font-semibold text-slate-600 dark:text-slate-400 animate-pulse">
          Loading WABA Automation sequence...
        </p>
      </div>
    );
  }

  return (
    <div className="w-full h-[calc(100vh-64px)] bg-slate-50 dark:bg-slate-955 text-slate-900 dark:text-slate-100 flex flex-col overflow-hidden transition-colors duration-300">
      {/* Upper Navigation Header Overhauled to 100% match FlowHeader */}
      <header className="h-16 px-6 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800/80 flex items-center justify-between z-25 relative shadow-sm transition-colors duration-300">
        {/* Title / Description Block */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(`/whatsapp/dashboard/${projectId}/automations`)}
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
          <div className="flex items-center gap-2">
            {/* Neon Glow Bullet */}
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
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
            value={flowName}
            onChange={(e) => dispatch(setFlowInfo({ name: e.target.value }))}
            placeholder="Workflow Name (e.g. WABA Onboarding Loop)"
            className="bg-slate-50 text-slate-800 dark:bg-slate-955/70 dark:text-slate-100 font-semibold border border-slate-200 dark:border-slate-800/80 rounded-xl px-3 py-1.5 w-64 focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500/20 transition-all nodrag"
          />
        </div>

        {/* Primary Actions Button Group */}
        <div className="flex items-center gap-3">
          {/* Save Draft Button */}
          <button
            onClick={() => handleSaveWorkflow("draft")}
            disabled={isSaving}
            className="px-4 py-2 rounded-xl text-xs font-semibold shadow-lg transition-all active:scale-95 flex items-center gap-2 bg-slate-800 hover:bg-slate-750 text-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-700/80 shadow-slate-900/10 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            Save Draft
          </button>

          {/* Publish Live Button */}
          <button
            onClick={() => handleSaveWorkflow("published")}
            disabled={isSaving}
            className="px-4 py-2 rounded-xl text-xs font-semibold shadow-lg transition-all active:scale-95 flex items-center gap-2 text-slate-55 shadow-green-600/10 hover:shadow-green-500/20 cursor-pointer text-white disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ backgroundColor: "#22B573" }}
          >
            {isSaving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            Publish Workflow
          </button>
        </div>
      </header>

      {/* Main Workspace Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Side Draggable Panel */}
        <aside className="w-80 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col h-full select-none transition-colors duration-300">
          <div className="p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40">
            <div className="flex items-center gap-2">
              <svg
                className="w-5 h-5 text-green-505 dark:text-green-400"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                />
              </svg>
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">WABA Canvas Nodes</h3>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Drag modules onto the canvas workspace to build WhatsApp chatbot automation sequences.
            </p>
          </div>

          <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
            {DRAG_NODES.map((node) => (
              <div
                key={node.type}
                draggable
                onDragStart={(e) => onDragStart(e, node.type)}
                className={`flex flex-col gap-2 p-4 border rounded-2xl cursor-grab active:cursor-grabbing transition-all duration-300 ${node.colorClass}`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`relative flex items-center justify-center w-9 h-9 rounded-xl border border-slate-200 dark:border-slate-800 shadow-md ${node.glowClass}`}
                  >
                    {node.icon}
                  </div>
                  <h4 className="text-xs font-bold text-slate-700 dark:text-slate-200 tracking-wide uppercase">
                    {node.title}
                  </h4>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                  {node.description}
                </p>
              </div>
            ))}
          </div>

          <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20 text-[10px] text-slate-500 dark:text-slate-500 font-semibold text-center uppercase tracking-wider">
            Drag elements to build DAG
          </div>
        </aside>

        {/* Right Canvas Zone */}
        <div
          ref={reactFlowWrapper}
          className="flex-1 h-full relative"
          onDragOver={onDragOver}
          onDrop={onDrop}
        >
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            nodeTypes={nodeTypes}
            edgeTypes={edgeTypes}
            defaultEdgeOptions={{ type: "deletable" }}
            onInit={setReactFlowInstance}
            fitView
            className="bg-slate-50 dark:bg-slate-950"
          >
            <Controls className="bg-white border border-slate-200 text-slate-600 fill-slate-600 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-200 dark:fill-slate-200" />
            <MiniMap
              className="bg-white/90 border border-slate-200 rounded-lg shadow-xl dark:bg-slate-900/90 dark:border-slate-800"
              nodeColor={(node) => {
                switch (node.type) {
                  case "trigger":
                    return "#3b82f6";
                  case "condition":
                    return "#f59e0b";
                  case "delay":
                    return "#22b573";
                  case "action":
                    return "#22b573";
                  default:
                    return "#64748b";
                }
              }}
              maskColor={isDark ? "rgba(15, 23, 42, 0.7)" : "rgba(241, 245, 249, 0.7)"}
            />
            <Background color={isDark ? "#334155" : "#cbd5e1"} gap={20} size={1} />
          </ReactFlow>
        </div>
      </div>

      {/* Slide-out Trigger Setup Drawer */}
      <TriggerSetupDrawer
        isOpen={!!activeDrawerNodeId && isTriggerActive}
        onClose={() => dispatch(setActiveDrawerNodeId(null))}
        nodeId={activeDrawerNodeId}
        currentNodeData={currentDrawerNode?.data || {}}
        onUpdate={(updatedData: any) => {
          dispatch(updateNodeData({ id: activeDrawerNodeId, data: updatedData }));
        }}
      />

      {/* Slide-out Action Setup Drawer */}
      <ActionSetupDrawer
        isOpen={!!activeDrawerNodeId && isActionActive}
        onClose={() => dispatch(setActiveDrawerNodeId(null))}
        nodeId={activeDrawerNodeId}
        currentNodeData={currentDrawerNode?.data || {}}
        onUpdate={(updatedData: any) => {
          dispatch(updateNodeData({ id: activeDrawerNodeId, data: updatedData }));
        }}
      />
    </div>
  );
}

export default function AutomationBuilder() {
  return (
    <ReactFlowProvider>
      <AutomationBuilderContent />
    </ReactFlowProvider>
  );
}
