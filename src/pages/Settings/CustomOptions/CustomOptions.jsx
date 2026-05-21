import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useDispatch, useSelector } from "react-redux";
import { motion } from "framer-motion";
import { Plus, SlidersHorizontal, Sparkles, Trash2, X } from "lucide-react";
import {
  createCustomOption,
  deleteCustomOption,
  getCustomOptions,
} from "../../../features/actions/globalData";
import useRoles from "../../../hooks/useRoles";
import ComponentGuard from "../../../components/AccessControl/ComponentGuard";
import useAddUserActivity from "../../../hooks/useAddUserActivity";
import useMediaQuery from "../../../hooks/useMediaQuery";
import HubSubpageShell from "../../../components/Layout/HubSubpageShell";
import { Button } from "../../../components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../../../components/ui/dialog";

const OptionCard = ({ option, index, onDelete }) => (
  <motion.div
    initial={{ opacity: 0, y: 12 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.35, delay: Math.min(index * 0.06, 0.3) }}
    className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-600 dark:bg-slate-900/80"
  >
    <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-4 py-4 dark:border-slate-700">
      <div className="flex min-w-0 items-center gap-3">
        <span className="rounded-full bg-blue-500/10 px-2.5 py-1 font-mono text-xs font-bold text-blue-700 dark:bg-blue-500/15 dark:text-blue-300">
          #{index + 1}
        </span>
        <p className="truncate font-bold text-slate-900 dark:text-slate-50">{option.label}</p>
      </div>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-9 w-9 shrink-0 rounded-xl text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/40"
        onClick={() => onDelete(option)}
        title="Delete option"
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
    <dl className="divide-y divide-slate-100 px-4 dark:divide-slate-700">
      <div className="flex justify-between gap-4 py-2.5 text-sm">
        <dt className="text-slate-500 dark:text-slate-400">Required</dt>
        <dd className="font-semibold text-slate-900 dark:text-slate-100">
          {option.isWorked ? "No" : "Yes"}
        </dd>
      </div>
      <div className="flex justify-between gap-4 py-2.5 text-sm">
        <dt className="text-slate-500 dark:text-slate-400">Invalid phone</dt>
        <dd className="font-semibold text-slate-900 dark:text-slate-100">
          {option.isInvalid ? "Yes" : "No"}
        </dd>
      </div>
    </dl>
  </motion.div>
);

