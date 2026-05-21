import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { X, FileText, FileJson, UploadCloud } from "lucide-react";
import { Button } from "../../../components/ui/button";
import { Dialog, DialogContent } from "../../../components/ui/dialog";
import { useTheme } from "../../../contexts/ThemeContext";
import UploadCsvModal from "./UploadCsvModal";
import UploadXslxModal from "./UploadXslxModal";

const FONT = "Inter, sans-serif";

const UpdateCsvXslxModal = ({ setModal, tabValue }) => {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const [showCsvModal, setShowCsvModal] = useState(false);
  const [showXslxModal, setShowXslxModal] = useState(false);

  const { isImporting } = useSelector((state) => state.attendee);

  useEffect(() => {
    if (isImporting) {
      setModal(false);
    }
  }, [isImporting, setModal]);

  const handleClose = () => setModal(false);

  const shellBorder = isDark ? "#334155" : "#e5e7eb";
  const titleColor = isDark ? "#f8fafc" : "#0f172a";
  const footerBg = isDark ? "rgba(15,23,42,0.85)" : "#F9FAFB";
  const cardBg = isDark ? "#0f172a" : "#ffffff";
  const cardBorder = isDark ? "#334155" : "#e2e8f0";

  const cancelBtn = {
    backgroundColor: "transparent",
    border: "none",
    color: isDark ? "#94a3b8" : "#64748b",
  };

  return (
    <>
      <Dialog open={true} onOpenChange={handleClose}>
        <DialogContent className="max-w-[450px] p-0 overflow-hidden rounded-2xl shadow-2xl border" style={{ backgroundColor: isDark ? "#1e293b" : "#ffffff", borderColor: shellBorder }}>
          <div className="flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b flex-shrink-0" style={{ borderColor: shellBorder }}>
              <h3 className="text-lg font-bold flex items-center gap-2" style={{ fontFamily: FONT, color: titleColor }}>
                <UploadCloud className="w-5 h-5 text-blue-500 shrink-0" />
                Import Attendees
              </h3>
              <button type="button" onClick={handleClose} className="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/10">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Content */}
            <div className="p-8">
              <div className="flex flex-col gap-4">
                <button
                  onClick={() => setShowXslxModal(true)}
                  className="flex items-center gap-4 p-5 rounded-2xl border transition-all text-left hover:scale-[1.02] active:scale-[0.98] group"
                  style={{ backgroundColor: cardBg, borderColor: cardBorder }}
                >
                  <div className="p-3 rounded-xl bg-green-50 dark:bg-green-500/10 text-green-600">
                    <FileText className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-slate-100">XLSX File</h4>
                    <p className="text-xs text-slate-500">Import from Microsoft Excel format</p>
                  </div>
                </button>

                <button
                  onClick={() => setShowCsvModal(true)}
                  className="flex items-center gap-4 p-5 rounded-2xl border transition-all text-left hover:scale-[1.02] active:scale-[0.98] group"
                  style={{ backgroundColor: cardBg, borderColor: cardBorder }}
                >
                  <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-500/10 text-blue-600">
                    <FileJson className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-slate-100">CSV File</h4>
                    <p className="text-xs text-slate-500">Import from Comma Separated Values</p>
                  </div>
                </button>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t flex-shrink-0 text-center" style={{ backgroundColor: footerBg, borderColor: shellBorder }}>
              <Button onClick={handleClose} style={cancelBtn} className="rounded-xl h-10 px-8 font-bold">
                Close
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {showCsvModal && (
        <UploadCsvModal tabValue={tabValue} setModal={setShowCsvModal} />
      )}
      {showXslxModal && (
        <UploadXslxModal tabValue={tabValue} setModal={setShowXslxModal} />
      )}
    </>
  );
};

export default UpdateCsvXslxModal;