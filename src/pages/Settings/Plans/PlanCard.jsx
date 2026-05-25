import { Link } from "react-router-dom";
import {
  Check,
  ContactRound,
  Copy,
  CreditCard,
  Info,
  LogOut,
  MoreVertical,
  Pencil,
  Repeat2,
  Users,
  X,
} from "lucide-react";
import ComponentGuard from "../../../components/AccessControl/ComponentGuard";
import { copyToClipboard, errorToast } from "../../../utils/extra";
import { useDispatch, useSelector } from "react-redux";
import { checkout } from "../../../features/actions/razorpay";
import useRoles from "../../../hooks/useRoles";
import { Button } from "../../../components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../../../components/ui/dropdown-menu";
import { cn } from "../../../lib/utils";

function checkoutErrorMessage(err) {
  const raw = err?.payload != null ? err.payload : err;
  const fromAxios = raw?.response?.data?.message;
  if (typeof fromAxios === "string") return fromAxios;
  if (Array.isArray(fromAxios) && fromAxios[0]) return String(fromAxios[0]);
  if (typeof raw?.message === "string") return raw.message;
  return "Checkout failed. Please try again.";
}

const PlanCard = (props) => {
  const roles = useRoles();
  const dispatch = useDispatch();
  const { userData } = useSelector((state) => state.auth);
  const {
    plan,
    isMenuVisible = false,
    isSelectVisible = false,
    isYearly = false,
    handlePlanSelection = (id, billingData) => {
      dispatch(checkout({ plan: id, durationType: billingData.durationType }))
        .unwrap()
        .then((payload) => {
          const order = payload?.result;
          const selectedPlanDoc = payload?.planData;
          if (!order?.id || !selectedPlanDoc?._id) return;

          const envMode = import.meta.env.VITE_REACT_APP_WORKING_ENVIRONMENT;
          const callbackBase =
            envMode === "development"
              ? import.meta.env.VITE_REACT_APP_API_BASE_URL_DEVELOPMENT
              : import.meta.env.VITE_REACT_APP_API_BASE_URL_MAIN_PRODUCTION;
          if (
            typeof callbackBase !== "string" ||
            callbackBase.trim().length === 0
          ) {
            errorToast(
              "Callback URL is not configured. Please verify API base URL env settings."
            );
            return;
          }
          if (!userData?._id) {
            errorToast("Unable to start checkout: missing user context.");
            return;
          }
          if (
            typeof import.meta.env.VITE_RAZORPAY_KEY_ID !== "string" ||
            import.meta.env.VITE_RAZORPAY_KEY_ID.trim().length === 0
          ) {
            errorToast(
              "Razorpay key is missing. Please verify frontend environment configuration."
            );
            return;
          }
          const callbackUrl = `${callbackBase}/razorpay/payment-success?planId=${selectedPlanDoc._id}&adminId=${userData._id}&durationType=${billingData?.durationType}`;

          const isSubscription =
            payload?.checkoutMode === "subscription" ||
            order?.entity === "subscription" ||
            (typeof order?.id === "string" && order.id.startsWith("sub_"));

          if (!isSubscription) {
            errorToast(
              "Recurring checkout is required. This plan duration is not configured for Razorpay subscriptions."
            );
            return;
          }

          const options = {
            key: import.meta.env.VITE_RAZORPAY_KEY_ID,
            subscription_id: order.id,
            name: selectedPlanDoc?.name || "Subscription",
            description:
              selectedPlanDoc?.internalName || selectedPlanDoc?.name || "",
            callback_url: callbackUrl,
            theme: { color: "#3b82f6" },
          };

          const rzp = new Razorpay(options);
          rzp.open();
        })
        .catch((e) => {
          errorToast(checkoutErrorMessage(e));
        });
    },
    selectedPlan = null,
    currentPlan = null,
    setModalData = () => {},
    planType = "active",
    samePlanCheckoutDisabled = false,
    subscriptionExpiresAt = null,
  } = props;

  const {
    name,
    internalName,
    amount,
    isActive,
    employeeCount,
    contactLimit,
    toggleLimit,
    subscriptionCount,
    attendeeTableConfig,
    employeeInactivity,
    setAlarm,
    whatsappNotificationOnAlarms,
    calendarFeatures,
    productRevenueMetrics,
    renewalNotAllowed,
    customRibbon,
    customRibbonColor,
    assignmentMetrics,
  } = plan;

  const { isCustomOptionsAllowed = false } = attendeeTableConfig || {};

  const calculateDisplayPrice = () => {
    const durationType = isYearly ? "yearly" : "monthly";
    const durationConfig = plan.planDurationConfig?.[durationType];

    if (!durationConfig) return amount;

    let basePrice = durationConfig.price || amount;

    if (durationConfig.discountType === "flat") {
      basePrice = Math.max(basePrice - (durationConfig.discountValue || 0), 0);
    } else if (durationConfig.discountType === "percent") {
      const discountValue = durationConfig.discountValue || 0;
      basePrice = Math.max(basePrice * ((100 - discountValue) / 100), 0);
    }

    if (isYearly) {
      return basePrice / 12;
    }

    return basePrice;
  };

  const displayPrice = calculateDisplayPrice() || 0;

  const calculateSavings = () => {
    if (!isYearly) return 0;

    const monthlyConfig = plan.planDurationConfig?.monthly;
    const yearlyConfig = plan.planDurationConfig?.yearly;

    if (!monthlyConfig || !yearlyConfig) return 0;

    const monthlyPrice = monthlyConfig.price || amount;
    const yearlyPrice = yearlyConfig.price || amount;

    const monthlyTotal = monthlyPrice * 12;
    const yearlyTotal = yearlyPrice;

    return monthlyTotal - yearlyTotal;
  };

  const savings = calculateSavings();

  const ribbonStyle = customRibbonColor?.trim()
    ? { backgroundColor: customRibbonColor.trim() }
    : undefined;

  const currentPlanUntilLabel =
    samePlanCheckoutDisabled && subscriptionExpiresAt
      ? new Date(subscriptionExpiresAt).toLocaleDateString(undefined, {
          year: "numeric",
          month: "short",
          day: "numeric",
        })
      : null;

  const choosePlanLabel = samePlanCheckoutDisabled
    ? currentPlanUntilLabel
      ? `Current plan (until ${currentPlanUntilLabel})`
      : "Current plan"
    : selectedPlan === null || selectedPlan !== plan?._id
      ? "Choose plan"
      : "Selected";

  return (
    <div
      className={cn(
        "group relative flex h-full w-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all duration-300",
        "hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-xl",
        "dark:border-slate-700 dark:bg-slate-800/90 dark:hover:border-slate-600 dark:hover:shadow-blue-950/20",
        "sm:rounded-2xl",
      )}
    >
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-sky-400 opacity-90"
        aria-hidden
      />

      <ComponentGuard
        allowedRoles={[roles.SUPER_ADMIN]}
        conditions={[isMenuVisible]}
      >
        <div className="absolute right-2 top-2 z-20 sm:right-3 sm:top-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-9 w-9 rounded-xl text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-slate-100"
                aria-label="Plan actions"
              >
                <MoreVertical className="h-5 w-5" strokeWidth={2} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-[11rem] rounded-xl border-slate-200 p-1 dark:border-slate-600">
              <DropdownMenuItem asChild className="cursor-pointer rounded-lg">
                <Link to={`/plans/editPlan/${plan?._id}`} state={plan} className="flex items-center gap-2">
                  <Pencil className="h-4 w-4 text-blue-500" />
                  Edit plan
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem
                className="cursor-pointer rounded-lg text-red-600 focus:bg-red-50 focus:text-red-700 dark:focus:bg-red-950/40 dark:focus:text-red-400"
                onClick={() => setModalData(plan)}
              >
                <LogOut className="h-4 w-4" />
                {planType === "active" ? "Deactivate" : "Activate"} plan
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </ComponentGuard>

      <div className="flex flex-1 flex-col gap-4 p-4 pt-5 sm:gap-5 sm:p-6 sm:pt-6">
        <div className="flex gap-3 sm:gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-500/10 transition-transform duration-300 ease-out group-hover:scale-105 dark:bg-blue-500/15 sm:h-14 sm:w-14">
            <CreditCard className="h-6 w-6 text-blue-500 dark:text-blue-400 sm:h-7 sm:w-7" aria-hidden />
          </div>

          <div className="min-w-0 flex-1 pr-8 sm:pr-10">
            <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-1">
              <div className="min-w-0">
                <h3
                  className="truncate text-lg font-black tracking-tight text-slate-900 dark:text-slate-50 sm:text-xl"
                  title={name}
                >
                  {name}
                </h3>
                <ComponentGuard allowedRoles={[roles.SUPER_ADMIN]}>
                  <p className="mt-0.5 truncate text-sm font-semibold text-slate-500 dark:text-slate-400">
                    {internalName || name}
                  </p>
                </ComponentGuard>
              </div>
              <div className="shrink-0 text-right">
                <p className="font-black tracking-tight text-blue-500 dark:text-blue-400">
                  <span className="text-base">₹</span>
                  <span className="text-2xl sm:text-3xl">{displayPrice.toFixed(0)}</span>
                </p>
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  / month
                  {isYearly ? " · billed yearly" : ""}
                </p>
              </div>
            </div>

            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              {customRibbon ? (
                <span
                  className={cn(
                    "inline-flex max-w-full items-center gap-1 truncate rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white",
                    !customRibbonColor?.trim() && "bg-indigo-500",
                  )}
                  style={ribbonStyle}
                >
                  {customRibbon}
                </span>
              ) : null}
              {!isActive ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-red-500/15 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-red-600 dark:bg-red-500/20 dark:text-red-400">
                  Inactive
                  <Info className="h-3 w-3" aria-hidden />
                </span>
              ) : null}
              {currentPlan === plan?._id ? (
                <span className="inline-flex items-center rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400">
                  Current plan
                </span>
              ) : null}
              {plan.planType === "custom" ? (
                <span className="inline-flex items-center rounded-full bg-violet-500/15 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-violet-700 dark:bg-violet-400/90 dark:text-violet-200">
                  Custom
                </span>
              ) : null}
            </div>

            <ComponentGuard allowedRoles={[roles.SUPER_ADMIN]}>
              <p className="mt-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
                Subscribers{" "}
                <span className="font-black text-slate-800 dark:text-slate-200">{subscriptionCount}</span>
              </p>
            </ComponentGuard>

            {isYearly && savings > 0 ? (
              <p className="mt-1 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                Save ₹{savings.toFixed(0)}/year vs monthly
              </p>
            ) : null}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          <MetricPill
            icon={<Users className="h-4 w-4 text-blue-500 dark:text-blue-400" aria-hidden />}
            label="Employees"
            value={employeeCount}
          />
          <MetricPill
            icon={<ContactRound className="h-4 w-4 text-blue-500 dark:text-blue-400" aria-hidden />}
            label="Contact uploads"
            value={contactLimit}
          />
          <MetricPill
            icon={<Repeat2 className="h-4 w-4 text-blue-500 dark:text-blue-400" aria-hidden />}
            label="Toggle limit"
            value={toggleLimit}
          />
        </div>

        <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-3 dark:border-slate-700/80 dark:bg-slate-900/50 sm:p-4">
          <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
            Included features
          </p>
          <ul className="grid grid-cols-1 gap-x-4 gap-y-1.5 sm:grid-cols-2">
            <FeatureRow label="Custom options" enabled={isCustomOptionsAllowed} />
            <FeatureRow label="Employee inactivity" enabled={employeeInactivity} />
            <FeatureRow label="Set alarm" enabled={setAlarm} />
            <FeatureRow label="WhatsApp notifications" enabled={whatsappNotificationOnAlarms} />
            <FeatureRow label="Calendar & alarm history" enabled={calendarFeatures} />
            <FeatureRow label="Product revenue metrics" enabled={productRevenueMetrics} />
            <FeatureRow label="Assignment metrics" enabled={assignmentMetrics} />
          </ul>
        </div>

        {(roles.isSuperAdmin(userData?.role) || !renewalNotAllowed) && (
          <div className="mt-auto flex flex-col gap-3 border-t border-slate-100 pt-4 dark:border-slate-700/80">
            {isActive ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-9 w-full gap-2 rounded-xl border-slate-200 font-mono text-xs font-semibold text-slate-700 dark:border-slate-600 dark:text-slate-200"
                onClick={() => copyToClipboard(plan?._id, "Plan")}
              >
                <span className="truncate">{plan?._id}</span>
                <Copy className="h-4 w-4 shrink-0 opacity-70" />
              </Button>
            ) : null}

            <ComponentGuard allowedRoles={isSelectVisible ? [] : [roles.ADMIN]}>
              {isActive ? (
                <Button
                  type="button"
                  disabled={samePlanCheckoutDisabled}
                  title={
                    samePlanCheckoutDisabled
                      ? "You already have this plan until the term ends."
                      : undefined
                  }
                  onClick={() => {
                    if (samePlanCheckoutDisabled) return;
                    const durationType = isYearly ? "yearly" : "monthly";
                    const billingData = {
                      durationType,
                      totalAmount: displayPrice * (isYearly ? 12 : 1),
                    };
                    handlePlanSelection(plan?._id, billingData);
                  }}
                  className={cn(
                    "h-11 w-full rounded-xl text-sm font-bold shadow-lg transition-all",
                    samePlanCheckoutDisabled
                      ? "cursor-not-allowed bg-slate-400 text-white shadow-none hover:bg-slate-400"
                      : selectedPlan === plan?._id
                        ? "bg-emerald-600 text-white shadow-emerald-500/25 hover:bg-emerald-700 dark:shadow-emerald-900/30"
                        : "border-none bg-blue-500 text-white shadow-blue-500/20 hover:bg-blue-600 hover:shadow-blue-500/30 dark:shadow-blue-900/40",
                  )}
                >
                  {choosePlanLabel}
                </Button>
              ) : null}
            </ComponentGuard>
          </div>
        )}
      </div>
    </div>
  );
};

