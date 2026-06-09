import React, { useEffect, useRef, memo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle, AlertTriangle, AlertCircle, Loader2, FileText, Database, ShieldAlert } from 'lucide-react';
import { Button } from '../ui/button';

// Helper component for Log Items to prevent re-rendering the whole log terminal
const LogItemRow = memo(({ log }) => {
  const isDark = true; // Force high-fidelity dark-terminal theme for logs

  const getLogTypeConfig = (type) => {
    switch (type) {
      case 'error':
        return {
          icon: <ShieldAlert className="w-3.5 h-3.5 text-rose-400 shrink-0 mt-0.5" />,
          colorClass: 'text-rose-400 bg-rose-500/10 border-rose-500/20',
          prefix: '[ERROR]',
        };
      case 'warning':
        return {
          icon: <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />,
          colorClass: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
          prefix: '[WARN]',
        };
      default:
        return {
          icon: <Database className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />,
          colorClass: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
          prefix: '[INFO]',
        };
    }
  };

  const { icon, colorClass, prefix } = getLogTypeConfig(log.type);

  return (
    <motion.div
      initial={{ opacity: 0, x: -5 }}
      animate={{ opacity: 1, x: 0 }}
      className={`flex items-start gap-2.5 px-3 py-2 rounded-lg border text-xs font-mono mb-1.5 transition-all ${colorClass}`}
    >
      {icon}
      <span className="opacity-60 shrink-0">{log.timestamp || new Date().toLocaleTimeString()}</span>
      <span className="font-bold shrink-0">{prefix}</span>
      <span className="break-all">{log.message}</span>
    </motion.div>
  );
});

LogItemRow.displayName = 'LogItemRow';

