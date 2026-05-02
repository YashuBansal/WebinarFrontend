import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Clock, XCircle, HelpCircle, Star, Zap, User, Phone, Activity } from 'lucide-react';
import { DISPLAY_NAME_STATUS_INFO, type DisplayNameStatus as DisplayNameStatusType } from '@/schemas/profileSchema';

interface DisplayNameStatusProps {
  status: DisplayNameStatusType;
}

export const DisplayNameStatus = ({ status }: DisplayNameStatusProps) => {
  const statusInfo = DISPLAY_NAME_STATUS_INFO[status.displayNameStatus];

  const getStatusIcon = () => {
    switch (status.displayNameStatus) {
      case 'APPROVED':
        return <CheckCircle className="h-4 w-4" />;
      case 'PENDING':
        return <Clock className="h-4 w-4" />;
      case 'REJECTED':
        return <XCircle className="h-4 w-4" />;
      default:
        return <HelpCircle className="h-4 w-4" />;
    }
  };

  const getStatusColor = () => {
    switch (status.displayNameStatus) {
      case 'APPROVED':
        return 'bg-green-50 text-green-700 border-green-100';
      case 'PENDING':
        return 'bg-yellow-50 text-yellow-700 border-yellow-100';
      case 'REJECTED':
        return 'bg-red-50 text-red-700 border-red-100';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-100';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="group relative h-full bg-white border border-slate-200 hover:border-green-400/50 hover:shadow-xl hover:shadow-green-900/5 rounded-[20px] p-6 transition-all duration-300 overflow-hidden flex flex-col"
    >
      <div className="absolute top-0 right-0 -mr-12 -mt-12 h-24 w-24 rounded-full bg-green-500/5 blur-2xl opacity-0 group-hover:opacity-100 transition-opacity" />

      <div className="relative z-10 flex flex-col h-full">
        <div className="flex items-start justify-between mb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-50 text-slate-400 group-hover:bg-green-50 group-hover:text-green-600 transition-colors">
            <User className="h-5 w-5" />
          </div>
          <Badge className={`rounded-lg font-bold px-3 py-1 ${getStatusColor()} border`}>
            <div className="flex items-center gap-1.5 text-[10px]">
              {getStatusIcon()}
              {statusInfo.label}
            </div>
          </Badge>
        </div>

        <h3 className="text-base font-black text-slate-900 mb-1">Display Name</h3>
        <p className="text-xs font-bold text-green-600 truncate mb-2">
          {status.verifiedName || "Review in progress..."}
        </p>
        
        <p className="text-[10px] text-slate-400 font-medium leading-relaxed mb-6 line-clamp-2 italic">
          {statusInfo.description}
        </p>

        <div className="mt-auto grid grid-cols-2 gap-2">
          <div className="p-2.5 rounded-xl bg-slate-50/50 border border-slate-100">
            <div className="flex items-center gap-2 mb-1 text-slate-400">
              <Phone className="h-3 w-3" />
              <span className="text-[8px] font-black uppercase tracking-widest">Phone</span>
            </div>
            <div className="text-[11px] font-bold text-slate-700 truncate">{status.displayPhoneNumber}</div>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-50/50 border border-slate-100">
            <div className="flex items-center gap-2 mb-1 text-slate-400">
              <Activity className="h-3 w-3" />
              <span className="text-[8px] font-black uppercase tracking-widest">Rating</span>
            </div>
            <div className="text-[11px] font-bold text-slate-700">{status.qualityRating || "N/A"}</div>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-50/50 border border-slate-100 col-span-2">
            <div className="flex items-center gap-2 mb-1 text-slate-400">
              <Zap className="h-3 w-3" />
              <span className="text-[8px] font-black uppercase tracking-widest">Throughput</span>
            </div>
            <div className="text-[11px] font-bold text-slate-700">{status.throughput || "Standard Speed"}</div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
