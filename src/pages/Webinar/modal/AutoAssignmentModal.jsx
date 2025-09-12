import { useMemo, useState, useEffect } from "react";
import tagsService from "../../../services/tagsService";
import useRoles from "../../../hooks/useRoles";

const CheckIcon = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 20 20"
    fill="currentColor"
    aria-hidden="true"
    {...props}
  >
    <path
      fillRule="evenodd"
      d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.052-.143z"
      clipRule="evenodd"
    />
  </svg>
);

const EmployeeListSkeleton = () => (
  <div className="space-y-3" aria-label="Loading employees...">
    {[...Array(4)].map((_, i) => (
      <div key={i} className="flex items-center space-x-3 p-2">
        <div className="w-5 h-5 bg-slate-200 rounded-sm animate-pulse"></div>
        <div className="w-4/5 h-5 bg-slate-200 rounded-md animate-pulse"></div>
      </div>
    ))}
  </div>
);

const AutoAssignmentModal = ({
  webinarId,
  onClose,
  isOpen,
  webinarData, // This prop is assumed to be null/undefined when data is loading
  refetchWebinarData,
}) => {
  const roles = useRoles();

  // State for form controls
  const [autoAssignEnabled, setAutoAssignEnabled] = useState(true);
  const [blacklistedEmployeeIds, setBlacklistedEmployeeIds] = useState([]);
  const [isSaving, setIsSaving] = useState(false); // New state to manage saving process

  // Effect to synchronize internal state with webinarData prop.
  // This ensures that when the modal opens or webinarData updates,
  // the internal form controls reflect the latest configuration.
  useEffect(() => {
    if (webinarData) {
      // Auto-assignment is enabled if 'autoAssignmentDisabled' is explicitly false or not present.
      // If autoAssignmentDisabled is true, then autoAssignEnabled should be false.
      setAutoAssignEnabled(!webinarData.autoAssignmentDisabled);
      // Ensure excludedEmployees is an array, default to empty if null/undefined.
      setBlacklistedEmployeeIds(webinarData.excludedEmployees || []);
    } else {
      // If webinarData is not yet loaded, set to a default initial state (e.g., enabled, no blacklisted employees)
      // or clear previous settings if the modal is being reused for a different webinar.
      setAutoAssignEnabled(true);
      setBlacklistedEmployeeIds([]);
    }
  }, [webinarData, isOpen]); // Added isOpen to re-sync when modal opens (if webinarData might not change reference but internal content does)

  // Memoized list of employees eligible for auto-assignment based on their role
  const assignedEmployees = useMemo(() => {
    if (!webinarData?.assignedEmployees) {
      return []; // Return empty array if no assigned employees data is available (e.g., still loading)
    }

    // Filter employees to include only those with the "EMPLOYEE REMINDER" role
    return webinarData.assignedEmployees.filter((emp) => {
      // Safely access emp.role and get its name, then compare
      return emp?.role && roles.getRoleNameById(emp.role) === "EMPLOYEE REMINDER";
    });
  }, [webinarData, roles]); // Re-calculate only when webinarData or roles change

  // Determine if webinar data is currently loading from the parent component
  const isLoadingWebinarData = !webinarData;

  const handleClose = () => {
    if (onClose) {
      onClose();
    }
  };

  const handleSave = async () => {
    setIsSaving(true); // Indicate that saving process has started
    try {
      console.log("Saving Settings:", {
        webinarId,
        autoAssignEnabled,
        blacklistedEmployeeIds,
      });

      // Call the service to update webinar settings
      // Note: API expects `autoAssignmentDisabled`, which is the inverse of `autoAssignEnabled`
      await tagsService.updateWebinarSetting({
        webinarId: webinarId,
        autoAssignmentDisabled: !autoAssignEnabled, // Invert the boolean for API payload
        excludedEmployees: blacklistedEmployeeIds,
      });

      // If a refetch function is provided, call it to update the parent component's data
      if (refetchWebinarData) {
        await refetchWebinarData();
      }

      handleClose(); // Close the modal upon successful save
    } catch (error) {
      console.error("Failed to save auto-assignment settings:", error);
      // Optionally, implement user-facing error notification here (e.g., a toast message)
    } finally {
      setIsSaving(false); // Reset saving state regardless of success or failure
    }
  };

  const toggleEmployee = (employeeId) => {
    setBlacklistedEmployeeIds((prev) =>
      prev.includes(employeeId)
        ? prev.filter((id) => id !== employeeId) // Remove employee if already blacklisted
        : [...prev, employeeId] // Add employee if not blacklisted
    );
  };

  if (!isOpen) return null; // Render nothing if the modal is not open

  return (
    <div className="fixed inset-0 bg-slate-900 bg-opacity-50 flex items-center justify-center z-50 p-4 transition-opacity duration-300">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-lg transform transition-all">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="text-3xl font-bold text-slate-800">
              Auto Assignment
            </h2>
            <p className="text-slate-500 mt-1">
              Configure settings for automatic task distribution.
            </p>
          </div>
          <button
            onClick={handleClose}
            className="text-slate-400 hover:text-slate-600 transition-colors"
            aria-label="Close settings"
            type="button" // Explicitly define type to prevent accidental form submission
            disabled={isSaving} // Disable close button while saving
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <div className="border-b border-slate-200 pb-6 mb-6">
          <label className="flex items-center justify-between cursor-pointer">
            <div>
              <span className="text-lg font-medium text-slate-700">
                Enable Auto Assignment
              </span>
              <p className="text-sm text-slate-500">
                New tasks will be assigned to available employees.
              </p>
            </div>
            <button
              className={`relative inline-flex items-center h-7 w-14 rounded-full transition-colors duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-indigo-500 ${
                autoAssignEnabled ? "bg-indigo-600" : "bg-slate-300"
              }`}
              onClick={() => setAutoAssignEnabled(!autoAssignEnabled)}
              type="button" // Important: ensures button doesn't submit a form if wrapped in one
              disabled={isSaving} // Disable the toggle during saving
            >
              <span
                className={`inline-block w-5 h-5 bg-white rounded-full shadow-md transform transition-transform duration-300 ${
                  autoAssignEnabled ? "translate-x-8" : "translate-x-1"
                }`}
              ></span>
            </button>
          </label>
        </div>

        <div className="mb-8">
          <label className="block text-lg font-medium text-slate-700 mb-3">
            Exclude Employees
          </label>
          <p className="text-sm text-slate-500 mb-4">
            Selected employees will not receive automatically assigned tasks.
          </p>
          <div className="min-h-[150px] max-h-56 overflow-y-auto border border-slate-200 bg-slate-50 p-3 rounded-lg">
            {isLoadingWebinarData ? ( // Show skeleton while webinar data is loading
              <EmployeeListSkeleton />
            ) : assignedEmployees.length > 0 ? (
              assignedEmployees.map((emp) => (
                <label
                  key={emp._id}
                  className="flex items-center space-x-3 p-2 rounded-md cursor-pointer transition-colors hover:bg-slate-200/70"
                >
                  <input
                    type="checkbox"
                    checked={blacklistedEmployeeIds.includes(emp._id)}
                    onChange={() => toggleEmployee(emp._id)}
                    className="absolute h-0 w-0 appearance-none peer"
                    disabled={isSaving} // Disable checkboxes during saving
                  />
                  <div className="w-5 h-5 border-2 border-slate-400 rounded-sm flex-shrink-0 flex items-center justify-center transition-all peer-checked:bg-indigo-600 peer-checked:border-indigo-600">
                    <CheckIcon className="w-4 h-4 text-white opacity-0 transition-opacity peer-checked:opacity-100" />
                  </div>
                  <span className="text-slate-700 transition-colors peer-checked:text-slate-400 peer-checked:line-through">
                    {emp.userName}
                  </span>
                </label>
              ))
            ) : (
              // Display a message if no eligible employees are found after loading
              <div className="flex items-center justify-center h-full text-slate-500 p-8">
                No employees are assigned to this webinar.
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end space-x-4">
          <button
            className="px-6 py-2.5 rounded-lg font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-slate-400"
            onClick={handleClose}
            type="button"
            disabled={isSaving} // Disable cancel button while saving
          >
            Cancel
          </button>
          <button
            className="px-6 py-2.5 rounded-lg font-semibold text-white bg-indigo-600 hover:bg-indigo-700 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-indigo-500"
            onClick={handleSave}
            type="button"
            disabled={isSaving} // Disable save button while saving
          >
            {isSaving ? "Saving..." : "Save Settings"} {/* Change button text based on saving state */}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AutoAssignmentModal;