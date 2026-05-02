import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import ReactFlow, { Background, Controls, addEdge } from "reactflow";
import "reactflow/dist/style.css";
import { Button } from "@/components/ui/button";
import { getAutomation, createAutomation, updateAutomation } from "@/api/modules/automations";

type NodeKind = 'trigger:webinar' | 'logic:filter' | 'logic:wait' | 'action:whatsapp';

export default function AutomationBuilder() {
  const navigate = useNavigate();
  const { projectId, automationId } = useParams<{ projectId: string; automationId: string }>();

  const [name, setName] = useState(automationId === 'new' ? 'Untitled Flow' : '');
  const [status, setStatus] = useState<'active' | 'inactive'>('inactive');
  const [selectedNode, setSelectedNode] = useState<any | null>(null);

  const [nodes, setNodes] = useState<any[]>([]);
  const [edges, setEdges] = useState<any[]>([]);
  const onNodesChange = (changes: any) => setNodes(changes?.target ?? nodes);
  const onEdgesChange = (changes: any) => setEdges(changes?.target ?? edges);

  useEffect(() => {
    if (!projectId) return;
    if (automationId && automationId !== 'new') {
      getAutomation(projectId, automationId).then((flow) => {
        setName(flow.name);
        setStatus(flow.status);
        const g = flow.graph || { nodes: [], edges: [] } as any;
        setNodes(g.nodes || []);
        setEdges(g.edges || []);
      });
    } else {
      // seed with trigger node
      const triggerNode: any = {
        id: 'trigger-1',
        type: 'input',
        position: { x: 100, y: 100 },
        data: { label: 'Webinar Registration', type: 'trigger:webinar', webinarId: '' },
      };
      setNodes([triggerNode]);
    }
  }, [projectId, automationId, setNodes, setEdges]);

  const onConnect = (connection: any) => setEdges((eds: any[]) => addEdge(connection, eds));

  const addNode = (kind: NodeKind) => {
    const id = `${kind}-${Date.now()}` as string;
    const base: any = {
      id,
      position: { x: 300, y: 100 + nodes.length * 50 },
      data: { label: labelFor(kind), type: kind },
    };
    if (kind === 'logic:filter') base.data.rules = [];
    if (kind === 'logic:wait') base.data = { ...base.data, amount: 10, unit: 'minutes' };
    if (kind === 'action:whatsapp') base.data = { ...base.data, templateName: '', phonePath: 'phone', variables: [] };
    setNodes((prev: any[]) => [...prev, base]);
  };

  const save = async () => {
    if (!projectId) return;
    const payload = { name, status, graph: { nodes, edges } } as any;
    if (automationId === 'new') {
      const res = await createAutomation(projectId, payload);
      navigate(`/whatsapp/dashboard/${projectId}/automations/${res._id}`);
    } else if (automationId) {
      await updateAutomation(projectId, automationId, payload);
    }
  };

  return (
    <div className="p-4 flex gap-4">
      <div className="w-64 space-y-3">
        <div className="space-y-2">
          <div className="text-sm font-medium">Flow</div>
          <input className="w-full border rounded px-2 py-1 text-sm" value={name} onChange={(e) => setName(e.target.value)} />
          <select className="w-full border rounded px-2 py-1 text-sm" value={status} onChange={(e) => setStatus(e.target.value as any)}>
            <option value="inactive">Inactive</option>
            <option value="active">Active</option>
          </select>
          <Button onClick={save} className="w-full">Save</Button>
        </div>
        <div className="space-y-2">
          <div className="text-sm font-medium">Nodes</div>
          <Button variant="outline" className="w-full" onClick={() => addNode('logic:filter')}>Filter</Button>
          <Button variant="outline" className="w-full" onClick={() => addNode('logic:wait')}>Wait</Button>
          <Button variant="outline" className="w-full" onClick={() => addNode('action:whatsapp')}>Send WhatsApp</Button>
        </div>
        <div className="space-y-2">
          <div className="text-sm font-medium">Properties</div>
          {!selectedNode && <div className="text-xs text-muted-foreground">Select a node</div>}
          {selectedNode && <NodeProperties node={selectedNode} onChange={(data: any) => setNodes((prev: any[]) => prev.map((n: any) => n.id === selectedNode.id ? { ...n, data: { ...n.data, ...data } } : n))} />}
        </div>
      </div>
      <div className="flex-1 h-[70vh] border rounded">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeClick={(_: any, n: any) => setSelectedNode(n)}
          fitView
        >
          <Background />
          <Controls />
        </ReactFlow>
      </div>
    </div>
  );
}

function labelFor(kind: NodeKind) {
  switch (kind) {
    case 'trigger:webinar':
      return 'Webinar Registration';
    case 'logic:filter':
      return 'Filter';
    case 'logic:wait':
      return 'Wait';
    case 'action:whatsapp':
      return 'Send WhatsApp';
    default:
      return kind;
  }
}

function NodeProperties({ node, onChange }: { node: any; onChange: (data: any) => void }) {
  const kind = node.data?.type as NodeKind;
  if (kind === 'logic:filter') {
    return (
      <div className="space-y-2">
        <div className="text-xs">Rules (simple AND):</div>
        <Button variant="outline" size="sm" onClick={() => onChange({ rules: [...(node.data.rules || []), { field: 'tags', operator: 'contains', value: 'vip' }] })}>Add Rule</Button>
      </div>
    );
  }
  if (kind === 'logic:wait') {
    return (
      <div className="space-y-2">
        <label className="text-xs">Amount</label>
        <input className="w-full border rounded px-2 py-1 text-sm" type="number" value={node.data.amount ?? 10} onChange={(e) => onChange({ amount: Number(e.target.value) })} />
        <select className="w-full border rounded px-2 py-1 text-sm" value={node.data.unit ?? 'minutes'} onChange={(e) => onChange({ unit: e.target.value })}>
          <option value="minutes">Minutes</option>
          <option value="hours">Hours</option>
          <option value="days">Days</option>
        </select>
      </div>
    );
  }
  if (kind === 'action:whatsapp') {
    return (
      <div className="space-y-2">
        <label className="text-xs">Template Name</label>
        <input className="w-full border rounded px-2 py-1 text-sm" value={node.data.templateName ?? ''} onChange={(e) => onChange({ templateName: e.target.value })} />
        <label className="text-xs">Phone Path (from trigger)</label>
        <input className="w-full border rounded px-2 py-1 text-sm" value={node.data.phonePath ?? 'phone'} onChange={(e) => onChange({ phonePath: e.target.value })} />
      </div>
    );
  }
  return <div className="text-xs text-muted-foreground">No properties</div>;
}



