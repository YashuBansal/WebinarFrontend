import { useState } from "react";
import {
  FormControl,
  Select,
  MenuItem,
  Menu,
} from "@mui/material";
import AppLoader from "../../components/AppLoader";
import { Tag, MoreVertical, Trash2, Plus, AlertCircle } from "lucide-react";
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
            <FormControl fullWidth size="small">
              <Select
                value={selectedTag}
                onChange={(e) => {
                  const value = e.target.value;
                  setSelectedTag(value);
                  if (value) handleAddTag(value);
                }}
                displayEmpty
                disabled={isUpdating || isLoadingTags || availableTagsToAdd.length === 0}
                sx={{
                  borderRadius: '12px',
                  backgroundColor: 'white',
                  dark: { backgroundColor: '#0F172A' },
                  '& .MuiOutlinedInput-notchedOutline': { border: '1px solid #E2E8F0' },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': { border: '2px solid #6366F1' }
                }}
                renderValue={(selected) => {
                  if (!selected) {
                    return (
                      <span className="text-slate-400 text-sm font-medium">
                        {isLoadingTags ? "Loading repository..." : availableTagsToAdd.length === 0 ? "All tags applied" : "Select tag to apply"}
                      </span>
                    );
                  }
                  return <span className="text-sm font-bold text-slate-700 dark:text-slate-200">{selected}</span>;
                }}
              >
                {availableTagsToAdd.map((tag) => (
                  <MenuItem key={tag._id || tag.name} value={tag.name} sx={{ py: 1.5, px: 2 }}>
                    <span className="text-sm font-bold">{tag.name}</span>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
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
                        <button
                          onClick={(e) => handleMenuOpen(e, tag)}
                          className="p-0.5 hover:bg-white dark:hover:bg-slate-600 rounded-full transition-colors"
                        >
                          <MoreVertical className="w-3 h-3 text-slate-400" />
                        </button>
                      )}
                      
                      <Menu
                        anchorEl={anchorEl}
                        open={Boolean(anchorEl) && menuTag === tag}
                        onClose={handleMenuClose}
                        PaperProps={{
                          sx: { 
                            borderRadius: '12px', 
                            mt: 1, 
                            boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                            border: '1px solid #E2E8F0'
                          }
                        }}
                      >
                        <MenuItem
                          onClick={() => handleRemoveTag(tag)}
                          disabled={isUpdating}
                          sx={{ color: '#EF4444', gap: 1.5, py: 1, px: 2 }}
                        >
                          <Trash2 className="w-4 h-4" />
                          <span className="text-sm font-bold">Remove Tag</span>
                        </MenuItem>
                      </Menu>
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
