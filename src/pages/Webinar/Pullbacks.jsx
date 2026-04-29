import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchReAssignments,
  handleReAssigmentRequest,
} from "../../features/actions/reAssign";
import { useNavigate, useParams } from "react-router-dom";
import { pullbacksTableColumns } from "../../utils/columnData";
import { Cancel, CheckCircle } from "@mui/icons-material";
import { AssignmentStatus, NotifActionType } from "../../utils/extra";
import { resetReAssignSuccess } from "../../features/slices/reAssign.slice";
import { socket } from "../../socket";
import { motion } from "framer-motion";
import { Eye, UserCheck, Maximize, Minimize } from "lucide-react";
import PageLimitEditor from "../../components/PageLimitEditor";
import { Button } from "../../components/ui/button";
import { Checkbox } from "../../components/ui/checkbox";
import { cn } from "../../lib/utils";
import { useTheme } from "../../contexts/ThemeContext";

const Pullbacks = (props) => {
  const tableHeader = "Re-Assignments";

  const { id } = useParams();
  const {
    tabValue,
    subTabValue,
    page,
    setPage,
    selectedRows,
    setSelectedRows,
    userData,
  } = props;
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { reAssignData, pagination, isLoading, isSuccess, requestLoading } =
    useSelector((state) => state.reAssign);
  
  const total = pagination?.total || 0;
  const totalPages = pagination?.totalPages || 1;
  const LIMIT = useSelector((state) => state.pageLimits[tableHeader] || 10);
  
  const [isFullScreen, setIsFullScreen] = useState(false);
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const portalTarget = typeof document !== "undefined" ? document.body : null;

  const inputStyle = {
    backgroundColor: isDark ? "#0f172a" : "#ffffff",
    border: `1px solid ${isDark ? "#334155" : "rgba(0,0,0,0.1)"}`,
    color: isDark ? "#f8fafc" : "#0f172a",
  };

  useEffect(() => {
    function fetchData() {
      dispatch(
        fetchReAssignments({
          webinarId: id,
          status: subTabValue,
          recordType: tabValue,
          page,
          limit: LIMIT,
        })
      );
    }

    function onNotification(data) {
      if (
        data.actionType === NotifActionType.REASSIGNMENT &&
        subTabValue === AssignmentStatus.REASSIGN_REQUESTED
      ) {
        fetchData();
      }
    }
    fetchData();
    socket.on("notification", onNotification);
    return () => {
      socket.off("notification", onNotification);
    };
  }, [subTabValue, LIMIT, page, tabValue, id, dispatch]);

  useEffect(() => {
    if (isSuccess) {
      setSelectedRows([]);
      dispatch(
        fetchReAssignments({
          webinarId: id,
          status: subTabValue,
          recordType: tabValue,
          page: 1,
          limit: LIMIT,
        })
      );
      dispatch(resetReAssignSuccess());
    }
  }, [isSuccess, id, subTabValue, tabValue, LIMIT, dispatch, setSelectedRows]);

  const activeColumns = pullbacksTableColumns
    .map((column) => {
      if (
        column.header === "Assigned To" &&
        subTabValue === AssignmentStatus.REASSIGN_APPROVED
      ) {
        return { ...column, header: "Previous Assigned To" };
      }
      if (
        column.header === "Reason" &&
        subTabValue === AssignmentStatus.REASSIGN_APPROVED
      ) {
        return null;
      }
      return column;
    })
    .filter(Boolean);

  const startRow = total > 0 ? (Number(page) - 1) * LIMIT + 1 : 0;
  const endRow = Math.min((Number(page) - 1) * LIMIT + (total > LIMIT ? LIMIT : total), total);

  const handleSelectAll = (checked) => {
    if (checked) {
      setSelectedRows(reAssignData.map(row => row._id));
    } else {
      setSelectedRows([]);
    }
  };

  const handleSelectRow = (rowId) => {
    setSelectedRows(prev => {
      if (prev.includes(rowId)) return prev.filter(id => id !== rowId);
      return [...prev, rowId];
    });
  };

  const isAllSelected = reAssignData?.length > 0 && selectedRows.length === reAssignData.length;

  const TableUI = (
    <motion.div
      className={cn(
        "rounded-2xl overflow-hidden border flex flex-col transition-all duration-500 ease-in-out shadow-2xl shadow-slate-900/10",
        isFullScreen ? "flex-1 h-full" : ""
      )}
      initial={{ opacity: 0, scale: 0.98, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      style={{
        background: isFullScreen ? (isDark ? "#1e293b" : "#ffffff") : (isDark ? "rgba(15, 23, 42, 0.7)" : "rgba(255, 255, 255, 0.8)"),
        backdropFilter: isFullScreen ? "none" : "blur(24px)",
        borderColor: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.06)",
        minHeight: isFullScreen ? "auto" : "600px",
      }}
    >
      <div className={cn("p-5 border-b backdrop-blur-md", isDark ? "border-slate-800 bg-slate-950/20" : "border-slate-100 bg-white/40")}>
        <div className="flex flex-col xl:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-500/10 rounded-2xl">
              <UserCheck className="w-6 h-6 text-blue-500" />
            </div>
            <div>
              <h2 className={cn("text-lg font-bold leading-tight capitalize", isDark ? "text-slate-100" : "text-slate-900")}>
                {subTabValue === AssignmentStatus.REASSIGN_APPROVED ? "Pullbacks" : "Requests"}
              </h2>
              <p className={cn("text-xs font-medium mt-0.5", isDark ? "text-slate-400" : "text-slate-500")}>
                Total Records: <span className="text-blue-500 font-bold">{total?.toLocaleString()}</span>
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 w-full xl:w-auto justify-end">
            <button
              type="button"
              onClick={() => setIsFullScreen(!isFullScreen)}
              className="rounded-xl flex items-center justify-center p-2.5 flex-shrink-0 hover:bg-black/5 transition-all"
              style={inputStyle}
              title={isFullScreen ? "Exit Fullscreen" : "Fullscreen"}
            >
              {isFullScreen ? (
                <Minimize className="w-4 h-4 text-gray-500" />
              ) : (
                <Maximize className="w-4 h-4 text-gray-500" />
              )}
            </button>
          </div>
        </div>
      </div>

      <div className={cn("flex-1 overflow-auto custom-scrollbar relative", isDark ? "bg-slate-950/20" : "bg-white/20")}>
        <table className="w-full text-left border-collapse min-w-[1000px]">
          <thead className="sticky top-0 z-20">
            <tr className={isDark ? "bg-slate-900" : "bg-[#F9FAFB]"}>
              {userData?.isActive && (
                <th className={cn("p-4 text-left font-semibold text-xs uppercase tracking-wider sticky left-0 z-30 w-12", isDark ? "text-slate-400 bg-slate-900" : "text-slate-500 bg-[#F9FAFB]")}>
                  <Checkbox
                    checked={isAllSelected}
                    onCheckedChange={handleSelectAll}
                    className="border-slate-300"
                  />
                </th>
              )}
              <th className={cn("p-4 text-left font-semibold text-xs uppercase tracking-wider w-16", isDark ? "text-slate-400 bg-slate-900" : "text-slate-500 bg-[#F9FAFB]")}>
                S.NO
              </th>
              {activeColumns.map((col) => (
                <th key={col.key} className={cn("p-4 text-left font-semibold text-xs uppercase tracking-wider", isDark ? "text-slate-400 bg-slate-900" : "text-slate-500 bg-[#F9FAFB]")}>
                  {col.header}
                </th>
              ))}
              <th className={cn("p-4 text-center font-semibold text-xs uppercase tracking-wider sticky right-0 z-30", isDark ? "text-slate-400 bg-slate-900" : "text-slate-500 bg-[#F9FAFB]")}>
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={activeColumns.length + (userData?.isActive ? 3 : 2)} className="px-6 py-20 text-center text-slate-400 font-medium">
                  Loading data...
                </td>
              </tr>
            ) : reAssignData?.length > 0 ? (
              reAssignData.map((item, index) => {
                const isSelected = selectedRows.includes(item._id);
                return (
                  <motion.tr
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.03 }}
                    key={item._id || index}
                    className={cn("group border-b transition-all duration-200", isSelected ? (isDark ? "bg-green-500/10" : "bg-green-50/50") : (isDark ? "border-slate-800/60 hover:bg-slate-800/20" : "border-slate-100 hover:bg-black/5"))}
                  >
                    {userData?.isActive && (
                      <td className={cn("p-4 align-middle sticky left-0 z-10 transition-colors", isSelected ? (isDark ? "bg-[#064e3b]" : "#f0fdf4") : (isDark ? "bg-slate-950 group-hover:bg-slate-900/80" : "bg-white group-hover:bg-slate-50/80"))}>
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => handleSelectRow(item._id)}
                          className="border-slate-300"
                        />
                      </td>
                    )}
                    <td className={cn("p-4 text-sm font-bold", isDark ? "text-slate-500" : "text-slate-400")}>
                      {startRow + index}
                    </td>
                    {activeColumns.map((col) => {
                      const val = item[col.key];
                      return (
                        <td key={col.key} className={cn("p-4 text-sm font-medium", isDark ? "text-slate-300" : "text-slate-700")}>
                          {val != null ? String(val) : "-"}
                        </td>
                      );
                    })}
                    <td className={cn("p-4 sticky right-0 z-10 transition-colors", isSelected ? (isDark ? "bg-[#064e3b]" : "#f0fdf4") : (isDark ? "bg-slate-950 group-hover:bg-slate-900/80" : "bg-white group-hover:bg-slate-50/80"))}>
                      <div className="flex justify-center items-center gap-1">
                        {userData?.isActive && item.status !== AssignmentStatus.REASSIGN_APPROVED && (
                          <>
                            <Button
                              variant="ghost"
                              size="icon"
                              disabled={requestLoading}
                              onClick={() => {
                                dispatch(
                                  handleReAssigmentRequest({
                                    status: "approved",
                                    assignments: [item._id],
                                    userId: item.user,
                                    webinarId: item.webinar,
                                    attendeeEmails: [item.attendeeEmail],
                                  })
                                );
                              }}
                              className={cn("h-8 w-8 rounded-lg", isDark ? "hover:bg-green-500/10" : "hover:bg-green-50")}
                              title="Accept Request"
                            >
                              <CheckCircle className="w-5 h-5 text-green-500" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              disabled={requestLoading}
                              onClick={() => {
                                dispatch(
                                  handleReAssigmentRequest({
                                    status: "rejected",
                                    assignments: [item._id],
                                    userId: item.user,
                                    webinarId: item.webinar,
                                    attendeeEmails: [item.attendeeEmail],
                                  })
                                );
                              }}
                              className={cn("h-8 w-8 rounded-lg", isDark ? "hover:bg-red-500/10" : "hover:bg-red-50")}
                              title="Reject Request"
                            >
                              <Cancel className="w-5 h-5 text-red-500" />
                            </Button>
                          </>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => navigate(`/particularContact?email=${item?.attendeeEmail}&attendeeId=${item?.attendee}`)}
                          className={cn("h-8 w-8 rounded-lg", isDark ? "hover:bg-purple-500/10" : "hover:bg-purple-50")}
                          title="View Attendee Info"
                        >
                          <Eye className="w-4 h-4 text-purple-500" />
                        </Button>
                      </div>
                    </td>
                  </motion.tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={activeColumns.length + (userData?.isActive ? 3 : 2)} className="px-6 py-20 text-center">
                  <p className="text-sm font-medium text-slate-400">No records found.</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className={cn("p-4 border-t flex flex-col sm:flex-row items-center justify-between gap-4", isDark ? "border-slate-800 bg-slate-900/50" : "border-slate-100 bg-slate-50/50")}>
        <div className="flex items-center gap-4">
          <PageLimitEditor pageId={tableHeader} setPage={setPage} />
          <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">
            Showing <span className={isDark ? "text-slate-200" : "text-slate-900"}>{startRow}</span> to <span className={isDark ? "text-slate-200" : "text-slate-900"}>{endRow}</span> of <span className="text-blue-500">{total?.toLocaleString()}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            disabled={Number(page) <= 1}
            onClick={() => setPage((p) => Math.max(1, Number(p) - 1))}
            className={cn("h-9 px-4 rounded-lg text-xs font-bold disabled:opacity-40", isDark ? "bg-slate-900 border-slate-800 text-slate-300" : "bg-white border-slate-200")}
          >
            Previous
          </Button>
          <div className="px-3 h-9 flex items-center justify-center rounded-lg bg-blue-500 text-white text-xs font-bold shadow-lg shadow-blue-500/20">
            {page}
          </div>
          <Button
            variant="outline"
            disabled={Number(page) >= totalPages || totalPages === 0}
            onClick={() => setPage((p) => Math.min(totalPages || 1, Number(p) + 1))}
            className={cn("h-9 px-4 rounded-lg text-xs font-bold disabled:opacity-40", isDark ? "bg-slate-900 border-slate-800 text-slate-300" : "bg-white border-slate-200")}
          >
            Next
          </Button>
        </div>
      </div>
    </motion.div>
  );

  return (
    <>
      {isFullScreen && portalTarget ? (
        createPortal(
          <div
            className={cn(
              "fixed inset-0 z-[100] p-4 sm:p-6 flex flex-col",
              isDark ? "bg-[#0f172a]" : "bg-[#F2F4F6]"
            )}
          >
            {TableUI}
          </div>,
          portalTarget
        )
      ) : (
        TableUI
      )}
    </>
  );
};

export default Pullbacks;
