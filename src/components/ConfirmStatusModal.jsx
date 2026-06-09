import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Play, Pause } from 'lucide-react';
import { Button } from './ui/button';
import { useTheme } from '../contexts/ThemeContext';

export default function ConfirmStatusModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Confirm",
  confirmVariant = "purple", // "purple" | "rose" | "emerald"
  itemName,
}) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  if (!isOpen) return null;

  const shellBorder = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)";
  const shellBg = isDark ? "#1e293b" : "#ffffff";
  const titleColor = isDark ? "#f8fafc" : "#0f172a";
  const descColor = isDark ? "#94a3b8" : "#475569";
  const footerBg = isDark ? "#0f172a" : "#F9FAFB";

  const getVariantStyles = () => {
    switch (confirmVariant) {
      case "rose":
        return {
          icon: <Pause className="w-5 h-5 text-rose-500 animate-pulse" />,
          iconBg: "bg-rose-500/10 border-rose-500/20 text-rose-500",
          btnClass: "bg-rose-600 hover:bg-rose-700 text-white shadow-lg shadow-rose-600/20 hover:scale-105",
        };
      case "emerald":
        return {
          icon: <Play className="w-5 h-5 text-emerald-500 animate-pulse" />,
          iconBg: "bg-emerald-500/10 border-emerald-500/20 text-emerald-500",
          btnClass: "bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-600/20 hover:scale-105",
        };
      default:
        return {
          icon: <Play className="w-5 h-5 text-purple-500 animate-pulse" />,
          iconBg: "bg-purple-500/10 border-purple-500/20 text-purple-500",
          btnClass: "bg-purple-600 hover:bg-purple-700 text-white shadow-lg shadow-purple-600/20 hover:scale-105",
        };
    }
  };

  const { icon, iconBg, btnClass } = getVariantStyles();

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
        {/* Backdrop overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm"
        />

        {/* Dialog container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="relative w-full max-w-[480px] overflow-hidden rounded-2xl shadow-2xl border z-10"
          style={{ backgroundColor: shellBg, borderColor: shellBorder }}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b flex-shrink-0" style={{ borderColor: shellBorder }}>
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-xl border ${iconBg}`}>
                {icon}
              </div>
              <h3 className="text-base font-bold" style={{ color: titleColor }}>
                {title}
              </h3>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-4">
            <div className="space-y-2">
              <p className="text-sm font-medium leading-relaxed" style={{ color: descColor }}>
                {message}
              </p>
              {itemName && (
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 text-center">
                  <span className="text-sm font-bold text-slate-800 dark:text-slate-200">
                    "{itemName}"
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 border-t flex-shrink-0 flex gap-3" style={{ backgroundColor: footerBg, borderColor: shellBorder }}>
            <Button
              onClick={onClose}
              variant="ghost"
              className="flex-1 rounded-xl h-11 border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900"
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                onConfirm();
                onClose();
              }}
              className={`flex-1 rounded-xl h-11 font-bold transition-all duration-200 ${btnClass}`}
            >
              {confirmText}
            </Button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
