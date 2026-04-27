import { useEffect, useMemo, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  Button,
  Tabs,
  Tab,
  Box,
  InputAdornment,
  IconButton,
  MenuItem,
} from "@mui/material";
import { updateClient } from "../../features/actions/client";
import { useDispatch, useSelector } from "react-redux";
import { resetClientState } from "../../features/slices/client";
import AppLoader from "../AppLoader";
import { closeModal } from "../../features/slices/modalSlice";
import useAddUserActivity from "../../hooks/useAddUserActivity";
import { Visibility, VisibilityOff } from "@mui/icons-material";
import { DateFormat } from "../../utils/extra";


const formatDateForInput = (dateString) => {
  if (!dateString) return "";
  // Converts ISO string (e.g., 2023-12-25T00:00:00.000Z) to YYYY-MM-DD
  return new Date(dateString).toISOString().split("T")[0];
};

const UpdateClientModal = ({ modalName }) => {
  const logUserActivity = useAddUserActivity();
  const { modalData: defaultUserInfo } = useSelector((state) => state.modals);

  const dispatch = useDispatch();
  const { isUpdating, isSuccess } = useSelector((state) => state.client);
  const [activeTab, setActiveTab] = useState(0);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    control,
    formState: { errors },
  } = useForm({
    defaultValues: {
      dateFormat: DateFormat.DD_MM_YYYY,
    },
  });

  const [showPassword, setShowPassword] = useState({
    newPassword: false,
    confirmPassword: false,
  });

  useEffect(() => {
    // Reset form with default user info when it changes
    if (defaultUserInfo) {
      reset({
        userName: defaultUserInfo.userName,
        email: defaultUserInfo.email,
        phone: defaultUserInfo.phone,
        companyName: defaultUserInfo.companyName,
        _id: defaultUserInfo._id,
        dateFormat: defaultUserInfo.dateFormat,
        planExpiry: formatDateForInput(defaultUserInfo.planExpiry),
        webinarLimitAddon: defaultUserInfo.webinarLimitAddon ?? 0,
      });
    }
  }, [defaultUserInfo, reset]);

  const minExpiryDate = useMemo(() => {
    const startDateString = defaultUserInfo?.planStartDate;
    if (!startDateString) {
      // If there's no start date, don't set a minimum
      return undefined;
    }

    const startDate = new Date(startDateString);
    // Set the minimum selectable date to the day *after* the start date
    startDate.setDate(startDate.getDate() + 1);

    // Return the date in "YYYY-MM-DD" format required by the min attribute
    return startDate.toISOString().split("T")[0];
  }, [defaultUserInfo?.planStartDate]);

  const onSubmit = (data) => {
    if (activeTab === 0) {
      const payload = {
        userName: data.userName,
        email: data.email,
        phone: data.phone,
        companyName: data.companyName,
        dateFormat: data.dateFormat,
      };

      dispatch(updateClient({ data: payload, id: data._id }));
      logUserActivity({
        action: "update",
        type: "Client's information with UserName",
        detailItem: data.userName,
      });
    } else if (activeTab === 1) {
      const payload = { password: data.newPassword };
      dispatch(updateClient({ data: payload, id: data._id }));
      logUserActivity({
        action: "update",
        type: "Client's password with UserName",
        detailItem: data.userName,
      });
    } else if (activeTab === 2) {
      const payload = {};
      const originalExpiry = formatDateForInput(defaultUserInfo.planExpiry);
      if (data.planExpiry !== originalExpiry) {
        payload.planExpiry = data.planExpiry;
      }
      const addon = Number(data.webinarLimitAddon ?? 0);
      if (Number.isFinite(addon) && addon >= 0) {
        payload.webinarLimitAddon = String(addon);
      }

      dispatch(updateClient({ data: payload, id: data._id }));
      logUserActivity({
        action: "update",
        type: "Client's plan details with UserName",
        detailItem: data.userName,
      });
    }
  };

  const togglePasswordVisibility = (field) => {
    setShowPassword((prev) => ({
      ...prev,
      [field]: !prev[field],
    }));
  };

  useEffect(() => {
    if (isSuccess) {
      handleClose();
      reset();
    }
    return () => {
      dispatch(resetClientState());
    };
  }, [isSuccess]);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleClose = () => {
    dispatch(closeModal(modalName));
    setActiveTab(0);
  };

  const validatePassword = (value) => {
    const newPassword = watch("newPassword");
    if (newPassword !== value) {
      return "Passwords do not match.";
    }
    return true;
  };

  return (
    <Dialog open={true} onClose={handleClose}>
      <DialogTitle>Update Client Information</DialogTitle>
      <Tabs
        value={activeTab}
        onChange={handleTabChange}
        indicatorColor="primary"
        textColor="primary"
        variant="fullWidth"
      >
        <Tab label="Basic Info" />
        <Tab label="Password" />
        <Tab label="Plan Details" />
      </Tabs>
      <DialogContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-4">
          {activeTab === 0 && (
            <Box className="space-y-4">
              {/* Fields for userName, email, phone, companyName */}
              <TextField
                {...register("userName", { required: "Name is required." })}
                label="Name"
                fullWidth
                error={!!errors.userName}
                helperText={errors.userName?.message}
              />
              <TextField
                {...register("email", {
                  required: "Email is required.",
                  pattern: {
                    value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                    message: "Please enter a valid email address.",
                  },
                })}
                label="Email"
                fullWidth
                error={!!errors.email}
                helperText={errors.email?.message}
              />
              <TextField
                {...register("phone", {
                  required: "Phone number is required.",
                  pattern: {
                    value: /^\+\d{1,3}\d{9}$/,
                    message:
                      "10 Digit Phone number with Country Code is required, eg: +911234567890",
                  },
                })}
                label="Phone"
                fullWidth
                error={!!errors.phone}
                helperText={errors.phone?.message}
              />
              <TextField
                {...register("companyName", {
                  required: "Company name is required.",
                })}
                label="Company Name"
                fullWidth
                error={!!errors.companyName}
                helperText={errors.companyName?.message}
              />

              <Controller
                name="dateFormat"
                control={control}
                rules={{ required: "Date Format is required" }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    select
                    label="Date Format"
                    variant="outlined"
                    error={!!errors.dateFormat}
                    helperText={errors.dateFormat?.message}
                  >
                    <MenuItem value={DateFormat.MM_DD_YYYY}>
                      MM-DD-YYYY
                    </MenuItem>
                    <MenuItem value={DateFormat.DD_MM_YYYY}>
                      DD-MM-YYYY
                    </MenuItem>
                    <MenuItem value={DateFormat.YYYY_MM_DD}>
                      YYYY-MM-DD
                    </MenuItem>
                  </TextField>
                )}
              />

            </Box>
          )}
          {activeTab === 1 && (
            <Box className="space-y-4">
              <TextField
                {...register("newPassword", {
                  required: "New password is required.",
                })}
                label="New Password"
                type={showPassword.newPassword ? "text" : "password"}
                fullWidth
                error={!!errors.newPassword}
                helperText={errors.newPassword?.message}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => togglePasswordVisibility("newPassword")}
                      >
                        {showPassword.newPassword ? (
                          <VisibilityOff />
                        ) : (
                          <Visibility />
                        )}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
              <TextField
                {...register("confirmPassword", {
                  required: "Please confirm your password.",
                  validate: validatePassword,
                })}
                label="Confirm Password"
                type={showPassword.confirmPassword ? "text" : "password"}
                fullWidth
                error={!!errors.confirmPassword}
                helperText={errors.confirmPassword?.message}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() =>
                          togglePasswordVisibility("confirmPassword")
                        }
                      >
                        {showPassword.confirmPassword ? (
                          <VisibilityOff />
                        ) : (
                          <Visibility />
                        )}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
            </Box>
          )}
          {activeTab === 2 && (
            <Box className="space-y-4">
              <TextField
                {...register("planExpiry")}
                label="Plan Expiry Date"
                type="date"
                fullWidth
                InputLabelProps={{ shrink: true }}
                inputProps={{
                  min: minExpiryDate,
                }}
              />
              <TextField
                {...register("webinarLimitAddon")}
                label="Extra Webinar Limit"
                type="number"
                fullWidth
                InputProps={{ inputProps: { min: 0 } }}
                helperText="Additional webinars allowed beyond the plan limit for this client."
              />
            </Box>
          )}
        </form>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} color="secondary">
          Cancel
        </Button>
        <Button
          onClick={handleSubmit(onSubmit)}
          variant="contained"
          disabled={isUpdating}
          color="primary"
        >
          {isUpdating ? (
            <AppLoader size="md" variant="inverse" className="mx-5" />
          ) : (
            "Update"
          )}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default UpdateClientModal;
