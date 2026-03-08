import React, { memo, useEffect, useState } from "react";
import Box from "@mui/material/Box";
import Modal from "@mui/material/Modal";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import Select from "@mui/material/Select";
import ReactSelect from "react-select";
import MenuItem from "@mui/material/MenuItem";
import ListItemText from "@mui/material/ListItemText";

import { useForm, Controller } from "react-hook-form";
import { useDispatch, useSelector } from "react-redux";
import { closeModal } from "../../features/slices/modalSlice";
import FormInput from "../FormInput";
import {
  DateFormat,
  filterTruthyValues,
  successToast,
} from "../../utils/extra";
import useAddUserActivity from "../../hooks/useAddUserActivity";
import { getCustomOptionsForFilters } from "../../features/actions/globalData";
import {
  salesAttendeesSortByOptions,
  webinarAttendeesSortByOptions,
} from "../../utils/columnData";
import { setWebinarAttendeesFilters } from "../../features/slices/filters.slice";
import tagsService from "../../services/tagsService";
import { getAllProductsByAdminId } from "../../features/actions/product";
import { getAllEmployees } from "../../features/actions/employee";
import { clearEmployeeData } from "../../features/slices/employee";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { globalButton } from "../../utils/style";
const FilterModal = ({
  modalName,
  setPage,
  notAllowed = [],
  tabValue,
  label,
  handleCopy,
  onTrigger = () => {},
}) => {
  const dispatch = useDispatch();
  const logUserActivity = useAddUserActivity();

  const filterOptions =
    tabValue === "preWebinar"
      ? webinarAttendeesSortByOptions
      : salesAttendeesSortByOptions;
  const { leadTypeData } = useSelector((state) => state.assign);
  const { subscription, userData } = useSelector((state) => state.auth);

  const dateFormat = userData?.dateFormat || DateFormat.DD_MM_YYYY;

  const { customOptionsForFilters } = useSelector((state) => state.globalData);
  const { control, handleSubmit, reset, watch } = useForm();
  const {
    webinarAttendeesSortBy,
    webinarAttendeesFilters,
    salesAttendeesSortBy,
  } = useSelector((state) => state.filters);
  const { productDropdownData } = useSelector((state) => state.product);
  const sortByOption =
    tabValue === "preWebinar"
      ? webinarAttendeesSortBy || {
          sortBy: webinarAttendeesSortByOptions[0].value,
          sortOrder: "desc",
        }
      : salesAttendeesSortBy || {
          sortBy: salesAttendeesSortByOptions[0].value,
          sortOrder: "desc",
        };

  const [sortBy, setSortBy] = useState(sortByOption);
  const [tagData, setTagData] = useState([]);
  const [leadTypeOptions, setLeadTypeOptions] = useState([]);
  const tableConfig = subscription?.plan?.attendeeTableConfig || {};

  const selectedType =
    tabValue === "preWebinar" ? "EMPLOYEE_REMINDER" : "EMPLOYEE_SALES";
  const { employeeData: assignedEmployees } = useSelector(
    (state) => state.employee
  );
  const employeeOptions = assignedEmployees
    .filter((item) => item?.role === selectedType)
    .map((item) => ({
      value: item?._id,
      label: item?.userName,
    }));

  const onSubmit = (data) => {
    // if (selectedOption) data.leadType = selectedOption;
    const filterData = filterTruthyValues(data);
    if (Object.keys(filterData).length) {
      successToast("Filters Applied");
    }
    console.log(
      "trigger is triggering -------  > ",
      webinarAttendeesFilters,
      Object.keys(webinarAttendeesFilters)?.length
    );

    if (Object.keys(webinarAttendeesFilters)?.length === 0) {
      onTrigger();
    }
    setPage(1);
    dispatch(
      setWebinarAttendeesFilters({
        filters: filterData,
        sortBy: sortBy,
        recordType: tabValue,
      })
    );
    dispatch(closeModal(modalName));
    logUserActivity({
      action: "filter",
      type: "to Table",
      detailItem: "Attendees",
    });
  };

  const onCopy = (e) => {
    e.preventDefault();
    const formValues = watch();
    const filterData = filterTruthyValues(formValues);
    handleCopy(filterData)
  }

  const resetForm = (e) => {
    e.preventDefault();
    reset({
      email: "",
      firstName: "",
      lastName: "",
      "timeInSession.$gte": null,
      "timeInSession.$lte": null,
      "attendedCount.$gte": null,
      "attendedCount.$lte": null,
      "registeredCount.$gte": null,
      "registeredCount.$lte": null,
      gender: "",
      phone: "",
      location: "",
      profession: "",
    });
  };

  const onClose = () => {
    dispatch(closeModal(modalName));
  };

  useEffect(() => {
    tagsService.getTags().then((res) => {
      if (res.success) {
        setTagData(res.data);
      }
    });
    dispatch(getCustomOptionsForFilters());
    setTimeout(() => {
      reset({
        ...webinarAttendeesFilters,
      });
    }, 500);

    dispatch(getAllProductsByAdminId());
    if (!notAllowed.includes("enrollments")) {
      dispatch(
        getAllEmployees({
          page: 1,
          limit: 100,
          filters: { isActive: "active" },
        })
      );
    }

    return () => {
      dispatch(clearEmployeeData());
    };
  }, []);

  useEffect(() => {
    if (!leadTypeData) return;
    const options = leadTypeData.map((item) => ({
      value: item._id,
      label: item.label,
      color: item.color,
    }));
    setLeadTypeOptions(options);
  }, [leadTypeData]);

  return (
    <Modal open={true} onClose={onClose} disablePortal>
      <Box className="bg-white px-2 py-6 md:p-6 rounded-md mt-14 md:mx-auto md:w-full max-w-5xl ">
        <Typography variant="h6" className="text-center mb-4">
          {label || "Attendees Filter"}
        </Typography>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="max-h-80 md:max-h-[60dvh] overflow-y-auto space-y-4 p-4 border rounded-lg">
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {tableConfig?.email?.filterable && (
                <FormInput name="email" label="Email" control={control} />
              )}

              {tableConfig?.firstName?.filterable && (
                <FormInput
                  name="firstName"
                  label="First Name"
                  control={control}
                />
              )}

              {tableConfig?.lastName?.filterable && (
                <FormInput
                  name="lastName"
                  label="Last Name"
                  control={control}
                />
              )}

              {tableConfig?.gender?.filterable && (
                <Controller
                  name="gender"
                  control={control}
                  defaultValue=""
                  render={({ field }) => (
                    <FormControl fullWidth>
                      <InputLabel id="gender-label">Gender</InputLabel>
                      <Select
                        {...field}
                        labelId="gender-label"
                        label="Gender"
                        value={field.value || ""}
                      >
                        <MenuItem value="">All</MenuItem>
                        <MenuItem value="male">Male</MenuItem>
                        <MenuItem value="female">Female</MenuItem>
                        <MenuItem value="other">Other</MenuItem>
                      </Select>
                    </FormControl>
                  )}
                />
              )}

              {tableConfig?.timeInSession?.filterable &&
                !notAllowed.includes("timeInSession") && (
                  <>
                    <FormInput
                      name="timeInSession.$gte"
                      label="Time in Session (Min)"
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
                      name="timeInSession.$lte"
                      label="Time in Session (Max)"
                      control={control}
                      type="number"
                      validation={{
                        min: {
                          value: 0,
                          message: "Value must be at least 0",
                        },
                      }}
                    />
                  </>
                )}

              {tableConfig?.registeredCount?.filterable &&
                !notAllowed.includes("registeredCount") && (
                  <>
                    <FormInput
                      name="registeredCount.$gte"
                      label="Registered Webinars (Min)"
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
                      name="registeredCount.$lte"
                      label="Registered Webinars (Max)"
                      control={control}
                      type="number"
                      validation={{
                        min: {
                          value: 0,
                          message: "Value must be at least 0",
                        },
                      }}
                    />
                  </>
                )}

              {tableConfig?.attendedCount?.filterable &&
                !notAllowed.includes("attendedCount") && (
                  <>
                    <FormInput
                      name="attendedCount.$gte"
                      label="Attended Webinars (Min)"
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
                      name="attendedCount.$lte"
                      label="Attended Webinars (Max)"
                      control={control}
                      type="number"
                      validation={{
                        min: {
                          value: 0,
                          message: "Value must be at least 0",
                        },
                      }}
                    />
                  </>
                )}

              {tableConfig?.phone?.filterable && (
                <FormInput
                  name="phone"
                  label="Phone"
                  control={control}
                  // validation={{
                  //   pattern: {
                  //     value: /^[0-9]$/,
                  //     message: "Phone number must be 10 digits",
                  //   },
                  // }}
                />
              )}
              {tableConfig?.location?.filterable && (
                <FormInput name="location" label="Location" control={control} />
              )}

              {tableConfig?.profession?.filterable && (
                <FormInput name="profession" label="Profession" control={control} />
              )}

              {tableConfig?.source?.filterable && (
                <FormInput name="source" label="Source" control={control} />
              )}

              {/* {tableConfig?.location?.filterable && (
                <div className="grid grid-cols-1">
                  <Controller
                    name="location"
                    control={control}
                    defaultValue={[]} // Default to an empty array for multiple values
                    render={({ field }) => (
                      <Autocomplete
                        multiple
                        freeSolo // Allows typing arbitrary values
                        options={[]} // No predefined suggestions, user types everything
                        value={field.value || []} // Ensure value is always an array
                        onChange={(event, newValue) => {
                          // newValue is an array of strings (the typed location)
                          field.onChange(newValue);
                        }}
                        renderTags={(value, getTagProps) =>
                          value.map((option, index) => (
                            <Chip
                              variant="outlined"
                              label={option}
                              {...getTagProps({ index })}
                              key={option + "-" + index} // Added key for React list
                            />
                          ))
                        }
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            variant="outlined"
                            label="Locations"
                            placeholder="Type locations and press Enter"
                            // You can add error display from react-hook-form if needed
                            // error={!!errors.locations}
                            // helperText={errors.locations?.message}
                          />
                        )}
                        fullWidth // Make Autocomplete take full width
                      />
                    )}
                  />
                </div>
              )}

              {tableConfig?.source?.filterable && (
                <div className="grid grid-cols-1">
                <Controller
                  name="source"
                  control={control}
                  defaultValue={[]} // Default to an empty array for multiple values
                  render={({ field }) => (
                    <Autocomplete
                      multiple
                      freeSolo // Allows typing arbitrary values
                      options={[]} // No predefined suggestions, user types everything
                      value={field.value || []} // Ensure value is always an array
                      onChange={(event, newValue) => {
                        // newValue is an array of strings (the typed location)
                        field.onChange(newValue);
                      }}
                      renderTags={(value, getTagProps) =>
                        value.map((option, index) => (
                          <Chip
                            variant="outlined"
                            label={option}
                            {...getTagProps({ index })}
                            key={option + "-" + index} // Added key for React list
                          />
                        ))
                      }
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          variant="outlined"
                          label="Sources"
                          placeholder="Type sources and press Enter"
                        />
                      )}
                      fullWidth // Make Autocomplete take full width
                    />
                  )}
                />
              </div>
              )} */}
              {tableConfig?.status?.filterable && (
                <Controller
                  control={control}
                  name="status"
                  render={({ field }) => (
                    <ReactSelect
                      isMulti
                      value={customOptionsForFilters.filter((option) =>
                        field.value?.includes(option.label)
                      )}
                      className="w-full"
                      options={customOptionsForFilters}
                      onChange={(selectedOptions) => {
                        field.onChange(
                          selectedOptions.map((option) => option.label)
                        );
                      }}
                      isClearable={true}
                      placeholder="Status"
                      menuPlacement="auto"
                      menuPortalTarget={document.body}
                      styles={{
                        // ensure the dropdown is above other elements
                        menuPortal: (base) => ({
                          ...base,
                          zIndex: 9999,
                        }),
                        // increase height & round corners of the select box
                        control: (base, state) => ({
                          ...base,
                          minHeight: "54px", // desired height
                          borderRadius: "4px", // round corners
                          boxShadow: state.isFocused
                            ? "0 0 0 2px #2684FF"
                            : base.boxShadow,
                          "&:hover": {
                            borderColor: "#2684FF",
                          },
                        }),
                        // add some vertical padding inside the value container
                        valueContainer: (base) => ({
                          ...base,
                          paddingTop: "8px",
                          paddingBottom: "8px",
                        }),
                      }}
                    />
                  )}
                />
              )}

              {tableConfig?.leadType?.filterable && (
                <Controller
                  control={control}
                  name="leadType"
                  render={({ field }) => (
                    <ReactSelect
                      isMulti
                      value={leadTypeOptions.filter((option) =>
                        field.value?.includes(option.value)
                      )}
                      className="w-full"
                      options={leadTypeOptions}
                      getOptionLabel={(e) => (
                        <div className="flex items-center gap-2">
                          <span
                            style={{
                              display: "inline-block",
                              width: 10,
                              height: 10,
                              borderRadius: "50%",
                              backgroundColor: e.color,
                            }}
                          />
                          {e.label}
                        </div>
                      )}
                      onChange={(selectedOptions) => {
                        field.onChange(
                          selectedOptions.map((option) => option.value)
                        );
                      }}
                      isClearable={true}
                      placeholder="Lead Type"
                      menuPlacement="auto"
                      menuPortalTarget={document.body}
                      styles={{
                        // ensure the dropdown is above other elements
                        menuPortal: (base) => ({
                          ...base,
                          zIndex: 9999,
                        }),
                        // increase height & round corners of the select box
                        control: (base, state) => ({
                          ...base,
                          minHeight: "54px", // desired height
                          borderRadius: "4px", // round corners
                          boxShadow: state.isFocused
                            ? "0 0 0 2px #2684FF"
                            : base.boxShadow,
                          "&:hover": {
                            borderColor: "#2684FF",
                          },
                        }),
                        // add some vertical padding inside the value container
                        valueContainer: (base) => ({
                          ...base,
                          paddingTop: "8px",
                          paddingBottom: "8px",
                        }),
                      }}
                    />
                  )}
                />
              )}

              {tableConfig?.tags?.filterable && (
                <Controller
                  control={control}
                  name="tags"
                  render={({ field }) => (
                    <ReactSelect
                      isMulti
                      value={tagData
                        .map((item) => ({
                          label: item.name,
                          value: item.name,
                        }))
                        .filter((option) =>
                          field.value?.includes(option.value)
                        )}
                      className="w-full"
                      options={tagData.map((item) => ({
                        label: item.name,
                        value: item.name,
                      }))}
                      onChange={(selectedOptions) => {
                        field.onChange(
                          selectedOptions.map((option) => option.value)
                        );
                      }}
                      isClearable={true}
                      placeholder="Tags"
                      menuPlacement="auto"
                      menuPortalTarget={document.body}
                      styles={{
                        // ensure the dropdown is above other elements
                        menuPortal: (base) => ({
                          ...base,
                          zIndex: 9999,
                        }),
                        // increase height & round corners of the select box
                        control: (base, state) => ({
                          ...base,
                          minHeight: "54px", // desired height
                          borderRadius: "4px", // round corners
                          boxShadow: state.isFocused
                            ? "0 0 0 2px #2684FF"
                            : base.boxShadow,
                          "&:hover": {
                            borderColor: "#2684FF",
                          },
                        }),
                        // add some vertical padding inside the value container
                        valueContainer: (base) => ({
                          ...base,
                          paddingTop: "8px",
                          paddingBottom: "8px",
                        }),
                      }}
                    />
                  )}
                />
              )}

              {tableConfig?.enrollments?.filterable &&
                !notAllowed.includes("enrollments") && (
                  <Controller
                    control={control}
                    name="enrollments"
                    render={({ field }) => (
                      <ReactSelect
                        isMulti
                        value={(
                          productDropdownData?.map((product) => ({
                            value: product._id,
                            label: `${product.name}`,
                          })) || []
                        ).filter((option) =>
                          field.value?.includes(option.value)
                        )}
                        className="w-full"
                        options={
                          productDropdownData?.map((product) => ({
                            value: product._id,
                            label: `${product.name} | Level - ${product.level}`,
                          })) || []
                        }
                        onChange={(selectedOptions) => {
                          field.onChange(
                            selectedOptions.map((option) => option.value)
                          );
                        }}
                        isClearable={true}
                        placeholder="Enrollments"
                        menuPlacement="auto"
                        menuPortalTarget={document.body}
                        styles={{
                          // ensure the dropdown is above other elements
                          menuPortal: (base) => ({
                            ...base,
                            zIndex: 9999,
                          }),
                          // increase height & round corners of the select box
                          control: (base, state) => ({
                            ...base,
                            minHeight: "54px", // desired height
                            borderRadius: "4px", // round corners
                            boxShadow: state.isFocused
                              ? "0 0 0 2px #2684FF"
                              : base.boxShadow,
                            "&:hover": {
                              borderColor: "#2684FF",
                            },
                          }),
                          // add some vertical padding inside the value container
                          valueContainer: (base) => ({
                            ...base,
                            paddingTop: "8px",
                            paddingBottom: "8px",
                          }),
                        }}
                      />
                    )}
                  />
                )}

              {tableConfig?.isAssigned?.filterable &&
                !notAllowed.includes("isAssigned") && (
                  <Controller
                    control={control}
                    name="isAssigned"
                    render={({ field }) => (
                      <ReactSelect
                        isMulti
                        value={employeeOptions.filter((option) =>
                          field.value?.includes(option.value)
                        )}
                        className="w-full"
                        options={employeeOptions}
                        onChange={(selectedOptions) => {
                          field.onChange(
                            selectedOptions.map((option) => option.value)
                          );
                        }}
                        isClearable={true}
                        placeholder="Assigned To"
                        menuPlacement="auto"
                        menuPortalTarget={document.body}
                        styles={{
                          // ensure the dropdown is above other elements
                          menuPortal: (base) => ({
                            ...base,
                            zIndex: 9999,
                          }),
                          // increase height & round corners of the select box
                          control: (base, state) => ({
                            ...base,
                            minHeight: "54px", // desired height
                            borderRadius: "4px", // round corners
                            boxShadow: state.isFocused
                              ? "0 0 0 2px #2684FF"
                              : base.boxShadow,
                            "&:hover": {
                              borderColor: "#2684FF",
                            },
                          }),
                          // add some vertical padding inside the value container
                          valueContainer: (base) => ({
                            ...base,
                            paddingTop: "8px",
                            paddingBottom: "8px",
                          }),
                        }}
                      />
                    )}
                  />
                )}

              {!notAllowed.includes("assignmentDate") && (
                <>
                  <div className="grid grid-cols-1">
                    <Controller
                      name="createdAt.$gte"
                      control={control}
                      render={({ field }) => (
                        <DatePicker
                          selected={field.value}
                          onChange={(date) => field.onChange(date)}
                          className="border p-4 min-w-full h-14 rounded-md flex-1"
                          placeholderText="Assignment Date (From)"
                          dateFormat={dateFormat}
                        />
                      )}
                    />
                  </div>
                  <div className="grid grid-cols-1">
                    <Controller
                      name="createdAt.$lte"
                      control={control}
                      render={({ field }) => (
                        <DatePicker
                          selected={field.value}
                          onChange={(date) => field.onChange(date)}
                          className="border p-4 min-w-full h-14 rounded-md flex-1"
                          placeholderText="Assignment Date (To)"
                          dateFormat={dateFormat}
                        />
                      )}
                    />
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Buttons */}
          <div className="p-4 border-t border-gray-200 space-y-2">
            <p className="text-sm font-medium">Sort By</p>
            <div className="grid grid-cols-2 gap-2">
              <FormControl fullWidth>
                <Select
                  labelId="sort-by-select-label"
                  value={sortBy.sortBy || ""}
                  className="shadow font-semibold h-10"
                  onChange={(e) =>
                    setSortBy((prev) => ({
                      ...prev,
                      sortBy: e.target.value,
                    }))
                  }
                  displayEmpty
                  renderValue={(selected) => {
                    if (!selected) {
                      return (
                        <span style={{ color: "#888" }}>Select Sort By</span> // Placeholder style
                      );
                    }
                    const selectedOption = filterOptions.find(
                      (option) => option.value === selected
                    );

                    return (
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                        }}
                      >
                        <span>{selectedOption?.label}</span>
                      </div>
                    );
                  }}
                >
                  {filterOptions.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      <ListItemText primary={option.label} />
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl fullWidth>
                <Select
                  labelId="sort-order-select-label"
                  value={sortBy.sortOrder || ""}
                  className="shadow font-semibold h-10"
                  onChange={(e) =>
                    setSortBy((prev) => ({
                      ...prev,
                      sortOrder: e.target.value,
                    }))
                  }
                  displayEmpty
                  renderValue={(selected) => {
                    if (!selected) {
                      return (
                        <span style={{ color: "#888" }}>Select Order</span>
                      );
                    }
                    const options = [
                      { label: "A - Z", value: "asc" },
                      { label: "Z - A", value: "desc" },
                    ];
                    const selectedOption = options.find(
                      (o) => o.value === selected
                    );
                    return (
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                        }}
                      >
                        <span className="capitalize">
                          {selectedOption?.label}
                        </span>
                      </div>
                    );
                  }}
                >
                  {[
                    { label: "A - Z", value: "asc" },
                    { label: "Z - A", value: "desc" },
                  ].map(({ label, value }) => (
                    <MenuItem key={value} value={value}>
                      <ListItemText primary={label} />
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </div>
            <div className="flex justify-between gap-2  flex-col md:flex-row">
              <div className="flex justify-between md:justify-center gap-2 md:w-auto w-full">
                <button onClick={resetForm} className={globalButton}>
                  Reset
                </button>
                {handleCopy && (
                  <button
                    onClick={onCopy}
                    className={`${globalButton} bg-indigo-500 hover:bg-indigo-600 focus:ring-indigo-500`}
                  >
                    Copy API
                  </button>
                )}
              </div>
              <div className="flex gap-2 justify-between">
                <Button onClick={onClose} variant="outlined" color="secondary">
                  Cancel
                </Button>
                <button type="submit" className={globalButton}>
                  Apply Filters
                </button>
              </div>
            </div>
          </div>
        </form>
      </Box>
    </Modal>
  );
};

export default memo(FilterModal);
