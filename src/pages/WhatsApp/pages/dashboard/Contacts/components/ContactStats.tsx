import { Users, UserCheck, UserMinus } from 'lucide-react';
import type { ContactStats as ContactStatsType } from '@/schemas/contactSchema';

interface ContactStatsProps {
  stats: ContactStatsType;
}

export default function ContactStats({ stats }: ContactStatsProps) {
  const statCards = [
    {
      label: 'Total Audience',
      value: stats.totalContacts,
      icon: <Users className="h-4 w-4" />,
      color: 'blue',
      bgColor: 'bg-blue-50 dark:bg-blue-500/10',
      textColor: 'text-blue-600 dark:text-blue-400',
      borderColor: 'border-blue-100 dark:border-blue-500/20'
    },
    {
      label: 'Active Subs',
      value: stats.activeContacts,
      icon: <UserCheck className="h-4 w-4" />,
      color: 'green',
      bgColor: 'bg-emerald-50 dark:bg-emerald-500/10',
      textColor: 'text-emerald-600 dark:text-emerald-400',
      borderColor: 'border-emerald-100 dark:border-emerald-500/20'
    },
    {
      label: 'Inactive',
      value: stats.inactiveContacts,
      icon: <UserMinus className="h-4 w-4" />,
      color: 'rose',
      bgColor: 'bg-rose-50 dark:bg-rose-500/10',
      textColor: 'text-rose-600 dark:text-rose-400',
      borderColor: 'border-rose-100 dark:border-rose-500/20'
    }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
      {statCards.map((stat, i) => (
        <div 
          key={i}
          className="group relative bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-5 shadow-sm hover:shadow-md hover:border-slate-200 transition-all duration-300 overflow-hidden"
        >
          {/* Subtle pattern or glow */}
          {/* Decorative background removed */}
          
          <div className="relative flex items-center gap-4">
            <div className={`h-10 w-10 ${stat.bgColor} ${stat.textColor} ${stat.borderColor} border rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform`}>
              {stat.icon}
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-0.5">{stat.label}</p>
              <p className="text-xl font-black text-slate-900 dark:text-white tracking-tight">{stat.value.toLocaleString()}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
