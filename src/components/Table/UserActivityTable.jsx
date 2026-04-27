import React, {
  Suspense,
  lazy,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  Modal,
  Typography,
  Box,
  Button,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
} from "@mui/material";
import DatePicker from "react-datepicker";
import { useForm, Controller } from "react-hook-form";
import "react-datepicker/dist/react-datepicker.css";

import { closeModal, openModal } from "../../features/slices/modalSlice";
import { userActivityTableColumns } from "../../utils/columnData";
import DataTable from "./DataTable"; // Adjust this import path as needed
import { ActivityActions, filterTruthyValues } from "../../utils/extra";
import ExportModal from "../Export/ExportLogsModal";
import ModalFallback from "../Fallback/ModalFallback";
import AdminActivityLogsTableShell from "../Dashboard/AdminActivityLogsTableShell";
import AdminActivityLogsFilterModal from "../Dashboard/AdminActivityLogsFilterModal";

const FilterPresetModal = lazy(() => import("../Filter/FilterPresetModal"));
import { useNavigate } from "react-router-dom";
import useRoles from "../../hooks/useRoles";
import { globalButton } from "../../utils/style";

const dateFormat = "dd/MM/yyyy"; // Or whatever format you use

const UserActivityTable = (props) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const roles = useRoles();

  const options = Object.values(ActivityActions).map((item) => ({
    label: item,
    value: item,
  }));
  const {
    page,
    setPage,
    filters,
    setFilters,
    handleExportData,
    limit,
    tableHeader,
    adminLogsUi2025 = false,
    onAdminLogsBack,
  } = props;

  const [adminLogsPresetOpen, setAdminLogsPresetOpen] = useState(false);

  const { control, handleSubmit, reset } = useForm();

  const { userData } = useSelector((state) => state.auth);

  const { userActivities, totalPages, totalRecords, isLoading } = useSelector(
    (state) => state.userActivity
  );
  const { modals } = useSelector((state) => state.modals);

  const filterModalName = "userActivityFilterModal";
  const exportExcelModalName = "userActivityExportExcelModal";

  const open = modals[filterModalName] || false;

  const onClose = () => {
    dispatch(closeModal(filterModalName));
  };

  const onSubmit = (data) => {
    const filterData = filterTruthyValues(data);
    setFilters(filterData);
    onClose();
  };

  const resetForm = () => {
    reset({
      fromDate: null,
      toDate: null,
      action: "",
    });
  };

  const tableData = useMemo(() => {
    return {
      columns: userActivityTableColumns,
      rows: userActivities,
    };
  }, [userActivities]);

  useEffect(() => {
    if (open) {
      reset({});
    }
  }, [open]);

  const handleRowClick = useCallback(
    (row) => {
      if (row?.action === "note" && userData && userData?.role === roles.ADMIN) {
        const email = row?.item;
        navigate(`/particularContact?email=${email}`);
      }
    },
    [navigate, roles, userData]
  );

  const handleExport = ({ limit, columns }) => {
    dispatch(closeModal(exportExcelModalName));
    handleExportData(limit, columns);
  };

  const legacyFilterModal = !adminLogsUi2025 && (
    <Modal open={open} onClose={onClose} disablePortal>
      <Box className="bg-white p-6 rounded-md mx-auto mt-28 w-full max-w-2xl">
        <Typography variant="h6" className="text-center mb-4">
          User Activity Logs Filters
        </Typography>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="max-h-[65dvh] overflow-y-auto space-y-4 p-4 border rounded-lg">
            <div className="grid grid-cols-1">
              <Controller
                name="action"
                control={control}
                defaultValue=""
                render={({ field }) => (
                  <FormControl fullWidth>
                    <InputLabel id="action-label">Action</InputLabel>
                    <Select
                      {...field}
                      labelId="action-label"
                      label="Action"
                      value={field.value || ""}
                      MenuProps={{
                        PaperProps: {
                          style: {
                            maxHeight: 300, // You can adjust the max height as needed
                          },
                        },
                      }}
                    >
                      <MenuItem value="">All</MenuItem>
                      {options.map((option) => (
                        <MenuItem key={option.value} value={option.value}>
                          <span className="capitalize">{option.label}</span>
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                )}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid grid-cols-1">
                <Controller
                  name="fromDate"
                  control={control}
                  render={({ field }) => (
                    <DatePicker
                      selected={field.value}
                      onChange={field.onChange}
                      className="border p-4 min-w-full h-14 rounded-md"
                      placeholderText="Date (From)"
                      dateFormat={dateFormat}
                    />
                  )}
                />
              </div>
              <div className="grid grid-cols-1">
                <Controller
                  name="toDate"
                  control={control}
                  render={({ field }) => (
                    <DatePicker
                      selected={field.value}
                      onChange={field.onChange}
                      className="border p-4 min-w-full h-14 rounded-md"
                      placeholderText="Date (To)"
                      dateFormat={dateFormat}
                    />
                  )}
                />
              </div>
            </div>
          </div>

          <div className="flex justify-between">
            <button type="button" className={globalButton} onClick={resetForm}>
              Reset
            </button>
            <div className="flex gap-2">
              <Button onClick={onClose} variant="outlined" color="secondary">
                Cancel
              </Button>
              <button type="submit" className={globalButton}>
                Apply Filters
              </button>
            </div>
          </div>
        </form>
      </Box>
    </Modal>
  );

  const adminLogsFilterModal = adminLogsUi2025 && (
    <AdminActivityLogsFilterModal
      open={open}
      onClose={onClose}
      control={control}
      handleSubmit={handleSubmit}
      onSubmit={onSubmit}
      resetForm={resetForm}
      actionOptions={options}
    />
  );

  const sharedModals = (
    <>
      {legacyFilterModal}
      {adminLogsFilterModal}

      <ExportModal
        modalName={exportExcelModalName}
        defaultColumns={userActivityTableColumns}
        handleExport={handleExport}
      />

      {adminLogsUi2025 && adminLogsPresetOpen && (
        <Suspense fallback={<ModalFallback />}>
          <FilterPresetModal
            tableName="viewUserActivitLogs"
            filters={filters}
            setFilters={(next) => {
              setFilters(next);
              reset(next);
            }}
            setIsPresetModalOpen={setAdminLogsPresetOpen}
          />
        </Suspense>
      )}
    </>
  );

  if (adminLogsUi2025) {
    return (
      <>
        <AdminActivityLogsTableShell
          tableHeader={tableHeader}
          onBackClick={onAdminLogsBack}
          userActivities={userActivities}
          isLoading={isLoading}
          page={page}
          setPage={setPage}
          limit={limit}
          totalPages={totalPages}
          totalRecords={totalRecords}
          onExportClick={() =>
            dispatch(openModal({ modalName: exportExcelModalName }))
          }
          onFiltersClick={() => dispatch(openModal(filterModalName))}
          onPresetsClick={() => setAdminLogsPresetOpen(true)}
          rowClick={handleRowClick}
          isRowClickable={Boolean(
            userData && userData?.role === roles.ADMIN
          )}
        />
        {sharedModals}
      </>
    );
  }

  return (
    <>
      <DataTable
        tableHeader={tableHeader}
        tableUniqueKey="viewUserActivitLogs"
        filters={filters}
        setFilters={(next) => {
          setFilters(next);
          reset(next);
        }}
        tableData={tableData}
        totalPages={totalPages}
        page={page}
        setPage={setPage}
        limit={limit}
        filterModalName={filterModalName}
        exportModalName={exportExcelModalName}
        isLoading={isLoading}
        rowClick={handleRowClick}
        isRowClickable={userData && userData?.role === roles.ADMIN}
      />

      {sharedModals}
    </>
  );
};

export default UserActivityTable;
