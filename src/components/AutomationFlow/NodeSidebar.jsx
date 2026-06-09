import React from 'react';

const DRAG_NODES = [
  {
    type: 'trigger',
    title: 'Trigger Event',
    description: 'Webhook, Razorpay payment, or Meta Leads form callbacks.',
    colorClass: 'border-blue-200 bg-blue-50/50 hover:bg-blue-50 text-blue-600 dark:border-blue-500/30 dark:bg-blue-500/5 dark:hover:bg-blue-500/10 dark:text-blue-400',
    glowClass: 'bg-blue-100/50 shadow-blue-100/10 dark:bg-blue-500/20 dark:shadow-blue-500/10',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
  },
  {
    type: 'condition',
    title: 'Condition Check',
    description: 'Bifurcate workflows dynamically based on custom conditions.',
    colorClass: 'border-amber-200 bg-amber-50/50 hover:bg-amber-50 text-amber-600 dark:border-amber-500/30 dark:bg-amber-500/5 dark:hover:bg-amber-500/10 dark:text-amber-400',
    glowClass: 'bg-amber-100/50 shadow-amber-100/10 dark:bg-amber-500/20 dark:shadow-amber-500/10',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
      </svg>
    ),
  },
  {
    type: 'delay',
    title: 'Wait / Delay',
    description: 'Suspend execution for a custom interval or absolute datetime.',
    colorClass: 'border-purple-200 bg-purple-50/50 hover:bg-purple-50 text-purple-600 dark:border-purple-500/30 dark:bg-purple-500/5 dark:hover:bg-purple-500/10 dark:text-purple-400',
    glowClass: 'bg-purple-100/50 shadow-purple-100/10 dark:bg-purple-500/20 dark:shadow-purple-500/10',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    type: 'action',
    title: 'Integration Action',
    description: 'Send WABA templates, update sheets, or hit API webhooks.',
    colorClass: 'border-emerald-200 bg-emerald-50/50 hover:bg-emerald-50 text-emerald-600 dark:border-emerald-500/30 dark:bg-emerald-500/5 dark:hover:bg-emerald-500/10 dark:text-emerald-400',
    glowClass: 'bg-emerald-100/50 shadow-emerald-100/10 dark:bg-emerald-500/20 dark:shadow-emerald-500/10',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 19v-8.93a2 2 0 01.89-1.664l8-5.333a2 2 0 012.22 0l8 5.333A2 2 0 0121 10.07V19M3 19a2 2 0 002 2h14a2 2 0 002-2M3 19l6.75-4.5M21 19l-6.75-4.5M3 10l6.75 4.5M21 10l-6.75 4.5m0 0l-5.625-3.75" />
      </svg>
    ),
  },
];

export default function NodeSidebar() {
  const onDragStart = (event, nodeType) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <aside className="w-80 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col h-full select-none transition-colors duration-300">
      {/* Sidebar Header Section */}
      <div className="p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40">
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5 text-indigo-500 dark:text-indigo-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">Workflow Nodes</h3>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Drag modules onto the canvas workspace to assemble automation sequences.</p>
      </div>

      {/* Node Items List */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
        {DRAG_NODES.map((node) => (
          <div
            key={node.type}
            draggable
            onDragStart={(e) => onDragStart(e, node.type)}
            className={`flex flex-col gap-2 p-4 border rounded-2xl cursor-grab active:cursor-grabbing transition-all duration-300 ${node.colorClass}`}
          >
            <div className="flex items-center gap-3">
              {/* Outer icon capsule with glow */}
              <div className={`relative flex items-center justify-center w-9 h-9 rounded-xl border border-slate-200 dark:border-slate-800 shadow-md ${node.glowClass}`}>
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

      {/* Bottom status tip */}
      <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20 text-[10px] text-slate-500 dark:text-slate-500 font-semibold text-center uppercase tracking-wider">
        Drag elements to build DAG
      </div>
    </aside>
  );
}
