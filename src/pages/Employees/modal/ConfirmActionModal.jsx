import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { closeModal } from "../../../features/slices/modalSlice";
import { updateEmployeeStatus } from "../../../features/actions/employee";
import useAddUserActivity from "../../../hooks/useAddUserActivity";
import useUserSubscription from "../../../hooks/useUserSubscription";
import { useTheme } from "../../../contexts/ThemeContext";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";

const FONT = "Inter, sans-serif";

export default function ConfirmActionModal({ modalName }) {
  const logUserActivity = useAddUserActivity();
  const dispatch = useDispatch();
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const { data: subscription } = useUserSubscription();
  const { modals, modalData } = useSelector((state) => state.modals);
  const open = modals[modalName] ? true : false;

  const { isSuccess } = useSelector((state) => state.employee);
  const [inputValue, setInputValue] = useState("");
  const [isInputValid, setIsInputValid] = useState(true);

  const handleInputChange = (e) => {
    const v = e.target.value;
    setInputValue(v);
    setIsInputValid(v === "" || v === modalData?.email);
  };

  const handleConfirmAction = () => {
    if (inputValue === "") {
      setIsInputValid(false);
      return;
    }
    if (inputValue !== modalData?.email) {
      setIsInputValid(false);
      return;
    }
    dispatch(
      updateEmployeeStatus({
        id: modalData?._id,
        isActive: !modalData?.isActive,
      })
    );

    logUserActivity({
      action: !modalData?.isActive ? "activate" : "deactivate",
      details: `User ${
        !modalData?.isActive ? "activated" : "deactivated"
      } the Employee with Email: ${modalData?.email}`,
    });
  };

  const handleClose = () => {
    dispatch(closeModal(modalName));
    setInputValue("");
    setIsInputValid(true);
  };

  useEffect(() => {
    if (!isSuccess) return;
    dispatch(closeModal(modalName));
    setInputValue("");
    setIsInputValid(true);
  }, [isSuccess, dispatch, modalName]);

  useEffect(() => {
    if (!open) {
      setInputValue("");
      setIsInputValid(true);
    }
  }, [open]);

  const shellBorder = isDark ? "#334155" : "#e5e7eb";
  const titleColor = isDark ? "#f8fafc" : "#0f172a";
  const muted = isDark ? "#94a3b8" : "#64748b";

  const portalTarget =
    typeof document !== "undefined" ? document.body : null;
  if (!portalTarget) return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          key="confirm-employee-status"
          className="fixed inset-0 z-[220] flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 16 }}
            transition={{ type: "spring", duration: 0.4, bounce: 0 }}
            className="relative w-full max-w-md rounded-2xl shadow-2xl overflow-hidden z-10"
            style={{
              backgroundColor: isDark ? "#1e293b" : "#ffffff",
              border: `1px solid ${shellBorder}`,
            }}
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div
              className="flex items-center justify-between p-4 border-b"
              style={{ borderColor: shellBorder }}
            >
              <h3
                className="text-lg font-bold"
                style={{ fontFamily: FONT, color: titleColor }}
              >
                {!modalData?.isActive ? "Activate" : "Deactivate"} Account
              </h3>
              <button
                type="button"
                onClick={handleClose}
                className="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/10"
                aria-label="Close"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <p className="text-xs text-center" style={{ color: muted }}>
                You can only activate/deactivate an Employee Account{" "}
                {subscription?.toggleLimit || 0} times.
              </p>
              <p
                className="text-sm text-center"
                style={{ color: isDark ? "#e2e8f0" : "#334155" }}
              >
                Confirm {!modalData?.isActive ? "activation" : "deactivation"}{" "}
                by entering Email:{" "}
                <strong style={{ color: titleColor }}>{modalData?.email}</strong>
              </p>
              <div>
                <Input
                  type="email"
                  value={inputValue}
                  onChange={handleInputChange}
                  placeholder="Enter email to confirm"
                  className="focus:ring-[#22B573]/40"
                  style={{
                    fontFamily: FONT,
                    backgroundColor: isDark ? "#0f172a" : "#ffffff",
                    border: `1px solid ${
                      !isInputValid && inputValue !== ""
                        ? "#ef4444"
                        : isDark
                          ? "#334155"
                          : "#e2e8f0"
                    }`,
                    color: isDark ? "#f8fafc" : "#0f172a",
                  }}
                />
                {!isInputValid && (
                  <p className="text-xs text-red-500 mt-1.5">
                    The email entered does not match.
                  </p>
                )}
              </div>
              <div className="flex flex-col sm:flex-row gap-2 pt-2">
                <Button
                  type="button"
                  className="flex-1 rounded-xl font-semibold py-2.5"
                  style={{
                    backgroundColor: "#22B573",
                    color: "#ffffff",
                    border: "none",
                    boxShadow: "0 4px 10px rgba(34, 181, 115, 0.25)",
                  }}
                  onClick={handleConfirmAction}
                  disabled={!inputValue}
                >
                  {!modalData?.isActive ? "Activate" : "Deactivate"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1 rounded-xl py-2.5"
                  style={{
                    backgroundColor: isDark ? "#1e293b" : "white",
                    color: isDark ? "#f8fafc" : "#071028",
                    border: `1px solid ${isDark ? "#334155" : "#e2e8f0"}`,
                  }}
                  onClick={handleClose}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    portalTarget
  );
}
