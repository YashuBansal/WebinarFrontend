import {
  lazy,
  memo,
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { Button, Pagination } from "@mui/material";
import { webinarTableColumns } from "../../utils/columnData";
import { Edit, Delete, ContentCopy } from "@mui/icons-material";
import { openModal } from "../../features/slices/modalSlice";
import ComponentGuard from "../../components/AccessControl/ComponentGuard";
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
import {
  DateFormat,
  NotifActionType,
  successToast,
  formatDateAsNumber,
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
  VisibilityIcon,
} from "../../components/SVGs";

import {} from "../";
import useMediaQuery from "../../hooks/useMediaQuery";
import useUserSubscription from "../../hooks/useUserSubscription";

const CellRenderer = memo(({ column, row }) => {
  const value = row?.[column.key];

  if (
    value === undefined &&
    !["role"].includes(column.type) &&
    !column.default
  ) {
    return <span className=" text-red-400 italic">N/A</span>;
  }

  switch (column.type) {
    case "Date": {
      const date = formatDateAsNumber(value);
      return date || <span className="italic text-gray-400">Not Set</span>;
    }

    default:
      if (value === undefined || value === null || value === "") {
        return (
          column.default ?? <span className="italic text-red-400">N/A</span>
        );
      }
      return String(value);
  }
});

const Webinar = () => {
  // ----------------------- ModalNames for Redux -----------------------
  const exportModalName = "ExportFilterModal";
  const filterModalName = "WebinarFilterModal";
  const tableHeader = "Webinar Table";
  const createWebinarModalName = "createWebinarModal";

  // ----------------------- etcetra -----------------------
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const logUserActivity = useAddUserActivity();
  const isSmallScreen = useMediaQuery("(max-width: 768px)");

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
    console.log(webinarLimit, total, isWebinarLimitExceeded);

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

  const tableData = useMemo(
    () => ({
      columns: webinarTableColumns,
      rows: webinarPageData,
      totalRecords: total,
    }),
    [webinarPageData, total, webinarTableColumns]
  );

  // ----------------------- Action Icons -----------------------

  const actionIcons = useMemo(() => {
    return [
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
                  })
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
  }, [userData, dispatch, createWebinarModalName]);

  const [open, setOpen] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false); // State for maximize/minimize
  const menuRef = useRef(null);
  const [isPresetModalOpen, setIsPresetModalOpen] = useState(false);

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        handleClose();
      }
    };

    if (open) {
      document.addEventListener("mousedown", handleOutsideClick);
    }

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, [open]);
  const toggleMaximize = () => {
    setIsMaximized((prev) => !prev);
  };

  const handleClick = () => setOpen(!open);
  const handleClose = () => setOpen(false);

  // --- RENDER CARD VIEW FOR SMALL SCREENS ---
  const Card = ({ row, index }) => {
    const firstColumn = tableData.columns[0];
    const otherColumns = tableData.columns.slice(1);

    return (
      <div
        className={`rounded-xl border bg-white shadow-sm transition-all duration-300 ease-in-out hover:shadow-lg hover:-translate-y-1 border-gray-200/80`}
      >
        <div className="flex items-center justify-between p-3  border-b border-red-100">
          <div className="flex items-center gap-3">
            <span className="text-xs font-mono text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
              {/* #{(page - 1) * LIMIT + index + 1} */}#
              {tableData?.totalRecords - ((page - 1) * LIMIT + index)}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <Link
              className="p-1.5 hover:bg-gray-200 rounded-full transition-colors"
              to={`/webinarDetails/${row._id}?page=1&tabValue=&subTabValue=attendees`}
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={VisibilityIcon}
                alt="Visibility"
                className="min-h-6 min-w-6 h-6 w-6"
              />
            </Link>
            {actionIcons.map((action, idx) => (
              <button
                key={idx}
                className="p-1.5 hover:bg-gray-200 rounded-full transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                onClick={(e) => {
                  e.stopPropagation();
                  action.onClick(row);
                }}
                title={action.tooltip}
                disabled={action.disabled}
              >
                {action.icon(row)}
              </button>
            ))}
          </div>
        </div>

        <div className="p-4">
          {/* Primary Info */}
          <div className="text-center mb-4">
            <p className="text-sm text-gray-500 uppercase tracking-wider">
              {firstColumn.header}
            </p>
            <div className="text-md font-semibold text-gray-900">
              <CellRenderer column={firstColumn} row={row} />
            </div>
          </div>

          {/* Other Info */}
          <div className="space-y-3">
            {otherColumns.map((col) => (
              <div
                key={col.key}
                className="flex justify-between items-center p-2 rounded-lg bg-gray-50/80 border border-gray-200/60"
              >
                <p className="text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  {col.header}
                </p>
                <div className="text-sm text-gray-800 text-right">
                  <CellRenderer column={col} row={row} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className=" md:px-10 pt-14">
      <div className="flex flex-wrap gap-4 my-6 justify-between px-4">
        <ComponentGuard conditions={[userData?.isActive]}>
          {assignmentMetrics && (
            <Button
              onClick={() => navigate(`/assignment-metrics`)}
              className="h-10 whitespace-nowrap text-sm px-3 py-2 md:text-base md:px-4 md:py-2"
              variant="contained"
              color="secondary"
            >
              Assignment Metrics
            </Button>
          )}
          <button
            onClick={() => {
              if (isWebinarLimitExceeded) {
                setShowWebinarLimitModal(true);
                return;
              }
              dispatch(openModal(createWebinarModalName));
            }}
            className={`${globalButton} text-sm px-3 py-2 md:text-base md:px-4 md:py-2`}
          >
            Create Webinar
          </button>
        </ComponentGuard>
      </div>

      <div
        className={`bg-gray-50 transition-all duration-300 ${
          isMaximized
            ? "fixed top-0 left-0 inset-0 w-screen h-screen z-[100] overflow-auto p-6"
            : "relative p-4 rounded-lg"
        }`}
      >
        <div className="flex gap-4 justify-between items-center flex-col md:flex-row px-2 md:px-0">
          <h2 className="text-2xl font-bold text-gray-700">{tableHeader}</h2>

          <div className="flex justify-between w-full md:w-auto  md:justify-center overflow-visible relative items-center gap-2">
            {tableData.totalRecords ? (
              <span className="font-semibold text-neutral-800 mr-2">
                Total Records:{" "}
                <span className="text-indigo-500">
                  {tableData.totalRecords}
                </span>
              </span>
            ) : (
              <></>
            )}

            {/* Maximise/Minimize button is now always visible */}
            {!isSmallScreen && (
              <button
                onClick={toggleMaximize}
                title={isMaximized ? "Minimize" : "Maximize"}
                className="p-2 hover:bg-gray-200 rounded-full group"
              >
                <img
                  src={isMaximized ? MinimizeIcon : MaximizeIcon}
                  alt={isMaximized ? "Minimize" : "Maximize"}
                  className="h-5 w-5 text-gray-600"
                />
              </button>
            )}

            {userData?.isActive && exportModalName !== "" && (
              <div className="relative">
                <button
                  className="p-2 hover:bg-gray-200 rounded-full group"
                  onClick={handleClick}
                >
                  <img src={ThreeDotsIcon} alt="Menu" className="h-6 w-6" />
                </button>

                {open && (
                  <div
                    ref={menuRef}
                    className="absolute right-0 top-full px-2 mt-1 bg-white shadow-lg rounded-md py-2 border border-gray-100 z-50 min-w-max"
                  >
                    <button
                      onClick={() => {
                        dispatch(openModal({ modalName: exportModalName }));
                        handleClose();
                      }}
                      className="w-full py-2 px-2 text-sm text-gray-700 hover:bg-gray-50 text-left flex items-center "
                    >
                      <img
                        src={GreenDownloadIcon}
                        alt="Download"
                        className="h-4 w-4"
                      />
                      <span className="text-sm px-4 font-medium"> Export</span>
                    </button>

                    {/* Maximize/Minimize button has been moved out of this menu */}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
        <div
          className={`flex gap-4 justify-center md: py-2 items-center md:justify-end   `}
        >
          {userData?.isActive && (
            <div className="flex gap-2 sm:gap-4 flex-wrap justify-start md:justify-end">
              {filters && Object.keys(filters)?.length > 0 && (
                <button
                  onClick={() => {
                    setFilters({});
                    successToast("Filters Cleared");
                  }}
                  className="h-10 border mx-auto text-md bg-indigo-500 text-white px-4 rounded-md flex items-center gap-2"
                >
                  Reset
                </button>
              )}
              <div className="w-full  flex-row flex justify-center gap-4 md:gap-2 md:w-auto">
                <button
                  onClick={() => {
                    setIsPresetModalOpen(true);
                  }}
                  className="border-purple-500 h-10 w-32 border text-md text-purple-500 px-4 rounded-md flex items-center gap-2"
                >
                  <img
                    src={BookmarkIcon}
                    alt="Bookmark"
                    width={20}
                    height={20}
                  />
                  Presets
                </button>
                <button
                  onClick={() => {
                    dispatch(openModal(filterModalName));
                  }}
                  className="border-blue-500 h-10 w-32 border text-md text-blue-500 px-4 rounded-md flex items-center gap-2"
                >
                  <img src={FilterIcon} alt="Filter" width={22} height={22} />
                  Filters
                  {filters && Object.keys(filters)?.length > 0 && (
                    <span className="px-2 text-xs font-medium bg-indigo-100 text-indigo-800 rounded-full">
                      {Object.keys(filters).length}
                    </span>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>

        {isSmallScreen ? (
          <div className="p-2 space-y-4 bg-gray-100">
            {isLoading ? (
              Array.from({ length: 5 }).map((_, index) => (
                <div
                  key={index}
                  className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 animate-pulse"
                >
                  <div className="text-center mb-4">
                    <div className="h-4 bg-gray-200 rounded w-1/3 mx-auto mb-2"></div>
                    <div className="h-6 bg-gray-300 rounded w-1/2 mx-auto"></div>
                  </div>
                  <div className="space-y-3">
                    <div className="h-8 bg-gray-200 rounded-lg w-full"></div>
                    <div className="h-8 bg-gray-200 rounded-lg w-full"></div>
                    <div className="h-8 bg-gray-200 rounded-lg w-full"></div>
                  </div>
                </div>
              ))
            ) : !tableData?.rows || tableData.rows.length === 0 ? (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
                <div className="text-gray-400 text-lg mb-2">📋</div>
                <p className="text-gray-500 font-medium">No data available</p>
                <p className="text-gray-400 text-sm mt-1">
                  There are no records to display at the moment.
                </p>
              </div>
            ) : (
              tableData.rows.map((row, index) => (
                <Card key={row._id} row={row} index={index} />
              ))
            )}
          </div>
        ) : (
          <div
            //   ref={tableRef}
            className="shadow-md rounded-lg overflow-auto max-h-[80vh]"
          >
            <table className="w-full text-sm">
              <thead className="bg-gray-100 sticky top-0 z-10">
                <tr>
                  <th className="py-6 px-4 font-normal text-sm whitespace-nowrap text-start">
                    S.No
                  </th>
                  {tableData?.columns?.map((column, index) => (
                    <th
                      key={index}
                      className="text-start px-4 text-sm font-normal py-6 whitespace-nowrap"
                    >
                      {column.header}
                    </th>
                  ))}
                  {Array.isArray(actionIcons) && actionIcons.length > 0 && (
                    <th className="px-4 py-3 text-gray-700 font-normal text-sm sticky right-0 bg-gray-100 z-10">
                      Actions
                    </th>
                  )}
                </tr>
              </thead>
              <tbody>
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
                    )
                  )
                ) : tableData?.rows?.length > 0 ? (
                  tableData?.rows?.map((row, index) => (
                    <tr
                      key={row?._id}
                      className={`${"bg-white"} hover:bg-gray-50 cursor-pointer  border-b whitespace-nowrap`}
                    >
                      <td
                        className={`px-4 py-2 h-14 text-gray-600 `}
                        onClick={() => handleRowClick(row)}
                      >
                        {/* {(page - 1) * LIMIT + index + 1} */}

                        {tableData?.totalRecords - ((page - 1) * LIMIT + index)}
                      </td>

                      {tableData?.columns?.map((column, colIndex) => (
                        <td
                          key={colIndex}
                          className={`px-4 py-2 text-gray-600 max-w-80 capitalize truncate`}
                          onClick={() => handleRowClick(row)}
                        >
                          {column.type === "Date" &&
                            (formatDateAsNumber(row?.[column.key]) ?? (
                              <span className="px-2 py-1 text-red-500">
                                N/A
                              </span>
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
                              column.default ?? (
                                <span className="px-2 py-1 text-red-500">
                                  N/A
                                </span>
                              )
                            ))}
                        </td>
                      ))}
                      {Array.isArray(actionIcons) && actionIcons.length > 0 && (
                        <td className="px-4 py-2 sticky right-0 bg-white border-l">
                          <div className="flex gap-2">
                            {actionIcons.map((action, idx) => (
                              <div key={idx}>
                                <button
                                  disabled={action?.disabled ? true : false}
                                  className="p-2 hover:bg-gray-100 rounded-full group"
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
        )}

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
              setFilters={(data) => {
                setPage(1);
                setFilters(data);
              }}
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
