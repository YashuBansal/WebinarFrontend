import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  Copy,
  Eye,
  Trash2
} from 'lucide-react';
import { TemplatePreviewDialog } from '@/components/ui/TemplatePreviewDialog';

interface TemplateCardProps {
  template: any;
  onCopy: (name: string) => void;
  onDelete: (id: string, name: string) => void;
}

export function TemplateCard({ template, onCopy, onDelete }: TemplateCardProps) {
  const [showPreview, setShowPreview] = useState(false);
  const getStatusIcon = (status: string) => {
    switch (status.toUpperCase()) {
      case 'APPROVED':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'PENDING':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'REJECTED':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toUpperCase()) {
      case 'APPROVED':
        return 'bg-green-100 text-green-800';
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      case 'REJECTED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-base font-semibold text-gray-900 line-clamp-2">
              {template.name}
            </CardTitle>
            <CardDescription className="mt-1 text-sm text-gray-600">
              {template.language} • {template.category}
            </CardDescription>
          </div>
          <div className="flex flex-col items-end gap-1">
            {getStatusIcon(template.status)}
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(template.status)}`}>
              {template.status}
            </span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {/* Template Preview */}
        <div className="mb-4">
          <div className="bg-gray-50 rounded-lg p-3 text-sm text-gray-700 max-h-20 overflow-hidden">
            <p className="line-clamp-3">
              {template.components?.find((c: any) => c.type === 'BODY')?.text?.substring(0, 120) || 'No preview available'}
              {(template.components?.find((c: any) => c.type === 'BODY')?.text?.length || 0) > 120 && '...'}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-between items-center pt-3 border-t border-gray-200">
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onCopy(template.name)}
              title="Copy template name"
              className="h-8 w-8 p-0"
            >
              <Copy className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowPreview(true)}
              title="View template preview"
              className="h-8 w-8 p-0"
            >
              <Eye className="w-4 h-4" />
            </Button>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(template.id, template.name)}
            className="text-red-500 hover:text-red-700 h-8 w-8 p-0"
            title="Delete template"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>

      {/* Template Preview Dialog */}
      <TemplatePreviewDialog
        isOpen={showPreview}
        onClose={() => setShowPreview(false)}
        template={template}
      />
    </Card>
  );
}
