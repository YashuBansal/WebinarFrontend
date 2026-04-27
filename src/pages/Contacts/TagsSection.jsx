import { useState } from "react";
import {
  Chip,
  FormControl,
  Select,
  MenuItem,
  Menu,
  IconButton,
} from "@mui/material";
import AppLoader from "../../components/AppLoader";
import { MoreVert, Delete } from "@mui/icons-material";
import { useTags, useUpdateAttendeeTag } from "../../hooks/useTags";
import ComponentGuard from "../../components/AccessControl/ComponentGuard";
import { useSelector } from "react-redux";

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
    <div className="border border-gray-300 rounded-lg shadow-sm bg-white">
      <div className="border-b border-gray-300 px-4 py-3 bg-gray-100">
        <h3 className="font-semibold text-gray-700 text-lg">Tags</h3>
      </div>
      <div className="p-4 space-y-4">
        {/* Add Tag Dropdown */}
        <ComponentGuard
          conditions={[employeeModeData ? false : true, userData?.isActive]}
        >
          <FormControl fullWidth size="small">
            <Select
              value={selectedTag}
              onChange={(e) => {
                const value = e.target.value;
                setSelectedTag(value);
                if (value) {
                  handleAddTag(value);
                }
              }}
              displayEmpty
              disabled={isUpdating || isLoadingTags || availableTagsToAdd.length === 0}
              renderValue={(selected) => {
                if (!selected) {
                  return (
                    <span style={{ color: "#888" }}>
                      {isLoadingTags
                        ? "Loading tags..."
                        : availableTagsToAdd.length === 0
                        ? "No tags available to add"
                        : "Select a tag to add"}
                    </span>
                  );
                }
                const tag = availableTags.find((t) => t.name === selected);
                return tag?.name || selected;
              }}
            >
              {availableTagsToAdd.map((tag) => (
                <MenuItem key={tag._id || tag.name} value={tag.name}>
                  {tag.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </ComponentGuard>

        {/* Tags Display */}
        {isUpdating && (
          <div className="flex justify-center py-2">
            <AppLoader size="md" />
          </div>
        )}
        {currentTags.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {currentTags.map((tag) => {
              const canEdit = !employeeModeData && userData?.isActive;
              return (
                <div key={tag} className="relative group">
                  <Chip
                    label={tag}
                    variant="outlined"
                    size="small"
                    className="bg-slate-100 text-gray-700 border-gray-300 hover:bg-slate-200 transition-colors"
                    sx={{
                      "& .MuiChip-label": {
                        fontWeight: 500,
                      },
                    }}
                    onDelete={
                      canEdit
                        ? (e) => {
                            e.stopPropagation();
                            handleMenuOpen(e, tag);
                          }
                        : undefined
                    }
                    deleteIcon={
                      canEdit ? (
                        <MoreVert fontSize="small" />
                      ) : undefined
                    }
                  />
                  <Menu
                    anchorEl={anchorEl}
                    open={Boolean(anchorEl) && menuTag === tag}
                    onClose={handleMenuClose}
                    anchorOrigin={{
                      vertical: "bottom",
                      horizontal: "left",
                    }}
                    transformOrigin={{
                      vertical: "top",
                      horizontal: "left",
                    }}
                  >
                    <MenuItem
                      onClick={() => handleRemoveTag(tag)}
                      disabled={isUpdating}
                    >
                      <Delete fontSize="small" className="mr-2" />
                      Remove Tag
                    </MenuItem>
                  </Menu>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-4">
            <p className="text-gray-500 text-sm">No tags found</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TagsSection;

