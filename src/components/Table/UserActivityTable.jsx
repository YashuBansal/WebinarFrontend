import React, { useCallback, useEffect, useMemo, useState } from "react";
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

import { closeModal } from "../../features/slices/modalSlice";
import { userActivityTableColumns } from "../../utils/columnData";
import DataTable from "./DataTable"; // Adjust this import path as needed
import { ActivityActions, filterTruthyValues } from "../../utils/extra";
import ExportModal from "../Export/ExportLogsModal";
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
  } = props;

  const { control, handleSubmit, reset } = useForm();

  const { userData } = useSelector((state) => state.auth);

  const { userActivities, totalPages, isLoading } = useSelector(
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

  const handleRowClick = useCallback((row) => {
    console.log(row);
    if (row?.action === "note" && userData && userData?.role === roles.ADMIN) {
      const email = row?.item;
      navigate(`/particularContact?email=${email}`);
    }
  }, []);

  const handleExport = ({ limit, columns }) => {
    dispatch(closeModal(exportExcelModalName));
    handleExportData(limit, columns);
  };

  return (
    <>
      <DataTable
        tableHeader={tableHeader}
        tableUniqueKey="viewUserActivitLogs"
        filters={filters}
        setFilters={(filters) => {
          setFilters(filters);
          reset(filters);
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
              <button className={globalButton} onClick={resetForm}>
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

      <ExportModal
        modalName={exportExcelModalName}
        defaultColumns={userActivityTableColumns}
        handleExport={handleExport}
      />
    </>
  );
};

export default UserActivityTable;
