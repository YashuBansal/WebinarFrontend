import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Download, Copy } from 'lucide-react';
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
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Export Contacts</DialogTitle>
          <DialogDescription>
            Choose how you would like to export your contacts.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-3 py-4">
          <Button onClick={handleExportJson} variant="outline" className="w-full justify-start h-12">
            <Copy className="h-4 w-4 mr-3" />
            <div className="flex flex-col items-start gap-1">
              <span>Copy as JSON</span>
            </div>
          </Button>
          <Button onClick={handleExportCsv} variant="outline" className="w-full justify-start h-12">
            <Download className="h-4 w-4 mr-3" />
            <div className="flex flex-col items-start gap-1">
              <span>Download CSV</span>
            </div>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
