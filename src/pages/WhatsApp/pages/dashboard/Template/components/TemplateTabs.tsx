import { 
  CheckCircle, 
  XCircle, 
  Clock
} from 'lucide-react';

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
  return (
    <div className="mb-6">
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => onTabChange('approved')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'approved'
                ? 'border-green-500 text-green-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              Approved ({approvedCount})
            </div>
          </button>
          <button
            onClick={() => onTabChange('pending')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'pending'
                ? 'border-yellow-500 text-yellow-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Pending ({pendingCount})
            </div>
          </button>
          <button
            onClick={() => onTabChange('rejected')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'rejected'
                ? 'border-red-500 text-red-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center gap-2">
              <XCircle className="w-4 h-4" />
              Rejected ({rejectedCount})
            </div>
          </button>
        </nav>
      </div>
    </div>
  );
}
