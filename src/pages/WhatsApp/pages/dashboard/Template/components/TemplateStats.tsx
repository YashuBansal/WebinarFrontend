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
    { label: "Total Templates", value: totalTemplates, icon: LayoutGrid, color: "text-slate-600", bg: "bg-slate-50", border: "border-slate-100" },
    { label: "Approved", value: approvedTemplates, icon: CheckCircle, color: "text-green-600", bg: "bg-green-50", border: "border-green-100" },
    { label: "Pending", value: pendingTemplates, icon: Clock, color: "text-yellow-600", bg: "bg-yellow-50", border: "border-yellow-100" },
    { label: "Rejected", value: rejectedTemplates, icon: XCircle, color: "text-red-600", bg: "bg-red-50", border: "border-red-100" },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat, i) => (
        <div key={i} className="group p-5 rounded-2xl bg-white border border-slate-200 hover:shadow-md transition-all">
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
