import React, { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { useDispatch, useSelector } from "react-redux";
import {
  addEmployee,
  getEmployee,
  updateEmployee,
} from "../../features/actions/employee";
import { useNavigate, useParams } from "react-router-dom";
import {
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  FormHelperText,
  TextField,
  Button,
  InputAdornment,
  IconButton,
  Chip,
  Box,
} from "@mui/material";
import { ClipLoader } from "react-spinners";
import { clearSuccess } from "../../features/slices/employee";
import { getRoleNameByID } from "../../utils/roles";
import useAddUserActivity from "../../hooks/useAddUserActivity";
import FormInput from "../../components/FormInput";
import { Visibility, VisibilityOff } from "@mui/icons-material";
import tagsService from "../../services/tagsService";
import { clearSingleClientData } from "../../features/slices/client";
import ReactSelect from "react-select";
const CreateEmployee = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { id } = useParams();
  const logUserActivity = useAddUserActivity();
  const [tagData, setTagData] = useState([]);

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
    control,
  } = useForm({
    defaultValues: {
      role: "",
      tags: [],
    },
  });
  const { userData, subscription } = useSelector((state) => state.auth);
  const employeeInactivity = subscription?.plan?.employeeInactivity;
  const { isLoading, isSuccess, singleEmployeeData } = useSelector(
    (state) => state.employee
  );

  const [showPassword, setShowPassword] = useState(false);

  const togglePasswordVisibility = () => {
    setShowPassword((prev) => !prev);
  };

  const onSubmit = (data) => {
    const newData = {
      ...data,
      validCallTime: isNaN(Number(data.validCallTime))
        ? 0
        : Number(data.validCallTime),
      dailyContactLimit: isNaN(Number(data.dailyContactLimit))
        ? 0
        : Number(data.dailyContactLimit),
      adminId: userData?._id,
    };
    if (id) {
      dispatch(updateEmployee({ id, data: newData })).then((res) => {
        if (res.meta.requestStatus === "fulfilled") {

          handleSuccess(newData);
        }
      });
    } else {
      dispatch(addEmployee(newData)).then((res) => {
        if (res.meta.requestStatus === "fulfilled") {


          handleSuccess(newData);
        }
      });
    }
  };

