import React, { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import FormInput from "../../../components/FormInput";
import { errorToast } from "../../../utils/extra";
import { useDispatch, useSelector } from "react-redux";
import {
  createAddon,
  getAddons,
  getClientAddons,
} from "../../../features/actions/pricePlan";
import { resetAddonsData, resetPricePlanSuccess } from "../../../features/slices/pricePlan";
import ComponentGuard from "../../../components/AccessControl/ComponentGuard";
import useRoles from "../../../hooks/useRoles";
import { useParams } from "react-router-dom";
import AddonCard from "./AddonCard";
import HubSubpageShell from "../../../components/Layout/HubSubpageShell";
import { addonHasConfiguredRazorpayPlan } from "../../../utils/addonCatalog";

const AddOnsPage = () => {
  const dispatch = useDispatch();
  const roles = useRoles();
  const { id } = useParams();

  const [isModalOpen, setModalOpen] = useState(false);
  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm();

  const { userData } = useSelector((state) => state.auth);
  const { isSuccess, addonsData } = useSelector((state) => state.pricePlans);

  const catalogAddons = useMemo(() => {
    const list = addonsData || [];
    if (id) return list;
    return list.filter(addonHasConfiguredRazorpayPlan);
  }, [addonsData, id]);

  useEffect(() => {
    if (!id) dispatch(getAddons());
    else dispatch(getClientAddons(id));

    return () => {
      dispatch(resetAddonsData());
    };
  }, [id]);

  useEffect(() => {
    if (isSuccess && !id) {
      setModalOpen(false);
      reset();
      dispatch(resetPricePlanSuccess());
      dispatch(getAddons());
    }
  }, [isSuccess]);

  const onSubmit = (data) => {
    console.log(data);
    if (
      !data.employeeLimit &&
      !data.contactLimit &&
      !data.webinarLimit &&
      !data.whatsappProjectLimit &&
      !data.zoomProjectLimit
    ) {
      errorToast(
        "At least one limit must be provided (Employee, Contact, Webinar, WhatsApp projects, or Zoom projects)."
      );
      return;
    }
    if (!data.contactLimit) data.contactLimit = 0;
    if (!data.employeeLimit) data.employeeLimit = 0;
    if (!data.webinarLimit) data.webinarLimit = 0;
    if (!data.whatsappProjectLimit) data.whatsappProjectLimit = 0;
    if (!data.zoomProjectLimit) data.zoomProjectLimit = 0;

    const rzp = String(data.razorpayPlanId || "").trim();
    if (!/^plan_[A-Za-z0-9]+$/i.test(rzp)) {
      errorToast(
        "Razorpay plan id is required: create a plan in Razorpay Dashboard (Subscriptions) and enter its id, e.g. plan_XXXX."
      );
      return;
    }
    data.razorpayPlanId = rzp;

    dispatch(createAddon(data));
  };

  return (
    <HubSubpageShell>
      <h1 className="mb-6 text-center text-2xl font-bold text-slate-900 dark:text-slate-100">
        {id ? "My" : ""} AddOns
      </h1>

      <div className="mb-6 flex justify-end">
        <ComponentGuard allowedRoles={[roles.SUPER_ADMIN]}>
          <button
            onClick={() => setModalOpen(true)}
            className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-400"
          >
            Create AddOn
          </button>
        </ComponentGuard>

        {/* Admin purchase flow lives at /addons/buy now */}
      </div>

      {!id && (addonsData || []).length > 0 && catalogAddons.length === 0 && (
        <div className="mb-6 rounded-md border border-gray-200 bg-white px-4 py-3 text-sm text-gray-600">
          No add-ons are listed until they have a Razorpay plan id (plan_…) configured.
        </div>
      )}

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {catalogAddons.map((addon) => (
          <AddonCard
            key={addon._id}
            addon={addon}
            roles={roles}
            id={addon._id}
            showExpiryDate={true}
          />
        ))}
      </div>


      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl">
            <div className="flex items-center justify-between gap-3 border-b border-gray-100 px-6 py-4">
              <h2 className="text-lg font-semibold text-gray-900">Create AddOn</h2>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="rounded-lg px-2 py-1 text-sm text-gray-500 hover:bg-gray-100 hover:text-gray-700"
              >
                Close
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)}>
              <div className="max-h-[75vh] overflow-y-auto px-6 py-5">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormInput
                name="addonName"
                label="AddOn Name"
                control={control}
                validation={{ required: "Name is required" }}
              />

              <FormInput
                name="employeeLimit"
                label="Employee Limit"
                control={control}
                type="number"
                validation={{
                  valueAsNumber: true,
                  min: { value: 0, message: "Must be at least 0" },
                }}
              />

              <FormInput
                name="contactLimit"
                label="Contact Limit"
                control={control}
                type="number"
                validation={{
                  valueAsNumber: true,
                  min: { value: 0, message: "Must be at least 0" },
                }}
              />

              <FormInput
                name="webinarLimit"
                label="Webinar Limit"
                control={control}
                type="number"
                validation={{
                  valueAsNumber: true,
                  min: { value: 0, message: "Must be at least 0" },
                }}
              />

              <FormInput
                name="whatsappProjectLimit"
                label="WhatsApp Project Limit"
                control={control}
                type="number"
                validation={{
                  valueAsNumber: true,
                  min: { value: 0, message: "Must be at least 0" },
                }}
              />

              <FormInput
                name="zoomProjectLimit"
                label="Zoom Project Limit"
                control={control}
                type="number"
                validation={{
                  valueAsNumber: true,
                  min: { value: 0, message: "Must be at least 0" },
                }}
              />

              <FormInput
                name="addOnPrice"
                label="Price (incl. GST)"
                control={control}
                type="number"
                validation={{
                  valueAsNumber: true,
                  required: "Price is required",
                  min: { value: 0, message: "Must be at least 0" },
                }}
              />

              <FormInput
                name="validityInDays"
                label="Validity (days)"
                control={control}
                type="number"
                validation={{
                  valueAsNumber: true,
                  required: "Validity is required",
                  min: { value: 1, message: "Must be at least 1 day" },
                }}
              />

              <div className="sm:col-span-2">
                <FormInput
                  name="razorpayPlanId"
                  label="Razorpay plan id (Subscriptions)"
                  control={control}
                  validation={{ required: "Razorpay plan id is required for checkout" }}
                />
                <p className="mt-1 text-xs text-gray-500">
                  From Razorpay Dashboard → Subscriptions → Plans. Must match the same
                  test/live mode as the app. Example: <code className="rounded bg-gray-100 px-1">plan_XXXX</code>
                </p>
              </div>

                </div>
              </div>

              <div className="flex items-center justify-end gap-3 border-t border-gray-100 px-6 py-4">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-green-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-offset-2"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </HubSubpageShell>
  );
};

export default AddOnsPage;
