import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getPricePlans } from "../../../features/actions/pricePlan";
import PlanCard from "./PlanCard";
import useUserSubscription from "../../../hooks/useUserSubscription";
import ComponentGuard from "../../../components/AccessControl/ComponentGuard";
import useRoles from "../../../hooks/useRoles";
import { Link } from "react-router-dom";
import { resetPricePlanSuccess } from "../../../features/slices/pricePlan";
import PlanInactiveModal from "./PlanInactiveModal";
import { globalButton } from "../../../utils/style";
import SubscriptionOverviewPanel from "./SubscriptionOverviewPanel";
import SubscriptionEntitlementsTable from "./SubscriptionEntitlementsTable";

const ViewPlans = () => {
  const roles = useRoles();
  const { userData } = useSelector((state) => state.auth);
  const {
    data: subscription,
    isLoading: subscriptionLoading,
    isError: subscriptionError,
    error: subscriptionQueryError,
  } = useUserSubscription();
  const { planData, isSuccess, isLoading } = useSelector(
    (state) => state.pricePlans
  );
  const dispatch = useDispatch();

  const [modalData, setModalData] = useState(null);
  const [planType, setPlanType] = useState("active");
  const [planDuration, setPlanDuration] = useState("monthly"); // monthly | yearly | custom

  const isAdminOnly =
    userData &&
    roles.isAdmin(userData.role) &&
    !roles.isSuperAdmin(userData.role);

  const durationTabs = useMemo(() => {
    const tabs = [
      { key: "monthly", label: "Monthly" },
      { key: "yearly", label: "Yearly" },
    ];

    if (userData && roles?.isSuperAdmin?.(userData.role)) {
      tabs.push({ key: "custom", label: "Custom" });
    }

    return tabs;
  }, [roles, userData]);

  // Ensure selected tab is valid for current role
  useEffect(() => {
    if (!durationTabs.find((tab) => tab.key === planDuration)) {
      setPlanDuration(durationTabs[0]?.key || "monthly");
    }
  }, [durationTabs, planDuration]);

  const planDataFiltered = useMemo(() => {
    if (!Array.isArray(planData) || !userData || !roles) return [];

    const durationType = planDuration;
    const durationFilteredPlans = planData.filter((item) => {
      const durationConfig = item.planDurationConfig?.[durationType];
      return durationConfig?.isEnabled === true;
    });

    if (
      roles.isSuperAdmin(userData.role) ||
      roles.isAdmin(userData.role)
    ) {
      return durationFilteredPlans;
    }
    if (!subscription || !subscription.plan) return [];
    const plan = durationFilteredPlans.find(
      (p) => p._id === subscription.plan._id
    );
    if (!plan) return [];
    return [plan];
  }, [userData, planData, roles, subscription, planDuration]);

  useEffect(() => {
    dispatch(getPricePlans({ isActive: planType }));
  }, [planType]);

  useEffect(() => {
    if (isSuccess) {
      dispatch(getPricePlans({ isActive: planType }));
      resetPricePlanSuccess();
    }
  }, [isSuccess]);

  const currentPlanId =
    userData && roles.isSuperAdmin(userData.role)
      ? null
      : subscription?.plan?._id;

  const showEntitlementsBlock =
    isAdminOnly &&
    !subscriptionLoading &&
    !subscriptionError &&
    subscription;

  return (
    <div className="py-14 px-4 md:px-8 flex flex-col items-center">
      <div className="w-full max-w-screen-2xl space-y-8">
        {isAdminOnly && (
          <header className="px-1">
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
              Plans &amp; subscription
            </h1>
            <p className="mt-2 text-gray-600 max-w-3xl text-sm sm:text-base">
              Review your organization&apos;s subscription status, limits, and
              billing provider. Compare plans and upgrade when you need more
              capacity.
            </p>
          </header>
        )}

        {isAdminOnly && (
          <>
            <SubscriptionOverviewPanel
              subscription={subscription}
              isLoading={subscriptionLoading}
              isError={subscriptionError}
              error={subscriptionQueryError}
            />
            {showEntitlementsBlock && (
              <SubscriptionEntitlementsTable subscription={subscription} />
            )}
          </>
        )}

        <div className="p-6 bg-gray-50 rounded-lg w-full border border-gray-200/80 shadow-sm">
          <div className="flex gap-4 justify-between items-center flex-wrap">
            <h2 className="text-2xl font-bold text-gray-700">
              {isAdminOnly ? "Plan options" : "Manage Plans"}
            </h2>
          </div>

          <div className="flex justify-center my-6">
            <div className="inline-flex rounded-lg border border-gray-200 bg-white shadow-sm overflow-hidden">
              {durationTabs.map((tab) => {
                const isActive = tab.key === planDuration;
                return (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setPlanDuration(tab.key)}
                    className={`px-4 py-2 text-sm font-semibold transition-colors ${
                      isActive
                        ? "bg-indigo-600 text-white"
                        : "text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4 sm:gap-5">
            <div className="col-span-full flex justify-end items-end pt-6">
              <ComponentGuard allowedRoles={[roles.SUPER_ADMIN]}>
                <div className="flex gap-5 w-full justify-between flex-wrap">
                  <div className="flex gap-5 justify-between w-full md:w-auto">
                    <Link to="/plans/order">
                      <button type="button" className={globalButton}>
                        Change Order
                      </button>
                    </Link>
                    <Link to="/plans/addPlan">
                      <button type="button" className={globalButton}>
                        Add Plan
                      </button>
                    </Link>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setPlanType(planType === "active" ? "inactive" : "active");
                    }}
                    disabled={isLoading}
                    className={globalButton}
                  >
                    {planType === "active" ? "Inactive" : "Active"} Plans
                  </button>
                </div>
              </ComponentGuard>
            </div>
            {planDataFiltered?.map((item, idx) => {
              const samePlanCheckoutDisabled =
                isAdminOnly &&
                subscription?.expiryDate &&
                subscription?.plan?._id &&
                String(subscription.plan._id) === String(item._id) &&
                new Date(subscription.expiryDate).getTime() > Date.now();

              return (
                <div key={item?._id ?? idx} className="">
                  <PlanCard
                    plan={item}
                    planType={planType}
                    setModalData={setModalData}
                    isMenuVisible={true}
                    currentPlan={currentPlanId}
                    isYearly={planDuration === "yearly"}
                    samePlanCheckoutDisabled={samePlanCheckoutDisabled}
                    subscriptionExpiresAt={
                      samePlanCheckoutDisabled
                        ? subscription.expiryDate
                        : null
                    }
                  />
                </div>
              );
            })}
          </div>
          {modalData && (
            <PlanInactiveModal
              setModalData={setModalData}
              modalData={modalData}
              planType={planType}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default ViewPlans;
