import {
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { webinarTableColumns } from "../../utils/columnData";
import { openModal } from "../../features/slices/modalSlice";
import CreateWebinar from "../../components/Webinar/CreateWebinar";
import WebinarLimitModal from "../../components/Webinar/WebinarLimitModal";
import DeleteModal from "../../components/Webinar/delete";
import {
  getAllWebinarsForPage,
  getAllWebinarsSilently,
} from "../../features/actions/webinarContact";
import useAddUserActivity from "../../hooks/useAddUserActivity";
import {
  clearWebinarPageData,
  clearWebinarError,
  resetWebinarSuccess,
} from "../../features/slices/webinarContact";
const WebinarFilterModal = lazy(() =>
  import("../../components/Filter/WebinarFilterModal")
);
const ExportModal = lazy(() => import("../../components/Export/ExportModal"));
import { exportWebinarExcel } from "../../features/actions/export-excel";
import { DateFormat, NotifActionType, successToast } from "../../utils/extra";
import { createPortal } from "react-dom";
import { socket } from "../../socket";
import ModalFallback from "../../components/Fallback/ModalFallback";
import FilterPresetModal from "../../components/Filter/FilterPresetModal";
import useUserSubscription from "../../hooks/useUserSubscription";
import WebinarTableShell from "../../components/Webinar/WebinarTableShell";

const Webinar = () => {
  const [sortField, setSortField] = useState(null);
  const [sortDirection, setSortDirection] = useState(null);

  // ----------------------- ModalNames for Redux -----------------------
  const exportModalName = "ExportFilterModal";
  const filterModalName = "WebinarFilterModal";
  const tableHeader = "Webinar Table";
  const createWebinarModalName = "createWebinarModal";

  // ----------------------- etcetra -----------------------
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const logUserActivity = useAddUserActivity();

  const { isLoading, isSuccess, webinarPageData, pagination } = useSelector(
    (state) => state.webinarContact
  );
  const { errorMessage } = useSelector((state) => state.webinarContact);

  const { totalPages = 1, total = 0 } = pagination;

  const { userData } = useSelector((state) => state.auth);
  const { data: subscription } = useUserSubscription();
  const assignmentMetrics = subscription?.plan?.assignmentMetrics || false;
  const dateFormat = userData?.dateFormat || DateFormat.DD_MM_YYYY;

  const [showWebinarLimitModal, setShowWebinarLimitModal] = useState(false);
  const baseWebinarLimit =
    Number(subscription?.webinarLimit ?? subscription?.plan?.webinarLimit ?? 0)
      || 0;
  const webinarLimitAddon = Number(subscription?.webinarLimitAddon ?? 0);
  const webinarLimit = baseWebinarLimit + webinarLimitAddon;
  const isWebinarLimitExceeded =
    webinarLimit > 0 && Number(total || 0) >= webinarLimit;

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [id, setId] = useState();
  const [webinarName, setWebinarName] = useState(null);

  const handleDeleteModal = (ID, name) => {
    setShowDeleteModal(true);
    setId(ID);
    setWebinarName(name);
  };

  const LIMIT = useSelector((state) => state.pageLimits[tableHeader] || 10);
  const [searchParams, setSearchParams] = useSearchParams();
  const [page, setPage] = useState(searchParams.get("page") || 1);
  const [filters, setFilters] = useState({});

  const modalState = useSelector((state) => state.modals.modals);
  const exportModalOpen = modalState[exportModalName] ? true : false;

  const fetchWebinars = useCallback(() => {
    dispatch(getAllWebinarsForPage({ page, limit: LIMIT, filters }));
  }, [page, LIMIT, filters]);

  useEffect(() => {
    fetchWebinars();
  }, [fetchWebinars]);

  useEffect(() => {
    if (errorMessage === "Webinar Limit Exceeded") {
      setShowWebinarLimitModal(true);
      dispatch(clearWebinarError());
    }
  }, [errorMessage, dispatch]);

  useEffect(() => {
    const currentPageInUrl = searchParams.get("page");
    const newPageValue = String(page);
    if (newPageValue !== String(currentPageInUrl || "")) {
      setSearchParams({ page: newPageValue }, { replace: true });
    }
  }, [page, searchParams, setSearchParams]);

  useEffect(() => {
    if (isSuccess) {
      setShowDeleteModal(false);
      fetchWebinars();
      dispatch(resetWebinarSuccess());
    }
  }, [isSuccess, fetchWebinars]);

  useEffect(() => {
    return () => {
      dispatch(clearWebinarPageData());
    };
  }, []);

  useEffect(() => {
    function onNotification(data) {
      if (data.actionType === NotifActionType.ATTENDEE_REGISTRATION) {
        dispatch(
          getAllWebinarsSilently({ page, limit: LIMIT, filters, silent: true })
        );
      }
    }
    socket.on("notification", onNotification);
    return () => {
      socket.off("notification", onNotification);
    };
  }, [page, LIMIT, filters]);

  const handleRowClick = (row) => {
    const { _id: id, webinarName } = row;
    logUserActivity({
      action: "navigate",
      navigateType: "page",
      detailItem: `/webinarDetails/${webinarName}`,
    });
    navigate(`/webinarDetails/${id}?page=1&tabValue=&subTabValue=attendees`);
  };

  const sortedRows = useMemo(() => {
    if (!Array.isArray(webinarPageData)) return [];
    const baseRows = webinarPageData.map((row, idx) => ({
      ...row,
      __originalIndex: idx,
    }));
    if (!sortField || !sortDirection) return baseRows;

    return baseRows.sort((a, b) => {
      let aVal;
      let bVal;

      const parseWebinarDate = (value) => {
        if (!value) return 0;
        const asText = String(value).trim();

        // Handles "dd/mm/yyyy" (same behavior as frontend UI New).
        if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(asText)) {
          const [d, m, y] = asText.split("/").map(Number);
          return new Date(y, m - 1, d).getTime();
        }

        const parsed = new Date(asText).getTime();
        return Number.isNaN(parsed) ? 0 : parsed;
      };

      switch (sortField) {
        case "serial":
          aVal = total - ((Number(page) - 1) * LIMIT + a.__originalIndex);
          bVal = total - ((Number(page) - 1) * LIMIT + b.__originalIndex);
          break;
        case "name":
          aVal = String(a?.webinarName ?? "").toLowerCase();
          bVal = String(b?.webinarName ?? "").toLowerCase();
          break;
        case "date":
          aVal = parseWebinarDate(a?.webinarDate);
          bVal = parseWebinarDate(b?.webinarDate);
          break;
        case "registrations":
          aVal = Number(a?.totalRegistrations ?? 0);
          bVal = Number(b?.totalRegistrations ?? 0);
          break;
        case "participants":
          aVal = Number(a?.totalParticipants ?? 0);
          bVal = Number(b?.totalParticipants ?? 0);
          break;
        case "attendees":
          aVal = Number(a?.totalAttendees ?? 0);
          bVal = Number(b?.totalAttendees ?? 0);
          break;
        case "unAttended":
          aVal = Number(a?.totalUnAttended ?? 0);
          bVal = Number(b?.totalUnAttended ?? 0);
          break;
        default:
          return 0;
      }

      if (aVal === bVal) return 0;

      if (sortDirection === "asc") {
        return aVal > bVal ? 1 : -1;
      }
      return aVal < bVal ? 1 : -1;
    });
  }, [webinarPageData, sortField, sortDirection, total, page, LIMIT]);

  const tableData = useMemo(
    () => ({
      rows: sortedRows.map(({ __originalIndex, ...rest }) => rest),
      totalRecords: total,
    }),
    [sortedRows, total]
  );

  const handleSort = useCallback(
    (field) => {
      if (sortField === field) {
        if (sortDirection === "asc") {
          setSortDirection("desc");
        } else if (sortDirection === "desc") {
          setSortDirection(null);
          setSortField(null);
        }
      } else {
        setSortField(field);
        setSortDirection("asc");
      }
    },
    [sortField, sortDirection]
  );

  const [isPresetModalOpen, setIsPresetModalOpen] = useState(false);

  return (
    <div className="box-border min-h-full w-full min-w-0 max-w-full p-2 transition-colors duration-500 sm:p-2 lg:p-4 xl:p-6 2xl:p-8">
      <WebinarTableShell
        tableHeader={tableHeader}
        rows={tableData.rows}
        totalRecords={tableData.totalRecords}
        totalPages={totalPages}
        page={page}
        setPage={setPage}
        limit={LIMIT}
        isLoading={isLoading}
        filters={filters}
        userData={userData}
        assignmentMetrics={assignmentMetrics}
        onAssignmentMetrics={() => navigate(`/assignment-metrics`)}
        onCreateWebinar={() => {
          if (isWebinarLimitExceeded) {
            setShowWebinarLimitModal(true);
            return;
          }
          dispatch(openModal({ modalName: createWebinarModalName }));
        }}
        onExportClick={() => dispatch(openModal({ modalName: exportModalName }))}
        onPresetsClick={() => setIsPresetModalOpen(true)}
        onFiltersClick={() => dispatch(openModal(filterModalName))}
        onResetFilters={() => {
          setFilters({});
          successToast("Filters Cleared");
        }}
        onView={handleRowClick}
        onEdit={(item) =>
          dispatch(
            openModal({
              modalName: createWebinarModalName,
              data: item,
            })
          )
        }
        onDelete={(item) => handleDeleteModal(item?._id, item?.webinarName)}
        onCopy={(item) => {
          navigator.clipboard.writeText(item?._id);
          successToast("Copied to clipboard");
        }}
        logUserActivity={logUserActivity}
        sortField={sortField}
        sortDirection={sortDirection}
        onSort={handleSort}
      />

      <div>
        <Suspense fallback={<ModalFallback />}>
          <FilterPresetModal
            open={isPresetModalOpen}
            tableName={"webinarTable"}
            filters={filters}
            setFilters={(data) => {
              setPage(1);
              setFilters(data);
            }}
            setIsPresetModalOpen={setIsPresetModalOpen}
          />
        </Suspense>
      </div>
      {showDeleteModal && (
        <DeleteModal
          setModal={setShowDeleteModal}
          webinarName={webinarName}
          id={id}
        />
      )}
      {createPortal(
        <CreateWebinar modalName={createWebinarModalName} />,
        document.body
      )}
      {showWebinarLimitModal &&
        createPortal(
          <WebinarLimitModal
            onClose={() => setShowWebinarLimitModal(false)}
          />,
          document.body
        )}

      <Suspense fallback={<></>}>
        <WebinarFilterModal
          filters={filters}
          setFilters={(data) => {
            setPage(1);
            setFilters(data);
          }}
          modalName={filterModalName}
          dateFormat={dateFormat}
          sortField={sortField}
          setSortField={setSortField}
          sortDirection={sortDirection}
          setSortDirection={setSortDirection}
          onOpenPresetModal={() => setIsPresetModalOpen(true)}
        />
      </Suspense>

      {exportModalOpen && (
        <Suspense fallback={<ModalFallback />}>
          <ExportModal
            modalName={exportModalName}
            columns={webinarTableColumns}
            tableName={tableHeader}
            handleExport={({ limit, columns, includeFilter }) => {
              dispatch(
                exportWebinarExcel({
                  limit,
                  columns,
                  filters: includeFilter ? filters : {},
                })
              );
            }}
          />
        </Suspense>
      )}
    </div>
  );
};

export default Webinar;
