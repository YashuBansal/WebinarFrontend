import React, {
  useEffect,
  useState,
  useMemo,
  useCallback,
  useRef,
  lazy,
  Suspense,
} from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import useAddUserActivity from "../../hooks/useAddUserActivity";

import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";

import {
  getUserActivity,
  getUserActivitySilently,
} from "../../features/actions/userActivity";
import { useDispatch, useSelector } from "react-redux";
import UserActivityTable from "../../components/Table/UserActivityTable";
import DataTable from "../../components/Table/DataTable";
import { attendeeTableColumns } from "../../utils/columnData";
import AttendeesFilterModal from "../../components/Attendees/AttendeesFilterModal";
import { getAssignments } from "../../features/actions/assign";
import {
  AssignmentStatus,
  formatDateAsNumber,
  SocketEvents,
} from "../../utils/extra";
import { useLayoutEffect } from "react";
import { getEmployeeWebinars } from "../../features/actions/webinarContact";
import { clearWebinarData } from "../../features/slices/webinarContact";
import useRoles from "../../hooks/useRoles";
import { socket } from "../../socket";
import { VisibilityIcon } from "../../components/SVGs";
import { resetAssignedData } from "../../features/slices/assign";
import { setWebinarAttendeesFilters } from "../../features/slices/filters.slice";
import { exportUserActivitiesByUser } from "../../features/actions/export-excel";
import ModalFallback from "../../components/Fallback/ModalFallback";
import { resetUserActivities } from "../../features/slices/userActivity";
import { createPortal } from "react-dom";
import ApplyTagsModal from "../../components/Webinar/ApplyTagsModal";
import { useApplyTagsToEmployeeAssignments } from "../../hooks/useTags";
import { globalButton } from "../../utils/style";

const ExportEmployeeAssignments = lazy(() =>
  import("../../components/Export/ExportEmployeeAssignments")
);

