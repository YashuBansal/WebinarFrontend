import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from './dialog';
import { Button } from './button';
import { Badge } from './badge';
import { CheckCircle, Clock, XCircle, AlertCircle } from 'lucide-react';
import { WhatsAppTemplatePreviewCard } from './whatsapp-template-preview-card';

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
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'PENDING':
        return <Clock className="w-5 h-5 text-yellow-500" />;
      case 'REJECTED':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'PAUSED':
        return <AlertCircle className="w-5 h-5 text-orange-500" />;
      default:
        return <Clock className="w-5 h-5 text-gray-500" />;
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
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-xl max-h-[95vh] overflow-y-auto bg-slate-50/50 backdrop-blur-xl border-white/20">
        <DialogHeader className="mb-4">
          <div className="flex items-center gap-4">
            <div className="p-2 bg-white rounded-xl shadow-sm">
              {getStatusIcon(template.status)}
            </div>
            <div className="flex-1 text-left">
              <DialogTitle className="text-xl font-bold text-slate-900">{template.name}</DialogTitle>
              <DialogDescription className="text-slate-500 font-medium">
                {template.language} • {template.category}
              </DialogDescription>
            </div>
            <Badge className={`${getStatusColor(template.status)} border-none px-3 py-1 text-[11px] font-bold uppercase`}>
              {template.status}
            </Badge>
          </div>
        </DialogHeader>

        <div className="py-2">
          {/* WhatsApp Preview using iPhone 16 Mockup */}
          <div className="bg-white/40 rounded-3xl p-6 border border-white shadow-inner">
            <WhatsAppTemplatePreviewCard
              template={template}
              variableMappings={[]} // No mappings in simple preview
              showSampleContact={false}
              showVariableMappings={false}
              className="scale-[0.9] origin-top -mb-10"
            />
          </div>

          {/* Rejected Reason */}
          {template.status === 'REJECTED' && template.rejected_reason && (
            <div className="mt-6 p-4 bg-red-50/50 border border-red-100 rounded-2xl">
              <h3 className="text-sm font-bold text-red-800 mb-1 flex items-center gap-2">
                <AlertCircle size={16} />
                Rejection Reason
              </h3>
              <p className="text-sm text-red-600 font-medium">{template.rejected_reason}</p>
            </div>
          )}
        </div>

        <div className="flex justify-end mt-4">
          <Button 
            onClick={onClose}
            className="bg-slate-900 hover:bg-slate-800 text-white rounded-xl px-8"
          >
            Close Preview
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

