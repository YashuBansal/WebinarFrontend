import {
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useState,
} from "react";
import {
  createBrowserRouter,
  RouterProvider,
  Navigate,
} from "react-router-dom";
import { toast, Toaster } from "sonner";
import { useDispatch, useSelector } from "react-redux";

import {
  Dashboard,
  Login,
  Webinar,
  Layout,
  ComingSoon,
  NotFound,
  Employees,
  ViewParticularContact,
  ViewProducts,
  CreateProduct,
  ViewAttendees,
  CreateEmployee,
  ViewSettings,
  ViewPlans,
  AddPlan,
  ViewSidebarLinks,
  CreateSidebarLink,
  Assignments,
  Clients,
  LandingPageForm,
  PabblyToken,
  CustomOptions,
  CreateClient,
  ViewClient,
  Profile,
  WebinarAttendees,
  NotesPage,
  AttendeeHistory,
  CalendarPage,
  AddOnsPage,
  BuyAddOnsPage,
  ViewEmployee,
  LeadTypes,
  EmployeeDashboard,
  UpdateNoticeBoard,
  NoticeBoard,
  MyAddOns,
  Notifications,
  BillingHistory,
  PlanOrder,
  UpdateClientPlan,
  Revenue,
  ProductLevel,
  ManageTags,
  Locations,
  ProductRevenue,
  ProductEnrollments,
  UserDownloads,
  EmployeeAssignMetrics,
  AdminActivityLogs,
  ClientBillingHistories,
  WebhookSetup,
  MessageCounts,
  InterestPoolPage,
  PolicyPage,
  TermsPage,
  SupportPage,
  DocumentationPage,
} from "./pages";
import RouteGuard from "./components/AccessControl/RouteGuard";

import {
  getAllRoles,
  getCurrentUser,
} from "./features/actions/auth";
import useRoles from "./hooks/useRoles";
import useAddUserActivity from "./hooks/useAddUserActivity";
import useUserSubscription from "./hooks/useUserSubscription";

import { socket } from "./socket";

import { setEmployeeModeId } from "./features/slices/employee";

import { newNotification } from "./features/slices/notification";
import { NotifActionType } from "./utils/extra";
import { clearAuthLoading, logout } from "./features/slices/auth";
import LayoutFallback from "./components/Fallback/LayoutFallback";
import { getNoticeBoard } from "./features/actions/noticeBoard";
import WebinarParticipants from "./pages/Webinar/Participants/WebinarParticipants";
import { getUnAcknowledgedAlarms } from "./features/actions/alarm";
import ErrorFallback from "./components/Fallback/ErrorFallback";

