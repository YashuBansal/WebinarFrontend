import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  deleteAllAttendeesData,
  fetchGroupedAttendees,
  fetchGroupedAttendeesSilently,
} from "../../features/actions/attendees";
import { groupedAttendeeTableColumns } from "../../utils/columnData";
import DataTable from "../../components/Table/DataTable";
import { getLeadType } from "../../features/actions/assign";
import GroupedAttendeeFilterModal from "./Modal/GroupedAttendeeFilterModal";
import { createPortal } from "react-dom";
import { clearAttendeeData } from "../../features/slices/attendees";
import { VisibilityIcon } from "../../components/SVGs";
import { socket } from "../../socket";
import { flattenObjectForURLSearchParams, NotifActionType, successToast } from "../../utils/extra";
import DeleteIcon from "../../components/SVGs/red-bin.svg";
import ModalFallback from "../../components/Fallback/ModalFallback";
import ConfirmDeleteModal from "../../components/ConfirmDeleteModal";
import { setAllAttendeesFilters } from "../../features/slices/filters.slice";
import { clearEmployeeData } from "../../features/slices/employee";
import { getAllEmployees } from "../../features/actions/employee";
import GroupedAttendeesExportModal from "./Modal/GroupedAttendeeExportModal";
import { baseURL } from "../../services/axiosInterceptor";
import { useBulkApplyTagsToAllAttendees } from "../../hooks/useTags";
import { globalButton } from "../../utils/style";
import ApplyTagsModal from "../../components/Webinar/ApplyTagsModal";

