import { Link } from "react-router-dom";
import { copyToClipboard } from "../../../utils/extra";
import {
  formatDateDisplay,
  formatRazorpayStatus,
  getAccessState,
  truncateMiddleId,
} from "./subscriptionStatusUtils";

const accessBadgeStyles = {
  active: "bg-emerald-50 text-emerald-800 ring-emerald-600/20",
  expiring_soon: "bg-amber-50 text-amber-900 ring-amber-600/20",
  expired: "bg-red-50 text-red-800 ring-red-600/20",
  unknown: "bg-gray-100 text-gray-700 ring-gray-500/10",
};

const accessLabels = {
  active: "Subscription active",
  expiring_soon: "Expiring soon",
  expired: "Expired",
  unknown: "Term unknown",
};

/**
 * @param {{
 *   subscription: Record<string, unknown> | null | undefined;
 *   isLoading: boolean;
 *   isError: boolean;
 *   error?: Error | null;
 * }} props
 */
export default function SubscriptionOverviewPanel({
  subscription,
  isLoading,
  isError,
  error,
}) {
  if (isLoading) {
    return (
      <section
        className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm mb-8"
        aria-busy="true"
        aria-label="Loading subscription"
      >
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3 max-w-xs" />
          <div className="h-4 bg-gray-100 rounded w-2/3 max-w-md" />
          <div className="flex gap-3 pt-2">
            <div className="h-9 bg-gray-100 rounded w-24" />
            <div className="h-9 bg-gray-100 rounded w-24" />
          </div>
        </div>
      </section>
    );
  }

  if (isError) {
    const msg =
      error?.message ||
      "We could not load your subscription. Please try again or contact support.";
    return (
      <section
        className="rounded-xl border border-red-200 bg-red-50/50 p-6 shadow-sm mb-8"
        aria-labelledby="sub-error-heading"
      >
        <h2
          id="sub-error-heading"
          className="text-lg font-semibold text-red-900"
        >
          Subscription unavailable
        </h2>
        <p className="mt-2 text-sm text-red-800">{msg}</p>
        <p className="mt-3 text-sm text-gray-600">
          You can still browse plan options below. If this persists, contact
          your account owner or support.
        </p>
      </section>
    );
  }

  if (!subscription || !subscription.plan) {
    return (
      <section
        className="rounded-xl border border-amber-200 bg-amber-50/40 p-6 shadow-sm mb-8"
        aria-labelledby="sub-missing-heading"
      >
        <h2
          id="sub-missing-heading"
          className="text-lg font-semibold text-amber-900"
        >
          No subscription on file
        </h2>
        <p className="mt-2 text-sm text-amber-900/90">
          We did not find an active plan assignment for your organization. If
          you believe this is wrong, contact support.
        </p>
      </section>
    );
  }

  const plan = subscription.plan;
  const planName =
    (typeof plan.name === "string" && plan.name) ||
    (typeof plan.internalName === "string" && plan.internalName) ||
    "Your plan";
  const internalName =
    typeof plan.internalName === "string" ? plan.internalName : null;

  const { tier, daysRemaining } = getAccessState(subscription.expiryDate);
  const badgeClass =
    accessBadgeStyles[tier] || accessBadgeStyles.unknown;
  const badgeLabel = accessLabels[tier] || accessLabels.unknown;

  const razorpayId =
    typeof subscription.razorpaySubscriptionId === "string"
      ? subscription.razorpaySubscriptionId
      : "";
  const razorpayShortUrl =
    typeof subscription.razorpaySubscriptionShortUrl === "string"
      ? subscription.razorpaySubscriptionShortUrl
      : "";
  const isRecurring = Boolean(razorpayId);
  const rzpStatus = formatRazorpayStatus(
    subscription.razorpaySubscriptionStatus
  );

  const daysLine =
    tier === "expired"
      ? "Access may be limited until you renew."
      : tier === "expiring_soon" && daysRemaining != null
        ? `${daysRemaining} day${daysRemaining === 1 ? "" : "s"} remaining in the current term.`
        : tier === "active" && daysRemaining != null
          ? `${daysRemaining} day${daysRemaining === 1 ? "" : "s"} left until renewal date.`
          : null;

  return (
    <section
      className="rounded-xl border border-gray-200 bg-white shadow-sm mb-8 overflow-hidden"
      aria-labelledby="current-sub-heading"
    >
      <div className="px-6 py-5 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
              Current subscription
            </p>
            <h2
              id="current-sub-heading"
              className="mt-1 text-2xl font-bold text-gray-900"
            >
              {planName}
            </h2>
            {internalName && internalName !== planName && (
              <p className="text-sm text-gray-500 mt-0.5">{internalName}</p>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`inline-flex items-center rounded-md px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${badgeClass}`}
            >
              {badgeLabel}
            </span>
            <span className="inline-flex items-center rounded-md bg-indigo-50 px-2.5 py-1 text-xs font-medium text-indigo-800 ring-1 ring-inset ring-indigo-600/15">
              {isRecurring ? "Recurring (Razorpay)" : "One-time / legacy billing"}
            </span>
            {isRecurring && (
              <span className="inline-flex items-center rounded-md bg-white px-2.5 py-1 text-xs font-medium text-gray-700 ring-1 ring-inset ring-gray-200">
                Provider: {rzpStatus}
              </span>
            )}
          </div>
        </div>

        {daysLine && (
          <p className="mt-3 text-sm text-gray-600 max-w-2xl">{daysLine}</p>
        )}

        <dl className="mt-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
          <div>
            <dt className="text-gray-500 font-medium">Current term start</dt>
            <dd className="mt-0.5 font-semibold text-gray-900">
              {formatDateDisplay(subscription.startDate)}
            </dd>
          </div>
          <div>
            <dt className="text-gray-500 font-medium">Renewal / end date</dt>
            <dd className="mt-0.5 font-semibold text-gray-900">
              {formatDateDisplay(subscription.expiryDate)}
            </dd>
          </div>
          <div>
            <dt className="text-gray-500 font-medium">Plan ID</dt>
            <dd className="mt-0.5 font-mono text-xs text-gray-800 break-all">
              {plan._id ?? "—"}
            </dd>
          </div>
          <div>
            <dt className="text-gray-500 font-medium">Razorpay subscription</dt>
            <dd className="mt-0.5 flex flex-wrap items-center gap-2">
              {isRecurring ? (
                <>
                  <span
                    className="font-mono text-xs text-gray-800"
                    title={razorpayId}
                  >
                    {truncateMiddleId(razorpayId)}
                  </span>
                  <button
                    type="button"
                    className="text-xs font-semibold text-indigo-600 hover:text-indigo-800"
                    onClick={() =>
                      copyToClipboard(razorpayId, "Razorpay subscription")
                    }
                    aria-label="Copy Razorpay subscription ID"
                  >
                    Copy
                  </button>
                  {razorpayShortUrl ? (
                    <a
                      href={razorpayShortUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-semibold text-indigo-600 hover:text-indigo-800"
                    >
                      Open link
                    </a>
                  ) : null}
                </>
              ) : (
                <span className="text-gray-600">Not on recurring billing</span>
              )}
            </dd>
          </div>
        </dl>

        <nav
          className="mt-6 flex flex-wrap gap-3"
          aria-label="Subscription actions"
        >
          <Link
            to="/billing-history"
            className="inline-flex items-center justify-center rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
          >
            Billing history
          </Link>
          <Link
            to="/addons/buy"
            className="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-900 shadow-sm hover:bg-gray-50"
          >
            Buy add-ons
          </Link>
        </nav>
      </div>
    </section>
  );
}
