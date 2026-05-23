import React, { useCallback, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { ArrowUpRight, LayoutDashboard, Menu, Moon, Sun, Video, X } from "lucide-react";
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
  const { theme, toggleTheme, isDark } = useTheme();
  const dispatch = useDispatch();
  const roles = useRoles();
  const navigate = useNavigate();
  const location = useLocation();
  const { userData, HEADER_LABEL } = useSelector((state) => state.auth);
  const { employeeModeData } = useSelector((state) => state.employee);
  const { isSidebarOpen, activeHeaderSection } = useSelector((state) => state.globalData);
  const isMdUp = useMediaQuery("(min-width: 768px)");

  const { showWarning, daysLeft, expiryDate } = usePlanExpiryWarning(15);


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

  const previousDashboardUrl =
    import.meta.env.VITE_REACT_APP_DASHBOARD_BASE_URL?.trim() || "";
  const showPreviousDashboardLink = (() => {
    if (!previousDashboardUrl) return false;
    try {
      const target = new URL(previousDashboardUrl, window.location.href);
      const current = new URL(window.location.href);
      return (
        target.origin !== current.origin ||
        target.pathname !== current.pathname ||
        target.search !== current.search
      );
    } catch {
      return false;
    }
  })();

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
          <div className="flex min-w-0 flex-shrink-0 items-center gap-1 sm:gap-2 lg:gap-4">
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

          <div className="custom-scrollbar-hide flex min-w-0 flex-shrink flex-1 items-center justify-center gap-1 overflow-x-auto px-2 py-3 sm:gap-2 md:gap-4 -mx-2 -my-3">
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

          <div className="flex flex-shrink-0 items-center gap-1.5 sm:gap-2 lg:gap-3">
            {showPreviousDashboardLink ? (
              <a
                href={previousDashboardUrl}
                title="Open previous dashboard UI"
                className="flex items-center gap-1 rounded-lg border px-2 py-1.5 text-xs font-medium transition-colors hover:opacity-90 sm:gap-1.5 sm:px-2.5 sm:text-sm"
                style={{
                  backgroundColor: isDark ? "#1e293b" : "#f9fafb",
                  borderColor: isDark ? "#334155" : "#e5e7eb",
                  color: isDark ? "#e2e8f0" : "#334155",
                }}
              >
                <ArrowUpRight className="h-4 w-4 shrink-0" aria-hidden />
                <span className="hidden whitespace-nowrap sm:inline">
                  Classic dashboard
                </span>
                <span className="whitespace-nowrap sm:hidden">Classic</span>
              </a>
            ) : null}
            <button
              type="button"
              onClick={toggleTheme}
              title={
                theme === "light" ? "Switch to dark mode" : "Switch to light mode"
              }
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

            <div className="flex items-center gap-0.5 sm:gap-1">
              <ComponentGuard allowedRoles={[roles.ADMIN, roles.SUPER_ADMIN]}>
                <ImportExportNotifications userData={userData} roles={roles} />
              </ComponentGuard>
              <NotificationBell
                important={true}
                userData={userData}
                roles={roles}
              />
              <NotificationBell
                important={false}
                userData={userData}
                roles={roles}
              />
              <button
                type="button"
                className="group ml-1 flex items-center gap-2 rounded-xl p-1 transition-all duration-300 hover:shadow-md sm:ml-2 sm:gap-3 sm:pr-3"
                style={{
                  backgroundColor: isDark ? "#1e293b" : "#f9fafb",
                  border: isDark ? "1px solid #334155" : "1px solid #e5e7eb",
                }}
                onClick={handleProfileClick}
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
                </div>
              </button>
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
