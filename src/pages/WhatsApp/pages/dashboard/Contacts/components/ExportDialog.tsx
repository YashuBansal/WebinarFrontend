import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Download, Copy, X, FileJson, FileSpreadsheet, Share2 } from 'lucide-react';
import type { Contact } from '@/schemas/contactSchema';
import { toastUtils } from '@/lib/utils';

interface ExportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  contacts: Contact[];
}

export default function ExportDialog({ isOpen, onClose, contacts }: ExportDialogProps) {
  const handleExportJson = async () => {
    try {
      const dataStr = JSON.stringify(contacts, null, 2);
      await navigator.clipboard.writeText(dataStr);
      toastUtils.success('Contacts copied to clipboard as JSON');
      onClose();
    } catch (error) {
      toastUtils.error('Failed to copy to clipboard');
    }
  };

  const handleExportCsv = () => {
    try {
      if (!contacts || contacts.length === 0) {
        toastUtils.warning('No contacts to export');
        return;
      }

      const headers = ['firstName', 'lastName', 'phone', 'email', 'tags'];
      const csvRows = [];
      csvRows.push(headers.join(','));
      contacts.forEach(c => {
        const row = [
          `"${(c.firstName || '').replace(/"/g, '""')}"`,
          `"${(c.lastName || '').replace(/"/g, '""')}"`,
          `"${(c.phone || '').replace(/"/g, '""')}"`,
          `"${(c.email || '').replace(/"/g, '""')}"`,
          `"${(c.tags || []).join(', ').replace(/"/g, '""')}"`
        ];
        csvRows.push(row.join(','));
      });
      const csvString = csvRows.join('\n');
      
      const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', 'contacts_export.csv');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toastUtils.success('Contacts downloaded as CSV');
      onClose();
    } catch (error) {
      toastUtils.error('Failed to export CSV');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        className="sm:max-w-[400px] border-0 bg-transparent p-0 shadow-none outline-none"
        onPointerDownOutside={(e) => e.preventDefault()}
        showCloseButton={false}
      >
        <div className="relative w-full rounded-2xl p-8 shadow-2xl flex flex-col bg-white border border-slate-200">
          <div className="flex items-center justify-between mb-8">
            <div>
              <div className="flex items-center gap-2 text-blue-600 font-bold text-[10px] uppercase tracking-[0.2em] mb-1">
                <Share2 className="h-3 w-3" />
                Data Portability
              </div>
              <DialogTitle className="text-xl font-bold text-slate-900">
                Export Audience
              </DialogTitle>
              <DialogDescription className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                Total {contacts.length} contacts to export
              </DialogDescription>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="h-10 w-10 flex items-center justify-center rounded-xl hover:bg-slate-50 text-slate-400 transition-colors border border-transparent hover:border-slate-100"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-4">
            <button
              onClick={handleExportJson}
              className="w-full flex items-center gap-4 p-4 rounded-2xl border border-slate-100 bg-slate-50/50 hover:bg-white hover:border-blue-200 hover:shadow-lg hover:shadow-blue-900/5 transition-all group"
            >
              <div className="h-12 w-12 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-slate-400 group-hover:text-blue-600 group-hover:border-blue-100 transition-all">
                <FileJson className="h-6 w-6" />
              </div>
              <div className="flex flex-col items-start">
                <span className="text-sm font-bold text-slate-900">Copy as JSON</span>
                <span className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">Clip to clipboard</span>
              </div>
            </button>

            <button
              onClick={handleExportCsv}
              className="w-full flex items-center gap-4 p-4 rounded-2xl border border-slate-100 bg-slate-50/50 hover:bg-white hover:border-green-200 hover:shadow-lg hover:shadow-green-900/5 transition-all group"
            >
              <div className="h-12 w-12 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-slate-400 group-hover:text-green-600 group-hover:border-green-100 transition-all">
                <FileSpreadsheet className="h-6 w-6" />
              </div>
              <div className="flex flex-col items-start">
                <span className="text-sm font-bold text-slate-900">Download CSV</span>
                <span className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">Excel compatible file</span>
              </div>
            </button>
          </div>

          <div className="mt-8 flex justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="h-11 px-6 rounded-xl font-bold text-slate-600 border-slate-200 hover:bg-slate-50 transition-all"
            >
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
