import { Link } from "react-router-dom";
import { copyToClipboard } from "../../../utils/extra";
import {
  formatDateDisplay,
  formatRazorpayStatus,
  getAccessState,
  truncateMiddleId,
  effectiveLimit,
} from "./subscriptionStatusUtils";
import { Zap, Copy, Calendar, Hash, ExternalLink, ShieldCheck } from "lucide-react";

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
        className="relative overflow-hidden rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-800/80 bg-gradient-to-br from-slate-50/40 to-white/70 dark:from-slate-950/20 dark:to-slate-900/30 p-8 md:p-10 shadow-sm backdrop-blur-md text-center max-w-3xl mx-auto mb-10 flex flex-col items-center"
        aria-labelledby="sub-missing-heading"
      >
        {/* Subtle glowing ambient gradient behind icon */}
        <div className="absolute -top-12 -left-12 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-12 -right-12 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-500 dark:text-indigo-400 mb-6 shadow-inner animate-bounce">
          <Zap className="h-8 w-8 stroke-[1.75]" />
        </div>

        <h2
          id="sub-missing-heading"
          className="text-2xl font-black text-slate-850 dark:text-slate-50 tracking-tight sm:text-3xl"
        >
          Activate Your Growth Journey 🚀
        </h2>
        
        <p className="mt-3 text-sm font-semibold text-slate-500 dark:text-slate-400 max-w-xl leading-relaxed">
          It looks like your organization doesn't have an active subscription tier active. Activate a plan below to unlock automated WhatsApp alerts, high-capacity attendee lists, smart calendars, and analytics.
        </p>

        {/* Feature Highlights Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full max-w-2xl mt-8 mb-6">
          <div className="p-3.5 rounded-2xl border border-slate-100 bg-white/50 dark:border-slate-800 dark:bg-slate-900/30 text-center">
            <span className="block text-lg font-bold text-slate-800 dark:text-slate-100">Unlimited</span>
            <span className="text-[10px] font-bold text-slate-450 dark:text-slate-500 uppercase tracking-widest mt-0.5 block">Attendee Sync</span>
          </div>
          <div className="p-3.5 rounded-2xl border border-slate-100 bg-white/50 dark:border-slate-800 dark:bg-slate-900/30 text-center">
            <span className="block text-lg font-bold text-indigo-550 dark:text-indigo-400">Automated</span>
            <span className="text-[10px] font-bold text-slate-450 dark:text-slate-500 uppercase tracking-widest mt-0.5 block">WhatsApp Alerts</span>
          </div>
          <div className="p-3.5 rounded-2xl border border-slate-100 bg-white/50 dark:border-slate-800 dark:bg-slate-900/30 text-center">
            <span className="block text-lg font-bold text-emerald-600 dark:text-emerald-450">Multi-Channel</span>
            <span className="text-[10px] font-bold text-slate-450 dark:text-slate-500 uppercase tracking-widest mt-0.5 block">Webinar Tracking</span>
          </div>
        </div>

        <button
          onClick={() => {
            const el = document.getElementById("available-plans-section") || document.querySelector(".grid-cols-1");
            if (el) {
              el.scrollIntoView({ behavior: "smooth", block: "start" });
            }
          }}
          className="inline-flex items-center justify-center rounded-xl bg-indigo-600 px-6 py-3 text-sm font-black uppercase tracking-wider text-white shadow-lg shadow-indigo-600/20 hover:bg-indigo-500 hover:shadow-indigo-650/30 transition-all focus-visible:outline focus-visible:outline-2"
        >
          View Available Pricing Tiers
        </button>
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

  const contactEff = effectiveLimit(subscription.contactLimit, subscription.contactLimitAddon);
  const contactUsage = typeof subscription.contactCount === "number" ? subscription.contactCount : 0;
  const percentage = Math.min((contactUsage / Math.max(contactEff, 1)) * 100, 100);

  return (
    <section
      className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white/70 shadow-sm backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/60 mb-8 before:absolute before:inset-y-0 before:left-0 before:w-1.5 before:bg-gradient-to-b before:from-blue-500 before:to-indigo-600"
      aria-labelledby="current-sub-heading"
    >
      <div className="p-6 sm:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Column: Plan Main Details & Progress */}
          <div className="lg:col-span-7 flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500/10 to-indigo-500/10 text-blue-500 dark:text-blue-400 shadow-sm">
                  <Zap className="h-7 w-7" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-550">
                      Current subscription
                    </span>
                  </div>
                  <h2
                    id="current-sub-heading"
                    className="text-2xl font-black text-slate-900 dark:text-slate-50 tracking-tight sm:text-3xl"
                  >
                    {planName}
                  </h2>
                  {internalName && internalName !== planName && (
                    <p className="text-sm text-slate-500 dark:text-slate-400 font-medium mt-0.5">{internalName}</p>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap gap-2.5 pt-1">
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ring-1 ring-inset ${badgeClass}`}
                >
                  <ShieldCheck className="h-3.5 w-3.5" />
                  {badgeLabel}
                </span>
                <span className="inline-flex items-center rounded-full bg-indigo-50 px-3 py-1 text-xs font-bold text-indigo-700 ring-1 ring-inset ring-indigo-600/10 dark:bg-indigo-950/40 dark:text-indigo-300 dark:ring-indigo-500/25">
                  {isRecurring ? "Recurring (Razorpay)" : "One-time billing"}
                </span>
                {isRecurring && (
                  <span className="inline-flex items-center rounded-full bg-slate-50 px-3 py-1 text-xs font-bold text-slate-600 ring-1 ring-inset ring-slate-200 dark:bg-slate-800 dark:text-slate-350 dark:ring-slate-700">
                    Status: {rzpStatus}
                  </span>
                )}
              </div>
            </div>

            {/* Beautiful Custom Usage Progress Bar */}
            <div className="rounded-2xl border border-slate-100 dark:border-slate-800/85 bg-slate-50/50 dark:bg-slate-950/20 p-5">
              <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                <span>Contacts uploaded</span>
                <span className="tabular-nums font-extrabold text-slate-800 dark:text-slate-200">
                  {contactUsage.toLocaleString()} / {contactEff === 999999 ? "Unlimited" : contactEff.toLocaleString()}
                </span>
              </div>
              {contactEff !== 999999 ? (
                <>
                  <div className="relative mt-3 h-2.5 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden shadow-inner">
                    <div 
                      className="absolute left-0 top-0 h-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 transition-all duration-500 shadow-sm" 
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <div className="mt-2.5 flex items-center justify-between text-xs font-bold text-slate-400 dark:text-slate-500">
                    <span>{daysLine}</span>
                    <span className="text-blue-500 dark:text-blue-400">{percentage.toFixed(0)}% utilized</span>
                  </div>
                </>
              ) : (
                <p className="mt-2 text-xs font-medium text-slate-500 dark:text-slate-450">
                  You have unlimited contact uploads under this plan assignment.
                </p>
              )}
            </div>

            {/* Left Column Navigation Actions */}
            <nav
              className="flex flex-wrap gap-3 pt-2"
              aria-label="Subscription actions"
            >
              <Link
                to="/billing-history"
                className="inline-flex items-center justify-center rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm shadow-indigo-600/10 hover:bg-indigo-500 hover:shadow-indigo-650/20 transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
              >
                Billing history
              </Link>
              <Link
                to="/addons/buy"
                className="inline-flex items-center justify-center rounded-xl border border-slate-350 bg-white px-5 py-2.5 text-sm font-bold text-slate-700 shadow-sm hover:bg-slate-50 hover:text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-750 dark:hover:text-white transition-all"
              >
                Buy add-ons
              </Link>
            </nav>
          </div>

          {/* Right Column: Information Sub-cards Grid */}
          <div className="lg:col-span-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-1">
            
            {/* Term Start Card */}
            <div className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-white/40 dark:bg-slate-900/40 p-4 flex items-start gap-3.5 hover:border-slate-200 dark:hover:border-slate-700 transition-colors">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-500/10 text-blue-500 dark:text-blue-400">
                <Calendar className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Current Term Start
                </span>
                <p className="mt-0.5 text-sm font-semibold text-slate-800 dark:text-slate-100">
                  {formatDateDisplay(subscription.startDate)}
                </p>
              </div>
            </div>

            {/* Renewal Date Card */}
            <div className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-white/40 dark:bg-slate-900/40 p-4 flex items-start gap-3.5 hover:border-slate-200 dark:hover:border-slate-700 transition-colors">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50/20 text-indigo-500 dark:text-indigo-400">
                <Calendar className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Renewal / End Date
                </span>
                <p className="mt-0.5 text-sm font-semibold text-slate-800 dark:text-slate-100">
                  {formatDateDisplay(subscription.expiryDate)}
                </p>
              </div>
            </div>

            {/* Subscription ID / Billing Info Card */}
            <div className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-white/40 dark:bg-slate-900/40 p-4 flex items-start gap-3.5 hover:border-slate-200 dark:hover:border-slate-700 transition-colors sm:col-span-2 lg:col-span-1">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-500/10 text-purple-500 dark:text-purple-400">
                <Hash className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Razorpay Subscription ID
                </span>
                {isRecurring ? (
                  <div className="mt-1 flex flex-wrap items-center gap-2">
                    <span
                      className="font-mono text-xs text-slate-700 dark:text-slate-300 bg-slate-100/50 dark:bg-slate-950/40 px-1.5 py-0.5 rounded"
                      title={razorpayId}
                    >
                      {truncateMiddleId(razorpayId)}
                    </span>
                    <button
                      type="button"
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 transition-colors"
                      onClick={() =>
                        copyToClipboard(razorpayId, "Razorpay subscription")
                      }
                      aria-label="Copy Razorpay subscription ID"
                    >
                      <Copy className="h-3 w-3" />
                      Copy
                    </button>
                    {razorpayShortUrl ? (
                      <a
                        href={razorpayShortUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 transition-colors"
                      >
                        <ExternalLink className="h-3 w-3" />
                        Portal
                      </a>
                    ) : null}
                  </div>
                ) : (
                  <p className="mt-0.5 text-sm font-semibold text-slate-500 dark:text-slate-450">
                    Not on recurring billing
                  </p>
                )}
              </div>
            </div>

          </div>

        </div>
      </div>
    </section>
  );
}
