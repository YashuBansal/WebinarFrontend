import React, { useEffect, useState } from "react";
import Box from "@mui/material/Box";
import Modal from "@mui/material/Modal";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import { useForm, Controller } from "react-hook-form";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css"; // Required CSS for the date picker
import { useDispatch, useSelector } from "react-redux";
import { closeModal } from "../../features/slices/modalSlice";
import FormInput from "../FormInput";
import { filterTruthyValues, successToast } from "../../utils/extra";
import useAddUserActivity from "../../hooks/useAddUserActivity";
import { getAllEmployees } from "../../features/actions/employee";
import { clearEmployeeData } from "../../features/slices/employee";
import { globalButton } from "../../utils/style";
import { Chip } from "@mui/material";
import ReactSelect from "react-select";

const FilterModal = ({ modalName, setFilters, filters, dateFormat }) => {
  const dispatch = useDispatch();
  const logUserActivity = useAddUserActivity();

  const { modals } = useSelector((state) => state.modals);
  const { employeeData } = useSelector((state) => state.employee);

  const open = modals[modalName] ? true : false;
  const { control, handleSubmit, register, reset } = useForm();
  const [options, setOptions] = useState([]);

  const onSubmit = (data) => {
    const filterData = filterTruthyValues(data);
    if (Object.keys(filterData).length) {
      successToast("Filters Applied");
    }
    setFilters(filterData);
    logUserActivity({
      action: "filter",
      type: "to Table",
      detailItem: "Webinars",
    });
    dispatch(closeModal(modalName));
  };

  const resetForm = () => {
    reset({
      webinarName: "",
      webinarDate: null,
      totalRegistrations: null,
      totalParticipants: null,
      totalAttendees: null,
      totalUnAttended: null,
      assignedEmployee: "",
    });
  };

  const onClose = () => {
    dispatch(closeModal(modalName));
  };

  useEffect(() => {
    if (open) {
      reset({
        ...filters,
      });
    } else {
      resetForm();
    }
  }, [open]);

  useEffect(() => {
    dispatch(
      getAllEmployees({
        page: 1,
        limit: 100,
        filters: { isActive: "active" },
      })
    );

    return () => {
      dispatch(clearEmployeeData());
    };
  }, []);

  useEffect(() => {
    if (employeeData) {
      setOptions(
        employeeData.map((employee) => ({
          value: employee._id,
          label: `${employee.userName} - ${employee.role}`,
        }))
      );
    }
  }, [employeeData]);

  return (
    <Modal open={open} onClose={onClose} disablePortal>
      <Box className="bg-white p-6 rounded-md mx-auto mt-20 w-full max-w-3xl ">
        <Typography variant="h6" className="text-center mb-4">
          Webinar Filters
        </Typography>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="max-h-[65dvh] overflow-y-auto space-y-4 p-4 border rounded-lg">
            <div className="grid  gap-4">
              <FormInput
                name="webinarName"
                label="Webinar Name"
                control={control}
              />

              {/* <Controller
                name="assignedEmployee"
                control={control}
                defaultValue={[]}
                render={({ field }) => (
                  <FormControl fullWidth>
                    <InputLabel>Assigned Employees</InputLabel>
                    <Select
                      multiple
                      label="assignedEmployee"
                      className="max-h-[54px]"
                      value={field.value || []}
                      onChange={(e) => field.onChange(e.target.value)}
                      renderValue={(selected) => {
                        const visibleChips = selected.slice(0, 2);
                        const hiddenCount =
                          selected.length - visibleChips.length;

                        return (
                          <Box
                            sx={{
                              display: "flex",
                              flexWrap: "nowrap",
                              gap: 0.5,
                              overflow: "hidden",
                              alignItems: "center",
                            }}
                          >
                            {(Array.isArray(visibleChips)
                              ? visibleChips
                              : []
                            ).map((value) => (
                              <Chip
                                key={value}
                                label={
                                  employeeData?.find(
                                    (item) => item._id === value
                                  )?.userName
                                }
                                onMouseDown={(e) => e.stopPropagation()}
                                onDelete={() => {
                                  const newValue = field.value.filter(
                                    (val) => val !== value
                                  );
                                  field.onChange(newValue);
                                }}
                              />
                            ))}
                            {hiddenCount > 0 && (
                              <Chip label={`+${hiddenCount} more`} />
                            )}
                          </Box>
                        );
                      }}
                    >
                      {options.map((item) => (
                        <MenuItem
                          key={item.value}
                          value={item.value}
                          selected={(field.value || []).includes(item.value)}
                          sx={{
                            backgroundColor: (field.value || []).includes(
                              item.value
                            )
                              ? "rgba(0, 0, 0, 0.15)" // darker shade for selected
                              : "transparent",
                            "&.Mui-selected": {
                              backgroundColor: "rgba(0, 0, 0, 0.15)",
                            },
                            "&.Mui-selected:hover": {
                              backgroundColor: "rgba(0, 0, 0, 0.35)",
                            },
                          }}
                        >
                          {item.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                )}
              /> */}
            </div>
            <div className="grid  gap-4">
              <Controller
                control={control}
                name="assignedEmployee"
                render={({ field }) => (
                  <ReactSelect
                    isMulti
                    value={options.filter((option) =>
                      field.value?.includes(option.value)
                    )}
                    className="w-full"
                    options={options}
                    onChange={(selectedOptions) => {
                      field.onChange(
                        selectedOptions.map((option) => option.value)
                      );
                    }}
                    isClearable={true}
                    placeholder="Assigned Employees"
                    menuPlacement="auto"
                    menuPortalTarget={document.body}
                    styles={{
                      menuPortal: (base) => ({
                        ...base,
                        zIndex: 9999,
                      }),
                      control: (base, state) => ({
                        ...base,
                        minHeight: "54px",
                        borderRadius: "4px",
                        boxShadow: state.isFocused
                          ? "0 0 0 2px #2684FF"
                          : base.boxShadow,
                        "&:hover": {
                          borderColor: "#2684FF",
                        },
                      }),
                      valueContainer: (base) => ({
                        ...base,
                        paddingTop: "8px",
                        paddingBottom: "8px",
                      }),
                    }}
                  />
                )}
              />
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <FormInput
                name="totalRegistrations.$gte"
                label="Total Registrations (Min)"
                control={control}
                type="number"
                validation={{
                  min: {
                    value: 0,
                    message: "Value must be at least 0",
                  },
                }}
              />
              <FormInput
                name="totalRegistrations.$lte"
                label="Total Registrations (Max)"
                control={control}
                type="number"
                validation={{
                  min: {
                    value: 0,
                    message: "Value must be at least 0",
                  },
                }}
              />
              <FormInput
                name="totalParticipants.$gte"
                label="Total Participants (Min)"
                control={control}
                type="number"
                validation={{
                  min: {
                    value: 0,
                    message: "Value must be at least 0",
                  },
                }}
              />
              <FormInput
                name="totalParticipants.$lte"
                label="Total Participants (Max)"
                control={control}
                type="number"
                validation={{
                  min: {
                    value: 0,
                    message: "Value must be at least 0",
                  },
                }}
              />
              <FormInput
                name="totalAttendees.$gte"
                label="Total Attendees (Min)"
                control={control}
                type="number"
                validation={{
                  min: {
                    value: 0,
                    message: "Value must be at least 0",
                  },
                }}
              />
              <FormInput
                name="totalAttendees.$lte"
                label="Total Attendees (Max)"
                control={control}
                type="number"
                validation={{
                  min: {
                    value: 0,
                    message: "Value must be at least 0",
                  },
                }}
              />

              <FormInput
                name="totalUnAttended.$gte"
                label="Total Un Attended (Min)"
                control={control}
                type="number"
                validation={{
                  min: {
                    value: 0,
                    message: "Value must be at least 0",
                  },
                }}
              />
              <FormInput
                name="totalUnAttended.$lte"
                label="Total Un Attended (Max)"
                control={control}
                type="number"
                validation={{
                  min: {
                    value: 0,
                    message: "Value must be at least 0",
                  },
                }}
              />
            </div>

            {/* Date Pickers */}
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="grid grid-cols-1">
                <Controller
                  name="webinarDate.$gte"
                  control={control}
                  render={({ field }) => (
                    <DatePicker
                      selected={field.value}
                      onChange={(date) => field.onChange(date)}
                      className="border p-4 min-w-full h-14 rounded-md flex-1"
                      placeholderText="Webinar Date (From)"
                      dateFormat={dateFormat}
                    />
                  )}
                />
              </div>
              <div className="grid grid-cols-1">
                <Controller
                  name="webinarDate.$lte"
                  control={control}
                  render={({ field }) => (
                    <DatePicker
                      selected={field.value}
                      onChange={(date) => field.onChange(date)}
                      className="border p-4 min-w-full h-14 rounded-md flex-1"
                      placeholderText="Webinar Date (To)"
                      dateFormat={dateFormat}
                    />
                  )}
                />
              </div>
            </div>
          </div>

          {/* Buttons */}
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
  );
};

export default FilterModal;
