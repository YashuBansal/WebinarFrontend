import { useDispatch, useSelector } from "react-redux";
import { checkoutAddon } from "../../../features/actions/razorpay";
import ComponentGuard from "../../../components/AccessControl/ComponentGuard";
import { errorToast, formatDateAsNumber } from "../../../utils/extra";
import { getGSTStateValue } from "../../../features/slices/auth";
import { formatRazorpayStatus } from "../Plans/subscriptionStatusUtils";
import { Button } from "../../../components/ui/button";
import { cn } from "../../../lib/utils";
import { buildAddonDescription, pickAddonIcon } from "./addonCardUtils";

function entitlementBadgeClass(status) {
  const s = String(status || "")
    .toUpperCase()
    .trim();
  if (s === "ACTIVE")
    return "bg-emerald-500/15 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-500/20 dark:text-emerald-400";
  if (s === "EXPIRED") return "bg-red-500/15 text-red-700 ring-red-600/20 dark:bg-red-500/20 dark:text-red-400";
  if (s === "CANCELLED") return "bg-amber-500/15 text-amber-800 ring-amber-600/20 dark:bg-amber-500/20 dark:text-amber-300";
  if (s === "PENDING") return "bg-blue-500/15 text-blue-700 ring-blue-600/20 dark:bg-blue-500/20 dark:text-blue-400";
  if (s === "FAILED") return "bg-red-500/15 text-red-800 ring-red-600/25 dark:bg-red-500/20 dark:text-red-400";
  return "bg-slate-200/80 text-slate-600 ring-slate-500/10 dark:bg-slate-700 dark:text-slate-300";
}

function formatEntitlementStatus(status, showExpiryDate = false) {
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
  if (!s) {
    return showExpiryDate ? "Available" : "Unknown";
  }
  return labels[s] || (s ? s.charAt(0) + s.slice(1).toLowerCase() : "Unknown");
}

