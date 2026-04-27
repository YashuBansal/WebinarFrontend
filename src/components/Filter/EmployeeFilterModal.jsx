import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { useForm, Controller } from "react-hook-form";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "sonner";
import { X, Filter, RotateCcw } from "lucide-react";
import { closeModal } from "../../features/slices/modalSlice";
import { filterTruthyValues, successToast } from "../../utils/extra";
import useRoles from "../../hooks/useRoles";
import useAddUserActivity from "../../hooks/useAddUserActivity";
import { useTheme } from "../../contexts/ThemeContext";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import EmployeeConditionalLogicPanel from "./EmployeeConditionalLogicPanel";

const FONT = "Inter, sans-serif";

const EmployeeFilterModal = ({
  modalName,
  setFilters,
  filters,
  setPage,
}) => {
  const roles = useRoles();
  const dispatch = useDispatch();
  const logUserActivity = useAddUserActivity();
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const { modals } = useSelector((state) => state.modals);
  const open = modals[modalName] ? true : false;

  const [filterTab, setFilterTab] = useState("simple");
  const [conditionalMeta, setConditionalMeta] = useState({
    hasOr: false,
    hadExcludeRange: false,
  });
  const conditionalSanitizeRef = useRef((d) => d);

  const { control, handleSubmit, reset, setValue, getValues } = useForm();

  const roleOptionValues = useMemo(
    () => [
      { value: roles.EMPLOYEE_REMINDER, label: "EMPLOYEE REMINDER" },
      { value: roles.EMPLOYEE_SALES, label: "EMPLOYEE SALES" },
    ],
    [roles]
  );

  const handleConditionalChainMeta = useCallback((meta) => {
    setConditionalMeta({
      hasOr: Boolean(meta?.hasOr),
      hadExcludeRange: Boolean(meta?.hadExcludeRange),
    });
  }, []);

  const onSubmit = (data) => {
    if (filterTab === "advanced") {
      if (conditionalMeta.hasOr) {
        toast.message(
          "OR between conditions is not supported by the API yet; filters were applied as AND."
        );
      }
      if (conditionalMeta.hadExcludeRange) {
        toast.message(
          "Exclude on numeric ranges was omitted from the request."
        );
      }
    }
    const payload =
      filterTab === "advanced"
        ? conditionalSanitizeRef.current(data)
        : { ...data };
    const filterData = filterTruthyValues(payload);
    if (Object.keys(filterData).length) {
      successToast("Filters Applied");
    }
    setFilters(filterData);
    if (typeof setPage === "function") setPage(1);
    logUserActivity({
      action: "filter",
      type: "to Table",
      detailItem: "Employees",
    });
    dispatch(closeModal(modalName));
  };

  const resetForm = () => {
    setFilterTab("simple");
    reset({
      email: "",
      userName: "",
      phone: "",
      isActive: "",
      role: "",
      "validCallTime.$gte": "",
      "validCallTime.$lte": "",
      "dailyContactLimit.$gte": "",
      "dailyContactLimit.$lte": "",
    });
  };

  const onClose = () => {
    dispatch(closeModal(modalName));
  };

  useEffect(() => {
    if (!open) {
      return;
    }
    setFilterTab("simple");
    reset({
      email: filters?.email ?? "",
      userName: filters?.userName ?? "",
      phone: filters?.phone ?? "",
      isActive: filters?.isActive ?? "",
      role: filters?.role ?? "",
      "validCallTime.$gte": filters?.["validCallTime.$gte"] ?? "",
      "validCallTime.$lte": filters?.["validCallTime.$lte"] ?? "",
      "dailyContactLimit.$gte": filters?.["dailyContactLimit.$gte"] ?? "",
      "dailyContactLimit.$lte": filters?.["dailyContactLimit.$lte"] ?? "",
    });
  }, [open, filters, reset]);

  const shellBorder = isDark ? "#334155" : "#e5e7eb";
  const titleColor = isDark ? "#f8fafc" : "#0f172a";
  const inactiveTabColor = isDark ? "#94a3b8" : "#64748b";
  const labelStyle = {
    fontFamily: FONT,
    fontSize: "10px",
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: "0.04em",
    color: isDark ? "#94a3b8" : "#64748b",
    marginBottom: "6px",
    display: "block",
  };
  const inputStyle = {
    fontFamily: FONT,
    backgroundColor: isDark ? "#0f172a" : "#ffffff",
    border: `1px solid ${isDark ? "#334155" : "#e2e8f0"}`,
    color: isDark ? "#f8fafc" : "#0f172a",
  };
  const ghostBtn = {
    backgroundColor: "transparent",
    border: `1px solid ${isDark ? "#475569" : "#cbd5e1"}`,
    color: isDark ? "#cbd5e1" : "#475569",
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

  const portalTarget =
    typeof document !== "undefined" ? document.body : null;
  if (!portalTarget) return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          key="employee-filter-modal"
          className="fixed inset-0 z-[200] flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", duration: 0.4, bounce: 0 }}
            className="relative w-full max-w-5xl max-h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden z-10"
            style={{
              backgroundColor: isDark ? "#1e293b" : "#ffffff",
              border: `1px solid ${shellBorder}`,
            }}
            onMouseDown={(e) => e.stopPropagation()}
          >
            <form
              onSubmit={handleSubmit(onSubmit)}
              className="flex flex-col min-h-0 max-h-[90vh]"
            >
              <div
                className="flex items-center justify-between p-4 border-b flex-shrink-0"
                style={{ borderColor: shellBorder }}
              >
                <h3
                  className="text-lg font-bold flex items-center gap-2"
                  style={{ fontFamily: FONT, color: titleColor }}
                >
                  <Filter className="w-5 h-5 text-gray-500 shrink-0" />
                  Employee Filters
                </h3>
                <button
                  type="button"
                  onClick={onClose}
                  className="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/10"
                  aria-label="Close"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              <div
                className="flex gap-2 px-4 pt-2 border-b flex-shrink-0"
                style={{ borderColor: shellBorder }}
              >
                <button
                  type="button"
                  onClick={() => setFilterTab("simple")}
                  className="px-4 py-2 transition-all duration-300 relative"
                  style={{
                    fontFamily: FONT,
                    fontSize: "13px",
                    fontWeight: 600,
                    color: filterTab === "simple" ? "#22B573" : inactiveTabColor,
                  }}
                >
                  Simple Filters
                  {filterTab === "simple" && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#22B573] rounded-t-full" />
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setFilterTab("advanced")}
                  className="px-4 py-2 transition-all duration-300 relative"
                  style={{
                    fontFamily: FONT,
                    fontSize: "13px",
                    fontWeight: 600,
                    color:
                      filterTab === "advanced" ? "#22B573" : inactiveTabColor,
                  }}
                >
                  Conditional Logic
                  {filterTab === "advanced" && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#22B573] rounded-t-full" />
                  )}
                </button>
              </div>

              <div
                className="flex-1 min-h-0 overflow-y-auto p-4 space-y-4 custom-scrollbar"
                style={{ borderColor: shellBorder }}
              >
                {filterTab === "simple" ? (
                <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="emp-filter-email" style={labelStyle}>
                      Email
                    </label>
                    <Controller
                      name="email"
                      control={control}
                      defaultValue=""
                      render={({ field }) => (
                        <Input
                          id="emp-filter-email"
                          {...field}
                          value={field.value || ""}
                          placeholder="Email"
                          className="focus:ring-[#22B573]/40"
                          style={inputStyle}
                        />
                      )}
                    />
                  </div>
                  <div>
                    <label htmlFor="emp-filter-username" style={labelStyle}>
                      User Name
                    </label>
                    <Controller
                      name="userName"
                      control={control}
                      defaultValue=""
                      render={({ field }) => (
                        <Input
                          id="emp-filter-username"
                          {...field}
                          value={field.value || ""}
                          placeholder="User name"
                          className="focus:ring-[#22B573]/40"
                          style={inputStyle}
                        />
                      )}
                    />
                  </div>
                  <div>
                    <label htmlFor="emp-filter-phone" style={labelStyle}>
                      Phone
                    </label>
                    <Controller
                      name="phone"
                      control={control}
                      defaultValue=""
                      render={({ field }) => (
                        <Input
                          id="emp-filter-phone"
                          {...field}
                          value={field.value || ""}
                          placeholder="Phone"
                          className="focus:ring-[#22B573]/40"
                          style={inputStyle}
                        />
                      )}
                    />
                  </div>
                  <div>
                    <span style={labelStyle}>Is Active</span>
                    <Controller
                      name="isActive"
                      control={control}
                      defaultValue=""
                      render={({ field }) => (
                        <select
                          {...field}
                          value={field.value || ""}
                          className="w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 cursor-pointer"
                          style={inputStyle}
                        >
                          <option value="">All</option>
                          <option value="active">Active</option>
                          <option value="inactive">Inactive</option>
                        </select>
                      )}
                    />
                  </div>
                  <div>
                    <span style={labelStyle}>Role</span>
                    <Controller
                      name="role"
                      control={control}
                      defaultValue=""
                      render={({ field }) => (
                        <select
                          {...field}
                          value={field.value || ""}
                          className="w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 cursor-pointer"
                          style={inputStyle}
                        >
                          <option value="">All</option>
                          <option value={roles.EMPLOYEE_REMINDER}>
                            EMPLOYEE REMINDER
                          </option>
                          <option value={roles.EMPLOYEE_SALES}>
                            EMPLOYEE SALES
                          </option>
                        </select>
                      )}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="vc-gte" style={labelStyle}>
                      Valid Call Time (Min)
                    </label>
                    <Controller
                      name="validCallTime.$gte"
                      control={control}
                      defaultValue=""
                      render={({ field }) => (
                        <Input
                          id="vc-gte"
                          type="number"
                          min={1}
                          {...field}
                          value={field.value ?? ""}
                          className="focus:ring-[#22B573]/40"
                          style={inputStyle}
                        />
                      )}
                    />
                  </div>
                  <div>
                    <label htmlFor="vc-lte" style={labelStyle}>
                      Valid Call Time (Max)
                    </label>
                    <Controller
                      name="validCallTime.$lte"
                      control={control}
                      defaultValue=""
                      render={({ field }) => (
                        <Input
                          id="vc-lte"
                          type="number"
                          min={1}
                          {...field}
                          value={field.value ?? ""}
                          className="focus:ring-[#22B573]/40"
                          style={inputStyle}
                        />
                      )}
                    />
                  </div>
                  <div>
                    <label htmlFor="dc-gte" style={labelStyle}>
                      Daily Contact Limit (Min)
                    </label>
                    <Controller
                      name="dailyContactLimit.$gte"
                      control={control}
                      defaultValue=""
                      render={({ field }) => (
                        <Input
                          id="dc-gte"
                          type="number"
                          min={1}
                          {...field}
                          value={field.value ?? ""}
                          className="focus:ring-[#22B573]/40"
                          style={inputStyle}
                        />
                      )}
                    />
                  </div>
                  <div>
                    <label htmlFor="dc-lte" style={labelStyle}>
                      Daily Contact Limit (Max)
                    </label>
                    <Controller
                      name="dailyContactLimit.$lte"
                      control={control}
                      defaultValue=""
                      render={({ field }) => (
                        <Input
                          id="dc-lte"
                          type="number"
                          min={1}
                          {...field}
                          value={field.value ?? ""}
                          className="focus:ring-[#22B573]/40"
                          style={inputStyle}
                        />
                      )}
                    />
                  </div>
                </div>
                </>
                ) : (
                  <EmployeeConditionalLogicPanel
                    active={filterTab === "advanced"}
                    control={control}
                    setValue={setValue}
                    getValues={getValues}
                    roleOptionValues={roleOptionValues}
                    onChainMeta={handleConditionalChainMeta}
                    sanitizerRef={conditionalSanitizeRef}
                    inputStyle={inputStyle}
                    isDark={isDark}
                  />
                )}
              </div>

              <div
                className="p-4 border-t flex flex-wrap items-center justify-between gap-3 flex-shrink-0"
                style={{ borderColor: shellBorder, backgroundColor: isDark ? "rgba(15,23,42,0.85)" : "#F9FAFB" }}
              >
                <Button
                  type="button"
                  variant="outline"
                  onClick={resetForm}
                  className="rounded-xl flex items-center gap-2"
                  style={ghostBtn}
                >
                  <RotateCcw className="w-4 h-4" /> Reset
                </Button>
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={onClose}
                    className="rounded-xl px-4"
                    style={cancelBtn}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="rounded-xl px-5 font-semibold"
                    style={applyBtn}
                  >
                    Apply Filters
                  </Button>
                </div>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    portalTarget
  );
};

export default EmployeeFilterModal;