const App = () => {
  const dispatch = useDispatch();

  const roles = useRoles();
  const logUserActivity = useAddUserActivity();
  const { userData, isUserLoggedIn } = useSelector((state) => state.auth);
  const { data: subscription } = useUserSubscription();
  const role = userData?.role || "";
  const calendarFeatures = subscription?.plan?.calendarFeatures || false;
  const productRevenueMetrics =
    subscription?.plan?.productRevenueMetrics || false;
  const tableConfig = subscription?.plan?.attendeeTableConfig || {};
  const isCustomStatusEnabled = tableConfig?.isCustomOptionsAllowed || false;
  const assignmentMetrics = subscription?.plan?.assignmentMetrics || false;

  const [isConnected, setIsConnected] = useState(socket.connected);
  const { employeeModeData } = useSelector((state) => state.employee);

  const fetchData = useCallback(() => {
    if (userData) {
      dispatch(getUnAcknowledgedAlarms({ id: userData._id }));
    }
  }, [userData]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    dispatch(clearAuthLoading());
  }, []);

  const fetchNoticeBoard = useCallback(() => {
    if (userData) {
      if (roles.getRoleNameById(userData?.role) === "EMPLOYEE SALES") {
        dispatch(getNoticeBoard("sales"));
      } else if (
        roles.getRoleNameById(userData?.role) === "EMPLOYEE REMINDER"
      ) {
        dispatch(getNoticeBoard("reminder"));
      }
    }
  }, [dispatch, userData, roles]);

  useEffect(() => {
    function onConnect() {
      setIsConnected(true);
    }

    function onDisconnect() {
      setIsConnected(false);
    }

    function onNotification(data) {
      dispatch(newNotification(data));
      toast.dismiss();
      toast.info(data.title || "New Notification");
      if (data.actionType === NotifActionType.ACCOUNT_DEACTIVATION) {
        dispatch(logout());
      }
      if (
        data.actionType === NotifActionType.NOTICE_BOARD_UPDATE &&
        roles.isEmployeeId(role)
      ) {
        fetchNoticeBoard();
      }
    }

    function onLogout() {
      dispatch(logout());
    }

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);

    socket.on("notification", onNotification);
    socket.on("log-out", onLogout);

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("log-out", onLogout);
      socket.off("notification", onNotification);
    };
  }, []);

  useEffect(() => {
    if (isConnected && userData) {
      socket.emit("join", { user: userData._id });
    }

    if (!userData & isConnected) {
      socket.disconnect();
    }
  }, [userData, isConnected]);

  if (isUserLoggedIn && !userData?.role) {
    dispatch(logout());
  }

  useEffect(() => {
    dispatch(setEmployeeModeId());

    if (isUserLoggedIn) {
      socket.connect();
      console.log("connecting --- >");
    } else {
      console.log("disconnection");
      socket.disconnect();
    }

    function initFunctions() {
      if (isUserLoggedIn && userData?.role) {
        console.log("initializing auth data");

        dispatch(getAllRoles());
      }
    }
    initFunctions();
  }, [userData, isUserLoggedIn]);

  useEffect(() => {
    const channel = new BroadcastChannel("auth-saas-crm");
    channel.onmessage = (event) => {
      if (event.data.type === "REFRESH") {
        if (document.visibilityState !== "visible") {
          window.location.reload();
        }
      }

      if (event.data.type === "LOGOUT") {
        dispatch(logout());
        if (window.location.pathname !== "/login") {
          window.location.href = "/login";
        }
      }
    };
    return () => channel.close();
  }, []);

  useEffect(() => {
    if (isUserLoggedIn && userData?.role) {
      logUserActivity({
        action: "login/refresh",
        details: "User logged in or refreshed successfully",
      });
    }
  }, [userData, isUserLoggedIn]);

  useEffect(() => {
    dispatch(getCurrentUser());
  }, []);

  const router = createBrowserRouter([
    {
      path: "/",
      element: isUserLoggedIn ? (
        <Suspense fallback={<LayoutFallback />}>
          <Layout />
        </Suspense>
      ) : (
        <Navigate to="/login" replace />
      ),
      errorElement: <ErrorFallback />,
      children: [
        {
          path: "/",
          element: <Dashboard />,
        },

        {
          path: "/webinars",
          element: (
            <RouteGuard roleNames={["ADMIN"]}>
              <Webinar />
            </RouteGuard>
          ),
        },

        {
          path: "/webinar-participants/:id",
          element: (
            <RouteGuard roleNames={["ADMIN"]}>
              <WebinarParticipants />
            </RouteGuard>
          ),
        },

        {
          path: "/client-billing",
          element: (
            <RouteGuard roleNames={["SUPER_ADMIN"]}>
              <ClientBillingHistories />
            </RouteGuard>
          ),
        },
        {
          path: "/message-counts",
          element: (
            <RouteGuard roleNames={["SUPER_ADMIN"]}>
              <MessageCounts />
            </RouteGuard>
          ),
        },

        {
          path: "/webinarDetails/:id",
          element: (
            <RouteGuard roleNames={["ADMIN"]}>
              <WebinarAttendees />
            </RouteGuard>
          ),
        },

        {
          path: "/webinar-webhook/setup/:id",
          element: (
            <RouteGuard roleNames={["ADMIN"]}>
              <WebhookSetup />
            </RouteGuard>
          ),
        },

        {
          path: "/admin-logs",
          element: (
            <RouteGuard roleNames={["ADMIN"]}>
              <AdminActivityLogs />
            </RouteGuard>
          ),
        },

        {
          path: "/particularContact/notes",
          element: <NotesPage />,
        },

        {
          path: "/particularContact/attendee-history",
          element: <AttendeeHistory />,
        },

        {
          path: "/particularContact",
          element: <ViewParticularContact />,
        },

        {
          path: "/lead-type",
          element: <LeadTypes />,
        },

        {
          path: "/revenue",
          element: (
            <RouteGuard roleNames={["SUPER_ADMIN"]}>
              <Revenue />
            </RouteGuard>
          ),
        },
        {
          path: "/assignment-metrics",
          element: (
            <RouteGuard
              conditions={[assignmentMetrics]}
              roleNames={["EMPLOYEE_SALES", "EMPLOYEE_REMINDER", "ADMIN"]}
            >
              <EmployeeAssignMetrics />
            </RouteGuard>
          ),
        },
        {
          path: "/product-revenue",
          element: (
            <RouteGuard
              conditions={[productRevenueMetrics]}
              roleNames={["ADMIN"]}
            >
              <ProductRevenue />
            </RouteGuard>
          ),
        },
        {
          path: "/product-enrollments",
          element: (
            <RouteGuard roleNames={["ADMIN"]}>
              <ProductEnrollments />
            </RouteGuard>
          ),
        },

        {
          path: "/*",
          element: <ComingSoon />,
        },

        {
          path: "/product-level",
          element: (
            <RouteGuard roleNames={["ADMIN"]}>
              <ProductLevel />
            </RouteGuard>
          ),
        },

        {
          path: "/employees",
          element: (
            <RouteGuard roleNames={["ADMIN"]}>
              <Employees />
            </RouteGuard>
          ),
        },

        {
          path: "/employee/view/:id",
          element: (
            <RouteGuard roleNames={["ADMIN"]}>
              <ViewEmployee />
            </RouteGuard>
          ),
        },

        {
          path: "/employee/edit/:id",
          element: (
            <RouteGuard roleNames={["ADMIN"]}>
              <CreateEmployee />
            </RouteGuard>
          ),
        },

        {
          path: "/clients",
          element: (
            <RouteGuard roleNames={["SUPER_ADMIN"]}>
              <Clients />
            </RouteGuard>
          ),
        },

        {
          path: "/add-client",
          element: (
            <RouteGuard roleNames={["SUPER_ADMIN"]}>
              <CreateClient />
            </RouteGuard>
          ),
        },
        {
          path: "/client/plan/:email",
          element: (
            <RouteGuard roleNames={["SUPER_ADMIN"]}>
              <UpdateClientPlan />
            </RouteGuard>
          ),
        },

        {
          path: "/view-client/:id",
          element: (
            <RouteGuard roleNames={["SUPER_ADMIN"]}>
              <ViewClient />
            </RouteGuard>
          ),
        },

        {
          path: "/products",
          element: <ViewProducts />,
        },
        {
          path: "/notifications/:userId",
          element: <Notifications />,
        },
        {
          path: "/user-downloads",
          element: (
            <RouteGuard roleNames={["ADMIN", "SUPER_ADMIN"]}>
              <UserDownloads />
            </RouteGuard>
          ),
        },
        {
          path: "/assignments",
          element: (
            <RouteGuard roleNames={["EMPLOYEE_SALES", "EMPLOYEE_REMINDER"]}>
              <Assignments />
            </RouteGuard>
          ),
        },
        {
          path: "/calendar",
          element: (
            <RouteGuard
              conditions={[calendarFeatures]}
              roleNames={["EMPLOYEE_SALES", "EMPLOYEE_REMINDER", "ADMIN"]}
            >
              <CalendarPage />
            </RouteGuard>
          ),
        },
        {
          path: "/products/addProduct",
          element: <CreateProduct />,
        },
        {
          path: "/attendees",
          element: (
            <RouteGuard roleNames={["ADMIN"]}>
              <ViewAttendees />
            </RouteGuard>
          ),
        },
        {
          path: "/createEmployee",
          element: <CreateEmployee />,
        },
        {
          path: "/settings",
          element: <ViewSettings />,
        },
        {
          path: "/settings/custom-status",
          element: (
            <RouteGuard
              conditions={[isCustomStatusEnabled || roles.isSuperAdmin()]}
              roleNames={["SUPER_ADMIN", "ADMIN"]}
            >
              <CustomOptions />
            </RouteGuard>
          ),
        },
        {
          path: "/plans",
          element: (
            <RouteGuard roleNames={["SUPER_ADMIN", "ADMIN"]}>
              <ViewPlans />
            </RouteGuard>
          ),
        },
        {
          path: "/addons",
          element: (
            <RouteGuard roleNames={["SUPER_ADMIN"]}>
              <AddOnsPage />
            </RouteGuard>
          ),
        },
        {
          path: "/addons/buy",
          element: (
            <RouteGuard roleNames={["ADMIN"]}>
              <BuyAddOnsPage />
            </RouteGuard>
          ),
        },
        {
          path: "/addons/:id",
          element: (
            <RouteGuard roleNames={["ADMIN"]}>
              <MyAddOns />
            </RouteGuard>
          ),
        },
        {
          path: "/billing-history",
          element: (
            <RouteGuard roleNames={["ADMIN"]}>
              <BillingHistory />
            </RouteGuard>
          ),
        },
        {
          path: "/plans/editPlan/:id",
          element: (
            <RouteGuard roleNames={["SUPER_ADMIN"]}>
              <AddPlan />
            </RouteGuard>
          ),
        },
        {
          path: "/plans/order",
          element: (
            <RouteGuard roleNames={["SUPER_ADMIN"]}>
              <PlanOrder />
            </RouteGuard>
          ),
        },
        {
          path: "/plans/addPlan",
          element: (
            <RouteGuard roleNames={["SUPER_ADMIN"]}>
              <AddPlan />
            </RouteGuard>
          ),
        },
        {
          path: "/sidebarLinks",
          element: (
            <RouteGuard roleNames={["SUPER_ADMIN"]}>
              <ViewSidebarLinks />
            </RouteGuard>
          ),
        },
        {
          path: "/sidebarLinks/addSidebarLink",
          element: (
            <RouteGuard roleNames={["SUPER_ADMIN"]}>
              <CreateSidebarLink />
            </RouteGuard>
          ),
        },
        {
          path: "/update-landing-page",
          element: (
            <RouteGuard roleNames={["SUPER_ADMIN"]}>
              <LandingPageForm />
            </RouteGuard>
          ),
        },
        {
          path: "/api-docs",
          element: <PabblyToken />,
        },
        {
          path: "/profile",
          element: <Profile />,
        },
        {
          path: "/notice-board/update",
          element: (
            <RouteGuard roleNames={["ADMIN", "SUPER_ADMIN"]}>
              <UpdateNoticeBoard />
            </RouteGuard>
          ),
        },
        {
          path: "employee/dashboard/:id",
          element: (
            <RouteGuard roleNames={["ADMIN"]}>
              <EmployeeDashboard />
            </RouteGuard>
          ),
        },
        {
          path: "employee/assignments/:id",
          element: (
            <RouteGuard conditions={[!!employeeModeData]} roleNames={["ADMIN"]}>
              <Assignments />
            </RouteGuard>
          ),
        },
        {
          path: "employee/products/:id",
          element: (
            <RouteGuard roleNames={["ADMIN"]}>
              <UpdateNoticeBoard />
            </RouteGuard>
          ),
        },
        {
          path: "/notice-board",
          element: <NoticeBoard />,
        },

        {
          path: "/locations",
          element: <Locations />,
        },

        {
          path: "/locations/requests",
          element: (
            // <RouteGuard roleNames={["SUPER_ADMIN", "ADMIN"]}>
            <Locations />
            // </RouteGuard>
          ),
        },
        {
          path: "/tags",
          element: (
            <RouteGuard roleNames={["ADMIN"]}>
              <ManageTags />
            </RouteGuard>
          ),
        },
        {
          path: "/interest-pool",
          element: (
            <RouteGuard roleNames={["ADMIN"]}>
              <InterestPoolPage />
            </RouteGuard>
          ),
        },
      ],
    },
    {
      path: "/policy",
      element: <PolicyPage />,
    },
    {
      path: "/terms",
      element: <TermsPage />,
    },
    {
      path: "/support",
      element: <SupportPage />,
    },
    {
      path: "/documentation",
      element: <DocumentationPage />,
    },
    {
      path: "/login",
      element: !isUserLoggedIn ? (
        <Suspense fallback={<></>}>
          {" "}
          <Login />
        </Suspense>
      ) : (
        <Navigate to="/" replace />
      ),
    },
    {
      path: "/policy",
      element: <PolicyPage />,
    },
    {
      path: "*",
      element: <NotFound />,
    },
  ]);

  return (
    <>
      {/* <div className="hidden md:block"> */}
      <div>
        <Toaster position="top-center" richColors />
        <RouterProvider router={router} />
      </div>
      {/* <SmallScreenMessage /> */}
    </>
  );
};

export default App;
