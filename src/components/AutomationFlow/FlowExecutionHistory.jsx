import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { instance } from '../../services/axiosInterceptor';
import { format } from 'date-fns';
import {
  Activity,
  CheckCircle2,
  XCircle,
  Eye,
  X,
  Code2,
  Clock,
  Terminal,
  ChevronLeft,
  Maximize,
  Minimize
} from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';

export default function FlowExecutionHistory({ projectId }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedLog, setSelectedLog] = useState(null);

  const location = useLocation();
  const navigate = useNavigate();
  const { isDark } = useTheme();

  const [activeTab, setActiveTab] = useState(location.state?.defaultTab || 'all');
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchLogs = async (pageNum = 1) => {
    setLoading(true);
    try {
      const params = { projectId, page: pageNum, limit: 50 };
      if (activeTab !== 'all') {
        params.type = activeTab;
      }
      const res = await instance.get('/flow-execution/history', { params });
      setLogs(res.data?.data || []);
      setTotalPages(res.data?.pagination?.totalPages || 1);
    } catch (err) {
      console.error('Failed to fetch execution logs', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (projectId) {
      fetchLogs(page);
    }
  }, [page, projectId, activeTab]);

  useEffect(() => {
    if (isFullscreen) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = prev;
      };
    }
  }, [isFullscreen]);

  const tabs = [
    { id: 'all', label: 'All Automations' },
    { id: 'crm', label: 'CRM Flows' },
    { id: 'whatsapp', label: 'WABA Flows' }
  ];

  const TableCard = (
    <div
      className={`flex flex-col overflow-hidden rounded-2xl border transition-all duration-300 ${isFullscreen ? "min-h-0 flex-1 shadow-2xl" : ""}`}
      style={{
        background: isFullscreen
          ? (isDark ? "#0f172a" : "#ffffff")
          : (isDark ? "rgba(15, 23, 42, 0.7)" : "rgba(255, 255, 255, 0.7)"),
        backdropFilter: isFullscreen ? "none" : "blur(16px)",
        borderColor: isDark ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.4)",
        boxShadow: !isFullscreen
          ? (isDark ? "0 10px 40px rgba(0, 0, 0, 0.4)" : "0 10px 40px rgba(7, 16, 40, 0.04)")
          : "none",
      }}
    >
      {/* Header with Premium Toggle */}
      <div
        className="flex flex-col items-center justify-between gap-4 border-b p-4 sm:flex-row"
        style={{ borderColor: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)" }}
      >
        <div className="flex items-center gap-1.5 p-1.5 bg-slate-100/80 dark:bg-slate-800/80 rounded-xl border border-slate-200/50 dark:border-slate-700/50 shadow-inner">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                setPage(1); // Reset page on tab change
              }}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-bold rounded-lg transition-all duration-300 ease-out ${activeTab === tab.id
                ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm border border-slate-200/50 dark:border-slate-600/50 scale-100'
                : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300 border border-transparent hover:bg-slate-200/50 dark:hover:bg-slate-800 scale-95'
                }`}
            >
              <span className={activeTab === tab.id ? 'opacity-100' : 'opacity-70 grayscale'}>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex w-full flex-shrink-0 items-center justify-end gap-2 self-end sm:w-auto sm:self-auto">
          <button
            type="button"
            title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
            onClick={() => setIsFullscreen((v) => !v)}
            className="flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 transition-colors hover:bg-black/5 dark:hover:bg-white/5"
            style={{
              backgroundColor: isDark ? "#1e293b" : "#ffffff",
              border: isDark ? "1px solid #334155" : "1px solid #e2e8f0",
              color: isDark ? "#f8fafc" : "#0f172a",
              fontFamily: "Inter, sans-serif"
            }}
          >
            {isFullscreen ? (
              <Minimize className="h-4 w-4 text-gray-500 dark:text-slate-400" />
            ) : (
              <Maximize className="h-4 w-4 text-gray-500 dark:text-slate-400" />
            )}
          </button>
        </div>
      </div>

      {/* Table */}
      <div className={`custom-scrollbar overflow-x-auto ${isFullscreen ? "min-h-0 flex-1 overflow-y-auto" : ""}`}>
        <table className="w-full min-w-[800px] border-collapse text-left">
          <thead className={isFullscreen ? "sticky top-0 z-20" : ""}>
            <tr style={{ backgroundColor: isDark ? "#1e293b" : "#F9FAFB" }}>
              <th className="whitespace-nowrap p-4 text-xs font-semibold uppercase tracking-wider transition-colors" style={{ color: isDark ? "#94a3b8" : "#64748b" }}>
                Date & Time
              </th>
              <th className="whitespace-nowrap p-4 text-xs font-semibold uppercase tracking-wider transition-colors" style={{ color: isDark ? "#94a3b8" : "#64748b" }}>
                Flow Name
              </th>
              <th className="whitespace-nowrap p-4 text-xs font-semibold uppercase tracking-wider transition-colors" style={{ color: isDark ? "#94a3b8" : "#64748b" }}>
                Status
              </th>
              <th className="whitespace-nowrap p-4 text-xs font-semibold uppercase tracking-wider transition-colors text-right" style={{ color: isDark ? "#94a3b8" : "#64748b" }}>
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="4" className="p-8 text-center" style={{ color: "#64748b" }}>
                  <div className="flex flex-col items-center justify-center gap-3">
                    <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                    <p style={{ fontFamily: "Inter, sans-serif" }}>Loading logs...</p>
                  </div>
                </td>
              </tr>
            ) : logs.length === 0 ? (
              <tr>
                <td colSpan="4" className="p-8 text-center transition-colors" style={{ color: isDark ? "#94a3b8" : "#64748b" }}>
                  <p style={{ fontFamily: "Inter, sans-serif" }}>
                    No execution logs found for this project matching the selected filters.
                  </p>
                </td>
              </tr>
            ) : (
              logs.map((log, index) => (
                <tr
                  key={log._id}
                  className="border-b transition-colors hover:bg-black/5 dark:hover:bg-white/5"
                  style={{ borderColor: isDark ? "#1e293b" : "#e2e8f0" }}
                >
                  <td className="p-4 text-sm font-medium transition-colors" style={{ color: isDark ? "#cbd5e1" : "#334155" }}>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-slate-400" />
                      {format(new Date(log.executedAt), 'MMM dd, yyyy HH:mm:ss')}
                    </div>
                  </td>
                  <td className="p-4 text-sm transition-colors" style={{ color: isDark ? "#cbd5e1" : "#334155", fontFamily: "Inter, sans-serif" }}>
                    <span className={isDark ? "text-slate-100" : "text-slate-900"}>{log.flowName || log.flowId}</span>
                  </td>
                  <td className="p-4 text-sm transition-colors">
                    {log.status === 'success' ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Success
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-500/20">
                        <XCircle className="w-3.5 h-3.5" />
                        Failed
                      </span>
                    )}
                  </td>
                  <td className="p-4 text-sm transition-colors text-right">
                    <button
                      onClick={() => setSelectedLog(log)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-bold transition-colors border border-slate-200 dark:border-slate-700"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      View Details
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      <div
        className="flex flex-shrink-0 flex-col gap-4 border-t p-4 sm:flex-row sm:items-center sm:justify-between"
        style={{
          borderColor: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)",
          backgroundColor: isDark ? "#1e293b" : "#F9FAFB",
        }}
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-4 text-sm text-slate-500 dark:text-slate-400">
          Showing page {page} of {Math.max(1, totalPages)}
        </div>

        <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-end">
          <button
            type="button"
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="rounded-lg border px-3 py-1.5 text-sm transition-colors hover:bg-black/5 dark:hover:bg-white/5 disabled:opacity-50"
            style={{
              borderColor: isDark ? "#334155" : "#e2e8f0",
              color: isDark ? "#f8fafc" : "#0f172a",
              backgroundColor: isDark ? "#1e293b" : "transparent"
            }}
          >
            Previous
          </button>

          <div className="flex items-center gap-1">
            <button
              type="button"
              className="flex h-8 w-8 items-center justify-center rounded-lg text-sm transition-colors bg-blue-600 text-white"
            >
              {page}
            </button>
          </div>

          <button
            type="button"
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            className="rounded-lg border px-3 py-1.5 text-sm transition-colors hover:bg-black/5 dark:hover:bg-white/5 disabled:opacity-50"
            style={{
              borderColor: isDark ? "#334155" : "#e2e8f0",
              color: isDark ? "#f8fafc" : "#0f172a",
              backgroundColor: isDark ? "#1e293b" : "transparent"
            }}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {isFullscreen ? (
        <div
          className="fixed inset-0 z-[100] flex flex-col"
          style={{ backgroundColor: isDark ? "#0f172a" : "#F2F4F6" }}
        >
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden p-4 sm:p-6">
            {TableCard}
          </div>
        </div>
      ) : (
        <div className="mx-auto w-full min-w-0 max-w-[1600px] space-y-6">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="rounded-xl p-2 text-slate-600 dark:text-slate-400 transition-colors hover:bg-gray-200 dark:hover:bg-slate-800"
                aria-label="Go back"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <h2
                className="text-2xl font-bold tracking-tight"
                style={{
                  color: isDark ? "#f8fafc" : "#071028",
                  fontFamily: "Inter, sans-serif",
                }}
              >
                Execution Logs
              </h2>
            </div>
          </div>
          {TableCard}
        </div>
      )}

      {/* Debugger Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="w-full max-w-3xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${selectedLog.status === 'success'
                  ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                  : 'bg-rose-50 dark:bg-rose-500/10 border-rose-200 dark:border-rose-500/20 text-rose-600 dark:text-rose-400'
                  }`}>
                  <Terminal className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">
                    Execution Log Details
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
                    {format(new Date(selectedLog.executedAt), 'PPP p')}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto bg-slate-50 dark:bg-slate-900 flex-1">
              {selectedLog.error && (
                <div className="mb-6 p-4 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 rounded-xl shadow-sm">
                  <h4 className="text-[10px] font-bold text-rose-800 dark:text-rose-400 uppercase tracking-wider mb-2">Error Message</h4>
                  <p className="text-sm font-medium text-rose-700 dark:text-rose-300 font-mono text-wrap break-words">
                    {selectedLog.error}
                  </p>
                </div>
              )}

              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Code2 className="w-4 h-4 text-slate-500" />
                  <h4 className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Raw Context Data</h4>
                </div>
                <div className="bg-slate-900 rounded-xl p-4 overflow-x-auto shadow-inner border border-slate-800">
                  <pre className="text-[11px] leading-relaxed font-mono text-slate-300">
                    <code>{JSON.stringify(selectedLog.logs, null, 2)}</code>
                  </pre>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
