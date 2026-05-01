import React, { useCallback, useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  DashboardIcon,
  WebinarIcon,
  AttendeesIcon,
  EmployeeIcon,
  CalendarIcon,
  ProductsIcon,
  NoticeBoardIcon,
  LinksIcon,
  SettingsIcon,
  LogoutIcon,
  RupeeIcon,
  AssignmentIcon,
  BillIcon,
  WhatsappIcon,
  ZoomIcon,
} from "./SVGs";
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
const Sidebar = ({ toggleButtonRef }) => {
  const dispatch = useDispatch();
  const roles = useRoles();
  const logUserActivity = useAddUserActivity();
  const location = useLocation();
  const navigate = useNavigate();

  const { isUpdated } = useSelector((state) => state.noticeBoard);
  const { sidebarLinkData } = useSelector((state) => state.sidebarLink);
  const { userData, isUserLoggedIn } = useSelector((state) => state.auth);
  const { data: subscription } = useUserSubscription();
  const calendarFeatures = subscription?.plan?.calendarFeatures;
  const { isSidebarOpen } = useSelector((state) => state.globalData);
  const [showImportantLinks, setShowImportantLinks] = useState(false); // toggle state for sub-links
  const role = userData?.role || "";
  const { employeeModeData } = useSelector((state) => state.employee);
  const { webinarData } = useSelector((state) => state.webinarContact);

  const sidebarRef = useRef(null);

  const isSmallScreen = useMediaQuery("(max-width: 768px)");

  useEffect(() => {
    if (isSmallScreen) {
      dispatch(setSidebarOpen()); // Clear tags data on small screens
    } else {
      dispatch(setSidebarOpen(true)); // Set sidebar open on larger screens
    }
  }, [isSmallScreen]);

  useEffect(() => {
    tagsService.getTags().then((res) => {
      if (res.success) {
        dispatch(setTagsData(res.data));
      }
    });
    return () => {
      console.log("Clearing tagsData Gloval");
      dispatch(setTagsData());
    };
  }, []);

  useEffect(() => {
    if (role === role.EMPLOYEE_REMINDER || role === role.EMPLOYEE_SALES) {
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
    if (location.pathname === item.path.split("?")[0]) return true;

    // Check if the current path starts with any children paths
    if (Array.isArray(item.children)) {
      return item.children.some((child) =>
        location.pathname.startsWith(`/${child}`)
      );
    }

    return false;
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        isSmallScreen &&
        isSidebarOpen &&
        sidebarRef.current &&
        !sidebarRef.current.contains(event.target) &&
        !(
          toggleButtonRef?.current &&
          toggleButtonRef.current.contains(event.target)
        )
      ) {
        dispatch(setSidebarOpen(false));
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isSmallScreen, isSidebarOpen, dispatch]);

  if (!userData) {
    navigate("/login");
    return null;
  }

  return (
    <div
      ref={sidebarRef}
      id="logo-sidebar"
      className={`fixed top-0 left-0 w-64 h-screen z-20 pt-20 transition-transform ease-in-out duration-700  -translate-x-full bg-white border-r border-gray-200 ${
        isSidebarOpen ? "translate-x-0" : ""
      }`}
      aria-label="Sidebar"
    >
      <div className="h-full px-3 pb-4 overflow-y-auto bg-white">
        <ul className="space-y-2 font-medium">
          {/* Dashboard Link */}
          {!employeeModeData && (
            <li>
              <Link
                to="/"
                onClick={() => handleNavigation("/dashboard")}
                className={`flex items-center p-2 text-gray-900 rounded-lg hover:bg-gray-300 group ${
                  location.pathname === "/" ? "bg-gray-300" : ""
                }`}
              >
                <img
                  src={DashboardIcon}
                  width={30}
                  height={30}
                  alt="Dashboard"
                />
                <span className="ms-3">Dashboard</span>
              </Link>
            </li>
          )}

          {/* Render navigation items based on roles */}
          {navItems.map(
            (navGroup, index) =>
              navGroup.roles.includes(role) &&
              navGroup.items.map((item, idx) => (
                <li key={`${index}-${idx}`}>
                  {item.external ? (
                    <a
                      href={item.path}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => handleNavigation(item.path)}
                      className={`flex items-center p-2 text-gray-900 rounded-lg hover:bg-gray-300 group ${
                        isActiveRoute(item) ? "bg-gray-300" : ""
                      }`}
                    >
                      {item.icon}
                      <span className="flex-1 ms-3 whitespace-nowrap">
                        {item.label}
                      </span>
                    </a>
                  ) : (
                    <Link
                      to={item.path}
                      onClick={() => handleNavigation(item.path)}
                      className={`flex items-center p-2 text-gray-900 rounded-lg hover:bg-gray-300 group ${
                        isActiveRoute(item) ? "bg-gray-300" : ""
                      }`}
                    >
                      {item.icon}
                      <span className="flex-1 ms-3 whitespace-nowrap">
                        {item.label}{" "}
                        {item.label === "Notice Board" &&
                          isUpdated &&
                          roles.isEmployeeId(role) && (
                            <div className="inline-flex items-center rounded-full bg-rose-100 px-2.5 py-0.5 text-xs font-medium text-rose-800">
                              New
                            </div>
                          )}
                      </span>
                    </Link>
                  )}
                </li>
              ))
          )}

          {/* Important Links Section */}
          <li>
            <div
              onClick={toggleImportantLinks}
              className="flex items-center p-2 text-gray-900 rounded-lg  hover:bg-gray-300 group cursor-pointer"
            >
              <img src={LinksIcon} width={25} height={25} alt="Links" />
              <span className="flex-1 ms-3 whitespace-nowrap">
                Important Links
              </span>
              {showImportantLinks ? (
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M18 15l-6-6-6 6" />
                </svg>
              ) : (
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M6 9l6 6 6-6" />
                </svg>
              )}
            </div>

            {showImportantLinks &&
              Array.isArray(sidebarLinkData) &&
              sidebarLinkData.map((item, idx) => (
                <ul key={idx} className="pl-10 space-y-1 ">
                  <li>
                    <a
                      href={item?.link}
                      onClick={() => {
                        addUserActivityLog(item.title, "important link");
                        closeSidebar(); // Close sidebar after clicking link
                      }}
                      target="_blank" // Opens the link in a new tab
                      rel="noopener noreferrer" // Security measure to prevent tab nabbing
                      className="flex items-center p-2 cursor-pointer text-gray-600 hover:bg-gray-300 rounded-lg"
                    >
                      {item.title}
                    </a>
                  </li>
                </ul>
              ))}
          </li>

          {/* Settings Link */}
          <ComponentGuard
            allowedRoles={[roles.ADMIN, roles.SUPER_ADMIN]}
            conditions={[employeeModeData ? false : true]}
          >
            <li>
              <Link
                to="/settings"
                onClick={() => handleNavigation("/settings")}
                className={`flex items-center p-2 text-gray-900 rounded-lg hover:bg-gray-300 group ${
                  isActiveRoute({
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
                  })
                    ? "bg-gray-300"
                    : ""
                }`}
              >
                <img src={SettingsIcon} width={30} height={30} alt="Settings" />
                <span className="flex-1 ms-3 whitespace-nowrap">Settings</span>
              </Link>
            </li>
          </ComponentGuard>

          {/* Logout Button */}
          <li>
            <button
              onClick={handleLogout}
              className="flex items-center p-2 text-gray-900 rounded-lg text-start hover:text-red-600 w-full  hover:bg-gray-300 group"
            >
              <img src={LogoutIcon} width={30} height={30} alt="Logout" />
              <span className="flex-1 ms-3 whitespace-nowrap">Sign Out</span>
            </button>
          </li>
        </ul>
      </div>
    </div>
  );
};

export default Sidebar;
