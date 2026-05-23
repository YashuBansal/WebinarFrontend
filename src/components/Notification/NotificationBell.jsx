import React, { useEffect, useState, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Bell, MessageSquare, ExternalLink, Clock } from "lucide-react";
import { useTheme } from "../../contexts/ThemeContext";
import {
  getUserNotifications,
  resetUnseenCount,
} from "../../features/actions/notification";
import { useNavigate } from "react-router-dom";
import { NotifActionType } from "../../utils/extra";

const NotificationBell = ({ userData, roles, important }) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [isOpen, setIsOpen] = useState(false);
  const bellRef = useRef(null);
  const dropdownRef = useRef(null);

  const { employeeModeData } = useSelector((state) => state.employee);
  const { bellNotifications, unseenCount, _bellNotifications, _unseenCount } =
    useSelector((state) => state.notification);

  const handleBellClick = () => {
    setIsOpen((prev) => !prev);
    if ((important ? unseenCount : _unseenCount) > 0 && !employeeModeData) {
      dispatch(resetUnseenCount(important));
    }
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
    if (userData?._id) {
      dispatch(
        getUserNotifications({
          id: employeeModeData ? employeeModeData?._id : userData?._id,
          important,
          bell: true,
        })
      );
    }
  }, [userData, employeeModeData]);

  function handleClick(notif) {
    console.log(notif);
    setIsOpen(false);
    const role = userData?.role;
    const isEmployee = roles.isEmployeeId(role);
    const isSuperAdmin = roles.isSuperAdmin(role);

    if (isEmployee) {
      if (
        notif.actionType === NotifActionType.WEBINAR_ASSIGNMENT ||
        notif.actionType === NotifActionType.ASSIGNMENT ||
        notif.actionType === NotifActionType.REASSIGNMENT
      ) {
        if (notif.metadata?.webinarId) {
          navigate(`/assignments?webinarId=${notif.metadata.webinarId}`);
        }
      }

      return;
    }

    if (notif.actionType === NotifActionType.USER_ACTIVITY) {
      console.log("User Activity Notification Clicked", notif);
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

    if (notif.actionType === NotifActionType.LOCATION_REQUEST) {
      const isRejected = notif.title.toLowerCase().includes("rejected");

      if (isSuperAdmin || isRejected) {
        navigate(`/locations/requests?page=1`);
      } else {
        navigate(`/locations?page=1`);
      }
    }
  }

  const { isDark } = useTheme();

  return (
    <div className="relative">
      <button
        ref={bellRef}
        onClick={handleBellClick}
        title={important ? "Messages" : "Notifications"}
        className="flex h-8 w-8 items-center justify-center rounded-lg transition-all sm:h-9 sm:w-9 md:h-10 md:w-10"
        style={{
          backgroundColor: isDark ? "#1e293b" : "#f9fafb",
          border: isDark ? "1px solid #334155" : "1px solid #e5e7eb",
        }}
      >
        <div className="relative">
          {important ? (
            <MessageSquare
              className={`h-4 w-4 sm:h-5 sm:w-5 ${unseenCount > 0 ? "text-indigo-500 animate-pulse" : "text-indigo-400/80"}`}
            />
          ) : (
            <Bell
              className={`h-4 w-4 sm:h-5 sm:w-5 ${(_unseenCount > 0) ? "text-amber-500 animate-pulse" : "text-amber-400/80"}`}
            />
          )}
          
          {(important ? unseenCount : _unseenCount) > 0 && (
            <span className="absolute -right-1.5 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white ring-2 ring-white dark:ring-slate-900">
              {important ? unseenCount : _unseenCount}
            </span>
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
                <div className={`h-2 w-2 rounded-full ${important ? 'bg-indigo-500' : 'bg-amber-500'}`} />
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">
                  {important ? "Important Alerts" : "Notifications"}
                </h3>
              </div>
              <button
                onClick={() => {
                  navigate(`/notifications/${userData?._id}?important=${important}`);
                  setIsOpen(false);
                }}
                className="flex items-center gap-1 text-xs font-medium text-indigo-600 hover:text-indigo-700 dark:text-indigo-400"
              >
                View All <ExternalLink className="h-3 w-3" />
              </button>
            </div>

            <div className="custom-scrollbar max-h-[350px] space-y-1 overflow-y-auto pr-1">
              {(important ? bellNotifications : _bellNotifications).length > 0 ? (
                (important ? bellNotifications : _bellNotifications).map((notif) => (
                  <div
                    key={notif._id}
                    onClick={() => handleClick(notif)}
                    className="group relative flex flex-col rounded-lg p-3 transition-colors hover:bg-slate-50 dark:hover:bg-slate-700/50 cursor-pointer border border-transparent hover:border-slate-100 dark:hover:border-slate-600"
                  >
                    <div className="flex justify-between items-start mb-1">
                      <span className="text-[13px] font-semibold text-slate-900 dark:text-slate-100 line-clamp-1 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                        {notif?.title}
                      </span>
                    </div>
                    <p className="text-[12px] text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed">
                      {notif?.message}
                    </p>
                    <div className="mt-2 flex items-center gap-2 text-[10px] text-slate-400">
                      <Clock className="h-3 w-3" />
                      <span>{new Date(notif?.createdAt).toLocaleDateString()}</span>
                      <span>•</span>
                      <span>{new Date(notif?.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-slate-50 dark:bg-slate-700/30">
                    <Bell className="h-6 w-6 text-slate-300 dark:text-slate-600" />
                  </div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    No notifications yet
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
