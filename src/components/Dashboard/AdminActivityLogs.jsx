import { useEffect, useState, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getUserActivity } from "../../features/actions/userActivity";
import UserActivityTable from "../Table/UserActivityTable";
import { exportUserActivitiesByUser } from "../../features/actions/export-excel";
import { getUserData } from "../../features/slices/auth";

const AdminActivityLogs = () => {
  const userActivityTableHeader = "Admin Activity Logs Page";
  const pageUniqueKey = "adminActivityLogsPage";

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
    <div className="pt-14 px-5">
      <UserActivityTable
        page={page}
        setPage={setPage}
        filters={filters}
        setFilters={setFilters}
        handleExportData={exportEmployeeActivityLogs}
        limit={userActivityLimit}
        tableHeader={userActivityTableHeader}
      />
    </div>
  );
};

export default AdminActivityLogs;
