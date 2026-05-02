import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from './dialog';
import { Button } from './button';
import { Card, CardContent } from './card';
import { Badge } from './badge';
import { CheckCircle, Clock, XCircle, AlertCircle } from 'lucide-react';

interface TemplatePreviewDialogProps {
  isOpen: boolean;
  onClose: () => void;
  template: any;
}

export function TemplatePreviewDialog({
  isOpen,
  onClose,
  template,
}: TemplatePreviewDialogProps) {
  if (!template) return null;

  const getStatusIcon = (status: string) => {
    switch (status.toUpperCase()) {
      case 'APPROVED':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'PENDING':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'REJECTED':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'PAUSED':
        return <AlertCircle className="w-4 h-4 text-orange-500" />;
      case 'DISABLED':
        return <XCircle className="w-4 h-4 text-gray-500" />;
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
      case 'PAUSED':
        return 'bg-orange-100 text-orange-800';
      case 'DISABLED':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category.toLowerCase()) {
      case 'utility':
        return 'bg-blue-100 text-blue-800';
      case 'marketing':
        return 'bg-purple-100 text-purple-800';
      case 'authentication':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const bodyComponent = template.components?.find((c: any) => c.type === 'BODY');
  const headerComponent = template.components?.find((c: any) => c.type === 'HEADER');
  const footerComponent = template.components?.find((c: any) => c.type === 'FOOTER');
  const buttonComponents = template.components?.filter((c: any) => c.type === 'BUTTONS');

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3">
            {getStatusIcon(template.status)}
            <div className="flex-1">
              <DialogTitle className="text-left">{template.name}</DialogTitle>
              <DialogDescription className="text-left">
                {template.language} • {template.category}
              </DialogDescription>
            </div>
            <Badge className={getStatusColor(template.status)}>
              {template.status}
            </Badge>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Template Preview */}
          <Card>
            <CardContent className="p-4">
              <h3 className="font-semibold mb-3 text-gray-900">Template Preview</h3>
              <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                {/* Header */}
                {headerComponent && (
                  <div className="border-b border-gray-200 pb-2">
                    <div className="text-sm font-medium text-gray-600 mb-1">Header</div>
                    <div className="text-sm text-gray-800">
                      {headerComponent.format === 'TEXT' ? (
                        headerComponent.text
                      ) : headerComponent.format === 'IMAGE' ? (
                        <div className="bg-gray-200 rounded p-2 text-center text-xs text-gray-500">
                          [Image: {headerComponent.example?.header_handle?.[0] || 'Sample image'}]
                        </div>
                      ) : headerComponent.format === 'VIDEO' ? (
                        <div className="bg-gray-200 rounded p-2 text-center text-xs text-gray-500">
                          [Video: {headerComponent.example?.header_handle?.[0] || 'Sample video'}]
                        </div>
                      ) : headerComponent.format === 'DOCUMENT' ? (
                        <div className="bg-gray-200 rounded p-2 text-center text-xs text-gray-500">
                          [Document: {headerComponent.example?.header_handle?.[0] || 'Sample document'}]
                        </div>
                      ) : (
                        headerComponent.text || 'Header content'
                      )}
                    </div>
                  </div>
                )}

                {/* Body */}
                {bodyComponent && (
                  <div className="border-b border-gray-200 pb-2">
                    <div className="text-sm font-medium text-gray-600 mb-1">Body</div>
                    <div className="text-sm text-gray-800 whitespace-pre-wrap">
                      {bodyComponent.text || 'Body content'}
                    </div>
                  </div>
                )}

                {/* Footer */}
                {footerComponent && (
                  <div className="border-b border-gray-200 pb-2">
                    <div className="text-sm font-medium text-gray-600 mb-1">Footer</div>
                    <div className="text-sm text-gray-800">
                      {footerComponent.text || 'Footer content'}
                    </div>
                  </div>
                )}

                {/* Buttons */}
                {buttonComponents && buttonComponents.length > 0 && (
                  <div>
                    <div className="text-sm font-medium text-gray-600 mb-2">Buttons</div>
                    <div className="space-y-2">
                      {buttonComponents.map((button: any, index: number) => (
                        <div key={index} className="flex gap-2">
                          {button.buttons?.map((btn: any, btnIndex: number) => (
                            <div
                              key={btnIndex}
                              className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs font-medium"
                            >
                              {btn.type === 'QUICK_REPLY' ? btn.text : `${btn.type}: ${btn.text}`}
                            </div>
                          ))}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Template Details */}
          <Card>
            <CardContent className="p-4">
              <h3 className="font-semibold mb-3 text-gray-900">Template Details</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium text-gray-600">Category:</span>
                  <Badge className={`ml-2 ${getCategoryColor(template.category)}`}>
                    {template.category}
                  </Badge>
                </div>
                <div>
                  <span className="font-medium text-gray-600">Language:</span>
                  <span className="ml-2 text-gray-800">{template.language}</span>
                </div>
                {template.quality_score && (
                  <div className="sm:col-span-2">
                    <span className="font-medium text-gray-600">Quality Score:</span>
                    <Badge className={`ml-2 ${
                      template.quality_score.score === 'HIGH' ? 'bg-green-100 text-green-800' :
                      template.quality_score.score === 'MEDIUM' ? 'bg-yellow-100 text-yellow-800' :
                      template.quality_score.score === 'LOW' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {template.quality_score.score}
                    </Badge>
                    {template.quality_score.date && (
                      <span className="ml-2 text-xs text-gray-500">
                        ({new Date(template.quality_score.date * 1000).toLocaleDateString()})
                      </span>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Rejected Reason */}
          {template.status === 'REJECTED' && template.rejected_reason && (
            <Card>
              <CardContent className="p-4">
                <h3 className="font-semibold mb-3 text-gray-900">Rejection Reason</h3>
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-sm text-red-700">{template.rejected_reason}</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="flex justify-end pt-4">
          <Button onClick={onClose}>Close</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