useEffect(() => {
  if(isSuccess){
    navigate("/employees");

  }
},[isSuccess, navigate])

  const handleSuccess = (newData) => {
    dispatch(clearSingleClientData());
    logUserActivity({
      action: id ? "edit" : "create",
      type: "Employee",
      detailItem: newData?.userName,
    });
  };

  // Numeric validation (positive values only)
  const numericValidation = (value) => {
    return /^[0-9]+$/.test(value) || "Only positive numbers are allowed";
  };

  useEffect(() => {
    reset({});
    if (singleEmployeeData && id) {
      const roleName = getRoleNameByID(singleEmployeeData?.role)
        .split(" ")
        .join("_");
      reset({
        role: roleName,
        userName: singleEmployeeData?.userName,
        email: singleEmployeeData?.email,
        phone: singleEmployeeData?.phone,
        validCallTime: singleEmployeeData?.validCallTime,
        dailyContactLimit: singleEmployeeData?.dailyContactLimit,
        inactivityTime: singleEmployeeData?.inactivityTime || 10,
        tags: singleEmployeeData?.tags || [],
      });
    }
  }, [singleEmployeeData]);

  useEffect(() => {
    if (id) {
      dispatch(getEmployee(id));
    }
    return () => {
      reset();
    };
  }, [id]);

  useEffect(() => {
    tagsService.getTags().then((res) => {
      if (res.success) {
        setTagData(res.data);
      }
    });
  }, []);

  return (
    <div className="p-10">
      <div className="mt-10">
        <div className="flex justify-center"></div>
        <div className="bg-white rounded-lg shadow-lg sm:rounded-lg sm:max-w-5xl mt-8 mx-auto">
          <h3 className="text-gray-700 text-base text-center bg-gray-100 font-medium sm:text-xl p-2 rounded-t-lg uppercase">
            {id ? "Update" : "Add"} Employee
          </h3>
          <form
            className="space-y-6 mx-8 sm:mx-2 p-4 py-6"
            onSubmit={handleSubmit(onSubmit)}
          >
            <div className="sm:grid sm:grid-cols-2 sm:gap-6">
              {/* User Name */}
              <div className="w-full">
                <FormInput
                  name="userName"
                  label="User Name"
                  control={control}
                  validation={{
                    required: "User Name is required",
                  }}
                />
              </div>
              {/* Email */}

              <div className="w-full">
                <FormInput
                  name="email"
                  label="Email"
                  control={control}
                  validation={{ required: "Email is required" }}
                />
              </div>
            </div>

            <div className="sm:grid sm:grid-cols-2 sm:gap-6">
              {/* Valid Call Time (seconds) */}
              <div className="w-full">
                {/* <TextField
                  {...register("", )}
                  
                  type="number"
                  variant="outlined"
                  fullWidth
                  error={Boolean(errors.validCallTime)}
                  helperText={errors.validCallTime?.message}
                  className="mt-2"
                  inputProps={{ min: 0 }}
                /> */}
                <FormInput
                  name="validCallTime"
                  label="Valid Call Time (seconds)"
                  control={control}
                  validation={{
                    required: "Valid Call Time is required",
                    validate: numericValidation,
                  }}
                />
              </div>

              {/* Daily Contact Limit */}
              <div className="w-full">
                <FormInput
                  name="dailyContactLimit"
                  label="Daily Contact Limit"
                  control={control}
                  validation={{
                    required: "Daily Contact Limit is required",
                    validate: numericValidation,
                  }}
                />
              </div>
            </div>

            <div className="sm:grid sm:grid-cols-2 sm:gap-6">
              {/* Phone Number */}
              <div className="w-full">
                <FormInput
                  name="phone"
                  label="Phone Number"
                  placeholder="+91 1234567890"
                  control={control}
                  validation={{
                    required: "Phone number is required",
                    pattern: {
                      value: /^\+\d{1,3}\d{9}$/,
                      message:
                        "10 Digit Phone number with Country Code is required, eg: +911234567890",
                    },
                  }}
                />
              </div>

              {/* <Controller
                name="tags"
                control={control}
                defaultValue={[]}
                render={({ field }) => (
                  <FormControl fullWidth>
                    <InputLabel>Tags</InputLabel>
                    <Select
                      multiple
                      label="Tags"
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
                                label={value}
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
                      {tagData.map((item) => (
                        <MenuItem
                          key={item._id}
                          value={item.name}
                          selected={field.value.includes(item.name)}
                          sx={{
                            backgroundColor: field.value.includes(item.name)
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
                          {item.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                )}
              /> */}

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
            </div>
            <div className="sm:grid sm:grid-cols-2 sm:gap-6">
              {employeeInactivity && (
                <FormInput
                  name="inactivityTime"
                  label="Inactivity Time (Seconds)"
                  control={control}
                  type="number"
                  validation={{
                    required: "Inactivity Time is required",
                    min: {
                      value: 1,
                      message: "Value must be at least 1",
                    },
                  }}
                />
              )}

              {/* Employee Type */}
              {!id && (
                <div className="w-full">
                  <FormControl
                    fullWidth
                    variant="outlined"
                    error={!!errors.role}
                  >
                    <InputLabel>Employee Type</InputLabel>
                    <Controller
                      control={control}
                      name="role"
                      rules={{ required: "Role is required" }}
                      render={({ field }) => (
                        <Select {...field} label="Employee Type">
                          <MenuItem value="" disabled>
                            Choose Employee Type
                          </MenuItem>
                          <MenuItem value="EMPLOYEE_SALES">Sales</MenuItem>
                          <MenuItem value="EMPLOYEE_REMINDER">
                            Reminder
                          </MenuItem>
                        </Select>
                      )}
                    />
                    {errors.role && (
                      <FormHelperText>{errors.role.message}</FormHelperText>
                    )}
                  </FormControl>
                </div>
              )}
            </div>

            <div className="sm:grid sm:grid-cols-2 sm:gap-6">
              {/* Password */}
              <div className="w-full">
                <TextField
                  {...register("password", {
                    required: id ? false : "Password is required",
                  })}
                  label="Password"
                  type={showPassword ? "text" : "password"}
                  fullWidth
                  variant="outlined"
                  error={!!errors.password}
                  helperText={errors.password?.message}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton onClick={() => togglePasswordVisibility()}>
                          {showPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
              </div>

              {/* Confirm Password */}
              <div className="w-full">
                <TextField
                  {...register("confirmPassword", {
                    required: id ? false : "Please confirm your password",
                    validate: (value) =>
                      value === watch("password") || "Passwords do not match",
                  })}
                  label="Confirm Password"
                  type={showPassword ? "text" : "password"}
                  fullWidth
                  error={!!errors.confirmPassword}
                  helperText={errors.confirmPassword?.message}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton onClick={() => togglePasswordVisibility()}>
                          {showPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
              </div>
            </div>

            <div className="mt-6">
              <Button
                type="submit"
                variant="contained"
                fullWidth
                className="btn-grad"
                disabled={isLoading}
              >
                {isLoading ? (
                  <ClipLoader color="#fff" size={20} />
                ) : id ? (
                  "Update"
                ) : (
                  "Create"
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateEmployee;
