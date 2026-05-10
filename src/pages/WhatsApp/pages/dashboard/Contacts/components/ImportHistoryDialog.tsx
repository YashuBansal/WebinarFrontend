import { useMemo, useRef, useState } from 'react';
import { useImportHistory } from '@/hooks/useContacts';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Loader2,
  History,
  FileSpreadsheet,
  Eye,
  X,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Search,
  Filter
} from 'lucide-react';

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

  const getStatusConfig = (status: string) => {
    if (status === 'success') return { label: 'Success', icon: <CheckCircle2 className="h-3 w-3" />, className: 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-500/20' };
    if (status === 'partial_success') return { label: 'Partial', icon: <AlertTriangle className="h-3 w-3" />, className: 'bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-100 dark:border-amber-500/20' };
    if (status === 'failed') return { label: 'Failed', icon: <XCircle className="h-3 w-3" />, className: 'bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-100 dark:border-rose-500/20' };
    return { label: status, icon: null, className: 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-100 dark:border-slate-800' };
  };

  const selectImportAndScroll = (importId: string) => {
    setSelectedImportId(importId);
    requestAnimationFrame(() => {
      invalidSectionRef.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        className="w-[95vw] !max-w-[95vw] sm:!max-w-[1200px] border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-0 overflow-hidden rounded-2xl shadow-2xl"
        onPointerDownOutside={(e) => e.preventDefault()}
        showCloseButton={false}
      >
        <div className="relative w-full flex flex-col max-h-[90vh]">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 sticky top-0 z-20">
            <div>
              <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 font-bold text-[10px] uppercase tracking-[0.2em] mb-1">
                <History className="h-3 w-3" />
                Audit Log
              </div>
              <DialogTitle className="text-xl font-bold text-slate-900 dark:text-white">
                Import History
              </DialogTitle>
              <DialogDescription className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-1">
                Track CSV/XLSX import outcomes and quality metrics across your audience.
              </DialogDescription>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="h-10 w-10 flex items-center justify-center rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-400 transition-colors border border-transparent hover:border-slate-100"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Compact Stats Bar */}
          <div className="px-6 py-2.5 bg-slate-50 dark:bg-slate-800 border-b border-slate-100 dark:border-slate-800 flex items-center justify-around gap-8">
            <div className="flex items-center gap-3">
              <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Total Imports</span>
              <span className="text-sm font-black text-slate-900 dark:text-white">{totalImports}</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-[9px] font-black uppercase tracking-widest text-emerald-500">Success</span>
              <span className="text-sm font-black text-emerald-600 dark:text-emerald-400">{successCount}</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-[9px] font-black uppercase tracking-widest text-amber-500">Partial</span>
              <span className="text-sm font-black text-amber-600 dark:text-amber-400">{partialCount}</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-[9px] font-black uppercase tracking-widest text-rose-500">Failed</span>
              <span className="text-sm font-black text-rose-600">{failedCount}</span>
            </div>
          </div>

          <div className="flex-1 overflow-auto custom-scrollbar">
            <div className="p-6">
              {isLoading ? (
                <div className="h-64 flex flex-col items-center justify-center text-slate-400">
                  <Loader2 className="h-10 w-10 animate-spin mb-4 opacity-20" />
                  <p className="font-bold text-xs uppercase tracking-widest">Fetching History...</p>
                </div>
              ) : rows.length === 0 ? (
                <div className="h-64 flex flex-col items-center justify-center text-center">
                  <div className="h-16 w-16 bg-slate-50 dark:bg-slate-800 rounded-2xl flex items-center justify-center mb-6">
                    <FileSpreadsheet className="h-8 w-8 text-slate-300" />
                  </div>
                  <p className="font-black text-sm uppercase tracking-widest text-slate-900 dark:text-white mb-1">No Imports Found</p>
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Upload your first CSV to start tracking history.</p>
                </div>
              ) : (
                <div className="rounded-2xl border border-slate-100 dark:border-slate-800 overflow-hidden bg-white dark:bg-slate-900 shadow-sm">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-slate-50 dark:bg-slate-800 text-left border-b border-slate-100 dark:border-slate-800">
                          <th className="py-4 px-6 font-black text-[10px] uppercase tracking-widest text-slate-400">Timestamp</th>
                          <th className="py-4 px-4 font-black text-[10px] uppercase tracking-widest text-slate-400">Status</th>
                          <th className="py-4 px-4 font-black text-[10px] uppercase tracking-widest text-slate-400">Records</th>
                          <th className="py-4 px-4 font-black text-[10px] uppercase tracking-widest text-slate-400">Valid/Inv</th>
                          <th className="py-4 px-4 font-black text-[10px] uppercase tracking-widest text-slate-400">Action</th>
                          <th className="py-4 px-6 font-black text-[10px] uppercase tracking-widest text-slate-400">Notes</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {rows.map((item) => {
                          const status = getStatusConfig(item.status);
                          return (
                            <tr
                              key={item._id}
                              onClick={() => selectImportAndScroll(item._id)}
                              className={`hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer group ${selectedImportId === item._id ? 'bg-blue-50/30 dark:bg-blue-500/10' : ''
                                }`}
                            >
                              <td className="py-4 px-6">
                                <div className="flex items-center gap-2">
                                  <Calendar className="h-3.5 w-3.5 text-slate-300" />
                                  <span className="font-mono text-[11px] font-bold text-slate-600 dark:text-slate-400">
                                    {new Date(item.createdAt).toLocaleString()}
                                  </span>
                                </div>
                              </td>
                              <td className="py-4 px-4">
                                <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[10px] font-black uppercase tracking-wider ${status.className}`}>
                                  {status.icon}
                                  {status.label}
                                </div>
                              </td>
                              <td className="py-4 px-4">
                                <span className="font-bold text-slate-900 dark:text-white">{item.totalRows}</span>
                              </td>
                              <td className="py-4 px-4">
                                <div className="flex items-center gap-1.5 font-bold text-xs">
                                  <span className="text-emerald-600 dark:text-emerald-400">{item.validRows}</span>
                                  <span className="text-slate-300 dark:text-slate-700">/</span>
                                  <span className="text-rose-600 dark:text-rose-400">{item.invalidRows}</span>
                                </div>
                              </td>
                              <td className="py-4 px-4">
                                <div className="flex items-center gap-1.5 font-bold text-[10px] uppercase tracking-widest text-slate-400">
                                  <span className="text-blue-600 dark:text-blue-400">{item.newCount} New</span>
                                  <span>•</span>
                                  <span className="text-slate-600 dark:text-slate-400">{item.updatedCount} Upd</span>
                                </div>
                              </td>
                              <td className="py-4 px-6">
                                <div className="flex items-center justify-between gap-3">
                                  <span className="text-xs font-medium text-slate-500 dark:text-slate-400 truncate max-w-[200px]">
                                    {item.failureReason || 'Process complete'}
                                  </span>
                                  <div className="h-8 w-8 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 flex items-center justify-center text-slate-400 group-hover:bg-white group-hover:text-blue-600 group-hover:border-blue-100 transition-all">
                                    <Eye className="h-4 w-4" />
                                  </div>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {selectedImport && (
                <div ref={invalidSectionRef} className="mt-6 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 bg-slate-50 dark:bg-slate-900">
                  <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-6">
                    <div>
                      <div className="flex items-center gap-2 text-rose-600 font-bold text-[10px] uppercase tracking-[0.2em] mb-1">
                        <AlertTriangle className="h-3 w-3" />
                        Quality Analysis
                      </div>
                      <h4 className="text-lg font-bold text-slate-900 dark:text-white">Invalid Records (Sample)</h4>
                      <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-1">
                        Showing up to 100 invalid records detected during this process.
                      </p>
                    </div>

                    <div className="relative w-full md:w-72 group">
                      <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                      <Input
                        value={invalidSearch}
                        onChange={(e) => setInvalidSearch(e.target.value)}
                        placeholder="Filter by reason..."
                        className="h-11 pl-10 rounded-xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus:ring-blue-500/10 focus:border-blue-500/50 transition-all text-xs font-bold"
                      />
                    </div>
                  </div>

                  {filteredInvalidRows.length === 0 ? (
                    <div className="py-12 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800">
                      <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">No matching records</p>
                    </div>
                  ) : (
                    <div className="rounded-2xl border border-slate-100 dark:border-slate-800 overflow-hidden bg-white dark:bg-slate-900 shadow-sm">
                      <div className="max-h-80 overflow-auto custom-scrollbar">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="bg-slate-50 dark:bg-slate-800 text-left border-b border-slate-100 dark:border-slate-800">
                              <th className="py-3 px-6 font-black text-[10px] uppercase tracking-widest text-slate-400">Row</th>
                              <th className="py-3 px-6 font-black text-[10px] uppercase tracking-widest text-slate-400">Data</th>
                              <th className="py-3 px-6 font-black text-[10px] uppercase tracking-widest text-slate-400">Failure Reason</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-50">
                            {filteredInvalidRows.map((row, idx) => (
                              <tr key={`${row.rowNumber}-${idx}`} className="hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                                <td className="py-3 px-6">
                                  <span className="font-mono text-[11px] font-bold text-slate-400">#{row.rowNumber}</span>
                                </td>
                                <td className="py-3 px-6">
                                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{row.phoneRaw || '-'}</span>
                                </td>
                                <td className="py-3 px-6">
                                  <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-lg bg-rose-50 dark:bg-rose-500/10 border border-rose-100 dark:border-rose-500/20 text-rose-600 dark:text-rose-400 text-[10px] font-bold">
                                    <XCircle className="h-3 w-3" />
                                    {row.reason}
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="p-6 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 flex justify-end sticky bottom-0 z-20">
            <Button
              type="button"
              onClick={onClose}
              className="h-12 px-8 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-all shadow-lg shadow-slate-900/10"
            >
              Close History
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
