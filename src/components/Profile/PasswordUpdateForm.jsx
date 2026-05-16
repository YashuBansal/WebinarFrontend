import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useDispatch, useSelector } from "react-redux";
import { 
  Eye, 
  EyeOff, 
  Lock, 
  ShieldCheck, 
  Loader2, 
  AlertCircle 
} from "lucide-react";
import { updatePassword } from "../../features/actions/auth";
import useAddUserActivity from "../../hooks/useAddUserActivity";
import { Button } from "../ui/button";

function PasswordUpdateForm() {
  const logUserActivity = useAddUserActivity();
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = useForm();
  const dispatch = useDispatch();
  const { isLoading, isSuccess } = useSelector((state) => state.auth);

  const [showPassword, setShowPassword] = useState({
    oldPassword: false,
    password: false,
    confirmPassword: false,
  });

  const newPassword = watch("password");

  const togglePasswordVisibility = (field) => {
    setShowPassword((prev) => ({
      ...prev,
      [field]: !prev[field],
    }));
  };

  const onSubmit = (data) => {
    dispatch(updatePassword(data));
    logUserActivity({
      action: "update",
      details: "User updated the password",
    });
  };

  useEffect(() => {
    if (isSuccess) {
      reset();
    }
  }, [isSuccess]);

  return (
    <div className="w-full">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Current Password Field */}
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            Current Password
          </label>
          <div className="relative group">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors">
              <Lock className="size-4" />
            </div>
            <input
              {...register("oldPassword", {
                required: "Current password is required.",
              })}
              type={showPassword.oldPassword ? "text" : "password"}
              placeholder="••••••••"
              className={`h-11 w-full rounded-xl border pl-10 pr-12 text-sm transition-all focus:outline-none focus:ring-2 ${
                errors.oldPassword
                  ? "border-red-300 bg-red-50 focus:ring-red-500/20 dark:border-red-900/50 dark:bg-red-900/10"
                  : "border-slate-200 bg-white focus:border-indigo-500 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-900"
              }`}
            />
            <button
              type="button"
              onClick={() => togglePasswordVisibility("oldPassword")}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
            >
              {showPassword.oldPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
          {errors.oldPassword && (
            <p className="flex items-center gap-1 text-[11px] font-bold text-red-500 mt-1">
              <AlertCircle className="size-3" />
              {errors.oldPassword.message}
            </p>
          )}
        </div>

        {/* New Password Field */}
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            New Password
          </label>
          <div className="relative group">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors">
              <ShieldCheck className="size-4" />
            </div>
            <input
              {...register("password", {
                required: "New password is required.",
                minLength: { value: 6, message: "Minimum 6 characters required" }
              })}
              type={showPassword.password ? "text" : "password"}
              placeholder="••••••••"
              className={`h-11 w-full rounded-xl border pl-10 pr-12 text-sm transition-all focus:outline-none focus:ring-2 ${
                errors.password
                  ? "border-red-300 bg-red-50 focus:ring-red-500/20 dark:border-red-900/50 dark:bg-red-900/10"
                  : "border-slate-200 bg-white focus:border-indigo-500 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-900"
              }`}
            />
            <button
              type="button"
              onClick={() => togglePasswordVisibility("password")}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
            >
              {showPassword.password ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
          {errors.password && (
            <p className="flex items-center gap-1 text-[11px] font-bold text-red-500 mt-1">
              <AlertCircle className="size-3" />
              {errors.password.message}
            </p>
          )}
        </div>

        {/* Confirm Password Field */}
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            Confirm Password
          </label>
          <div className="relative group">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors">
              <ShieldCheck className="size-4" />
            </div>
            <input
              {...register("confirmPassword", {
                required: "Please confirm your password.",
                validate: (value) =>
                  value === newPassword || "Passwords do not match.",
              })}
              type={showPassword.confirmPassword ? "text" : "password"}
              placeholder="••••••••"
              className={`h-11 w-full rounded-xl border pl-10 pr-12 text-sm transition-all focus:outline-none focus:ring-2 ${
                errors.confirmPassword
                  ? "border-red-300 bg-red-50 focus:ring-red-500/20 dark:border-red-900/50 dark:bg-red-900/10"
                  : "border-slate-200 bg-white focus:border-indigo-500 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-900"
              }`}
            />
            <button
              type="button"
              onClick={() => togglePasswordVisibility("confirmPassword")}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
            >
              {showPassword.confirmPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
          {errors.confirmPassword && (
            <p className="flex items-center gap-1 text-[11px] font-bold text-red-500 mt-1">
              <AlertCircle className="size-3" />
              {errors.confirmPassword.message}
            </p>
          )}
        </div>

        {/* Submit Button */}
        <div className="pt-2">
          <Button 
            type="submit" 
            disabled={isLoading}
            className="h-11 w-full rounded-xl bg-indigo-600 font-bold text-white shadow-lg shadow-indigo-500/20 hover:bg-indigo-700 dark:shadow-indigo-900/40"
          >
            {isLoading ? (
              <Loader2 className="size-4 animate-spin mr-2" />
            ) : (
              <Lock className="size-4 mr-2" />
            )}
            Update Account Password
          </Button>
        </div>
      </form>
    </div>
  );
}

export default PasswordUpdateForm;
