import React, { useState, useMemo } from "react";
import { useProductsForAdmin, useBulkCreateEnrollments } from "../../hooks/useEnrollments";
import TailwindLoader from "../TailwindLoader";

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

  const [selectedProductId, setSelectedProductId] = useState("");
  const [confirmationCode] = useState(() => generateConfirmationCode());
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
        // If we somehow don't have valid ids, fall back to filtered mode
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
      // Error already handled in mutation onError
    }
  };

  const handleCancel = () => {
    setSelectedProductId("");
    setConfirmationInput("");
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 z-[9999] flex justify-center items-center">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4 p-6">
        <h2 className="text-xl font-semibold mb-4">Create Bulk Enrollments</h2>

        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-medium mb-2">
            Product
          </label>
          <select
            value={selectedProductId}
            onChange={(e) => setSelectedProductId(e.target.value)}
            className="block w-full h-10 rounded border border-gray-300 px-3 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
          >
            <option value="">
              {productsLoading ? "Loading products..." : "Select product"}
            </option>
            {!productsLoading &&
              productDropdownData?.map((product) => (
                <option key={product._id} value={product._id}>
                  {product?.name} | Level: {product?.level} | Price: {product?.price}
                </option>
              ))}
          </select>
        </div>

        <div className="mb-4 p-3 bg-gray-50 rounded border border-gray-200">
          <p className="text-sm text-gray-700">
            Enroll <strong>{attendeeCount}</strong> attendee
            {attendeeCount !== 1 ? "s" : ""}{" "}
            {scope === "selected"
              ? "(selected rows only)"
              : "(all attendees matching current filters)"}
            .
          </p>
        </div>

        <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded">
          <p className="text-sm text-amber-800 font-medium">
            This action will create enrollments and cannot be undone.
          </p>
        </div>

        <div className="mb-4">
          <p className="text-sm text-gray-600 mb-1">
            Type the confirmation code below to continue:
          </p>
          <p className="text-lg font-mono font-bold tracking-widest text-gray-800 mb-2">
            {confirmationCode}
          </p>
          <input
            type="text"
            inputMode="numeric"
            maxLength={6}
            placeholder="Enter 6-digit code"
            value={confirmationInput}
            onChange={(e) => setConfirmationInput(e.target.value.replace(/\D/g, "").slice(0, 6))}
            className="block w-full h-10 rounded border border-gray-300 px-3 font-mono focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
          />
        </div>

        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={handleCancel}
            disabled={isPending}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2 min-w-[100px] justify-center"
          >
            {isPending ? (
              <TailwindLoader size={5} />
            ) : (
              "Create Enrollments"
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default BulkEnrollmentModal;
export { BULK_ENROLL_MODAL_NAME };
