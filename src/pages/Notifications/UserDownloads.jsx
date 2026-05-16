import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Download, 
  FileSpreadsheet, 
  Trash2, 
  Clock, 
  AlertCircle, 
  FileText, 
  ChevronRight,
  HardDriveDownload,
  Info,
  Search,
  Filter,
  FileBox
} from "lucide-react";
import PageLimitEditor from "../../components/PageLimitEditor";
import { Pagination } from "@mui/material";
import { formatDateAsNumberWithTime, formatFileSize } from "../../utils/extra";
import useRoles from "../../hooks/useRoles";
import ScrollControls from "../../components/ScrollControls";
import HubSubpageShell from "../../components/Layout/HubSubpageShell";
import {
  deleteUserDocument,
  getUserDocument,
  getUserDocuments,
} from "../../features/actions/export-excel";

const UserDownloads = () => {
  const dispatch = useDispatch();
  const { userData } = useSelector((state) => state.auth);
  const [page, setPage] = useState(1);
  const LIMIT = useSelector(
    (state) => state.pageLimits["userDownloadsPage"] || 10
  );

  const { userDocumentsForPage, pagination, isLoading, isSuccess } =
    useSelector((state) => state.export);
  const { totalPages = 1 } = pagination;

  useEffect(() => {
    dispatch(getUserDocuments({ page, limit: LIMIT }));
  }, [page, LIMIT, dispatch]);

  useEffect(() => {
    if (isSuccess) {
      dispatch(getUserDocuments({ page: 1, limit: LIMIT }));
    }
  }, [isSuccess, LIMIT, dispatch]);

  const getFileIcon = (fileName) => {
    if (fileName?.toLowerCase().endsWith(".xlsx") || fileName?.toLowerCase().endsWith(".csv")) {
      return <FileSpreadsheet className="h-5 w-5 text-emerald-500" />;
    }
    return <FileText className="h-5 w-5 text-indigo-500" />;
  };

  return (
    <HubSubpageShell
      title="File Downloads"
      subtitle="Access and manage your exported data and reports"
      icon={HardDriveDownload}
    >
      <div className="space-y-6">
        {/* Main Content Area */}
        <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          {/* Header Actions */}
          <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search files..."
                className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800/50 border-none rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 transition-all"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-400 px-3 py-1.5 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                {userDocumentsForPage.length} Total
              </span>
            </div>
          </div>

          {/* Files List */}
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            <AnimatePresence mode="popLayout">
              {userDocumentsForPage.length > 0 ? (
                userDocumentsForPage.map((notif, index) => (
                  <motion.div
                    key={notif._id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className={`group p-4 sm:p-6 transition-all hover:bg-slate-50 dark:hover:bg-slate-800/50 ${
                      notif.status === "EXPIRED" ? "opacity-60" : ""
                    }`}
                  >
                    <div className="flex gap-4">
                      <div className="flex-shrink-0 mt-1">
                        <div className="h-10 w-10 rounded-xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 shadow-sm flex items-center justify-center group-hover:scale-110 transition-transform">
                          {getFileIcon(notif.fileName)}
                        </div>
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 mb-1.5">
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                                {notif.fileName?.split('.').pop() || 'File'}
                              </span>
                              <span className="text-xs font-medium text-slate-400">•</span>
                              <span className="text-xs font-medium text-slate-400">{formatFileSize(notif?.fileSize)}</span>
                            </div>
                            <h3 
                              title={notif?.fileName}
                              className="text-base font-bold text-slate-900 dark:text-slate-100 truncate max-w-md"
                            >
                              {notif?.fileName}
                            </h3>
                            <div className="flex items-center gap-2 mt-2 text-xs font-medium text-slate-400">
                              <Clock className="h-3 w-3" />
                              Exported on {formatDateAsNumberWithTime(notif?.createdAt)}
                            </div>

                            {notif.status === "EXPIRED" && (
                              <div className="mt-3 inline-flex items-center gap-1.5 px-2.5 py-1 bg-rose-50 dark:bg-rose-500/10 text-[10px] font-black text-rose-600 dark:text-rose-400 rounded-lg border border-rose-100 dark:border-rose-500/20 uppercase tracking-tight">
                                <AlertCircle className="h-3.5 w-3.5" />
                                Link Expired
                              </div>
                            )}
                          </div>

                          {userData?.isActive && (
                            <div className="flex items-center gap-2 shrink-0">
                              <button
                                disabled={isLoading || notif.status === "EXPIRED"}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  dispatch(
                                    getUserDocument({
                                      id: notif._id,
                                      fileName: notif?.fileName,
                                    })
                                  );
                                }}
                                className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all disabled:opacity-30 disabled:cursor-not-allowed shadow-lg shadow-indigo-500/20 active:scale-95"
                              >
                                <Download className="h-3.5 w-3.5" />
                                Download
                              </button>
                              
                              <button
                                disabled={isLoading}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  dispatch(deleteUserDocument({ id: notif?._id }));
                                }}
                                className="p-2.5 bg-slate-50 dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-rose-500/10 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-xl transition-all border border-slate-200 dark:border-slate-700 hover:border-rose-200 dark:hover:border-rose-500/20"
                                title="Delete"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
                  <div className="h-20 w-20 rounded-3xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center mb-4">
                    <FileBox className="h-10 w-10 text-slate-200 dark:text-slate-700" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">No downloads available</h3>
                  <p className="text-sm text-slate-500 max-w-xs mt-1">
                    Your exported files and reports will appear here once they are ready.
                  </p>
                </div>
              )}
            </AnimatePresence>
          </div>

          {/* Pagination */}
          {userDocumentsForPage.length > 0 && (
            <div className="p-6 bg-slate-50/50 dark:bg-slate-800/50 border-t border-slate-100 dark:divide-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
              <Pagination
                onChange={(e, p) => setPage(p)}
                count={totalPages || 1}
                page={Number(page) || 1}
                variant="outlined"
                shape="rounded"
                sx={{
                  '& .MuiPaginationItem-root': {
                    borderRadius: '12px',
                    borderColor: 'transparent',
                    '&:hover': { backgroundColor: 'rgba(99, 102, 241, 0.1)' },
                    '&.Mui-selected': {
                      backgroundColor: '#6366f1',
                      color: '#fff',
                      '&:hover': { backgroundColor: '#4f46e5' },
                    },
                  },
                }}
              />
              <PageLimitEditor setPage={setPage} pageId="userDownloadsPage" />
            </div>
          )}
        </div>
      </div>
      <ScrollControls />
    </HubSubpageShell>
  );
};

export default UserDownloads;
