import React, { memo } from 'react';
import { Handle, Position } from 'reactflow';
import { motion } from 'framer-motion';
import { GitBranch, ChevronRight } from 'lucide-react';

const ConditionNode = ({ data }) => {
  return (
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className="relative min-w-[220px] p-0 rounded-2xl bg-white/95 backdrop-blur-md border border-slate-200 shadow-xl hover:shadow-amber-500/10 transition-all group overflow-hidden"
    >
      {/* Header Badge */}
      <div className="absolute top-3 left-4 z-20 px-2 py-0.5 bg-amber-500 text-white text-[9px] font-black uppercase tracking-widest rounded-full shadow-lg shadow-amber-500/20 flex items-center gap-1">
        <GitBranch className="h-3 w-3 fill-white" />
        Condition / Branch
      </div>

      <div className="pt-10 pb-4 px-4 space-y-4">
        <div className="flex items-center gap-2">
           <div className="h-8 w-8 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600">
              <GitBranch className="h-4 w-4" />
           </div>
           <p className="text-xs font-bold text-slate-800 tracking-tight">
              {data.label || 'Routing Logic'}
           </p>
        </div>

        {/* Branch Rows */}
        <div className="space-y-2">
           <div className="relative flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-[10px] font-black uppercase tracking-wider text-green-600">
                {data.trueLabel || 'True / Match'}
              </span>
              <Handle
                type="source"
                position={Position.Right}
                id="true"
                className="!relative !right-[-22px] !w-3 !h-3 !bg-green-500 !border-2 !border-white !shadow-sm hover:!scale-125 transition-transform"
              />
           </div>

           <div className="relative flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-[10px] font-black uppercase tracking-wider text-red-600">
                {data.falseLabel || 'False / Else'}
              </span>
              <Handle
                type="source"
                position={Position.Right}
                id="false"
                className="!relative !right-[-22px] !w-3 !h-3 !bg-red-500 !border-2 !border-white !shadow-sm hover:!scale-125 transition-transform"
              />
           </div>
        </div>
      </div>

      {/* Target Handle */}
      <Handle
        type="target"
        position={Position.Left}
        className="!w-3 !h-3 !bg-slate-300 !border-2 !border-white !shadow-sm hover:!bg-amber-500 transition-colors"
      />
    </motion.div>
  );
};

export default memo(ConditionNode);
