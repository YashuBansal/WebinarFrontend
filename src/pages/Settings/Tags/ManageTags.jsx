import React, { useCallback, useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { motion } from "framer-motion";
import { Plus, Sparkles, Tag, X } from "lucide-react";
import tagsService, { normalizeTagsListResponse } from "../../../services/tagsService";
import AddEditTagsModal from "./AddEditTagsModal";
import { setTagsData } from "../../../features/slices/globalData";
import HubSubpageShell from "../../../components/Layout/HubSubpageShell";
import { Button } from "../../../components/ui/button";

const TAG_COLORS = [
  "#3b82f6",
  "#22c55e",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#ec4899",
  "#06b6d4",
];

const ManageTags = () => {
  const dispatch = useDispatch();
  const [tags, setTags] = useState([]);
  const [modal, setModal] = useState(false);

  const fetchTags = useCallback(() => {
    tagsService.getTags().then((res) => {
      const list = normalizeTagsListResponse(res);
      setTags(list);
      dispatch(setTagsData(list));
    });
  }, [dispatch]);

  useEffect(() => {
    fetchTags();
  }, [fetchTags]);

  const handleDeleteTag = async (tag) => {
    if (
      !window.confirm(
        `Delete tag "${tag.name}"? This may affect attendees and filters that use it.`
      )
    ) {
      return;
    }
    const res = await tagsService.deleteTag(tag._id);
    if (res.success) {
      fetchTags();
    }
  };

  return (
    <HubSubpageShell>
      <motion.header
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        className="mb-8 flex flex-col gap-4 sm:mb-10"
      >
        <div className="flex items-start gap-4">
          <motion.div
            aria-hidden
            className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-blue-500/10 dark:bg-blue-500/15"
            initial={{ scale: 0.85, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 380, damping: 22, delay: 0.05 }}
          >
            <Tag className="h-7 w-7 text-blue-500 dark:text-blue-400" />
          </motion.div>
          <div className="min-w-0 space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-slate-50 sm:text-3xl">
                Tags
              </h1>
              <Sparkles
                className="hidden h-5 w-5 text-amber-400 sm:inline sm:h-6 sm:w-6"
                aria-hidden
              />
            </div>
            <p className="max-w-xl text-sm font-medium leading-relaxed text-slate-500 dark:text-slate-400">
              One shared tag list for your workspace. Use them across attendees, webinars, and filters — add labels
              your team recognises everywhere.
            </p>
          </div>
        </div>
      </motion.header>

      <div
        className="min-h-[280px] rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800/90 sm:p-6"
      >
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h4 className="text-xs font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
            Global tags
          </h4>
          <Button
            type="button"
            className="h-9 gap-2 rounded-xl border-none bg-blue-500 px-4 text-xs font-bold text-white shadow-lg shadow-blue-500/20 hover:bg-blue-600 dark:shadow-blue-900/40"
            onClick={() => setModal(true)}
          >
            <Plus className="h-3.5 w-3.5" strokeWidth={2.5} />
            ADD NEW TAG
          </Button>
        </div>

        {tags.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 py-16 dark:border-slate-600"
          >
            <Tag className="mb-3 h-11 w-11 text-slate-300 dark:text-slate-600" />
            <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">
              No tags yet — add your first one.
            </p>
          </motion.div>
        ) : (
          <div className="flex flex-wrap gap-3">
            {tags.map((tag, i) => (
              <motion.div
                key={tag._id}
                layout
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, delay: Math.min(i * 0.04, 0.4) }}
                className="group flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 transition-all hover:shadow-md dark:border-slate-600 dark:bg-slate-900/50 dark:hover:border-slate-500"
              >
                <div
                  className="h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: TAG_COLORS[i % TAG_COLORS.length] }}
                  aria-hidden
                />
                <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                  {tag.name}
                </span>
                <button
                  type="button"
                  onClick={() => handleDeleteTag(tag)}
                  className="rounded-md p-1 text-red-400 opacity-0 transition-all hover:bg-red-50 hover:text-red-600 group-hover:opacity-100 dark:hover:bg-red-950/40 dark:hover:text-red-300"
                  title="Remove tag"
                  aria-label={`Delete tag ${tag.name}`}
                >
                  <X className="h-3.5 w-3.5" strokeWidth={2.5} />
                </button>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {modal && <AddEditTagsModal setModal={setModal} fetchTags={fetchTags} />}
    </HubSubpageShell>
  );
};

export default ManageTags;
