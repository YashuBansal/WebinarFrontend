import { useDispatch, useSelector } from "react-redux";
import { checkoutAddon } from "../../../features/actions/razorpay";
import ComponentGuard from "../../../components/AccessControl/ComponentGuard";
import { errorToast, formatDateAsNumber } from "../../../utils/extra";
import { getGSTStateValue } from "../../../features/slices/auth";
const AddonCard = ({ addon, id, roles, showAction = true, showExpiryDate = false }) => {
  const dispatch = useDispatch();
  const { userData } = useSelector((state) => state.auth);
  const GST_VALUE = useSelector(getGSTStateValue);

  const handleAddonSelection = (addonId) => {
    dispatch(checkoutAddon({ addon: addonId }))
      .unwrap()
      .then((payload) => {
        const sub = payload?.result ?? payload?.order;
        const purchase = payload?.purchase;
        const purchasedAddon = payload?.addon;
        if (!sub?.id || !purchase?._id) return;

        const callbackBase =
          import.meta.env.VITE_REACT_APP_WORKING_ENVIRONMENT === "development"
            ? import.meta.env.VITE_REACT_APP_API_BASE_URL_DEVELOPMENT
            : import.meta.env.VITE_REACT_APP_API_BASE_URL_MAIN_PRODUCTION;
        const callbackUrl = `${callbackBase}/razorpay/addon/payment-success?adminId=${userData?._id}&purchaseId=${purchase._id}`;

        const options = {
          key: import.meta.env.VITE_RAZORPAY_KEY_ID,
          subscription_id: sub.id,
          name: "Add-on purchase",
          description: purchasedAddon?.addonName || "Add-on",
          callback_url: callbackUrl,
          theme: { color: "#F37254" },
        };

        const rzp = new Razorpay(options);
        rzp.open();
      })
      .catch((e) => {
        errorToast(e);
      });
  };

  return (
    <div
      key={addon._id}
      className="group h-full rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-gray-300 hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="truncate text-lg font-semibold text-gray-900">
            {addon.addonName}
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            {showExpiryDate ? (
              <>Validity: {addon.validityInDays} days</>
            ) : (
              <div className="flex flex-col gap-0.5">
                <span className="flex justify-between">
                  <span>Start At:</span>
                  <span className="font-medium text-gray-700">
                    {addon.startAt ? formatDateAsNumber(addon.startAt) : "N/A"}
                  </span>
                </span>
                <span className="flex justify-between">
                  <span>Expiry:</span>
                  <span className="font-medium text-gray-700">
                    {addon.expiryDate ? formatDateAsNumber(addon.expiryDate) : "N/A"}
                  </span>
                </span>
              </div>
            )}
          </p>
        </div>

        <div className="shrink-0 text-right">
          <div className="text-xs text-gray-500">Price</div>
          <div className="text-lg font-semibold text-gray-900">
            {"\u20B9"}
            {addon.addOnPrice}
          </div>
          <div className="text-xs text-gray-500">incl. {GST_VALUE}% GST</div>
        </div>
      </div>

      <div className="my-4 h-px w-full bg-gray-100" />

      <div className="space-y-2">
        <div className="text-xs font-medium uppercase tracking-wide text-gray-500">
          Limits
        </div>
        <div className="grid grid-cols-1 gap-2 text-sm text-gray-700">
          {addon.employeeLimit ? (
            <div className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2">
              <span>Employees</span>
              <span className="font-medium text-gray-900">{addon.employeeLimit}</span>
            </div>
          ) : null}
          {addon.contactLimit ? (
            <div className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2">
              <span>Contacts</span>
              <span className="font-medium text-gray-900">{addon.contactLimit}</span>
            </div>
          ) : null}
          {addon.webinarLimit ? (
            <div className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2">
              <span>Webinars</span>
              <span className="font-medium text-gray-900">{addon.webinarLimit}</span>
            </div>
          ) : null}
          {addon.whatsappProjectLimit ? (
            <div className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2">
              <span>WhatsApp projects</span>
              <span className="font-medium text-gray-900">
                {addon.whatsappProjectLimit}
              </span>
            </div>
          ) : null}
          {addon.zoomProjectLimit ? (
            <div className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2">
              <span>Zoom projects</span>
              <span className="font-medium text-gray-900">
                {addon.zoomProjectLimit}
              </span>
            </div>
          ) : null}

          {!addon.employeeLimit &&
          !addon.contactLimit &&
          !addon.webinarLimit &&
          !addon.whatsappProjectLimit &&
          !addon.zoomProjectLimit ? (
            <div className="rounded-lg border border-dashed border-gray-200 px-3 py-2 text-sm text-gray-500">
              No limits configured
            </div>
          ) : null}
        </div>
      </div>

      <ComponentGuard allowedRoles={[roles.ADMIN]}>
        {showAction && (
          <button
            className="mt-5 w-full rounded-xl bg-blue-600 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2"
            onClick={() => handleAddonSelection(id)}
          >
            Select AddOn
          </button>
        )}
      </ComponentGuard>

      {/* <ComponentGuard allowedRoles={[roles.SUPER_ADMIN]}>
         <div className="border-t pt-4 w-full mt-2">
  
         </div>
        </ComponentGuard> */}
    </div>
  );
};

export default AddonCard;
