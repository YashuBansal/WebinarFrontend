import React, { useState, useEffect } from "react";
import { X, Tag, Plus, ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "../ui/dropdown-menu";
import { Button } from "../ui/button";
import tagsService from "../../services/tagsService";
import AppLoader from "../AppLoader";
import { Dialog, DialogContent } from "../ui/dialog";
import { useTheme } from "../../contexts/ThemeContext";

const FONT = "Inter, sans-serif";

const ApplyTagsModal = ({ onClose, onSubmit, isLoading }) => {
  const [tags, setTags] = useState([]);
  const [selectedTag, setSelectedTag] = useState(null);
  const [isFetching, setIsFetching] = useState(true);
  const { theme } = useTheme();
  const isDark = theme === "dark";

  useEffect(() => {
    const fetchTags = async () => {
      setIsFetching(true);
      try {
        const response = await tagsService.getTags();
        if (response.success) {
          setTags(response.data.map((t) => ({ label: t.name, value: t.name })));
        }
      } catch (error) {
        console.error("Error fetching tags:", error);
      } finally {
        setIsFetching(false);
      }
    };
    fetchTags();
  }, []);

  const handleApply = () => {
    if (selectedTag) {
      onSubmit(selectedTag);
    }
  };

  const shellBorder = isDark ? "#334155" : "#e5e7eb";
  const titleColor = isDark ? "#f8fafc" : "#0f172a";
  const footerBg = isDark ? "rgba(15,23,42,0.85)" : "#F9FAFB";



  const cancelBtn = {
    backgroundColor: "transparent",
    border: "none",
    color: isDark ? "#94a3b8" : "#64748b",
  };
  const applyBtn = {
    backgroundColor: "#22B573",
    color: "#ffffff",
    border: "none",
    boxShadow: "0 4px 10px rgba(34, 181, 115, 0.25)",
  };

  const labelStyle = {
    fontFamily: FONT,
    fontSize: "10px",
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: "0.04em",
    color: isDark ? "#94a3b8" : "#64748b",
    marginBottom: "4px",
    display: "block",
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-[450px] p-0 overflow-hidden rounded-2xl shadow-2xl border" style={{ backgroundColor: isDark ? "#1e293b" : "#ffffff", borderColor: shellBorder }}>
        <div className="flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b flex-shrink-0" style={{ borderColor: shellBorder }}>
            <h3 className="text-lg font-bold flex items-center gap-2" style={{ fontFamily: FONT, color: titleColor }}>
              <Tag className="w-5 h-5 text-indigo-500 shrink-0" />
              Apply Tags
            </h3>
            <button type="button" onClick={onClose} className="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/10">
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* Content */}
          <div className="p-8">
            <span style={labelStyle}>Select a Tag to Apply</span>
            {isFetching ? (
              <div className="flex justify-center py-6">
                <AppLoader size="md" />
              </div>
            ) : (
              <div className="space-y-4">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      className="flex h-12 w-full items-center justify-between rounded-xl border-gray-200 bg-white px-4 py-2 text-sm dark:border-slate-800 dark:bg-slate-900 text-slate-700 dark:text-slate-200 outline-none hover:bg-gray-50 dark:hover:bg-white/10 transition-all duration-200"
                    >
                      <span className="truncate">
                        {selectedTag
                          ? selectedTag
                          : "Select a Tag to Apply..."}
                      </span>
                      <ChevronDown className="h-4 w-4 opacity-50 shrink-0" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="start"
                    className="w-[var(--radix-dropdown-menu-trigger-width)] min-w-[var(--radix-dropdown-menu-trigger-width)] max-h-[250px] z-[300] overflow-y-auto overflow-x-hidden custom-scrollbar bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-xl p-1"
                  >
                    {tags.length === 0 ? (
                      <div className="px-3 py-2 text-sm text-slate-500 text-center">
                        No tags found
                      </div>
                    ) : (
                      tags.map((t) => (
                        <DropdownMenuItem
                          key={t.value}
                          onClick={() => setSelectedTag(t.value)}
                          className="cursor-pointer rounded-lg px-3 py-2 text-sm hover:bg-slate-100 dark:hover:bg-white/10 text-slate-700 dark:text-slate-200"
                        >
                          {t.label}
                        </DropdownMenuItem>
                      ))
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
                <p className="text-xs text-gray-500 italic">
                  Note: This tag will be applied to all attendees matching the current filters.
                </p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t flex-shrink-0" style={{ backgroundColor: footerBg, borderColor: shellBorder }}>
            <div className="flex justify-end items-center gap-2">
              <Button onClick={onClose} style={cancelBtn} className="rounded-xl h-10">
                Cancel
              </Button>
              <Button
                onClick={handleApply}
                disabled={isLoading || !selectedTag}
                style={applyBtn}
                className="rounded-xl h-10 px-8 font-bold transition-all hover:scale-105 min-w-[120px]"
              >
                {isLoading ? <AppLoader size="sm" variant="inverse" /> : "Apply Tag"}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ApplyTagsModal;