const CustomOptions = () => {
  const dispatch = useDispatch();
  const roles = useRoles();
  const logUserActivity = useAddUserActivity();

  const { customOptions, isSuccess, isLoading } = useSelector((state) => state.globalData);
  const { userData } = useSelector((state) => state.auth);
  const role = userData?.role || "";
  const pageTitle = roles.SUPER_ADMIN === role ? "Default" : "Custom";

  const customOptionsData = (Array.isArray(customOptions) ? customOptions : []).filter(
    (option) => roles.SUPER_ADMIN === role || !option?.isDefault
  );

  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteOptionId, setDeleteOptionId] = useState(null);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm({
    defaultValues: {
      label: "",
      isWorked: "false",
      isInvalid: "false",
    },
  });

  const previewLabel = (watch("label") || "").trim() || `New ${pageTitle.toLowerCase()} option`;
  const isWorkedVal = watch("isWorked");
  const isInvalidVal = watch("isInvalid");
  const previewRequired = isWorkedVal === "true" ? "No" : "Yes";
  const previewInvalidPhone = isInvalidVal === "true" ? "Yes" : "No";

  const closeAddModal = () => {
    setShowModal(false);
    reset({ label: "", isWorked: "false", isInvalid: "false" });
  };

  const openAddModal = () => {
    reset({ label: "", isWorked: "false", isInvalid: "false" });
    setShowModal(true);
  };

  const isSmallScreen = useMediaQuery("(max-width: 768px)");

  const handleDeleteClick = (option) => {
    setDeleteOptionId(option);
    setShowDeleteModal(true);
  };

  const onSubmit = (data) => {
    const payload = {
      ...data,
      isWorked: data.isWorked === "true",
      isInvalid: data.isInvalid === "true",
    };

    dispatch(createCustomOption(payload));
    logUserActivity({
      action: "create",
      type: `${pageTitle} Option`,
      detailItem: data?.label,
    });
  };

  const confirmDelete = () => {
    if (deleteOptionId) {
      dispatch(deleteCustomOption(deleteOptionId?._id));
      logUserActivity({
        action: "delete",
        type: `${pageTitle} Option`,
        detailItem: deleteOptionId?.label,
      });
      setDeleteOptionId(null);
    }
    setShowDeleteModal(false);
  };

  useEffect(() => {
    dispatch(getCustomOptions());
  }, [dispatch]);

  useEffect(() => {
    if (isSuccess) {
      setShowModal(false);
      reset({ label: "", isWorked: "false", isInvalid: "false" });
      dispatch(getCustomOptions());
    }
  }, [isSuccess, dispatch, reset]);

  return (
    <HubSubpageShell>
      <motion.header
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        className="mb-8 flex flex-col gap-4 sm:mb-10 lg:flex-row lg:items-start lg:justify-between"
      >
        <div className="flex min-w-0 flex-1 items-start gap-4">
          <motion.div
            aria-hidden
            className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-blue-500/10 dark:bg-blue-500/15"
            initial={{ scale: 0.85, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 380, damping: 22, delay: 0.05 }}
          >
            <SlidersHorizontal className="h-7 w-7 text-blue-500 dark:text-blue-400" />
          </motion.div>
          <div className="min-w-0 space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-slate-50 sm:text-3xl">
                {pageTitle} options
              </h1>
              <Sparkles className="hidden h-5 w-5 text-amber-400 sm:inline sm:h-6 sm:w-6" aria-hidden />
            </div>
            <p className="max-w-xl text-sm font-medium leading-relaxed text-slate-500 dark:text-slate-400">
              Extra fields and validation rules for your attendee flows. Super admins manage defaults; admins tune
              their own set.
            </p>
          </div>
        </div>
        <ComponentGuard conditions={[userData?.isActive]}>
          <Button
            type="button"
            className="h-11 shrink-0 gap-2 rounded-xl bg-blue-500 px-5 font-bold text-white shadow-lg shadow-blue-500/20 hover:bg-blue-600 dark:shadow-blue-900/40"
            onClick={openAddModal}
          >
            <Plus className="h-4 w-4" strokeWidth={2.5} />
            Add {pageTitle} option
          </Button>
        </ComponentGuard>
      </motion.header>

      <div className="min-h-[200px] overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800/90">
        <div className="p-5 sm:p-6">
          <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
            Configured options
          </h2>
          {customOptionsData.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-8 flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/80 py-14 dark:border-slate-600 dark:bg-slate-900/40"
            >
              <SlidersHorizontal className="mb-2 h-10 w-10 text-slate-300 dark:text-slate-600" />
              <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">No options yet</p>
              <p className="mt-1 max-w-sm px-4 text-center text-xs font-medium text-slate-500 dark:text-slate-400">
                Add your first {pageTitle.toLowerCase()} option — it will appear in forms and filters that use these
                fields.
              </p>
            </motion.div>
          ) : isSmallScreen ? (
            <div className="mt-6 space-y-4">
              {customOptionsData.map((option, index) => (
                <OptionCard
                  key={option._id}
                  option={option}
                  index={index}
                  onDelete={handleDeleteClick}
                />
              ))}
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6 overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-600"
            >
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50/90 dark:border-slate-700 dark:bg-slate-900/80">
                      <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        #
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        Label
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        Required
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        Invalid phone
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-700/80">
                    {customOptionsData.map((option, index) => (
                      <motion.tr
                        key={option._id}
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: Math.min(index * 0.04, 0.35) }}
                        className="bg-white transition-colors hover:bg-slate-50/90 dark:bg-slate-800/20 dark:hover:bg-slate-800/60"
                      >
                        <td className="px-4 py-3 font-mono text-xs font-bold text-blue-700 dark:text-blue-300">
                          {index + 1}
                        </td>
                        <td className="px-4 py-3 font-semibold text-slate-900 dark:text-slate-100">{option.label}</td>
                        <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                          {option.isWorked ? "No" : "Yes"}
                        </td>
                        <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                          {option.isInvalid ? "Yes" : "No"}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-9 w-9 rounded-xl text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/40"
                            onClick={() => handleDeleteClick(option)}
                            aria-label="Delete option"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}
        </div>
      </div>

      <Dialog open={showModal} onOpenChange={(open) => !open && closeAddModal()}>
        <DialogContent className="max-w-md overflow-hidden rounded-2xl border border-slate-200/90 bg-white p-0 shadow-xl dark:border-slate-600 dark:bg-slate-900">
          <div className="relative border-b border-slate-200 bg-white px-4 pb-4 pt-4 dark:border-slate-700 dark:bg-slate-900">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute right-2 top-2 h-8 w-8 rounded-lg text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
              onClick={closeAddModal}
              aria-label="Close"
            >
              <X className="h-3.5 w-3.5" />
            </Button>
            <div className="flex items-center gap-3 pr-9">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-500/10 ring-1 ring-slate-200/80 dark:bg-blue-500/15 dark:ring-slate-600">
                <SlidersHorizontal className="h-4 w-4 text-blue-500 dark:text-blue-400" />
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-1.5">
                  <DialogTitle className="text-base font-black tracking-tight text-slate-900 dark:text-slate-50 sm:text-lg">
                    Add {pageTitle} option
                  </DialogTitle>
                  <Sparkles className="h-3.5 w-3.5 text-amber-500 opacity-90" aria-hidden />
                </div>
                <DialogDescription className="line-clamp-2 text-xs font-medium leading-snug text-slate-600 dark:text-slate-400">
                  Labels show in your UI; required and invalid-phone control validation behaviour.
                </DialogDescription>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-3 px-4 pb-4 pt-3">
            <div className="flex flex-col gap-2 rounded-xl border border-slate-200 bg-slate-50/90 px-3 py-2.5 dark:border-slate-600 dark:bg-slate-800/60">
              <p className="truncate text-sm font-bold text-slate-900 dark:text-slate-50">{previewLabel}</p>
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                <span>
                  Required: <span className="text-slate-900 dark:text-slate-100">{previewRequired}</span>
                </span>
                <span>
                  Invalid phone: <span className="text-slate-900 dark:text-slate-100">{previewInvalidPhone}</span>
                </span>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Display name
              </label>
              <input
                type="text"
                autoComplete="off"
                {...register("label", { required: "Label is required" })}
                className="h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-900 outline-none placeholder:text-slate-400 focus:border-blue-300 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-600 dark:bg-slate-950 dark:text-slate-100"
                placeholder="e.g. Company size"
              />
              {errors.label ? (
                <p className="text-xs font-semibold text-red-600 dark:text-red-400">{errors.label.message}</p>
              ) : null}
            </div>

            <div className="space-y-2 rounded-xl border border-slate-200/90 bg-slate-50/50 p-3 dark:border-slate-600 dark:bg-slate-800/40">
              <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Required field
              </p>
              <div className="flex gap-6 text-sm font-semibold text-slate-700 dark:text-slate-200">
                <label className="flex cursor-pointer items-center gap-2">
                  <input type="radio" value="false" {...register("isWorked")} className="accent-blue-600" />
                  Yes
                </label>
                <label className="flex cursor-pointer items-center gap-2">
                  <input type="radio" value="true" {...register("isWorked")} className="accent-blue-600" />
                  No
                </label>
              </div>
            </div>

            <div className="space-y-2 rounded-xl border border-slate-200/90 bg-slate-50/50 p-3 dark:border-slate-600 dark:bg-slate-800/40">
              <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Invalid phone
              </p>
              <div className="flex gap-6 text-sm font-semibold text-slate-700 dark:text-slate-200">
                <label className="flex cursor-pointer items-center gap-2">
                  <input type="radio" value="true" {...register("isInvalid")} className="accent-blue-600" />
                  Yes
                </label>
                <label className="flex cursor-pointer items-center gap-2">
                  <input type="radio" value="false" {...register("isInvalid")} className="accent-blue-600" />
                  No
                </label>
              </div>
            </div>

            <div className="flex flex-col-reverse gap-2 pt-0.5 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-9 rounded-lg border-slate-200 font-bold dark:border-slate-600"
                onClick={closeAddModal}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={isLoading}
                className="h-9 min-w-[132px] rounded-lg bg-blue-500 font-bold text-white shadow-md shadow-blue-500/20 hover:bg-blue-600 disabled:opacity-70"
              >
                {isLoading ? "Adding…" : "Create"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
        <DialogContent className="max-w-md rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-600 dark:bg-slate-900">
          <DialogHeader>
            <DialogTitle className="text-xl font-black text-slate-900 dark:text-slate-50">Delete option?</DialogTitle>
            <DialogDescription className="text-slate-600 dark:text-slate-300">
              If you delete this option, you will no longer be able to use it. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-6 flex justify-end gap-2">
            <Button type="button" variant="outline" className="rounded-xl font-bold" onClick={() => setShowDeleteModal(false)}>
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              className="rounded-xl font-bold"
              onClick={confirmDelete}
            >
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </HubSubpageShell>
  );
};

export default CustomOptions;