const ViewEmployee = () => {
  // ----------------------- ModalNames for Redux -----------------------
  const filterModalName = "ViewAssignmentsFilterModal";
  const exportExcelModalName = "ExportViewAssignmentsExcel";
  // ----------------------- etcetra -----------------------

  const userActivityTableHeader = "User Activity Table";
  const userActivityLimit = useSelector(
    (state) => state.pageLimits[userActivityTableHeader] || 10
  );

  const { id } = useParams();
  const logUserActivity = useAddUserActivity();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const roles = useRoles();

  const [tableHeader, setTableHeader] = useState("Employee Assignments Table");
  const [searchParams, setSearchParams] = useSearchParams();
  const [filters, setFilters] = useState({});
  const role = searchParams.get("role");
  if (!role) {
    navigate("/employees");
  }

  const {
    webinarAttendeesSortBy,
    webinarAttendeesFilters,
    salesAttendeesSortBy,
  } = useSelector((state) => state.filters);

  const sortByOption = useMemo(
    () =>
      role === "EMPLOYEE_SALES" || role === roles.EMPLOYEE_SALES
        ? salesAttendeesSortBy
        : webinarAttendeesSortBy,
    [role, salesAttendeesSortBy, webinarAttendeesFilters]
  );

  const { assignData, isLoading, isSuccess, leadTypeData, pagination } =
    useSelector((state) => state.assign);
  const { totalPages = 1, total = 0 } = pagination;
  const { locationsData } = useSelector((state) => state.location);

  const { webinarData } = useSelector((state) => state.webinarContact);
  const modalState = useSelector((state) => state.modals.modals);
  const filterModalOpen = modalState[filterModalName] ? true : false;
  const exportModalOpen = modalState[exportExcelModalName] ? true : false;

  const userName = searchParams.get("userName");
  const [tabValue, setTabValue] = useState(
    searchParams.get("tabValue") || "assignments"
  );
  const LIMIT = useSelector((state) => state.pageLimits[tableHeader] || 10);
  const [page, setPage] = useState(searchParams.get("page") || 1);
  const [currentWebinar, setCurrentWebinar] = useState(
    searchParams.get("webinarId") || ""
  );
  const [validCallFlag, setValidCallFlag] = useState(
    searchParams.get("valid-call") || "all"
  );

  const [applyTagsModalOpen, setApplyTagsModalOpen] = useState(false);

  const resetFilterRef = useRef(false);
  useEffect(() => {
    // 1. Get the current values from the URL
    const currentParams = Object.fromEntries([...searchParams.entries()]);

    // 2. Define the new values from your component's state
    const newParams = {
      page: page,
      tabValue: tabValue,
      role: role,
      webinarId: currentWebinar,
      userName: userName,
    };

    // 3. Check if an update is actually needed
    let isDifferent = false;
    for (const key in newParams) {
      // Compare the string representation.
      // Use `|| ''` to treat null, undefined, and empty string as the same.
      // This prevents updates when a param is removed (becomes undefined) and it's already absent from the URL (get returns null).
      if (String(newParams[key] || "") !== String(currentParams[key] || "")) {
        isDifferent = true;
        break; // A difference was found, no need to check further
      }
    }

    // 4. Only update the URL if a value has changed
    if (isDifferent) {
      // Create a clean object for setSearchParams, filtering out any falsy values
      // to avoid adding empty params to the URL (e.g., `?role=&userName=`)
      const paramsToSet = {};
      for (const key in newParams) {
        if (newParams[key]) {
          // This will filter out '', null, undefined, 0, false
          paramsToSet[key] = newParams[key];
        }
      }

      // Use { replace: true } to avoid polluting the browser history with filter/page changes.
      // This replaces the current history entry instead of pushing a new one.
      setSearchParams(paramsToSet, { replace: true });
    }
  }, [
    page,
    tabValue,
    currentWebinar,
    role,
    userName,
    searchParams,
    setSearchParams,
  ]);

  useEffect(() => {
    return () => {
      dispatch(resetAssignedData());
      dispatch(clearWebinarData());
      dispatch(resetUserActivities());
      if (!resetFilterRef.current) {
        dispatch(setWebinarAttendeesFilters());
      }
    };
  }, []);

  const fetchEmployeeActivityLogs = useCallback(() => {
    if (tabValue === "activityLogs")
      dispatch(
        getUserActivity({ id, page: page, limit: userActivityLimit, filters })
      );
  }, [page, userActivityLimit, dispatch, tabValue, filters]);

  const fetchEmployeeActivityLogsSilently = useCallback(() => {
    if (tabValue === "activityLogs")
      dispatch(
        getUserActivitySilently({ id, page: page, limit: LIMIT, filters })
      );
  }, [page, LIMIT, dispatch, tabValue, filters]);

  const exportEmployeeActivityLogs = useCallback(
    (limit, columns) => {
      dispatch(
        exportUserActivitiesByUser({ limit, columns, filters, userId: id })
      );
    },
    [dispatch, filters]
  );

  const fetchEmployeeAssignments = useCallback(
    (validCall) => {
      if (currentWebinar)
        dispatch(
          getAssignments({
            id,
            page,
            limit: LIMIT,
            filters: webinarAttendeesFilters,
            sort: sortByOption,
            webinarId: currentWebinar,
            assignmentStatus: AssignmentStatus.ACTIVE,
            validCall,
            validCallFlag,
          })
        );
    },
    [
      page,
      LIMIT,
      webinarAttendeesFilters,
      sortByOption,
      currentWebinar,
      validCallFlag,
      dispatch,
    ]
  );

  useEffect(() => {
    function onNotification(data) {
      fetchEmployeeActivityLogsSilently();
    }
    if (socket) socket.on(SocketEvents.EMPLOYEE_ACTIVITY_LOG, onNotification);
    return () => {
      if (socket)
        socket.off(SocketEvents.EMPLOYEE_ACTIVITY_LOG, onNotification);
    };
  }, [fetchEmployeeActivityLogsSilently]);

  useEffect(() => {
    if (tabValue === "activityLogs") fetchEmployeeActivityLogs();
    else if (tabValue === "history") fetchEmployeeAssignments("Worked");
    else fetchEmployeeAssignments("Pending");
  }, [tabValue, fetchEmployeeActivityLogs, fetchEmployeeAssignments]);

  useLayoutEffect(() => {
    dispatch(getEmployeeWebinars({ employeeId: id }));
  }, []);

  useEffect(() => {
    if (
      Array.isArray(webinarData) &&
      webinarData.length > 0 &&
      !currentWebinar
    ) {
      setCurrentWebinar(webinarData[0]._id);
      setPage(1);
    }
  }, [webinarData]);

  const notAllowedColumns = useMemo(
    () =>
      role === "EMPLOYEE_SALES" || role === roles.EMPLOYEE_SALES
        ? ["enrollments", "isAssigned", "attendedCount","registeredCount"]
        : ["enrollments", "isAssigned", "attendedCount","registeredCount", "timeInSession"],
    [role]
  );

  const tableData = useMemo(() => {
    return {
      columns: attendeeTableColumns.filter(
        (column) => !notAllowedColumns.includes(column.key)
      ),
      totalRecords: total,
      rows: assignData.map((row) => ({
        ...row,
        leadType: leadTypeData.find((lead) => lead._id === row?.leadType),
      })),
    };
  }, [assignData, leadTypeData, notAllowedColumns]);

  const {
    mutateAsync: applyTagsForEmployee,
    isPending: isApplyingTags,
  } = useApplyTagsToEmployeeAssignments(id, () => {
    // After tagging, refetch assignments based on current tab
    if (tabValue === "history") {
      fetchEmployeeAssignments("Worked");
    } else {
      fetchEmployeeAssignments("Pending");
    }
    setApplyTagsModalOpen(false);
  });

  const handleTabChange = (_, newValue) => {
    setTabValue(newValue);
    if (newValue === "activityLogs") {
      setTableHeader("activityLogs");
    } else {
      setTableHeader("Employee Assignments Table");
    }
    setPage(1);
    logUserActivity({
      action: "switch",
      type: "tab",
      detailItem: newValue,
    });
  };
  const actionIcons = [
    {
      icon: () => (
        <img
          src={VisibilityIcon}
          alt="Bookmark"
          className="min-h-6 h-6 w-6 min-w-6"
        />
      ),
      tooltip: "View Attendee Info",
      onClick: (item) => {
        resetFilterRef.current = true;
        navigate(
          `/particularContact?email=${item?.email}&attendeeId=${item?._id}`
        );
      },
    },
  ];

  const WebinarDropdown = () => {
    return (
      <div className="flex gap-4">
        <FormControl className="w-40">
          <InputLabel id="webinar-label">Webinar</InputLabel>
          <Select
            labelId="webinar-label"
            label="Webinar"
            className="h-10"
            value={currentWebinar}
            onChange={(e) => {
              setCurrentWebinar(e.target.value);
              setPage(1);
            }}
          >
            <MenuItem value="all">All</MenuItem>
            {webinarData.map((webinar, index) => (
              <MenuItem key={index} value={webinar._id}>
                {webinar?.webinarName} -{" "}
                {formatDateAsNumber(webinar?.webinarDate)}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {tabValue === "history" && (
          <FormControl className="w-40">
            <InputLabel id="status-label">Status</InputLabel>
            <Select
              labelId="status-label"
              label="Status"
              className="h-10"
              value={validCallFlag}
              onChange={(e) => {
                setValidCallFlag(e.target.value);
                setPage(1);
              }}
            >
              <MenuItem value="all">All</MenuItem>
              <MenuItem value="valid"> Valid Calls </MenuItem>
              <MenuItem value="invalid"> Invalid Calls </MenuItem>
            </Select>
          </FormControl>
        )}
      </div>
    );
  };

  return (
    <div className="md:px-10 pt-10">
      {/* Tabs for Sales and Reminder */}
      <Tabs
        value={tabValue}
        onChange={handleTabChange}
        centered
        className="border-b border-gray-200"
        textColor="primary"
        indicatorColor="primary"
      >
        <Tab
          label="Assignments"
          value="assignments"
          className="text-gray-600"
        />
        <Tab label="History" value="history" className="text-gray-600" />
        <Tab
          label="Activity Logs"
          value="activityLogs"
          className="text-gray-600"
        />
      </Tabs>

      <div className=" pt-6">
        <div className="mb-6">
          <span>
            <h1 className="text-2xl font-semibold text-gray-800">{userName}</h1>
          </span>
        </div>
        {tabValue === "activityLogs" && (
          <UserActivityTable
            page={page}
            setPage={setPage}
            filters={filters}
            setFilters={setFilters}
            handleExportData={exportEmployeeActivityLogs}
            limit={userActivityLimit}
            tableHeader={userActivityTableHeader}
          />
        )}
        {(tabValue === "history" || tabValue === "assignments") && (
          <>
            {currentWebinar && (
              <div className="flex justify-end mb-4">
                <button
                  className={globalButton}
                  onClick={() => setApplyTagsModalOpen(true)}
                >
                  Apply Tags
                </button>
              </div>
            )}
            <DataTable
              tableHeader={tableHeader}
              buttonGroupContent={<WebinarDropdown />}
              tableUniqueKey="employeeAssignmentsTable"
              filters={webinarAttendeesFilters}
              setFilters={(filters) => {
                dispatch(
                  setWebinarAttendeesFilters({
                    filters: filters,
                  })
                );
              }}
              // isSelectVisible={true}
              tableData={tableData}
              actions={actionIcons}
              totalPages={totalPages}
              page={page}
              setPage={setPage}
              // selectedRows={selectedRows}
              // setSelectedRows={setSelectedRows}
              limit={LIMIT}
              filterModalName={filterModalName}
              exportModalName={exportExcelModalName}
              isLoading={isLoading}
              locations={locationsData}
              isLeadType={true}
            />
            {filterModalOpen && (
              <AttendeesFilterModal
                modalName={filterModalName}
                setPage={setPage}
                notAllowed={notAllowedColumns}
                label="Employee Assignments Filter"
                tabValue={
                  role === "EMPLOYEE_REMINDER" ||
                  role === roles.EMPLOYEE_REMINDER
                    ? "preWebinar"
                    : "postWebinar"
                }
              />
            )}

            {exportModalOpen && (
              <Suspense fallback={<ModalFallback />}>
                <ExportEmployeeAssignments
                  id={id}
                  modalName={exportExcelModalName}
                  filters={webinarAttendeesFilters}
                  webinarId={currentWebinar}
                  validCall={tabValue === "history" ? "Worked" : "Pending"}
                  assignmentStatus={AssignmentStatus.ACTIVE}
                  validCallFlag={validCallFlag}
                  employeeName={userName}
                  sort={sortByOption}
                />
              </Suspense>
            )}
            {applyTagsModalOpen &&
              createPortal(
                <Suspense fallback={<ModalFallback />}>
                  <ApplyTagsModal
                    onClose={() => setApplyTagsModalOpen(false)}
                    onSubmit={async (tag) => {
                        const normalizedWebinarId =
                          currentWebinar && currentWebinar !== "all"
                            ? currentWebinar
                            : undefined;

                      await applyTagsForEmployee({
                        webinarId: normalizedWebinarId,
                        isAttended:
                          role === "EMPLOYEE_SALES" ||
                          role === roles.EMPLOYEE_SALES,
                        filters: webinarAttendeesFilters,
                        validCall: tabValue === "history" ? "Worked" : "Pending",
                        assignmentType: "Assigned",
                        assignmentStatus: AssignmentStatus.ACTIVE,
                        tag,
                      });
                    }}
                    isLoading={isApplyingTags}
                  />
                </Suspense>,
                document.body
              )}
          </>
        )}
      </div>
    </div>
  );
};

export default ViewEmployee;
