import React, { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { useDispatch, useSelector } from "react-redux";
import AppLoader from "../AppLoader";
import { closeModal } from "../../features/slices/modalSlice";
import { createWebinar, updateWebinar } from "../../features/actions/webinarContact";
import { getAllEmployees } from "../../features/actions/employee";
import { clearEmployeeData } from "../../features/slices/employee";
import { getAllProductsByAdminId } from "../../features/actions/product";
import useAddUserActivity from "../../hooks/useAddUserActivity";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "../ui/dialog";
import { MultiSelectDropdown } from "../MultiSelectDropdown";

function toDateInputValue(date) {
  if (!date) return "";
  const d = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(d.getTime())) return "";
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

const CreateWebinar = ({ modalName }) => {
  const dispatch = useDispatch();
  const logUserActivity = useAddUserActivity();
  const { isCreating, isSuccess } = useSelector((state) => state.webinarContact);
  const { modals, modalData } = useSelector((state) => state.modals);
  const { employeeData } = useSelector((state) => state.employee);
  const { productDropdownData } = useSelector((state) => state.product);
  const open = Boolean(modals[modalName]);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm({ defaultValues: { webinarName: "", webinarDate: null } });

  const [selectedEmployees, setSelectedEmployees] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);

  const employeeOptions = useMemo(
    () =>
      (employeeData || []).map((employee) => ({
        value: employee._id,
        label: `${employee.userName} - ${employee.role}`,
      })),
    [employeeData]
  );

  const productOptions = useMemo(
    () =>
      (productDropdownData || []).map((product) => ({
        value: product._id,
        label: `${product.name} | Level - ${product.level}`,
      })),
    [productDropdownData]
  );

  const employeeLabelList = useMemo(() => employeeOptions.map((o) => o.label), [employeeOptions]);
  const productLabelList = useMemo(() => productOptions.map((o) => o.label), [productOptions]);
  const selectedEmployeeLabels = useMemo(() => selectedEmployees.map((e) => e.label), [selectedEmployees]);
  const selectedProductLabels = useMemo(() => (selectedProduct || []).map((p) => p.label), [selectedProduct]);

  const webinarDate = watch("webinarDate");
  const webinarDateInput = toDateInputValue(webinarDate);

  useEffect(() => {
    if (!open) return;
    dispatch(getAllEmployees({ page: 1, limit: 100, filters: { isActive: "active" } }));
    dispatch(getAllProductsByAdminId());
  }, [open, dispatch]);

  useEffect(() => () => dispatch(clearEmployeeData()), [dispatch]);

  useEffect(() => {
    if (isSuccess) handleClose();
  }, [isSuccess]);

  useEffect(() => {
    if (!open) return;
    if (modalData) {
      let webinarDateValue = null;
      if (modalData?.webinarDate) {
        const dateString = modalData.webinarDate.includes("T") ? modalData.webinarDate.split("T")[0] : modalData.webinarDate;
        const [year, month, day] = dateString.split("-").map(Number);
        webinarDateValue = new Date(year, month - 1, day);
      }
      reset({ webinarName: modalData?.webinarName || "", webinarDate: webinarDateValue });
      setSelectedEmployees(employeeOptions.filter((option) => modalData?.assignedEmployees?.includes(option.value)));
      setSelectedProduct(productOptions.filter((option) => modalData?.productIds?.includes(option.value)));
    } else {
      reset({ webinarName: "", webinarDate: null });
      setSelectedEmployees([]);
      setSelectedProduct(null);
    }
  }, [modalData, open, reset, employeeOptions, productOptions]);

  const handleClose = () => {
    dispatch(closeModal(modalName));
    reset({ webinarName: "", webinarDate: null });
    setSelectedEmployees([]);
    setSelectedProduct(null);
  };

  const submitForm = (data) => {
    let formattedDate = null;
    if (data.webinarDate) {
      const date = new Date(data.webinarDate);
      formattedDate = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
    }
    const payload = {
      ...data,
      webinarDate: formattedDate,
      assignedEmployees: selectedEmployees.map((e) => e.value),
      productIds: selectedProduct?.map((p) => p.value),
    };

    logUserActivity({ action: modalData ? "edit" : "create", type: "Webinar", detailItem: payload.webinarName });
    if (modalData) dispatch(updateWebinar({ id: modalData?._id, data: payload }));
    else dispatch(createWebinar(payload));
  };

  return (
    <Dialog open={open} onOpenChange={(next) => !next && handleClose()}>
      <DialogContent
        className="sm:max-w-[750px] rounded-2xl p-6"
        style={{
          backgroundColor: "#ffffff",
          borderColor: "#e2e8f0",
          borderWidth: "1px",
          borderStyle: "solid",
          boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)",
        }}
      >
        <DialogHeader className="pb-4 border-b" style={{ borderColor: "#e2e8f0" }}>
          <div className="flex items-center justify-between gap-4">
            <DialogTitle className="text-xl font-bold" style={{ color: "#0f172a" }}>
              {modalData ? "Edit Webinar" : "Create Webinar"}
            </DialogTitle>
            <DialogDescription className="hidden">Create a new webinar</DialogDescription>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit(submitForm)}>
          <div className="grid gap-4 py-4">
            <div>
              <input
                type="text"
                placeholder="Webinar Name"
                className="w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 transition-all"
                style={{
                  backgroundColor: "#ffffff",
                  borderColor: "#e2e8f0",
                  color: "#0f172a",
                }}
                {...register("webinarName", { required: "Webinar Name is required" })}
              />
              {errors.webinarName && <p className="mt-1 text-xs text-red-500">{errors.webinarName.message}</p>}
            </div>

            <div>
              <input
                type="date"
                placeholder="Select Webinar Date"
                value={webinarDateInput}
                onChange={(e) => {
                  const v = e.target.value;
                  if (!v) {
                    setValue("webinarDate", null, { shouldValidate: true });
                    return;
                  }
                  const [y, m, d] = v.split("-").map(Number);
                  setValue("webinarDate", new Date(y, m - 1, d), { shouldValidate: true });
                }}
                className="w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 transition-all"
                style={{
                  backgroundColor: "#ffffff",
                  borderColor: "#e2e8f0",
                  color: "#0f172a",
                }}
              />
            </div>

            <MultiSelectDropdown
              options={employeeLabelList}
              selected={selectedEmployeeLabels}
              onChange={(labels) => {
                setSelectedEmployees(employeeOptions.filter((o) => labels.includes(o.label)));
              }}
              placeholder="Select employees"
              label="Assign Employees"
            />

            <MultiSelectDropdown
              options={productLabelList}
              selected={selectedProductLabels}
              onChange={(labels) => {
                setSelectedProduct(productOptions.filter((o) => labels.includes(o.label)));
              }}
              placeholder="Select product"
              label="Assign Product"
            />

            <div className="flex gap-3 mt-4 pt-4 border-t" style={{ borderColor: "#e2e8f0" }}>
              <button
                type="button"
                onClick={handleClose}
                className="flex-1 px-6 py-2.5 rounded-xl text-sm font-medium transition-colors hover:bg-opacity-80"
                style={{
                  backgroundColor: "#f1f5f9",
                  color: "#475569",
                  border: "1px solid #e2e8f0",
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 px-6 py-2.5 rounded-xl text-sm font-medium text-white transition-transform hover:scale-105 shadow-md flex items-center justify-center gap-2"
                style={{ backgroundColor: "#22B573" }}
                disabled={isCreating}
              >
                {isCreating ? <AppLoader size="md" variant="inverse" /> : modalData ? "Update Webinar" : "Create Webinar"}
              </button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateWebinar;
