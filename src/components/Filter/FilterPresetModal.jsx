import React, { useEffect, useMemo, useState } from "react";
import { Edit, Trash2, X, Bookmark, ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "../ui/dropdown-menu";
import { useDispatch, useSelector } from "react-redux";
import {
  creattFilterPreset,
  deleteFilterPreset,
  getFilterPreset,
} from "../../features/actions/filter-preset";
import { clearPreset } from "../../features/slices/filter-preset";
import { errorToast, successToast } from "../../utils/extra";
import useAddUserActivity from "../../hooks/useAddUserActivity";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { Dialog, DialogContent } from "../ui/dialog";
import { useTheme } from "../../contexts/ThemeContext";

const FilterPresetModal = ({
  open,
  setIsPresetModalOpen,
  tableName = "",
  filters = {},
  setFilters,
}) => {
  const isOpen = open !== undefined ? open : true;
  const dispatch = useDispatch();
  const logUserActivity = useAddUserActivity();
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const { filterPresets } = useSelector((state) => state.filterPreset);
  const [selectedPresetId, setSelectedPresetId] = useState("");
  const [isEditingPresetName, setIsEditingPresetName] = useState(false);
  const [editingPresetNameValue, setEditingPresetNameValue] = useState("");

  useEffect(() => {
    dispatch(getFilterPreset(tableName));
    return () => dispatch(clearPreset());
  }, [dispatch, tableName]);

  const presets = useMemo(
    () => (Array.isArray(filterPresets) ? filterPresets : []),
    [filterPresets]
  );

  const handleClose = () => {
    setIsPresetModalOpen(false);
    setIsEditingPresetName(false);
  };

  const handleLoadPreset = () => {
    const preset = presets.find((p) => p._id === selectedPresetId);
    if (!preset) return;
    setFilters(preset.filters || {});
    successToast("Preset Applied Successfully");
    logUserActivity({
      action: "filter",
      type: `Preset for Table - ${tableName}`,
      detailItem: preset?.name,
    });
    handleClose();
  };

  const handleDeletePreset = () => {
    const preset = presets.find((p) => p._id === selectedPresetId);
    if (!preset) return;
    dispatch(deleteFilterPreset(selectedPresetId));
    logUserActivity({
      action: "delete",
      type: `Filter Preset for Table - ${tableName}`,
      detailItem: preset?.name,
    });
    setSelectedPresetId("");
  };

  const handleSaveEditedPresetName = () => {
    const selectedPreset = presets.find((p) => p._id === selectedPresetId);
    if (!selectedPreset) return;
    if (!editingPresetNameValue.trim()) {
      errorToast("Preset name is required");
      return;
    }
    dispatch(
      creattFilterPreset({
        name: editingPresetNameValue.trim(),
        tableName,
        filters: selectedPreset.filters || {},
      })
    );
    dispatch(deleteFilterPreset(selectedPresetId));
    setIsEditingPresetName(false);
    setSelectedPresetId("");
  };

  const panelStyle = {
    backgroundColor: isDark ? "#1e293b" : "#ffffff",
    border: `1px solid ${isDark ? "#334155" : "#e5e7eb"}`,
  };

  const inputStyle = {
    backgroundColor: isDark ? "#0f172a" : "#ffffff",
    border: `1px solid ${isDark ? "#334155" : "#e2e8f0"}`,
    color: isDark ? "#f8fafc" : "#0f172a",
  };

  const labelColor = isDark ? "#cbd5e1" : "#334155";
  const titleColor = isDark ? "#f8fafc" : "#0f172a";

  return (
    <Dialog open={isOpen} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="max-w-sm border-0 bg-transparent p-0 shadow-none">
        <div
          className="relative w-full rounded-2xl p-6 shadow-2xl flex flex-col"
          style={panelStyle}
          onMouseDown={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-lg font-bold" style={{ color: titleColor }}>
              Load Filter Preset
            </h3>
            <button
              type="button"
              onClick={handleClose}
              className="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/10"
              aria-label="Close"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          <div className="mb-8">
            <label
              className="block text-sm font-medium mb-2"
              style={{ color: labelColor }}
            >
              {isEditingPresetName ? "Rename Preset" : "Select Preset"}
            </label>
            <div className="relative">
              {isEditingPresetName ? (
                <>
                  <Edit className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  <Input
                    autoFocus
                    type="text"
                    value={editingPresetNameValue}
                    onChange={(e) => setEditingPresetNameValue(e.target.value)}
                    className="pl-9 rounded-xl border-[#e2e8f0] dark:border-slate-600"
                    style={inputStyle}
                  />
                </>
              ) : (
                <div className="relative">
                  <Bookmark className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none z-[1]" />
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="outline"
                        className="flex h-11 w-full items-center justify-between rounded-xl border-gray-200 bg-white pl-10 pr-4 py-2.5 text-sm dark:border-slate-800 dark:bg-slate-900 text-slate-700 dark:text-slate-200 outline-none hover:bg-gray-50 dark:hover:bg-white/10 transition-all duration-200"
                        style={inputStyle}
                      >
                        <span className="truncate">
                          {selectedPresetId
                            ? presets.find((p) => p._id === selectedPresetId)?.name ||
                              "Select a preset..."
                            : "Select a preset..."}
                        </span>
                        <ChevronDown className="h-4 w-4 opacity-50 shrink-0" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      align="start"
                      className="w-[var(--radix-dropdown-menu-trigger-width)] min-w-[var(--radix-dropdown-menu-trigger-width)] max-h-[300px] z-[300] overflow-y-auto overflow-x-hidden custom-scrollbar bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-xl p-1"
                    >
                      {presets.length === 0 ? (
                        <div className="px-3 py-2 text-sm text-slate-500 text-center">
                          No presets found
                        </div>
                      ) : (
                        presets.map((p) => (
                          <DropdownMenuItem
                            key={p._id}
                            onClick={() => setSelectedPresetId(p._id)}
                            className="cursor-pointer rounded-lg px-3 py-2 text-sm hover:bg-slate-100 dark:hover:bg-white/10 text-slate-700 dark:text-slate-200"
                          >
                            {p.name}
                          </DropdownMenuItem>
                        ))
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              )}
            </div>
          </div>

          {isEditingPresetName ? (
            <div className="flex justify-end gap-3 mt-auto w-full">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEditingPresetName(false)}
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
                onClick={handleSaveEditedPresetName}
                disabled={!editingPresetNameValue.trim()}
                className="rounded-xl px-5 py-2.5 font-semibold hover:scale-[1.02] disabled:opacity-50 bg-[#3b82f6] text-white"
              >
                Save Name
              </Button>
            </div>
          ) : (
            <div className="flex justify-between items-center mt-auto w-full gap-2 flex-wrap">
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={() => {
                    const selected = presets.find(
                      (p) => p._id === selectedPresetId
                    );
                    if (selected) {
                      setEditingPresetNameValue(selected.name || "");
                      setIsEditingPresetName(true);
                    }
                  }}
                  disabled={!selectedPresetId}
                  className="p-2.5 rounded-xl hover:bg-blue-50 dark:hover:bg-blue-500/10 disabled:opacity-50 transition-colors group"
                  title="Rename Preset"
                >
                  <Edit className="w-4 h-4 text-blue-500 group-disabled:text-gray-400" />
                </button>
                <button
                  type="button"
                  onClick={handleDeletePreset}
                  disabled={!selectedPresetId}
                  className="p-2.5 rounded-xl hover:bg-red-50 dark:hover:bg-red-500/10 disabled:opacity-50 transition-colors group"
                  title="Delete Preset"
                >
                  <Trash2 className="w-4 h-4 text-red-500 group-disabled:text-gray-400" />
                </button>
              </div>
              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClose}
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
                  onClick={handleLoadPreset}
                  disabled={!selectedPresetId}
                  className="rounded-xl px-5 py-2.5 font-semibold hover:scale-[1.02] disabled:opacity-50 bg-[#22B573] text-white"
                >
                  Load Preset
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default FilterPresetModal;
