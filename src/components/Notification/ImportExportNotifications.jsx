import React, { useEffect, useState, useRef, lazy, Suspense } from "react";
import { useDispatch, useSelector } from "react-redux";
import { CloudDownload, ExternalLink, FileText, Download, Trash2, AlertCircle } from "lucide-react";
import { useTheme } from "../../contexts/ThemeContext";
import { useNavigate } from "react-router-dom";
const LinearProgressWithLabel = lazy(() => import("../Export/LinearProgressWithLabel"));
import { socket } from "../../socket";
import { deleteUserDocument, getUserDocument, getUserDocuments } from "../../features/actions/export-excel";
import { formatDateAsNumber, formatFileSize } from "../../utils/extra";
import { setNewDownload } from "../../features/slices/export-excel";

const ImportExportNotifications = ({ userData, roles }) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [isOpen, setIsOpen] = useState(false);
  const bellRef = useRef(null);
  const dropdownRef = useRef(null);
  const [progress, setProgress] = useState(0);
  const { userDocuments, isLoading, isExportLoading} = useSelector((state) => state.export);
  const { isImporting } = useSelector((state) => state.attendee);

  const handleBellClick = () => {
    setIsOpen((prev) => !prev);
  };

  const handleOutsideClick = (event) => {
    if (
      dropdownRef.current &&
      !dropdownRef.current.contains(event.target) &&
      bellRef.current &&
      !bellRef.current.contains(event.target)
    ) {
      setIsOpen(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      document.addEventListener("mousedown", handleOutsideClick);
    } else {
      document.removeEventListener("mousedown", handleOutsideClick);
    }
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, [isOpen]);

  useEffect(() => {
    dispatch(getUserDocuments({bell: true}));
  }, [dispatch]);

  useEffect(() => {
    setProgress(0)
    if (isExportLoading || isImporting) {
      setIsOpen(true);
    }
    else{
      setIsOpen(false);
    }
    
  }, [isExportLoading,isImporting]);

  useEffect(() => {
    function onImport(data) {
      if (data.actionType === "import") {
        if (data.value > 0) {
          setProgress(data.value);
        }
      }
    }

    function newDownload(data){
      dispatch(setNewDownload(data));
    }
    socket.on("import-export", onImport);
    socket.on("new-download", newDownload);
    return () => {
      socket.off("import-export", onImport);
      socket.off("new-download", newDownload);
    };
  }, [dispatch]);

  const { isDark } = useTheme();

  return (
    <div className="relative">
      <button
        ref={bellRef}
        onClick={handleBellClick}
        title="Downloads & Exports"
        className="flex h-8 w-8 items-center justify-center rounded-lg transition-all sm:h-9 sm:w-9 md:h-10 md:w-10"
        style={{
          backgroundColor: isDark ? "#1e293b" : "#f9fafb",
          border: isDark ? "1px solid #334155" : "1px solid #e5e7eb",
        }}
      >
        <div className="relative">
          <CloudDownload 
            className={`h-4 w-4 sm:h-5 sm:w-5 ${(isExportLoading || isImporting) ? "text-blue-500 animate-bounce" : "text-blue-400/80"}`} 
          />
          {(isExportLoading || isImporting) && (
            <span className="absolute -right-1.5 -top-1.5 flex h-4 w-4 animate-pulse items-center justify-center rounded-full bg-blue-500 ring-2 ring-white dark:ring-slate-900" />
          )}
        </div>
      </button>

      {isOpen && (
        <div
          ref={dropdownRef}
          className="absolute right-0 z-[100] mt-2 w-[320px] origin-top-right rounded-xl border border-slate-200 bg-white shadow-xl dark:border-slate-700 dark:bg-slate-800 sm:w-96"
        >
          <div className="p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className={`h-2 w-2 rounded-full ${(isExportLoading || isImporting) ? 'bg-blue-500 animate-pulse' : 'bg-slate-300'}`} />
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">Downloads</h3>
              </div>
              <button 
                onClick={() => {
                  setIsOpen(false);
                  navigate("/user-downloads");
                }}
                className="flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400"
              >
                View History <ExternalLink className="h-3 w-3" />
              </button>
            </div>

            <div className="custom-scrollbar max-h-[350px] space-y-3 overflow-y-auto pr-1">
              {(isExportLoading || isImporting) && (
                <div className="rounded-lg bg-blue-50/50 p-3 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-800 text-blue-600 dark:text-blue-400">
                      <CloudDownload className="h-3.5 w-3.5" />
                    </div>
                    <span className="text-xs font-bold text-blue-700 dark:text-blue-300 uppercase tracking-wider">
                      {isImporting ? "Importing Data..." : "Exporting Data..."}
                    </span>
                  </div>
                  <Suspense fallback={<div className="h-2 w-full bg-slate-100 rounded animate-pulse" />}>
                    <LinearProgressWithLabel value={progress} />
                  </Suspense>
                </div>
              )}

              {userDocuments.length > 0 ? (
                userDocuments.map((notif) => (
                  <div
                    key={notif._id}
                    className="group relative flex items-start gap-3 rounded-lg border border-slate-50 p-3 transition-all hover:bg-slate-50 dark:border-transparent dark:hover:bg-slate-700/50"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-500 group-hover:bg-blue-100 group-hover:text-blue-600 dark:group-hover:bg-blue-900/30 dark:group-hover:text-blue-400 transition-colors">
                      <FileText className="h-5 w-5" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">
                        {notif?.fileName}
                      </p>
                      <div className="mt-1 flex items-center gap-2 text-[10px] font-medium text-slate-500 dark:text-slate-400">
                        <span className="rounded bg-slate-100 px-1.5 py-0.5 dark:bg-slate-700">
                          {formatFileSize(notif?.fileSize)}
                        </span>
                        <span>•</span>
                        <span>{formatDateAsNumber(notif?.createdAt)}</span>
                      </div>
                      
                      {notif.status === "EXPIRED" && (
                        <div className="mt-2 flex items-center gap-1 text-[10px] font-bold text-red-500 uppercase tracking-tight">
                          <AlertCircle className="h-3 w-3" /> Link Expired
                        </div>
                      )}
                    </div>

                    {userData?.isActive && notif.status !== "EXPIRED" && (
                      <div className="flex shrink-0 items-center gap-1 self-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          disabled={isLoading}
                          onClick={(e) => {
                            e.stopPropagation();
                            dispatch(getUserDocument({ id: notif._id, fileName: notif?.fileName }));
                          }}
                          className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-50 text-blue-600 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400 dark:hover:bg-blue-900/50 transition-colors"
                          title="Download"
                        >
                          <Download className="h-4 w-4" />
                        </button>
                        <button
                          disabled={isLoading}
                          onClick={(e) => {
                            e.stopPropagation();
                            dispatch(deleteUserDocument({ id: notif?._id }));
                          }}
                          className="flex h-8 w-8 items-center justify-center rounded-full bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-900/50 transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                  </div>
                ))
              ) : (
                !isExportLoading && !isImporting && (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-slate-50 dark:bg-slate-700/30">
                      <CloudDownload className="h-6 w-6 text-slate-300 dark:text-slate-600" />
                    </div>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      No downloads available
                    </p>
                  </div>
                )
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ImportExportNotifications;
