import React, { useEffect, useMemo, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { getTagsData, setTagsData } from "../../features/slices/globalData";
import tagsService from "../../services/tagsService";
import { errorToast } from "../../utils/extra";
import { useTheme } from "../../contexts/ThemeContext";
import { Dialog, DialogContent } from "../ui/dialog";
import { Button } from "../ui/button";
import { Tag, X } from "lucide-react";
import { cn } from "../../lib/utils";

const ApplyTagsModal = ({ onClose, onSubmit, isLoading: isApplyingTags }) => {
  const dispatch = useDispatch();
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const tagsData = useSelector(getTagsData);
  const [selectedTag, setSelectedTag] = useState("");

  useEffect(() => {
    if (!tagsData || tagsData.length === 0) {
      tagsService.getTags().then((res) => {
        if (res.success) {
          dispatch(setTagsData(res.data));
        }
      });
    }
  }, [dispatch, tagsData]);

  const tagList = useMemo(
    () => (Array.isArray(tagsData) ? tagsData : []),
    [tagsData],
  );

  const handleSubmit = () => {
    if (!selectedTag) {
      errorToast("Please select a tag first.");
      return;
    }
    onSubmit(selectedTag);
  };

  const handleCancel = () => {
    setSelectedTag("");
    onClose();
  };

  const panelStyle = {
    backgroundColor: isDark ? "#1e293b" : "#ffffff",
    border: `1px solid ${isDark ? "#334155" : "#e5e7eb"}`,
  };

  const labelColor = isDark ? "#cbd5e1" : "#334155";
  const titleColor = isDark ? "#f8fafc" : "#0f172a";

  return (
    <Dialog open onOpenChange={(next) => !next && handleCancel()}>
      <DialogContent className="max-w-md border-0 bg-transparent p-0 shadow-none">
        <div
          className="w-full rounded-2xl p-6 shadow-2xl flex flex-col"
          style={panelStyle}
        >
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-lg font-bold" style={{ color: titleColor }}>
              Apply Tag to Filtered Attendees
            </h3>
            <button
              type="button"
              onClick={handleCancel}
              className="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
              aria-label="Close"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          <span
            className="block text-sm font-medium mb-2"
            style={{ color: labelColor }}
          >
            Select Tag
          </span>
          <div className="mb-8 max-h-52 overflow-y-auto custom-scrollbar pr-1">
            {tagList.length === 0 ? (
              <p className="text-sm text-slate-500">Loading tags…</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {tagList.map((tag) => {
                  const name = tag?.name ?? String(tag);
                  const selected = selectedTag === name;
                  return (
                    <button
                      key={name}
                      type="button"
                      onClick={() => setSelectedTag(name)}
                      className={cn(
                        "inline-flex items-center gap-1.5 px-3 py-2 rounded-full text-sm font-medium border transition-all",
                        selected
                          ? "ring-2 ring-[#FF6B35] border-[#FF6B35] bg-orange-50 text-[#c2410c] dark:bg-orange-950/40 dark:text-orange-200 dark:border-orange-400"
                          : "border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300 hover:bg-white dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800",
                      )}
                    >
                      <Tag className="w-3.5 h-3.5 shrink-0 opacity-80" />
                      {name}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 mt-auto">
            <Button
              type="button"
              variant="outline"
              disabled={isApplyingTags}
              onClick={handleCancel}
              className="rounded-xl px-4 py-2.5 font-medium"
              style={{
                backgroundColor: "transparent",
                borderColor: isDark ? "#475569" : "#cbd5e1",
                color: isDark ? "#cbd5e1" : "#475569",
              }}
            >
              Cancel
            </Button>
            <Button
              type="button"
              disabled={isApplyingTags || !selectedTag}
              onClick={handleSubmit}
              className="rounded-xl px-5 py-2.5 font-semibold hover:scale-[1.02] disabled:opacity-50 disabled:hover:scale-100"
              style={{
                backgroundColor: "#FF6B35",
                color: "#ffffff",
                border: "none",
                boxShadow: "0 4px 10px rgba(255, 107, 53, 0.2)",
              }}
            >
              {isApplyingTags ? "Applying…" : "Apply Tag"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ApplyTagsModal;
