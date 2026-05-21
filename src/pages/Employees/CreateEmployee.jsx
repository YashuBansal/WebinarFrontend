import React, { useEffect, useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { useDispatch, useSelector } from "react-redux";
import {
  addEmployee,
  getEmployee,
  updateEmployee,
} from "../../features/actions/employee";
import { useNavigate, useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Eye,
  EyeOff,
  User,
  Mail,
  Phone,
  Clock,
  Zap,
  Tag,
  ShieldCheck,
  KeyRound,
  ArrowLeft,
  Loader2,
} from "lucide-react";
import ReactSelect from "react-select";
import { useTheme } from "../../contexts/ThemeContext";
import tagsService from "../../services/tagsService";
import { clearSingleClientData } from "../../features/slices/client";
import useUserSubscription from "../../hooks/useUserSubscription";
import useAddUserActivity from "../../hooks/useAddUserActivity";
import { getRoleNameByID } from "../../utils/roles";
import { successToast } from "../../utils/extra";

const ModernInput = ({
  label,
  name,
  type = "text",
  placeholder,
  register,
  error,
  icon: Icon,
  disabled,
  validation = {},
  isDark,
  autoComplete = "off",
}) => (
  <div className="space-y-2">
    <label
      className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider transition-colors"
      style={{ color: isDark ? "#94a3b8" : "#64748b" }}
    >
      {Icon && <Icon className="w-3 h-3" />}
      {label}
    </label>
    <div className="relative group">
      <input
        {...register(name, validation)}
        type={type}
        placeholder={placeholder}
        disabled={disabled}
        autoComplete={autoComplete}
        className="w-full h-11 px-4 rounded-xl text-sm outline-none border transition-all duration-300"
        style={{
          backgroundColor: isDark ? "rgba(15, 23, 42, 0.4)" : "#ffffff",
          borderColor: error
            ? "#ef4444"
            : isDark
              ? "rgba(148, 163, 184, 0.15)"
              : "rgba(226, 232, 240, 1)",
          color: isDark ? "#f8fafc" : "#0f172a",
          boxShadow: isDark ? "none" : "0 2px 4px rgba(0,0,0,0.02)",
        }}
        onFocus={(e) => {
          if (!error) e.target.style.borderColor = "#22B573";
          e.target.style.boxShadow = "0 0 0 4px rgba(34, 181, 115, 0.1)";
        }}
        onBlur={(e) => {
          if (!error)
            e.target.style.borderColor = isDark
              ? "rgba(148, 163, 184, 0.15)"
              : "rgba(226, 232, 240, 1)";
          e.target.style.boxShadow = isDark ? "none" : "0 2px 4px rgba(0,0,0,0.02)";
        }}
      />
      {error && (
        <p className="mt-1 text-[11px] font-medium text-red-500 animate-in fade-in slide-in-from-top-1">
          {error.message}
        </p>
      )}
    </div>
  </div>
);

const roleOptions = [
  { label: "Sales Team", value: "EMPLOYEE_SALES" },
  { label: "Reminder Team", value: "EMPLOYEE_REMINDER" },
];

const CreateEmployee = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { id } = useParams();
  const logUserActivity = useAddUserActivity();
  const [tagData, setTagData] = useState([]);
  const { isDark } = useTheme();

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

  useEffect(() => {
    if (isSuccess) {
      navigate("/employees");
    }
  }, [isSuccess, navigate]);

  useEffect(() => {
    tagsService.getTags().then((res) => {
      if (res.success) setTagData(res.data);
    });
  }, []);

  useEffect(() => {
    if (id) {
      dispatch(getEmployee(id));
    }
  }, [id, dispatch]);

  useEffect(() => {
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
  }, [singleEmployeeData, id, reset]);

  const onSubmit = (data) => {
    const newData = {
      ...data,
      validCallTime: Number(data.validCallTime) || 0,
      dailyContactLimit: Number(data.dailyContactLimit) || 0,
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

  const handleSuccess = (newData) => {
    dispatch(clearSingleClientData());
    logUserActivity({
      action: id ? "edit" : "create",
      type: "Employee",
      detailItem: newData?.userName,
    });
    successToast(id ? "Employee updated successfully" : "Employee created successfully");
  };

  const tagSelectStyles = useMemo(
    () => ({
      menuPortal: (base) => ({ ...base, zIndex: 9999 }),
      control: (base, state) => ({
        ...base,
        minHeight: 44,
        borderRadius: 12,
        backgroundColor: isDark ? "rgba(15, 23, 42, 0.4)" : "#ffffff",
        borderColor: state.isFocused
          ? "#22B573"
          : isDark
            ? "rgba(148, 163, 184, 0.15)"
            : "rgba(226, 232, 240, 1)",
        boxShadow: state.isFocused
          ? "0 0 0 4px rgba(34, 181, 115, 0.1)"
          : "none",
        "&:hover": { borderColor: "#22B573" },
      }),
      menu: (base) => ({
        ...base,
        borderRadius: 12,
        backgroundColor: isDark ? "#1e293b" : "#ffffff",
        border: `1px solid ${isDark ? "#334155" : "#e2e8f0"}`,
        boxShadow: "0 10px 25px rgba(0,0,0,0.1)",
        overflow: "hidden",
      }),
      option: (base, state) => ({
        ...base,
        cursor: "pointer",
        backgroundColor: state.isFocused
          ? isDark
            ? "rgba(34, 181, 115, 0.1)"
            : "rgba(34, 181, 115, 0.05)"
          : "transparent",
        color: isDark ? "#f8fafc" : "#071028",
        fontSize: "13px",
      }),
      multiValue: (base) => ({
        ...base,
        borderRadius: 8,
        backgroundColor: isDark ? "#334155" : "#f0fdf4",
        border: `1px solid ${isDark ? "#475569" : "#dcfce7"}`,
      }),
      multiValueLabel: (base) => ({
        ...base,
        color: isDark ? "#f1f5f9" : "#166534",
        fontSize: "12px",
        fontWeight: 600,
      }),
      multiValueRemove: (base) => ({
        ...base,
        color: isDark ? "#94a3b8" : "#166534",
        ":hover": { backgroundColor: "#fee2e2", color: "#ef4444" },
      }),
    }),
    [isDark]
  );

  return (
    <div className="min-h-full p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto space-y-6 transition-all duration-500">
      <style>
        {`
          input:-webkit-autofill,
          input:-webkit-autofill:hover, 
          input:-webkit-autofill:focus, 
          input:-webkit-autofill:active  {
            -webkit-box-shadow: 0 0 0 30px ${isDark ? "#1e293b" : "white"} inset !important;
            -webkit-text-fill-color: ${isDark ? "#f8fafc" : "#0f172a"} !important;
          }
        `}
      </style>
      {/* Header Section */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="flex items-center gap-4"
      >
        <button
          onClick={() => navigate("/employees")}
          className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 transition-all hover:bg-slate-50 dark:hover:bg-slate-800 group shadow-sm"
        >
          <ArrowLeft className="w-5 h-5 text-slate-600 dark:text-slate-400 group-hover:-translate-x-1 transition-transform" />
        </button>
        <div>
          <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-slate-50">
            {id ? "Employee Profile" : "New Employee"}
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {id ? "Manage details and credentials" : "Onboard a new team member"}
          </p>
        </div>
      </motion.div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" autoComplete="off">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Details Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="lg:col-span-2 rounded-3xl border border-slate-200/60 dark:border-slate-800 bg-white/70 dark:bg-slate-900/60 backdrop-blur-xl p-6 sm:p-8 shadow-xl shadow-slate-200/20 dark:shadow-none"
          >
            <div className="flex items-center gap-3 mb-8">
              <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600">
                <User className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">Basic Information</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <ModernInput
                label="User Name"
                name="userName"
                placeholder="Enter username"
                register={register}
                error={errors.userName}
                icon={User}
                isDark={isDark}
                validation={{ required: "User Name is required" }}
              />
              <ModernInput
                label="Email Address"
                name="email"
                type="email"
                placeholder="example@domain.com"
                register={register}
                error={errors.email}
                icon={Mail}
                isDark={isDark}
                validation={{ required: "Email is required" }}
              />
              <ModernInput
                label="Phone Number"
                name="phone"
                placeholder="+91 1234567890"
                register={register}
                error={errors.phone}
                icon={Phone}
                isDark={isDark}
                validation={{
                  required: "Phone number is required",
                  pattern: {
                    value: /^\+\d{1,3}\d{9}$/,
                    message: "Format: +[Code][Number]",
                  },
                }}
              />
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  <Tag className="w-3 h-3" />
                  Tags
                </label>
                <Controller
                  control={control}
                  name="tags"
                  render={({ field }) => (
                    <ReactSelect
                      isMulti
                      value={tagData
                        .map((item) => ({ label: item.name, value: item.name }))
                        .filter((option) => field.value?.includes(option.value))}
                      options={tagData.map((item) => ({ label: item.name, value: item.name }))}
                      onChange={(selected) => field.onChange(selected.map((o) => o.value))}
                      placeholder="Assign tags..."
                      styles={tagSelectStyles}
                      menuPortalTarget={document.body}
                    />
                  )}
                />
              </div>
            </div>

            <div className="h-px bg-slate-100 dark:bg-slate-800 my-10" />

            <div className="flex items-center gap-3 mb-8">
              <div className="p-2 rounded-lg bg-blue-500/10 text-blue-600">
                <Zap className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">Operational Limits</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <ModernInput
                label="Valid Call Time (sec)"
                name="validCallTime"
                type="number"
                register={register}
                error={errors.validCallTime}
                icon={Clock}
                isDark={isDark}
                validation={{ required: "Required", min: 0 }}
              />
              <ModernInput
                label="Daily Contact Limit"
                name="dailyContactLimit"
                type="number"
                register={register}
                error={errors.dailyContactLimit}
                icon={ShieldCheck}
                isDark={isDark}
                validation={{ required: "Required", min: 0 }}
              />
              {employeeInactivity && (
                <ModernInput
                  label="Inactivity Time (sec)"
                  name="inactivityTime"
                  type="number"
                  register={register}
                  error={errors.inactivityTime}
                  icon={Clock}
                  isDark={isDark}
                  validation={{ required: "Required", min: 1 }}
                />
              )}
            </div>
          </motion.div>

          {/* Sidebar Section */}
          <div className="space-y-6">
            {/* Account Settings Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="rounded-3xl border border-slate-200/60 dark:border-slate-800 bg-white/70 dark:bg-slate-900/60 backdrop-blur-xl p-6 shadow-lg shadow-slate-200/10 dark:shadow-none"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-600">
                  <KeyRound className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">Account Security</h3>
              </div>

              {!id && (
                <div className="space-y-4 mb-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Employee Type
                    </label>
                    <Controller
                      control={control}
                      name="role"
                      rules={{ required: "Type is required" }}
                      render={({ field }) => (
                        <ReactSelect
                          value={roleOptions.find((o) => o.value === field.value)}
                          onChange={(option) => field.onChange(option?.value)}
                          options={roleOptions}
                          placeholder="Select Role"
                          styles={tagSelectStyles}
                          menuPortalTarget={document.body}
                        />
                      )}
                    />
                    {errors.role && <p className="text-[11px] text-red-500">{errors.role.message}</p>}
                  </div>
                </div>
              )}

              <div className="space-y-4">
                <div className="relative">
                  <ModernInput
                    label="Password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    register={register}
                    error={errors.password}
                    isDark={isDark}
                    validation={{ required: id ? false : "Password required" }}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-[34px] p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                <ModernInput
                  label="Confirm Password"
                  name="confirmPassword"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  register={register}
                  error={errors.confirmPassword}
                  isDark={isDark}
                  validation={{
                    required: id ? false : "Confirm password",
                    validate: (v) => v === watch("password") || "Passwords do not match",
                  }}
                />
              </div>
            </motion.div>

            {/* Action Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="rounded-3xl border border-slate-200/60 dark:border-slate-800 bg-emerald-500/5 dark:bg-emerald-500/10 p-6"
            >
              <button
                type="submit"
                disabled={isLoading}
                className="w-full h-12 flex items-center justify-center rounded-2xl bg-emerald-500 text-white font-bold text-sm shadow-lg shadow-emerald-500/30 hover:bg-emerald-600 active:scale-[0.98] transition-all disabled:opacity-50"
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : id ? (
                  "Update Profile"
                ) : (
                  "Onboard Employee"
                )}
              </button>
              <p className="text-[10px] text-center mt-4 text-slate-500 dark:text-slate-400 uppercase tracking-widest font-bold">
                {id ? "Revision Required" : "New Registration" }
              </p>
            </motion.div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default CreateEmployee;
