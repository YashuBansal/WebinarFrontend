import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { closeModal } from "../../features/slices/modalSlice";
import { exportWebinarAttendeesExcel } from "../../features/actions/export-excel";
import AppLoader from "../AppLoader";
import { attendeeTableColumns } from "../../utils/columnData";
import { resetExportSuccess } from "../../features/slices/export-excel";
import {
  creattFilterPreset,
  deleteFilterPreset,
  getFilterPreset,
} from "../../features/actions/filter-preset";
import {
  clearPreset,
  resetFilterPresetSuccess,
} from "../../features/slices/filter-preset";
import DeleteIcon from "../../components/SVGs/red-bin.svg";
import useUserSubscription from "../../hooks/useUserSubscription";
import { Dialog, DialogContent } from "../ui/dialog";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Checkbox } from "../ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "../ui/dropdown-menu";
import { ChevronDown, Download, X } from "lucide-react";
import { useTheme } from "../../contexts/ThemeContext";

const tableName = "Webinar Attendees Export";
const FONT = "Inter, sans-serif";

const ExportWebinarAttendeesModal = ({
  modalName,
  open = true,
  title = "Export Excel Options",
  defaultColumns = null,
  onSubmitExport = null,
  presetTableName = null,
  allowPresetsInSharedMode = false,
  filters,
  isAttended,
  webinarId,
  webinarName,
  validCall,
  assignmentType,
  sort,
  flag = "attendee",
}) => {
  const { isDark } = useTheme();
  const dispatch = useDispatch();
  const { data: subscription } = useUserSubscription();
  const tableConfig = subscription?.plan?.attendeeTableConfig || {};
  const employeeInactivity = subscription?.plan?.employeeInactivity;
  const isSharedMode =
    Array.isArray(defaultColumns) && typeof onSubmitExport === "function";
  const enablePresets = !isSharedMode || allowPresetsInSharedMode;
  const activePresetTableName = presetTableName || tableName;

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

  const handleClose = () => {
    dispatch(closeModal(modalName));
  };

  const handleCheckboxChange = (key) => {
    setSelectedColumns((prev) =>
      prev.includes(key) ? prev.filter((col) => col !== key) : [...prev, key]
    );
    setSelectedPresetId("");
    manualInteractionRef.current = true;
  };

  const handleSubmit = () => {
    const exportLimit = Number(limit) || 0;
    if (isSharedMode) {
      onSubmitExport({
        limit: exportLimit,
        columns: selectedColumns,
        filters: includeFilter ? filters || {} : {},
        includeFilter,
      });
      return;
    }

    dispatch(
      exportWebinarAttendeesExcel({
        limit: exportLimit,
        columns: selectedColumns,
        filters: includeFilter ? filters : {},
        isAttended,
        webinarId,
        webinarName,
        validCall,
        assignmentType,
        sort,
      })
    );
  };

  useEffect(() => {
    if (!isExportLoading) return;
    if (!isSharedMode) dispatch(resetExportSuccess());
    handleClose();
  }, [isExportLoading, dispatch, isSharedMode]);

  useEffect(() => {
    let newAvailableColumns = [];

    if (isSharedMode) {
      newAvailableColumns = (defaultColumns || []).filter((column) => {
        if (column.key === "inactivityTime" && !employeeInactivity) {
          return false;
        }
        return true;
      });
    } else {
      newAvailableColumns = attendeeTableColumns.filter((col) =>
        col.key in tableConfig ? tableConfig[col.key].downloadable : true
      );
      if (
        tableConfig.leadType?.downloadable &&
        !newAvailableColumns.some((col) => col.key === "leadType")
      ) {
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

    if (enablePresets && selectedPresetId) {
      const presetToApply = (filterPresets || []).find(
        (p) => (p._id || p.name) === selectedPresetId
      );
      if (presetToApply?.filters?.selectedColumns) {
        const availableKeys = newAvailableColumns.map((col) => col.key);
        const validPresetColumns = presetToApply.filters.selectedColumns.filter(
          (key) => availableKeys.includes(key)
        );
        setSelectedColumns(validPresetColumns);
        return;
      }
    }

    setSelectedColumns(newAvailableColumns.map((col) => col.key));
  }, [
    tableConfig,
    selectedPresetId,
    filterPresets,
    isSharedMode,
    enablePresets,
    defaultColumns,
    employeeInactivity,
  ]);

  useEffect(() => {
    if (!enablePresets) return undefined;
    dispatch(getFilterPreset(activePresetTableName));
    return () => {
      dispatch(clearPreset());
    };
  }, [dispatch, enablePresets, activePresetTableName]);

  useEffect(() => {
    if (!enablePresets || !isPresetCreationSuccess) return;
    const newPresetName = presetNameInput.trim();
    setPresetNameInput("");
    dispatch(resetFilterPresetSuccess());
    dispatch(getFilterPreset(activePresetTableName)).then(() => {
      setSelectedPresetId(newPresetName);
    });
  }, [
    isPresetCreationSuccess,
    dispatch,
    presetNameInput,
    enablePresets,
    activePresetTableName,
  ]);

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
    dispatch(
      creattFilterPreset({
        name: presetNameInput.trim(),
        tableName: activePresetTableName,
        filters: { selectedColumns },
      })
    );
  };

  const handleApplyPreset = (presetIdentifier) => {
    setSelectedPresetId(presetIdentifier);
    manualInteractionRef.current = false;

    if (!presetIdentifier) {
      setSelectedColumns(columns.map((col) => col.key));
      return;
    }

    const presetToApply = (filterPresets || []).find(
      (p) => (p._id || p.name) === presetIdentifier
    );
    if (!presetToApply?.filters?.selectedColumns) return;

    const availableKeys = columns.map((col) => col.key);
    const orderedAndAvailablePresetColumns =
      presetToApply.filters.selectedColumns.filter((key) =>
        availableKeys.includes(key)
      );
    setSelectedColumns(orderedAndAvailablePresetColumns);
  };

  const handleSelectAllToggle = () => {
    const allColumnKeys = columns.map((col) => col.key);
    const allCurrentlySelected =
      selectedColumns.length === allColumnKeys.length &&
      allColumnKeys.every((key) => selectedColumns.includes(key));

    setSelectedColumns(allCurrentlySelected ? [] : allColumnKeys);
    setSelectedPresetId("");
    manualInteractionRef.current = true;
  };

  const areAllSelected =
    columns.length > 0 &&
    selectedColumns.length === columns.length &&
    columns.every((col) => selectedColumns.includes(col.key));

  const duplicatePresetName =
    presetNameInput.trim() &&
    (filterPresets || []).some((p) => p.name === presetNameInput.trim());

  return (
    <Dialog open={Boolean(open)} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="w-[92vw] max-w-[980px] p-0 bg-transparent shadow-none border-0">
        <div className="flex max-h-[90vh] flex-col overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 px-5 py-4">
            <h2
              className="flex items-center gap-2 text-lg font-bold text-slate-900 dark:text-slate-100"
              style={{ fontFamily: FONT }}
            >
              <Download className="h-5 w-5 text-gray-500" />
              {title}
            </h2>
            <button
              type="button"
              onClick={handleClose}
              className="rounded-lg p-1.5 text-slate-500 transition-colors hover:bg-black/5 dark:hover:bg-white/5"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-5 py-4">
            <div className={`grid gap-4 ${enablePresets ? "grid-cols-1 md:grid-cols-2" : "grid-cols-1"}`}>
              <div>
                <label
                  className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-slate-500"
                  style={{ fontFamily: FONT, letterSpacing: "0.04em" }}
                >
                  Limit (Max 10,000)
                </label>
                <Input
                  type="number"
                  placeholder="All"
                  value={limit}
                  onChange={(e) => {
                    if (e.target.value === "") {
                      setLimit("");
                      return;
                    }
                    const value = Number(e.target.value);
                    if (!isNaN(value) && value > 0 && value <= 10000) {
                      setLimit(value);
                    } else if (value > 10000) {
                      setLimit(10000);
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
                    ) {
                      e.preventDefault();
                    }
                  }}
                  className="h-10 rounded-xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 focus:ring-[#22B573]/35"
                  style={{ fontFamily: FONT }}
                />
              </div>

              {enablePresets && (
                <div>
                  <label
                    className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-slate-500"
                    style={{ fontFamily: FONT, letterSpacing: "0.04em" }}
                  >
                    Apply Preset
                  </label>
                  <div className="flex items-center gap-2">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="outline"
                          className="flex h-10 w-full items-center justify-between rounded-xl border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-800 dark:bg-slate-950 text-slate-700 dark:text-slate-300 outline-none ring-offset-white focus:ring-2 focus:ring-emerald-500/20 hover:bg-slate-50 dark:hover:bg-white/10"
                          style={{ fontFamily: FONT }}
                        >
                          <span className="truncate">
                            {selectedPresetId
                              ? (filterPresets || []).find(
                                  (p) => p._id === selectedPresetId
                                )?.name || "Select Preset"
                              : "Default Columns"}
                          </span>
                          <ChevronDown className="h-4 w-4 opacity-50" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent
                        align="start"
                        className="w-[var(--radix-dropdown-menu-trigger-width)] min-w-[var(--radix-dropdown-menu-trigger-width)] max-h-[300px] z-[300] overflow-y-auto overflow-x-hidden custom-scrollbar bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-xl p-1"
                      >
                        <DropdownMenuItem
                          onClick={() => handleApplyPreset("")}
                          className="cursor-pointer rounded-lg px-3 py-2 text-sm hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200"
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
                        onClick={() => dispatch(deleteFilterPreset(selectedPresetId))}
                        className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-2.5 transition-colors hover:bg-red-50 dark:hover:bg-red-500/10"
                        title="Delete selected preset"
                      >
                        <img
                          src={DeleteIcon}
                          alt="Delete"
                          className="h-4 w-4 min-h-4 min-w-4"
                        />
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="mb-2 mt-5 flex items-center justify-between gap-2">
              <h3
                className="text-base font-bold text-slate-900 dark:text-slate-100"
                style={{ fontFamily: FONT }}
              >
                Select Columns for Export
              </h3>
              {columns.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSelectAllToggle}
                  className="rounded-xl border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-700 dark:text-slate-300"
                  style={{ fontFamily: FONT }}
                >
                  {areAllSelected ? "Deselect All" : "Select All"}
                </Button>
              )}
            </div>

            <div className="mb-3 grid max-h-[250px] grid-cols-2 gap-x-3 gap-y-1 overflow-y-auto rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 p-3 sm:grid-cols-3">
              {columns.map((column) => (
                <label
                  key={column.key}
                  className="flex cursor-pointer items-center gap-2 py-1 text-sm text-slate-700 dark:text-slate-300"
                  style={{ fontFamily: FONT }}
                >
                  <Checkbox
                    checked={selectedColumns.includes(column.key)}
                    onCheckedChange={() => handleCheckboxChange(column.key)}
                    className="border-emerald-300 data-[state=checked]:border-emerald-500 data-[state=checked]:bg-emerald-500"
                  />
                  <span className="truncate">{column.header}</span>
                  {selectedColumns.includes(column.key) ? (
                    <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-indigo-600 px-1 text-[10px] font-bold text-white">
                      {selectedColumns.indexOf(column.key) + 1}
                    </span>
                  ) : null}
                </label>
              ))}
              {columns.length === 0 && (
                <p className="col-span-full p-1 text-sm text-slate-500">
                  No columns available for selection.
                </p>
              )}
            </div>

            {enablePresets && (
              <>
                <h3
                  className="mb-2 mt-4 text-base font-bold text-slate-900 dark:text-slate-100"
                  style={{ fontFamily: FONT }}
                >
                  Save Current Selection as Preset
                </h3>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
                  <Input
                    placeholder="New preset name"
                    value={presetNameInput}
                    onChange={(e) => setPresetNameInput(e.target.value)}
                    className="h-10 rounded-xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 focus:ring-[#22B573]/35"
                    style={{ fontFamily: FONT }}
                  />
                  <Button
                    variant="outline"
                    onClick={handleSavePreset}
                    disabled={
                      !presetNameInput.trim() ||
                      selectedColumns.length === 0 ||
                      duplicatePresetName
                    }
                    className="rounded-xl border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-5 text-slate-600 dark:text-slate-400"
                    style={{ fontFamily: FONT }}
                  >
                    Save Preset
                  </Button>
                </div>
                {duplicatePresetName && (
                  <p className="mt-1 text-sm text-red-500">
                    A preset with this name already exists.
                  </p>
                )}
              </>
            )}
          </div>

          <div className="flex flex-col gap-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <label
              className="flex cursor-pointer items-center gap-2 text-sm text-slate-600 dark:text-slate-400"
              style={{ fontFamily: FONT }}
            >
              <Checkbox
                checked={includeFilter}
                onCheckedChange={(checked) => setIncludeFilter(Boolean(checked))}
                className="border-emerald-300 data-[state=checked]:border-emerald-500 data-[state=checked]:bg-emerald-500"
              />
              <span>Filters {includeFilter ? "Included" : "Excluded"}</span>
            </label>
            <div className="flex flex-wrap justify-end gap-2">
              <Button
                variant="outline"
                onClick={handleClose}
                className="min-w-[110px] rounded-xl border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-600 dark:text-slate-400"
                style={{ fontFamily: FONT }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={isExportLoading || selectedColumns.length === 0}
                className="min-w-[130px] rounded-xl bg-[#22b573] font-semibold text-white shadow-md hover:bg-[#1ea567]"
                style={{ fontFamily: FONT }}
              >
                {isExportLoading ? <AppLoader size="md" variant="inverse" /> : "Download"}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ExportWebinarAttendeesModal;
