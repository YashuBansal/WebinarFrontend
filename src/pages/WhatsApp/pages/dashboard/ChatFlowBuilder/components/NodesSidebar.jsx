import React from 'react';
import { motion } from 'framer-motion';
import { 
  MessageSquare, 
  Zap, 
  Clock, 
  GitBranch, 
  Database,
  Image as ImageIcon,
  FileText
} from 'lucide-react';

const NodeItem = ({ icon: Icon, label, description, type }) => {
  const onDragStart = (event, nodeType) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div 
      className="group flex items-start gap-3 p-3 rounded-xl border border-slate-200/60 bg-white/50 hover:bg-white hover:border-green-400/50 hover:shadow-md transition-all cursor-grab active:cursor-grabbing"
      draggable
      onDragStart={(event) => onDragStart(event, type)}
    >
      <div className={`h-9 w-9 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
        type === 'trigger' ? 'bg-green-50 text-green-600 group-hover:bg-green-100' : 
        type === 'template' ? 'bg-indigo-50 text-indigo-600 group-hover:bg-indigo-100' :
        'bg-blue-50 text-blue-600 group-hover:bg-blue-100'
      }`}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0">
        <p className="text-sm font-bold text-slate-900 leading-tight mb-0.5">{label}</p>
        <p className="text-[11px] text-slate-500 font-medium leading-relaxed truncate">{description}</p>
      </div>
    </div>
  );
};

export default function NodesSidebar() {
  return (
    <aside className="w-64 h-full border-r border-slate-200/60 bg-white/70 backdrop-blur-xl flex flex-col overflow-hidden">
      <div className="p-4 border-b border-slate-200/60">
        <h2 className="text-sm font-black uppercase tracking-widest text-slate-400 mb-1">Nodes Palette</h2>
        <p className="text-[11px] text-slate-500 font-medium">Drag nodes to the canvas</p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar">
        {/* Core Nodes */}
        <div className="space-y-3">
          <h3 className="text-[10px] font-black uppercase tracking-wider text-slate-400 ml-1">Core</h3>
          <NodeItem 
            type="trigger" 
            icon={Zap} 
            label="Keyword Trigger" 
            description="Start flow with a word" 
          />
          <NodeItem 
            type="message" 
            icon={MessageSquare} 
            label="Send Message" 
            description="Send a text response" 
          />
          <NodeItem 
            type="template" 
            icon={FileText} 
            label="Meta Template" 
            description="Pre-approved WhatsApp UI" 
          />
          <NodeItem 
            type="condition" 
            icon={GitBranch} 
            label="Condition" 
            description="If/Else logic branch" 
          />
        </div>

        {/* Media & Templates */}
        <div className="space-y-3">
          <h3 className="text-[10px] font-black uppercase tracking-wider text-slate-400 ml-1">Rich Media</h3>
          <NodeItem type="media" icon={ImageIcon} label="Media" description="Image, Video, or Doc" />
        </div>

        {/* Logic Nodes (V2 Planned) */}
        <div className="space-y-3 opacity-50 grayscale pointer-events-none">
          <h3 className="text-[10px] font-black uppercase tracking-wider text-slate-400 ml-1">Logic (Coming Soon)</h3>
          <NodeItem icon={Clock} label="Wait" description="Delay between steps" />
        </div>
      </div>

      <div className="p-4 bg-slate-50/50 border-t border-slate-200/60">
        <div className="p-3 rounded-xl bg-green-50 border border-green-100 flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
          <p className="text-[10px] font-bold text-green-700 uppercase tracking-wide">V2 Engine Active</p>
        </div>
      </div>
    </aside>
  );
}
