import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Bell, 
  BellRing, 
  Search, 
  Filter, 
  Clock, 
  AlertCircle, 
  CheckCircle2, 
  Info,
  ChevronRight,
  Inbox
} from "lucide-react";
import { getUserNotifications } from "../../features/actions/notification";
import PageLimitEditor from "../../components/PageLimitEditor";
import { Pagination } from "@mui/material";
import { NotifActionType } from "../../utils/extra";
import useRoles from "../../hooks/useRoles";
import ScrollControls from "../../components/ScrollControls";
import HubSubpageShell from "../../components/Layout/HubSubpageShell";

const Notifications = () => {
  const dispatch = useDispatch();
  const [searchParams] = useSearchParams();
  const roles = useRoles();
  const navigate = useNavigate();
  const { userData } = useSelector((state) => state.auth);
  const { userId } = useParams();
  const [page, setPage] = useState(1);
  const LIMIT = useSelector(
    (state) => state.pageLimits["notificationsPage"] || 10
  );

  const { employeeModeData } = useSelector((state) => state.employee);
  const { notifications, totalPages, _notifications, _totalPages } =
    useSelector((state) => state.notification);
  const [imp, setImp] = useState(true);

  useEffect(() => {
    const important = searchParams.get("important");
    setImp(important === "true");
    if (important && userId) {
      dispatch(
        getUserNotifications({
          id: employeeModeData ? employeeModeData?._id : userId,
          important: important === "true",
          page: page,
          limit: LIMIT,
        })
      );
    }
  }, [searchParams, userId, page, LIMIT, dispatch, employeeModeData]);

  const getNotifIcon = (type) => {
    switch (type) {
      case "warning":
        return <AlertCircle className="h-5 w-5 text-amber-500" />;
      case "success":
        return <CheckCircle2 className="h-5 w-5 text-emerald-500" />;
      default:
        return <Bell className="h-5 w-5 text-indigo-500" />;
    }
  };

  const getStatusColor = (notif) => {
    if (!notif.isSeen) return "border-l-4 border-l-indigo-500 bg-indigo-50/30 dark:bg-indigo-500/5";
    return "border-l-4 border-l-transparent bg-white/50 dark:bg-slate-800/50";
  };

  function handleClick(notif) {
    const role = userData?.role;
    const isEmployee = roles.isEmployeeId(role);

    if (isEmployee) {
      if (
        notif.actionType === NotifActionType.WEBINAR_ASSIGNMENT ||
        notif.actionType === NotifActionType.ASSIGNMENT ||
        notif.actionType === NotifActionType.REASSIGNMENT
      ) {
        if (notif.metadata?.webinarId) {
          navigate(`/assignments?page=1&webinarId=${notif.metadata.webinarId}&tabValue=active&activity=Pending`);
        }
      }
      return;
    }

    if (notif.actionType === NotifActionType.USER_ACTIVITY) {
      navigate(
        `/employee/view/${notif?.metadata?.userId}?page=1&tabValue=activityLogs&role=${notif?.metadata?.role}&webinarId=all&userName=${notif?.metadata?.userName}`
      );
    }

    if (
      notif.actionType === NotifActionType.REASSIGNMENT ||
      notif.actionType === NotifActionType.ATTENDEE_REGISTRATION
    ) {
      if (!notif?.metadata?.webinarId) return;
      const tabValue = notif?.metadata?.recordType || "preWebinar";
      const subTabValue =
        notif.actionType === NotifActionType.REASSIGNMENT
          ? "reassignrequested"
          : "attendees";
      navigate(
        `/webinarDetails/${notif.metadata.webinarId}?tabValue=${tabValue}&page=1&subTabValue=${subTabValue}`
      );
    }
  }

  const currentNotifications = imp ? notifications : _notifications;
  const currentTotalPages = imp ? totalPages : _totalPages;

  return (
    <HubSubpageShell
      title={`${imp ? "Important" : "System"} Notifications`}
      subtitle="Stay updated with the latest activities and alerts"
      icon={imp ? BellRing : Bell}
    >
      <div className="space-y-6">
        {/* Main Content Area */}
        <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search notifications..."
                className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800/50 border-none rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 transition-all"
              />
            </div>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            <AnimatePresence mode="popLayout">
              {currentNotifications.length > 0 ? (
                currentNotifications.map((notif, index) => (
                  <motion.div
                    key={notif?._id || index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    onClick={() => handleClick(notif)}
                    className={`group p-4 sm:p-6 transition-all cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 ${getStatusColor(notif)}`}
                  >
                    <div className="flex gap-4">
                      <div className="flex-shrink-0 mt-1">
                        <div className="h-10 w-10 rounded-xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 shadow-sm flex items-center justify-center group-hover:scale-110 transition-transform">
                          {getNotifIcon(notif.type)}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 uppercase tracking-wider mb-2">
                              {notif?.actionType?.split("_").join(" ") || "General"}
                            </span>
                            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 truncate">
                              {notif?.title}
                            </h3>
                          </div>
                          <div className="flex flex-col items-end gap-2">
                            <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-400 whitespace-nowrap">
                              <Clock className="h-3 w-3" />
                              {new Date(notif?.createdAt).toLocaleDateString()}
                            </div>
                            {!notif.isSeen && (
                              <div className="h-2 w-2 rounded-full bg-indigo-500 animate-pulse" />
                            )}
                          </div>
                        </div>
                        <p className="mt-1.5 text-sm text-slate-600 dark:text-slate-400 leading-relaxed line-clamp-2">
                          {notif?.message}
                        </p>
                        <div className="mt-4 flex items-center gap-2 text-xs font-bold text-indigo-600 dark:text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity">
                          View Details
                          <ChevronRight className="h-3 w-3" />
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
                  <div className="h-20 w-20 rounded-3xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center mb-4">
                    <Inbox className="h-10 w-10 text-slate-300 dark:text-slate-600" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">No notifications</h3>
                  <p className="text-sm text-slate-500 max-w-xs mt-1">
                    You're all caught up! There are no new notifications to show right now.
                  </p>
                </div>
              )}
            </AnimatePresence>
          </div>

          {currentNotifications.length > 0 && (
            <div className="p-6 bg-slate-50/50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
              <Pagination
                onChange={(e, p) => setPage(p)}
                count={currentTotalPages || 1}
                page={Number(page) || 1}
                variant="outlined"
                shape="rounded"
                className="dark:text-slate-100"
                sx={{
                  '& .MuiPaginationItem-root': {
                    borderRadius: '12px',
                    borderColor: 'transparent',
                    '&:hover': {
                      backgroundColor: 'rgba(99, 102, 241, 0.1)',
                    },
                    '&.Mui-selected': {
                      backgroundColor: '#6366f1',
                      color: '#fff',
                      '&:hover': {
                        backgroundColor: '#4f46e5',
                      },
                    },
                  },
                }}
              />
              <PageLimitEditor setPage={setPage} pageId="notificationsPage" />
            </div>
          )}
        </div>
      </div>
      <ScrollControls />
    </HubSubpageShell>
  );
};

export default Notifications;
