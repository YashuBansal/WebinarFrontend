import React, { useCallback, useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Pin,
  PinOff,
  X,
  Coins,
} from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { motion, AnimatePresence } from "framer-motion";
import { logout } from "../../../features/slices/auth";
import { getAllSidebarLinks } from "../../../features/actions/sidebarLink";
import { getNoticeBoard } from "../../../features/actions/noticeBoard";
import useRoles from "../../../hooks/useRoles";
import useAddUserActivity from "../../../hooks/useAddUserActivity";
import { clearNotifications } from "../../../features/slices/notification";
import { clearWebinarData } from "../../../features/slices/webinarContact";
import { useQueryClient } from "@tanstack/react-query";
import {
  getGSTValue,
  logOutAndClearCookies,
} from "../../../features/actions/auth";
import { getLeadType } from "../../../features/actions/assign";
import { getEmployeeWebinars } from "../../../features/actions/webinarContact";
import tagsService from "../../../services/tagsService";
import {
  setSidebarOpen,
  setTagsData,
} from "../../../features/slices/globalData";
import useMediaQuery from "../../../hooks/useMediaQuery";
import useUserSubscription from "../../../hooks/useUserSubscription";
import DashboardSidebar from "./DashboardSidebar";
import WhatsAppSidebar from "./WhatsAppSidebar";
import ZoomSidebar from "./ZoomSidebar";
import AffiliateSidebar from "./AffiliateSidebar";
import { useTheme } from "../../../contexts/ThemeContext";
import {
  AssignmentIcon,
  AttendeesIcon,
  BillIcon,
  CalendarIcon,
  DashboardIcon,
  EmployeeIcon,
  NoticeBoardIcon,
  ProductsIcon,
  RupeeIcon,
  WebinarIcon,
  WhatsappIcon,
  ZoomIcon,
} from "./SVGs";

const PANEL_W = 200;

