import React, { useState } from "react";
import Select from "react-select";
import { toast } from "sonner";
import { attendeeTableColumns } from "../../utils/columnData";
import { useSelector } from "react-redux";
import { X, ArrowLeftRight } from "lucide-react";
import { Button } from "../ui/button";
import { Dialog, DialogContent } from "../ui/dialog";
import { useTheme } from "../../contexts/ThemeContext";

const FONT = "Inter, sans-serif";

const SwapAttendeeFieldsModal = ({ onClose, onSubmit, attendees = [], total = 0 }) => {
  const { isSwapping } = useSelector((state) => state.attendee);
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const [field1, setField1] = useState(null);
  const [field2, setField2] = useState(null);

  const swappableKeys = ["phone", "firstName", "lastName", "gender", "location", "profession", "source"];

  const columnOptions = attendeeTableColumns
    .filter((col) => swappableKeys.includes(col.key))
    .map((col) => ({
      value: col.key,
      label: col.header,
    }));

  const handleSwap = () => {
    if (!field1 || !field2) {
      toast.error("Please select both fields to swap");
      return;
    }
    if (field1.value === field2.value) {
      toast.error("Fields must be different");
      return;
    }
    onSubmit(field1.value, field2.value, attendees);
    onClose();
  };

  const shellBorder = isDark ? "#334155" : "#e5e7eb";
  const titleColor = isDark ? "#f8fafc" : "#0f172a";
  const footerBg = isDark ? "rgba(15,23,42,0.85)" : "#F9FAFB";

  const rsStyles = {
    control: (base) => ({
      ...base,
      minHeight: 45,
      borderRadius: 12,
      fontSize: 14,
      backgroundColor: isDark ? "#0f172a" : "#ffffff",
      borderColor: isDark ? "#334155" : "#e2e8f0",
      boxShadow: "none",
    }),
    menuPortal: (base) => ({ ...base, zIndex: 10000 }),
    singleValue: (base) => ({
      ...base,
      color: isDark ? "#f8fafc" : "#0f172a",
    }),
    placeholder: (base) => ({
      ...base,
      color: isDark ? "#64748b" : "#94a3b8",
    }),
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
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-[500px] p-0 overflow-hidden rounded-2xl shadow-2xl border" style={{ backgroundColor: isDark ? "#1e293b" : "#ffffff", borderColor: shellBorder }}>
        <div className="flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b flex-shrink-0" style={{ borderColor: shellBorder }}>
            <h3 className="text-lg font-bold flex items-center gap-2" style={{ fontFamily: FONT, color: titleColor }}>
              <ArrowLeftRight className="w-5 h-5 text-blue-500 shrink-0" />
              Swap Fields
            </h3>
            <button type="button" onClick={onClose} className="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/10">
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* Content */}
          <div className="p-8">
            {/* Scope info */}
            <div
              className="mb-5 flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm"
              style={{
                backgroundColor: isDark ? "rgba(59,130,246,0.08)" : "rgba(59,130,246,0.06)",
                border: `1px solid ${isDark ? "rgba(59,130,246,0.2)" : "rgba(59,130,246,0.15)"}`,
                color: isDark ? "#93c5fd" : "#3b82f6",
              }}
            >
              <span className="font-bold">
                {attendees.length > 0
                  ? `${attendees.length} selected attendee${attendees.length > 1 ? "s" : ""}`
                  : `All ${total > 0 ? total : ""} attendees`}
              </span>
              <span className="opacity-70">will be affected</span>
            </div>
            <div className="space-y-6">
              <div>
                <span style={labelStyle}>Primary Field</span>
                <Select
                  options={columnOptions}
                  value={field1}
                  onChange={setField1}
                  styles={rsStyles}
                  placeholder="Select first field"
                  menuPortalTarget={document.body}
                />
              </div>

              <div className="flex justify-center">
                <div className="p-2 rounded-full bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20 text-blue-600">
                  <ArrowLeftRight className="w-5 h-5" />
                </div>
              </div>

              <div>
                <span style={labelStyle}>Replacement Field</span>
                <Select
                  options={columnOptions}
                  value={field2}
                  onChange={setField2}
                  styles={rsStyles}
                  placeholder="Select second field"
                  menuPortalTarget={document.body}
                />
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 border-t flex-shrink-0" style={{ backgroundColor: footerBg, borderColor: shellBorder }}>
            <div className="flex justify-end items-center gap-2">
              <Button onClick={onClose} style={cancelBtn} className="rounded-xl h-10">
                Cancel
              </Button>
              <Button
                onClick={handleSwap}
                disabled={isSwapping || !field1 || !field2}
                style={applyBtn}
                className="rounded-xl h-10 px-8 font-bold transition-all hover:scale-105"
              >
                {isSwapping ? "Swapping..." : "Swap Fields"}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SwapAttendeeFieldsModal;
