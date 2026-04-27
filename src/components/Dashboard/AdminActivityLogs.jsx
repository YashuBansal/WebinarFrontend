import { useEffect, useState, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { getUserActivity } from "../../features/actions/userActivity";
import UserActivityTable from "../Table/UserActivityTable";
import { exportUserActivitiesByUser } from "../../features/actions/export-excel";
import { getUserData } from "../../features/slices/auth";

const AdminActivityLogs = () => {
  const navigate = useNavigate();
  const userActivityTableHeader = "Admin Activity Logs Page";

  const userData = useSelector(getUserData);
  const id = userData?._id;

  const dispatch = useDispatch();
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({});

  const userActivityLimit = useSelector(
    (state) => state.pageLimits[userActivityTableHeader] || 10
  );

  useEffect(() => {
    dispatch(getUserActivity({ id, page: page, limit: userActivityLimit, filters }));
  }, [page, userActivityLimit, filters]);

  const exportEmployeeActivityLogs = useCallback(
    (limit, columns) => {
      dispatch(
        exportUserActivitiesByUser({ limit, columns, filters, userId: id })
      );
    },
    [dispatch, filters]
  );
  return (
    <div className="box-border min-h-full w-full min-w-0 max-w-full p-2 transition-colors duration-500 sm:p-2 lg:p-4 xl:p-6 2xl:p-8">
      <UserActivityTable
        page={page}
        setPage={setPage}
        filters={filters}
        setFilters={setFilters}
        handleExportData={exportEmployeeActivityLogs}
        limit={userActivityLimit}
        tableHeader={userActivityTableHeader}
        adminLogsUi2025
        onAdminLogsBack={() => navigate(-1)}
      />
    </div>
  );
};

export default AdminActivityLogs;
