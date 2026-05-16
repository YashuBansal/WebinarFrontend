import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { AlertCircle, ChevronRight, Package, Sparkles } from "lucide-react";
import useRoles from "../../../hooks/useRoles";
import ComponentGuard from "../../../components/AccessControl/ComponentGuard";
import { getAddons } from "../../../features/actions/pricePlan";
import { resetAddonsData } from "../../../features/slices/pricePlan";
import AddonCard from "./AddonCard";
import useUserSubscription from "../../../hooks/useUserSubscription";
import HubSubpageShell from "../../../components/Layout/HubSubpageShell";
import { Button } from "../../../components/ui/button";

const BuyAddOnsPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const roles = useRoles();

  const { userData } = useSelector((state) => state.auth);
  const { addonsData = [] } = useSelector((state) => state.pricePlans);
  const { data: subscription } = useUserSubscription();

  const expiryDate = subscription?.expiryDate
    ? new Date(subscription.expiryDate)
    : null;
  const isSubscriptionExpired = expiryDate
    ? expiryDate.getTime() <= Date.now()
    : true;
  const canBuyAddons = Boolean(userData?.isActive) && !isSubscriptionExpired;

  useEffect(() => {
    dispatch(getAddons());
    return () => {
      dispatch(resetAddonsData());
    };
  }, [dispatch]);

  return (
    <HubSubpageShell>
      <motion.header
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        className="mb-8 flex flex-col gap-6 sm:mb-10 lg:flex-row lg:items-start lg:justify-between"
      >
        <div className="flex min-w-0 flex-1 items-start gap-4">
          <motion.div
            aria-hidden
            className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-blue-500/10 dark:bg-blue-500/15"
            initial={{ scale: 0.85, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{
              type: "spring",
              stiffness: 380,
              damping: 22,
              delay: 0.05,
            }}
          >
            <Package className="h-7 w-7 text-blue-500 dark:text-blue-400" />
          </motion.div>
          <div className="min-w-0 space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-slate-50 sm:text-3xl">
                Buy add-ons
              </h1>
              <Sparkles className="hidden h-5 w-5 text-amber-400 sm:inline sm:h-6 sm:w-6" aria-hidden />
            </div>
            <p className="max-w-xl text-sm font-medium leading-relaxed text-slate-500 dark:text-slate-400">
              Purchase additional capacity and features. Cards match your live catalog — pick a pack and
              checkout securely.
            </p>
          </div>
        </div>

        <ComponentGuard allowedRoles={[roles.ADMIN]}>
          <Button
            type="button"
            variant="outline"
            className="group h-11 shrink-0 gap-2 rounded-xl border-slate-200 bg-white/80 px-5 font-bold shadow-sm backdrop-blur-sm transition-all hover:border-blue-200 hover:bg-blue-50/80 hover:text-blue-700 dark:border-slate-600 dark:bg-slate-800/80 dark:hover:border-blue-500/40 dark:hover:bg-blue-950/40 dark:hover:text-blue-300"
            onClick={() => navigate(`/addons/${userData?._id}`)}
          >
            My add-ons
            <ChevronRight className="h-4 w-4 opacity-70 transition-transform group-hover:translate-x-0.5" />
          </Button>
        </ComponentGuard>
      </motion.header>

      {!canBuyAddons && (
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.35 }}
          className="mb-8 flex gap-3 rounded-2xl border border-amber-200/90 bg-amber-50/95 p-4 shadow-sm dark:border-amber-900/50 dark:bg-amber-950/35 sm:p-5"
          role="status"
        >
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" />
          <p className="text-sm font-medium leading-relaxed text-amber-900 dark:text-amber-100/90">
            Add-on purchase is unavailable because your account or subscription is inactive or expired. You
            can still open <span className="font-bold">My add-ons</span> to review past purchases.
          </p>
        </motion.div>
      )}

      {addonsData.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white/60 py-16 text-center dark:border-slate-700 dark:bg-slate-800/40"
        >
          <Package className="mb-3 h-12 w-12 text-slate-300 dark:text-slate-600" />
          <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">No add-ons are listed yet.</p>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-2"
        >
          {addonsData.map((addon, i) => (
            <motion.div
              key={addon._id}
              className="h-full"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: Math.min(i * 0.06, 0.35) }}
            >
              <AddonCard
                addon={addon}
                roles={roles}
                id={addon._id}
                showExpiryDate={true}
                showAction={canBuyAddons}
              />
            </motion.div>
          ))}
        </motion.div>
      )}
    </HubSubpageShell>
  );
};

export default BuyAddOnsPage;
