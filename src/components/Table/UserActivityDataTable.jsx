import React, { useEffect, useMemo, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { Modal, Typography, Box, Button } from "@mui/material";
import { useForm, Controller } from "react-hook-form";
import { DatePicker } from "../ui/date-picker";

import { closeModal } from "../../features/slices/modalSlice";
import { userActivityTableColumns } from "../../utils/columnData";
import DataTable from "../common/DataTable"; // Adjust this import path as needed

const dateFormat = "dd/MM/yyyy"; // Or whatever format you use

const UserActivityTable = (props) => {
  const dispatch = useDispatch();
  const { page, setPage } = props;
  const [filters, setFilters] = useState({});

  const { control, handleSubmit, reset } = useForm();

  const { userActivities, totalPages, isLoading } = useSelector(
    (state) => state.userActivity
  );
  const LIMIT = useSelector(
    (state) => state.pageLimits["User Activity Table"] || 10
  );
  const { modals } = useSelector((state) => state.modals);

  const tableHeader = "User Activity Table";
  const filterModalName = "userActivityFilterModal";
  const exportExcelModalName = "userActivityExportExcelModal";

  const open = modals[filterModalName] || false;
  console.log(open);

  const onClose = () => {
    dispatch(closeModal(filterModalName));
  };

  const onSubmit = (data) => {
    setFilters(data);
    onClose();
  };

  const resetForm = () => {
    reset();
    setFilters({});
  };

  const tableData = useMemo(() => {
    return {
      columns: userActivityTableColumns,
      rows: userActivities,
    };
  }, [userActivities]);

  useEffect(() => {
    if(open){
      reset({

      })
    }
  },[open])

  return (
    <>
      <DataTable
        tableHeader={tableHeader}
        tableUniqueKey="viewAssignmentsTable"
        filters={filters}
        setFilters={setFilters}
        tableData={tableData}
        totalPages={totalPages}
        page={page}
        setPage={setPage}
        limit={LIMIT}
        filterModalName={filterModalName}
        exportModalName={exportExcelModalName}
        isLoading={isLoading}
      />

      <Modal open={open} onClose={onClose} disablePortal>
        <Box className="bg-white p-6 rounded-md mx-auto mt-20 w-full max-w-2xl">
          <Typography variant="h6" className="text-center mb-4">
            User Activity Logs Filters
          </Typography>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="max-h-[65dvh] overflow-y-auto space-y-4 p-4 border rounded-lg">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Controller
                    name="webinarDate.$gte"
                    control={control}
                    render={({ field }) => (
                      <DatePicker
                        date={field.value}
                        setDate={field.onChange}
                        className="min-w-full h-14 rounded-md"
                        placeholder="Webinar Date (From)"
                      />
                    )}
                  />
                </div>
                <div>
                  <Controller
                    name="webinarDate.$lte"
                    control={control}
                    render={({ field }) => (
                      <DatePicker
                        date={field.value}
                        setDate={field.onChange}
                        className="min-w-full h-14 rounded-md"
                        placeholder="Webinar Date (To)"
                      />
                    )}
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-between">
              <Button variant="contained" color="primary" onClick={resetForm}>
                Reset
              </Button>
              <div className="flex gap-2">
                <Button onClick={onClose} variant="outlined" color="secondary">
                  Cancel
                </Button>
                <Button type="submit" variant="contained" color="primary">
                  Apply Filters
                </Button>
              </div>
            </div>
          </form>
        </Box>
      </Modal>
    </>
  );
};

export default UserActivityTable;
