import React, { lazy, Suspense, useState } from "react";
import { Link } from "react-router-dom";
import ComponentGuard from "../../../components/AccessControl/ComponentGuard";
import { copyToClipboard, errorToast } from "../../../utils/extra";

function checkoutErrorMessage(err) {
  const raw = err?.payload != null ? err.payload : err;
  const fromAxios = raw?.response?.data?.message;
  if (typeof fromAxios === "string") return fromAxios;
  if (Array.isArray(fromAxios) && fromAxios[0]) return String(fromAxios[0]);
  if (typeof raw?.message === "string") return raw.message;
  return "Checkout failed. Please try again.";
}
import { useDispatch, useSelector } from "react-redux";
import { checkout } from "../../../features/actions/razorpay";
import useRoles from "../../../hooks/useRoles";
import ModalFallback from "../../../components/Fallback/ModalFallback";
import { createPortal } from "react-dom";
const PlanSelectorModal = lazy(() => import("./PlanSelectorModal"));
import { GreenCheckIcon, InfoIcon, PencilEditIcon, RedCrossIcon, RedLogoutIcon, ThreeDotsIcon } from "../../../components/SVGs";

import BlueToggleIcon from '../../../components/SVGs/blue-toggle.svg'
import BlueContactIcon from '../../../components/SVGs/blue-contacts.svg'
import BlueUsersIcon from '../../../components/SVGs/blue-users.svg'
import BlueCopyIcon from '../../../components/SVGs/blue-copy.svg'

