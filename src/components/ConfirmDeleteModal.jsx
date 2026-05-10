import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { X, RefreshCw, Trash2 } from "lucide-react";
import AppLoader from "./AppLoader";
import { Button } from "./ui/button";
import { useTheme } from "../contexts/ThemeContext";
import { cn } from "../lib/utils";
import { Dialog, DialogContent } from "./ui/dialog";

const FONT = "Inter, sans-serif";

export default function ConfirmDeleteModal({
  setModal,
  triggerDelete,
  isLoading,
  title = "Please confirm deletion by entering the number below:",
  itemName,
}) {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const [confirmationCode, setConfirmationCode] = useState("");
  const [userInput, setUserInput] = useState("");
  const [isShaking, setIsShaking] = useState(false);

  const generateCode = () => {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setConfirmationCode(code);
    setUserInput("");
  };

  useEffect(() => {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setConfirmationCode(code);
    setUserInput("");
  }, []);

  const handleClose = () => {
    setModal(false);
  };

  const handleConfirm = () => {
    if (userInput === confirmationCode) {
      triggerDelete();
    } else {
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 500);
    }
  };

  const shellBorder = isDark ? "#334155" : "#e5e7eb";
  const titleColor = isDark ? "#f8fafc" : "#0f172a";
  const footerBg = isDark ? "#0f172a" : "#F9FAFB";

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

  const inputStyle = {
    fontFamily: FONT,
    backgroundColor: isDark ? "#0f172a" : "#ffffff",
    border: `1px solid ${isDark ? "#334155" : "#e2e8f0"}`,
    color: isDark ? "#f8fafc" : "#0f172a",
  };

  const cancelBtn = {
    backgroundColor: "transparent",
    border: "none",
    color: isDark ? "#94a3b8" : "#64748b",
  };

  return (
    <Dialog open={true} onOpenChange={handleClose}>
      <DialogContent className="max-w-[450px] p-0 overflow-hidden rounded-2xl shadow-2xl border" style={{ backgroundColor: isDark ? "#0f172a" : "#ffffff", borderColor: shellBorder }}>
        <div className="flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b flex-shrink-0" style={{ borderColor: shellBorder }}>
            <h3 className="text-lg font-bold flex items-center gap-2" style={{ fontFamily: FONT, color: titleColor }}>
              <Trash2 className="w-5 h-5 text-red-500 shrink-0" />
              Confirm Delete
            </h3>
            <button type="button" onClick={handleClose} className="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/10">
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            <div className="text-center">
              {itemName ? (
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400 leading-relaxed">
                  You are about to delete <span className="font-bold text-red-500 underline underline-offset-4 decoration-2">"{itemName}"</span>. This action is irreversible and will remove all associated data.
                </p>
              ) : (
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{title}</p>
              )}
            </div>

            <div className="space-y-4">
              <div className="flex flex-col items-center gap-2 p-5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-dashed border-slate-200 dark:border-slate-800">
                <span style={labelStyle} className="mb-0">Security Verification Code</span>
                <div className="flex items-center gap-4">
                  <span className="text-3xl font-black tracking-[0.5em] text-red-500 select-none">
                    {confirmationCode}
                  </span>
                  <button
                    type="button"
                    onClick={generateCode}
                    disabled={isLoading}
                    className="p-2 rounded-xl hover:bg-red-100 dark:hover:bg-red-500/10 transition-colors text-red-400 disabled:opacity-50"
                    title="Regenerate Code"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div>
                <motion.div
                  animate={{ x: isShaking ? [0, -10, 10, -10, 10, 0] : 0 }}
                  transition={{ duration: 0.4 }}
                >
                  <input
                    type="text"
                    maxLength={6}
                    value={userInput}
                    onChange={(e) => setUserInput(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    placeholder="••••••"
                    className={cn(
                      "w-full h-14 rounded-2xl border-2 text-center text-2xl font-black tracking-[0.3em] focus:outline-none transition-all duration-300",
                      userInput.length === 6
                        ? userInput === confirmationCode
                          ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-900 text-emerald-600 shadow-[0_0_20px_rgba(16,185,129,0.1)]"
                          : "border-red-500 bg-red-50 dark:bg-red-900 text-red-600"
                        : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                    )}
                    style={{
                      fontFamily: FONT,
                    }}
                  />
                </motion.div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 border-t flex-shrink-0" style={{ backgroundColor: footerBg, borderColor: shellBorder }}>
            <div className="flex gap-3">
              <Button onClick={handleClose} style={cancelBtn} className="flex-1 rounded-xl h-11" disabled={isLoading}>
                Keep It
              </Button>
              <Button
                onClick={handleConfirm}
                disabled={userInput !== confirmationCode || isLoading}
                className={cn(
                  "flex-1 rounded-xl h-11 font-bold transition-all duration-300",
                  userInput === confirmationCode && !isLoading
                    ? "bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-600/20 hover:scale-105"
                    : "bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed opacity-50"
                )}
              >
                {isLoading ? <AppLoader size="sm" variant="inverse" /> : "Confirm Delete"}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
