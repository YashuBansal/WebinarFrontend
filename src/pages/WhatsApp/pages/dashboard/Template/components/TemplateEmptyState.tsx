import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  Plus
} from 'lucide-react';
import { Link } from 'react-router-dom';

interface TemplateEmptyStateProps {
  activeTab: 'approved' | 'pending' | 'rejected';
  hasTemplatesInTab: boolean;
  projectId: string;
}

export function TemplateEmptyState({ activeTab, hasTemplatesInTab, projectId }: TemplateEmptyStateProps) {
  return (
    <Card>
      <CardContent className="p-6 text-center">
        <div className="w-16 h-16 bg-gray-100 dark:bg-slate-900/60 rounded-full flex items-center justify-center mx-auto mb-4">
          {activeTab === 'approved' && <CheckCircle className="w-8 h-8 text-green-400" />}
          {activeTab === 'pending' && <Clock className="w-8 h-8 text-yellow-400" />}
          {activeTab === 'rejected' && <XCircle className="w-8 h-8 text-red-400" />}
        </div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          No {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Templates Found
        </h3>
        <p className="text-gray-600 dark:text-slate-400 mb-4">
          {!hasTemplatesInTab 
            ? `You don't have any ${activeTab} templates yet.`
            : "No templates match your search criteria."
          }
        </p>
        {activeTab === 'approved' && !hasTemplatesInTab && (
          <Link to={`/whatsapp/dashboard/${projectId}/templates/create`}>
            <Button className="bg-teal-600 hover:bg-teal-700">
              <Plus className="w-4 h-4 mr-2" />
              Create Your First Template
            </Button>
          </Link>
        )}
      </CardContent>
    </Card>
  );
}

