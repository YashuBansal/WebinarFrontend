import React, { useMemo, useState, useEffect, useCallback } from "react";
import { X, Settings2, ShieldCheck, UserMinus, Save, AlertCircle } from "lucide-react";
import tagsService from "../../../services/tagsService";
import useRoles from "../../../hooks/useRoles";
import { Button } from "../../../components/ui/button";
import { Dialog, DialogContent } from "../../../components/ui/dialog";
import { useTheme } from "../../../contexts/ThemeContext";
import { cn } from "../../../lib/utils";

const FONT = "Inter, sans-serif";

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
      <div key={i} className="flex items-center space-x-3 p-3 bg-white/5 rounded-xl animate-pulse">
        <div className="w-5 h-5 bg-slate-200 dark:bg-slate-700 rounded-lg"></div>
        <div className="w-1/2 h-5 bg-slate-200 dark:bg-slate-700 rounded-lg"></div>
      </div>
    ))}
  </div>
);

const AutoAssignmentModal = ({
  webinarId,
  onClose,
  isOpen,
  webinarData,
  refetchWebinarData,
}) => {
  const roles = useRoles();
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const [autoAssignEnabled, setAutoAssignEnabled] = useState(true);
  const [blacklistedEmployeeIds, setBlacklistedEmployeeIds] = useState([]);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (webinarData) {
      setAutoAssignEnabled(!webinarData.autoAssignmentDisabled);
      setBlacklistedEmployeeIds(webinarData.excludedEmployees || []);
    } else {
      setAutoAssignEnabled(true);
      setBlacklistedEmployeeIds([]);
    }
  }, [webinarData, isOpen]);

  const assignedEmployees = useMemo(() => {
    if (!webinarData?.assignedEmployees) return [];
    return webinarData.assignedEmployees.filter((emp) => {
      return emp?.role && roles.getRoleNameById(emp.role) === "EMPLOYEE REMINDER";
    });
  }, [webinarData, roles]);

  const isLoadingWebinarData = !webinarData;

  const handleSave = useCallback(async () => {
    setIsSaving(true);
    try {
      await tagsService.updateWebinarSetting({
        webinarId: webinarId,
        autoAssignmentDisabled: !autoAssignEnabled,
        excludedEmployees: blacklistedEmployeeIds,
      });
      if (refetchWebinarData) await refetchWebinarData();
      onClose();
    } catch (error) {
      console.error("Failed to save settings:", error);
    } finally {
      setIsSaving(false);
    }
  }, [webinarId, autoAssignEnabled, blacklistedEmployeeIds, refetchWebinarData, onClose]);

  const toggleEmployee = (employeeId) => {
    setBlacklistedEmployeeIds((prev) =>
      prev.includes(employeeId)
        ? prev.filter((id) => id !== employeeId)
        : [...prev, employeeId]
    );
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
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[550px] p-0 overflow-hidden rounded-2xl shadow-2xl border" style={{ backgroundColor: isDark ? "#1e293b" : "#ffffff", borderColor: shellBorder }}>
        <div className="flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b flex-shrink-0" style={{ borderColor: shellBorder }}>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-50 dark:bg-blue-500/10 rounded-xl">
                <Settings2 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h3 className="text-lg font-bold" style={{ fontFamily: FONT, color: titleColor }}>
                  Webinar Settings
                </h3>
                <p className="text-xs text-slate-500">Configure auto-assignment and exclusions</p>
              </div>
            </div>
            <button type="button" onClick={onClose} className="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/10">
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-8">
            {/* Auto Assign Toggle */}
            <div className="flex items-center justify-between p-4 rounded-2xl border bg-slate-50/50 dark:bg-slate-800/30" style={{ borderColor: shellBorder }}>
              <div className="flex gap-4 items-center">
                <div className={cn("p-2 rounded-lg", autoAssignEnabled ? "bg-green-500/10 text-green-500" : "bg-slate-500/10 text-slate-500")}>
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-slate-100">Auto Assignment</h4>
                  <p className="text-xs text-slate-500">Automatically distribute new leads</p>
                </div>
              </div>
              <button
                className={`relative inline-flex items-center h-7 w-14 rounded-full transition-all duration-300 ${
                  autoAssignEnabled ? "bg-[#22B573]" : "bg-slate-300 dark:bg-slate-700"
                }`}
                onClick={() => setAutoAssignEnabled(!autoAssignEnabled)}
                disabled={isSaving}
              >
                <span className={cn(
                  "inline-block w-5 h-5 bg-white rounded-full shadow-md transform transition-transform duration-300",
                  autoAssignEnabled ? "translate-x-8" : "translate-x-1"
                )} />
              </button>
            </div>

            {/* Exclusions */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <span style={labelStyle}>Excluded Employees</span>
                  <p className="text-xs text-slate-500">Selected staff will not receive auto-leads</p>
                </div>
                <UserMinus className="w-4 h-4 text-slate-400" />
              </div>

              <div className="min-h-[200px] max-h-[300px] overflow-y-auto custom-scrollbar border rounded-2xl p-2" style={{ backgroundColor: isDark ? "rgba(0,0,0,0.2)" : "rgba(0,0,0,0.02)", borderColor: shellBorder }}>
                {isLoadingWebinarData ? (
                  <EmployeeListSkeleton />
                ) : assignedEmployees.length > 0 ? (
                  <div className="grid grid-cols-1 gap-1">
                    {assignedEmployees.map((emp) => {
                      const isExcluded = blacklistedEmployeeIds.includes(emp._id);
                      return (
                        <button
                          key={emp._id}
                          onClick={() => toggleEmployee(emp._id)}
                          className={cn(
                            "flex items-center gap-3 p-3 rounded-xl transition-all text-left",
                            isExcluded ? "bg-red-500/5 text-red-500" : "hover:bg-white dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200"
                          )}
                          disabled={isSaving}
                        >
                          <div className={cn(
                            "w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all",
                            isExcluded ? "bg-red-500 border-red-500" : "border-slate-300 dark:border-slate-600"
                          )}>
                            {isExcluded && <CheckIcon className="w-3.5 h-3.5 text-white" />}
                          </div>
                          <span className={cn("text-sm font-medium", isExcluded && "line-through opacity-70")}>
                            {emp.userName}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-10 gap-3 text-slate-500">
                    <AlertCircle className="w-8 h-8 opacity-20" />
                    <p className="text-sm font-medium">No assigned employees found</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 border-t flex-shrink-0" style={{ backgroundColor: footerBg, borderColor: shellBorder }}>
            <div className="flex justify-end gap-2">
              <Button onClick={onClose} style={cancelBtn} className="rounded-xl h-10 px-6">
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={isSaving || isLoadingWebinarData}
                style={applyBtn}
                className="rounded-xl h-10 px-8 font-bold transition-all hover:scale-105"
              >
                {isSaving ? "Saving..." : "Save Settings"}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AutoAssignmentModal;