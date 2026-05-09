import React, { memo } from 'react';
import { Handle, Position } from 'reactflow';
import { motion } from 'framer-motion';
import { Zap, Hash } from 'lucide-react';

const TriggerNode = ({ data }) => {
  return (
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className="relative min-w-[180px] p-4 rounded-2xl bg-white/80 backdrop-blur-md border-2 border-green-400/50 shadow-[0_0_20px_rgba(34,197,94,0.1)] group transition-all"
    >
      <div className="absolute -top-3 left-4 px-2 py-0.5 bg-green-500 text-white text-[10px] font-black uppercase tracking-widest rounded-full shadow-lg shadow-green-500/20 flex items-center gap-1">
        <Zap className="h-3 w-3 fill-white" />
        Trigger
      </div>

      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-green-50 flex items-center justify-center text-green-600 shrink-0">
          <Hash className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Keyword Match</p>
          <p className="text-sm font-bold text-slate-900 truncate">{data.label || 'New Trigger'}</p>
        </div>
      </div>

      <Handle
        type="source"
        position={Position.Right}
        className="!w-3 !h-3 !bg-green-500 !border-2 !border-white !shadow-sm hover:!scale-125 transition-transform"
      />
      
      {/* Subtle Glow Effect */}
      <div className="absolute inset-0 rounded-2xl bg-green-400/5 blur-xl -z-10 group-hover:bg-green-400/10 transition-colors" />
    </motion.div>
  );
};

export default memo(TriggerNode);
