import React, { useEffect, useLayoutEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { useDispatch, useSelector } from "react-redux";
import { addLocation } from "../../../features/actions/location";
import Select from "react-select";
import { motion, AnimatePresence } from "framer-motion";
import { X, User, Phone, MapPin, Briefcase, Users, Save, AlertCircle, Info, VenusAndMars } from "lucide-react";
import tagsService from "../../../services/tagsService";
import AppLoader from "../../../components/AppLoader";
import AddRequestLocation from "../../Location/Modal/AddRequestLocation";
import { states } from "../../../utils/columnData";
import { capitalizeWords } from "../../../utils/extra";
import { toast } from "sonner";

const InputWrapper = ({ icon: Icon, label, children, error }) => (
  <div className="space-y-1">
    <div className="flex items-center gap-2 mb-0.5">
      <Icon className="w-3.5 h-3.5 text-slate-400" />
      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</label>
    </div>
    {children}
    {error && (
      <span className="text-[10px] font-bold text-rose-500 flex items-center gap-1">
        <AlertCircle className="w-3 h-3" /> {error}
      </span>
    )}
  </div>
);

const EditModal = ({
  setModal,
  initialData,
  onConfirmEdit,
  locationsMap = new Map(),
  locations = [],
  userData,
}) => {
  const dispatch = useDispatch();
  const { isSuccess } = useSelector((state) => state.location);
  const { isLoading } = useSelector((state) => state.attendee);

  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: {
      firstName: initialData?.firstName,
      lastName: initialData?.lastName,
      phone: initialData?.phone,
      location: initialData?.location,
      gender: initialData?.gender,
      profession: initialData?.profession ?? "",
    },
  });

  const onSubmit = (data) => {
    const finalData = {
      ...data,
      id: initialData?._id,
      createdBy: userData?.userName,
      profession: data.profession ?? "",
    };
    if (Array.isArray(initialData?.webinar) && initialData?.webinar.length > 0)
      finalData["webinarName"] = initialData.webinar[0]?.webinarName;

    onConfirmEdit(finalData);
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={() => setModal(null)}
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="relative w-full max-w-2xl bg-white dark:bg-slate-800 rounded-2xl shadow-2xl shadow-slate-900/20 overflow-hidden"
      >
        {/* Decorative Top Bar */}
        <div className="h-1.5 w-full bg-gradient-to-r from-[#FF6B35] to-[#FF8C61]" />

        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700/50 flex items-center justify-between bg-slate-50/30 dark:bg-slate-900/30">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-50 dark:bg-orange-900/30 rounded-xl">
              <User className="w-5 h-5 text-[#FF6B35] dark:text-[#FF8C61]" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-800 dark:text-slate-200 uppercase tracking-tight">Edit Attendee</h2>
              <p className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Update Profile Information</p>
            </div>
          </div>
          <button
            onClick={() => setModal(null)}
            className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InputWrapper icon={User} label="First Name" error={errors.firstName?.message}>
              <input
                {...register("firstName", { required: "First name is required" })}
                type="text"
                placeholder="e.g. John"
                className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50 text-sm font-bold text-slate-700 dark:text-slate-200 focus:border-[#FF6B35] outline-none transition-all"
              />
            </InputWrapper>

            <InputWrapper icon={User} label="Last Name">
              <input
                {...register("lastName")}
                type="text"
                placeholder="e.g. Doe"
                className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50 text-sm font-bold text-slate-700 dark:text-slate-200 focus:border-[#FF6B35] outline-none transition-all"
              />
            </InputWrapper>

            <InputWrapper icon={Phone} label="Phone Number" error={errors.phone?.message}>
              <input
                {...register("phone", { required: "Phone is required" })}
                type="tel"
                placeholder="+91..."
                className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50 text-sm font-bold text-slate-700 dark:text-slate-200 focus:border-[#FF6B35] outline-none transition-all"
              />
            </InputWrapper>

            <InputWrapper icon={VenusAndMars} label="Gender">
              <select
                {...register("gender")}
                className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50 text-sm font-bold text-slate-700 dark:text-slate-200 focus:border-[#FF6B35] outline-none transition-all appearance-none cursor-pointer"
              >
                <option value="">Select Gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="others">Others</option>
              </select>
            </InputWrapper>

            <InputWrapper icon={MapPin} label="Location">
              <input
                {...register("location")}
                type="text"
                placeholder="City, State"
                className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50 text-sm font-bold text-slate-700 dark:text-slate-200 focus:border-[#FF6B35] outline-none transition-all"
              />
            </InputWrapper>

            <InputWrapper icon={Briefcase} label="Profession">
              <input
                {...register("profession")}
                type="text"
                placeholder="e.g. Developer"
                className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50 text-sm font-bold text-slate-700 dark:text-slate-200 focus:border-[#FF6B35] outline-none transition-all"
              />
            </InputWrapper>
          </div>

          {/* Footer Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => setModal(null)}
              className="flex-1 h-11 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-200 text-[10px] font-black rounded-xl transition-all uppercase tracking-widest"
            >
              Discard
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-[2] h-11 bg-[#FF6B35] hover:bg-[#e85a24] disabled:bg-slate-200 text-white text-[10px] font-black rounded-xl transition-all shadow-lg shadow-[#FF6B35]/20 flex items-center justify-center gap-2 uppercase tracking-widest"
            >
              {isLoading ? (
                <AppLoader size="sm" variant="muted" />
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default EditModal;
