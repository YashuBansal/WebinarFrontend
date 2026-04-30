import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { addEnrollment } from "../../../features/actions/attendees";
import { useForm } from "react-hook-form";
import AppLoader from "../../../components/AppLoader";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { X, Package, MonitorPlay, PlusCircle, AlertCircle, ShoppingBag, Globe } from "lucide-react";

const SelectWrapper = ({ icon: Icon, label, children, error, color = "indigo" }) => (
  <div className="space-y-1">
    <div className="flex items-center gap-2 mb-0.5">
      <Icon className={`w-3.5 h-3.5 text-${color}-500`} />
      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</label>
    </div>
    {children}
    {error && (
      <motion.p initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="text-[9px] font-bold text-rose-500 mt-1 flex items-center gap-1">
        <AlertCircle className="w-3 h-3" /> {error}
      </motion.p>
    )}
  </div>
);

const AddEnrollmentModal = ({ setModal, attendeeEmail, productData, webinarData, onEnrollmentSuccess }) => {
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm();

  const onSubmit = (data) => {
    const selectedProduct = productData.find((item) => item._id === data.product);
    const selectedWebinar = webinarData.find((item) => item?.webinar[0]?._id === data.webinar);

    const payload = {
      ...data,
      attendee: attendeeEmail,
      level: selectedProduct?.level,
      webinarName: selectedWebinar?.webinar[0]?.webinarName,
      webinarDate: selectedWebinar?.webinar[0]?.webinarDate,
    };

    setLoading(true);
    dispatch(addEnrollment(payload)).then((res) => {
      if (res?.meta?.requestStatus === "fulfilled") {
        toast.success("Enrolled successfully!");
        setModal(false);
        onEnrollmentSuccess({
          action: "enrollment",
          type: "enrollment",
          detailItem: payload?.webinarName,
          activityItem: payload?.webinarName,
        });
      }
    })
      .finally(() => setLoading(false));
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={() => setModal(false)}
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="relative w-full max-w-md bg-white dark:bg-slate-800 rounded-2xl shadow-2xl shadow-slate-900/20 overflow-hidden"
      >
        {/* Top Gradient */}
        <div className="h-1.5 w-full bg-gradient-to-r from-blue-500 to-indigo-500" />

        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700/50 flex items-center justify-between bg-slate-50/30 dark:bg-slate-900/30">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 dark:bg-blue-900/30 rounded-xl">
              <ShoppingBag className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-800 dark:text-slate-200 uppercase tracking-tight">Add Enrollment</h2>
              <p className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none">New Program Participation</p>
            </div>
          </div>
          <button
            onClick={() => setModal(false)}
            className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
          <SelectWrapper icon={Package} label="Select Product" error={errors.product?.message} color="blue">
            <select
              {...register("product", { required: "Please select a product" })}
              className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50 text-sm font-bold text-slate-700 dark:text-slate-200 focus:border-blue-500 outline-none transition-all appearance-none cursor-pointer"
            >
              <option value="">Choose a product...</option>
              {productData?.map((product) => (
                <option value={product._id} key={product._id}>
                  {product?.name} • Lvl {product?.level} • ₹{product?.price}
                </option>
              ))}
            </select>
          </SelectWrapper>

          <SelectWrapper icon={Globe} label="Select Webinar" error={errors.webinar?.message} color="indigo">
            <select
              {...register("webinar", { required: "Please select a webinar" })}
              className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50 text-sm font-bold text-slate-700 dark:text-slate-200 focus:border-indigo-500 outline-none transition-all appearance-none cursor-pointer"
            >
              <option value="">Choose a webinar...</option>
              {webinarData?.map((item, index) => (
                <option key={index} value={item?.webinar[0]?._id}>
                  {item?.webinar[0]?.webinarName}
                </option>
              ))}
            </select>
          </SelectWrapper>

          <div className="pt-2 flex gap-3">
            <button
              type="button"
              onClick={() => setModal(false)}
              className="flex-1 h-11 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-200 text-[10px] font-black rounded-xl hover:bg-slate-200 dark:hover:bg-slate-600 transition-all uppercase tracking-widest"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-[2] h-11 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 text-white text-[10px] font-black rounded-xl transition-all shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2 uppercase tracking-widest"
            >
              {loading ? (
                <AppLoader size="sm" variant="muted" />
              ) : (
                <>
                  <PlusCircle className="w-4 h-4" />
                  Confirm Enrollment
                </>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default AddEnrollmentModal;
