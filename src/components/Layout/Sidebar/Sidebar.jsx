import React, { useCallback, useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Presentation,
  UserCheck,
  UserCog,
  CalendarDays,
  Package,
  ClipboardList,
  Link2,
  Settings,
  LogOut,
  Pin,
  PinOff,
  ChevronDown,
  Building2,
  CircleDollarSign,
  Receipt,
  MessagesSquare,
  Target,
  Megaphone,
} from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { logout } from "../../../features/slices/auth";
import { getAllSidebarLinks } from "../../../features/actions/sidebarLink";
import { getNoticeBoard } from "../../../features/actions/noticeBoard";
import useRoles from "../../../hooks/useRoles";
import useAddUserActivity from "../../../hooks/useAddUserActivity";
import ComponentGuard from "../../AccessControl/ComponentGuard";
import { clearNotifications } from "../../../features/slices/notification";
import { clearWebinarData } from "../../../features/slices/webinarContact";
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

const PANEL_W = 200;

function NavGlyph({ Icon, active, theme = "light" }) {
  const inactive =
    theme === "dark" ? "#94a3b8" : "#64748b";
  return (
    <Icon
      className="h-5 w-5 shrink-0"
      strokeWidth={2}
      style={{ color: active ? "#f97316" : inactive }}
    />
  );
}

