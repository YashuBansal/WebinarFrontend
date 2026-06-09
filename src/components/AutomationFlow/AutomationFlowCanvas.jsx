import React, { useMemo, useCallback, useRef, useState, useEffect } from 'react';
import ReactFlow, {
  MiniMap,
  Controls,
  Background,
  MarkerType,
} from 'reactflow';
import { useSelector, useDispatch } from 'react-redux';
import 'reactflow/dist/style.css';

// Import our custom UI node components and sidebar
import TriggerNode from './TriggerNode';
import ConditionNode from './ConditionNode';
import DelayNode from './DelayNode';
import ActionNode from './ActionNode';
import NodeSidebar from './NodeSidebar';
import DeletableEdge from './DeletableEdge';

import FlowHeader from './FlowHeader';
import AutomationDashboardList from './AutomationDashboardList';
import TriggerSetupDrawer from './TriggerSetupDrawer';
import ActionSetupDrawer from './ActionSetupDrawer';
import {
  setNodes,
  setEdges,
  addConnection,
  addNode,
  onNodesChange,
  onEdgesChange,
  setFlowInfo,
  updateNodeData,
} from '../../features/slices/flowSlice';

/**
 * Modern Automation Workflow Canvas UI Workspace
 * Fully supports Drag and Drop node creation using HTML5 Drag API
 */
