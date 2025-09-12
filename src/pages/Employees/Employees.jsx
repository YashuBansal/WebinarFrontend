import React, { lazy, Suspense, useCallback, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@mui/material";
import { Edit, ToggleOn, ToggleOff, Dashboard } from "@mui/icons-material";
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
import { getUserSubscription } from "../../features/actions/auth";
import DataTable from "../../components/Table/DataTable";
import { employeeTableColumns } from "../../utils/columnData";
import useRoles from "../../hooks/useRoles";
import ComponentGuard from "../../components/AccessControl/ComponentGuard";
import EmployeeFilterModal from "../../components/Filter/EmployeeFilterModal";
const ExportModal = lazy(() => import("../../components/Export/ExportModal"));
import { exportEmployeesExcel } from "../../features/actions/export-excel";
import { socket } from "../../socket";
import { NotifActionType } from "../../utils/extra";
import { VisibilityIcon } from "../../components/SVGs";
import ModalFallback from "../../components/Fallback/ModalFallback";
import { globalButton } from "../../utils/style";

const Employees = () => {
  // ----------------------- ModalNames for Redux -----------------------
  const activeInactiveModalName = "activeInactiveModal";
  const employeeExportModalName = "EmployeeExportModal";
  const employeeFilterModalName = "EmployeeFilterModal";
  const tableHeader = "Employee Table";

  // ----------------------- Constants -----------------------
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const roles = useRoles();

  const [searchParams, setSearchParams] = useSearchParams();
  const [filters, setFilters] = useState({});
  const [page, setPage] = useState(searchParams.get("page") || 1);

  const LIMIT = useSelector((state) => state.pageLimits[tableHeader] || 10);
  const { employeeData, isLoading, isSuccess, totalPages } = useSelector(
    (state) => state.employee
  );
  const { userData, subscription } = useSelector((state) => state.auth);
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
  }, [fetchEmployeeData]);

  const navigateToAdd = () => navigate("/createEmployee");

  useEffect(() => {
    if (isSuccess) {
      dispatch(
        getAllEmployees({
          page: 1,
          limit: LIMIT,
          filters: filters,
        })
      );
      dispatch(getUserSubscription());
      dispatch(clearSuccess());
    }
  }, [isSuccess]);

  useEffect(() => {
    return () => {
      dispatch(clearEmployeeData());
    };
  }, []);

  useEffect(() => {
    const currentPageInUrl = searchParams.get("page");
    const newPageValue = String(page);

    if (newPageValue !== String(currentPageInUrl || "")) {
      setSearchParams({ page: newPageValue }, { replace: true });
    }
  }, [page, searchParams, setSearchParams]);

  // ------------------- Action Icons -------------------
  const actionIcons = [
    {
      icon: () => (
        <img
          src={VisibilityIcon}
          alt="Bookmark"
          className="min-h-6 h-6 w-6 min-w-6"
        />
      ),
      tooltip: "View Employee Info",
      onClick: (item) => {
        navigate(
          `/employee/view/${item?._id}?page=1&tabValue=assignments&role=${item?.role}&webinarId=all&userName=${item?.userName}`
        );
      },
      readOnly: true,
    },
    ,
    ...(userData?.isActive
      ? [
          {
            icon: () => (
              <Dashboard className="text-neutral-500 group-hover:text-neutral-600" />
            ),
            tooltip: "Visit Dashboard",
            onClick: (item) => {
              dispatch(setEmployeeModeId(item));
              navigate("/employee/dashboard/" + item?._id);
            },
          },
          {
            icon: () => (
              <Edit className="text-blue-500 group-hover:text-blue-600" />
            ),
            tooltip: "Edit Employee Data",
            onClick: (item) => {
              navigate(`/employee/edit/${item?._id}`);
            },
          },
          {
            icon: (item) => (
              <>
                {item?.isActive ? (
                  <ToggleOff
                    fontSize="large"
                    className="text-red-500 group-hover:text-red-600"
                  />
                ) : (
                  <ToggleOn
                    fontSize="large"
                    className="text-green-500 group-hover:text-green-600"
                  />
                )}
              </>
            ),
            tooltip: "Toggle Status",
            onClick: (item) => {
              dispatch(
                openModal({
                  modalName: activeInactiveModalName,
                  data: item,
                })
              );
            },
          },
        ]
      : []),
  ];

  return (
    <>
      <div className="pt-14 sm:px-5">
        {/* Add Employee Button */}
        <div className="flex justify-end items-center pb-4">
          <ComponentGuard conditions={[userData?.isActive]}>
            <button className={globalButton} onClick={navigateToAdd}>
              Add Employee
            </button>
          </ComponentGuard>
        </div>

        <DataTable
          tableHeader={tableHeader}
          tableUniqueKey="employeeListingTable"
          filters={filters}
          setFilters={setFilters}
          tableData={{
            columns: employeeTableColumns.filter((column) => {
              if (column.key === "inactivityTime") {
                return employeeInactivity;
              }
              return true;
            }),
            rows: employeeData || [],
          }}
          actions={actionIcons}
          totalPages={totalPages}
          page={page}
          setPage={setPage}
          limit={LIMIT}
          filterModalName={employeeFilterModalName}
          exportModalName={employeeExportModalName}
          isLoading={isLoading}
        />
      </div>

      <ConfirmActionModal modalName={activeInactiveModalName} />
      <EmployeeFilterModal
        modalName={employeeFilterModalName}
        filters={filters}
        setFilters={setFilters}
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
    </>
  );
};

export default Employees;
