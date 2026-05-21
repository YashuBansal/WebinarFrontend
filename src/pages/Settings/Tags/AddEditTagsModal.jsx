import React, { useState } from "react";
import { motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { X } from "lucide-react";
import tagsService from "../../../services/tagsService";
import { Button } from "../../../components/ui/button";

const AddEditTagsModal = ({ setModal, formState, fetchTags }) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ defaultValues: formState });
  const [isLoading, setIsLoading] = useState(false);

  const onSubmit = (data) => {
    setIsLoading(true);
    tagsService
      .createTag(data)
      .then((res) => {
        if (res.success) {
          setModal(false);
          fetchTags();
        }
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-[2px]">
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-md overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl dark:border-slate-600 dark:bg-slate-900"
      >
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 dark:border-slate-700">
          <h3 className="text-lg font-bold text-slate-900 dark:text-slate-50">
            {formState?.id ? "Edit tag" : "Add new tag"}
          </h3>
          <button
            type="button"
            onClick={() => setModal(false)}
            className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800 dark:hover:bg-slate-800 dark:hover:text-slate-200"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 p-5">
          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Tag name
            </label>
            <input
              type="text"
              {...register("name", {
                required: "Tag name is required",
                pattern: {
                  value: /^[a-z0-9_\-.]+$/,
                  message:
                    "Only lowercase letters, numbers, underscores, dashes, and dots allowed",
                },
              })}
              aria-invalid={errors.name ? "true" : "false"}
              placeholder="e.g. hot_lead"
              onChange={(e) => {
                let val = e.target.value.toLowerCase();
                val = val.replace(/[^a-z0-9_\-.]/g, "");
                e.target.value = val;
              }}
              className={`w-full rounded-xl border bg-slate-50 px-4 py-2.5 text-sm font-medium text-slate-900 outline-none transition-shadow placeholder:text-slate-400 focus:ring-2 dark:bg-slate-950/50 dark:text-slate-100 dark:placeholder:text-slate-500 ${
                errors.name
                  ? "border-red-500 focus:ring-red-200 dark:focus:ring-red-900/40"
                  : "border-slate-200 focus:border-blue-500 focus:ring-blue-500/20 dark:border-slate-600"
              }`}
            />
            {errors.name && (
              <p className="mt-1.5 text-sm text-red-500 dark:text-red-400">{errors.name.message}</p>
            )}
          </div>

          <div className="flex justify-end gap-2 border-t border-slate-100 pt-4 dark:border-slate-800">
            <Button
              type="button"
              variant="outline"
              className="rounded-xl font-semibold"
              onClick={() => setModal(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="rounded-xl border-none bg-blue-500 px-5 font-bold text-white shadow-lg shadow-blue-500/20 hover:bg-blue-600 dark:shadow-blue-900/40"
            >
              {isLoading ? "Saving…" : formState?.id ? "Update tag" : "Save tag"}
            </Button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default AddEditTagsModal;
