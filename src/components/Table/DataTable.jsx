import {
  memo,
  Suspense,
  useState,
  lazy,
  useEffect,
  useRef,
  useMemo,
} from "react";
import Pagination from "@mui/material/Pagination";
import PageLimitEditor from "../PageLimitEditor";
import { useDispatch, useSelector } from "react-redux";
import { openModal } from "../../features/slices/modalSlice";
import RawTable from "./RawTable";
const FilterPresetModal = lazy(() => import("../Filter/FilterPresetModal"));
import useAddUserActivity from "../../hooks/useAddUserActivity";
import ModalFallback from "../Fallback/ModalFallback";
import {
  BookmarkIcon,
  FilterIcon,
  GreenDownloadIcon,
  ThreeDotsIcon,
  MaximizeIcon,
  MinimizeIcon,
} from "../SVGs";
import { successToast } from "../../utils/extra";

const DataTable = ({
  tableHeader = "Table",
  tableUniqueKey = "id",
  ButtonGroup = null,
  filters,
  setFilters,
  ClientCards = null,
  tableData,
  actions,
  isSelectVisible = false,
  totalPages = 1,
  page = 1,
  setPage,
  limit = 10,
  filterModalName = "",
  exportModalName = "",
  isLoading = false,
  selectedRows = [], // Removed useMemo for simpler prop handling
  employees = [], // Removed useMemo
  rowClick = (row) => {},
  isRowClickable = false,
  setSelectedRows = () => {},
  isLeadType = false,
  locations = null,
  sortByOrder = "asc",
}) => {
  const dispatch = useDispatch();
  const logUserActivity = useAddUserActivity();

  const [isPresetModalOpen, setIsPresetModalOpen] = useState(false);
  const [open, setOpen] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const menuRef = useRef(null);
  const { userData } = useSelector((state) => state.auth);

  const handleClick = () => setOpen(!open);
  const handleClose = () => setOpen(false);

  const toggleMaximize = () => {
    setIsMaximized((prev) => !prev);
  };

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

  return (
    <div
      className={`bg-gray-50 transition-all duration-300 ${
        isMaximized
          ? "fixed top-0 left-0 inset-0 w-screen h-screen z-[100] overflow-auto p-4 md:p-6" // Adjusted padding for mobile
          : "relative p-4 md:p-6 rounded-lg" // Adjusted padding
      }`}
    >
      {/* 1. HEADER SECTION: Stacks title and actions on mobile */}
      <div className="flex flex-col md:flex-row gap-4 justify-between md:items-center mb-4">
        <h2 className="text-2xl font-bold text-gray-700">{tableHeader}</h2>

        <div className="flex justify-end md:justify-center overflow-visible relative items-center gap-2 flex-wrap">
          {Array.isArray(selectedRows) && selectedRows.length > 0 && (
            <span className="font-semibold text-neutral-800 mr-2">
              Selected:{" "}
              <span className="text-indigo-500">{selectedRows.length}</span>
            </span>
          )}
          {tableData.totalRecords ? (
            <span className="font-semibold text-neutral-800 mr-2">
              Total Records:{" "}
              <span className="text-indigo-500">{tableData.totalRecords}</span>
            </span>
          ) : (
            <></>
          )}

          <button
            onClick={toggleMaximize}
            title={isMaximized ? "Minimize" : "Maximize"}
            className="p-2 hover:bg-gray-200 rounded-full group hidden md:block"
          >
            <img
              src={isMaximized ? MinimizeIcon : MaximizeIcon}
              alt={isMaximized ? "Minimize" : "Maximize"}
              className="min-h-5 min-w-5 h-5 w-5 text-gray-600"
            />
          </button>

          {userData?.isActive &&
            tableUniqueKey !== "viewAssignmentsTable" &&
            exportModalName !== "" && (
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
                      className="w-full py-2 px-2 text-sm text-gray-700 hover:bg-gray-50 text-left flex items-center"
                    >
                      <img
                        src={GreenDownloadIcon}
                        alt="Download"
                        className="h-4 w-4"
                      />
                      <span className="text-sm px-4 font-medium">Export</span>
                    </button>
                  </div>
                )}
              </div>
            )}
        </div>
      </div>

      <div
        className={`flex flex-col md:flex-row flex-wrap gap-4 ${
          ButtonGroup ? "justify-between" : "justify-end"
        } py-2 items-stretch md:items-center`}
      >
        {ButtonGroup && <div className="flex-shrink-0">{<ButtonGroup />}</div>}

        {userData?.isActive && filterModalName !== "" && (
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
                <img src={BookmarkIcon} alt="Bookmark" width={20} height={20} />
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

      <div>
        <RawTable
          tableData={tableData}
          actions={actions}
          isSelectVisible={isSelectVisible}
          page={page}
          limit={limit}
          isLoading={isLoading}
          selectedRows={selectedRows}
          setSelectedRows={setSelectedRows}
          userData={userData}
          rowClick={rowClick}
          isRowClickable={isRowClickable}
          isLeadType={isLeadType}
          locations={locations}
          sortByOrder={sortByOrder}
          employees={employees}
        />
      </div>

      {/* 4. PAGINATION SECTION: Already responsive, but ensured consistency */}
      {tableData?.rows?.length > 0 && (
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between py-4">
          <Pagination
            onChange={(e, page) => {
              setPage(page);
              logUserActivity({
                action: "Page changed",
                details: `User changed page For ${tableHeader} to ${page}`,
              });
            }}
            count={totalPages || 1}
            page={Number(page) || 1}
            variant="outlined"
            shape="rounded"
            size="small" // Use 'small' pagination on all screen sizes for a more compact look
          />
          <PageLimitEditor setPage={setPage} pageId={tableHeader} />
        </div>
      )}

      {isPresetModalOpen && (
        <Suspense fallback={<ModalFallback />}>
          <FilterPresetModal
            tableName={tableUniqueKey}
            filters={filters}
            setFilters={setFilters}
            setIsPresetModalOpen={setIsPresetModalOpen}
          />
        </Suspense>
      )}
    </div>
  );
};

// ... areEqual function remains the same ...

export default memo(DataTable);
