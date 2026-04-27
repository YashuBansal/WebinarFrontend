import React, { useEffect, useMemo, useState } from "react";
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
import AppLoader from "../../components/AppLoader";
import { clearSuccess } from "../../features/slices/employee";
import { getRoleNameByID } from "../../utils/roles";
import useAddUserActivity from "../../hooks/useAddUserActivity";
import FormInput from "../../components/FormInput";
import { Visibility, VisibilityOff } from "@mui/icons-material";
import tagsService from "../../services/tagsService";
import { clearSingleClientData } from "../../features/slices/client";
import ReactSelect from "react-select";
import useUserSubscription from "../../hooks/useUserSubscription";
import { useTheme } from "../../contexts/ThemeContext";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import ScopedCssBaseline from "@mui/material/ScopedCssBaseline";

const CreateEmployee = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { id } = useParams();
  const logUserActivity = useAddUserActivity();
  const [tagData, setTagData] = useState([]);
  const { theme } = useTheme();
  const isDark = theme === "dark";

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
  const { userData } = useSelector((state) => state.auth);
  const { data: subscription } = useUserSubscription();
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

  const muiTheme = useMemo(
    () =>
      createTheme({
        palette: {
          mode: isDark ? "dark" : "light",
          primary: { main: "#22B573" },
          secondary: { main: "#FF6B35" },
          background: {
            default: isDark ? "#0f172a" : "#f8fafc",
            paper: isDark ? "#1e293b" : "#ffffff",
          },
          text: {
            primary: isDark ? "#f8fafc" : "#071028",
            secondary: isDark ? "#94a3b8" : "#64748b",
          },
        },
        shape: { borderRadius: 12 },
        typography: {
          fontFamily:
            '"Inter", "Poppins", "Roboto", system-ui, sans-serif',
        },
        components: {
          MuiOutlinedInput: {
            styleOverrides: {
              root: { borderRadius: 12 },
              notchedOutline: {
                borderColor: isDark
                  ? "rgba(148, 163, 184, 0.35)"
                  : "rgba(226, 232, 240, 1)",
              },
            },
          },
          MuiInputLabel: {
            styleOverrides: {
              root: { fontWeight: 500 },
            },
          },
          MuiButton: {
            styleOverrides: {
              root: {
                borderRadius: 12,
                textTransform: "none",
                fontWeight: 600,
                paddingBlock: 12,
              },
              containedPrimary: {
                boxShadow: "0 4px 14px rgba(34, 181, 115, 0.35)",
              },
            },
          },
        },
      }),
    [isDark]
  );

  const tagSelectStyles = useMemo(
    () => ({
      menuPortal: (base) => ({ ...base, zIndex: 9999 }),
      control: (base, state) => ({
        ...base,
        minHeight: 54,
        borderRadius: 12,
        backgroundColor: isDark ? "#1e293b" : "#ffffff",
        borderColor: state.isFocused
          ? "#22B573"
          : isDark
            ? "#334155"
            : "#e2e8f0",
        boxShadow: state.isFocused
          ? "0 0 0 2px rgba(34, 181, 115, 0.25)"
          : "none",
        "&:hover": { borderColor: "#22B573" },
      }),
      valueContainer: (base) => ({
        ...base,
        paddingTop: 8,
        paddingBottom: 8,
      }),
      menu: (base) => ({
        ...base,
        borderRadius: 12,
        backgroundColor: isDark ? "#1e293b" : "#ffffff",
        border: `1px solid ${isDark ? "#334155" : "#e2e8f0"}`,
        overflow: "hidden",
      }),
      option: (base, state) => ({
        ...base,
        cursor: "pointer",
        backgroundColor: state.isFocused
          ? isDark
            ? "rgba(34, 181, 115, 0.18)"
            : "rgba(34, 181, 115, 0.1)"
          : "transparent",
        color: isDark ? "#f8fafc" : "#071028",
      }),
      multiValue: (base) => ({
        ...base,
        borderRadius: 8,
        backgroundColor: isDark ? "#334155" : "#e8f5ef",
      }),
      multiValueLabel: (base) => ({
        ...base,
        color: isDark ? "#e2e8f0" : "#065f46",
        fontWeight: 500,
      }),
      multiValueRemove: (base) => ({
        ...base,
        color: isDark ? "#94a3b8" : "#047857",
        ":hover": { backgroundColor: "rgba(255,107,53,0.15)", color: "#FF6B35" },
      }),
      placeholder: (base) => ({
        ...base,
        color: isDark ? "#64748b" : "#94a3b8",
      }),
      input: (base) => ({
        ...base,
        color: isDark ? "#f8fafc" : "#071028",
      }),
    }),
    [isDark]
  );

  return (
    <ThemeProvider theme={muiTheme}>
      <ScopedCssBaseline />
      <div
        className="min-h-[calc(100vh-4rem)] p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto transition-all duration-300"
        style={{
          fontFamily: "Inter, Poppins, Roboto, system-ui, sans-serif",
        }}
      >
        <div
          className="rounded-2xl overflow-hidden border flex flex-col transition-all duration-300"
          style={{
            background: isDark
              ? "rgba(30, 41, 59, 0.75)"
              : "rgba(255, 255, 255, 0.88)",
            backdropFilter: "blur(16px)",
            borderColor: isDark
              ? "rgba(255,255,255,0.06)"
              : "rgba(255,255,255,0.55)",
            boxShadow:
              theme === "light"
                ? "0 10px 40px rgba(7, 16, 40, 0.06)"
                : "none",
          }}
        >
          <div
            className="p-5 sm:p-6 border-b"
            style={{
              borderColor: isDark ? "#334155" : "rgba(0,0,0,0.06)",
            }}
          >
            <h2
              className="text-2xl font-bold tracking-tight"
              style={{ color: isDark ? "#f8fafc" : "#071028" }}
            >
              {id ? "Update employee" : "Add employee"}
            </h2>
            <p
              className="text-sm mt-1"
              style={{ color: isDark ? "#94a3b8" : "#64748b" }}
            >
              {id
                ? "Change profile details, limits, tags, or password."
                : "Set role, credentials, and contact limits for a new team member."}
            </p>
          </div>
          <form
            className="space-y-6 p-5 sm:p-6"
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
                      styles={tagSelectStyles}
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

            <div className="pt-2">
              <Button
                type="submit"
                variant="contained"
                color="primary"
                fullWidth
                size="large"
                disabled={isLoading}
              >
                {isLoading ? (
                  <AppLoader size="md" variant="inverse" />
                ) : id ? (
                  "Save changes"
                ) : (
                  "Create employee"
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </ThemeProvider>
  );
};

export default CreateEmployee;
