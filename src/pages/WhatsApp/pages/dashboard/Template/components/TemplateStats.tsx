import {
  CheckCircle,
  XCircle,
  Clock,
  LayoutGrid
} from 'lucide-react';

interface TemplateStatsProps {
  totalTemplates: number;
  approvedTemplates: number;
  pendingTemplates: number;
  rejectedTemplates: number;
}

export function TemplateStats({
  totalTemplates,
  approvedTemplates,
  pendingTemplates,
  rejectedTemplates
}: TemplateStatsProps) {
  if (totalTemplates === 0) return null;

  const stats = [
    { label: "Total Templates", value: totalTemplates, icon: LayoutGrid, color: "text-slate-600 dark:text-slate-400", bg: "bg-slate-50 dark:bg-slate-950", border: "border-slate-100 dark:border-slate-800" },
    { label: "Approved", value: approvedTemplates, icon: CheckCircle, color: "text-green-600 dark:text-green-400", bg: "bg-green-50 dark:bg-green-900", border: "border-green-100 dark:border-green-800" },
    { label: "Pending", value: pendingTemplates, icon: Clock, color: "text-yellow-600 dark:text-yellow-400", bg: "bg-yellow-50 dark:bg-yellow-900", border: "border-yellow-100 dark:border-yellow-800" },
    { label: "Rejected", value: rejectedTemplates, icon: XCircle, color: "text-red-600 dark:text-red-400", bg: "bg-red-50 dark:bg-red-900", border: "border-red-100 dark:border-red-800" },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat, i) => (
        <div key={i} className="group p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:shadow-md transition-all">
          <div className="flex items-center gap-3 mb-3">
            <div className={`h-8 w-8 rounded-lg ${stat.bg} border ${stat.border} flex items-center justify-center ${stat.color}`}>
              <stat.icon className="h-4 w-4" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{stat.label}</span>
          </div>
          <p className={`text-2xl font-black ${stat.color} leading-none`}>{stat.value}</p>
        </div>
      ))}
    </div>
  );
}