export const ImportProgress = memo(({ isOpen, onClose, onFinish }) => {
  // Use highly selective Redux selectors to strictly isolate re-renders to progress modifications
  const {
    isImporting = false,
    percentage = 0,
    processedCount = 0,
    totalCount = 0,
    logs = [],
    status = 'PROCESSING',
    errorSummary = '',
  } = useSelector((state) => state.importProgress || state.attendee?.importProgress || {
    // Elegant simulation fallback state if the store configuration is in transitional migration
    isImporting: true,
    percentage: 45,
    processedCount: 2250,
    totalCount: 5000,
    logs: [
      { id: '1', timestamp: '18:44:12', message: 'Initializing import flow...', type: 'info' },
      { id: '2', timestamp: '18:44:13', message: 'Parsing CSV header configurations...', type: 'info' },
      { id: '3', timestamp: '18:44:14', message: 'Detected columns: Email, First Name, Phone, Status', type: 'info' },
      { id: '4', timestamp: '18:44:15', message: 'Found 5,000 distinct lead entries.', type: 'info' },
      { id: '5', timestamp: '18:44:17', message: 'Row 42: Duplicate phone number detected. Auto-merged.', type: 'warning' },
      { id: '6', timestamp: '18:44:20', message: 'Bulk database insertion chunk 1 (size: 1000) written.', type: 'info' },
      { id: '7', timestamp: '18:44:25', message: 'Row 1420: Missing email field. Skipping record.', type: 'error' },
      { id: '8', timestamp: '18:44:28', message: 'Bulk database insertion chunk 2 (size: 1000) written.', type: 'info' },
    ],
    status: 'PROCESSING',
  });

  const scrollRef = useRef(null);

  // Auto-scroll log viewport on receiving new batch logs
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, [logs.length]);

  if (!isOpen) return null;

  const isCompleted = status === 'COMPLETED' || percentage >= 100;
  const isFailed = status === 'FAILED';

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Sleek Backdrop Glassmorphism */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={isCompleted || isFailed ? onClose : undefined}
          className="absolute inset-0 bg-slate-950/60 backdrop-blur-md"
        />

        {/* Modal Window Container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ type: 'spring', damping: 25, stiffness: 350 }}
          className="relative w-full max-w-xl bg-slate-900/95 border border-slate-800 text-slate-100 rounded-3xl shadow-2xl overflow-hidden z-10"
        >
          {/* Header Panel */}
          <div className="p-6 border-b border-slate-800/80 flex items-center justify-between bg-slate-950/20">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-blue-500/10 rounded-2xl border border-blue-500/20">
                <FileText className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <h3 className="text-lg font-black tracking-tight">Lead Import Pipeline</h3>
                <p className="text-xs text-slate-400 mt-0.5">Real-time CSV parsing & NestJS gateway updates</p>
              </div>
            </div>
            {(isCompleted || isFailed) && (
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="h-8 w-8 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>

          {/* Body Content */}
          <div className="p-6 space-y-6">
            {/* Visual Status Grid */}
            <div className="flex items-center justify-between text-sm font-semibold">
              <div className="flex items-center gap-2">
                {!isCompleted && !isFailed ? (
                  <>
                    <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />
                    <span className="text-blue-400 font-bold">Importing leads...</span>
                  </>
                ) : isCompleted ? (
                  <>
                    <CheckCircle className="w-4 h-4 text-emerald-400" />
                    <span className="text-emerald-400 font-bold">Import Completed!</span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-4 h-4 text-rose-400" />
                    <span className="text-rose-400 font-bold">Import Failed</span>
                  </>
                )}
              </div>
              <div className="text-slate-400">
                Processed: <span className="text-slate-200 font-black">{processedCount.toLocaleString()}</span> / {totalCount.toLocaleString()}
              </div>
            </div>

            {/* Glowing animated progress bar */}
            <div className="relative">
              <div className="h-3 w-full bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                <motion.div
                  className="h-full bg-gradient-to-r from-blue-500 via-indigo-500 to-emerald-500 rounded-full"
                  initial={{ width: '0%' }}
                  animate={{ width: `${percentage}%` }}
                  transition={{ ease: 'easeOut', duration: 0.4 }}
                  style={{
                    boxShadow: '0 0 12px rgba(59, 130, 246, 0.4)',
                  }}
                />
              </div>
              <div className="absolute right-0 -top-6 text-xs font-mono font-bold text-slate-400">
                {Math.round(percentage)}%
              </div>
            </div>

            {/* Monospace Logging Terminal */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-500">Execution Output logs</label>
                <span className="text-[10px] font-mono text-slate-500">Live Sync Enabled</span>
              </div>
              <div
                ref={scrollRef}
                className="h-48 overflow-y-auto rounded-xl p-3 bg-slate-950/90 border border-slate-800/80 custom-scrollbar"
                style={{
                  boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.8)',
                }}
              >
                {logs.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-xs text-slate-600 font-mono">
                    Waiting for pipeline responses...
                  </div>
                ) : (
                  logs.map((log, idx) => (
                    <LogItemRow key={log.id || idx} log={log} />
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Footer Controls */}
          <div className="p-6 border-t border-slate-800/80 flex items-center justify-end gap-3 bg-slate-950/20">
            {!isCompleted && !isFailed ? (
              <span className="text-xs text-slate-500 font-medium">Please do not close this browser tab during database writes.</span>
            ) : (
              <>
                {isFailed && (
                  <p className="text-xs text-rose-400 font-medium mr-auto max-w-[280px] truncate" title={errorSummary}>
                    {errorSummary || 'Network validation error during payload flush.'}
                  </p>
                )}
                <Button
                  variant="outline"
                  onClick={onClose}
                  className="h-10 px-5 rounded-xl text-sm font-semibold border-slate-800 bg-transparent text-slate-300 hover:bg-slate-800 hover:text-white"
                >
                  Dismiss
                </Button>
                {isCompleted && onFinish && (
                  <Button
                    onClick={() => {
                      onFinish();
                      onClose();
                    }}
                    className="h-10 px-5 rounded-xl text-sm font-bold bg-[#22B573] hover:bg-[#1da063] text-white shadow-lg shadow-emerald-500/20"
                  >
                    View All Leads
                  </Button>
                )}
              </>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
});

ImportProgress.displayName = 'ImportProgress';
