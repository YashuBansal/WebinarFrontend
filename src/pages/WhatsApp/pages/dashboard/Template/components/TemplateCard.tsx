import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  Copy,
  Eye,
  Trash2,
  MoreVertical,
  MessageSquare
} from 'lucide-react';
import { TemplatePreviewDialog } from '@/components/ui/TemplatePreviewDialog';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';

interface TemplateCardProps {
  template: any;
  onCopy: (name: string) => void;
  onDelete: (id: string, name: string) => void;
}

export function TemplateCard({ template, onCopy, onDelete }: TemplateCardProps) {
  const [showPreview, setShowPreview] = useState(false);

  const getStatusConfig = (status: string) => {
    switch (status.toUpperCase()) {
      case 'APPROVED':
        return { icon: CheckCircle, color: 'text-green-600 dark:text-green-400', bg: 'bg-green-50 dark:bg-green-500/10', border: 'border-green-100 dark:border-green-500/20', label: 'Approved' };
      case 'PENDING':
        return { icon: Clock, color: 'text-yellow-600 dark:text-yellow-400', bg: 'bg-yellow-50 dark:bg-yellow-500/10', border: 'border-yellow-100 dark:border-yellow-500/20', label: 'Pending' };
      case 'REJECTED':
        return { icon: XCircle, color: 'text-red-600 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-500/10', border: 'border-red-100 dark:border-red-500/20', label: 'Rejected' };
      default:
        return { icon: Clock, color: 'text-slate-400 dark:text-slate-400', bg: 'bg-slate-50 dark:bg-slate-900/60', border: 'border-slate-100 dark:border-slate-700/30', label: status };
    }
  };

  const status = getStatusConfig(template.status);
  const StatusIcon = status.icon;

  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      className="h-full"
    >
      <div className="group relative h-full bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700/30 hover:border-green-400/50 dark:hover:border-green-500/50 hover:shadow-xl hover:shadow-green-900/5 dark:hover:shadow-green-500/10 rounded-[20px] p-5 transition-all duration-300 overflow-hidden flex flex-col">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 h-32 w-32 rounded-full bg-green-500/5 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity" />
        
        <div className="relative z-10 flex flex-col h-full">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="h-10 w-10 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-700/30 flex items-center justify-center text-slate-400 dark:text-slate-400 group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors">
              <MessageSquare className="h-5 w-5" />
            </div>
            <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border ${status.bg} ${status.border} ${status.color}`}>
              <StatusIcon className="h-3.5 w-3.5" />
              <span className="text-[10px] font-black uppercase tracking-widest">{status.label}</span>
            </div>
          </div>

          <div className="flex-1">
            <h3 className="text-base font-bold text-slate-900 dark:text-white line-clamp-1 mb-1 group-hover:text-green-700 dark:group-hover:text-green-400 transition-colors">
              {template.name}
            </h3>
            <div className="flex items-center gap-2 mb-4">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-400">{template.category}</span>
              <span className="h-1 w-1 rounded-full bg-slate-200 dark:bg-slate-700/50" />
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-400">{template.language}</span>
            </div>

            <div className="bg-slate-50/80 dark:bg-slate-950/50 rounded-xl p-3 border border-slate-100 dark:border-slate-700/30 mb-4 min-h-[80px]">
              <p className="text-xs font-medium text-slate-600 dark:text-slate-400 leading-relaxed line-clamp-3">
                {template.components?.find((c: any) => c.type === 'BODY')?.text || 'No content preview available'}
              </p>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-700/30 mt-auto">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onCopy(template.name)}
                className="h-8 w-8 p-0 rounded-lg text-slate-400 dark:text-slate-400 hover:text-green-600 dark:hover:text-green-400 hover:bg-green-50 dark:hover:bg-green-500/10 transition-all"
                title="Copy Name"
              >
                <Copy className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowPreview(true)}
                className="h-8 w-8 p-0 rounded-lg text-slate-400 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-all"
                title="Preview"
              >
                <Eye className="h-4 w-4" />
              </Button>
            </div>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(template.id, template.name)}
              className="h-8 w-8 p-0 rounded-lg text-slate-400 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all"
              title="Delete"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <TemplatePreviewDialog
        isOpen={showPreview}
        onClose={() => setShowPreview(false)}
        template={template}
      />
    </motion.div>
  );
}
