import React, {
  useEffect,
  useState,
  useLayoutEffect,
  useMemo,
  useRef,
} from "react";
import { useSearchParams, useNavigate, useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  Tabs,
  Tab,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";
import CancelIcon from "@mui/icons-material/Cancel";
import { attendeeTableColumns } from "../../utils/columnData";
import DataTable from "../../components/Table/DataTable";
import {
  cancelRequestReAssignment,
  getAssignments,
  getAssignmentsSilently,
  getLeadType,
  requestReAssignment,
} from "../../features/actions/assign";
import AttendeesFilterModal from "../../components/Attendees/AttendeesFilterModal";
import { getEmployeeWebinars } from "../../features/actions/webinarContact";
import {
  resetAssignedData,
  resetAssignSuccess,
} from "../../features/slices/assign";
import useAddUserActivity from "../../hooks/useAddUserActivity";
import {
  AssignmentStatus,
  errorToast,
  formatDateAsNumber,
  NotifActionType,
} from "../../utils/extra";
import { socket } from "../../socket";
import RequestReassignmentModal from "./ReAssigmentModal";
import { createPortal } from "react-dom";
import useRoles from "../../hooks/useRoles";
import { setWebinarAttendeesFilters } from "../../features/slices/filters.slice";
import { VisibilityIcon, RedCrossIcon } from "../../components/SVGs";
import { clearWebinarData } from "../../features/slices/webinarContact";
import { globalButton } from "../../utils/style";
import ApplyTagsModal from "../../components/Webinar/ApplyTagsModal";
import { useApplyTagsToEmployeeAssignments } from "../../hooks/useTags";

const Assignments = () => {
  const employeeId = useParams()?.id;
  const navigate = useNavigate();
  const addUserActivity = useAddUserActivity();
  const roles = useRoles();

  // ----------------------- ModalNames for Redux -----------------------
  const filterModalName = "ViewAssignmentsFilterModal";
  const tableHeader = "Assignments Table";
  const exportExcelModalName = "ExportViewAssignmentsExcel";
  // ----------------------- etcetra -----------------------
  const dispatch = useDispatch();

  const [selectedRows, setSelectedRows] = useState([]);

  const { userData, subscription } = useSelector((state) => state.auth);

  const semething =
    roles.getRoleNameById(userData?.role) === "EMPLOYEE SALES"
      ? "postWebinar"
      : "preWebinar";
  console.log("sdfsdf", semething);

  const assignmentMetrics = subscription?.plan?.assignmentMetrics || false;
  const { assignData, isLoading, isSuccess, pagination, leadTypeData } =
    useSelector((state) => state.assign);
  const { total = 0, totalPages = 1 } = pagination;

  const { webinarData } = useSelector((state) => state.webinarContact);
  const LIMIT = useSelector((state) => state.pageLimits[tableHeader] || 10);
  const modalState = useSelector((state) => state.modals.modals);
  const filterModalOpen = modalState[filterModalName] ? true : false;
  const resetFilterRef = useRef(false);

  const [searchParams, setSearchParams] = useSearchParams();
  const [page, setPage] = useState(Number(searchParams.get("page")) || 1);
  const {
    webinarAttendeesSortBy,
    webinarAttendeesFilters,
    salesAttendeesSortBy,
  } = useSelector((state) => state.filters);

  const sortByOption =
    semething === "preWebinar" ? webinarAttendeesSortBy : salesAttendeesSortBy;

  const [currentWebinar, setCurrentWebinar] = useState(
    searchParams.get("webinarId") || ""
  );
  const [selected, setSelected] = useState(
    searchParams.get("activity") || "Pending"
  );
  const [tabValue, setTabValue] = useState(
    searchParams.get("tabValue") || AssignmentStatus.ACTIVE
  );
  const [openReassignModal, setOpenReassignModal] = useState(false);
  const [notAllowedColumns, setNotAllowedColumns] = useState([
    "enrollments",
    "isAssigned",
  ]);
  const [applyTagsModalOpen, setApplyTagsModalOpen] = useState(false);

  useEffect(() => {
    const currentParams = Object.fromEntries([...searchParams.entries()]);

    const newParams = {
      page: page,
      webinarId: currentWebinar,
      tabValue: tabValue,
      activity: selected,
    };

    let isDifferent = false;
    for (const key in newParams) {
      if (String(newParams[key] || "") !== String(currentParams[key] || "")) {
        isDifferent = true;
        break;
      }
    }

    if (isDifferent) {
      const paramsToSet = {};
      for (const key in newParams) {
        if (newParams[key]) {
          paramsToSet[key] = newParams[key];
        }
      }
      setSearchParams(paramsToSet, { replace: true });
    }
  }, [page, currentWebinar, tabValue, selected, searchParams, setSearchParams]);

  useEffect(() => {
    if (currentWebinar) {
      dispatch(
        getAssignments({
          id: employeeId || userData?._id,
          page,
          limit: LIMIT,
          filters: webinarAttendeesFilters,
          sort: sortByOption,
          webinarId: currentWebinar,
          validCall:
            selected === "All" || tabValue !== AssignmentStatus.ACTIVE
              ? undefined
              : selected,
          assignmentStatus: tabValue,
        })
      );
    }
  }, [
    page,
    LIMIT,
    webinarAttendeesFilters,
    selected,
    tabValue,
    currentWebinar,
  ]);

  useEffect(() => {
    if (isSuccess) {
      setSelectedRows([]);
      setOpenReassignModal(false);
      dispatch(resetAssignSuccess());
      if (totalPages > 1 && currentWebinar)
        console.log("333333333333333 ---> ");

      dispatch(
        getAssignments({
          id: employeeId || userData?._id,
          page: 1,
          limit: LIMIT,
          filters: webinarAttendeesFilters,
          sort: sortByOption,
          webinarId: currentWebinar,
          validCall: selected === "All" ? undefined : selected,
          assignmentStatus: tabValue,
        })
      );
    }
  }, [isSuccess]);

  useLayoutEffect(() => {
    dispatch(getEmployeeWebinars({ employeeId }));
    dispatch(getLeadType());
    return () => {
      dispatch(resetAssignedData());
      console.log("resetting data", resetFilterRef.current);
      if (!resetFilterRef.current) {
        dispatch(setWebinarAttendeesFilters());
      }
      dispatch(clearWebinarData());
    };
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

  useEffect(() => {
    function onNotification(data) {
      if (
        currentWebinar &&
        (data.actionType === NotifActionType.ASSIGNMENT ||
          data.actionType === NotifActionType.REASSIGNMENT)
      )
        if (page === 1) {
          dispatch(
            getAssignmentsSilently({
              id: employeeId || userData?._id,
              page: 1,
              limit: LIMIT,
              filters: webinarAttendeesFilters,
              sort: sortByOption,
              webinarId: currentWebinar,
              validCall: selected === "All" ? undefined : selected,
              assignmentStatus: tabValue,
            })
          );
        } else setPage(1);

      if (data.actionType === NotifActionType.WEBINAR_ASSIGNMENT) {
        dispatch(getEmployeeWebinars({ employeeId }));
      }
    }
    socket.on("notification", onNotification);
    return () => {
      socket.off("notification", onNotification);
    };
  }, [
    page,
    LIMIT,
    webinarAttendeesFilters,
    selected,
    tabValue,
    currentWebinar,
  ]);

  useEffect(() => {
    const isExist = notAllowedColumns.some(
      (column) => column === "timeInSession"
    );

    console.log(roles.getRoleNameById(userData?.role), isExist);

    if (roles.getRoleNameById(userData?.role) === "EMPLOYEE SALES" && isExist) {
      setNotAllowedColumns((prevColumns) =>
        prevColumns.filter((column) => column !== "timeInSession")
      );
    } else if (
      roles.getRoleNameById(userData?.role) === "EMPLOYEE REMINDER" &&
      !isExist
    ) {
      setNotAllowedColumns((prevColumns) => [...prevColumns, "timeInSession"]);
    }
  }, [roles, userData]);

  const handleViewFullDetails = (item) => {
    resetFilterRef.current = true;
    const recordType = item?.isAttended ? "postWebinar" : "preWebinar";
    navigate(
      `/particularContact?email=${item?.email}&attendeeId=${item?.attendeeId}`
    );
    addUserActivity({
      action: "viewDetails",
      details: `User viewed details of Attendee with Email: ${item?.email} and Record Type: ${recordType}`,
    });
  };

  const handleReassignRequest = (requestReason) => {
    if (selectedRows.length === 0) return;

    const attendeeEmails = assignData
      .filter((row) => selectedRows.includes(row._id))
      .map((a) => a.email);

    dispatch(
      requestReAssignment({
        assignments: selectedRows,
        attendeeEmails: attendeeEmails,
        webinarId: currentWebinar,
        requestReason,
      })
    );
  };

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

  const targetEmployeeId = employeeId || userData?._id;

  const {
    mutateAsync: applyTagsForEmployee,
    isPending: isApplyingTags,
  } = useApplyTagsToEmployeeAssignments(targetEmployeeId, () => {
    // After tagging, refetch assignments
    if (currentWebinar) {
      dispatch(
        getAssignments({
          id: targetEmployeeId,
          page: 1,
          limit: LIMIT,
          filters: webinarAttendeesFilters,
          sort: sortByOption,
          webinarId: currentWebinar,
          validCall:
            selected === "All" || tabValue !== AssignmentStatus.ACTIVE
              ? undefined
              : selected,
          assignmentStatus: tabValue,
        })
      );
    }
    setApplyTagsModalOpen(false);
  });

  // ----------------------- Action Icons -----------------------

  const actionIcons = useMemo(() => {
    const icons = [
      {
        icon: () => (
          <img
            src={VisibilityIcon}
            alt="Bookmark"
            className="min-h-6 h-6 w-6 min-w-6"
          />
        ),
        tooltip: "View Attendee Info",
        type: "attendee-link",
      },
      ...(tabValue === AssignmentStatus.ACTIVE
        ? []
        : [
            {
              icon: () => (
                <CancelIcon className="text-red-500 group-hover:text-red-600" />
              ),
              tooltip: "Cancel Re-Assignment Request",
              onClick: (item) => {
                dispatch(
                  cancelRequestReAssignment({
                    assignments: [item._id],
                    attendeeEmails: [item?.email],
                    webinarId: item?.webinar,
                    requestReason: "cancelled",
                  })
                );
              },
            },
          ]),
    ];

    return icons;
  }, [tabValue]);

  const AttendeeDropdown = () => {
    const handleChange = (event) => {
      const label = event.target.value;
      setSelected(label);
      setPage(1);
      setSelectedRows([]);
    };
    if (tabValue !== AssignmentStatus.ACTIVE) return null;
    return (
      <FormControl className="w-40 " variant="outlined">
        <InputLabel id="attendee-label">Activity</InputLabel>
        <Select
          labelId="attendee-label"
          className="h-10"
          value={selected}
          onChange={handleChange}
          label="Activity"
        >
          <MenuItem value="All">All</MenuItem>
          <MenuItem value="Worked">Worked</MenuItem>
          <MenuItem value="Pending">Pending</MenuItem>
        </Select>
      </FormControl>
    );
  };
  return (
    <div className=" md:px-10 pt-10 ">
      <Tabs
        value={tabValue}
        onChange={(e, newValue) => {
          setSelectedRows([]);
          setTabValue(newValue);
        }}
        centered
        className="border-b border-gray-200"
        textColor="primary"
        indicatorColor="primary"
      >
        <Tab
          label="Assignments"
          value={AssignmentStatus.ACTIVE}
          className="text-gray-600"
        />
        <Tab
          label="ReAssignments"
          value={AssignmentStatus.REASSIGN_REQUESTED}
          className="text-gray-600"
        />
      </Tabs>

      <div
        className={`flex items-center my-6 gap-4 flex-wrap px-2 justify-between`}
      >
        <div className="flex items-center gap-4">
          {userData?.isActive && assignmentMetrics && (
            <button
              onClick={() => {
                resetFilterRef.current = true;
                navigate(`/assignment-metrics`);
              }}
              className={globalButton}
            >
              Assign Metrics
            </button>
          )}

          {userData?.isActive && tabValue === AssignmentStatus.ACTIVE && (
            <button
              className={globalButton}
              onClick={() => setApplyTagsModalOpen(true)}
            >
              Apply Tags
            </button>
          )}

          {selectedRows.length > 0 &&
            userData?.isActive &&
            tabValue === AssignmentStatus.ACTIVE && (
              <button
                onClick={() => {
                  if (currentWebinar === "all") {
                    errorToast("Please Select a Webinar First");
                    return;
                  }
                  setOpenReassignModal(true);
                }}
                className={globalButton}
              >
                Request ReAssignment
              </button>
            )}
        </div>
        <FormControl className="md:w-60 w-full">
          <InputLabel id="webinar-label">Webinar</InputLabel>
          <Select
            labelId="webinar-label"
            label="Webinar"
            value={currentWebinar}
            onChange={(e) => {
              setCurrentWebinar(e.target.value);
              setPage(1);
              setSelectedRows([]);

              dispatch(setWebinarAttendeesFilters());
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
      </div>

      <DataTable
        tableHeader={tableHeader}
        tableUniqueKey="viewAssignmentsTable"
        buttonGroupContent={<AttendeeDropdown />}
        isSelectVisible={
          (employeeId || !userData?.isActive ? false : true) &&
          tabValue === AssignmentStatus.ACTIVE
        }
        filters={webinarAttendeesFilters}
        setFilters={(filters) => {
          dispatch(
            setWebinarAttendeesFilters({
              filters: filters,
            })
          );
        }}
        tableData={tableData}
        actions={actionIcons}
        totalPages={totalPages}
        page={page}
        setPage={setPage}
        selectedRows={selectedRows}
        setSelectedRows={setSelectedRows}
        limit={LIMIT}
        filterModalName={filterModalName}
        exportModalName={exportExcelModalName}
        isLoading={isLoading}
        isLeadType={true}
      />

      {filterModalOpen && (
        <AttendeesFilterModal
          notAllowed={notAllowedColumns}
          modalName={filterModalName}
          setPage={setPage}
          label="Assignments Filter"
          tabValue={semething}
          onTrigger={() => {
            console.log("trigger is triggering -------  > ");
            setSelected("All");
          }}
        />
      )}
      {openReassignModal &&
        createPortal(
          <RequestReassignmentModal
            onClose={() => setOpenReassignModal(false)}
            onSubmit={(reason) => handleReassignRequest(reason)}
          />,
          document.body
        )}
      {applyTagsModalOpen &&
        createPortal(
          <ApplyTagsModal
            onClose={() => setApplyTagsModalOpen(false)}
            onSubmit={async (tag) => {
              const normalizedWebinarId =
                currentWebinar && currentWebinar !== "all"
                  ? currentWebinar
                  : undefined;

              await applyTagsForEmployee({
                webinarId: normalizedWebinarId,
                filters: webinarAttendeesFilters,
                validCall:
                  selected === "All" || tabValue !== AssignmentStatus.ACTIVE
                    ? undefined
                    : selected,
                assignmentStatus: tabValue,
                tag,
              });
            }}
            isLoading={isApplyingTags}
          />,
          document.body
        )}
    </div>
  );
};

export default Assignments;