const PlanCard = (props) => {
  const roles = useRoles();
  const dispatch = useDispatch();
  const { userData } = useSelector((state) => state.auth);
  const [menuOpen, setMenuOpen] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [durationModalOpen, setDurationModalOpen] = useState(false);
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
          const callbackUrl = `${callbackBase}/razorpay/payment-success?planId=${selectedPlanDoc._id}&adminId=${userData?._id}&durationType=${billingData?.durationType}`;

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
            theme: { color: "#F37254" },
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

  // Calculate display price based on selected duration
  const calculateDisplayPrice = () => {
    const durationType = isYearly ? "yearly" : "monthly";
    const durationConfig = plan.planDurationConfig?.[durationType];
    
    if (!durationConfig) return amount;
    
    let basePrice = durationConfig.price || amount;
    
    // Apply discount
    if (durationConfig.discountType === "flat") {
      basePrice = Math.max(basePrice - (durationConfig.discountValue || 0), 0);
    } else if (durationConfig.discountType === "percent") {
      const discountValue = durationConfig.discountValue || 0;
      basePrice = Math.max(basePrice * ((100 - discountValue) / 100), 0);
    }
    
    // If yearly is selected, convert to monthly equivalent for display
    if (isYearly) {
      return basePrice / 12;
    }
    
    return basePrice;
  };

  const displayPrice = calculateDisplayPrice() || 0;
  
  // Calculate savings for yearly plans
  const calculateSavings = () => {
    if (!isYearly) return 0;
    
    const monthlyConfig = plan.planDurationConfig?.get?.("monthly");
    const yearlyConfig = plan.planDurationConfig?.get?.("yearly");
    
    if (!monthlyConfig || !yearlyConfig) return 0;
    
    const monthlyPrice = monthlyConfig.price || amount;
    const yearlyPrice = yearlyConfig.price || amount;
    
    const monthlyTotal = monthlyPrice * 12;
    const yearlyTotal = yearlyPrice;
    
    return monthlyTotal - yearlyTotal;
  };
  
  const savings = calculateSavings();

  const currentPlanUntilLabel =
    samePlanCheckoutDisabled && subscriptionExpiresAt
      ? new Date(subscriptionExpiresAt).toLocaleDateString(undefined, {
          year: "numeric",
          month: "short",
          day: "numeric",
        })
      : null;

  return (
    <div className="relative mx-auto border border-gray-200 p-6 overflow-hidden rounded-xl shadow-lg max-w-sm bg-white m-4 transition-all duration-300 hover:shadow-xl">
      <ComponentGuard
        allowedRoles={[roles.SUPER_ADMIN]}
        conditions={[isMenuVisible]}
      >
        <div className="absolute top-2 right-2">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="text-gray-500 hover:text-gray-800 focus:outline-none"
          >
            <img src={ThreeDotsIcon} alt="Edit" className="min-h-5 h-5 w-5 min-w-5" />
          </button>
          {menuOpen && (
            <div className="absolute right-0 mt-2 space-y-1 p-1 whitespace-nowrap bg-white border border-gray-200 rounded-md shadow-lg z-10">
              <Link to={`/plans/editPlan/${plan?._id}`} state={plan}>
                <button className="flex items-center gap-2 rounded-md shadow-sm w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-200 ">
                  
                  <img src={PencilEditIcon} alt="Edit" className="min-h-6 h-6 w-6 min-w-6" />
                  Edit Plan
                </button>
              </Link>

              <button
                onClick={() => setModalData(plan)}
                className="flex gap-2 items-center rounded-md shadow-sm w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-200 "
              >
                <img
            src={RedLogoutIcon}
            alt="Toggle Status"
            className="min-h-6 h-6 w-6 min-w-6"
          />
                {planType === "active" ? "Deactivate" : "Activate"} Plan
              </button>
            </div>
          )}
        </div>
      </ComponentGuard>

      <div className="absolute top-2 left-0 flex flex-col gap-2">
        {customRibbon && (
          <div
            className={` flex gap-2 ${
              customRibbonColor ? `bg-[${customRibbonColor.trim()}]` : "bg-indigo-500"
            }  text-white text-xs px-3 py-1 rounded-r-md  items-center`}
          >
            {customRibbon}
          </div>
        )}

        {!isActive && (
          <div
            title="Inactive Plan, renewal not allowed. Please contact Administrator."
            className=" flex gap-2 bg-red-500 text-white text-xs px-3 py-1 rounded-r-md  items-center"
          >
            Inactive Plan <img src={InfoIcon} alt="Edit" className="min-h-4  h-4 w-4  min-w-4" />
          </div>
        )}
      </div>

      {currentPlan === plan?._id && (
        <div
          title="Current Plan"
          className="absolute top-2 right-0 flex gap-2 bg-green-500 text-white text-xs px-3 py-1 rounded-l-md  items-center"
        >
          Current Plan
        </div>
      )}

      {plan.planType === "custom" && (
        <div
          title="Current Plan"
          className="absolute top-10 right-0 bg-indigo-500 text-white text-xs px-3 py-1 rounded-l-md  items-center"
        >
          Custom Plan
        </div>
      )}

      {/* Card Content */}
      <div className="text-center mt-2 mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">{name}</h2>

        <ComponentGuard allowedRoles={[roles.SUPER_ADMIN]}>
          <h2 className="text-xl font-semibold text-gray-600 mb-2">
            {internalName || name}
          </h2>
          <div className="flex items-center gap-2 px-3 justify-center">
            <span className="text-sm font-medium text-gray-500">
              Subscribers
            </span>
            <span className="text-lg font-semibold text-gray-700">
              {subscriptionCount}
            </span>
          </div>
        </ComponentGuard>

        <p className="text-4xl font-extrabold text-blue-600">
          {"\u20B9"}
          {displayPrice.toFixed(0)}
          <span className="text-base font-normal text-gray-500">
            /month
            {isYearly && (
              <span className="block text-xs text-green-600 font-semibold">
                (Billed Yearly)
                {savings > 0 && (
                  <span className="block text-xs text-green-600 font-bold">
                    Save ₹{savings.toFixed(0)}/year
                  </span>
                )}
              </span>
            )}
          </span>
        </p>
      </div>

      <div className="space-y-4 mb-6">
        <Feature icon={<img src={BlueUsersIcon} alt="Edit" className="min-h-5 min-w-5 h-5 w-5 " />} label={`${employeeCount} employees`} />
        <Feature
          icon={<img src={BlueContactIcon} alt="Edit" className="min-h-5 min-w-5 h-5 w-5 " />}
          label={`${contactLimit} contact uploads`}
        />
        <Feature icon={<img src={BlueToggleIcon} alt="Edit" className="min-h-4 min-w-4 h-4 w-4 " />} label={`${toggleLimit} Toggle Limit`} />
      </div>

      <div className="border-t border-gray-200 pt-4 space-y-2">
        <Feature label="Custom Options" enabled={isCustomOptionsAllowed} />
        <Feature
          label="Employee Inactivity Tracking"
          enabled={employeeInactivity}
        />
        <Feature label="Set Alarm" enabled={setAlarm} />
        <Feature
          label="Whatsapp Notifications"
          enabled={whatsappNotificationOnAlarms}
        />
        <Feature label="Calendar & Alarm History" enabled={calendarFeatures} />
        <Feature
          label="Product Revenue Metrics"
          enabled={productRevenueMetrics}
        />
        <Feature
          label="Employee Assignment Metrics"
          enabled={assignmentMetrics}
        />
      </div>

      {(roles.isSuperAdmin(userData?.role) || !renewalNotAllowed) && (
        <>
          {/* Copy Plan ID Button */}
          {isActive && (
            <div className="flex justify-center text-[#1976d2] items-center mt-4">
              <button
                onClick={() => copyToClipboard(plan?._id, "Plan")}
                className="flex gap-2 border px-2 py-1 rounded-md border-[#1976d2]"
              >
                {plan?._id}
                <img src={BlueCopyIcon} alt="Edit" className="min-h-6 h-6 w-6 min-w-6" />
              </button>
            </div>
          )}

          <ComponentGuard allowedRoles={isSelectVisible ? [] : [roles.ADMIN]}>
            {isActive && (
              <button
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
                    durationType: durationType,
                    totalAmount: displayPrice * (isYearly ? 12 : 1), // Convert back to actual billing amount
                  };
                  handlePlanSelection(plan?._id, billingData);
                }}
                className={`${
                  samePlanCheckoutDisabled
                    ? "bg-gray-400 cursor-not-allowed"
                    : selectedPlan === plan?._id
                      ? "bg-green-600"
                      : "bg-blue-500"
                } w-full mt-6 text-white py-2 px-4 rounded-lg font-semibold ${
                  samePlanCheckoutDisabled ? "" : "hover:bg-green-600"
                } transition-colors duration-300`}
              >
                {samePlanCheckoutDisabled
                  ? currentPlanUntilLabel
                    ? `Current plan (until ${currentPlanUntilLabel})`
                    : "Current plan"
                  : selectedPlan === null
                    ? "Choose Plan"
                    : selectedPlan === plan?._id
                      ? "Selected"
                      : "Choose Plan"}
              </button>
            )}
          </ComponentGuard>
        </>
      )}

      {durationModalOpen &&
        selectedPlan !== plan?._id &&
        createPortal(
          <Suspense fallback={<ModalFallback />}>
            {" "}
            <PlanSelectorModal
              onClose={() => setDurationModalOpen(false)}
              planData={plan}
              onSuccess={(billingData) =>
                handlePlanSelection(plan?._id, billingData)
              }
              setModal={setDurationModalOpen}
            />
          </Suspense>,
          document.body
        )}
    </div>
  );
};

const Feature = ({ label, enabled, icon }) => (
  <div className="flex items-center">
    {icon ? (
      <span className="text-blue-600 mr-2">{icon}</span>
    ) : (
      <span className={`mr-2 ${enabled ? "text-green-500" : "text-red-500"}`}>
        {enabled ? <img src={GreenCheckIcon} alt="Edit" className="min-h-6 h-6 w-6 min-w-6" /> : <img src={RedCrossIcon} alt="Edit" className="min-h-6 min-w-6 h-6 w-6 " />}
      </span>
    )}
    <span className={`${enabled ? "text-gray-800" : "text-gray-500"}`}>
      {label}
    </span>
  </div>
);

export default PlanCard;
