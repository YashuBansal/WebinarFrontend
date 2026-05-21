import { lazy, Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Bookmark, Download, Search, UserPlus } from "lucide-react";
import {
  getAllEmployees,
  getAllEmployeesSilently,
} from "../../features/actions/employee";
import ConfirmActionModal from "./modal/ConfirmActionModal";
import {
  clearEmployeeData,
  clearSuccess,
  setEmployeeModeId,
} from "../../features/slices/employee";
import { openModal } from "../../features/slices/modalSlice";
import useUserSubscription from "../../hooks/useUserSubscription";
import { employeeTableColumns } from "../../utils/columnData";
import EmployeeFilterModal from "../../components/Filter/EmployeeFilterModal";
const ExportModal = lazy(() => import("../../components/Export/ExportModal"));
import { exportEmployeesExcel } from "../../features/actions/export-excel";
import { socket } from "../../socket";
import { NotifActionType } from "../../utils/extra";
import ModalFallback from "../../components/Fallback/ModalFallback";
import { useTheme } from "../../contexts/ThemeContext";
import EmployeesTableShell from "../../components/Employees/EmployeesTableShell";
import EmployeesCardGrid from "../../components/Employees/EmployeesCardGrid";
import { getRoleNameByID } from "../../utils/roles";
import FilterPresetModal from "../../components/Filter/FilterPresetModal";

const VIEW_STORAGE_KEY = "employeesListViewMode";

