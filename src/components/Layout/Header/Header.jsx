import React, { useCallback, useEffect, useState, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { LayoutDashboard, Menu, Moon, Sun, Video, X, ChevronDown, User, LogOut } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useQueryClient } from "@tanstack/react-query";
import { logout } from "../../../features/slices/auth";
import { clearNotifications } from "../../../features/slices/notification";
import { clearWebinarData } from "../../../features/slices/webinarContact";
import { getUserNotifications } from "../../../features/actions/notification";
import { logOutAndClearCookies } from "../../../features/actions/auth";
import useAddUserActivity from "../../../hooks/useAddUserActivity";
import { getRoleNameByID } from "../../../utils/roles";
import { toggleSidebar, setActiveHeaderSection } from "../../../features/slices/globalData";
import Profile from "./profile.svg";
import { setEmployeeModeId } from "../../../features/slices/employee";
import ComponentGuard from "../../AccessControl/ComponentGuard";
import useRoles from "../../../hooks/useRoles";
import usePlanExpiryWarning from "../../../hooks/usePlanExpiryWarning";
import NotificationBell from "../../Notification/NotificationBell";
import ImportExportNotifications from "../../Notification/ImportExportNotifications";
import { formatDateAsNumber } from "../../../utils/extra";
import useMediaQuery from "../../../hooks/useMediaQuery";
import { useTheme } from "../../../contexts/ThemeContext";