export default function AutomationFlowCanvas() {
  const dispatch = useDispatch();
  const reactFlowWrapper = useRef(null);
  const [viewMode, setViewMode] = useState('list'); // 'list' | 'editor'

  // 1. Tracks the active React Flow engine instance to enable coordinate space translation
  const [reactFlowInstance, setReactFlowInstance] = useState(null);

  // 2. Retrieve nodes/edges from the Redux state
  const nodes = useSelector((state) => state.flow?.nodes || []);
  const edges = useSelector((state) => state.flow?.edges || []);

  // 3. Register custom React Flow node handlers
  const nodeTypes = useMemo(
    () => ({
      trigger: TriggerNode,
      condition: ConditionNode,
      delay: DelayNode,
      action: ActionNode,
    }),
    []
  );

  // 3b. Register custom React Flow edge handlers
  const edgeTypes = useMemo(
    () => ({
      deletable: DeletableEdge,
    }),
    []
  );

  // 4. React Flow integration callbacks
  const handleNodesChange = useCallback(
    (changes) => {
      dispatch(onNodesChange(changes));
    },
    [dispatch]
  );

  const handleEdgesChange = useCallback(
    (changes) => {
      dispatch(onEdgesChange(changes));
    },
    [dispatch]
  );

  const onConnect = useCallback(
    (params) => {
      const newEdge = {
        ...params,
        id: `e-${params.source}-${params.target}-${params.sourceHandle || ''}`,
        type: 'deletable', // Force newly created connections to use deletable edge
        animated: true,
        style: { stroke: '#4f46e5', strokeWidth: 2 },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: '#4f46e5',
        },
      };
      dispatch(addConnection(newEdge));
    },
    [dispatch]
  );

  // 5. Drag and Drop event overrides
  const onDragOver = useCallback((event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event) => {
      event.preventDefault();

      // Ensure that our React Flow engine is initialized
      if (!reactFlowInstance) return;

      // Extract the payload sent by the Sidebar on drag start
      const nodeType = event.dataTransfer.getData('application/reactflow');
      if (!nodeType) return;

      // Translate client coordinate points to exact flow canvas relative positioning
      const position = reactFlowInstance.screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      // Create a production-ready, pre-populated node state payload
      const newNode = {
        id: `${nodeType}_${Date.now()}`,
        type: nodeType,
        position,
        data: {
          label: `${nodeType.charAt(0).toUpperCase() + nodeType.slice(1)} Node`,
          // Seed robust configurations matching backend schema specifications:
          ...(nodeType === 'trigger' ? { triggerType: 'webhook' } : {}),
          ...(nodeType === 'condition' ? { field: 'email', operator: 'equals', value: '' } : {}),
          ...(nodeType === 'action' ? { actionType: 'send_whatsapp_approved', templateName: '', variables: [] } : {}),
          ...(nodeType === 'delay' ? { amount: 5, unit: 'minutes' } : {}),
        },
      };

      dispatch(addNode(newNode));
    },
    [reactFlowInstance, dispatch]
  );

  // Theme observer to support real-time light/dark grid switches
  const [isDark, setIsDark] = useState(
    typeof window !== 'undefined' && document.documentElement.classList.contains('dark')
  );

  useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsDark(document.documentElement.classList.contains('dark'));
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  const [activeDrawerNodeId, setActiveDrawerNodeId] = useState(null);

  // Find current node data
  const currentDrawerNode = useMemo(() => {
    if (!activeDrawerNodeId) return null;
    return nodes.find((n) => n.id === activeDrawerNodeId);
  }, [activeDrawerNodeId, nodes]);

  // Listen to open drawer events from nodes
  useEffect(() => {
    const handleOpenDrawer = (e) => {
      if (e.detail?.id) {
        setActiveDrawerNodeId(e.detail.id);
      }
    };
    window.addEventListener('open-trigger-drawer', handleOpenDrawer);
    window.addEventListener('open-action-drawer', handleOpenDrawer);
    return () => {
      window.removeEventListener('open-trigger-drawer', handleOpenDrawer);
      window.removeEventListener('open-action-drawer', handleOpenDrawer);
    };
  }, []);

  // Handle double clicking nodes on the canvas
  const onNodeDoubleClick = useCallback((event, node) => {
    if (node.type === 'trigger' || node.type === 'action') {
      setActiveDrawerNodeId(node.id);
    }
  }, []);

  const isTriggerActive = currentDrawerNode?.type === 'trigger';
  const isActionActive = currentDrawerNode?.type === 'action';

  if (viewMode === 'list') {
    return (
      <AutomationDashboardList
        onEditFlow={(flow) => {
          dispatch(setNodes(flow.graph?.nodes || []));
          dispatch(setEdges(flow.graph?.edges || []));
          dispatch(setFlowInfo({ flowId: flow._id, name: flow.name, flowCategory: flow.flowCategory || 'general' }));
          setViewMode('editor');
        }}
        onCreateFlow={(category) => {
          dispatch(setNodes([]));
          dispatch(setEdges([]));
          dispatch(setFlowInfo({ flowId: null, name: '', flowCategory: category || 'general' }));
          setViewMode('editor');
        }}
      />
    );
  }

  return (
    <div className="w-full h-[calc(100vh-64px)] bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col overflow-hidden transition-colors duration-300">
      {/* Live Interactive Workflow Saving Header */}
      <FlowHeader onBack={() => setViewMode('list')} />

      {/* Main Workspace Layout: Drag Side Dock + Flow Canvas Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Side Draggable Panel */}
        <NodeSidebar />

        {/* Right Canvas Drop Zone */}
        <div
          ref={reactFlowWrapper}
          className="flex-1 h-full relative"
          onDragOver={onDragOver}
          onDrop={onDrop}
        >
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={handleNodesChange}
            onEdgesChange={handleEdgesChange}
            onConnect={onConnect}
            nodeTypes={nodeTypes}
            edgeTypes={edgeTypes}
            defaultEdgeOptions={{ type: 'deletable' }}
            onInit={setReactFlowInstance}
            onNodeDoubleClick={onNodeDoubleClick}
            fitView
            className="bg-slate-50 dark:bg-slate-950"
          >
            {/* Custom controls with premium styling overrides */}
            <Controls
              className="bg-white border border-slate-200 text-slate-600 fill-slate-600 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-200 dark:fill-slate-200"
              showInteractive={false}
            />
            <MiniMap
              className="bg-white/90 border border-slate-200 rounded-lg shadow-xl dark:bg-slate-900/90 dark:border-slate-800"
              nodeColor={(node) => {
                switch (node.type) {
                  case 'trigger':
                    return '#3b82f6';
                  case 'condition':
                    return '#f59e0b';
                  case 'delay':
                    return '#a855f7';
                  case 'action':
                    return '#10b981';
                  default:
                    return '#64748b';
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
        onClose={() => setActiveDrawerNodeId(null)}
        nodeId={activeDrawerNodeId}
        currentNodeData={currentDrawerNode?.data || {}}
        onUpdate={(updatedData) => {
          dispatch(
            updateNodeData({
              id: activeDrawerNodeId,
              data: updatedData,
            })
          );
        }}
      />

      {/* Slide-out Action Setup Drawer */}
      <ActionSetupDrawer
        isOpen={!!activeDrawerNodeId && isActionActive}
        onClose={() => setActiveDrawerNodeId(null)}
        nodeId={activeDrawerNodeId}
        currentNodeData={currentDrawerNode?.data || {}}
        onUpdate={(updatedData) => {
          dispatch(
            updateNodeData({
              id: activeDrawerNodeId,
              data: updatedData,
            })
          );
        }}
      />
    </div>
  );
}