function razorpayBillingBadgeClass(status) {
  const s = String(status || "")
    .toLowerCase()
    .trim();
  if (s === "active" || s === "authenticated")
    return "bg-indigo-500/15 text-indigo-700 ring-indigo-600/15 dark:bg-indigo-500/20 dark:text-indigo-300";
  if (s === "cancelled" || s === "halted")
    return "bg-red-500/15 text-red-700 ring-red-600/20 dark:bg-red-500/20 dark:text-red-400";
  if (s === "paused") return "bg-amber-500/15 text-amber-800 ring-amber-600/20 dark:bg-amber-500/20 dark:text-amber-300";
  if (s === "completed") return "bg-slate-200/80 text-slate-700 ring-slate-200 dark:bg-slate-700 dark:text-slate-300";
  if (s === "created" || s === "pending")
    return "bg-slate-100 text-slate-700 ring-slate-200 dark:bg-slate-800 dark:text-slate-300";
  return "bg-slate-100 text-slate-600 ring-slate-200 dark:bg-slate-800 dark:text-slate-400";
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
  const Icon = pickAddonIcon(addon);
  const description = buildAddonDescription(addon);
  const razorpaySubscriptionLink =
    addon?.providerRazorpaySubscriptionShortUrl || "";

  const priceDisplay =
    typeof addon?.addOnPrice === "number"
      ? addon.addOnPrice.toLocaleString("en-IN")
      : addon?.addOnPrice;

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
          theme: { color: "#3b82f6" },
        };

        const rzp = new Razorpay(options);
        rzp.open();
      })
      .catch((e) => {
        errorToast(e);
      });
  };

  const unitLabel = `${GST_VALUE}% GST incl.`;

  const secondaryLine = showExpiryDate
    ? addon?.validityInDays != null
      ? `${addon.validityInDays}-day validity`
      : null
    : addon?.expiryDate
      ? `Expires ${formatDateAsNumber(addon.expiryDate)}`
      : null;

  return (
    <div className="group flex h-full gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-xl dark:border-slate-700 dark:bg-slate-800/90 dark:hover:border-slate-600 dark:hover:shadow-blue-950/20 sm:gap-5 sm:rounded-2xl sm:p-6">
      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-blue-500/10 transition-transform duration-300 ease-out group-hover:scale-110 dark:bg-blue-500/15">
        <Icon className="h-7 w-7 text-blue-500 dark:text-blue-400" aria-hidden />
      </div>

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="mb-1 flex flex-wrap items-start justify-between gap-2 gap-y-1">
          <h4
            className="truncate text-lg font-bold text-slate-900 dark:text-slate-50"
            title={addon.addonName}
          >
            {addon.addonName}
          </h4>
          <span className="shrink-0 font-black tracking-tight text-blue-500 dark:text-blue-400">
            ₹{priceDisplay}
          </span>
        </div>

        {!showExpiryDate ? (
          <div className="mb-2 flex flex-wrap items-center gap-1.5">
            <span
              className={cn(
                "inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ring-1 ring-inset",
                entitlementBadgeClass(addon.status),
              )}
            >
              {formatEntitlementStatus(addon.status, showExpiryDate)}
            </span>
            {addon.providerRazorpaySubscriptionId ? (
              <span
                className={cn(
                  "inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ring-1 ring-inset",
                  razorpayBillingBadgeClass(
                    addon.providerRazorpaySubscriptionStatus,
                  ),
                )}
              >
                Razorpay:{" "}
                {addon.providerRazorpaySubscriptionStatus
                  ? formatRazorpayStatus(addon.providerRazorpaySubscriptionStatus)
                  : "Status pending"}
              </span>
            ) : null}
          </div>
        ) : null}

        {secondaryLine ? (
          <p className="mb-1 text-xs font-medium text-slate-500 dark:text-slate-400">
            {secondaryLine}
          </p>
        ) : null}

        {!showExpiryDate && (addon.startAt || addon.expiryDate) ? (
          <div className="mb-2 space-y-0.5 text-xs text-slate-500 dark:text-slate-400">
            <p>
              <span className="font-semibold">Start:</span>{" "}
              {addon.startAt ? formatDateAsNumber(addon.startAt) : "N/A"}
            </p>
            <p>
              <span className="font-semibold">Expiry:</span>{" "}
              {addon.expiryDate ? formatDateAsNumber(addon.expiryDate) : "N/A"}
            </p>
          </div>
        ) : null}

        <p className="mb-4 text-sm leading-relaxed text-slate-500 dark:text-slate-400">
          {description}
        </p>

        {showBillingMeta &&
        (addon.providerRazorpaySubscriptionId || addon.validityInDays) ? (
          <div className="mb-4 space-y-2 rounded-xl border border-slate-100 bg-slate-50/90 px-3 py-3 text-xs text-slate-600 dark:border-slate-700 dark:bg-slate-900/50 dark:text-slate-400">
            {addon.providerRazorpaySubscriptionId ? (
              <div>
                <div className="font-semibold text-slate-700 dark:text-slate-300">
                  Razorpay subscription
                </div>
                {razorpaySubscriptionLink ? (
                  <a
                    href={razorpaySubscriptionLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-1 inline-flex rounded-md bg-white px-2 py-1 text-[11px] font-semibold text-indigo-700 ring-1 ring-indigo-200 hover:bg-indigo-50 dark:bg-slate-800 dark:text-indigo-300 dark:ring-indigo-500/40"
                  >
                    Open link
                  </a>
                ) : null}
              </div>
            ) : null}
            {addon.validityInDays ? (
              <p>
                <span className="font-medium text-slate-700 dark:text-slate-300">
                  Cycle length:
                </span>{" "}
                {addon.validityInDays} day{addon.validityInDays === 1 ? "" : "s"}{" "}
                per renewal
              </p>
            ) : null}
          </div>
        ) : null}

        <div className="mt-auto flex flex-wrap items-center justify-between gap-3">
          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
            {unitLabel}
          </span>

          <ComponentGuard allowedRoles={[roles.ADMIN]}>
            {showAction ? (
              <Button
                type="button"
                className="h-8 rounded-lg border-none bg-blue-500 px-4 text-xs font-bold text-white shadow-lg shadow-blue-500/20 transition-all hover:bg-blue-600 hover:shadow-blue-500/30 dark:shadow-blue-900/40"
                onClick={() => handleAddonSelection(id)}
              >
                {showExpiryDate ? "ADD TO PLAN" : "Select add-on"}
              </Button>
            ) : null}
          </ComponentGuard>
        </div>
      </div>
    </div>
  );
};

export default AddonCard;
