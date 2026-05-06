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
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-600',
      borderColor: 'border-blue-100'
    },
    {
      label: 'Active Subs',
      value: stats.activeContacts,
      icon: <UserCheck className="h-4 w-4" />,
      color: 'green',
      bgColor: 'bg-emerald-50',
      textColor: 'text-emerald-600',
      borderColor: 'border-emerald-100'
    },
    {
      label: 'Inactive',
      value: stats.inactiveContacts,
      icon: <UserMinus className="h-4 w-4" />,
      color: 'rose',
      bgColor: 'bg-rose-50',
      textColor: 'text-rose-600',
      borderColor: 'border-rose-100'
    }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
      {statCards.map((stat, i) => (
        <div 
          key={i}
          className="group relative bg-white border border-slate-100 rounded-2xl p-5 shadow-sm hover:shadow-md hover:border-slate-200 transition-all duration-300 overflow-hidden"
        >
          {/* Subtle pattern or glow */}
          <div className={`absolute top-0 right-0 -mr-8 -mt-8 h-24 w-24 rounded-full ${stat.bgColor} opacity-20 blur-2xl group-hover:opacity-40 transition-opacity`} />
          
          <div className="relative flex items-center gap-4">
            <div className={`h-10 w-10 ${stat.bgColor} ${stat.textColor} ${stat.borderColor} border rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform`}>
              {stat.icon}
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-0.5">{stat.label}</p>
              <p className="text-xl font-black text-slate-900 tracking-tight">{stat.value.toLocaleString()}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
