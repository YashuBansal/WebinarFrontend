import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import useRoles from "../../../hooks/useRoles";
import { addAssign } from "../../../features/actions/assign";
import useAddUserActivity from "../../../hooks/useAddUserActivity";
import { getAssignedEmployees } from "../../../features/actions/webinarContact";
import AssignedEmployeeTable from "../../../components/Webinar/AssignedEmployeeTable";
import { clearAssignedEmployees } from "../../../features/slices/webinarContact";
import AppLoader from "../../../components/AppLoader";
import { errorToast } from "../../../utils/extra";
import { Dialog, DialogContent } from "../../../components/ui/dialog";
import { useTheme } from "../../../contexts/ThemeContext";
import { X, UserPlus, AlertCircle, Shuffle } from "lucide-react";
import { Button } from "../../../components/ui/button";
import { cn } from "../../../lib/utils";

const FONT = "Inter, sans-serif";

function EmployeeAssignModal({
  selectedRows,
  webinarId,
  tabValue,
  setAssignModal,
}) {
  const dispatch = useDispatch();
  const roles = useRoles();
  const logUserActivity = useAddUserActivity();
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const { isSuccess, isLoading: isAssignLoading } = useSelector(
    (state) => state.assign
  );
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [forceAssign, setForceAssign] = useState(false);
  const [randomAssign, setRandomAssign] = useState(false);
  const { assignedEmployees, isLoading: fetchLoading } = useSelector(
    (state) => state.webinarContact
  );

  const selectedType =
    tabValue === "preWebinar" ? "EMPLOYEE REMINDER" : "EMPLOYEE SALES";

  const options = (assignedEmployees || [])
    .filter((item) => roles.getRoleNameById(item?.role) === selectedType)
    .map((item) => ({
      value: item?._id,
      label: item?.userName,
      contactCount: item?.dailyContactCount || 0,
      contactLimit: item?.dailyContactLimit || 0,
    }));

  const handleAssign = () => {
    if (selectedEmployee && !randomAssign) {
      const employee = options.find((item) => item.value === selectedEmployee);
      if (
        !forceAssign &&
        employee &&
        employee.contactLimit - employee.contactCount < selectedRows.length
      ) {
        if (employee.contactLimit - employee.contactCount < 0) {
          errorToast(`Assignment limit exceeded for this employee.`);
          return;
        }
        errorToast(
          `Cannot assign more than ${
            employee.contactLimit - employee.contactCount
          } attendees to this employee.`
        );
        return;
      }

      dispatch(
        addAssign({
          webinar: webinarId,
          user: selectedEmployee,
          attendees: selectedRows,
          recordType: tabValue,
          forceAssign: forceAssign,
        })
      );
      logUserActivity({
        action: "assign",
        details: `User manually assigned Attendees to : ${
          tabValue === "preWebinar" ? "REMINDER EMPLOYEE" : "SALES EMPLOYEE"
        }${forceAssign ? " (Force Assigned)" : ""}`,
      });
    } else if (randomAssign) {
      if (!forceAssign) {
        const totalAvailableSlots = options.reduce((acc, emp) => {
          const remaining = emp.contactLimit - emp.contactCount;
          return remaining > 0 ? acc + remaining : acc;
        }, 0);

        if (selectedRows.length > totalAvailableSlots) {
          errorToast(
            `Cannot randomly assign ${selectedRows.length} attendees. Only ${totalAvailableSlots} slots available across all employees.`
          );
          return;
        }
      }

      dispatch(
        addAssign({
          webinar: webinarId,
          attendees: selectedRows,
          recordType: tabValue,
          forceAssign: forceAssign,
        })
      );
      logUserActivity({
        action: "assign",
        details: `User manually assigned Attendees to : ${
          tabValue === "preWebinar" ? "REMINDER EMPLOYEE" : "SALES EMPLOYEE"
        }${forceAssign ? " (Force Assigned)" : ""}`,
      });
    }
  };

  const onClose = () => {
    setAssignModal(false);
    setSelectedEmployee(null);
  };

  useEffect(() => {
    dispatch(getAssignedEmployees(webinarId));
    return () => {
      dispatch(clearAssignedEmployees());
    };
  }, [webinarId]);

  useEffect(() => {
    if (isAssignLoading) {
      setIsLoading(true);
    } else {
      setTimeout(() => {
        setIsLoading(false);
      }, 200);
    }
  }, [isAssignLoading]);

  useEffect(() => {
    if (isSuccess) {
      onClose();
    }
  }, [isSuccess]);

  const shellBorder = isDark ? "#334155" : "#e5e7eb";
  const titleColor = isDark ? "#f8fafc" : "#0f172a";
  const footerBg = isDark ? "rgba(15,23,42,0.85)" : "#F9FAFB";
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

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-[550px] p-0 overflow-hidden rounded-2xl shadow-2xl border" style={{ backgroundColor: isDark ? "#1e293b" : "#ffffff", borderColor: shellBorder }}>
        <div className="flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b flex-shrink-0" style={{ borderColor: shellBorder }}>
            <div className="flex items-center gap-3">
              <UserPlus className="w-5 h-5 text-blue-500 shrink-0" />
              <div>
                <h3 className="text-lg font-bold" style={{ fontFamily: FONT, color: titleColor }}>
                  Assign Employee
                </h3>
                <p className="text-[10px] text-slate-500">
                  Select an employee to handle <span className="font-bold text-blue-500">{selectedRows?.length || 0}</span> attendees
                </p>
              </div>
            </div>
            <button type="button" onClick={onClose} className="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/10">
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6 overflow-y-auto custom-scrollbar max-h-[60vh]">
            {fetchLoading ? (
              <div className="flex flex-col gap-3 justify-center items-center py-12">
                <AppLoader size="lg" variant="brand" />
                <p className="text-sm font-medium text-slate-500">Fetching Assigned Employees...</p>
              </div>
            ) : options.length === 0 ? (
              <div className="text-center py-12 px-6 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-dashed border-slate-200 dark:border-slate-800">
                <AlertCircle className="w-8 h-8 text-slate-400 mx-auto mb-3" />
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">No active employees found for this role.</p>
                <p className="text-xs text-slate-500 mt-1">Please assign employees to this webinar first.</p>
              </div>
            ) : (
              <>
                {/* Random Assign Toggle */}
                <div className="flex items-center justify-between p-4 rounded-xl border border-dashed border-slate-200 dark:border-slate-700">
                  <div className="flex gap-3">
                    <div className="p-2 bg-indigo-500/10 rounded-lg">
                      <Shuffle className="w-5 h-5 text-indigo-500" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-700 dark:text-slate-200">Random Assignment</p>
                      <p className="text-[10px] text-slate-500">Distribute attendees among all available employees</p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={randomAssign}
                      onChange={() => setRandomAssign((prev) => !prev)}
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-500"></div>
                  </label>
                </div>

                <AssignedEmployeeTable
                  options={options}
                  selectedEmployee={selectedEmployee}
                  setSelectedEmployee={setSelectedEmployee}
                  moveToPullbacks={randomAssign}
                  isLabel={true}
                  forceAssign={forceAssign}
                />

                {/* Force Assign Toggle */}
                <div className="flex items-center justify-between p-4 rounded-xl bg-orange-500/5 border border-orange-500/20">
                  <div className="flex gap-3">
                    <div className="p-2 bg-orange-500/10 rounded-lg">
                      <AlertCircle className="w-5 h-5 text-orange-500" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-700 dark:text-slate-200">Force Assign</p>
                      <p className="text-[10px] text-slate-500">Bypass employee daily limit restrictions</p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={forceAssign}
                      onChange={() => setForceAssign(!forceAssign)}
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500"></div>
                  </label>
                </div>
              </>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t flex-shrink-0" style={{ backgroundColor: footerBg, borderColor: shellBorder }}>
            <div className="flex gap-3">
              <Button onClick={onClose} style={cancelBtn} className="flex-1 rounded-xl h-11">
                Cancel
              </Button>
              <Button
                disabled={(!selectedEmployee && !randomAssign) || isLoading || isAssignLoading || fetchLoading}
                onClick={handleAssign}
                style={applyBtn}
                className="flex-1 rounded-xl h-11 font-bold transition-all hover:scale-105"
              >
                {isLoading ? <AppLoader size="sm" variant="inverse" /> : "Assign Now"}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default EmployeeAssignModal;
