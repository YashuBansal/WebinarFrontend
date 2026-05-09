import React, { useCallback, useRef } from 'react';
import ReactFlow, { 
  Background, 
  Controls, 
  Panel,
  ReactFlowProvider,
  useReactFlow
} from 'reactflow';
import 'reactflow/dist/style.css';

import TriggerNode from '../customNodes/TriggerNode';
import MessageNode from '../customNodes/MessageNode';
import TemplateNode from '../customNodes/TemplateNode';
import ConditionNode from '../customNodes/ConditionNode';

const nodeTypes = {
  trigger: TriggerNode,
  message: MessageNode,
  template: TemplateNode,
  condition: ConditionNode,
};

let id = 0;
const getId = () => `node_${id++}`;

function FlowCanvasInner({ nodes, edges, onNodesChange, onEdgesChange, onConnect, setNodes, onNodeSelect }) {
  const reactFlowWrapper = useRef(null);
  const { project } = useReactFlow();

  const onDragOver = useCallback((event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event) => {
      event.preventDefault();

      const type = event.dataTransfer.getData('application/reactflow');

      if (typeof type === 'undefined' || !type) {
        return;
      }

      const position = project({
        x: event.clientX - reactFlowWrapper.current.getBoundingClientRect().left,
        y: event.clientY - reactFlowWrapper.current.getBoundingClientRect().top,
      });
      
      const newNode = {
        id: getId(),
        type,
        position,
        data: { 
          label: type === 'trigger' ? 'New Trigger' : type === 'message' ? 'New Message' : type === 'template' ? 'New Template' : 'New Condition',
          message: type === 'message' ? 'Type your message here...' : undefined,
          templateName: type === 'template' ? 'Welcome Message' : undefined,
          trueLabel: type === 'condition' ? 'Yes / True' : undefined,
          falseLabel: type === 'condition' ? 'No / False' : undefined
        },
      };

      setNodes((nds) => nds.concat(newNode));
    },
    [project, setNodes]
  );

  const onNodeClick = useCallback((event, node) => {
    onNodeSelect(node);
  }, [onNodeSelect]);

  const onPaneClick = useCallback(() => {
    onNodeSelect(null);
  }, [onNodeSelect]);

  return (
    <div className="flex-1 h-full bg-[#f8fafc] relative overflow-hidden" ref={reactFlowWrapper}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={onNodeClick}
        onPaneClick={onPaneClick}
        onDrop={onDrop}
        onDragOver={onDragOver}
        fitView
      >
        <Background variant="dots" gap={12} size={1} color="#cbd5e1" />
        <Controls className="!bg-white !border-slate-200 !shadow-lg !rounded-xl" />
        
        <Panel position="top-left" className="m-4">
          <div className="flex items-center gap-2 px-3 py-2 bg-white/80 backdrop-blur-md border border-slate-200/60 rounded-xl shadow-sm">
            <div className="h-2 w-2 rounded-full bg-green-500" />
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Live Editor</span>
          </div>
        </Panel>
      </ReactFlow>
    </div>
  );
}

export default function FlowCanvas(props) {
  return (
    <ReactFlowProvider>
      <FlowCanvasInner {...props} />
    </ReactFlowProvider>
  );
}