function MetricPill({ icon, label, value }) {
  return (
    <div className="flex items-center gap-2.5 rounded-xl border border-slate-200/90 bg-white px-3 py-2.5 dark:border-slate-600 dark:bg-slate-900/60">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-500/10 dark:bg-blue-500/15">
        {icon}
      </span>
      <div className="min-w-0">
        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">{label}</p>
        <p className="truncate text-sm font-black text-slate-900 dark:text-slate-50">{value}</p>
      </div>
    </div>
  );
}

function FeatureRow({ label, enabled }) {
  return (
    <li className="flex items-center gap-2 text-sm">
      <span
        className={cn(
          "flex h-5 w-5 shrink-0 items-center justify-center rounded-md",
          enabled
            ? "bg-emerald-500/15 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400"
            : "bg-slate-200/80 text-slate-500 dark:bg-slate-700 dark:text-slate-400",
        )}
      >
        {enabled ? <Check className="h-3.5 w-3.5 stroke-[3]" /> : <X className="h-3.5 w-3.5 stroke-[2.5]" />}
      </span>
      <span
        className={cn(
          "min-w-0 font-medium leading-snug",
          enabled ? "text-slate-800 dark:text-slate-200" : "text-slate-500 dark:text-slate-500",
        )}
      >
        {label}
      </span>
    </li>
  );
}

export default PlanCard;
