import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { motion } from "framer-motion";
import { CreditCard, ListOrdered, Plus, Sparkles } from "lucide-react";
import { getPricePlans } from "../../../features/actions/pricePlan";
import PlanCard from "./PlanCard";
import useUserSubscription from "../../../hooks/useUserSubscription";
import ComponentGuard from "../../../components/AccessControl/ComponentGuard";
import useRoles from "../../../hooks/useRoles";
import { Link } from "react-router-dom";
import { resetPricePlanSuccess } from "../../../features/slices/pricePlan";
import PlanInactiveModal from "./PlanInactiveModal";
import HubSubpageShell from "../../../components/Layout/HubSubpageShell";
import { Button } from "../../../components/ui/button";

const ViewPlans = () => {
  const roles = useRoles();
  const { userData } = useSelector((state) => state.auth);
  const { data: subscription } = useUserSubscription();
  const { planData, isSuccess, isLoading } = useSelector(
    (state) => state.pricePlans
  );
  const dispatch = useDispatch();

  const [modalData, setModalData] = useState(null);
  const [planType, setPlanType] = useState("active");
  const [planDuration, setPlanDuration] = useState("monthly"); // monthly | yearly | custom

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

    if (roles.isSuperAdmin(userData.role)) return durationFilteredPlans;
    if (!subscription || !subscription.plan) return [];
    const plan = durationFilteredPlans.find((plan) => plan._id === subscription.plan._id);
    if (!plan) return [];
    return [plan];
  }, [userData, planData, roles, subscription, planDuration]);

  useEffect(() => {
    dispatch(getPricePlans({ isActive: planType }));
  }, [planType, dispatch]);

  useEffect(() => {
    if (isSuccess) {
      dispatch(getPricePlans({ isActive: planType }));
      dispatch(resetPricePlanSuccess());
    }
  }, [isSuccess, planType, dispatch]);

  const currentPlanId =
    userData && roles.isSuperAdmin(userData.role)
      ? null
      : subscription?.plan?._id;

  return (
    <HubSubpageShell>
      <motion.header
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        className="mb-8 flex flex-col gap-4 sm:mb-10 lg:flex-row lg:items-start lg:justify-between"
      >
        <div className="flex min-w-0 flex-1 items-start gap-4">
          <motion.div
            aria-hidden
            className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-blue-500/10 dark:bg-blue-500/15"
            initial={{ scale: 0.85, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 380, damping: 22, delay: 0.05 }}
          >
            <CreditCard className="h-7 w-7 text-blue-500 dark:text-blue-400" />
          </motion.div>
          <div className="min-w-0 space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-slate-50 sm:text-3xl">
                Plans
              </h1>
              <Sparkles className="hidden h-5 w-5 text-amber-400 sm:inline sm:h-6 sm:w-6" aria-hidden />
            </div>
            <p className="max-w-xl text-sm font-medium leading-relaxed text-slate-500 dark:text-slate-400">
              Review subscription tiers and billing. Super admins can add plans, change display order, and switch
              between active and inactive lists.
            </p>
          </div>
        </div>
        <ComponentGuard allowedRoles={[roles.SUPER_ADMIN]}>
          <div className="flex w-full flex-col gap-2 sm:flex-row sm:flex-wrap sm:justify-end lg:w-auto lg:shrink-0">
            <Button
              type="button"
              variant="outline"
              className="h-11 gap-2 rounded-xl border-slate-200 font-bold dark:border-slate-600"
              disabled={isLoading}
              onClick={() => {
                setPlanType(planType === "active" ? "inactive" : "active");
              }}
            >
              {planType === "active" ? "Inactive" : "Active"} plans
            </Button>
            <Button
              asChild
              variant="outline"
              className="h-11 gap-2 rounded-xl border-slate-200 font-bold dark:border-slate-600"
            >
              <Link to="/plans/order">
                <ListOrdered className="h-4 w-4" strokeWidth={2.5} />
                Change order
              </Link>
            </Button>
            <Button
              asChild
              className="h-11 gap-2 rounded-xl bg-blue-500 px-5 font-bold text-white shadow-lg shadow-blue-500/20 hover:bg-blue-600 dark:shadow-blue-900/40"
            >
              <Link to="/plans/addPlan">
                <Plus className="h-4 w-4" strokeWidth={2.5} />
                Add plan
              </Link>
            </Button>
          </div>
        </ComponentGuard>
      </motion.header>

      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800/90">
        <div className="border-b border-slate-100 px-5 py-4 dark:border-slate-700 sm:px-6">
          <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
            Billing period
          </h2>
          <div className="mt-4 flex justify-center sm:justify-start">
            <div
              className="inline-flex rounded-xl border border-slate-200/90 bg-slate-100/90 p-1 shadow-inner dark:border-slate-600 dark:bg-slate-900/80"
              role="tablist"
              aria-label="Plan duration"
            >
              {durationTabs.map((tab) => {
                const isActive = tab.key === planDuration;
                return (
                  <button
                    key={tab.key}
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    onClick={() => setPlanDuration(tab.key)}
                    className={`rounded-lg px-4 py-2 text-sm font-bold transition-all ${
                      isActive
                        ? "bg-white text-slate-900 shadow-sm ring-1 ring-slate-200/80 dark:bg-slate-800 dark:text-slate-50 dark:ring-slate-600"
                        : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
                    }`}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="p-5 sm:p-6">
          <div className="grid grid-cols-1 gap-4 sm:gap-5 md:grid-cols-2">
            {planDataFiltered?.map((item) => (
              <div key={item?._id} className="min-w-0">
                <PlanCard
                  plan={item}
                  planType={planType}
                  setModalData={setModalData}
                  isMenuVisible={true}
                  currentPlan={currentPlanId}
                  isYearly={planDuration === "yearly"}
                />
              </div>
            ))}
          </div>

          {planDataFiltered?.length === 0 && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/80 py-14 dark:border-slate-600 dark:bg-slate-900/40"
            >
              <CreditCard className="mb-2 h-10 w-10 text-slate-300 dark:text-slate-600" />
              <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">No plans to show</p>
              <p className="mt-1 max-w-sm px-4 text-center text-xs font-medium text-slate-500 dark:text-slate-400">
                Try another billing period or list (active / inactive), or add a plan if you are a super admin.
              </p>
            </motion.div>
          )}
        </div>

        {modalData && (
          <PlanInactiveModal
            setModalData={setModalData}
            modalData={modalData}
            planType={planType}
          />
        )}
      </div>
    </HubSubpageShell>
  );
};

export default ViewPlans;
