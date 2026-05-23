import React, {
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { Button, Pagination } from "@mui/material";
import { webinarTableColumns } from "../../utils/columnData";
import { Edit, Delete, ContentCopy } from "@mui/icons-material";
import DataTable from "../../components/Table/DataTable";
import { openModal } from "../../features/slices/modalSlice";
import ComponentGuard from "../../components/AccessControl/ComponentGuard";
import CreateWebinar from "../../components/Webinar/CreateWebinar";
import DeleteModal from "../../components/Webinar/delete";
import {
  getAllWebinarsForPage,
  getAllWebinarsSilently,
} from "../../features/actions/webinarContact";
import useAddUserActivity from "../../hooks/useAddUserActivity";
import {
  clearWebinarData,
  clearWebinarPageData,
  resetWebinarSuccess,
} from "../../features/slices/webinarContact";
const WebinarFilterModal = lazy(
  () => import("../../components/Filter/WebinarFilterModal"),
);
const ExportModal = lazy(() => import("../../components/Export/ExportModal"));
import { exportWebinarExcel } from "../../features/actions/export-excel";
import { toast } from "sonner";
import {
  DateFormat,
  formatDateAsNumber,
  NotifActionType,
  successToast,
} from "../../utils/extra";
import { createPortal } from "react-dom";
import { socket } from "../../socket";
import ModalFallback from "../../components/Fallback/ModalFallback";
import { globalButton } from "../../utils/style";
import FilterPresetModal from "../../components/Filter/FilterPresetModal";
import PageLimitEditor from "../../components/PageLimitEditor";
import {
  GreenDownloadIcon,
  MaximizeIcon,
  MinimizeIcon,
  ThreeDotsIcon,
  BookmarkIcon,
  FilterIcon,
} from "../../components/SVGs";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "../../components/ui/dropdown-menu";
import useUserSubscription from "../../hooks/useUserSubscription";
import { useTheme } from "../../contexts/ThemeContext";

const Webinar = () => {
  // ----------------------- ModalNames for Redux -----------------------
  const exportModalName = "ExportFilterModal";
  const filterModalName = "WebinarFilterModal";
  const tableHeader = "Webinar Table";
  const createWebinarModalName = "createWebinarModal";

  // ----------------------- etcetra -----------------------
  const { isDark } = useTheme();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const logUserActivity = useAddUserActivity();

  const { isLoading, isSuccess, webinarPageData, pagination } = useSelector(
    (state) => state.webinarContact,
  );

  const { totalPages = 1, total = 0 } = pagination;

  const { userData } = useSelector((state) => state.auth);
  const { data: subscription } = useUserSubscription();
  const assignmentMetrics = subscription?.plan?.assignmentMetrics || false;
  const dateFormat = userData?.dateFormat || DateFormat.DD_MM_YYYY;

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
    const currentPageInUrl = searchParams.get("page");
    const newPageValue = String(page);
    if (newPageValue !== String(currentPageInUrl || "")) {
      setSearchParams({ page: newPageValue }, { replace: true });
    }
  }, [page, searchParams, setSearchParams]);

  useEffect(() => {
    if (isSuccess) {
      setShowDeleteModal(false);
      dispatch(getAllWebinarsForPage({ page: 1, limit: LIMIT, filters }));
      dispatch(resetWebinarSuccess());
    }
  }, [isSuccess]);

  useEffect(() => {
    return () => {
      dispatch(clearWebinarPageData());
    };
  }, []);

  useEffect(() => {
    function onNotification(data) {
      if (data.actionType === NotifActionType.ATTENDEE_REGISTRATION) {
        dispatch(
          getAllWebinarsSilently({ page, limit: LIMIT, filters, silent: true }),
        );
      }
    }
    socket.on("notification", onNotification);
    return () => {
      socket.off("notification", onNotification);
    };
  }, [page, LIMIT, filters]);

  const handleRowClick = (id, webinarName) => {
    setTimeout(() => {
      console.log("Deferring navigation via setTimeout..."); // Debug log
      navigateItBaby(id);
    }, 0);
  };

  const navigateItBaby = useCallback(
    (id) => {
      navigate(
        `/webinarDetails/${id}?tabValue=postWebinar&page=1&subTabValue=reassignrequested`,
      );
    },
    [navigate],
  );

  const tableData = useMemo(
    () => ({
      columns: webinarTableColumns,
      rows: webinarPageData,
      totalRecords: total,
    }),
    [webinarPageData, total, webinarTableColumns],
  );

  // ----------------------- Action Icons -----------------------

  const actionIcons = [
    {
      icon: () => (
        <ContentCopy className="text-blue-500 group-hover:text-blue-600" />
      ),
      tooltip: "Copy Webinar Id",
      onClick: (item) => {
        navigator.clipboard.writeText(item?._id);
        successToast("Copied to clipboard");
      },
    },
    ...(userData?.isActive
      ? [
        {
          icon: () => (
            <Edit className="text-blue-500 group-hover:text-blue-600" />
          ),
          tooltip: "Edit Attendee",
          onClick: (item) => {
            dispatch(
              openModal({
                modalName: createWebinarModalName,
                data: item,
              }),
            );
          },
        },
        {
          icon: (item) => (
            <Delete className="text-red-500 group-hover:text-red-600" />
          ),
          tooltip: "Delete Attendee",
          onClick: (item) => {
            handleDeleteModal(item?._id, item?.webinarName);
          },
        },
      ]
      : []),
  ];

  const [isMaximized, setIsMaximized] = useState(false); // State for maximize/minimize
  const [isPresetModalOpen, setIsPresetModalOpen] = useState(false);


  const toggleMaximize = () => {
    setIsMaximized((prev) => !prev);
  };

  return (
    <div className="px-6 md:px-10 pt-14 min-h-screen">
      <div className="flex flex-wrap gap-4 my-6 justify-between">
        <ComponentGuard conditions={[userData?.isActive]}>
          {assignmentMetrics && (
            <Button
              onClick={() => navigate(`/assignment-metrics`)}
              className="h-10 whitespace-nowrap"
              variant="contained"
              color="secondary"
            >
              Assignment Metrics
            </Button>
          )}
          <button
            onClick={() => dispatch(openModal(createWebinarModalName))}
            className={globalButton}
          >
            Create Webinar
          </button>
        </ComponentGuard>
        <button
          onClick={() => navigateItBaby("684fb4a94569bb80ca405479")}
          className={globalButton}
        >
          Navigate
        </button>
      </div>
      <div
        className={`transition-all duration-300 ${isMaximized
          ? "fixed top-0 left-0 inset-0 w-screen h-screen z-[100] overflow-auto p-6"
          : "relative p-6 rounded-lg"
          }`}
        style={{
          backgroundColor: isMaximized
            ? (isDark ? "#0f172a" : "#F2F4F6")
            : (isDark ? "rgba(30, 41, 59, 0.7)" : "rgba(249, 250, 251, 0.8)"),
          backdropFilter: isMaximized ? "none" : "blur(16px)",
          border: isMaximized ? "none" : `1px solid ${isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)"}`,
        }}
      >
        <div className="flex gap-4 justify-between items-center">
          <h2 className="text-2xl font-bold" style={{ color: isDark ? "#f8fafc" : "#334155" }}>{tableHeader}</h2>

          <div className="flex justify-center overflow-visible relative items-center gap-2">
            {tableData.totalRecords ? (
              <span className="font-semibold mr-2" style={{ color: isDark ? "#cbd5e1" : "#1e293b" }}>
                Total Records:{" "}
                <span className="text-indigo-500">
                  {tableData.totalRecords}
                </span>
              </span>
            ) : (
              <></>
            )}

            {/* Maximise/Minimize button is now always visible */}
            <button
              onClick={toggleMaximize}
              title={isMaximized ? "Minimize" : "Maximize"}
              className="p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-full group transition-colors"
            >
              <img
                src={isMaximized ? MinimizeIcon : MaximizeIcon}
                alt={isMaximized ? "Minimize" : "Maximize"}
                className="h-5 w-5 opacity-70 group-hover:opacity-100"
                style={{ filter: isDark ? "invert(1) brightness(2)" : "none" }}
              />
            </button>

            {userData?.isActive && exportModalName !== "" && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-full group transition-colors outline-none">
                    <img
                      src={ThreeDotsIcon}
                      alt="Menu"
                      className="h-6 w-6 opacity-70 group-hover:opacity-100"
                      style={{ filter: isDark ? "invert(1) brightness(2)" : "none" }}
                    />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="w-48 z-[300] rounded-xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl p-1.5"
                >
                  <DropdownMenuItem
                    onClick={() => {
                      dispatch(openModal({ modalName: exportModalName }));
                    }}
                    className="cursor-pointer flex items-center gap-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors p-2"
                  >
                    <img
                      src={GreenDownloadIcon}
                      alt="Download"
                      className="h-4 w-4"
                    />
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
                      Export
                    </span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
        <div className={`flex gap-4 ${"justify-end"} py-2 items-center`}>
          {userData?.isActive && (
            <div className="flex gap-4">
              {filters && Object.keys(filters)?.length > 0 && (
                <button
                  onClick={() => {
                    setFilters({});
                    successToast("Filters Cleared");
                  }}
                  className=" h-10 border text-md bg-indigo-500 text-white px-4 rounded-md flex items-center gap-2 "
                >
                  Reset
                </button>
              )}
              <button
                onClick={() => {
                  setIsPresetModalOpen(true);
                }}
                className="border-purple-500 h-10 border text-md text-purple-500 px-4 rounded-md flex items-center gap-2 "
              >
                <img src={BookmarkIcon} alt="Bookmark" width={20} height={20} />
                Presets
              </button>
              <button
                onClick={() => {
                  dispatch(openModal(filterModalName));
                }}
                className="border-blue-500 h-10 border text-md text-blue-500 px-4 rounded-md flex items-center gap-2 "
              >
                <img src={FilterIcon} alt="Bookmark" width={22} height={22} />
                Filters
                {filters && Object.keys(filters)?.length > 0 && (
                  <span className=" px-2 text-xs font-medium bg-indigo-100 text-indigo-800 rounded-full">
                    {Object.keys(filters).length}
                  </span>
                )}
              </button>
            </div>
          )}
        </div>

        <div
          //   ref={tableRef}
          className="shadow-md rounded-lg overflow-auto max-h-[80vh]"
        >
          <table className="w-full text-sm">
            <thead className="sticky top-0 z-10" style={{ backgroundColor: isDark ? "#0f172a" : "#f8fafc" }}>
              <tr>
                <th
                  className="py-6 px-4 font-normal text-sm whitespace-nowrap text-start"
                  style={{ color: isDark ? "#94a3b8" : "#64748b" }}
                >
                  S.No
                </th>
                {tableData?.columns?.map((column, index) => (
                  <th
                    key={index}
                    className="text-start px-4 text-sm font-normal py-6 whitespace-nowrap"
                    style={{ color: isDark ? "#94a3b8" : "#64748b" }}
                  >
                    {column.header}
                  </th>
                ))}
                {Array.isArray(actionIcons) && actionIcons.length > 0 && (
                  <th
                    className="px-4 py-3 font-normal text-sm sticky right-0 z-10"
                    style={{
                      color: isDark ? "#94a3b8" : "#64748b",
                      backgroundColor: isDark ? "#0f172a" : "#f8fafc"
                    }}
                  >
                    Actions
                  </th>
                )}
              </tr>
            </thead>
            <tbody style={{ backgroundColor: isDark ? "#1e293b" : "#ffffff" }}>
              {isLoading ? (
                Array.from({ length: LIMIT <= 10 ? LIMIT : 10 }).map(
                  (_, index) => (
                    <tr className="border" key={index}>
                      <td className="flex justify-center px-4 py-4">
                        <div className="h-4 w-8 bg-gray-200 animate-pulse rounded"></div>
                      </td>
                      {tableData?.columns?.map((_, colIndex) => (
                        <td key={colIndex} className="px-4 py-2">
                          <div className="h-4 bg-gray-200 animate-pulse rounded"></div>
                        </td>
                      ))}
                      <td className="px-4 py-2">
                        <div className="h-8 w-8 bg-gray-200 animate-pulse rounded-full"></div>
                      </td>
                    </tr>
                  ),
                )
              ) : tableData?.rows?.length > 0 ? (
                tableData?.rows?.map((row, index) => (
                  <tr
                    key={row?._id}
                    className="border-b whitespace-nowrap transition-colors hover:bg-black/5 dark:hover:bg-white/5"
                    style={{
                      borderColor: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)",
                    }}
                  >
                    <td
                      className="px-4 py-2 h-14 cursor-pointer"
                      style={{ color: isDark ? "#cbd5e1" : "#475569" }}
                      onClick={() => rowClick(row)}
                    >
                      {sortByOrder === "asc"
                        ? (page - 1) * LIMIT + index + 1
                        : tableData?.totalRecords -
                        ((page - 1) * LIMIT + index)}
                    </td>

                    {tableData?.columns?.map((column, colIndex) => (
                      <td
                        key={colIndex}
                        className="px-4 py-2 max-w-80 capitalize truncate"
                        style={{ color: isDark ? "#cbd5e1" : "#475569" }}
                        onClick={() => rowClick(row)}
                      >
                        {column.type === "Date" &&
                          (formatDateAsNumber(row?.[column.key]) ?? (
                            <span className="px-2 py-1 text-red-500">N/A</span>
                          ))}
                        {column.type === "" &&
                          (row?.[column.key] !== undefined &&
                            row?.[column.key] !== null ? (
                            row[column.key] || row[column.key] === 0 ? (
                              row[column.key]
                            ) : (
                              <span className="px-2 py-1 text-red-500">
                                N/A
                              </span>
                            )
                          ) : (
                            (column.default ?? (
                              <span className="px-2 py-1 text-red-500">
                                N/A
                              </span>
                            ))
                          ))}
                      </td>
                    ))}
                    {Array.isArray(actionIcons) && actionIcons.length > 0 && (
                      <td
                        className="px-4 py-2 sticky right-0 border-l"
                        style={{
                          backgroundColor: isDark ? "#1e293b" : "#ffffff",
                          borderColor: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)"
                        }}
                      >
                        <div className="flex gap-2">
                          {actionIcons.map((action, idx) => (
                            <div key={idx}>
                              <button
                                disabled={action?.disabled ? true : false}
                                className="p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-full group transition-colors"
                                onClick={() => action.onClick(row)}
                                title={action.tooltip}
                              >
                                {action.icon(row)}
                              </button>
                            </div>
                          ))}
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={tableData?.columns?.length + 1}
                    className="px-4 py-8 text-center text-gray-500 italic"
                  >
                    No data available
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {tableData?.rows?.length > 0 && (
          <div className="flex gap-4 md:flex-row flex-col flex-wrap items-center justify-between py-4">
            <Pagination
              onChange={(e, page) => {
                setPage(page);
                logUserActivity({
                  action: "Page changed",
                  details: `User changed page For ${tableHeader} to ${page} `,
                });
              }}
              count={totalPages || 1}
              page={Number(page) || 1}
              variant="outlined"
              shape="rounded"
            />
            <PageLimitEditor setPage={setPage} pageId={tableHeader} />
          </div>
        )}
        {isPresetModalOpen && (
          <Suspense fallback={<ModalFallback />}>
            <FilterPresetModal
              tableName={"webinarTable"}
              filters={filters}
              setFilters={setFilters}
              setIsPresetModalOpen={setIsPresetModalOpen}
            />
          </Suspense>
        )}
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
        document.body,
      )}

      <Suspense fallback={<></>}>
        <WebinarFilterModal
          filters={filters}
          setFilters={setFilters}
          modalName={filterModalName}
          dateFormat={dateFormat}
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
                }),
              );
            }}
          />
        </Suspense>
      )}
    </div>
  );
};

export default Webinar;
