import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { 
  RefreshCw,
  Plus,
  ArrowDownUp,
  Clock,
  LayoutGrid
} from 'lucide-react';
import { Link } from 'react-router-dom';

interface TemplateHeaderProps {
  projectName: string;
  projectId: string;
  isLoading: boolean;
  isSyncing?: boolean;
  isRefreshing?: boolean;
  lastSyncedAt?: string | null;
  onRefresh: () => void;
  onSync?: () => void;
}

export function TemplateHeader({ projectName, projectId, isLoading, isSyncing, isRefreshing, lastSyncedAt, onRefresh, onSync }: TemplateHeaderProps) {
  const formatLastSynced = (dateString: string | null | undefined) => {
    if (!dateString) return null;
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);

      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
      if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
      if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
      
      return date.toLocaleString('en-US', { 
        month: 'short', 
        day: 'numeric', 
        year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
    } catch {
      return null;
    }
  };

  return (
    <motion.div
      className="mb-6 rounded-2xl border border-slate-200/60 p-4 sm:p-5"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        backgroundColor: "#ffffff",
        boxShadow: "0 1px 3px rgba(0, 0, 0, 0.05), 0 1px 2px rgba(0, 0, 0, 0.06)",
      }}
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-green-600 font-bold text-xs uppercase tracking-widest mb-1">
            <LayoutGrid className="h-3.5 w-3.5" />
            Message Templates
          </div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
            Template Library
          </h1>
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
            <p className="text-slate-500 text-xs font-medium">
              Manage your identity and message flow for <span className="text-slate-900 font-bold">{projectName}</span>
            </p>
            {lastSyncedAt && (
              <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-0.5 bg-slate-50 border border-slate-100 rounded-full text-[10px] font-bold text-slate-400 uppercase tracking-tight">
                <Clock className="w-3 h-3" />
                <span>Synced: {formatLastSynced(lastSyncedAt)}</span>
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button
            variant="outline"
            onClick={onRefresh}
            disabled={isLoading || isRefreshing}
            className="h-10 px-4 rounded-xl flex items-center gap-2 border-slate-200 text-slate-600 font-bold text-xs transition-all hover:bg-slate-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${(isLoading || isRefreshing) ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          
          {onSync && (
            <Button
              variant="outline"
              onClick={onSync}
              disabled={isSyncing || isLoading}
              className="h-10 px-4 rounded-xl flex items-center gap-2 border-slate-200 text-slate-600 font-bold text-xs transition-all hover:bg-slate-50"
            >
              <ArrowDownUp className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              Meta Sync
            </Button>
          )}

          <Link to={`/whatsapp/dashboard/${projectId}/templates/create`}>
            <Button 
              className="h-10 px-6 rounded-xl flex items-center gap-2 text-white font-bold text-xs shadow-xl shadow-green-600/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
              style={{ backgroundColor: "#22B573" }}
            >
              <Plus className="w-4 h-4" />
              Create Template
            </Button>
          </Link>
        </div>
      </div>
    </motion.div>
  );
}

