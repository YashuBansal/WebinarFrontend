import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  changeAssignment,
  fetchPullbackRequestCounts,
  moveAttendeesToPullbacks,
} from "../../features/actions/reAssign";
import { resetReAssignSuccess } from "../../features/slices/reAssign.slice";
import AssignedEmployeeTable from "./AssignedEmployeeTable";
import { getAllEmployees } from "../../features/actions/employee";
import AppLoader from "../AppLoader";
import { toast } from "sonner";
import { clearEmployeeData } from "../../features/slices/employee";
import { Dialog, DialogContent } from "../ui/dialog";
import { useTheme } from "../../contexts/ThemeContext";
import { X, UserPlus, AlertCircle, MoveRight } from "lucide-react";
import { Button } from "../ui/button";
import { cn } from "../../lib/utils";

const FONT = "Inter, sans-serif";

const ReAssignmentModal = ({
  tabValue,
  webinarid,
  selectedRows,
  isPullbackVisible = false,
  isAttendee = false,
  setReAssignModal,
}) => {
  const dispatch = useDispatch();
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const [assignmentType, setAssignmentType] = useState("temporary");
  const [selectedEmployee, setSelectedEmployee] = useState("");
  const [forceAssign, setForceAssign] = useState(false);
  const [moveToPullbacks, setMoveToPullbacks] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const {
    reAssignData,
    isSuccess,
    isLoading: reassignLoading,
  } = useSelector((state) => state.reAssign);
  const { employeeData: assignedEmployees } = useSelector(
    (state) => state.employee
  );

  const selectedType =
    tabValue === "preWebinar" ? "EMPLOYEE_REMINDER" : "EMPLOYEE_SALES";

  const options = assignedEmployees
    .filter((item) => item?.role === selectedType)
    .map((item) => ({
      value: item?._id,
      label: item?.userName,
      contactCount: item?.dailyContactCount || 0,
      contactLimit: item?.dailyContactLimit || 0,
    }));

  const handleSubmit = () => {
    if (isAttendee && isPullbackVisible) {
      if (moveToPullbacks) {
        const payload = {
          recordType: tabValue,
          webinarId: webinarid,
          attendees: selectedRows,
        };
        dispatch(moveAttendeesToPullbacks(payload));
      } else {
        const employee = options.find(
          (item) => item.value === selectedEmployee
        );
        if (!employee) {
          toast.error("Please select an employee to assign.");
          return;
        }
        if (
          employee.contactLimit - employee.contactCount < selectedRows.length &&
          !forceAssign
        ) {
          toast.error(
            `Cannot assign more than ${
              employee.contactLimit - employee.contactCount
            } attendees to this employee.`
          );
          return;
        }
        const payload = {
          isTemp: assignmentType === "temporary" ? true : false,
          employeeId: selectedEmployee,
          webinarId: webinarid,
          recordType: tabValue,
          attendees: selectedRows,
          forceAssign: forceAssign,
        };
        dispatch(moveAttendeesToPullbacks(payload));
      }
    } else {
      const employee = options.find((item) => item.value === selectedEmployee);
      if (!employee) {
        toast.error("Please select an employee to assign.");
        return;
      }

      if (
        !forceAssign &&
        employee.contactLimit - employee.contactCount < selectedRows.length
      ) {
        toast.error(
          `Cannot assign more than ${
            employee.contactLimit - employee.contactCount
          } attendees to this employee.`
        );
        return;
      }

      const payload = {
        isTemp: assignmentType === "temporary" ? true : false,
        employeeId: selectedEmployee,
        recordType: tabValue,
        webinarId: webinarid,
        forceAssign: forceAssign,
        assignments: reAssignData
          .filter((item) => selectedRows.includes(item?._id))
          .map((item) => ({
            assignmentId: item?._id,
            attendeeId: item?.attendee,
          })),
      };
      dispatch(changeAssignment(payload));
    }
  };

  const handleCancel = () => {
    setReAssignModal(false);
    setAssignmentType("temporary");
    setSelectedEmployee("");
    setMoveToPullbacks(false);
  };

  useEffect(() => {
    dispatch(
      getAllEmployees({ page: 1, limit: 100, filters: { isActive: "active" } })
    );
    return () => { dispatch(clearEmployeeData()); };
  }, []);

  useEffect(() => {
    if (isSuccess) {
      handleCancel();
      dispatch(
        fetchPullbackRequestCounts({
          webinarId: webinarid,
          status: "active",
          recordType: tabValue,
        })
      );
    }
    return () => { if (isSuccess) { dispatch(resetReAssignSuccess()); } };
  }, [isSuccess]);

  useEffect(() => {
    if (reassignLoading) {
      setIsLoading(true);
    } else {
      setTimeout(() => {
        setIsLoading(false);
      }, 200);
    }
  }, [reassignLoading]);

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
    <Dialog open={true} onOpenChange={handleCancel}>
      <DialogContent className="max-w-[550px] p-0 overflow-hidden rounded-2xl shadow-2xl border" style={{ backgroundColor: isDark ? "#1e293b" : "#ffffff", borderColor: shellBorder }}>
        <div className="flex flex-col">
          <div className="flex items-center justify-between p-4 border-b flex-shrink-0" style={{ borderColor: shellBorder }}>
            <h3 className="text-lg font-bold flex items-center gap-2" style={{ fontFamily: FONT, color: titleColor }}>
              <UserPlus className="w-5 h-5 text-blue-500 shrink-0" />
              Re-Assign Attendees
            </h3>
            <button type="button" onClick={handleCancel} className="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/10">
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          <div className="p-6 space-y-6 overflow-y-auto custom-scrollbar max-h-[60vh]">
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
              <span className="text-xs font-medium text-slate-500">Selected Attendees:</span>
              <span className="text-sm font-bold text-blue-600 dark:text-blue-400 bg-blue-500/10 px-2 py-1 rounded-lg">
                {selectedRows?.length || 0}
              </span>
            </div>

            {isPullbackVisible && (
              <div className="flex items-center justify-between p-4 rounded-xl border border-dashed border-slate-200 dark:border-slate-700">
                <div className="flex gap-3">
                  <div className="p-2 bg-orange-500/10 rounded-lg">
                    <MoveRight className="w-5 h-5 text-orange-500" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-700 dark:text-slate-200">Move to Pullbacks</p>
                    <p className="text-[10px] text-slate-500">Release these attendees back into the pool</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={moveToPullbacks}
                    onChange={(e) => setMoveToPullbacks(e.target.checked)}
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500"></div>
                </label>
              </div>
            )}

            {!moveToPullbacks && (
              <>
                <div>
                  <span style={labelStyle}>Assignment Type</span>
                  <div className="grid grid-cols-2 gap-3">
                    {["temporary", "permanent"].map((type) => (
                      <button
                        key={type}
                        onClick={() => setAssignmentType(type)}
                        className={cn(
                          "flex items-center justify-center gap-2 p-3 rounded-xl border transition-all font-bold text-sm capitalize",
                          assignmentType === type 
                            ? "border-blue-500 bg-blue-500/5 text-blue-600 dark:text-blue-400" 
                            : "border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-50 dark:hover:bg-white/5"
                        )}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>

                <AssignedEmployeeTable
                  options={options}
                  selectedEmployee={selectedEmployee}
                  setSelectedEmployee={setSelectedEmployee}
                  moveToPullbacks={moveToPullbacks}
                  isLabel={true}
                  forceAssign={forceAssign}
                />

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

          <div className="p-4 border-t flex-shrink-0" style={{ backgroundColor: footerBg, borderColor: shellBorder }}>
            <div className="flex gap-3">
              <Button onClick={handleCancel} style={cancelBtn} className="flex-1 rounded-xl h-11">
                Cancel
              </Button>
              <Button
                disabled={(!selectedEmployee && !moveToPullbacks) || isLoading || reassignLoading}
                onClick={handleSubmit}
                style={applyBtn}
                className="flex-1 rounded-xl h-11 font-bold transition-all hover:scale-105"
              >
                {reassignLoading ? <AppLoader size="sm" variant="inverse" /> : "Confirm Assignment"}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ReAssignmentModal;
