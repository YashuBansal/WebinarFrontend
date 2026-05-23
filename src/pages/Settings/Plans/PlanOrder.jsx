import { useEffect, useState } from "react";
import {
  getPricePlans,
  updatePlansOrder,
} from "../../../features/actions/pricePlan";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import AppLoader from "../../../components/AppLoader";
import { motion } from "framer-motion";
import { ListOrdered, Sparkles } from "lucide-react";
import HubSubpageShell from "../../../components/Layout/HubSubpageShell";
import { Button } from "../../../components/ui/button";

const PlanOrder = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { planData, isSuccess, isLoading } = useSelector(
    (state) => state.pricePlans
  );

  const [plans, setPlans] = useState([]);

  const handleOrderChange = (id, value) => {
    const updatedPlans = plans.map((plan) =>
      plan.id === id ? { ...plan, sortOrder: parseInt(value, 10) || 0 } : plan
    );
    setPlans(updatedPlans);
  };

  const handleUpdateOrder = () => {
    dispatch(updatePlansOrder({ plans }));
  };

  const sortedPlans = [...plans].sort((a, b) => a.sortOrder - b.sortOrder);

  useEffect(() => {
    if (Array.isArray(planData)) {
      setPlans(
        planData.map((plan) => ({
          id: plan._id,
          name: plan.name,
          sortOrder: plan.sortOrder || 0,
        }))
      );
    }
  }, [planData]);

  useEffect(() => {
    if (!Array.isArray(planData) || planData.length === 0) {
      dispatch(getPricePlans());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- load once on mount when store has no plans
  }, []);

  useEffect(() => {
    if (isSuccess) {
      navigate("/plans");
    }
  }, [isSuccess, navigate]);

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
            <ListOrdered className="h-7 w-7 text-blue-500 dark:text-blue-400" />
          </motion.div>
          <div className="min-w-0 space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-slate-50 sm:text-3xl">
                Plan order
              </h1>
              <Sparkles className="hidden h-5 w-5 text-amber-400 sm:inline sm:h-6 sm:w-6" aria-hidden />
            </div>
            <p className="max-w-xl text-sm font-medium leading-relaxed text-slate-500 dark:text-slate-400">
              Set sort order numbers below; the list sorts automatically. Save when you are done — you will return to
              the plans page.
            </p>
          </div>
        </div>
        <Button
          type="button"
          onClick={handleUpdateOrder}
          disabled={isLoading}
          className="h-11 shrink-0 gap-2 rounded-xl bg-blue-500 px-6 font-bold text-white shadow-lg shadow-blue-500/20 hover:bg-blue-600 dark:shadow-blue-900/40"
        >
          {isLoading ? (
            <AppLoader size="md" variant="inverse" />
          ) : (
            "Update order"
          )}
        </Button>
      </motion.header>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800/90">
        <div className="p-5 sm:p-6">
          <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
            Plans
          </h2>
          <ul className="mt-6 space-y-3">
            {sortedPlans.map((plan, i) => (
              <motion.li
                key={plan.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i * 0.05, 0.25), ease: [0.22, 1, 0.36, 1] }}
                className="flex flex-col gap-4 rounded-2xl border border-slate-200/90 bg-gradient-to-br from-white to-slate-50/80 p-4 shadow-sm dark:border-slate-600 dark:from-slate-900 dark:to-slate-900/80 sm:flex-row sm:items-center sm:justify-between"
              >
                <span className="text-base font-black tracking-tight text-slate-900 dark:text-slate-50">
                  {plan.name}
                </span>
                <div className="flex items-center gap-3">
                  <label
                    htmlFor={`order-${plan.id}`}
                    className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400"
                  >
                    Order
                  </label>
                  <input
                    id={`order-${plan.id}`}
                    type="number"
                    min="0"
                    onClick={(e) => e.target.select()}
                    value={plan.sortOrder}
                    onChange={(e) => handleOrderChange(plan.id, e.target.value)}
                    className="h-10 w-24 rounded-xl border border-slate-200 bg-white px-3 text-center text-sm font-bold text-slate-900 shadow-inner outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:border-slate-600 dark:bg-slate-950 dark:text-slate-100"
                  />
                </div>
              </motion.li>
            ))}
          </ul>
          {sortedPlans.length === 0 && (
            <p className="mt-8 text-center text-sm font-medium text-slate-500 dark:text-slate-400">
              No plans loaded yet.
            </p>
          )}
        </div>
      </div>
    </HubSubpageShell>
  );
};

export default PlanOrder;
