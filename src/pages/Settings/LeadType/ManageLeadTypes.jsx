import React, { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { useDispatch, useSelector } from "react-redux";
import { motion } from "framer-motion";
import { Palette, Pencil, Plus, Sparkles, Trash2, Users, X } from "lucide-react";
import {
  addLeadType,
  getLeadType,
  updateLeadType,
  deleteLeadType,
} from "../../../features/actions/assign";
import Delete from "../../../components/ConfirmDeleteModal";
import HubSubpageShell from "../../../components/Layout/HubSubpageShell";
import { Button } from "../../../components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "../../../components/ui/dialog";
import useMediaQuery from "../../../hooks/useMediaQuery";

function LeadTypeColorCell({ color }) {
  const hex = (color && String(color).trim()) || "#000000";
  return (
    <div className="flex items-center gap-3">
      <div
        className="h-9 w-9 shrink-0 rounded-xl border border-slate-200/90 shadow-md ring-2 ring-white dark:border-slate-600 dark:ring-slate-900"
        style={{ backgroundColor: hex }}
        title={hex}
      />
      <code className="rounded-lg border border-slate-200/80 bg-slate-50 px-2.5 py-1 font-mono text-[11px] font-bold tracking-wide text-slate-600 dark:border-slate-600 dark:bg-slate-900/80 dark:text-slate-400">
        {hex}
      </code>
    </div>
  );
}

const COLOR_PRESETS = [
  "#3b82f6",
  "#6366f1",
  "#8b5cf6",
  "#a855f7",
  "#ec4899",
  "#ef4444",
  "#f97316",
  "#eab308",
  "#22c55e",
  "#14b8a6",
  "#0ea5e9",
  "#64748b",
];

const LeadTypesForm = () => {
  const dispatch = useDispatch();
  const [isModalOpen, setModalOpen] = useState(false);
  const [editData, setEditData] = useState();

  const { isLoading, leadTypeData, isSuccess } = useSelector((state) => state.assign);
  const { userData } = useSelector((state) => state.auth);

  const rows = Array.isArray(leadTypeData) ? leadTypeData : [];

  const { handleSubmit, control, reset, watch, setValue } = useForm({
    defaultValues: {
      label: "",
      color: "#3b82f6",
    },
  });
  const previewColor = watch("color") || "#3b82f6";
  const previewLabel = (watch("label") || "").trim() || "Your lead type";
  const [isId, setisId] = useState();
  const [deleteModal, setdeleteModal] = useState(false);
  const isSmallScreen = useMediaQuery("(max-width: 768px)");

  const openModal = (data = null) => {
    setEditData(data);
    reset(data || { label: "", color: "#3b82f6" });
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    reset();
  };

  const onSubmit = (data) => {
    if (editData) {
      dispatch(updateLeadType({ id: editData._id, ...data }));
    } else {
      dispatch(addLeadType(data));
    }
  };

  const handleDelete = () => {
    dispatch(deleteLeadType(isId));
  };

  useEffect(() => {
    dispatch(getLeadType());
  }, [dispatch]);

  useEffect(() => {
    if (isSuccess) {
      closeModal();
      dispatch(getLeadType());
      setdeleteModal(false);
    }
  }, [isSuccess, dispatch]);

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
            <Users className="h-7 w-7 text-blue-500 dark:text-blue-400" />
          </motion.div>
          <div className="min-w-0 space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-slate-50 sm:text-3xl">
                Lead types
              </h1>
              <Sparkles className="hidden h-5 w-5 text-amber-400 sm:inline sm:h-6 sm:w-6" aria-hidden />
            </div>
            <p className="max-w-xl text-sm font-medium leading-relaxed text-slate-500 dark:text-slate-400">
              Colour-coded segments for reporting and filters. Keep names short so they read well in tables and
              charts.
            </p>
          </div>
        </div>
        {userData?.isActive ? (
          <Button
            type="button"
            className="h-11 shrink-0 gap-2 rounded-xl bg-blue-500 px-5 font-bold text-white shadow-lg shadow-blue-500/20 hover:bg-blue-600 dark:shadow-blue-900/40"
            onClick={() => openModal()}
          >
            <Plus className="h-4 w-4" strokeWidth={2.5} />
            Add lead type
          </Button>
        ) : null}
      </motion.header>

      <div className="min-h-[200px] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800/90">
        <div className="p-5 sm:p-6">
          <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
            Your lead types
          </h2>
          {rows.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-8 flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/80 py-14 dark:border-slate-600 dark:bg-slate-900/40"
            >
              <Users className="mb-2 h-10 w-10 text-slate-300 dark:text-slate-600" />
              <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">No lead types yet</p>
              <p className="mt-1 max-w-sm px-4 text-center text-xs font-medium text-slate-500 dark:text-slate-400">
                Create your first type — it will be available wherever leads are classified.
              </p>
            </motion.div>
          ) : isSmallScreen ? (
            <div className="mt-6 space-y-4">
              {rows.map((item, i) => (
                <motion.div
                  key={item._id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(i * 0.06, 0.3), ease: [0.22, 1, 0.36, 1] }}
                  className="overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-br from-white to-slate-50/90 shadow-sm dark:border-slate-600 dark:from-slate-900 dark:to-slate-900/80"
                >
                  <div
                    className="h-1 w-full"
                    style={{ backgroundColor: item.color }}
                    aria-hidden
                  />
                  <div className="flex items-start justify-between gap-3 p-4">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-lg font-black tracking-tight text-slate-900 dark:text-slate-50">
                        {item.label}
                      </p>
                      <div className="mt-3">
                        <LeadTypeColorCell color={item.color} />
                      </div>
                    </div>
                  </div>
                  {userData?.isActive ? (
                    <div className="flex justify-end gap-1 border-t border-slate-100 bg-slate-50/80 px-3 py-2.5 dark:border-slate-700 dark:bg-slate-900/50">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-9 gap-2 rounded-xl font-bold text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-950/40"
                        onClick={() => openModal(item)}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                        Edit
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-9 gap-2 rounded-xl font-bold text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/40"
                        onClick={() => {
                          setisId(item._id);
                          setdeleteModal(true);
                        }}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Remove
                      </Button>
                    </div>
                  ) : null}
                </motion.div>
              ))}
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6 overflow-hidden rounded-2xl border border-slate-200 shadow-sm dark:border-slate-600"
            >
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200/90 bg-gradient-to-r from-slate-50 via-slate-50 to-violet-50/35 dark:border-slate-700 dark:from-slate-900 dark:via-slate-900 dark:to-violet-950/25">
                      <th className="whitespace-nowrap py-3.5 pl-5 pr-3 text-left text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                        #
                      </th>
                      <th className="whitespace-nowrap px-3 py-3.5 text-left text-xs font-bold uppercase tracking-wider text-indigo-900/75 dark:text-indigo-200/85">
                        Lead type
                      </th>
                      <th className="whitespace-nowrap px-3 py-3.5 text-left text-xs font-bold uppercase tracking-wider text-violet-800/85 dark:text-violet-200/90">
                        <span className="inline-flex items-center gap-1.5">
                          <Palette className="h-3.5 w-3.5 opacity-80" aria-hidden />
                          Colour
                        </span>
                      </th>
                      {userData?.isActive ? (
                        <th className="whitespace-nowrap py-3.5 pl-3 pr-5 text-right text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                          Actions
                        </th>
                      ) : null}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-700/80">
                    {rows.map((item, index) => (
                      <motion.tr
                        key={item._id}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{
                          duration: 0.28,
                          delay: Math.min(index * 0.04, 0.4),
                          ease: [0.22, 1, 0.36, 1],
                        }}
                        className="group bg-white transition-colors hover:bg-slate-50/95 dark:bg-slate-800/15 dark:hover:bg-slate-800/55"
                      >
                        <td className="relative whitespace-nowrap py-4 pl-5 pr-3">
                          <span
                            className="absolute bottom-2 left-2 top-2 w-1 rounded-full opacity-90 transition-opacity group-hover:opacity-100"
                            style={{ backgroundColor: item.color }}
                            aria-hidden
                          />
                          <span className="pl-2 font-mono text-[13px] font-bold tabular-nums text-slate-400 dark:text-slate-500">
                            {String(index + 1).padStart(2, "0")}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-3 py-4">
                          <span className="text-[15px] font-black tracking-tight text-slate-900 dark:text-slate-50">
                            {item.label}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-3 py-3">
                          <LeadTypeColorCell color={item.color} />
                        </td>
                        {userData?.isActive ? (
                          <td className="whitespace-nowrap py-3 pl-3 pr-5 text-right">
                            <div className="inline-flex items-center gap-0.5 rounded-xl border border-slate-200/90 bg-slate-50/90 p-0.5 dark:border-slate-600 dark:bg-slate-900/70">
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="h-8 gap-1.5 rounded-lg px-3 font-bold text-blue-600 hover:bg-white hover:shadow-sm dark:text-blue-400 dark:hover:bg-slate-800"
                                onClick={() => openModal(item)}
                              >
                                <Pencil className="h-3.5 w-3.5" />
                                Edit
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="h-8 gap-1.5 rounded-lg px-3 font-bold text-red-600 hover:bg-white hover:shadow-sm dark:text-red-400 dark:hover:bg-slate-800"
                                onClick={() => {
                                  setisId(item._id);
                                  setdeleteModal(true);
                                }}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                                Delete
                              </Button>
                            </div>
                          </td>
                        ) : null}
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}
        </div>
      </div>

      <Dialog open={isModalOpen} onOpenChange={(open) => !open && closeModal()}>
        <DialogContent className="max-w-md overflow-hidden rounded-2xl border border-slate-200/90 bg-white p-0 shadow-xl dark:border-slate-600 dark:bg-slate-900">
          <div className="relative border-b border-slate-200 bg-white px-4 pb-4 pt-4 dark:border-slate-700 dark:bg-slate-900">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute right-2 top-2 h-8 w-8 rounded-lg text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
              onClick={closeModal}
              aria-label="Close"
            >
              <X className="h-3.5 w-3.5" />
            </Button>
            <div className="flex items-center gap-3 pr-9">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-500/10 ring-1 ring-slate-200/80 dark:bg-blue-500/15 dark:ring-slate-600">
                <Users className="h-4 w-4 text-blue-500 dark:text-blue-400" />
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-1.5">
                  <DialogTitle className="text-base font-black tracking-tight text-slate-900 dark:text-slate-50 sm:text-lg">
                    {editData ? "Update lead type" : "Add lead type"}
                  </DialogTitle>
                  <Sparkles className="h-3.5 w-3.5 text-amber-500 opacity-90" aria-hidden />
                </div>
                <DialogDescription className="line-clamp-2 text-xs font-medium leading-snug text-slate-600 dark:text-slate-400">
                  Label + colour — used in tables and filters.
                </DialogDescription>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-3 px-4 pb-4 pt-3">
            <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50/90 px-3 py-2.5 dark:border-slate-600 dark:bg-slate-800/60">
              <div
                className="h-9 w-9 shrink-0 rounded-lg shadow-md ring-1 ring-white/80 dark:ring-slate-700"
                style={{ backgroundColor: previewColor }}
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-slate-900 dark:text-slate-50">{previewLabel}</p>
                <code className="font-mono text-[10px] font-semibold text-slate-500 dark:text-slate-400">
                  {previewColor}
                </code>
              </div>
            </div>

            <Controller
              name="label"
              control={control}
              rules={{ required: "Label is required" }}
              render={({ field, fieldState }) => (
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">
                    Display name
                  </label>
                  <input
                    {...field}
                    autoComplete="off"
                    className="h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-900 outline-none placeholder:text-slate-400 focus:border-blue-300 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-600 dark:bg-slate-950 dark:text-slate-100"
                    placeholder="e.g. Hot lead"
                  />
                  {fieldState.error ? (
                    <p className="text-xs font-semibold text-red-600 dark:text-red-400">{fieldState.error.message}</p>
                  ) : null}
                </div>
              )}
            />

            <Controller
              name="color"
              control={control}
              render={({ field }) => (
                <div className="space-y-2 rounded-xl border border-violet-200/60 bg-violet-50/35 p-3 dark:border-violet-900/35 dark:bg-violet-950/20">
                  <div className="flex items-center gap-1.5">
                    <Palette className="h-3.5 w-3.5 text-violet-600 dark:text-violet-400" />
                    <span className="text-[10px] font-black uppercase tracking-wider text-violet-800/90 dark:text-violet-200/90">
                      Colour
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {COLOR_PRESETS.map((hex) => (
                      <button
                        key={hex}
                        type="button"
                        title={hex}
                        onClick={() => setValue("color", hex, { shouldDirty: true, shouldTouch: true })}
                        className={`h-6 w-6 rounded-full border-2 shadow-sm transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-violet-400 ${
                          (field.value || "").toLowerCase() === hex.toLowerCase()
                            ? "border-violet-700 ring-1 ring-violet-400/60 dark:border-violet-300"
                            : "border-white/80 dark:border-slate-700"
                        }`}
                        style={{ backgroundColor: hex }}
                      />
                    ))}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400">Custom</span>
                    <input
                      type="color"
                      id="color-picker"
                      {...field}
                      className="h-8 w-11 cursor-pointer overflow-hidden rounded-lg border border-slate-200 bg-white dark:border-slate-600 dark:bg-slate-900"
                    />
                  </div>
                </div>
              )}
            />

            <div className="flex flex-col-reverse gap-2 pt-0.5 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-9 rounded-lg border-slate-200 font-bold dark:border-slate-600"
                onClick={closeModal}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                className="h-9 min-w-[132px] rounded-lg bg-blue-500 font-bold text-white shadow-md shadow-blue-500/20 hover:bg-blue-600"
              >
                {editData ? "Save" : "Create"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {deleteModal ? (
        <Delete setModal={setdeleteModal} triggerDelete={handleDelete} isLoading={isLoading} />
      ) : null}
    </HubSubpageShell>
  );
};

export default LeadTypesForm;
