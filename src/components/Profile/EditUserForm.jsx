import React, { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { X, User, Mail, Phone, Building2, MapPin, Hash, FileUp, Loader2, Save } from "lucide-react";
import { DateFormat } from "../../utils/extra";
import { useSelector } from "react-redux";
import { Button } from "../ui/button";
import ComponentGuard from "../AccessControl/ComponentGuard";
import useRoles from "../../hooks/useRoles";

const EditUserForm = ({ onSubmit, onClose }) => {
  const roles = useRoles();
  const { userData, isLoading } = useSelector((state) => state.auth);
  const {
    register,
    handleSubmit,
    reset,
    control,
    watch,
    formState: { errors },
  } = useForm({
    defaultValues: {
      dateFormat: DateFormat.DD_MM_YYYY,
    },
  });

  useEffect(() => {
    if (userData) {
      reset({
        userName: userData?.userName || "",
        email: userData?.email || "",
        phone: userData?.phone || "",
        companyName: userData?.companyName || "",
        gst: userData?.gst || "",
        document: null,
        address: userData?.address || "",
        dateFormat: userData?.dateFormat || DateFormat.DD_MM_YYYY,
      });
    }
  }, [userData, reset]);

  const inputClass = (error) => `
    h-11 w-full rounded-xl border px-4 py-2 text-sm transition-all focus:outline-none focus:ring-2 
    ${error 
      ? "border-red-300 bg-red-50 focus:ring-red-500/20 dark:border-red-900/50 dark:bg-red-900/10" 
      : "border-slate-200 bg-white focus:border-indigo-500 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-900"}
  `;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-50">Edit Profile</h2>
          <p className="text-xs font-medium text-slate-500">Update your account information</p>
        </div>
        <button 
          onClick={onClose} 
          className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
        >
          <X className="size-5" />
        </button>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Name Field */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Full Name</label>
            <input
              {...register("userName", { required: "Name is required." })}
              className={inputClass(errors.userName)}
              placeholder="John Doe"
            />
            {errors.userName && <p className="text-[10px] font-bold text-red-500">{errors.userName.message}</p>}
          </div>

          {/* Email Field */}
          <ComponentGuard allowedRoles={[roles.ADMIN, roles.SUPER_ADMIN]}>
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Email Address</label>
              <input
                {...register("email", { 
                  required: "Email is required.",
                  pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: "Invalid email address" }
                })}
                className={inputClass(errors.email)}
                placeholder="john@example.com"
              />
              {errors.email && <p className="text-[10px] font-bold text-red-500">{errors.email.message}</p>}
            </div>
          </ComponentGuard>

          {/* Phone Field */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Phone Number</label>
            <input
              {...register("phone", { 
                required: "Phone number is required.",
                pattern: { value: /^\+\d{1,3}\d{9}$/, message: "Enter valid phone with country code (e.g. +911234567890)" }
              })}
              className={inputClass(errors.phone)}
              placeholder="+911234567890"
            />
            {errors.phone && <p className="text-[10px] font-bold text-red-500">{errors.phone.message}</p>}
          </div>

          {/* Date Format Select */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Date Preference</label>
            <Controller
              name="dateFormat"
              control={control}
              rules={{ required: "Date Format is required" }}
              render={({ field }) => (
                <select {...field} className={inputClass(errors.dateFormat)}>
                  <option value={DateFormat.MM_DD_YYYY}>MM-DD-YYYY</option>
                  <option value={DateFormat.DD_MM_YYYY}>DD-MM-YYYY</option>
                  <option value={DateFormat.YYYY_MM_DD}>YYYY-MM-DD</option>
                </select>
              )}
            />
          </div>

          {/* Company Name Field */}
          <ComponentGuard allowedRoles={[roles.ADMIN, roles.SUPER_ADMIN]}>
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Company Name</label>
              <input
                {...register("companyName", { required: "Company name is required." })}
                className={inputClass(errors.companyName)}
                placeholder="Acme Corp"
              />
              {errors.companyName && <p className="text-[10px] font-bold text-red-500">{errors.companyName.message}</p>}
            </div>
          </ComponentGuard>

          {/* GST Number Field */}
          <ComponentGuard allowedRoles={[roles.ADMIN]}>
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">GST Number</label>
              <input
                {...register("gst", { 
                  pattern: { value: /^[A-Za-z0-9]{15}$/, message: "Must be 15-character alphanumeric" }
                })}
                className={inputClass(errors.gst)}
                placeholder="22AAAAA0000A1Z5"
              />
              {errors.gst && <p className="text-[10px] font-bold text-red-500">{errors.gst.message}</p>}
            </div>
          </ComponentGuard>
        </div>

        {/* Address Field */}
        <ComponentGuard allowedRoles={[roles.ADMIN, roles.SUPER_ADMIN]}>
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Office Address</label>
            <textarea
              {...register("address", { required: "Address is required." })}
              rows={3}
              className={`${inputClass(errors.address)} h-auto resize-none`}
              placeholder="Enter your full office address"
            />
            {errors.address && <p className="text-[10px] font-bold text-red-500">{errors.address.message}</p>}
          </div>
        </ComponentGuard>

        {/* Document Upload */}
        <ComponentGuard allowedRoles={[roles.ADMIN]}>
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Verification Document</label>
            <div className="relative group">
              <input
                type="file"
                {...register("document")}
                className="absolute inset-0 z-10 size-full cursor-pointer opacity-0"
              />
              <div className="flex h-11 items-center justify-between rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 transition-all group-hover:border-indigo-500/50 group-hover:bg-indigo-50/30 dark:border-slate-700 dark:bg-slate-900/50">
                <span className="text-sm font-medium text-slate-500">
                  {watch("document")?.[0]?.name || "Select or drop verification file"}
                </span>
                <FileUp className="size-4 text-indigo-500" />
              </div>
            </div>
          </div>
        </ComponentGuard>

        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <Button 
            type="submit" 
            disabled={isLoading}
            className="flex-1 h-11 rounded-xl bg-indigo-600 font-bold text-white shadow-lg shadow-indigo-500/20 hover:bg-indigo-700 dark:shadow-indigo-900/40"
          >
            {isLoading ? <Loader2 className="size-4 animate-spin mr-2" /> : <Save className="size-4 mr-2" />}
            Save Information
          </Button>
          <Button 
            type="button" 
            variant="outline" 
            onClick={onClose}
            className="h-11 rounded-xl font-bold"
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
};

export default EditUserForm;
