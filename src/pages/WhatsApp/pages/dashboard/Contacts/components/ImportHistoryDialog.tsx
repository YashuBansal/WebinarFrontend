import { useMemo, useRef, useState } from 'react';
import { useImportHistory } from '@/hooks/useContacts';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Loader2, History, FileSpreadsheet, Eye } from 'lucide-react';

interface ImportHistoryDialogProps {
  isOpen: boolean;
  onClose: () => void;
  projectId?: string;
}

export default function ImportHistoryDialog({
  isOpen,
  onClose,
  projectId,
}: ImportHistoryDialogProps) {
  const { data: importHistoryData, isLoading } = useImportHistory({
    page: 1,
    limit: 20,
    projectId,
  });
  const rows = importHistoryData?.imports || [];
  const [selectedImportId, setSelectedImportId] = useState<string>('');
  const [invalidSearch, setInvalidSearch] = useState('');
  const invalidSectionRef = useRef<HTMLDivElement | null>(null);

  const totalImports = rows.length;
  const successCount = rows.filter((item) => item.status === 'success').length;
  const partialCount = rows.filter((item) => item.status === 'partial_success').length;
  const failedCount = rows.filter((item) => item.status === 'failed').length;
  const selectedImport = useMemo(
    () => rows.find((item) => item._id === selectedImportId) || null,
    [rows, selectedImportId],
  );
  const invalidRows = selectedImport?.invalidRecordsSample || [];
  const filteredInvalidRows = invalidRows.filter((row) => {
    const q = invalidSearch.trim().toLowerCase();
    if (!q) return true;
    return (
      (row.phoneRaw || '').toLowerCase().includes(q) ||
      row.reason.toLowerCase().includes(q)
    );
  });

  const getStatusClasses = (status: string) => {
    if (status === 'success') return 'bg-emerald-100 text-emerald-700 border-emerald-200';
    if (status === 'partial_success') return 'bg-amber-100 text-amber-700 border-amber-200';
    if (status === 'failed') return 'bg-rose-100 text-rose-700 border-rose-200';
    return 'bg-blue-100 text-blue-700 border-blue-200';
  };

  const selectImportAndScroll = (importId: string) => {
    setSelectedImportId(importId);
    // Wait one frame so section can render/update before scrolling
    requestAnimationFrame(() => {
      invalidSectionRef.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="w-[92vw] !max-w-[92vw] sm:!max-w-[1400px] max-h-[90vh] overflow-hidden flex flex-col p-0">
        <DialogHeader>
          <div className="px-6 pt-6 pb-4 border-b">
            <DialogTitle className="flex items-center gap-2 text-xl">
              <History className="h-5 w-5" />
              Import History
            </DialogTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Track CSV/XLSX import outcomes and quality metrics.
            </p>
          </div>
        </DialogHeader>

        <div className="px-6 py-4 border-b bg-muted/20 grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="rounded-lg border bg-background p-3">
            <p className="text-xs text-muted-foreground">Total Imports</p>
            <p className="text-xl font-semibold">{totalImports}</p>
          </div>
          <div className="rounded-lg border bg-background p-3">
            <p className="text-xs text-muted-foreground">Success</p>
            <p className="text-xl font-semibold text-emerald-600">{successCount}</p>
          </div>
          <div className="rounded-lg border bg-background p-3">
            <p className="text-xs text-muted-foreground">Partial</p>
            <p className="text-xl font-semibold text-amber-600">{partialCount}</p>
          </div>
          <div className="rounded-lg border bg-background p-3">
            <p className="text-xs text-muted-foreground">Failed</p>
            <p className="text-xl font-semibold text-rose-600">{failedCount}</p>
          </div>
        </div>

        <div className="flex-1 overflow-auto px-6 py-4">
          <div className="mb-3 text-xs text-muted-foreground flex items-center gap-1.5">
            <Eye className="h-3.5 w-3.5" />
            Tip: Click any import row to view invalid records sample below.
          </div>
          {isLoading ? (
            <div className="h-48 flex items-center justify-center text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Loading import history...
            </div>
          ) : rows.length === 0 ? (
            <div className="h-56 flex flex-col items-center justify-center text-center text-muted-foreground">
              <FileSpreadsheet className="h-8 w-8 mb-2" />
              <p className="font-medium">No import history found</p>
              <p className="text-sm">Import CSV/XLSX to start seeing history here.</p>
            </div>
          ) : (
            <div className="rounded-lg border overflow-hidden">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-background z-10">
                  <tr className="text-left border-b">
                    <th className="py-3 px-3 font-medium">Time</th>
                    <th className="py-3 px-3 font-medium">Status</th>
                    <th className="py-3 px-3 font-medium">Total</th>
                    <th className="py-3 px-3 font-medium">Valid</th>
                    <th className="py-3 px-3 font-medium">Invalid</th>
                    <th className="py-3 px-3 font-medium">Duplicate</th>
                    <th className="py-3 px-3 font-medium">New</th>
                    <th className="py-3 px-3 font-medium">Updated</th>
                    <th className="py-3 px-3 font-medium">Failed</th>
                    <th className="py-3 px-3 font-medium">Reason</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((item) => (
                    <tr
                      key={item._id}
                      onClick={() => selectImportAndScroll(item._id)}
                      className={`border-b last:border-0 hover:bg-muted/30 transition-colors cursor-pointer ${
                        selectedImportId === item._id ? 'bg-muted/40' : ''
                      }`}
                    >
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        {new Date(item.createdAt).toLocaleString()}
                      </td>
                      <td className="py-2.5 px-3">
                        <span
                          className={`px-2.5 py-1 rounded-full text-xs border font-medium ${getStatusClasses(item.status)}`}
                        >
                          {item.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="py-2.5 px-3">{item.totalRows}</td>
                      <td className="py-2.5 px-3 text-emerald-700">{item.validRows}</td>
                      <td className="py-2.5 px-3 text-amber-700">{item.invalidRows}</td>
                      <td className="py-2.5 px-3">{item.duplicates}</td>
                      <td className="py-2.5 px-3">{item.newCount}</td>
                      <td className="py-2.5 px-3">{item.updatedCount}</td>
                      <td className="py-2.5 px-3 text-rose-700">{item.failedCount}</td>
                      <td className="py-2.5 px-3">
                        <button
                          type="button"
                          className="w-full text-left flex items-center gap-2 hover:text-primary"
                          onClick={(e) => {
                            e.stopPropagation();
                            selectImportAndScroll(item._id);
                          }}
                          title={
                            item.failureReason
                              ? `${item.failureReason}. Click to view details`
                              : 'Click to view details'
                          }
                        >
                          <Eye className="h-3.5 w-3.5 shrink-0" />
                          <span className="max-w-[250px] truncate">
                            {item.failureReason || 'Click to view details'}
                          </span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {selectedImport && (
            <div ref={invalidSectionRef} className="mt-4 rounded-lg border p-4">
              <div className="flex items-center justify-between gap-3 mb-3">
                <div>
                  <p className="text-sm font-semibold">Invalid Records (Sample)</p>
                  <p className="text-xs text-muted-foreground">
                    Showing first 100 invalid records for selected import.
                  </p>
                </div>
                <input
                  value={invalidSearch}
                  onChange={(e) => setInvalidSearch(e.target.value)}
                  placeholder="Search by phone or reason..."
                  className="h-9 w-64 rounded-md border px-3 text-sm"
                />
              </div>
              {filteredInvalidRows.length === 0 ? (
                <p className="text-sm text-muted-foreground">No invalid records in sample.</p>
              ) : (
                <div className="max-h-64 overflow-auto rounded-md border">
                  <table className="w-full text-sm">
                    <thead className="sticky top-0 bg-background z-10">
                      <tr className="border-b text-left">
                        <th className="py-2 px-3 font-medium">Row</th>
                        <th className="py-2 px-3 font-medium">Phone</th>
                        <th className="py-2 px-3 font-medium">Reason</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredInvalidRows.map((row, idx) => (
                        <tr key={`${row.rowNumber}-${idx}`} className="border-b last:border-0">
                          <td className="py-2 px-3">{row.rowNumber}</td>
                          <td className="py-2 px-3">{row.phoneRaw || '-'}</td>
                          <td className="py-2 px-3">{row.reason}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
