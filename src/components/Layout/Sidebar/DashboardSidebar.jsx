import React from "react";
import { Link, useLocation } from "react-router-dom";
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
  ChevronDown,
  Building2,
  CircleDollarSign,
  Receipt,
  MessagesSquare,
  Target,
  Megaphone,
  Award,
} from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import useRoles from "../../../hooks/useRoles";
import ComponentGuard from "../../AccessControl/ComponentGuard";
import useUserSubscription from "../../../hooks/useUserSubscription";
import { useTheme } from "../../../contexts/ThemeContext";

const NavGlyph = ({ Icon, active }) => {
  const { theme } = useTheme();
  const inactive = theme === "dark" ? "#94a3b8" : "#64748b";
  return (
    <Icon
      className="h-5 w-5 shrink-0"
      strokeWidth={2}
      style={{ color: active ? "#f97316" : inactive }}
    />
  );
};

const DashboardSidebar = ({
  variant,
  role,
  roles,
  employeeModeData,
  webinarData,
  isUpdated,
  sidebarLinkData,
  showImportantLinks,
  toggleImportantLinks,
  handleNavigation,
  handleLogout,
  isActiveRoute,
  settingsActive,
  dashboardPathActive,
}) => {
  const { isDark } = useTheme();
  const { data: subscription } = useUserSubscription();
  const calendarFeatures = subscription?.plan?.calendarFeatures;

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
        {
          path: "/manage-referrals",
          label: "Referrals",
          Icon: Award,
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
          path: `/assignments?page=1&webinarId=${Array.isArray(webinarData) && webinarData.length > 0
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

  const renderNavRows = () => {
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
            className={`flex items-center gap-3 rounded-xl px-3 py-2.5 font-medium transition-colors ${dashboardPathActive
              ? "bg-orange-50 dark:bg-orange-500/10 text-orange-600"
              : "text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-800"
              }`}
          >
            <NavGlyph Icon={LayoutDashboard} active={dashboardPathActive} />
            <span>Dashboard</span>
          </Link>
        </li>
      );
    }

    if (variant === "rail" && !employeeModeData) {
      pushRow(
        "rail-dash",
        <li key="r-dash">
          <Link
            to="/"
            onClick={() => handleNavigation("/dashboard")}
            className={`relative flex w-full items-center justify-center rounded-lg py-2.5 transition-colors hover:bg-black/[0.04] dark:hover:bg-white/[0.04] ${dashboardPathActive ? "bg-orange-500/10" : ""
              }`}
          >
            {dashboardPathActive && (
              <div className="absolute bottom-0 left-0 top-0 w-[3px] rounded-r-sm bg-orange-500" />
            )}
            <NavGlyph Icon={LayoutDashboard} active={dashboardPathActive} />
          </Link>
        </li>
      );
    }

    if (variant === "panel" && !employeeModeData) {
      pushRow(
        "panel-dash",
        <li key="p-dash">
          <Link
            to="/"
            onClick={() => handleNavigation("/dashboard")}
            className={`flex w-full items-center rounded-lg px-2 py-2.5 text-left text-sm font-medium hover:bg-black/[0.04] dark:hover:bg-white/[0.04] ${dashboardPathActive ? "text-orange-600" : "text-slate-800 dark:text-slate-200"
              }`}
            style={{ fontFamily: "Inter, sans-serif" }}
          >
            Dashboard
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
                  className={`flex items-center gap-3 rounded-xl px-3 py-2.5 font-medium transition-colors ${active
                    ? "bg-orange-50 dark:bg-orange-500/10 text-orange-600"
                    : "text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-800"
                    }`}
                >
                  <NavGlyph Icon={Icon} active={active} />
                  <span className="truncate whitespace-nowrap">
                    {item.label}
                    {item.label === "Notice Board" &&
                      isUpdated &&
                      roles.isEmployeeId(role) && (
                        <span className="ml-2 inline-flex items-center rounded-full bg-rose-100 px-2 py-0.5 text-xs font-medium text-rose-800">
                          New
                        </span>
                      )}
                  </span>
                </a>
              ) : (
                <Link
                  to={item.path}
                  onClick={() => handleNavigation(item.path)}
                  className={`flex items-center gap-3 rounded-xl px-3 py-2.5 font-medium transition-colors ${active
                    ? "bg-orange-50 dark:bg-orange-500/10 text-orange-600"
                    : "text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-800"
                    }`}
                >
                  <NavGlyph Icon={Icon} active={active} />
                  <span className="truncate whitespace-nowrap">
                    {item.label}
                    {item.label === "Notice Board" &&
                      isUpdated &&
                      roles.isEmployeeId(role) && (
                        <span className="ml-2 inline-flex items-center rounded-full bg-rose-100 px-2 py-0.5 text-xs font-medium text-rose-800">
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
                  className={`relative flex w-full items-center justify-center rounded-lg py-2.5 transition-colors hover:bg-black/[0.04] dark:hover:bg-white/[0.04] ${active ? "bg-orange-500/10" : ""
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
                  className={`relative flex w-full items-center justify-center rounded-lg py-2.5 transition-colors hover:bg-black/[0.04] dark:hover:bg-white/[0.04] ${active ? "bg-orange-500/10" : ""
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
                  className="flex w-full items-center rounded-lg px-2 py-2.5 text-left text-sm font-medium text-slate-800 dark:text-slate-200 hover:bg-black/[0.04] dark:hover:bg-white/[0.04]"
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
                  className={`flex w-full items-center rounded-lg px-2 py-2.5 text-left text-sm font-medium hover:bg-black/[0.04] dark:hover:bg-white/[0.04] ${active ? "text-orange-600" : "text-slate-800 dark:text-slate-200"
                    }`}
                  style={{ fontFamily: "Inter, sans-serif" }}
                >
                  <span className="truncate whitespace-nowrap">
                    {item.label}
                    {item.label === "Notice Board" &&
                      isUpdated &&
                      roles.isEmployeeId(role) && (
                        <span className="ml-2 inline-flex items-center rounded-full bg-rose-100 px-2 py-0.5 text-xs font-medium text-rose-800">
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



    if (variant === "rail") {
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
              className={`relative flex w-full items-center justify-center rounded-lg py-2.5 hover:bg-black/[0.04] dark:hover:bg-white/[0.04] ${settingsActive ? "bg-orange-500/10" : ""
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
    }

    if (variant === "panel") {
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
              className={`flex w-full items-center rounded-lg px-2 py-2.5 text-left text-sm font-medium hover:bg-black/[0.04] dark:hover:bg-white/[0.04] ${settingsActive ? "text-orange-600" : "text-slate-800 dark:text-slate-200"
                }`}
              style={{ fontFamily: "Inter, sans-serif" }}
            >
              Settings
            </Link>
          </li>
        </ComponentGuard>
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
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 font-medium transition-colors ${settingsActive
                ? "bg-orange-50 dark:bg-orange-500/10 text-orange-600"
                : "text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-800"
                }`}
            >
              <NavGlyph Icon={Settings} active={settingsActive} />
              Settings
            </Link>
          </li>
        </ComponentGuard>
      );
    }

    return rows;
  };

  return <>{renderNavRows()}</>;
};

export default DashboardSidebar;
