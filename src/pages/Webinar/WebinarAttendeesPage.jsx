import React, {
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import Select from "@mui/material/Select";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import {
  clearAttendeeData,
  clearSuccess,
} from "../../features/slices/attendees";
import {
  deleteWebinarAttendees,
  getAttendees,
  getAttendeesSilently,
  swapAttendeeFields,
} from "../../features/actions/attendees";
import { attendeeTableColumns } from "../../utils/columnData";
import DataTable from "../../components/Table/DataTable";
const AttendeesFilterModal = lazy(() =>
  import("../../components/Attendees/AttendeesFilterModal")
);
import { resetReAssignSuccess } from "../../features/slices/reAssign.slice";
import { resetAssignSuccess } from "../../features/slices/assign";
const ExportWebinarAttendeesModal = lazy(() =>
  import("../../components/Export/ExportWebinarAttendeesModal")
);
const SwapAttendeeFieldsModal = lazy(() =>
  import("../../components/Webinar/SwapAttendeeFieldsModal")
);
const ApplyTagsModal = lazy(() =>
  import("../../components/Webinar/ApplyTagsModal")
);
const BulkEnrollmentModal = lazy(() =>
  import("../../components/Webinar/BulkEnrollmentModal")
);
import { createPortal } from "react-dom";
import ModalFallback from "../../components/Fallback/ModalFallback";
import { setWebinarAttendeesFilters } from "../../features/slices/filters.slice";
import { flattenObjectForURLSearchParams, NotifActionType, successToast } from "../../utils/extra";
import { socket } from "../../socket";
import DeleteIcon from "../../components/SVGs/red-bin.svg";
import ConfirmDeleteModal from "../../components/ConfirmDeleteModal";
import { VisibilityIcon } from "../../components/SVGs";
import { clearWebinarData } from "../../features/slices/webinarContact";
import { baseURL } from "../../services/axiosInterceptor";
import { getTagsData, setTagsData } from "../../features/slices/globalData";
import tagsService from "../../services/tagsService";
import { useBulkApplyTagsByFilters } from "../../hooks/useTags";

const WebinarAttendeesPage = (props) => {
  const {
    tabValue,
    page,
    setPage,
    userData,
    isSwapOpen,
    setSwapOpen,
    subTabValue,
    selectedRows,
    setSelectedRows,
    setSelectedAssignmentType,
    selectedAssignmentType,
    applyTagsModalOpen,
    setApplyTagsModalOpen,
    bulkEnrollOpen,
    setBulkEnrollOpen,
  } = props;

  const tableHeader = "Attendees Table";
  const exportExcelModalName = "ExportWebinarAttendeesExcel";
  const AttendeesFilterModalName = "AttendeesFilterModal";

  const modalState = useSelector((state) => state.modals.modals);
  const exportModalOpen = modalState[exportExcelModalName] ? true : false;
  const AttendeesFilterModalOpen = modalState[AttendeesFilterModalName]
    ? true
    : false;

  // ------------------------------------------------------------------

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { id } = useParams();

  const { globalLocationsData } = useSelector((state) => state.location);

  const {
    attendeeData,
    isLoading,
    pagination,
    isSuccess,
    isDeleting,
    webinarName,
  } = useSelector((state) => state.attendee);
  const { total = 0, totalPages = 1 } = pagination;

  const { isSuccess: isSuccessReAssign } = useSelector(
    (state) => state.reAssign
  );
  const { leadTypeData, isSuccess: assignSuccess } = useSelector(
    (state) => state.assign
  );
  const LIMIT = useSelector((state) => state.pageLimits[tableHeader] || 10);

  const [selected, setSelected] = useState("All");
  const [deleteModal, setDeleteModal] = useState(false);

  const {
    webinarAttendeesSortBy,
    webinarAttendeesFilters,
    salesAttendeesSortBy,
  } = useSelector((state) => state.filters);

  const sortByOption = useMemo(
    () =>
      tabValue === "preWebinar" ? webinarAttendeesSortBy : salesAttendeesSortBy,
    [tabValue, webinarAttendeesSortBy, salesAttendeesSortBy]
  );

  const notAllowedFields = useMemo(
    () =>
      tabValue === "preWebinar"
        ? ["assignmentDate", "timeInSession"]
        : ["assignmentDate"],
    [tabValue]
  );

  useEffect(() => {
    return () => {
      dispatch(clearWebinarData());
      dispatch(clearAttendeeData());
    };
  }, [tabValue]);

  const tagsData = useSelector(getTagsData);

  const { mutateAsync: applyTagsByFilters, isPending: isApplyingTags,  } =
    useBulkApplyTagsByFilters(() => {
      // After successful tagging, refetch attendees for first page
      dispatch(
        getAttendees({
          id,
          isAttended: tabValue === "postWebinar",
          filters: webinarAttendeesFilters,
          validCall: selected === "All" ? undefined : selected,
          assignmentType:
            selectedAssignmentType === "All"
              ? undefined
              : selectedAssignmentType,
          sort: sortByOption,
          page: 1,
          limit: LIMIT,
        })
      );
      // Close the Apply Tags dialog
      setApplyTagsModalOpen(false);
    });

  useEffect(() => {
    // Fetch tags if not already loaded
    if (!tagsData || tagsData.length === 0) {
      tagsService.getTags().then((res) => {
        if (res.success) {
          dispatch(setTagsData(res.data));
        }
      });
    }
  }, [dispatch, tagsData]);

  useEffect(() => {
    if (tabValue !== "enrollments" && subTabValue === "attendees") {
      setSelectedRows([]);
      dispatch(
        getAttendees({
          id,
          isAttended: tabValue === "postWebinar",
          page,
          limit: LIMIT,
          filters: webinarAttendeesFilters,
          validCall: selected === "All" ? undefined : selected,
          assignmentType:
            selectedAssignmentType === "All"
              ? undefined
              : selectedAssignmentType,
          sort: sortByOption,
        })
      );
    }
  }, [
    page,
    tabValue,
    LIMIT,
    webinarAttendeesFilters,
    selected,
    selectedAssignmentType,
    sortByOption,
  ]);

  useEffect(() => {
    if (isSuccess || assignSuccess || isSuccessReAssign) {
      dispatch(
        getAttendees({
          id,
          isAttended: tabValue === "postWebinar",
          filters: webinarAttendeesFilters,
          validCall: selected === "All" ? undefined : selected,
          assignmentType:
            selectedAssignmentType === "All"
              ? undefined
              : selectedAssignmentType,
          sort: sortByOption,
          page: 1,
          limit: LIMIT,
        })
      );
      dispatch(clearSuccess());
      dispatch(resetReAssignSuccess());
      dispatch(resetAssignSuccess());
      setDeleteModal(false);
      setApplyTagsModalOpen(false);
      setSelectedRows([]);
    }
  }, [isSuccess, assignSuccess, isSuccessReAssign, sortByOption]);

  useEffect(() => {
    function onNotification(data) {
      if (data.actionType === NotifActionType.ATTENDEE_REGISTRATION) {
        if (tabValue !== "enrollments" && subTabValue === "attendees") {
          dispatch(
            getAttendeesSilently({
              id,
              isAttended: tabValue === "postWebinar",
              page,
              limit: LIMIT,
              filters: webinarAttendeesFilters,
              validCall: selected === "All" ? undefined : selected,
              assignmentType:
                selectedAssignmentType === "All"
                  ? undefined
                  : selectedAssignmentType,
              sort: sortByOption,
            })
          );
        }
      }
    }
    socket.on("notification", onNotification);
    return () => {
      socket.off("notification", onNotification);
    };
  }, [
    page,
    tabValue,
    LIMIT,
    webinarAttendeesFilters,
    selected,
    selectedAssignmentType,
    sortByOption,
  ]);

  const actionIcons = useMemo(
    () => [
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
          navigate(
            `/particularContact?email=${item?.email}&attendeeId=${item?._id}`
          );
        },
      },
      {
        icon: () => (
          <img
            src={DeleteIcon}
            alt="Edit"
            className="min-h-6 h-6 w-6 min-w-6"
          />
        ),
        tooltip: "Delete Attendee Info",
        onClick: (item) => {
          setDeleteModal(item);
        },
      },
    ],
    [navigate]
  );

  const tableData = useMemo(() => {
    return {
      columns:
        tabValue === "postWebinar"
          ? attendeeTableColumns
          : attendeeTableColumns.filter((item) => item.key !== "timeInSession"),
      totalRecords: total,
      rows: attendeeData.map((row) => ({
        ...row,
        leadType: leadTypeData.find((lead) => lead._id === row?.leadType),
      })),
    };
  }, [attendeeData, leadTypeData, tabValue, total]);

  const handleColumnSwap = (field1, field2) => {
    dispatch(
      swapAttendeeFields({
        attendees: selectedRows,
        field1,
        field2,
        webinarId: id,
        isAttended: tabValue === "postWebinar",
        filters: webinarAttendeesFilters,
        validCall: selected === "All" ? undefined : selected,
        assignmentType:
          selectedAssignmentType === "All" ? undefined : selectedAssignmentType,
      })
    ).then((res) => {
      res?.meta?.requestStatus === "fulfilled" && setSelectedRows([]);
    });
  };

  const AttendeeDropdown = () => {
    const handleChange = (event) => {
      const label = event.target.value;
      setSelected(label);
      setPage(1);
    };
    const handleAssignmentChange = (event) => {
      const label = event.target.value;
      setSelectedRows([]);
      setSelectedAssignmentType(label);
      setPage(1);
    };

    return (
      <div className="md:flex gap-4 grid grid-cols-2">
        <FormControl className="md:w-40 " variant="outlined">
          <InputLabel id="activity-label">Activity</InputLabel>
          <Select
            labelId="activity-label"
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

        <FormControl className="md:w-40 " variant="outlined">
          <InputLabel id="assignment-label">Assignment</InputLabel>
          <Select
            labelId="assignment-label"
            className="h-10"
            value={selectedAssignmentType}
            onChange={handleAssignmentChange}
            label="Assignment"
          >
            <MenuItem value="All">All</MenuItem>
            <MenuItem value="Assigned">Assigned</MenuItem>
            <MenuItem value="Not Assigned"> Not Assigned</MenuItem>
          </Select>
        </FormControl>
      </div>
    );
  };