const Header = ({ toggleButtonRef, onMenuButtonClick }) => {
  const [showExpiryNotice, setShowExpiryNotice] = useState(true);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const { theme, toggleTheme, isDark } = useTheme();
  const dispatch = useDispatch();
  const roles = useRoles();
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const logUserActivity = useAddUserActivity();
  const { userData, HEADER_LABEL } = useSelector((state) => state.auth);
  const { employeeModeData } = useSelector((state) => state.employee);
  const { isSidebarOpen, activeHeaderSection } = useSelector((state) => state.globalData);
  const { unseenCount, _unseenCount } = useSelector((state) => state.notification);
  const isMdUp = useMediaQuery("(min-width: 768px)");

  const totalUnseen = (unseenCount || 0) + (_unseenCount || 0);

  const { showWarning, daysLeft, expiryDate } = usePlanExpiryWarning(15);

  useEffect(() => {
    if (userData?._id) {
      const targetUserId = employeeModeData ? employeeModeData?._id : userData?._id;
      dispatch(
        getUserNotifications({
          id: targetUserId,
          important: true,
          bell: true,
        })
      );
      dispatch(
        getUserNotifications({
          id: targetUserId,
          important: false,
          bell: true,
        })
      );
    }
  }, [userData, employeeModeData, dispatch]);

  useEffect(() => {
    if (location.pathname.startsWith("/whatsapp")) {
      dispatch(setActiveHeaderSection("WhatsApp"));
    } else if (location.pathname.startsWith("/zoom")) {
      dispatch(setActiveHeaderSection("Zoom"));
    } else if (location.pathname.startsWith("/affiliate")) {
      dispatch(setActiveHeaderSection("Affiliate"));
    } else {
      dispatch(setActiveHeaderSection("Dashboard"));
    }
  }, [location.pathname, dispatch]);

  useEffect(() => {
    const isSubHeaderVisible = employeeModeData || (showWarning && showExpiryNotice);
    const height = isSubHeaderVisible ? 100 : 64;
    document.documentElement.style.setProperty("--header-height", `${height}px`);
    // Cleanup on unmount (though Header is usually persistent)
    return () => {
      document.documentElement.style.removeProperty("--header-height");
    };
  }, [employeeModeData, showWarning, showExpiryNotice]);


  const handleProfileClick = () => {
    navigate("/profile");
  };

  const handleLogout = useCallback(() => {
    logUserActivity({
      action: "logout",
      details: "User logged out successfully from header dropdown",
    });

    queryClient.clear();
    dispatch(clearWebinarData());
    dispatch(clearNotifications());
    dispatch(logout());
    dispatch(logOutAndClearCookies()).then(() => {
      const broadcastChannel = new BroadcastChannel("auth-saas-crm");
      broadcastChannel.postMessage({ type: "LOGOUT" });
      broadcastChannel.close();
    });
  }, [dispatch, queryClient, logUserActivity]);

  const onExit = useCallback(() => {
    navigate("/employees?page=1");
    dispatch(setEmployeeModeId());
  }, [navigate, dispatch]);

  useEffect(() => {
    const handlePopState = () => {
      if (employeeModeData) {
        onExit();
      }
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [employeeModeData, onExit]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    if (isDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isDropdownOpen]);

  useEffect(() => {
    setIsDropdownOpen(false);
  }, [location.pathname]);

  const handleDrawerToggle = () => {
    if (onMenuButtonClick) {
      onMenuButtonClick();
    } else {
      dispatch(toggleSidebar());
    }
  };

  const dashboardActive = location.pathname === "/";
  const whatsappActive = location.pathname.startsWith("/whatsapp");
  const zoomActive = location.pathname.startsWith("/zoom");

  return (
    <>
      <header
        className="fixed left-0 right-0 top-0 z-[60] h-16 border-b transition-colors duration-500"
        style={{
          backgroundColor: isDark ? "#0f172a" : "#ffffff",
          borderColor: isDark ? "#1e293b" : "#e5e7eb",
          boxShadow: "0 1px 3px rgba(0, 0, 0, 0.05)",
        }}
      >
        <div className="flex h-full items-center justify-between gap-1 px-2 sm:gap-2 sm:px-4 lg:gap-4 lg:px-6">
          <div className="flex flex-1 min-w-0 items-center gap-1 sm:gap-2 lg:gap-4 justify-start">
            <button
              ref={toggleButtonRef}
              type="button"
              aria-controls="app-sidebar"
              {...(isMdUp ? {} : { "aria-expanded": !!isSidebarOpen })}
              onClick={handleDrawerToggle}
              className="md:hidden flex-shrink-0 rounded-lg p-1.5 text-slate-500 transition-colors hover:bg-slate-100 dark:hover:bg-slate-700 sm:p-2"
            >
              <span className="sr-only">Open menu</span>
              {!isMdUp && isSidebarOpen ? (
                <X className="h-5 w-5 sm:h-6 sm:w-6" />
              ) : (
                <Menu className="h-5 w-5 sm:h-6 sm:w-6" />
              )}
            </button>
            <div
              className="flex min-w-0 cursor-pointer items-center gap-2 sm:gap-3"
              onClick={() => navigate("/")}
              role="presentation"
            >
              <img
                src="/wlh-logo.png"
                alt="Webinar Leads Hub Logo"
                className="h-8 w-8 flex-shrink-0 object-contain sm:h-10 sm:w-10 lg:h-12 lg:w-12"
              />
              <div className="hidden flex-col leading-tight md:flex">
                <h1
                  className="tracking-wide"
                  style={{
                    color: isDark ? "#f8fafc" : "#000000",
                    fontFamily: "Inter, sans-serif",
                    fontSize: "15px",
                    fontWeight: 600,
                    letterSpacing: "0.5px",
                    lineHeight: 1.2,
                    WebkitFontSmoothing: "antialiased",
                  }}
                >
                  <span className="block min-[800px]:inline">WEBINAR</span>
                  <span className="block min-[800px]:inline min-[800px]:ml-1">
                    LEADS{" "}
                    <span style={{ color: "#21913c", fontWeight: 800 }}>HUB</span>
                  </span>
                </h1>
                {HEADER_LABEL ? (
                  <span className="mt-0.5 truncate text-[11px] font-medium uppercase tracking-wide text-neutral-500 dark:text-slate-400 sm:text-xs">
                    ({HEADER_LABEL})
                  </span>
                ) : null}
              </div>
            </div>
          </div>

          <div className="custom-scrollbar-hide flex-shrink-0 flex-grow-0 flex items-center justify-center gap-1 overflow-x-auto px-2 py-3 sm:gap-2 md:gap-4">
            <Link
              to="/"
              onClick={() => dispatch(setActiveHeaderSection("Dashboard"))}
              className={`relative flex flex-shrink-0 flex-col items-center justify-center rounded-xl px-3 py-2 transition-all duration-300 md:px-6 md:py-2.5 ${activeHeaderSection === "Dashboard"
                ? isDark
                  ? "bg-orange-500/10 ring-1 ring-orange-500/50"
                  : "bg-gradient-to-br from-white to-orange-50 ring-1 ring-orange-500/30"
                : isDark
                  ? "hover:bg-slate-800"
                  : "hover:bg-orange-50/80"
                }`}
              style={{
                boxShadow:
                  activeHeaderSection === "Dashboard" && !isDark
                    ? "inset 2px 2px 5px rgba(0, 0, 0, 0.05), inset -2px -2px 5px rgba(255, 255, 255, 0.9), 0 4px 15px rgba(249, 115, 22, 0.25), 0 0 0 1px rgba(249, 115, 22, 0.1)"
                    : "none",
              }}
            >
              <LayoutDashboard
                className="mb-0 h-5 w-5 sm:h-6 sm:w-6 md:mb-1.5"
                strokeWidth={1.5}
                style={{
                  color: activeHeaderSection === "Dashboard" ? "#f97316" : "#64748b",
                }}
              />
              <span
                className={`hidden text-[12px] md:block ${activeHeaderSection === "Dashboard" ? "font-semibold" : "font-medium"}`}
                style={{
                  color: activeHeaderSection === "Dashboard" ? "#f97316" : "#64748b",
                  fontFamily: "Inter, sans-serif",
                }}
              >
                Dashboard
              </span>
              {activeHeaderSection === "Dashboard" ? (
                <div className="absolute right-1 top-1 h-1.5 w-1.5 animate-pulse rounded-full bg-orange-500 md:right-1.5 md:top-1.5 md:h-2 md:w-2" />
              ) : null}
            </Link>

            {/* <Link to="/whatsapp"></Link> */}
            <Link
              to="/whatsapp"
              onClick={() => dispatch(setActiveHeaderSection("WhatsApp"))}
              className={`relative flex flex-shrink-0 flex-col items-center justify-center rounded-xl px-3 py-2 transition-all duration-300 md:px-6 md:py-2.5 ${activeHeaderSection === "WhatsApp"
                ? isDark
                  ? "bg-green-500/10 ring-1 ring-green-500/50"
                  : "bg-gradient-to-br from-white to-green-50 ring-1 ring-green-500/30"
                : isDark
                  ? "hover:bg-slate-800"
                  : "hover:bg-green-50/80"
                }`}
              style={{
                boxShadow:
                  activeHeaderSection === "WhatsApp" && !isDark
                    ? "inset 2px 2px 5px rgba(0, 0, 0, 0.05), inset -2px -2px 5px rgba(255, 255, 255, 0.9), 0 4px 15px rgba(34, 197, 94, 0.25), 0 0 0 1px rgba(34, 197, 94, 0.1)"
                    : "none",
              }}
            >
              <svg
                className="mb-0 h-5 w-5 sm:h-6 sm:w-6 md:mb-1.5"
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden
              >
                <path
                  d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"
                  fill={activeHeaderSection === "WhatsApp" ? "#22c55e" : "#64748b"}
                />
              </svg>
              <span
                className={`hidden text-[12px] md:block ${activeHeaderSection === "WhatsApp" ? "font-semibold" : "font-medium"}`}
                style={{
                  color: activeHeaderSection === "WhatsApp" ? "#22c55e" : "#64748b",
                  fontFamily: "Inter, sans-serif",
                }}
              >
                WhatsApp
              </span>
              {activeHeaderSection === "WhatsApp" ? (
                <div className="absolute right-1 top-1 h-1.5 w-1.5 animate-pulse rounded-full bg-green-500 md:right-1.5 md:top-1.5 md:h-2 md:w-2" />
              ) : null}
            </Link>

            <Link
              to="/zoom"
              onClick={() => dispatch(setActiveHeaderSection("Zoom"))}
              className={`relative flex flex-shrink-0 flex-col items-center justify-center rounded-xl px-3 py-2 transition-all duration-300 md:px-6 md:py-2.5 ${activeHeaderSection === "Zoom"
                ? isDark
                  ? "bg-blue-500/10 ring-1 ring-blue-500/50"
                  : "bg-gradient-to-br from-white to-blue-50 ring-1 ring-blue-500/30"
                : isDark
                  ? "hover:bg-slate-800"
                  : "hover:bg-blue-50/80"
                }`}
              style={{
                boxShadow:
                  zoomActive && !isDark
                    ? "inset 2px 2px 5px rgba(0, 0, 0, 0.05), inset -2px -2px 5px rgba(255, 255, 255, 0.9), 0 4px 15px rgba(59, 130, 246, 0.25), 0 0 0 1px rgba(59, 130, 246, 0.1)"
                    : "none",
              }}
            >
              <Video
                className="mb-0 h-5 w-5 sm:h-6 sm:w-6 md:mb-1.5"
                strokeWidth={1.5}
                style={{ color: activeHeaderSection === "Zoom" ? "#3b82f6" : "#64748b" }}
              />
              <span
                className={`hidden text-[12px] md:block ${activeHeaderSection === "Zoom" ? "font-semibold" : "font-medium"}`}
                style={{
                  color: activeHeaderSection === "Zoom" ? "#3b82f6" : "#64748b",
                  fontFamily: "Inter, sans-serif",
                }}
              >
                Zoom
              </span>
              {activeHeaderSection === "Zoom" ? (
                <div className="absolute right-1 top-1 h-1.5 w-1.5 animate-pulse rounded-full bg-blue-500 md:right-1.5 md:top-1.5 md:h-2 md:w-2" />
              ) : null}
            </Link>
          </div>

          <div className="flex flex-1 items-center justify-end gap-1 sm:gap-2">
            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                className="group flex items-center gap-2 rounded-xl p-1 transition-all duration-300 hover:shadow-md sm:gap-3 sm:pr-3"
                style={{
                  backgroundColor: isDark ? "#1e293b" : "#f9fafb",
                  border: isDark ? "1px solid #334155" : "1px solid #e5e7eb",
                }}
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              >
                <div className="hidden flex-col items-end leading-tight sm:flex">
                  <p className="max-w-[120px] truncate text-[13px] font-bold text-slate-900 dark:text-slate-100 lg:max-w-[160px]">
                    {userData?.userName}
                  </p>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-indigo-500 dark:text-indigo-400">
                    {getRoleNameByID(userData?.role)}
                  </p>
                </div>
                <div className="relative">
                  <div className="h-8 w-8 overflow-hidden rounded-lg ring-2 ring-indigo-500/20 transition-all duration-300 group-hover:ring-indigo-500 sm:h-9 sm:w-9 bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center">
                    {userData?.profileImageUrl ? (
                      <img
                        src={userData.profileImageUrl}
                        alt="User Profile"
                        className="h-full w-full object-cover"
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.nextSibling.style.display = 'flex';
                        }}
                      />
                    ) : null}
                    <div 
                      className="flex h-full w-full items-center justify-center text-[11px] font-bold text-indigo-600 dark:text-indigo-400 sm:text-xs"
                      style={{ display: userData?.profileImageUrl ? 'none' : 'flex' }}
                    >
                      {(() => {
                        const name = userData?.userName || "";
                        if (!name) return "?";
                        const p = name.trim().split(/\s+/);
                        if (p.length >= 2) return (p[0][0] + p[1][0]).toUpperCase();
                        return name.slice(0, 2).toUpperCase();
                      })()}
                    </div>
                  </div>
                  <div className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-green-500 shadow-sm dark:border-slate-800" />
                  {totalUnseen > 0 && (
                    <span className="absolute -right-1.5 -top-1.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold text-white ring-2 ring-white dark:ring-slate-900">
                      {totalUnseen}
                    </span>
                  )}
                </div>
                <ChevronDown className={`h-4 w-4 text-slate-500 dark:text-slate-400 transition-transform duration-300 ${isDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              <AnimatePresence>
                {isDropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.93, y: -10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.93, y: -10 }}
                    transition={{ type: "spring", stiffness: 350, damping: 25 }}
                    className="absolute right-0 mt-2.5 w-72 rounded-2xl border p-4 shadow-xl backdrop-blur-md z-[100] flex flex-col gap-3.5"
                    style={{
                      backgroundColor: isDark ? "rgba(30, 41, 59, 0.98)" : "rgba(255, 255, 255, 0.98)",
                      borderColor: isDark ? "#334155" : "#e2e8f0",
                      boxShadow: isDark
                        ? "0 10px 25px -5px rgba(0,0,0,0.5), 0 8px 10px -6px rgba(0,0,0,0.5)"
                        : "0 10px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1)",
                    }}
                  >
                    {/* User Header Section */}
                    <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
                      <div className="h-10 w-10 overflow-hidden rounded-xl ring-2 ring-indigo-500/20 bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center relative">
                        {userData?.profileImageUrl ? (
                          <img
                            src={userData.profileImageUrl}
                            alt="User Profile"
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-xs font-bold text-indigo-600 dark:text-indigo-400">
                            {(() => {
                              const name = userData?.userName || "";
                              if (!name) return "?";
                              const p = name.trim().split(/\s+/);
                              if (p.length >= 2) return (p[0][0] + p[1][0]).toUpperCase();
                              return name.slice(0, 2).toUpperCase();
                            })()}
                          </div>
                        )}
                        <div className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-green-500 shadow-sm dark:border-slate-900" />
                      </div>
                      <div className="flex flex-col leading-tight min-w-0">
                        <p className="truncate text-sm font-bold text-slate-900 dark:text-slate-100">
                          {userData?.userName}
                        </p>
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-indigo-500 dark:text-indigo-400">
                          {getRoleNameByID(userData?.role)}
                        </p>
                      </div>
                    </div>

                    {/* Quick Action Buttons Row */}
                    <div className="flex items-center justify-around gap-2 bg-slate-50 dark:bg-slate-800/40 p-2.5 rounded-xl border border-slate-100/50 dark:border-slate-800/50">
                      {/* Theme Toggle Button */}
                      <button
                        type="button"
                        onClick={toggleTheme}
                        title={theme === "light" ? "Switch to dark mode" : "Switch to light mode"}
                        className="flex h-8 w-8 items-center justify-center rounded-lg transition-all sm:h-9 sm:w-9 md:h-10 md:w-10"
                        style={{
                          backgroundColor: isDark ? "#1e293b" : "#f9fafb",
                          border: isDark ? "1px solid #334155" : "1px solid #e5e7eb",
                        }}
                      >
                        {theme === "light" ? (
                          <Moon className="h-4 w-4 text-slate-500 sm:h-5 sm:w-5" />
                        ) : (
                          <Sun className="h-4 w-4 text-amber-400 sm:h-5 sm:w-5" />
                        )}
                      </button>

                      {/* Import/Export Notification Bell */}
                      <ComponentGuard allowedRoles={[roles.ADMIN, roles.SUPER_ADMIN]}>
                        <ImportExportNotifications userData={userData} roles={roles} />
                      </ComponentGuard>

                      {/* Important Notification Bell */}
                      <NotificationBell important={true} userData={userData} roles={roles} />

                      {/* Regular Notification Bell */}
                      <NotificationBell important={false} userData={userData} roles={roles} />
                    </div>

                    {/* Navigation Options List */}
                    <div className="flex flex-col gap-1">
                      {/* Profile Button */}
                      <button
                        onClick={() => {
                          navigate("/profile");
                          setIsDropdownOpen(false);
                        }}
                        className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-all duration-200 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400"
                      >
                        <User className="h-4 w-4" />
                        <span>My Profile</span>
                      </button>

                      {/* Sign Out Button */}
                      <button
                        onClick={() => {
                          handleLogout();
                          setIsDropdownOpen(false);
                        }}
                        className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-all duration-200 hover:bg-red-50 dark:hover:bg-red-950/30 text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
                      >
                        <LogOut className="h-4 w-4 text-red-500" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </header>

      {/* Sub-header for Alerts and Employee Status */}
      {(employeeModeData || (showWarning && showExpiryNotice)) && (
        <div
          className="fixed left-0 right-0 top-16 z-50 flex h-9 items-center justify-center gap-4 border-b px-4 transition-all duration-500"
          style={{
            backgroundColor: isDark ? "#1e293b" : "#f8fafc",
            borderColor: isDark ? "#334155" : "#e5e7eb",
          }}
        >
          <div className="flex w-full max-w-7xl items-center justify-between gap-4 overflow-x-auto whitespace-nowrap px-2 scrollbar-hide sm:justify-center">
            {employeeModeData && (
              <ComponentGuard
                allowedRoles={[roles.ADMIN]}
                conditions={[!!employeeModeData]}
              >
                <div className="flex items-center gap-2 text-[11px] sm:text-xs">
                  <div className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-500/20 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400">
                    <LayoutDashboard className="h-3 w-3" />
                  </div>
                  <span className="font-medium text-slate-500 dark:text-slate-400">
                    Employee View:
                  </span>
                  <span className="font-bold text-slate-900 dark:text-slate-100">
                    {employeeModeData.userName} ({employeeModeData.role})
                  </span>
                  <button
                    type="button"
                    onClick={onExit}
                    className="ml-1 rounded-full bg-red-500 px-3 py-0.5 text-[10px] font-bold text-white hover:bg-red-600 transition-colors shadow-sm"
                  >
                    EXIT
                  </button>
                </div>
              </ComponentGuard>
            )}

            {employeeModeData && showWarning && showExpiryNotice && (
              <div className="h-4 w-[1px] bg-slate-300 dark:bg-slate-600 sm:block hidden" />
            )}

            {showWarning && showExpiryNotice && (
              <ComponentGuard
                allowedRoles={[roles.ADMIN]}
                conditions={[showWarning, showExpiryNotice]}
              >
                <div className="flex items-center gap-2 text-[11px] sm:text-xs">
                  <div className="animate-pulse h-2 w-2 rounded-full bg-red-500" />
                  <Link
                    to="/plans"
                    className="font-semibold text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                  >
                    Plan expires in {daysLeft} days (
                    {expiryDate && formatDateAsNumber(expiryDate)})
                  </Link>
                  <button
                    type="button"
                    onClick={() => setShowExpiryNotice(false)}
                    className="ml-1 flex h-4 w-4 items-center justify-center rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                  >
                    <X className="h-3 w-3 text-slate-400" />
                  </button>
                </div>
              </ComponentGuard>
            )}
          </div>
        </div>
      )}



      {!isMdUp && isSidebarOpen ? (
        <button
          type="button"
          aria-label="Close menu overlay"
          className="fixed inset-0 top-16 z-[40] bg-black/50 backdrop-blur-sm"
          onClick={() => dispatch(toggleSidebar())}
        />
      ) : null}

      <style>{`
        .custom-scrollbar-hide::-webkit-scrollbar { display: none; }
        .custom-scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </>
  );
};

export default Header;
