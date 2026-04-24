import { useDispatch, useSelector } from "react-redux";
import { checkoutAddon } from "../../../features/actions/razorpay";
import ComponentGuard from "../../../components/AccessControl/ComponentGuard";
import { copyToClipboard, errorToast, formatDateAsNumber } from "../../../utils/extra";
import { getGSTStateValue } from "../../../features/slices/auth";
import { formatRazorpayStatus } from "../Plans/subscriptionStatusUtils";

function entitlementBadgeClass(status) {
  const s = String(status || "")
    .toUpperCase()
    .trim();
  if (s === "ACTIVE")
    return "bg-emerald-50 text-emerald-800 ring-emerald-600/20";
  if (s === "EXPIRED") return "bg-red-50 text-red-800 ring-red-600/20";
  if (s === "CANCELLED") return "bg-amber-50 text-amber-900 ring-amber-600/20";
  if (s === "PENDING") return "bg-blue-50 text-blue-800 ring-blue-600/20";
  if (s === "FAILED") return "bg-red-50 text-red-900 ring-red-600/25";
  return "bg-gray-100 text-gray-700 ring-gray-500/10";
}

function formatEntitlementStatus(status) {
  const s = String(status || "")
    .toUpperCase()
    .trim();
  const labels = {
    ACTIVE: "Access active",
    EXPIRED: "Access expired",
    CANCELLED: "Access cancelled",
    PENDING: "Access pending",
    FAILED: "Access failed",
  };
  return labels[s] || (s ? s.charAt(0) + s.slice(1).toLowerCase() : "Unknown");
}

function razorpayBillingBadgeClass(status) {
  const s = String(status || "")
    .toLowerCase()
    .trim();
  if (s === "active" || s === "authenticated")
    return "bg-indigo-50 text-indigo-800 ring-indigo-600/15";
  if (s === "cancelled" || s === "halted")
    return "bg-red-50 text-red-800 ring-red-600/20";
  if (s === "paused") return "bg-amber-50 text-amber-900 ring-amber-600/20";
  if (s === "completed") return "bg-gray-100 text-gray-800 ring-gray-200";
  if (s === "created" || s === "pending")
    return "bg-slate-50 text-slate-800 ring-slate-200";
  return "bg-gray-50 text-gray-700 ring-gray-200";
}
const AddonCard = ({
  addon,
  id,
  roles,
  showAction = true,
  showExpiryDate = false,
  showBillingMeta = false,
}) => {
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
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span
              className={`inline-flex items-center rounded-md px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${entitlementBadgeClass(
                addon.status
              )}`}
            >
              {formatEntitlementStatus(addon.status)}
            </span>
            {addon.providerRazorpaySubscriptionId ? (
              <span
                className={`inline-flex items-center rounded-md px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${razorpayBillingBadgeClass(
                  addon.providerRazorpaySubscriptionStatus
                )}`}
              >
                Razorpay:{" "}
                {addon.providerRazorpaySubscriptionStatus
                  ? formatRazorpayStatus(addon.providerRazorpaySubscriptionStatus)
                  : "Status pending"}
              </span>
            ) : null}
          </div>
          <p className="mt-2 text-sm text-gray-500">
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

      {showBillingMeta &&
        (addon.providerRazorpaySubscriptionId || addon.validityInDays) ? (
        <div className="mt-4 space-y-2 rounded-xl border border-gray-100 bg-gray-50/90 px-3 py-3 text-xs text-gray-600">
          {addon.providerRazorpaySubscriptionId ? (
            <div>
              <div className="font-semibold text-gray-700">Razorpay subscription</div>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <code className="rounded bg-white px-2 py-1 font-mono text-[11px] text-gray-800 ring-1 ring-gray-200">
                  {addon.providerRazorpaySubscriptionId}
                </code>
                <button
                  type="button"
                  className="rounded-md bg-white px-2 py-1 text-[11px] font-semibold text-indigo-700 ring-1 ring-indigo-200 hover:bg-indigo-50"
                  onClick={() =>
                    copyToClipboard(
                      addon.providerRazorpaySubscriptionId,
                      "Razorpay subscription"
                    )
                  }
                >
                  Copy
                </button>
              </div>
              <p className="mt-2 leading-relaxed text-gray-600">
                Recurring billing runs in Razorpay until you cancel this add-on
                subscription in the Razorpay dashboard or customer portal.
              </p>
            </div>
          ) : null}
          {addon.validityInDays ? (
            <p className="text-gray-500">
              <span className="font-medium text-gray-700">Cycle length:</span>{" "}
              {addon.validityInDays} day{addon.validityInDays === 1 ? "" : "s"} per
              renewal (keep in sync with your Razorpay plan interval).
            </p>
          ) : null}
        </div>
      ) : null}

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
