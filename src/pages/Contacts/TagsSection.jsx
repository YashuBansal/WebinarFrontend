import { useState } from "react";
import { Tag, MoreVertical, Trash2, Plus, AlertCircle, ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "../../components/ui/dropdown-menu";
import { Button } from "../../components/ui/button";
import AppLoader from "../../components/AppLoader";
import { useTags, useUpdateAttendeeTag } from "../../hooks/useTags";
import ComponentGuard from "../../components/AccessControl/ComponentGuard";
import { useSelector } from "react-redux";
import { motion, AnimatePresence } from "framer-motion";

const TagsSection = ({ tags, email, onTagUpdate }) => {
  const { data: availableTags = [], isLoading: isLoadingTags } = useTags();
  const updateTagMutation = useUpdateAttendeeTag(email, onTagUpdate);
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedTag, setSelectedTag] = useState("");
  const [menuTag, setMenuTag] = useState(null);

  const { userData } = useSelector((state) => state.auth);
  const { employeeModeData } = useSelector((state) => state.employee);

  const currentTags = tags || [];
  const currentTagsLower = currentTags.map((tag) => tag.toLowerCase());

  // Filter available tags to show only those not already added
  const availableTagsToAdd = availableTags.filter(
    (tag) => !currentTagsLower.includes(tag.name?.toLowerCase())
  );

  const handleMenuOpen = (event, tag) => {
    setAnchorEl(event.currentTarget);
    setMenuTag(tag);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setMenuTag(null);
  };

  const handleAddTag = (tagValue) => {
    if (tagValue) {
      updateTagMutation.mutate(
        { tag: tagValue, action: "add" },
        {
          onSuccess: () => {
            setSelectedTag("");
          },
        }
      );
    }
  };

  const handleRemoveTag = (tag) => {
    updateTagMutation.mutate(
      { tag: tag, action: "remove" },
      {
        onSuccess: () => {
          handleMenuClose();
        },
      }
    );
  };

  const isUpdating = updateTagMutation.isPending;

  return (
    <div className="bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 rounded-2xl shadow-sm overflow-hidden flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-700/50 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-amber-50 dark:bg-amber-900/30 rounded-xl">
            <Tag className="w-4 h-4 text-amber-600 dark:text-amber-400" />
          </div>
          <h3 className="font-bold text-slate-800 dark:text-slate-200">Segment Tags</h3>
        </div>
        {isUpdating && <AppLoader size="sm" />}
      </div>

      <div className="p-6 space-y-6">
        {/* Add Tag Dropdown */}
        <ComponentGuard conditions={[employeeModeData ? false : true, userData?.isActive]}>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Attach New Tag</label>
            <DropdownMenu>
              <DropdownMenuTrigger asChild disabled={isUpdating || isLoadingTags || availableTagsToAdd.length === 0}>
                <Button
                  variant="outline"
                  className="flex h-10 w-full items-center justify-between rounded-xl px-4 py-2 text-sm font-medium outline-none transition-all duration-200 hover:bg-black/5 dark:hover:bg-white/10 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 disabled:opacity-50"
                >
                  <span className="truncate">
                    {selectedTag ? (
                      <span className="text-slate-700 dark:text-slate-200 font-bold">{selectedTag}</span>
                    ) : (
                      <span className="text-slate-400">
                        {isLoadingTags ? "Loading repository..." : availableTagsToAdd.length === 0 ? "All tags applied" : "Select tag to apply"}
                      </span>
                    )}
                  </span>
                  <ChevronDown className="h-4 w-4 opacity-50 shrink-0" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="start"
                className="w-[var(--radix-dropdown-menu-trigger-width)] min-w-[var(--radix-dropdown-menu-trigger-width)] max-h-[300px] z-[10000] overflow-y-auto overflow-x-hidden custom-scrollbar bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-xl p-1"
              >
                {availableTagsToAdd.map((tag) => (
                  <DropdownMenuItem
                    key={tag._id || tag.name}
                    onClick={() => {
                      setSelectedTag(tag.name);
                      handleAddTag(tag.name);
                    }}
                    className="cursor-pointer rounded-lg px-3 py-2 text-sm font-bold hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200"
                  >
                    {tag.name}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </ComponentGuard>

        {/* Tags Display */}
        <div className="space-y-2">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Applied Identifiers</label>
          <div className="flex flex-wrap gap-2">
            <AnimatePresence>
              {currentTags.length > 0 ? (
                currentTags.map((tag) => {
                  const canEdit = !employeeModeData && userData?.isActive;
                  return (
                    <motion.div
                      key={tag}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      className="group relative flex items-center gap-2 px-3 py-1.5 bg-slate-100 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600/50 rounded-full hover:border-indigo-400 dark:hover:border-indigo-500 transition-all cursor-default"
                    >
                      <span className="text-xs font-bold text-slate-600 dark:text-slate-300">{tag}</span>
                      {canEdit && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button
                            className="p-0.5 hover:bg-white dark:hover:bg-slate-600 rounded-full transition-colors outline-none"
                          >
                            <MoreVertical className="w-3 h-3 text-slate-400" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                          align="end"
                          className="min-w-[140px] bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-xl p-1 z-[10000]"
                        >
                          <DropdownMenuItem
                            onClick={() => handleRemoveTag(tag)}
                            disabled={isUpdating}
                            className="cursor-pointer rounded-lg px-3 py-2 text-sm font-bold hover:bg-rose-50 dark:hover:bg-rose-900/20 text-rose-600 dark:text-rose-400 flex items-center gap-2"
                          >
                            <Trash2 className="w-4 h-4" />
                            Remove Tag
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                      )}
                    </motion.div>
                  );
                })
              ) : (
                <div className="w-full py-8 flex flex-col items-center justify-center text-slate-400 space-y-2 border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-2xl">
                  <AlertCircle className="w-8 h-8 opacity-10" />
                  <p className="text-xs font-bold italic">No tags attached to this lead</p>
                </div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TagsSection;
