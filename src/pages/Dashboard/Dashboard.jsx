import { Suspense, lazy } from "react";
import ComponentGuard from "../../components/AccessControl/ComponentGuard";
import { AppLoaderCenter } from "../../components/AppLoader";
import { roles } from "../../utils/roles";
const ClientDashboard = lazy(() => import("./ClientDashboard"));
const EmployeeDashboard = lazy(() => import("./EmployeeDashboard"));
const SuperAdminDashboard = lazy(() => import("./SuperAdminDashboard"));

const Dashboard = () => {
  return (
    <>
      <ComponentGuard allowedRoles={[roles.SUPER_ADMIN]}>
        <Suspense fallback={<AppLoaderCenter message="Loading dashboard..." />}>
          <SuperAdminDashboard />
        </Suspense>
      </ComponentGuard>
      <ComponentGuard allowedRoles={[roles.ADMIN]}>
        <Suspense fallback={<AppLoaderCenter message="Loading dashboard..." />}>
          <ClientDashboard />
        </Suspense>
      </ComponentGuard>
      <ComponentGuard
        allowedRoles={[roles.EMPLOYEE_SALES, roles.EMPLOYEE_REMINDER]}
      >
        <Suspense fallback={<AppLoaderCenter message="Loading dashboard..." />}>
          <EmployeeDashboard />
        </Suspense>
      </ComponentGuard>
    </>
  );
};

export default Dashboard;