const Sidebar = ({
  toggleButtonRef,
  sidebarCollapsed,
  setSidebarCollapsed,
  isPinned,
  setIsPinned,
}) => {
  const { isDark } = useTheme();
  const dispatch = useDispatch();
  const roles = useRoles();
  const logUserActivity = useAddUserActivity();
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { isUpdated } = useSelector((state) => state.noticeBoard);
  const { sidebarLinkData } = useSelector((state) => state.sidebarLink);
  const { userData } = useSelector((state) => state.auth);
  const { data: subscription } = useUserSubscription();
  const calendarFeatures = subscription?.plan?.calendarFeatures;
  const { isSidebarOpen, activeHeaderSection } = useSelector((state) => state.globalData);
  const [showImportantLinks, setShowImportantLinks] = useState(false);
  const role = userData?.role || "";
  const { employeeModeData } = useSelector((state) => state.employee);
  const { webinarData } = useSelector((state) => state.webinarContact);

  const mobileShellRef = useRef(null);
  const desktopShellRef = useRef(null);
  const railScrollRef = useRef(null);
  const panelScrollRef = useRef(null);

  const isSmallScreen = useMediaQuery("(max-width: 767px)");
  const isMdUp = useMediaQuery("(min-width: 768px)");

  // Theme colors
  const isWhatsApp = activeHeaderSection === "WhatsApp";
  const isZoom = activeHeaderSection === "Zoom";
  const themeColor = isWhatsApp ? "#22c55e" : (isZoom ? "#3b82f6" : "#f97316");
  const themeBgLight = isWhatsApp ? "rgba(34, 197, 94, 0.1)" : (isZoom ? "rgba(59, 130, 246, 0.1)" : "rgba(249, 115, 22, 0.1)");

  // Sync scrolling between rail and panel
  useEffect(() => {
    const rail = railScrollRef.current;
    const panel = panelScrollRef.current;

    if (!rail || !panel) return;

    let isScrollingRail = false;
    let isScrollingPanel = false;

    const handleRailScroll = () => {
      if (isScrollingPanel) return;
      isScrollingRail = true;
      if (panel.scrollTop !== rail.scrollTop) {
        panel.scrollTop = rail.scrollTop;
      }
      setTimeout(() => { isScrollingRail = false; }, 50);
    };

    const handlePanelScroll = () => {
      if (isScrollingRail) return;
      isScrollingPanel = true;
      if (rail.scrollTop !== panel.scrollTop) {
        rail.scrollTop = panel.scrollTop;
      }
      setTimeout(() => { isScrollingPanel = false; }, 50);
    };

    rail.addEventListener("scroll", handleRailScroll, { passive: true });
    panel.addEventListener("scroll", handlePanelScroll, { passive: true });

    return () => {
      rail.removeEventListener("scroll", handleRailScroll);
      panel.removeEventListener("scroll", handlePanelScroll);
    };
  }, [activeHeaderSection, railScrollRef.current, panelScrollRef.current]);

  useEffect(() => {
    if (isSmallScreen) {
      dispatch(setSidebarOpen(false));
    } else {
      dispatch(setSidebarOpen(true));
    }
  }, [isSmallScreen, dispatch]);

  useEffect(() => {
    tagsService.getTags().then((res) => {
      if (res.success) {
        dispatch(setTagsData(res.data));
      }
    });
    return () => {
      dispatch(setTagsData());
    };
  }, [dispatch]);

  useEffect(() => {
    if (role === roles.EMPLOYEE_REMINDER || role === roles.EMPLOYEE_SALES) {
      dispatch(getEmployeeWebinars({}));
    }
  }, [roles, role]);
  const navItems = [
    {
      roles: [roles.SUPER_ADMIN],
      items: [
        {
          path: "/clients?page=1",
          label: "Clients",
          icon: <img src={EmployeeIcon} width={30} height={30} alt="Clients" />,
          children: ["view-client", "add-client", "client/plan/"],
        },
        {
          path: "/revenue",
          label: "Revenue",
          icon: <img src={RupeeIcon} width={30} height={30} alt="Revenue" />,
        },
        {
          path: "/client-billing",
          label: "Billing History",
          icon: <img src={BillIcon} width={30} height={30} alt="Revenue" />,
        },
        {
          path: "/message-counts",
          label: "Message Counts",
          icon: <img src={WhatsappIcon} width={30} height={30} alt="Message Counts" />,
        },
        {
          path: "/unique-email-counts",
          label: "Unique Email Counts",
          icon: (
            <img src={WhatsappIcon} width={30} height={30} alt="Unique Email Counts" />
          ),
        },
      ],
    },
    {
      roles: [roles.ADMIN],
      items: employeeModeData
        ? [
            {
              path: `/employee/dashboard/${employeeModeData?._id}`,
              label: "Dashboard",
              icon: (
                <img
                  src={DashboardIcon}
                  width={30}
                  height={30}
                  alt="Dashboard"
                />
              ),
            },
            {
              path: `/employee/assignments/${employeeModeData?._id}`,
              label: "Assignments",
              icon: (
                <img
                  src={AssignmentIcon}
                  width={30}
                  height={30}
                  alt="Assignment"
                />
              ),
            },
          ]
        : [
            {
              path: "/webinars?page=1",
              label: "Webinars",
              icon: (
                <img src={WebinarIcon} width={30} height={30} alt="Webinar" />
              ),
              children: ["webinarDetails", "assignment-metrics"],
            },
            {
              path: "/attendees?page=1",
              label: "Attendees",
              icon: (
                <img
                  src={AttendeesIcon}
                  width={30}
                  height={30}
                  alt="Attendees"
                />
              ),
              children: ["particularContact"],
            },
            {
              path: "/employees?page=1",
              label: "Employees",
              icon: (
                <img src={EmployeeIcon} width={30} height={30} alt="Employee" />
              ),
              children: ["employees", "employee", "createEmployee"],
            },
            {
              path:
                import.meta.env.VITE_REACT_APP_WHATSAPP_URL ||
                "https://msg.ajaybansal.com",
              label: "Whatsapp",
              external: true,
              icon: (
                <img src={WhatsappIcon} width={30} height={30} alt="Employee" />
              ),
              children: [],
            },
            {
              path:
                import.meta.env.VITE_REACT_APP_ZOOM_URL ||
                "https://livezoom.ajaybansal.com",
              label: "Zoom",
              external: true,
              icon: (
                <img src={ZoomIcon} width={30} height={30} alt="Employee" />
              ),
              children: [],
            },
            {
              path: "/interest-pool",
              label: "Interest Pool",
              icon: (
                <img
                  src={AssignmentIcon}
                  width={30}
                  height={30}
                  alt="Interest Pool"
                />
              ),
              children: [],
            },
          ],
    },
    {
      roles: [roles.EMPLOYEE_SALES, roles.EMPLOYEE_REMINDER],
      items: [
        {
          path: `/assignments?page=1&webinarId=${
            Array.isArray(webinarData) && webinarData.length > 0
              ? webinarData[0]._id
              : ""
          }&tabValue=active&activity=Pending`,
          label: "Assignments",
          icon: (
            <img src={AssignmentIcon} width={30} height={30} alt="Assignment" />
          ),
          children: ["assignments", "assignment-metrics"],
        },
      ],
    },
    {
      roles: [roles.EMPLOYEE_SALES, roles.EMPLOYEE_REMINDER, roles.ADMIN],
      items: [
        ...(calendarFeatures
          ? [
              {
                path: "/calendar",
                label: "Calendar",
                icon: (
                  <img
                    src={CalendarIcon}
                    width={30}
                    height={30}
                    alt="Calendar"
                  />
                ),
              },
            ]
          : []),
        {
          path: "/products?page=1",
          label: "Products",
          icon: (
            <img src={ProductsIcon} width={30} height={30} alt="Products" />
          ),
          children: ["products"],
        },

        {
          path: "/notice-board",
          label: "Notice Board",
          icon: (
            <img
              src={NoticeBoardIcon}
              width={30}
              height={30}
              alt="Notice Board"
            />
          ),
          children: ["notice-board"],
        },
      ],
    },
  ];

  const handleLogout = () => {
    logUserActivity({
      action: "logout",
      details: "User logged out successfully",
    });

    // Clear the global TanStack Query cache to prevent data leakage
    queryClient.clear();

    dispatch(clearWebinarData());
    dispatch(clearNotifications());
    dispatch(logout());
    dispatch(logOutAndClearCookies()).then(() => {
      const broadcastChannel = new BroadcastChannel("auth-saas-crm");
      broadcastChannel.postMessage({ type: "LOGOUT" });
      broadcastChannel.close();
    });
  };

  const toggleImportantLinks = () => {
    setShowImportantLinks((prev) => !prev);
  };

  const handleNavigation = (link) => {
    addUserActivityLog(link, "page");
    closeSidebar();
  };

  const addUserActivityLog = (link, type) => {
    logUserActivity({
      action: "navigate",
      detailItem: link,
      navigateType: type,
    });
  };

  const fetchNoticeBoard = useCallback(() => {
    if (roles.getRoleNameById(userData?.role) === "EMPLOYEE SALES") {
      dispatch(getNoticeBoard("sales"));
    } else if (roles.getRoleNameById(userData?.role) === "EMPLOYEE REMINDER") {
      dispatch(getNoticeBoard("reminder"));
    }
  }, [dispatch, userData, roles]);

  const closeSidebar = useCallback(() => {
    if (isSmallScreen) {
      dispatch(setSidebarOpen(false));
    }
  }, [isSmallScreen, dispatch]);

  useEffect(() => {
    if (userData) {
      dispatch(getAllSidebarLinks());
      dispatch(getLeadType());
      fetchNoticeBoard();
      dispatch(getGSTValue());
    }
    return () => {
      dispatch(clearWebinarData());
    };
  }, []);

  const isActiveRoute = (item) => {
    if (!item?.path) return false;
    if (location.pathname === item.path.split("?")[0]) return true;
    if (Array.isArray(item.children)) {
      return item.children.some((child) =>
        location.pathname.startsWith(`/${child}`)
      );
    }
    return false;
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      const inMobile = mobileShellRef.current?.contains(event.target);
      const inDesktop = desktopShellRef.current?.contains(event.target);
      const inToggle =
        toggleButtonRef?.current && toggleButtonRef.current.contains(event.target);
      if (
        isSmallScreen &&
        isSidebarOpen &&
        !inMobile &&
        !inDesktop &&
        !inToggle
      ) {
        dispatch(setSidebarOpen(false));
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isSmallScreen, isSidebarOpen, dispatch, toggleButtonRef]);

  const settingsActive = isActiveRoute({
    path: "settings",
    children: [
      "plans",
      "addons",
      "api-docs",
      "settings",
      "sidebarLinks",
      "update-landing-page",
      "product-level",
      "lead-type",
      "billing-history",
      "tags",
      "locations",
    ],
  });

  const dashboardPathActive = location.pathname === "/";

  const enterDesktopSidebar = () => {
    if (!isPinned) setSidebarCollapsed(false);
  };
  const leaveDesktopSidebar = () => {
    if (!isPinned) setSidebarCollapsed(true);
  };

  const togglePin = () => {
    setIsPinned((p) => {
      const next = !p;
      if (!next) setSidebarCollapsed(true);
      else setSidebarCollapsed(false);
      return next;
    });
  };

  const renderContextualSidebar = (variant, section) => {
    if (location.pathname.startsWith("/affiliate")) {
      return (
        <AffiliateSidebar
          variant={variant}
          section={section}
          handleNavigation={handleNavigation}
        />
      );
    }

    if (activeHeaderSection === "WhatsApp") {
      return (
        <WhatsAppSidebar
          variant={variant}
          section={section}
          handleNavigation={handleNavigation}
        />
      );
    }

    if (activeHeaderSection === "Zoom") {
      return (
        <ZoomSidebar
          variant={variant}
          section={section}
          handleNavigation={handleNavigation}
        />
      );
    }

    if (section && section !== "middle") return null;

    return (
      <DashboardSidebar
        variant={variant}
        role={role}
        roles={roles}
        employeeModeData={employeeModeData}
        webinarData={webinarData}
        isUpdated={isUpdated}
        sidebarLinkData={sidebarLinkData}
        showImportantLinks={showImportantLinks}
        toggleImportantLinks={toggleImportantLinks}
        handleNavigation={handleNavigation}
        handleLogout={handleLogout}
        isActiveRoute={isActiveRoute}
        settingsActive={settingsActive}
        dashboardPathActive={dashboardPathActive}
      />
    );
  };

  const renderSidebarFooter = (variant) => {
    if (location.pathname.startsWith("/affiliate")) {
      return null;
    }

    if (variant === "rail") {
      const footerHeight = panelOpen ? "h-[96px]" : "h-[64px]";
      return (
        <div className={`flex items-center justify-center py-3 border-t border-slate-100 dark:border-slate-800/80 bg-white dark:bg-slate-900 ${footerHeight} transition-all duration-[400ms] ease-[cubic-bezier(0.4,0,0.2,1)]`}>
          <Link
            to="/affiliate/getstarted"
            onClick={() => handleNavigation("/affiliate/getstarted")}
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-red-700 to-rose-900 shadow-md shadow-red-900/30 text-white hover:scale-105 transition-all"
            title="Earn with Us"
          >
            <Coins className="h-5 w-5" />
          </Link>
        </div>
      );
    }

    if (variant === "panel") {
      return (
        <div className="border-t border-slate-100 dark:border-slate-800/80 bg-white dark:bg-slate-900 h-[96px] flex flex-col justify-center overflow-hidden">
          <div className="w-[200px] px-3.5 flex flex-col justify-center gap-1.5 shrink-0">
            <Link
              to="/affiliate/getstarted"
              onClick={() => handleNavigation("/affiliate/getstarted")}
              className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-red-700 to-rose-900 px-3 py-2 text-xs font-black uppercase tracking-wider text-white shadow-md shadow-red-900/30 transition-all hover:scale-[1.02] hover:shadow-lg hover:shadow-red-900/40"
              style={{ fontFamily: "Inter, sans-serif" }}
            >
              <Coins className="h-3.5 w-3.5" />
              <span>Earn with Us</span>
            </Link>
            <p className="text-[10px] text-center font-semibold text-slate-500 dark:text-slate-400 leading-tight">
              Refer WLH and earn recurring 20% commission on each sale.
            </p>
          </div>
        </div>
      );
    }

    return (
      <div className="px-3.5 py-3 border-t border-slate-100 dark:border-slate-800/80 bg-white dark:bg-slate-900 h-[96px] flex flex-col justify-center gap-1.5">
        <Link
          to="/affiliate/getstarted"
          onClick={() => handleNavigation("/affiliate/getstarted")}
          className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-red-700 to-rose-900 px-3 py-2 text-xs font-black uppercase tracking-wider text-white shadow-md shadow-red-900/30 transition-all hover:scale-[1.02] hover:shadow-lg hover:shadow-red-900/40"
          style={{ fontFamily: "Inter, sans-serif" }}
        >
          <Coins className="h-3.5 w-3.5" />
          <span>Earn with Us</span>
        </Link>
        <p className="text-[10px] text-center font-semibold text-slate-500 dark:text-slate-400 leading-tight">
          Refer WLH and earn recurring 20% commission on each sale.
        </p>
      </div>
    );
  };

  if (!userData) {
    navigate("/login");
    return null;
  }

  const panelOpen = !sidebarCollapsed || isPinned;
  const mobileOpen = !isMdUp && isSidebarOpen;

  const mobileShell = (
    <div
      className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col bg-white dark:bg-slate-900 border-r dark:border-slate-800 shadow-2xl transition-all duration-300 ease-in-out md:hidden ${mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      ref={mobileShellRef}
    >
      <div className="flex h-16 items-center justify-between border-b dark:border-slate-800 px-4">
        <div className="flex items-center gap-2">
          <img src="/wlh-logo.png" alt="Logo" className="h-8 w-8" />
          <span className="font-bold text-slate-800 dark:text-slate-100">WLH Dashboard</span>
        </div>
        <button
          onClick={() => dispatch(setSidebarOpen(false))}
          className="rounded-lg p-1 hover:bg-slate-100 dark:hover:bg-slate-800"
        >
          <X className="h-6 w-6 text-slate-500 dark:text-slate-400" />
        </button>
      </div>
      <div className="flex-1 overflow-hidden flex flex-col relative">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeHeaderSection}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            transition={{ duration: 0.2 }}
            className="flex-1 flex flex-col overflow-hidden"
          >
            {activeHeaderSection === "WhatsApp" || activeHeaderSection === "Zoom" || location.pathname.startsWith("/affiliate") ? (
              <div className="flex flex-1 flex-col overflow-hidden">
                {renderContextualSidebar("mobile", "top")}
                <div className="flex-1 overflow-y-auto py-2 custom-scrollbar">
                  <ul className="space-y-2 px-3">{renderContextualSidebar("mobile", "middle")}</ul>
                </div>
                {renderSidebarFooter("mobile")}
              </div>
            ) : (
              <div className="flex flex-1 flex-col overflow-hidden">
                <div className="flex-1 overflow-y-auto py-2 custom-scrollbar">
                  <ul className="space-y-2 px-3">{renderContextualSidebar("mobile")}</ul>
                </div>
                {renderSidebarFooter("mobile")}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );

  const railAside = (
    <aside
      className="flex h-full w-[80px] flex-col border-r border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm transition-colors duration-300"
      onMouseEnter={enterDesktopSidebar}
      onMouseLeave={leaveDesktopSidebar}
    >
      <div className="border-b border-gray-200 dark:border-slate-800 px-3 pb-2 pt-3">
        <button
          type="button"
          onClick={togglePin}
          className="flex w-full items-center justify-center rounded-lg py-2.5 transition-colors"
          style={{
            backgroundColor: isPinned ? themeBgLight : "transparent",
          }}
          title={isPinned ? "Unpin sidebar" : "Pin sidebar"}
        >
          {isPinned ? (
            <Pin className="h-5 w-5" style={{ color: themeColor, fill: themeColor }} />
          ) : (
            <PinOff className="h-5 w-5 text-slate-500" strokeWidth={2} />
          )}
        </button>
      </div>
      <div className="flex-1 overflow-hidden flex flex-col relative">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeHeaderSection}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="flex-1 flex flex-col overflow-hidden"
          >
            {activeHeaderSection === "WhatsApp" || activeHeaderSection === "Zoom" || location.pathname.startsWith("/affiliate") ? (
              <div className="flex flex-1 flex-col overflow-hidden">
                {renderContextualSidebar("rail", "top")}
                <div className="flex-1 overflow-y-auto py-2 no-scrollbar" ref={railScrollRef}>
                  <ul className="space-y-2 px-3">{renderContextualSidebar("rail", "middle")}</ul>
                </div>
                {renderSidebarFooter("rail")}
              </div>
            ) : (
              <div className="flex flex-1 flex-col overflow-hidden">
                <div className="flex-1 overflow-y-auto py-2 no-scrollbar" ref={railScrollRef}>
                  <ul className="space-y-2 px-3">{renderContextualSidebar("rail")}</ul>
                </div>
                {renderSidebarFooter("rail")}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </aside>
  );

  const labelsAside = (
    <aside
      className="flex h-full flex-col overflow-hidden border-r border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm transition-all duration-[400ms] ease-[cubic-bezier(0.4,0,0.2,1)]"
      style={{
        width: panelOpen ? PANEL_W : 0,
        opacity: panelOpen ? 1 : 0,
      }}
      onMouseEnter={enterDesktopSidebar}
      onMouseLeave={leaveDesktopSidebar}
    >
      <div className="border-b border-gray-200 dark:border-slate-800 px-3 pb-2 pt-3">
        <button
          type="button"
          onClick={togglePin}
          className="flex w-full items-center gap-2 rounded-lg px-2 py-2.5 text-left hover:bg-black/[0.04]"
        >
          <span
            className="text-sm font-medium"
            style={{
              color: isPinned ? themeColor : (isDark ? "#cbd5e1" : "#1e293b"),
              fontFamily: "Inter, sans-serif",
            }}
          >
            {isPinned ? "Pinned" : "Pin Sidebar"}
          </span>
        </button>
      </div>
      <div className="flex-1 overflow-hidden flex flex-col relative">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeHeaderSection}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.2 }}
            className="flex-1 flex flex-col overflow-hidden"
          >
            {activeHeaderSection === "WhatsApp" || activeHeaderSection === "Zoom" || location.pathname.startsWith("/affiliate") ? (
              <div className="flex flex-1 flex-col overflow-hidden">
                {renderContextualSidebar("panel", "top")}
                <div className="flex-1 overflow-y-auto py-2 custom-scrollbar" ref={panelScrollRef}>
                  <ul className="space-y-2 px-3">{renderContextualSidebar("panel", "middle")}</ul>
                </div>
                {renderSidebarFooter("panel")}
              </div>
            ) : (
              <div className="flex flex-1 flex-col overflow-hidden">
                <div className="flex-1 overflow-y-auto py-2 custom-scrollbar" ref={panelScrollRef}>
                  <ul className="space-y-2 px-3">{renderContextualSidebar("panel")}</ul>
                </div>
                {renderSidebarFooter("panel")}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </aside>
  );

  return (
    <>
      {mobileShell}
      <div
        className="fixed bottom-0 left-0 z-40 hidden md:flex"
        style={{ top: "var(--header-height, 64px)" }}
        ref={desktopShellRef}
      >
        {railAside}
        {labelsAside}
      </div>
    </>
  );
};

export default Sidebar;
