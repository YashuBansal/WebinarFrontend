import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Chip,
  Divider,
  Paper,
  Typography,
} from "@mui/material";
import { useEffect, useState, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getUserActivity } from "../../features/actions/userActivity";
import {
  CheckCircleOutline,
  ErrorOutline,
  ExpandMore,
} from "@mui/icons-material";
import UserActivityTable from "../Table/UserActivityTable";
import { exportUserActivitiesByUser } from "../../features/actions/export-excel";

const UserActivityLogs = ({ isActive, id }) => {

  const userActivityTableHeader = "Admin Activity Logs";

  const dispatch = useDispatch();
  const { userActivities } = useSelector((state) => state.userActivity);
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
    <Paper elevation={3} className="p-4">
      <div className="flex items-center gap-5">
        <Typography variant="h6" gutterBottom>
          Status
        </Typography>
        <Chip
          label={isActive ? "Active" : "Inactive"}
          color={isActive ? "success" : "error"}
          icon={isActive ? <CheckCircleOutline /> : <ErrorOutline />}
          className="mb-2"
        />
      </div>
      <Typography mb={1}>
        <strong>Last Activity:</strong>{" "}
        {Array.isArray(userActivities) && userActivities.length > 0
          ? new Date(userActivities[0]?.createdAt).toLocaleString()
          : "N/A"}
      </Typography>
      <Divider/>

      {/* Accordion for User Activity Logs */}
      <Accordion>
        <AccordionSummary
          expandIcon={<ExpandMore />}
          aria-controls="user-activity-logs-content"
          id="user-activity-logs-header"
        >
          <Typography variant="subtitle1" style={{ fontWeight: "bold" }}>
            Client Activity Logs
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          {/* Table for Activity Logs */}
          <UserActivityTable
            page={page}
            setPage={setPage}
            filters={filters}
            setFilters={setFilters}
            handleExportData={exportEmployeeActivityLogs}
            limit={userActivityLimit}
            tableHeader={userActivityTableHeader}
          />
        </AccordionDetails>
        
      </Accordion>
    </Paper>
  );
};

export default UserActivityLogs;
