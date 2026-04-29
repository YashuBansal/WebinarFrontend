import React, { useState, useMemo } from "react";
import { useProductsForAdmin, useBulkCreateEnrollments } from "../../hooks/useEnrollments";
import AppLoader from "../AppLoader";
import { X, GraduationCap, AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Dialog, DialogContent } from "../ui/dialog";
import { useTheme } from "../../contexts/ThemeContext";
import { cn } from "../../lib/utils";

const FONT = "Inter, sans-serif";

const BULK_ENROLL_MODAL_NAME = "BulkEnrollmentModal";

const generateConfirmationCode = () =>
  String(Math.floor(100000 + Math.random() * 900000));

const BulkEnrollmentModal = ({
  onClose,
  webinarId,
  isAttended,
  selectedRows = [],
  total = 0,
  filters = {},
  validCall,
  assignmentType,
  onSuccess,
}) => {
  const { data: productDropdownData = [], isLoading: productsLoading } =
    useProductsForAdmin();
  const { mutateAsync, isPending } = useBulkCreateEnrollments(onSuccess);
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const [selectedProductId, setSelectedProductId] = useState("");
  const [confirmationCode, setConfirmationCode] = useState(() => generateConfirmationCode());
  const [confirmationInput, setConfirmationInput] = useState("");

  const scope = useMemo(
    () => (selectedRows?.length > 0 ? "selected" : "filtered"),
    [selectedRows]
  );
  const attendeeCount = useMemo(
    () => (selectedRows?.length > 0 ? selectedRows.length : total),
    [selectedRows, total]
  );

  const canSubmit =
    selectedProductId &&
    confirmationInput.trim() === confirmationCode &&
    attendeeCount > 0 &&
    !isPending;

  const handleSubmit = async () => {
    if (!canSubmit) return;

    const payload = {
      webinarId,
      productId: selectedProductId,
      scope,
      isAttended: !!isAttended,
      confirmationCode,
    };

    if (scope === "selected" && selectedRows?.length > 0) {
      const attendeeIds = selectedRows
        .map((r) => (r && typeof r === "object" ? r._id : r))
        .filter((id) => typeof id === "string" && id);

      if (!attendeeIds.length) {
        payload.scope = "filtered";
        payload.filters = filters;
        payload.validCall = validCall;
        payload.assignmentType = assignmentType;
      } else {
        payload.attendeeIds = attendeeIds;
      }
    } else {
      payload.filters = filters;
      payload.validCall = validCall;
      payload.assignmentType = assignmentType;
    }

    try {
      await mutateAsync(payload);
      onClose();
    } catch {
    }
  };

  const handleCancel = () => {
    setSelectedProductId("");
    setConfirmationInput("");
    onClose();
  };

  const regenerateCode = () => {
    setConfirmationCode(generateConfirmationCode());
    setConfirmationInput("");
  };

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
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b flex-shrink-0" style={{ borderColor: shellBorder }}>
            <h3 className="text-lg font-bold flex items-center gap-2" style={{ fontFamily: FONT, color: titleColor }}>
              <GraduationCap className="w-5 h-5 text-blue-500 shrink-0" />
              Bulk Enrollment
            </h3>
            <button type="button" onClick={handleCancel} className="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/10">
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6 overflow-y-auto custom-scrollbar max-h-[60vh]">
            {/* Info Card */}
            <div className="p-4 rounded-xl bg-blue-50/50 dark:bg-blue-500/5 border border-blue-100 dark:border-blue-500/20">
              <div className="flex gap-3">
                <AlertCircle className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
                <p className="text-sm text-blue-800 dark:text-blue-200 leading-relaxed">
                  You are about to enroll <span className="font-bold">{attendeeCount}</span> attendees into a product.
                  {scope === "selected" ? " Only selected rows will be processed." : " All attendees matching current filters will be processed."}
                </p>
              </div>
            </div>

            {/* Product Selection */}
            <div>
              <span style={labelStyle}>Select Product</span>
              <select
                value={selectedProductId}
                onChange={(e) => setSelectedProductId(e.target.value)}
                className="w-full h-11 px-4 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 outline-none transition-all cursor-pointer"
                style={inputStyle}
              >
                <option value="">
                  {productsLoading ? "Loading products..." : "Choose a product..."}
                </option>
                {!productsLoading &&
                  productDropdownData?.map((product) => (
                    <option key={product._id} value={product._id}>
                      {product?.name} | Level: {product?.level} | Price: {product?.price}
                    </option>
                  ))}
              </select>
            </div>

            {/* Confirmation Section */}
            <div className="space-y-4">
              <div className="flex flex-col items-center gap-2 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-dashed border-slate-200 dark:border-slate-700">
                <span style={labelStyle} className="mb-0">Confirmation Code</span>
                <div className="flex items-center gap-4">
                  <span className="text-3xl font-black tracking-[0.4em] text-slate-800 dark:text-slate-100 select-none">
                    {confirmationCode}
                  </span>
                  <button
                    type="button"
                    onClick={regenerateCode}
                    className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors text-slate-400"
                    title="Regenerate code"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div>
                <Input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="Enter 6-digit code to confirm"
                  value={confirmationInput}
                  onChange={(e) => setConfirmationInput(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  className="h-11 text-center text-xl font-mono tracking-widest rounded-xl"
                  style={inputStyle}
                />
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 border-t flex-shrink-0" style={{ backgroundColor: footerBg, borderColor: shellBorder }}>
            <div className="flex gap-3">
              <Button onClick={handleCancel} style={cancelBtn} className="flex-1 rounded-xl h-11">
                Cancel
              </Button>
              <Button
                disabled={!canSubmit}
                onClick={handleSubmit}
                style={canSubmit ? applyBtn : {}}
                className={cn(
                  "flex-1 rounded-xl h-11 font-bold transition-all hover:scale-105",
                  !canSubmit && "bg-slate-200 dark:bg-slate-800 text-slate-400 opacity-50 cursor-not-allowed"
                )}
              >
                {isPending ? <AppLoader size="sm" variant="inverse" /> : "Create Enrollments"}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BulkEnrollmentModal;
export { generateConfirmationCode, BULK_ENROLL_MODAL_NAME };