// --- 3. Refactored `useCallback` Hook
const handleCopy = useCallback(
  /**
   * Constructs a webinar attendees URL with various filters using bracket notation,
   * and copies the generated URL to the clipboard.
   * @param {Object} [additionalFilters={}] - Optional additional filter parameters (can be nested).
   */
  (additionalFilters = {}) => {
    // console.log("Additional filters received:", additionalFilters); // For debugging

    // Ensure constants are accessible (e.g., imported or defined nearby)
    const WEBINAR_ATTENDEES_ENDPOINT = '/attendees/webinar'; // Example, ideally imported
    const TAB_VALUE_POST_WEBINAR = 'postWebinar';         // Example, ideally imported
    const OPTION_ALL = 'All';                             // Example, ideally imported

    // Construct the main object containing all parameters, including nested ones.
    // This object will be flattened by `flattenObjectForURLSearchParams`.
    const allQueryParams = {
      isAttended: tabValue === TAB_VALUE_POST_WEBINAR,
      page,
      limit: LIMIT,
      filters: additionalFilters, // The nested filters object passed into handleCopy
      validCall: selected === OPTION_ALL ? undefined : selected, // Will be filtered if undefined
      assignmentType: selectedAssignmentType === OPTION_ALL ? undefined : selectedAssignmentType, // Will be filtered if undefined
      sort: sortByOption, // Assuming sortByOption is an object like `{ sortBy: 'email', sortOrder: 'asc' }`
                         // If sortByOption can be `undefined` or `{}` it will be handled by `flattenObjectForURLSearchParams`.
      webinarId: id,
      // Add `fieldName` if it's a dynamic variable in your scope that should be part of the URL.
      // E.g., fieldName: dynamicFieldNameVar,
    };

    // Flatten the entire `allQueryParams` object into a list of `[key, value]` pairs
    // using bracket notation. This handles nesting and automatically filters out unwanted values.
    const flattenedParams = flattenObjectForURLSearchParams(allQueryParams);

    // Create URLSearchParams from the flattened array.
    // This will correctly encode all keys (e.g., `filters[email]`) and values.
    const queryString = new URLSearchParams(flattenedParams).toString();

    // Ensure baseURL ends with a slash or WEBINAR_ATTENDEES_ENDPOINT starts with one.
    // Example: "http://localhost:3001/api/v1" + "/attendees/webinar" -> "http://localhost:3001/api/v1/attendees/webinar"
    const finalURL = `${baseURL.replace(/\/$/, '')}${WEBINAR_ATTENDEES_ENDPOINT}?${queryString}&fieldName=attendeeTableConfig&accessToken=<BEARER_TOKEN>`;

    // Copy to clipboard
    navigator.clipboard.writeText(finalURL)
      .then(() => {
        // Assume successToast is a function available in your component's scope
        successToast("Copied to clipboard!");
      })
      .catch(err => {
        console.error("Failed to copy URL to clipboard: ", err);
        // Provide user feedback for errors (e.g., using an errorToast function if available)
        // if (errorToast) {
        //   errorToast("Failed to copy URL to clipboard. Please try again.");
        // }
      });
  },
  [
    id,
    tabValue,
    page,
    LIMIT,
    selected,
    selectedAssignmentType,
    sortByOption, // Crucial dependency as it's now directly flattened
    baseURL,
    // If `successToast` or `errorToast` are functions that can change or are memoized themselves,
    // they should be included in the dependency array.
    // successToast,
    // errorToast,
    // If `fieldName` is a variable used above, include it here:
    // dynamicFieldNameVar,
  ]
);


  const handleApplyTag = useCallback(
    async (tag) => {
      await applyTagsByFilters({
        webinarId: id,
        isAttended: tabValue === "postWebinar",
        filters: webinarAttendeesFilters,
        validCall: selected === "All" ? undefined : selected,
        assignmentType:
          selectedAssignmentType === "All" ? undefined : selectedAssignmentType,
        tag,
      });
    },
    [
      applyTagsByFilters,
      id,
      tabValue,
      webinarAttendeesFilters,
      selected,
      selectedAssignmentType,
      LIMIT,
      sortByOption,
      dispatch,
    ]
  );

  const handleBulkEnrollSuccess = useCallback(() => {
    dispatch(
      getAttendees({
        id,
        isAttended: tabValue === "postWebinar",
        filters: webinarAttendeesFilters,
        validCall: selected === "All" ? undefined : selected,
        assignmentType:
          selectedAssignmentType === "All"
            ? undefined
            : selectedAssignmentType,
        sort: sortByOption,
        page: 1,
        limit: LIMIT,
      })
    );
  }, [
    dispatch,
    id,
    tabValue,
    webinarAttendeesFilters,
    selected,
    selectedAssignmentType,
    sortByOption,
    LIMIT,
  ]);

  const attendeeDropdownElement = useMemo(() => {
    return <AttendeeDropdown />;
  }, [selected, selectedAssignmentType]);

  return (
    <>
      <DataTable
        tableHeader={tableHeader}
        tableUniqueKey="webinarAttendeesTable"
        buttonGroupContent={attendeeDropdownElement}
        isSelectVisible={userData?.isActive}
        sortByOrder={sortByOption?.sortOrder}
        tableData={tableData}
        actions={actionIcons}
        totalPages={totalPages}
        page={page}
        setPage={setPage}
        selectedRows={selectedRows}
        setSelectedRows={setSelectedRows}
        limit={LIMIT}
        filterModalName={AttendeesFilterModalName}
        exportModalName={exportExcelModalName}
        isLoading={isLoading}
        isLeadType={true}
        filters={webinarAttendeesFilters}
        setFilters={(filters) => {
          dispatch(
            setWebinarAttendeesFilters({
              filters: filters,
            })
          );
        }}
        locations={globalLocationsData}
      />

      {AttendeesFilterModalOpen && (
        <Suspense fallback={<ModalFallback />}>
          <AttendeesFilterModal
            modalName={AttendeesFilterModalName}
            setPage={setPage}
            tabValue={tabValue}
            notAllowed={notAllowedFields}
            handleCopy={handleCopy}
          />
        </Suspense>
      )}

      {exportModalOpen && (
        <Suspense fallback={<ModalFallback />}>
          <ExportWebinarAttendeesModal
            modalName={exportExcelModalName}
            filters={webinarAttendeesFilters}
            sort={sortByOption}
            webinarId={id}
            webinarName={webinarName}
            isAttended={tabValue === "postWebinar" ? true : false}
            validCall={selected === "All" ? undefined : selected}
            assignmentType={
              selectedAssignmentType === "All"
                ? undefined
                : selectedAssignmentType
            }
          />
        </Suspense>
      )}

      {isSwapOpen &&
        createPortal(
          <Suspense fallback={<ModalFallback />}>
            <SwapAttendeeFieldsModal
              onClose={() => setSwapOpen(false)}
              onSubmit={handleColumnSwap}
            />
          </Suspense>,
          document.body
        )}

      {deleteModal &&
        createPortal(
          <Suspense fallback={<ModalFallback />}>
            <ConfirmDeleteModal
              setModal={setDeleteModal}
              triggerDelete={() =>
                dispatch(
                  deleteWebinarAttendees({
                    attendees: [deleteModal?._id],
                    webinarId: id,
                  })
                )
              }
              isLoading={isDeleting}
            />
          </Suspense>,
          document.body
        )}

      {applyTagsModalOpen &&
        createPortal(
          <Suspense fallback={<ModalFallback />}>
            <ApplyTagsModal
              onClose={() => setApplyTagsModalOpen(false)}
              onSubmit={handleApplyTag}
              isLoading={isApplyingTags}
            />
          </Suspense>,
          document.body
        )}

      {bulkEnrollOpen &&
        createPortal(
          <Suspense fallback={<ModalFallback />}>
            <BulkEnrollmentModal
              onClose={() => setBulkEnrollOpen(false)}
              webinarId={id}
              isAttended={tabValue === "postWebinar"}
              selectedRows={selectedRows}
              total={total}
              filters={webinarAttendeesFilters}
              validCall={selected === "All" ? undefined : selected}
              assignmentType={
                selectedAssignmentType === "All"
                  ? undefined
                  : selectedAssignmentType
              }
              onSuccess={handleBulkEnrollSuccess}
            />
          </Suspense>,
          document.body
        )}
    </>
  );
};

export default WebinarAttendeesPage;
