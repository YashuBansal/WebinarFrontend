import { useRoutes, Navigate } from "react-router-dom";
import { lazy, Suspense } from "react";

const ProjectsPage = lazy(() => import("./pages/ProjectsPage"));
const DashboardLayout = lazy(() => import("./pages/dashboard/DashboardLayout"));
const Configuration = lazy(() => import("./pages/dashboard/Configuration"));
const Profile = lazy(() => import("./pages/dashboard/Profile"));
const ZoomCallback = lazy(() => import("./pages/ZoomCallback"));
const Meetings = lazy(() => import("./pages/dashboard/Meetings/Meetings"));
const Webinars = lazy(() => import("./pages/dashboard/Webinars/Webinars"));
const WebinarDetails = lazy(() => import("./pages/dashboard/Webinars/WebinarDetails"));
const MeetingDetails = lazy(() => import("./pages/dashboard/Meetings/MeetingDetails"));
const MeetingEventConfig = lazy(() => import("./pages/dashboard/Meetings/MeetingEventConfig"));
const MeetingMessages = lazy(() => import("./pages/dashboard/Meetings/MeetingMessages"));

const routes = [
  { path: "/", element: <ProjectsPage /> },
  { path: "callback", element: <ZoomCallback /> },
  {
    path: "dashboard/:projectId",
    element: <DashboardLayout />,
    children: [
      { index: true, element: <Navigate to="configuration" replace /> },
      { path: "profile", element: <Profile /> },
      { path: "configuration", element: <Configuration /> },
      { path: "meetings", element: <Meetings /> },
      { path: "webinars", element: <Webinars /> },
      { path: "webinars/:webinarId", element: <WebinarDetails /> },
      { path: "webinars/:webinarId/event-config", element: <MeetingEventConfig /> },
      { path: "webinars/:webinarId/messages", element: <MeetingMessages /> },
      { path: "meetings/:meetingId", element: <MeetingDetails /> },
      { path: "meetings/:meetingId/event-config", element: <MeetingEventConfig /> },
      { path: "meetings/:meetingId/messages", element: <MeetingMessages /> },
    ],
  },
  {
    path: "*",
    element: <Navigate to="/zoom" replace />,
  },
];

const LoadingFallback = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-800/50">
    <div className="flex flex-col items-center space-y-4">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      <p className="text-sm text-gray-600 dark:text-slate-400">Loading page...</p>
    </div>
  </div>
);

export default function AppRoutes() {
  const element = useRoutes(routes);
  return <Suspense fallback={<LoadingFallback />}>{element}</Suspense>;
}
