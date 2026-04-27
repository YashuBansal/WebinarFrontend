import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useSelector } from "react-redux";
import { motion } from "framer-motion";
import { Layers, Pencil, Plus, Sparkles, X } from "lucide-react";
import productLevelService from "../../services/productLevelService";
import { successToast } from "../../utils/extra";
import HubSubpageShell from "../../components/Layout/HubSubpageShell";
import { Button } from "../../components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "../../components/ui/dialog";
import useMediaQuery from "../../hooks/useMediaQuery";

const ProductLevelPage = () => {
  const [isModalOpen, setModalOpen] = useState(false);
  const [editData, setEditData] = useState();
  const { userData } = useSelector((state) => state.auth);

  const [productLevelData, setProductLevelData] = useState([]);
  const {
    handleSubmit,
    register,
    reset,
    watch,
    formState: { errors },
  } = useForm({
    defaultValues: {
      label: "",
      level: "",
    },
  });

  const previewLabel = (watch("label") || "").trim() || "New product level";
  const levelRaw = watch("level");
  const previewLevelNum =
    levelRaw === "" || levelRaw === undefined || Number.isNaN(Number(levelRaw))
      ? "—"
      : String(levelRaw);

  const isSmallScreen = useMediaQuery("(max-width: 768px)");

  const fetchLevels = () => {
    productLevelService.getProductLevels().then((res) => {
      if (res.success) {
        setProductLevelData(res.data);
      }
    });
  };

  useEffect(() => {
    fetchLevels();
  }, []);

  const openModal = (data = null) => {
    setEditData(data);
    reset(data || { label: "", level: "" });
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    reset();
  };

  const onSubmit = (data) => {
    const payload = { ...data, level: Number(data.level) };
    if (editData) {
      productLevelService.updateProductLevel(editData._id, payload).then((res) => {
        if (res.success) {
          successToast(res.message);
          closeModal();
          setProductLevelData((prev) =>
            prev.map((item) => (item._id === editData._id ? res.data : item))
          );
        }
      });
    } else {
      productLevelService.createProductLevel(payload).then((res) => {
        if (res.success) {
          successToast(res.message);
          closeModal();
          setProductLevelData((prev) => [...prev, res.data]);
        }
      });
    }
  };

  const rows = Array.isArray(productLevelData) ? productLevelData : [];

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
            <Layers className="h-7 w-7 text-blue-500 dark:text-blue-400" />
          </motion.div>
          <div className="min-w-0 space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-slate-50 sm:text-3xl">
                Product levels
              </h1>
              <Sparkles className="hidden h-5 w-5 text-amber-400 sm:inline sm:h-6 sm:w-6" aria-hidden />
            </div>
            <p className="max-w-xl text-sm font-medium leading-relaxed text-slate-500 dark:text-slate-400">
              Numeric ordering plus human-readable labels — used when creating products and revenue breakdowns.
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
            Add product level
          </Button>
        ) : null}
      </motion.header>

      <div className="min-h-[200px] overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800/90">
        <div className="p-5 sm:p-6">
          <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
            Levels
          </h2>
          {rows.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-8 flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/80 py-14 dark:border-slate-600 dark:bg-slate-900/40"
            >
              <Layers className="mb-2 h-10 w-10 text-slate-300 dark:text-slate-600" />
              <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">No product levels yet</p>
              <p className="mt-1 max-w-sm px-4 text-center text-xs font-medium text-slate-500 dark:text-slate-400">
                Add a level number and label — products can be assigned to these tiers.
              </p>
            </motion.div>
          ) : isSmallScreen ? (
            <div className="mt-6 space-y-4">
              {rows.map((item, i) => (
                <motion.div
                  key={item._id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(i * 0.06, 0.3) }}
                  className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-600 dark:bg-slate-900/80"
                >
                  <div>
                    <p className="font-bold text-slate-900 dark:text-slate-50">{item.label}</p>
                    <p className="mt-0.5 font-mono text-xs font-semibold text-blue-700 dark:text-blue-300">
                      Level {item.level}
                    </p>
                  </div>
                  {userData?.isActive ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9 rounded-xl text-blue-600 hover:bg-blue-50 dark:text-blue-400"
                      onClick={() => openModal(item)}
                      aria-label="Edit level"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                  ) : null}
                </motion.div>
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
                        Label
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        Level
                      </th>
                      {userData?.isActive ? (
                        <th className="px-4 py-3 text-center text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                          Actions
                        </th>
                      ) : null}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-700/80">
                    {rows.map((item, index) => (
                      <motion.tr
                        key={item._id}
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: Math.min(index * 0.04, 0.35) }}
                        className="bg-white transition-colors hover:bg-slate-50/90 dark:bg-slate-800/20 dark:hover:bg-slate-800/60"
                      >
                        <td className="px-4 py-3 font-semibold text-slate-900 dark:text-slate-100">{item.label}</td>
                        <td className="px-4 py-3 font-mono text-sm text-blue-700 dark:text-blue-300">{item.level}</td>
                        {userData?.isActive ? (
                          <td className="px-4 py-3 text-center">
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-9 w-9 rounded-xl text-blue-600 hover:bg-blue-50 dark:text-blue-400"
                              onClick={() => openModal(item)}
                              aria-label="Edit product level"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
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
                <Layers className="h-4 w-4 text-blue-500 dark:text-blue-400" />
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-1.5">
                  <DialogTitle className="text-base font-black tracking-tight text-slate-900 dark:text-slate-50 sm:text-lg">
                    {editData ? "Update product level" : "Add product level"}
                  </DialogTitle>
                  <Sparkles className="h-3.5 w-3.5 text-amber-500 opacity-90" aria-hidden />
                </div>
                <DialogDescription className="line-clamp-2 text-xs font-medium leading-snug text-slate-600 dark:text-slate-400">
                  Level is used for sorting; label is shown in dropdowns and reports.
                </DialogDescription>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-3 px-4 pb-4 pt-3">
            <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50/90 px-3 py-2.5 dark:border-slate-600 dark:bg-slate-800/60">
              <div className="flex h-9 min-w-[2.25rem] shrink-0 items-center justify-center rounded-lg bg-blue-500/15 px-2 font-mono text-xs font-black text-blue-700 dark:text-blue-300">
                {previewLevelNum}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-slate-900 dark:text-slate-50">{previewLabel}</p>
                <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  Product level preview
                </p>
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
                placeholder="e.g. Enterprise"
              />
              {errors.label ? (
                <p className="text-xs font-semibold text-red-600 dark:text-red-400">{errors.label.message}</p>
              ) : null}
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Level number
              </label>
              <input
                type="number"
                {...register("level", {
                  required: "Level is required",
                  valueAsNumber: true,
                  min: { value: 0, message: "Min 0" },
                })}
                className="h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-900 outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-600 dark:bg-slate-950 dark:text-slate-100"
              />
              {errors.level ? (
                <p className="text-xs font-semibold text-red-600 dark:text-red-400">{errors.level.message}</p>
              ) : null}
            </div>

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

    </HubSubpageShell>
  );
};

export default ProductLevelPage;