const Sidebar = ({
  toggleButtonRef,
  sidebarCollapsed,
  setSidebarCollapsed,
  isPinned,
  setIsPinned,
}) => {
  const dispatch = useDispatch();
  const roles = useRoles();
  const logUserActivity = useAddUserActivity();
  const location = useLocation();
  const navigate = useNavigate();

  const { isUpdated } = useSelector((state) => state.noticeBoard);
  const { sidebarLinkData } = useSelector((state) => state.sidebarLink);
  const { userData } = useSelector((state) => state.auth);
  const { data: subscription } = useUserSubscription();
  const calendarFeatures = subscription?.plan?.calendarFeatures;
  const { isSidebarOpen } = useSelector((state) => state.globalData);
  const [showImportantLinks, setShowImportantLinks] = useState(false);
  const role = userData?.role || "";
  const { employeeModeData } = useSelector((state) => state.employee);
  const { webinarData } = useSelector((state) => state.webinarContact);

  const mobileShellRef = useRef(null);
  const desktopShellRef = useRef(null);

  const isSmallScreen = useMediaQuery("(max-width: 767px)");
  const isMdUp = useMediaQuery("(min-width: 768px)");

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
  }, [roles, role, dispatch]);

  const navItems = [
    {
      roles: [roles.SUPER_ADMIN],
      items: [
        {
          path: "/clients?page=1",
          label: "Clients",
          Icon: Building2,
          children: ["view-client", "add-client", "client/plan/"],
        },
        {
          path: "/revenue",
          label: "Revenue",
          Icon: CircleDollarSign,
        },
        {
          path: "/client-billing",
          label: "Billing History",
          Icon: Receipt,
        },
        {
          path: "/message-counts",
          label: "Message Counts",
          Icon: MessagesSquare,
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
              Icon: LayoutDashboard,
            },
            {
              path: `/employee/assignments/${employeeModeData?._id}`,
              label: "Assignments",
              Icon: ClipboardList,
            },
          ]
        : [
            {
              path: "/webinars?page=1",
              label: "Webinars",
              Icon: Presentation,
              children: ["webinarDetails", "assignment-metrics"],
            },
            {
              path: "/attendees?page=1",
              label: "Attendees",
              Icon: UserCheck,
              children: ["particularContact"],
            },
            {
              path: "/employees?page=1",
              label: "Employees",
              Icon: UserCog,
              children: ["employees", "employee", "createEmployee"],
            },
            {
              path: "/interest-pool",
              label: "Interest Pool",
              Icon: Target,
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
          Icon: ClipboardList,
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
                Icon: CalendarDays,
              },
            ]
          : []),
        {
          path: "/products?page=1",
          label: "Products",
          Icon: Package,
          children: ["products"],
        },
        {
          path: "/notice-board",
          label: "Notice Board",
          Icon: Megaphone,
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

  const renderNavRows = (variant) => {
    const rows = [];
    const pushRow = (key, node) => {
      if (node != null) {
        rows.push(<React.Fragment key={key}>{node}</React.Fragment>);
      }
    };

    if (variant === "mobile" && !employeeModeData) {
      pushRow(
        "dash",
        <li key="m-dash">
          <Link
            to="/"
            onClick={() => handleNavigation("/dashboard")}
            className={`flex items-center gap-3 rounded-xl px-3 py-2.5 font-medium transition-colors ${
              dashboardPathActive
                ? "bg-orange-50 text-orange-600"
                : "text-gray-700 hover:bg-gray-50"
            }`}
          >
            <NavGlyph Icon={LayoutDashboard} active={dashboardPathActive} />
            <span>Dashboard</span>
          </Link>
        </li>
      );
    }

    navItems.forEach((navGroup, index) => {
      if (!navGroup.roles.includes(role)) return;
      navGroup.items.forEach((item, idx) => {
        const active = isActiveRoute(item);
        const k = `${index}-${idx}`;
        const Icon = item.Icon;

        if (variant === "mobile") {
          pushRow(
            k,
            <li key={`m-${k}`}>
              {item.external ? (
                <a
                  href={item.path}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => handleNavigation(item.path)}
                  className={`flex items-center gap-3 rounded-xl px-3 py-2.5 font-medium transition-colors ${
                    active
                      ? "bg-orange-50 text-orange-600"
                      : "text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  <NavGlyph Icon={Icon} active={active} />
                  <span className="flex flex-wrap items-center gap-2">
                    {item.label}
                    {item.label === "Notice Board" &&
                      isUpdated &&
                      roles.isEmployeeId(role) && (
                        <span className="inline-flex items-center rounded-full bg-rose-100 px-2 py-0.5 text-xs font-medium text-rose-800">
                          New
                        </span>
                      )}
                  </span>
                </a>
              ) : (
                <Link
                  to={item.path}
                  onClick={() => handleNavigation(item.path)}
                  className={`flex items-center gap-3 rounded-xl px-3 py-2.5 font-medium transition-colors ${
                    active
                      ? "bg-orange-50 text-orange-600"
                      : "text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  <NavGlyph Icon={Icon} active={active} />
                  <span className="flex flex-wrap items-center gap-2">
                    {item.label}
                    {item.label === "Notice Board" &&
                      isUpdated &&
                      roles.isEmployeeId(role) && (
                        <span className="inline-flex items-center rounded-full bg-rose-100 px-2 py-0.5 text-xs font-medium text-rose-800">
                          New
                        </span>
                      )}
                  </span>
                </Link>
              )}
            </li>
          );
        }

        if (variant === "rail") {
          pushRow(
            `rail-${k}`,
            <li key={`r-${k}`}>
              {item.external ? (
                <a
                  href={item.path}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => handleNavigation(item.path)}
                  className={`relative flex w-full items-center justify-center rounded-lg py-2.5 transition-colors hover:bg-black/[0.04] ${
                    active ? "bg-orange-500/10" : ""
                  }`}
                >
                  {active && (
                    <div className="absolute bottom-0 left-0 top-0 w-[3px] rounded-r-sm bg-orange-500" />
                  )}
                  <NavGlyph Icon={Icon} active={active} />
                </a>
              ) : (
                <Link
                  to={item.path}
                  onClick={() => handleNavigation(item.path)}
                  className={`relative flex w-full items-center justify-center rounded-lg py-2.5 transition-colors hover:bg-black/[0.04] ${
                    active ? "bg-orange-500/10" : ""
                  }`}
                >
                  {active && (
                    <div className="absolute bottom-0 left-0 top-0 w-[3px] rounded-r-sm bg-orange-500" />
                  )}
                  <NavGlyph Icon={Icon} active={active} />
                </Link>
              )}
            </li>
          );
        }

        if (variant === "panel") {
          pushRow(
            `panel-${k}`,
            <li key={`p-${k}`}>
              {item.external ? (
                <a
                  href={item.path}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => handleNavigation(item.path)}
                  className="flex w-full items-center rounded-lg px-2 py-2.5 text-left text-sm font-medium text-slate-800 hover:bg-black/[0.04]"
                  style={{ fontFamily: "Inter, sans-serif" }}
                >
                  <span className="flex flex-wrap items-center gap-2">
                    {item.label}
                    {item.label === "Notice Board" &&
                      isUpdated &&
                      roles.isEmployeeId(role) && (
                        <span className="inline-flex items-center rounded-full bg-rose-100 px-2 py-0.5 text-xs font-medium text-rose-800">
                          New
                        </span>
                      )}
                  </span>
                </a>
              ) : (
                <Link
                  to={item.path}
                  onClick={() => handleNavigation(item.path)}
                  className={`flex w-full items-center rounded-lg px-2 py-2.5 text-left text-sm font-medium hover:bg-black/[0.04] ${
                    active ? "text-orange-600" : "text-slate-800"
                  }`}
                  style={{ fontFamily: "Inter, sans-serif" }}
                >
                  <span className="flex flex-wrap items-center gap-2">
                    {item.label}
                    {item.label === "Notice Board" &&
                      isUpdated &&
                      roles.isEmployeeId(role) && (
                        <span className="inline-flex items-center rounded-full bg-rose-100 px-2 py-0.5 text-xs font-medium text-rose-800">
                          New
                        </span>
                      )}
                  </span>
                </Link>
              )}
            </li>
          );
        }
      });
    });

    if (variant === "mobile") {
      pushRow(
        "important",
        <li key="m-imp-wrap">
          <button
            type="button"
            onClick={toggleImportantLinks}
            className="flex w-full items-center justify-between gap-2 rounded-xl px-3 py-2.5 text-left font-medium text-gray-700 hover:bg-gray-50"
          >
            <span className="flex items-center gap-3">
              <Link2 className="h-5 w-5 text-slate-500" strokeWidth={2} />
              Important Links
            </span>
            <ChevronDown
              className={`h-4 w-4 shrink-0 text-slate-500 transition-transform ${
                showImportantLinks ? "rotate-180" : ""
              }`}
              strokeWidth={2}
            />
          </button>
          {showImportantLinks &&
            Array.isArray(sidebarLinkData) &&
            sidebarLinkData.map((imp, i) => (
              <ul key={`m-imp-${i}`} className="mt-1 space-y-1 pl-4">
                <li>
                  <a
                    href={imp?.link}
                    onClick={() => {
                      addUserActivityLog(imp.title, "important link");
                      closeSidebar();
                    }}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block rounded-lg px-3 py-2 text-sm text-gray-600 hover:bg-gray-100"
                  >
                    {imp.title}
                  </a>
                </li>
              </ul>
            ))}
        </li>
      );
    }

    if (variant === "rail") {
      pushRow(
        "rail-important",
        <li key="r-imp">
          <button
            type="button"
            onClick={toggleImportantLinks}
            className="flex w-full items-center justify-center rounded-lg py-2.5 hover:bg-black/[0.04]"
          >
            <Link2 className="h-5 w-5 text-slate-500" strokeWidth={2} />
          </button>
        </li>
      );
      pushRow(
        "rail-settings",
        <ComponentGuard
          key="r-set"
          allowedRoles={[roles.ADMIN, roles.SUPER_ADMIN]}
          conditions={[employeeModeData ? false : true]}
        >
          <li>
            <Link
              to="/settings"
              onClick={() => handleNavigation("/settings")}
              className={`relative flex w-full items-center justify-center rounded-lg py-2.5 hover:bg-black/[0.04] ${
                settingsActive ? "bg-orange-500/10" : ""
              }`}
            >
              {settingsActive && (
                <div className="absolute bottom-0 left-0 top-0 w-[3px] rounded-r-sm bg-orange-500" />
              )}
              <NavGlyph Icon={Settings} active={settingsActive} />
            </Link>
          </li>
        </ComponentGuard>
      );
      pushRow(
        "rail-logout",
        <li key="r-out">
          <button
            type="button"
            onClick={handleLogout}
            className="group flex w-full items-center justify-center rounded-lg py-2.5 hover:bg-red-50"
            title="Sign out"
          >
            <LogOut
              className="h-5 w-5 text-slate-500 group-hover:text-red-500"
              strokeWidth={2}
            />
          </button>
        </li>
      );
    }

    if (variant === "panel") {
      pushRow(
        "panel-important",
        <li key="p-imp">
          <button
            type="button"
            onClick={toggleImportantLinks}
            className="flex w-full items-center justify-between rounded-lg px-2 py-2.5 text-left text-sm font-medium text-slate-800 hover:bg-black/[0.04]"
            style={{ fontFamily: "Inter, sans-serif" }}
          >
            Important Links
            <ChevronDown
              className={`h-4 w-4 shrink-0 text-slate-500 transition-transform ${
                showImportantLinks ? "rotate-180" : ""
              }`}
              strokeWidth={2}
            />
          </button>
          {showImportantLinks &&
            Array.isArray(sidebarLinkData) &&
            sidebarLinkData.map((imp, i) => (
              <ul key={`p-imp-${i}`} className="space-y-1 pl-2">
                <li>
                  <a
                    href={imp?.link}
                    onClick={() => {
                      addUserActivityLog(imp.title, "important link");
                      closeSidebar();
                    }}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block rounded-lg px-2 py-1.5 text-sm text-slate-600 hover:bg-black/[0.04]"
                  >
                    {imp.title}
                  </a>
                </li>
              </ul>
            ))}
        </li>
      );
      pushRow(
        "panel-settings",
        <ComponentGuard
          key="p-set"
          allowedRoles={[roles.ADMIN, roles.SUPER_ADMIN]}
          conditions={[employeeModeData ? false : true]}
        >
          <li>
            <Link
              to="/settings"
              onClick={() => handleNavigation("/settings")}
              className={`flex w-full items-center rounded-lg px-2 py-2.5 text-left text-sm font-medium hover:bg-black/[0.04] ${
                settingsActive ? "text-orange-600" : "text-slate-800"
              }`}
              style={{ fontFamily: "Inter, sans-serif" }}
            >
              Settings
            </Link>
          </li>
        </ComponentGuard>
      );
      pushRow(
        "panel-logout",
        <li key="p-out">
          <button
            type="button"
            onClick={handleLogout}
            className="group flex w-full items-center rounded-lg px-2 py-2.5 text-left text-sm font-medium text-slate-800 hover:bg-red-50 hover:text-red-600"
            style={{ fontFamily: "Inter, sans-serif" }}
          >
            Sign Out
          </button>
        </li>
      );
    }

    if (variant === "mobile") {
      pushRow(
        "m-settings",
        <ComponentGuard
          key="m-set"
          allowedRoles={[roles.ADMIN, roles.SUPER_ADMIN]}
          conditions={[employeeModeData ? false : true]}
        >
          <li>
            <Link
              to="/settings"
              onClick={() => handleNavigation("/settings")}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 font-medium transition-colors ${
                settingsActive
                  ? "bg-orange-50 text-orange-600"
                  : "text-gray-700 hover:bg-gray-50"
              }`}
            >
              <NavGlyph Icon={Settings} active={settingsActive} />
              Settings
            </Link>
          </li>
        </ComponentGuard>
      );
      pushRow(
        "m-out",
        <li key="m-out">
          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left font-medium text-red-600 hover:bg-red-50"
          >
            <LogOut
              className="h-5 w-5 text-slate-500"
              strokeWidth={2}
            />
            Sign Out
          </button>
        </li>
      );
    }

    return rows;
  };

  if (!userData) {
    navigate("/login");
    return null;
  }

  const panelOpen = !sidebarCollapsed || isPinned;
  const mobileOpen = !isMdUp && isSidebarOpen;

  const railAside = (
    <aside
      className="flex h-full w-[80px] flex-col border-r border-gray-200 bg-white shadow-sm"
      onMouseEnter={enterDesktopSidebar}
      onMouseLeave={leaveDesktopSidebar}
    >
      <div className="border-b border-gray-200 px-3 pb-2 pt-3">
        <button
          type="button"
          onClick={togglePin}
          className="flex w-full items-center justify-center rounded-lg py-2.5 transition-colors"
          style={{
            backgroundColor: isPinned ? "rgba(249, 115, 22, 0.1)" : "transparent",
          }}
          title={isPinned ? "Unpin sidebar" : "Pin sidebar"}
        >
          {isPinned ? (
            <Pin className="h-5 w-5 fill-orange-500 text-orange-500" />
          ) : (
            <PinOff className="h-5 w-5 text-slate-500" strokeWidth={2} />
          )}
        </button>
      </div>
      <nav className="flex-1 overflow-y-auto py-4">
        <ul className="space-y-2 px-3">
          {!employeeModeData && (
            <li>
              <Link
                to="/"
                onClick={() => handleNavigation("/dashboard")}
                className={`relative flex w-full items-center justify-center rounded-lg py-2.5 transition-colors hover:bg-black/[0.04] ${
                  dashboardPathActive ? "bg-orange-500/10" : ""
                }`}
              >
                {dashboardPathActive && (
                  <div className="absolute bottom-0 left-0 top-0 w-[3px] rounded-r-sm bg-orange-500" />
                )}
                <NavGlyph
                  Icon={LayoutDashboard}
                  active={dashboardPathActive}
                />
              </Link>
            </li>
          )}
          {renderNavRows("rail")}
        </ul>
      </nav>
    </aside>
  );

  const labelsAside = (
    <aside
      className="flex h-full flex-col overflow-hidden border-r border-gray-200 bg-white shadow-sm transition-[width,opacity] duration-[400ms] ease-[cubic-bezier(0.4,0,0.2,1)]"
      style={{
        width: panelOpen ? PANEL_W : 0,
        opacity: panelOpen ? 1 : 0,
      }}
      onMouseEnter={enterDesktopSidebar}
      onMouseLeave={leaveDesktopSidebar}
    >
      <div className="border-b border-gray-200 px-3 pb-2 pt-3">
        <button
          type="button"
          onClick={togglePin}
          className="flex w-full items-center gap-2 rounded-lg px-2 py-2.5 text-left hover:bg-black/[0.04]"
        >
          <span
            className="text-sm font-medium"
            style={{
              color: isPinned ? "#f97316" : "#1e293b",
              fontFamily: "Inter, sans-serif",
            }}
          >
            {isPinned ? "Pinned" : "Pin Sidebar"}
          </span>
        </button>
      </div>
      <nav className="flex-1 overflow-y-auto py-4">
        <ul className="space-y-2 px-3">
          {!employeeModeData && (
            <li>
              <Link
                to="/"
                onClick={() => handleNavigation("/dashboard")}
                className={`flex w-full items-center rounded-lg px-2 py-2.5 text-left text-sm font-medium hover:bg-black/[0.04] ${
                  dashboardPathActive ? "text-orange-600" : "text-slate-800"
                }`}
                style={{ fontFamily: "Inter, sans-serif" }}
              >
                Dashboard
              </Link>
            </li>
          )}
          {renderNavRows("panel")}
        </ul>
      </nav>
    </aside>
  );

  return (
    <div id="app-sidebar" aria-label="Sidebar">
      <div
        ref={mobileShellRef}
        className={`fixed bottom-0 left-0 top-16 z-[45] flex w-[min(280px,92vw)] max-w-full flex-col border-r border-gray-200 bg-white shadow-xl transition-transform duration-300 ease-out md:hidden ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <nav className="flex-1 overflow-y-auto p-4">
          <ul className="space-y-1">{renderNavRows("mobile")}</ul>
        </nav>
      </div>

      <div
        ref={desktopShellRef}
        className="pointer-events-auto fixed bottom-0 left-0 top-16 z-30 hidden md:flex"
      >
        {railAside}
        {labelsAside}
      </div>
    </div>
  );
};

export default Sidebar;
