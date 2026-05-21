import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "./button";
import { useTheme } from "../../contexts/ThemeContext";

export function DeleteConfirmationModal({ isOpen, onClose, onConfirm, itemName }) {
  const { theme } = useTheme();
  const [confirmationCode, setConfirmationCode] = useState("");
  const [userInput, setUserInput] = useState("");
  const [isShaking, setIsShaking] = useState(false);

  const generateCode = () => {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setConfirmationCode(code);
    setUserInput("");
  };

  useEffect(() => {
    if (isOpen) generateCode();
  }, [isOpen]);

  const handleConfirm = () => {
    if (userInput === confirmationCode) {
      onConfirm();
      onClose();
    } else {
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 500);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[600] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{
            opacity: 1,
            scale: 1,
            y: 0,
            x: isShaking ? [0, -10, 10, -10, 10, 0] : 0,
          }}
          transition={{ duration: isShaking ? 0.4 : 0.2 }}
          className="relative w-full max-w-md rounded-3xl shadow-2xl overflow-hidden"
          style={{
            backgroundColor: theme === "dark" ? "#0f172a" : "#ffffff",
            border: `1px solid ${theme === "dark" ? "#334155" : "#e5e7eb"}`,
          }}
        >
          <div
            className="flex items-center justify-between p-5 border-b"
            style={{ borderColor: theme === "dark" ? "#334155" : "#e5e7eb" }}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-500/20 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-red-500" />
              </div>
              <h3
                className="text-lg font-bold"
                style={{ color: theme === "dark" ? "#f8fafc" : "#1e293b" }}
              >
                Confirm Deletion
              </h3>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          <div className="p-6 space-y-6">
            <div className="text-center">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                You are about to delete{" "}
                <span className="font-bold text-red-500">&quot;{itemName}&quot;</span>. This
                action cannot be undone.
              </p>
            </div>

            <div className="space-y-4">
              <div className="flex flex-col items-center gap-3 p-4 rounded-2xl bg-gray-50 dark:bg-slate-800/50 border border-dashed border-gray-300 dark:border-slate-600">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400">
                  Enter this code to confirm
                </p>
                <div className="flex items-center gap-4">
                  <span className="text-3xl font-black tracking-[0.5em] text-blue-500 select-none">
                    {confirmationCode}
                  </span>
                  <button
                    type="button"
                    onClick={generateCode}
                    className="p-1.5 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-500/20 transition-colors"
                    title="Regenerate Code"
                  >
                    <RefreshCw className="w-4 h-4 text-blue-400" />
                  </button>
                </div>
              </div>

              <input
                type="text"
                maxLength={6}
                value={userInput}
                onChange={(e) => setUserInput(e.target.value.replace(/\D/g, ""))}
                placeholder="Type 6-digit code here"
                className="w-full p-4 rounded-2xl border-2 text-center text-xl font-bold tracking-widest focus:outline-none focus:ring-4 transition-all"
                style={{
                  backgroundColor: theme === "dark" ? "#1e293b" : "#ffffff",
                  borderColor:
                    userInput.length === 6
                      ? userInput === confirmationCode
                        ? "#22B573"
                        : "#EF4444"
                      : theme === "dark"
                        ? "#334155"
                        : "#e5e7eb",
                  color: theme === "dark" ? "#f8fafc" : "#1e293b",
                  boxShadow:
                    userInput.length === 6 && userInput === confirmationCode
                      ? "0 0 20px rgba(34, 181, 115, 0.2)"
                      : "none",
                }}
              />
            </div>
          </div>

          <div className="p-5 bg-gray-50 dark:bg-slate-800/30 flex gap-3">
            <Button onClick={onClose} className="flex-1 h-12 rounded-2xl font-bold" variant="outline">
              Cancel
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={userInput !== confirmationCode}
              className={`flex-1 h-12 rounded-2xl font-bold transition-all ${
                userInput === confirmationCode
                  ? "bg-red-500 hover:bg-red-600 shadow-lg shadow-red-500/30 text-white"
                  : "bg-gray-300 dark:bg-slate-700 opacity-50 cursor-not-allowed"
              }`}
            >
              Delete Permanently
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
