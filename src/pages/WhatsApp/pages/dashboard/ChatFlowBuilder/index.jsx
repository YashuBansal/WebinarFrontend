import React, { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { applyNodeChanges, applyEdgeChanges, addEdge } from 'reactflow';
import NodesSidebar from './components/NodesSidebar';
import FlowCanvas from './components/FlowCanvas';
import SettingsPanel from './components/SettingsPanel';
import { Bot, Save, Play, ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

const initialNodes = [
  { 
    id: 'start-1', 
    type: 'trigger',
    position: { x: 100, y: 100 }, 
    data: { label: 'Keyword: Hello' }
  },
];

export default function ChatFlowBuilder() {
  const [nodes, setNodes] = useState(initialNodes);
  const [edges, setEdges] = useState([]);
  const [selectedNodeId, setSelectedNodeId] = useState(null);
  const navigate = useNavigate();

  const onNodesChange = useCallback(
    (changes) => setNodes((nds) => applyNodeChanges(changes, nds)),
    []
  );
  const onEdgesChange = useCallback(
    (changes) => setEdges((eds) => applyEdgeChanges(changes, eds)),
    []
  );
  const onConnect = useCallback(
    (params) => setEdges((eds) => addEdge({ ...params, animated: true }, eds)),
    []
  );

  const updateNodeData = useCallback((nodeId, newData) => {
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === nodeId) {
          return { ...node, data: { ...node.data, ...newData } };
        }
        return node;
      })
    );
  }, []);

  const onPublish = useCallback(() => {
    // 1. Validation
    const triggerNodes = nodes.filter((n) => n.type === 'trigger');
    
    if (triggerNodes.length !== 1) {
      toast.error(triggerNodes.length === 0 ? 'Flow must have a Trigger node.' : 'Multiple triggers not allowed.');
      return;
    }

    // Check for isolated nodes (nodes without any edges connecting to/from them)
    const isolatedNodes = nodes.filter((node) => {
      const hasConnection = edges.some((edge) => edge.source === node.id || edge.target === node.id);
      return !hasConnection && node.type !== 'trigger'; // Trigger can be alone if it's the only node
    });

    if (isolatedNodes.length > 0) {
      toast.warning(`Warning: ${isolatedNodes.length} isolated nodes found.`);
    }

    // 2. Serialization
    const flowData = {
      nodes,
      edges,
      viewport: { x: 0, y: 0, zoom: 1 },
      updatedAt: new Date().toISOString(),
    };

    const jsonPayload = JSON.stringify(flowData, null, 2);
    console.log("PUBLISHED FLOW DATA:", jsonPayload);

    // 3. Success Feedback
    toast.success('Flow published successfully!', {
      description: 'Check your browser console for the JSON payload.',
    });
  }, [nodes, edges]);

  const selectedNode = nodes.find((n) => n.id === selectedNodeId);

  return (
    <div className="flex flex-col h-full w-full overflow-hidden bg-slate-50">
      {/* Visual Header */}
      <div className="h-16 shrink-0 bg-white border-b border-slate-200/60 px-6 flex items-center justify-between z-10">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => navigate(-1)}
            className="h-10 w-10 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-100 transition-all text-slate-500"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <div>
            <div className="flex items-center gap-2 text-green-600 font-bold text-[10px] uppercase tracking-widest mb-0.5">
              <Bot className="h-3 w-3" />
              Chatflow V2
            </div>
            <h1 className="text-lg font-black text-slate-900 leading-tight">Untitled Flow</h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="outline" className="h-10 px-5 rounded-xl font-bold text-xs border-slate-200 text-slate-600 hover:bg-slate-50 transition-all">
            <Play className="h-3.5 w-3.5 mr-2 text-green-500 fill-green-500" />
            Test Run
          </Button>
          <Button 
            onClick={onPublish}
            className="h-10 px-6 rounded-xl bg-[#22B573] hover:bg-[#1da467] text-white font-bold text-xs shadow-lg shadow-green-600/20 transition-all"
          >
            Publish Flow
          </Button>
        </div>
      </div>

      {/* Main Builder Area */}
      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* Left: Nodes Palette */}
        <NodesSidebar />

        {/* Center: Canvas */}
        <FlowCanvas 
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          setNodes={setNodes}
          onNodeSelect={(node) => setSelectedNodeId(node?.id || null)} 
        />

        {/* Right: Inline Settings Panel */}
        <SettingsPanel 
          selectedNode={selectedNode} 
          onNodeDataChange={updateNodeData}
        />
      </div>
    </div>
  );
}