const WebinarAttendees = () => {
  // ----------------------- ModalNames for Redux -----------------------
  const AttendeesFilterModalName = "ViewAttendeesFilterModal";
  const tableHeader = "All Attendees Table";
  const exportModalName = "ExportViewAttendeesExcel";
  // ----------------------- etcetra -----------------------
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { userData } = useSelector((state) => state.auth);
  const { leadTypeData } = useSelector((state) => state.assign);
  const { attendeeData, isLoading, pagination, isDeleting, isSuccess } =
    useSelector((state) => state.attendee);
  const { total, totalPages } = pagination;

  const { allAttendeesFilters, allAttendeesSortBy } = useSelector(
    (state) => state.filters
  );

  const { employeeData } = useSelector((state) => state.employee);

  const LIMIT = useSelector((state) => state.pageLimits[tableHeader] || 10);
  const modalState = useSelector((state) => state.modals.modals);
  const exportModalOpen = modalState[exportModalName] ? true : false;
  const AttendeesFilterModalOpen = modalState[AttendeesFilterModalName]
    ? true
    : false;

  const [searchParams, setSearchParams] = useSearchParams();
  const [page, setPage] = useState(searchParams.get("page") || 1);
  const [deleteModal, setDeleteModal] = useState(false);
  const [applyTagsModalOpen, setApplyTagsModalOpen] = useState(false);

  useEffect(() => {
    const currentPageInUrl = searchParams.get("page");
    const newPageValue = String(page);

    if (newPageValue !== String(currentPageInUrl || "")) {
      setSearchParams({ page: newPageValue }, { replace: true });
    }
  }, [page, searchParams, setSearchParams]);

  useEffect(() => {
    dispatch(
      fetchGroupedAttendees({
        page,
        limit: LIMIT,
        filters: allAttendeesFilters,
        sort: allAttendeesSortBy,
      })
    );
  }, [page, LIMIT, allAttendeesSortBy, allAttendeesFilters]);

  useEffect(() => {
    if (isSuccess) {
      dispatch(
        fetchGroupedAttendees({
          page: 1,
          limit: LIMIT,
          filters: allAttendeesFilters,
          sort: allAttendeesSortBy,
        })
      );
      setDeleteModal(false);
    }
  }, [LIMIT, allAttendeesSortBy, allAttendeesFilters, isSuccess]);

  useEffect(() => {
    function onNotification(data) {
      if (data.actionType === NotifActionType.ATTENDEE_REGISTRATION) {
        dispatch(
          fetchGroupedAttendeesSilently({
            page,
            limit: LIMIT,
            filters: allAttendeesFilters,
            sort: allAttendeesSortBy,
          })
        );
      }
    }
    socket.on("notification", onNotification);
    return () => {
      socket.off("notification", onNotification);
    };
  }, [page, LIMIT, allAttendeesSortBy, allAttendeesFilters]);

  useEffect(() => {
    dispatch(getLeadType());
    dispatch(
      getAllEmployees({ page: 1, limit: 100, filters: { isActive: "active" } })
    );
    return () => {
      console.log("this is retrning");
      dispatch(clearEmployeeData());
      dispatch(clearAttendeeData());
    };
  }, []);

  // ----------------------- Action Icons -----------------------

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
        navigate(
          `/particularContact?email=${item?._id}&attendeeId=${item?.attendeeId}`
        );
      },
    },
    {
      icon: () => (
        <img src={DeleteIcon} alt="Edit" className="min-h-6 h-6 w-6 min-w-6" />
      ),
      tooltip: "Delete Attendee Info",
      onClick: (item) => {
        setDeleteModal(item);
      },
    },
  ];

  const employees = useMemo(
    () => (Array.isArray(employeeData) ? employeeData : []),
    [employeeData]
  );

  const {
    mutateAsync: applyTagsToAllAttendees,
    isPending: isApplyingTags,
  } = useBulkApplyTagsToAllAttendees(() => {
    // After tagging, refetch grouped attendees from first page
    setPage(1);
    dispatch(
      fetchGroupedAttendees({
        page: 1,
        limit: LIMIT,
        filters: allAttendeesFilters,
        sort: allAttendeesSortBy,
      })
    );
    setApplyTagsModalOpen(false);
  });

  const handleCopy = useCallback(
    (additionalFilters = {}) => {
      const GROUPED_ATTENDEES_ENDPOINT = "/attendees/grouped";

      const allQueryParams = {
        page,
        limit: LIMIT,
        filters: additionalFilters,
        sort: allAttendeesSortBy,
      };

      const flattenedParams = flattenObjectForURLSearchParams(allQueryParams);

      const queryString = new URLSearchParams(flattenedParams).toString();

      const finalURL = `${baseURL.replace(
        /\/$/,
        ""
      )}${GROUPED_ATTENDEES_ENDPOINT}?${queryString}&fieldName=attendeeTableConfig&accessToken=<BEARER_TOKEN>`;

      // Copy to clipboard
      navigator.clipboard
        .writeText(finalURL)
        .then(() => {
          successToast("Copied to clipboard!");
        })
        .catch((err) => {
          console.error("Failed to copy URL to clipboard: ", err);
        });
    },
    [page, LIMIT, baseURL, allAttendeesSortBy]
  );

  return (
    <div className=" md:px-10 pt-14 space-y-6">
      <div className="flex justify-end">
        {userData?.isActive && (
          <button
            className={globalButton}
            onClick={() => setApplyTagsModalOpen(true)}
          >
            Apply Tags
          </button>
        )}
      </div>
      <DataTable
        employees={employees}
        tableHeader={tableHeader}
        tableUniqueKey="ViewAttendeesTable"
        tableData={{
          columns: groupedAttendeeTableColumns,
          totalRecords: total,
          rows: attendeeData.map((row) => ({
            ...row,
            leadType: leadTypeData.find((lead) => lead._id === row?.leadType),
          })),
        }}
        filters={allAttendeesFilters}
        setFilters={(filters) => {
          dispatch(
            setAllAttendeesFilters({
              filters: filters,
            })
          );
        }}
        actions={actionIcons}
        totalPages={totalPages}
        page={page}
        setPage={setPage}
        limit={LIMIT}
        filterModalName={AttendeesFilterModalName}
        exportModalName={exportModalName}
        isLoading={isLoading}
        isLeadType={true}
      />
      {AttendeesFilterModalOpen &&
        createPortal(
          <GroupedAttendeeFilterModal
            handleCopy={handleCopy}
            setPage={setPage}
            modalName={AttendeesFilterModalName}
          />,
          document.body
        )}
      {exportModalOpen &&
        createPortal(
          <GroupedAttendeesExportModal
            modalName={exportModalName}
            filters={allAttendeesFilters}
            sort={allAttendeesSortBy}
          />,
          document.body
        )}

      {deleteModal &&
        createPortal(
          <Suspense fallback={<ModalFallback />}>
            <ConfirmDeleteModal
              setModal={setDeleteModal}
              triggerDelete={() =>
                dispatch(
                  deleteAllAttendeesData({
                    attendees: [deleteModal?._id],
                  })
                )
              }
              isLoading={isDeleting}
            />
          </Suspense>,
          document.body
        )}
      {userData?.isActive && applyTagsModalOpen &&
        createPortal(
          <Suspense fallback={<ModalFallback />}>
              <ApplyTagsModal
                onClose={() => setApplyTagsModalOpen(false)}
                onSubmit={async (tag) => {
                  await applyTagsToAllAttendees({
                    filters: allAttendeesFilters,
                    sort: allAttendeesSortBy,
                    tag,
                  });
                }}
                isLoading={isApplyingTags}
              />
          </Suspense>,
          document.body
        )}
    </div>
  );
};

export default WebinarAttendees;
