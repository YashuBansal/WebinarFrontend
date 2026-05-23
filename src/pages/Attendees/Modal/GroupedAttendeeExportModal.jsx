import { useEffect, useState, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import AppLoader from "../../../components/AppLoader";
import { ChevronDown, Trash2, X } from "lucide-react";
import { closeModal } from "../../../features/slices/modalSlice";
import { groupedAttendeeTableColumns } from "../../../utils/columnData";
import { resetExportSuccess } from "../../../features/slices/export-excel";
import {
  creattFilterPreset,
  deleteFilterPreset,
  getFilterPreset,
} from "../../../features/actions/filter-preset";
import {
  clearPreset,
  resetFilterPresetSuccess,
} from "../../../features/slices/filter-preset";
import { exportGroupedAttendeesExcel } from "../../../features/actions/export-excel";
import useUserSubscription from "../../../hooks/useUserSubscription";
import { Dialog, DialogContent } from "../../../components/ui/dialog";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { Checkbox } from "../../../components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "../../../components/ui/dropdown-menu";

import { useTheme } from "../../../contexts/ThemeContext";

const tableName = "All Attendees Export";

const GroupedAttendeesExportModal = ({ modalName, filters, sort }) => {
  const dispatch = useDispatch();
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const { data: subscription } = useUserSubscription();
  const tableConfig = subscription?.plan?.attendeeTableConfig || {};

  const { isExportLoading } = useSelector((state) => state.export);
  const {
    filterPresets,
    isSuccess: isPresetCreationSuccess,
    isLoading: isPresetLoading,
  } = useSelector((state) => state.filterPreset);

  const [limit, setLimit] = useState("");
  const [selectedColumns, setSelectedColumns] = useState([]);
  const [columns, setColumns] = useState([]);
  const [includeFilter, setIncludeFilter] = useState(true);
  const [presetNameInput, setPresetNameInput] = useState("");
  const [selectedPresetId, setSelectedPresetId] = useState("");

  const manualInteractionRef = useRef(false);

  const panelStyle = {
    backgroundColor: isDark ? "#1e293b" : "#ffffff",
    border: `1px solid ${isDark ? "#334155" : "#e5e7eb"}`,
  };

  const inputStyle = {
    backgroundColor: isDark ? "#0f172a" : "#ffffff",
    border: `1px solid ${isDark ? "#334155" : "#e2e8f0"}`,
    color: isDark ? "#f8fafc" : "#0f172a",
  };

  const handleCheckboxChange = (key) => {
    setSelectedColumns((prev) =>
      prev.includes(key) ? prev.filter((col) => col !== key) : [...prev, key]
    );
    setSelectedPresetId("");
    manualInteractionRef.current = true;
  };

  const handleClose = () => {
    dispatch(closeModal(modalName));
  };

  const handleSubmit = () => {
    const limitValue = limit || undefined;
    dispatch(
      exportGroupedAttendeesExcel({
        limit: Number(limitValue) || 0,
        columns: selectedColumns,
        filters: includeFilter ? filters : {},
        sort,
      })
    );
  };

  useEffect(() => {
    if (isExportLoading) {
      dispatch(resetExportSuccess());
      handleClose();
    }
  }, [isExportLoading, dispatch]);

  useEffect(() => {
    const allColumns = [
      { header: "Email", key: "email", width: 20, type: "" },
      ...groupedAttendeeTableColumns.filter(
        (column) => column.header !== "Email"
      ),
      { header: "Phone", key: "phone", width: 20, type: "" },
    ];

    const newAvailableColumns = allColumns.filter((col) =>
      col.key in tableConfig ? tableConfig[col.key].downloadable : true
    );
    if (tableConfig["leadType"]?.downloadable) {
      if (!newAvailableColumns.some((col) => col.key === "leadType")) {
        newAvailableColumns.push({
          header: "LeadType",
          key: "leadType",
          width: 20,
        });
      }
    }
    setColumns(newAvailableColumns);

    if (manualInteractionRef.current) {
      manualInteractionRef.current = false;
      return;
    }

    if (selectedPresetId) {
      const presetToApply = (filterPresets || []).find(
        (p) => (p._id || p.name) === selectedPresetId
      );
      if (presetToApply?.filters?.selectedColumns) {
        const availableKeys = newAvailableColumns.map((col) => col.key);
        const validPresetColumns = presetToApply.filters.selectedColumns.filter(
          (key) => availableKeys.includes(key)
        );
        setSelectedColumns(validPresetColumns);
      }
    } else {
      setSelectedColumns(newAvailableColumns.map((col) => col.key));
    }
  }, [tableConfig, selectedPresetId, filterPresets, dispatch]);

  useEffect(() => {
    dispatch(getFilterPreset(tableName));
    return () => {
      dispatch(clearPreset());
    };
  }, [dispatch]);

  useEffect(() => {
    if (isPresetCreationSuccess) {
      const newPresetName = presetNameInput.trim();
      setPresetNameInput("");
      dispatch(resetFilterPresetSuccess());
      dispatch(getFilterPreset(tableName)).then(() => {
        setSelectedPresetId(newPresetName);
      });
    }
  }, [isPresetCreationSuccess, dispatch, presetNameInput]);

  const handleSavePreset = () => {
    if (!presetNameInput.trim()) {
      alert("Error: Preset name cannot be empty.");
      return;
    }
    if (selectedColumns.length === 0) {
      alert("Error: Please select at least one column.");
      return;
    }
    if ((filterPresets || []).some((p) => p.name === presetNameInput.trim())) {
      alert("Error: A preset with this name already exists.");
      return;
    }
    const payload = {
      name: presetNameInput.trim(),
      tableName,
      filters: { selectedColumns },
    };
    dispatch(creattFilterPreset(payload));
  };

  const handleApplyPreset = (presetIdentifier) => {
    setSelectedPresetId(presetIdentifier);
    manualInteractionRef.current = false;

    if (!presetIdentifier) {
      const defaultSelected = columns.map((col) => col.key);
      setSelectedColumns(defaultSelected);
      return;
    }

    const presetToApply = (filterPresets || []).find(
      (p) => (p._id || p.name) === presetIdentifier
    );

    if (presetToApply?.filters?.selectedColumns) {
      const availableKeys = columns.map((col) => col.key);
      const orderedAndAvailablePresetColumns =
        presetToApply.filters.selectedColumns.filter((key) =>
          availableKeys.includes(key)
        );
      setSelectedColumns(orderedAndAvailablePresetColumns);
    }
  };

  const handleSelectAllToggle = () => {
    const allColumnKeys = columns.map((col) => col.key);
    const allCurrentlySelected =
      selectedColumns.length === allColumnKeys.length &&
      allColumnKeys.every((key) => selectedColumns.includes(key));

    if (allCurrentlySelected) {
      setSelectedColumns([]);
    } else {
      setSelectedColumns(allColumnKeys);
    }
    setSelectedPresetId("");
    manualInteractionRef.current = true;
  };

  const deleteSelectedPreset = () => {
    if (!selectedPresetId) return;
    dispatch(deleteFilterPreset(selectedPresetId));
    setSelectedPresetId("");
    handleApplyPreset("");
  };

  const areAllSelected =
    columns.length > 0 &&
    selectedColumns.length === columns.length &&
    columns.every((col) => selectedColumns.includes(col.key));

  const duplicatePresetName =
    presetNameInput.trim() &&
    (filterPresets || []).some((p) => p.name === presetNameInput.trim());

  return (
    <Dialog open onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="max-w-[900px] border-0 bg-transparent p-0 shadow-none w-[90vw]">
        <div
          className="flex flex-col max-h-[90vh] rounded-2xl shadow-2xl overflow-hidden"
          style={panelStyle}
        >
          <div
            className="flex items-center justify-between p-4 border-b shrink-0"
            style={{
              borderColor: isDark ? "#334155" : "#e5e7eb",
            }}
          >
            <h2
              className="text-lg font-bold"
              style={{ color: isDark ? "#f8fafc" : "#0f172a" }}
            >
              Export Excel Options
            </h2>
            <button
              type="button"
              onClick={handleClose}
              className="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/10"
              aria-label="Close"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar p-4 sm:p-5 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label
                  className="block text-xs font-semibold uppercase tracking-wide mb-2"
                  style={{ color: isDark ? "#94a3b8" : "#64748b" }}
                >
                  Limit (Max 10,000)
                </label>
                <Input
                  type="number"
                  placeholder="All"
                  value={limit}
                  onChange={(e) => {
                    if (e.target.value === "") setLimit("");
                    else {
                      const value = Number(e.target.value);
                      if (!isNaN(value) && value > 0 && value <= 10000)
                        setLimit(String(value));
                      else if (value > 10000) setLimit("10000");
                    }
                  }}
                  onKeyDown={(e) => {
                    const allowedKeys = [
                      "Backspace",
                      "ArrowLeft",
                      "ArrowRight",
                      "Delete",
                      "Tab",
                    ];
                    if (
                      !allowedKeys.includes(e.key) &&
                      !(e.key >= "0" && e.key <= "9")
                    )
                      e.preventDefault();
                  }}
                  className="rounded-xl"
                  style={inputStyle}
                />
              </div>
              <div>
                <label
                  className="block text-xs font-semibold uppercase tracking-wide mb-2"
                  style={{ color: isDark ? "#94a3b8" : "#64748b" }}
                >
                  Apply Preset
                </label>
                <div className="flex gap-2 items-start">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="outline"
                        className="flex h-10 w-full items-center justify-between rounded-xl border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-800 dark:bg-slate-950 text-slate-700 dark:text-slate-300 outline-none ring-offset-white focus:ring-2 focus:ring-emerald-500/20 hover:bg-slate-50 dark:hover:bg-white/10 transition-all duration-200"
                        style={inputStyle}
                      >
                        <span className="truncate">
                          {selectedPresetId
                            ? (filterPresets || []).find(
                                (p) => (p._id || p.name) === selectedPresetId
                              )?.name || "Select Preset"
                            : "Default Columns"}
                        </span>
                        <ChevronDown className="h-4 w-4 opacity-50" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      align="start"
                      className="w-[280px] sm:w-[350px] max-h-[300px] z-[300] overflow-y-auto bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-xl p-1"
                    >
                      <DropdownMenuItem
                        onClick={() => handleApplyPreset("")}
                        className="cursor-pointer rounded-lg px-3 py-2 text-sm hover:bg-slate-100 dark:hover:bg-white/10 text-slate-700 dark:text-slate-200"
                      >
                        Default Columns
                      </DropdownMenuItem>
                      {(filterPresets || []).map((preset) => (
                        <DropdownMenuItem
                          key={preset._id}
                          onClick={() => handleApplyPreset(preset._id)}
                          className="cursor-pointer rounded-lg px-3 py-2 text-sm hover:bg-slate-100 dark:hover:bg-white/10 text-slate-700 dark:text-slate-200"
                        >
                          {preset.name}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                  {selectedPresetId && (
                    <button
                      type="button"
                      disabled={isPresetLoading}
                      onClick={deleteSelectedPreset}
                      className="p-2.5 rounded-xl border shrink-0 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                      style={inputStyle}
                      title="Delete selected preset"
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3
                className="text-base font-bold"
                style={{ color: isDark ? "#f8fafc" : "#0f172a" }}
              >
                Select Columns for Export
              </h3>
              {columns.length > 0 && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="rounded-xl"
                  onClick={handleSelectAllToggle}
                  disabled={columns.length === 0}
                >
                  {areAllSelected ? "Deselect All" : "Select All"}
                </Button>
              )}
            </div>

            <div
              className="grid grid-cols-2 sm:grid-cols-3 gap-x-3 gap-y-2 p-3 rounded-xl border max-h-[250px] overflow-y-auto custom-scrollbar"
              style={{
                borderColor: isDark ? "#334155" : "#e2e8f0",
                backgroundColor: isDark ? "#0f172a" : "#f8fafc",
              }}
            >
              {columns.map((column) => (
                <label
                  key={column.key}
                  className="flex items-center gap-2 cursor-pointer text-sm py-1"
                  style={{ color: isDark ? "#e2e8f0" : "#334155" }}
                >
                  <Checkbox
                    checked={selectedColumns.includes(column.key)}
                    onCheckedChange={() => handleCheckboxChange(column.key)}
                    className={isDark ? "border-slate-500" : ""}
                  />
                  <span className="flex-1 truncate">{column.header}</span>
                  {selectedColumns.includes(column.key) ? (
                    <span className="text-[10px] font-bold text-white bg-indigo-600 h-5 min-w-5 px-1 flex justify-center items-center rounded-full shrink-0">
                      {selectedColumns.indexOf(column.key) + 1}
                    </span>
                  ) : null}
                </label>
              ))}
              {columns.length === 0 && (
                <p className="text-sm col-span-full text-slate-500">
                  No columns available for selection.
                </p>
              )}
            </div>

            <div>
              <h3
                className="text-base font-bold mb-2"
                style={{ color: isDark ? "#f8fafc" : "#0f172a" }}
              >
                Save Current Selection as Preset
              </h3>
              <div className="flex flex-col sm:flex-row gap-3 items-end">
                <div className="flex-1 w-full">
                  <Input
                    placeholder="New preset name"
                    value={presetNameInput}
                    onChange={(e) => setPresetNameInput(e.target.value)}
                    className="rounded-xl"
                    style={inputStyle}
                  />
                </div>
                <Button
                  type="button"
                  variant="outline"
                  className="rounded-xl w-full sm:w-auto shrink-0"
                  onClick={handleSavePreset}
                  disabled={
                    !presetNameInput.trim() ||
                    selectedColumns.length === 0 ||
                    duplicatePresetName
                  }
                >
                  Save Preset
                </Button>
              </div>
              {duplicatePresetName && (
                <p className="text-sm text-red-500 mt-1">
                  A preset with this name already exists.
                </p>
              )}
            </div>
          </div>

          <div
            className="p-4 border-t shrink-0 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
            style={{
              borderColor: isDark ? "#334155" : "#e5e7eb",
              backgroundColor: isDark ? "rgba(15,23,42,0.5)" : "#F9FAFB",
            }}
          >
            <label className="flex items-center gap-2 cursor-pointer text-sm">
              <Checkbox
                checked={includeFilter}
                onCheckedChange={(c) => setIncludeFilter(Boolean(c))}
                className={isDark ? "border-slate-500" : ""}
              />
              <span style={{ color: isDark ? "#cbd5e1" : "#475569" }}>
                Filters {includeFilter ? "Included" : "Excluded"}
              </span>
            </label>
            <div className="flex flex-wrap justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                className="rounded-xl"
                style={{
                  borderColor: isDark ? "#475569" : "#cbd5e1",
                  color: isDark ? "#cbd5e1" : "#475569",
                }}
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleSubmit}
                disabled={isExportLoading || selectedColumns.length === 0}
                className="rounded-xl px-5 font-semibold text-white min-w-[120px] bg-[#22B573] hover:bg-[#1da366] shadow-md"
              >
                {isExportLoading ? (
                  <AppLoader size="md" variant="inverse" />
                ) : (
                  "Download"
                )}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default GroupedAttendeesExportModal;
