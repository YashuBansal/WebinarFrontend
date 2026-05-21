import React from "react";
import { useTheme } from "../../contexts/ThemeContext";
import { cn } from "../../lib/utils";
import { Circle, CheckCircle2 } from "lucide-react";

const AssignedEmployeeTable = ({
  options,
  selectedEmployee,
  setSelectedEmployee,
  moveToPullbacks,
  isLabel = true,
  forceAssign = false,
}) => {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const FONT = "Inter, sans-serif";
  const shellBorder = isDark ? "#334155" : "#e5e7eb";
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
    <div className="space-y-3">
      {isLabel && <span style={labelStyle}>Select Employee</span>}
      
      <div className="border rounded-2xl overflow-hidden shadow-sm transition-all" style={{ borderColor: shellBorder }}>
        <div className="overflow-x-auto custom-scrollbar max-h-[300px]">
          <table className="w-full text-left border-collapse">
            <thead className="sticky top-0 z-10 bg-slate-50 dark:bg-slate-900">
              <tr>
                <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b" style={{ borderColor: shellBorder }}>Select</th>
                <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b" style={{ borderColor: shellBorder }}>Employee Name</th>
                <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b" style={{ borderColor: shellBorder }}>Daily Count</th>
                <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b" style={{ borderColor: shellBorder }}>Daily Limit</th>
              </tr>
            </thead>
            <tbody className="divide-y" style={{ borderColor: shellBorder }}>
              {options.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-sm text-slate-500 italic">
                    No active employees found for this role.
                  </td>
                </tr>
              ) : (
                options.map((employee) => {
                  const isSelected = selectedEmployee === employee.value;
                  const isDisabled =
                    moveToPullbacks ||
                    (!forceAssign &&
                      employee?.contactCount >= employee?.contactLimit);

                  return (
                    <tr
                      key={employee?.value}
                      onClick={() => !isDisabled && setSelectedEmployee(employee?.value)}
                      className={cn(
                        "transition-colors group",
                        isDisabled ? "opacity-50 cursor-not-allowed bg-slate-50/50 dark:bg-slate-900/50" : "cursor-pointer hover:bg-slate-50 dark:hover:bg-white/5",
                        isSelected && !isDisabled && "bg-blue-500/5"
                      )}
                    >
                      <td className="px-4 py-3 text-center">
                        <div className="flex justify-center">
                          {isSelected ? (
                            <CheckCircle2 className="w-5 h-5 text-blue-500" />
                          ) : (
                            <Circle className={cn("w-5 h-5", isDisabled ? "text-slate-300 dark:text-slate-700" : "text-slate-400 group-hover:text-blue-400")} />
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={cn("text-sm font-bold", isSelected ? "text-blue-600 dark:text-blue-400" : "text-slate-700 dark:text-slate-200")}>
                          {employee?.label}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
                            {employee?.contactCount}
                          </span>
                          {!isDisabled && employee?.contactLimit - employee?.contactCount <= 5 && employee?.contactLimit - employee?.contactCount > 0 && (
                            <span className="px-1.5 py-0.5 rounded bg-orange-100 text-orange-600 text-[10px] font-bold">
                              Almost Full
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm font-mono text-slate-500">
                          {employee?.contactLimit}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AssignedEmployeeTable;
