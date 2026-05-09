import React, { memo } from 'react';
import { Handle, Position } from 'reactflow';
import { motion } from 'framer-motion';
import { FileText, Image as ImageIcon, MousePointer2 } from 'lucide-react';

const TemplateNode = ({ data }) => {
  return (
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className="relative min-w-[240px] p-0 rounded-2xl bg-white/95 backdrop-blur-md border border-slate-200 shadow-xl hover:shadow-indigo-500/10 transition-all group overflow-hidden"
    >
      {/* Header Badge */}
      <div className="absolute top-3 left-4 z-20 px-2 py-0.5 bg-indigo-500 text-white text-[9px] font-black uppercase tracking-widest rounded-full shadow-lg shadow-indigo-500/20 flex items-center gap-1">
        <FileText className="h-3 w-3 fill-white" />
        Meta Template
      </div>

      {/* WhatsApp Interface Simulation */}
      <div className="flex flex-col">
        {/* Header Media Placeholder */}
        <div className="h-24 bg-slate-100 flex items-center justify-center relative overflow-hidden">
          <ImageIcon className="h-8 w-8 text-slate-300" />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-100/50 to-transparent" />
        </div>

        {/* Body Content */}
        <div className="p-4 space-y-2">
          <h4 className="text-xs font-black text-slate-800 tracking-tight">
            {data.templateName || 'Template Title'}
          </h4>
          <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 min-h-[40px]">
            <p className="text-[10px] text-slate-500 font-medium leading-relaxed italic">
              Hello {"{{name}}"}, welcome to our service. How can we help you today?
            </p>
          </div>
        </div>

        {/* Mock Buttons */}
        <div className="border-t border-slate-100 flex flex-col divide-y divide-slate-100">
           <div className="py-2 px-4 flex items-center justify-center gap-2 text-blue-500 font-bold text-[10px] hover:bg-slate-50 transition-colors">
              <MousePointer2 className="h-3 w-3" />
              Visit Website
           </div>
           <div className="py-2 px-4 flex items-center justify-center gap-2 text-blue-500 font-bold text-[10px] hover:bg-slate-50 transition-colors">
              Call Now
           </div>
        </div>
      </div>

      {/* Handles */}
      <Handle
        type="target"
        position={Position.Left}
        className="!w-3 !h-3 !bg-slate-300 !border-2 !border-white !shadow-sm hover:!bg-indigo-500 transition-colors"
      />
      
      <Handle
        type="source"
        position={Position.Right}
        className="!w-3 !h-3 !bg-indigo-500 !border-2 !border-white !shadow-sm hover:!scale-125 transition-transform"
      />
    </motion.div>
  );
};

export default memo(TemplateNode);
