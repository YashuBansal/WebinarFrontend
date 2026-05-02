import { Button } from '@/components/ui/button';
import { 
  RefreshCw,
  Plus,
  ArrowDownUp,
  Clock
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
    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-8">
      <div className="min-w-0 flex-1">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Templates</h1>
        <p className="text-gray-600 mt-2 text-sm sm:text-base">
          Manage your WhatsApp message templates for {projectName}
        </p>
        {lastSyncedAt && (
          <div className="flex items-center gap-1 mt-1 text-xs text-gray-500">
            <Clock className="w-3 h-3" />
            <span>Last synced: {formatLastSynced(lastSyncedAt)}</span>
          </div>
        )}
      </div>
      <div className="flex flex-col sm:flex-row gap-3">
        <Button
          variant="outline"
          onClick={onRefresh}
          disabled={isLoading || isRefreshing}
          className="w-full sm:w-auto"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${(isLoading || isRefreshing) ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
        {onSync && (
          <Button
            variant="outline"
            onClick={onSync}
            disabled={isSyncing || isLoading}
            className="w-full sm:w-auto"
          >
            <ArrowDownUp className={`w-4 h-4 mr-2 ${isSyncing ? 'animate-spin' : ''}`} />
            Sync from Meta
          </Button>
        )}
        <Link to={`/whatsapp/dashboard/${projectId}/templates/create`} className="w-full sm:w-auto">
          <Button className="bg-teal-600 hover:bg-teal-700 w-full sm:w-auto">
            <Plus className="w-4 h-4 mr-2" />
            Create Template
          </Button>
        </Link>
      </div>
    </div>
  );
}