const Employees = () => {
  const activeInactiveModalName = "activeInactiveModal";
  const employeeExportModalName = "EmployeeExportModal";
  const employeeFilterModalName = "EmployeeFilterModal";
  const tableHeader = "Employee Table";

  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const [searchParams, setSearchParams] = useSearchParams();
  const [filters, setFilters] = useState({});
  const [page, setPage] = useState(searchParams.get("page") || 1);
  const [searchQuery, setSearchQuery] = useState("");
  const [presetModalOpen, setPresetModalOpen] = useState(false);
  const [listView, setListView] = useState(() => {
    try {
      const v = localStorage.getItem(VIEW_STORAGE_KEY);
      return v === "cards" || v === "table" ? v : "table";
    } catch {
      return "table";
    }
  });

  const LIMIT = useSelector((state) => state.pageLimits[tableHeader] || 10);
  const { employeeData, isLoading, isSuccess, totalPages } = useSelector(
    (state) => state.employee
  );
  const { userData } = useSelector((state) => state.auth);
  const { data: subscription } = useUserSubscription();
  const employeeInactivity = subscription?.plan?.employeeInactivity;

  const modalState = useSelector((state) => state.modals.modals);
  const exportModalOpen = modalState[employeeExportModalName] ? true : false;

  const fetchEmployeeData = useCallback(() => {
    dispatch(
      getAllEmployees({
        page: page,
        limit: LIMIT,
        filters: filters,
      })
    );
  }, [page, LIMIT, filters, dispatch]);

  const fetchEmployeeDataSilently = useCallback(() => {
    dispatch(
      getAllEmployeesSilently({
        page: page,
        limit: LIMIT,
        filters: filters,
      })
    );
  }, [page, LIMIT, filters, dispatch]);

  useEffect(() => {
    fetchEmployeeData();
  }, [fetchEmployeeData]);

  useEffect(() => {
    function onNotification(data) {
      if (data.actionType === NotifActionType.ATTENDEE_REGISTRATION) {
        fetchEmployeeDataSilently();
      }
    }
    socket.on("notification", onNotification);
    return () => {
      socket.off("notification", onNotification);
    };
  }, [fetchEmployeeDataSilently]);

  useEffect(() => {
    if (isSuccess) {
      dispatch(
        getAllEmployees({
          page: 1,
          limit: LIMIT,
          filters: filters,
        })
      );
      dispatch(clearSuccess());
    }
  }, [isSuccess, dispatch, LIMIT, filters]);

  useEffect(() => {
    return () => {
      dispatch(clearEmployeeData());
    };
  }, [dispatch]);

  useEffect(() => {
    const currentPageInUrl = searchParams.get("page");
    const newPageValue = String(page);

    if (newPageValue !== String(currentPageInUrl || "")) {
      setSearchParams({ page: newPageValue }, { replace: true });
    }
  }, [page, searchParams, setSearchParams]);

  const filteredRows = useMemo(() => {
    const list = Array.isArray(employeeData) ? employeeData : [];
    const q = searchQuery.trim().toLowerCase();
    if (!q) return list;
    return list.filter((row) => {
      const blob = [
        row?.email,
        row?.userName,
        row?.phone,
        getRoleNameByID(row?.role),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return blob.includes(q);
    });
  }, [employeeData, searchQuery]);

  const openFilterModal = () => {
    dispatch(openModal({ modalName: employeeFilterModalName }));
  };

  const openExportModal = () => {
    dispatch(openModal({ modalName: employeeExportModalName }));
  };

  const setListViewPersist = useCallback((mode) => {
    setListView(mode);
    try {
      localStorage.setItem(VIEW_STORAGE_KEY, mode);
    } catch {
      /* ignore */
    }
  }, []);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto space-y-6 transition-all duration-300">
      <motion.div
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
      >
        <div>
          <h2
            className="text-2xl font-bold tracking-tight"
            style={{ color: isDark ? "#f8fafc" : "#071028" }}
          >
            Employees Activity
          </h2>
          <p
            className="text-sm mt-1"
            style={{ color: isDark ? "#94a3b8" : "#64748b" }}
          >
            Monitor sales and call activity in real-time.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
          {userData?.isActive && (
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={openExportModal}
                className="rounded-xl flex items-center justify-center gap-2 px-4 py-2 shadow-sm font-semibold text-sm transition-transform hover:scale-[1.02] shrink-0 border"
                style={{
                  backgroundColor: isDark ? "#1e293b" : "#ffffff",
                  color: isDark ? "#f8fafc" : "#0f172a",
                  borderColor: isDark ? "#334155" : "#e2e8f0",
                }}
              >
                <Download className="w-4 h-4 text-gray-500" />
                <span>Export</span>
              </button>
              <button
                type="button"
                onClick={() => navigate("/createEmployee")}
                className="rounded-xl flex items-center justify-center gap-2 px-4 py-2 shadow-sm font-semibold text-sm transition-transform hover:scale-[1.02] shrink-0"
                style={{
                  backgroundColor: "#1877F2",
                  color: "white",
                  border: "none",
                  boxShadow: "0 4px 10px rgba(255, 107, 53, 0.2)",
                }}
              >
                <UserPlus className="w-4 h-4 shrink-0" />
                <span className="hidden sm:inline">Add Employee</span>
                <span className="sm:hidden">Add</span>
              </button>
            </div>
          )}
        </div>
      </motion.div>

      {listView === "table" ? (
        <EmployeesTableShell
          theme={theme}
          listView={listView}
          onListViewChange={setListViewPersist}
          isDark={isDark}
          isLoading={isLoading}
          rows={filteredRows}
          employeeInactivity={employeeInactivity}
          userData={userData}
          page={page}
          setPage={setPage}
          totalPages={totalPages || 1}
          limit={LIMIT}
          tableHeader={tableHeader}
          onOpenFilters={openFilterModal}
          onOpenExport={openExportModal}
          onView={(item) =>
            navigate(
              `/employee/view/${item?._id}?page=1&tabValue=assignments&role=${item?.role}&webinarId=all&userName=${item?.userName}`
            )
          }
          onDashboard={(item) => {
            dispatch(setEmployeeModeId(item));
            navigate("/employee/dashboard/" + item?._id);
          }}
          onEdit={(item) => navigate(`/employee/edit/${item?._id}`)}
          onToggleStatus={(item) =>
            dispatch(
              openModal({
                modalName: activeInactiveModalName,
                data: item,
              })
            )
          }
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          onOpenPresets={() => setPresetModalOpen(true)}
        />
      ) : (
        <EmployeesCardGrid
          theme={theme}
          listView={listView}
          onListViewChange={setListViewPersist}
          isDark={isDark}
          isLoading={isLoading}
          rows={filteredRows}
          userData={userData}
          employeeInactivity={employeeInactivity}
          page={page}
          setPage={setPage}
          totalPages={totalPages || 1}
          limit={LIMIT}
          tableHeader={tableHeader}
          onOpenFilters={openFilterModal}
          onOpenExport={openExportModal}
          onView={(item) =>
            navigate(
              `/employee/view/${item?._id}?page=1&tabValue=assignments&role=${item?.role}&webinarId=all&userName=${item?.userName}`
            )
          }
          onDashboard={(item) => {
            dispatch(setEmployeeModeId(item));
            navigate("/employee/dashboard/" + item?._id);
          }}
          onEdit={(item) => navigate(`/employee/edit/${item?._id}`)}
          onToggleStatus={(item) =>
            dispatch(
              openModal({
                modalName: activeInactiveModalName,
                data: item,
              })
            )
          }
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          onOpenPresets={() => setPresetModalOpen(true)}
        />
      )}

      <ConfirmActionModal modalName={activeInactiveModalName} />
      <EmployeeFilterModal
        modalName={employeeFilterModalName}
        filters={filters}
        setFilters={setFilters}
        setPage={setPage}
      />

      {exportModalOpen && (
        <Suspense fallback={<ModalFallback />}>
          <ExportModal
            modalName={employeeExportModalName}
            columns={employeeTableColumns}
            tableName={tableHeader}
            handleExport={({ limit, columns, includeFilter }) => {
              dispatch(
                exportEmployeesExcel({
                  limit,
                  columns,
                  filters: includeFilter ? filters : {},
                })
              );
            }}
          />
        </Suspense>
      )}
      {presetModalOpen && (
        <Suspense fallback={<ModalFallback />}>
          <FilterPresetModal
            tableName="employeesTable"
            filters={filters}
            setFilters={setFilters}
            setIsPresetModalOpen={setPresetModalOpen}
          />
        </Suspense>
      )}
    </div>
  );
};

export default Employees;
