import { getAccessState } from "../Plans/subscriptionStatusUtils";

/**
 * @param {{
 *   isLoadingAddons: boolean;
 *   activeCount: number;
 *   expiredCount: number;
 *   subscription: Record<string, unknown> | null | undefined;
 *   subscriptionLoading: boolean;
 *   subscriptionError: boolean;
 *   showOrgContext: boolean;
 * }} props
 */
export default function AddonSubscriptionsOverview({
  isLoadingAddons,
  activeCount,
  expiredCount,
  subscription,
  subscriptionLoading,
  subscriptionError,
  showOrgContext,
}) {
  if (isLoadingAddons) {
    return (
      <section
        className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm mb-8"
        aria-busy="true"
        aria-label="Loading add-ons overview"
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

  const subExpiry =
    subscription != null && subscription.expiryDate != null
      ? String(subscription.expiryDate)
      : null;
  const { tier, daysRemaining } = getAccessState(subExpiry);
  const orgLine =
    showOrgContext && !subscriptionLoading && !subscriptionError && subscription
      ? tier === "expired"
        ? "Your organization subscription has expired. Add-ons may not renew until the plan is active again."
        : daysRemaining != null && tier !== "unknown"
          ? `Organization plan renews in about ${daysRemaining} day${daysRemaining === 1 ? "" : "s"}. Add-on periods are capped by that date.`
          : "Add-on capacity is added on top of your organization subscription."
      : showOrgContext && subscriptionLoading
        ? "Loading organization subscription context…"
        : showOrgContext && subscriptionError
          ? "Could not load organization subscription. Add-on dates below are still accurate."
          : null;

  return (
    <section
      className="rounded-xl border border-gray-200 bg-white shadow-sm mb-8 overflow-hidden"
      aria-labelledby="addons-overview-heading"
    >
      <div className="px-6 py-5 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
          Add-ons overview
        </p>
        <h2
          id="addons-overview-heading"
          className="mt-1 text-2xl font-bold text-gray-900"
        >
          My add-ons
        </h2>
        <p className="mt-2 text-sm text-gray-600 max-w-3xl">
          Active add-ons extend your limits for the current term. Purchases billed
          through Razorpay subscriptions renew automatically until canceled in
          Razorpay, similar to your main plan.
        </p>
        {orgLine && (
          <p className="mt-3 text-sm text-indigo-900/90 max-w-3xl">{orgLine}</p>
        )}
      </div>
      <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 px-6 py-5 text-sm">
        <div className="rounded-lg border border-emerald-100 bg-emerald-50/40 px-4 py-3">
          <dt className="text-gray-600 font-medium">Active add-ons</dt>
          <dd className="mt-1 text-2xl font-bold text-emerald-900">{activeCount}</dd>
        </div>
        <div className="rounded-lg border border-gray-200 bg-gray-50/80 px-4 py-3">
          <dt className="text-gray-600 font-medium">Expired</dt>
          <dd className="mt-1 text-2xl font-bold text-gray-800">{expiredCount}</dd>
        </div>
      </dl>
    </section>
  );
}
