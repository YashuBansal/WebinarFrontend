import { 
  CheckCircle, 
  XCircle, 
  Clock,
  LayoutGrid
} from 'lucide-react';
import { motion } from 'framer-motion';

interface TemplateTabsProps {
  activeTab: 'approved' | 'pending' | 'rejected';
  onTabChange: (tab: 'approved' | 'pending' | 'rejected') => void;
  approvedCount: number;
  pendingCount: number;
  rejectedCount: number;
}

export function TemplateTabs({ 
  activeTab, 
  onTabChange, 
  approvedCount, 
  pendingCount, 
  rejectedCount 
}: TemplateTabsProps) {
  const tabs = [
    { id: 'approved', label: 'Approved', count: approvedCount, icon: CheckCircle, activeColor: 'text-green-600 dark:text-green-400', activeBg: 'bg-green-50 dark:bg-green-500/10', activeBorder: 'border-green-200' },
    { id: 'pending', label: 'Pending', count: pendingCount, icon: Clock, activeColor: 'text-yellow-600 dark:text-yellow-400', activeBg: 'bg-yellow-50 dark:bg-yellow-500/10', activeBorder: 'border-yellow-200' },
    { id: 'rejected', label: 'Rejected', count: rejectedCount, icon: XCircle, activeColor: 'text-red-600 dark:text-red-400', activeBg: 'bg-red-50 dark:bg-red-500/10', activeBorder: 'border-red-200' },
  ] as const;

  return (
    <div className="flex items-center gap-1.5 p-1 bg-slate-100/50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-700/30 rounded-2xl w-fit">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`
              relative flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200
              ${isActive ? `${tab.activeColor} ${tab.activeBg} shadow-sm border ${tab.activeBorder}` : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 hover:bg-slate-50 dark:hover:bg-slate-900/50'}
            `}
          >
            <tab.icon className={`h-3.5 w-3.5 ${isActive ? tab.activeColor : 'opacity-50'}`} />
            <span>{tab.label}</span>
            <span className={`
              flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-lg text-[10px] font-black
              ${isActive ? `${tab.activeBg} ${tab.activeColor} border ${tab.activeBorder}` : 'bg-slate-200 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400'}
            `}>
              {tab.count}
            </span>
          </button>
        );
      })}
    </div>
  );
}
