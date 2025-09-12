import { useEffect, useState, useRef } from "react"; // Added useRef
import {
  Modal,
  Box,
  Button,
  Checkbox,
  FormControlLabel,
  TextField,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
  Typography,
  Grid, // Added for layout
  IconButton, // Potentially for a close button
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close"; // For a dedicated close button
import { useDispatch, useSelector } from "react-redux";
import { closeModal } from "../../../features/slices/modalSlice";
import { ClipLoader } from "react-spinners";
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
import DeleteIcon from "../../../components/SVGs/red-bin.svg";
import { exportGroupedAttendeesExcel } from "../../../features/actions/export-excel";
import { globalButton } from "../../../utils/style";

const tableName = "All Attendees Export";

const modalStyle = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: "90%",
  maxWidth: "900px",
  bgcolor: "background.paper",
  borderRadius: "8px",
  boxShadow: 24,
  p: { xs: 2, sm: 3 },
  maxHeight: "90vh",
  overflowY: "auto",
  display: "flex",
  flexDirection: "column",
};

const GroupedAttendeesExportModal = ({ modalName, filters, sort }) => {
  const dispatch = useDispatch();

  const { subscription } = useSelector((state) => state.auth);
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

  // Ref to track manual interaction with checkboxes to prevent useEffect override
  const manualInteractionRef = useRef(false);

  const handleCheckboxChange = (key) => {
    setSelectedColumns((prev) =>
      prev.includes(key) ? prev.filter((col) => col !== key) : [...prev, key]
    );
    setSelectedPresetId("");
    manualInteractionRef.current = true; // Indicate manual interaction
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

  // Effect to calculate available columns and manage selected columns based on config/presets
  useEffect(() => {
    const allColumns = [
      { header: "Email", key: "email", width: 20, type: "" },
      ...groupedAttendeeTableColumns.filter(
        (column) => column.header !== "Email"
      ),
      { header: "Phone", key: "phone", width: 20, type: "" },
    ];

    const newAvailableColumns = allColumns.filter(
      (col) => col.key in tableConfig && tableConfig[col.key].downloadable
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
      manualInteractionRef.current = false; // Reset flag and do not override manual selection
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
      } else {
        // Preset selected but not found or invalid, fall back to default for safety
        // Or clear selection if preset is invalid.
        // For now, if preset invalid/not found and `selectedPresetId` is somehow set,
        // it might be better to clear `selectedPresetId` and let it fall to default.
        // However, `handleApplyPreset` should ideally prevent setting invalid `selectedPresetId`.
        // If it resulted in no columns after filtering, setSelectedColumns would be empty.
      }
    } else {
      // No preset selected, or "Default" was chosen. Set to all available columns.
      setSelectedColumns(newAvailableColumns.map((col) => col.key));
    }
  }, [tableConfig, selectedPresetId, filterPresets, dispatch]); // dispatch might not be needed, but good practice if any redux actions were called inside

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
        // Attempt to select the newly created preset.
        // This requires filterPresets to be updated.
        // A more robust way might be for creattFilterPreset to return the new preset.
        // For now, find by name after refetch.
        // This selection logic is tricky due to async updates of filterPresets.
        // A slight delay or check might be needed, or rely on user to select it.
        // The original logic of setSelectedPresetId(newPresetName) is simpler for now.
        setSelectedPresetId(newPresetName); // This relies on handleApplyPreset or the main useEffect to pick it up
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
      filters: { selectedColumns }, // Save the order as well
    };
    dispatch(creattFilterPreset(payload));
  };

  const handleApplyPreset = (presetIdentifier) => {
    setSelectedPresetId(presetIdentifier);
    manualInteractionRef.current = false; // Applying a preset is not a manual column change

    if (!presetIdentifier) {
      // "Default Columns" selected from dropdown
      // The main useEffect will handle setting selectedColumns to all available columns
      // because selectedPresetId is now "", and manualInteractionRef is false.
      // Explicitly setting here is also fine:
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
    } else {
      // Preset not found or malformed. selectedColumns might remain as is or be cleared by main useEffect.
      // For safety, if a preset is chosen but invalid, perhaps default:
      // setSelectedColumns(columns.map((col) => col.key));
    }
  };

  const handleSelectAllToggle = () => {
    const allColumnKeys = columns.map((col) => col.key);
    const allCurrentlySelected =
      selectedColumns.length === allColumnKeys.length &&
      allColumnKeys.every((key) => selectedColumns.includes(key));

    if (allCurrentlySelected) {
      setSelectedColumns([]); // Deselect all
    } else {
      setSelectedColumns(allColumnKeys); // Select all
    }
    setSelectedPresetId(""); // Custom selection
    manualInteractionRef.current = true; // Indicate manual interaction
  };

  const areAllSelected =
    columns.length > 0 &&
    selectedColumns.length === columns.length &&
    columns.every((col) => selectedColumns.includes(col.key));

  return (
    <Modal open={true} onClose={handleClose} disablePortal>
      <Box sx={modalStyle}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Typography
            variant="h5"
            component="h2"
            sx={{ fontWeight: "semibold" }}
          >
            Export Excel Options
          </Typography>
          <IconButton onClick={handleClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>

        <Box sx={{ flexGrow: 1, overflowY: "auto", pr: 1, mt: 2 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={6}>
              <TextField
                label="Limit (Max 10,000)"
                variant="outlined"
                type="number"
                placeholder="All"
                fullWidth
                value={limit}
                onChange={(e) => {
                  if (e.target.value === "") setLimit("");
                  else {
                    const value = Number(e.target.value);
                    if (!isNaN(value) && value > 0 && value <= 10000)
                      setLimit(value);
                    else if (value > 10000) setLimit(10000);
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
                InputLabelProps={{ shrink: true }}
                margin="normal"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth margin="normal" variant="outlined">
                <InputLabel id="select-preset-label">Apply Preset</InputLabel>
                <Select
                  labelId="select-preset-label"
                  value={selectedPresetId}
                  label="Apply Preset"
                  onChange={(e) => handleApplyPreset(e.target.value)}
                >
                  <MenuItem value="">
                    <em>Default Columns</em>
                  </MenuItem>
                  {(filterPresets || []).map((preset) => (
                    <MenuItem key={preset._id} value={preset._id}>
                      <div className="flex justify-between items-center w-full">
                        <span>{preset.name}</span>
                        <button
                          disabled={isPresetLoading}
                          className="hover:bg-gray-300 rounded-full p-2"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            dispatch(deleteFilterPreset(preset._id));
                          }}
                        >
                          <img
                            src={DeleteIcon}
                            alt="Edit"
                            className="min-h-5 h-5 w-5 min-w-5"
                          />
                        </button>
                      </div>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>

          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              mt: 2,
              mb: 1,
            }}
          >
            <Typography variant="h6" sx={{ fontWeight: "semibold" }}>
              Select Columns for Export
            </Typography>
            {columns.length > 0 && (
              <Button
                variant="outlined"
                size="small"
                onClick={handleSelectAllToggle}
                disabled={columns.length === 0}
              >
                {areAllSelected ? "Deselect All" : "Select All"}
              </Button>
            )}
          </Box>

          <Box
            className="grid grid-cols-2 sm:grid-cols-3 gap-x-2 gap-y-0"
            sx={{
              border: 1,
              borderColor: "divider",
              borderRadius: 1,
              p: 1,
              maxHeight: { xs: "150px", sm: "250px" }, // Adjusted height a bit
              overflowY: "auto",
              mb: 2,
            }}
          >
            {columns.map((column) => (
              <FormControlLabel
                key={column.key}
                control={
                  <Checkbox
                    checked={selectedColumns.includes(column.key)}
                    onChange={() => handleCheckboxChange(column.key)}
                    size="small"
                  />
                }
                label={
                  <div className="flex gap-2 items-center">
                    <Typography variant="body2" sx={{ fontSize: "0.875rem" }}>
                      {column.header}
                    </Typography>
                    {selectedColumns.includes(column.key) ? (
                      <div className="text-xs text-white bg-indigo-600 h-6 w-6 flex justify-center items-center rounded-full">
                        {selectedColumns.indexOf(column.key) + 1}
                      </div>
                    ) : null}
                  </div>
                }
                sx={{ m: 0 }}
              />
            ))}
            {columns.length === 0 && (
              <Typography
                variant="body2"
                sx={{ p: 1, color: "text.secondary" }}
              >
                No columns available for selection.
              </Typography>
            )}
          </Box>

          <Typography
            variant="h6"
            sx={{ fontWeight: "semibold", mt: 2, mb: 1 }}
          >
            Save Current Selection as Preset
          </Typography>
          <Grid container spacing={2} alignItems="flex-end">
            <Grid item xs={12} sm={7} md={8}>
              <TextField
                label="New Preset Name"
                variant="outlined"
                fullWidth
                value={presetNameInput}
                onChange={(e) => setPresetNameInput(e.target.value)}
                InputLabelProps={{ shrink: true }}
                margin="normal"
              />
            </Grid>
            <Grid item xs={12} sm={5} md={4}>
              <Button
                variant="outlined"
                color="primary"
                onClick={handleSavePreset}
                disabled={
                  !presetNameInput.trim() ||
                  selectedColumns.length === 0 ||
                  (filterPresets || []).some(
                    (p) => p.name === presetNameInput.trim()
                  )
                }
                fullWidth
                sx={{ mb: { xs: 0, sm: "8px" } }}
              >
                Save Preset
              </Button>
            </Grid>
          </Grid>
          {(filterPresets || []).some(
            (p) => p.name === presetNameInput.trim()
          ) &&
            presetNameInput.trim() && (
              <Typography
                color="error"
                variant="caption"
                display="block"
                sx={{ mt: 0.5 }}
              >
                A preset with this name already exists.
              </Typography>
            )}
        </Box>

        <Box sx={{ mt: "auto", pt: 2, borderTop: 1, borderColor: "divider" }}>
          <Grid
            container
            spacing={2}
            justifyContent="space-between"
            alignItems="center"
          >
            <Grid item xs={12} sm="auto">
              <FormControlLabel
                control={
                  <Checkbox
                    checked={includeFilter}
                    onChange={() => setIncludeFilter((prev) => !prev)}
                  />
                }
                label={`Filters ${includeFilter ? "Included" : "Excluded"}`}
              />
            </Grid>
            <Grid item xs={12} sm="auto">
              <Box
                sx={{
                  display: "flex",
                  gap: 1,
                  justifyContent: { xs: "flex-end", sm: "flex-end" },
                  width: "100%", // Ensure buttons can take space on small screens
                }}
              >
                <Button
                  variant="outlined"
                  color="secondary"
                  onClick={handleClose}
                  sx={{ flexGrow: { xs: 1, sm: 0 } }} // Make cancel button grow on xs
                >
                  Cancel
                </Button>
                <button
                  className={globalButton}
                  onClick={handleSubmit}
                  disabled={isExportLoading || selectedColumns.length === 0} // Disable if no columns selected
                >
                  {isExportLoading ? (
                    <ClipLoader size={20} color="#fff" />
                  ) : (
                    "Download"
                  )}
                </button>
              </Box>
            </Grid>
          </Grid>
        </Box>
      </Box>
    </Modal>
  );
};

export default GroupedAttendeesExportModal;
