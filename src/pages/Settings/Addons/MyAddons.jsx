import React, { useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getClientAddons } from "../../../features/actions/pricePlan";
import { resetAddonsData } from "../../../features/slices/pricePlan";
import useRoles from "../../../hooks/useRoles";
import useUserSubscription from "../../../hooks/useUserSubscription";
import { useParams, useSearchParams } from "react-router-dom";
import AddonCard from "./AddonCard";
import AddonSubscriptionsOverview from "./AddonSubscriptionsOverview";
import { instance } from "../../../services/axiosInterceptor";
import { errorToast, successToast } from "../../../utils/extra";
import HubSubpageShell from "../../../components/Layout/HubSubpageShell";

const MyAddOns = () => {
  const dispatch = useDispatch();
  const roles = useRoles();
  const { userData } = useSelector((state) => state.auth);
  const { id } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();

  const {
    data: subscription,
    isLoading: subscriptionLoading,
    isError: subscriptionError,
  } = useUserSubscription();

  const { addonsData, isLoading: addonsLoading } = useSelector(
    (state) => state.pricePlans
  );

  const isAdminOnly =
    userData &&
    roles.isAdmin(userData.role) &&
    !roles.isSuperAdmin(userData.role);

  useEffect(() => {
    if (id) {
      dispatch(getClientAddons(id));
    }

    return () => {
      dispatch(resetAddonsData());
    };
  }, [id, dispatch]);

  useEffect(() => {
    const purchaseId = searchParams.get("purchaseId");
    if (!purchaseId) return;

    let cancelled = false;
    const startedAt = Date.now();

    async function poll() {
      try {
        const res = await instance.get(`/addons/purchases/${purchaseId}`);
        if (cancelled) return;

        const status = res?.data?.status;
        if (status === "APPLIED") {
          successToast("Add-on activated.");
          dispatch(getClientAddons(id));
          searchParams.delete("purchaseId");
          setSearchParams(searchParams, { replace: true });
          return;
        }

        if (Date.now() - startedAt > 60_000) {
          errorToast(
            "Payment received but activation is still processing. Please refresh in a minute."
          );
          return;
        }

        setTimeout(poll, 2000);
      } catch (e) {
        if (cancelled) return;
        setTimeout(poll, 3000);
      }
    }

    poll();
    return () => {
      cancelled = true;
    };
  }, [id, dispatch, searchParams, setSearchParams]);

  const now = new Date();
  const isExpired = (addon) => {
    if (!addon) return false;

    if (addon.expiryDate) {
      const expiry = new Date(addon.expiryDate);
      if (!isNaN(expiry.getTime()) && expiry <= now) return true;
    }

    return addon.status === "EXPIRED";
  };

  const activeAddons = addonsData?.filter((addon) => !isExpired(addon)) || [];
  const expiredAddons = addonsData?.filter((addon) => isExpired(addon)) || [];

  const { activeCount, expiredCount } = useMemo(
    () => ({
      activeCount: activeAddons.length,
      expiredCount: expiredAddons.length,
    }),
    [activeAddons.length, expiredAddons.length]
  );

  return (
    <HubSubpageShell>
      {isAdminOnly ? (
        <>
          <div className="mb-6 space-y-1">
            <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-slate-50 sm:text-3xl">
              Add-ons &amp; billing
            </h1>
          </div>
          <AddonSubscriptionsOverview
            isLoadingAddons={addonsLoading}
            activeCount={activeCount}
            expiredCount={expiredCount}
            subscription={subscription}
            subscriptionLoading={subscriptionLoading}
            subscriptionError={subscriptionError}
            showOrgContext={isAdminOnly}
          />
        </>
      ) : (
        <h1 className="mb-6 text-center text-2xl font-bold text-slate-900 dark:text-slate-100">
          My add-ons
        </h1>
      )}

      <div className="space-y-10">
        <div>
          <h2 className="mb-4 text-xl font-semibold text-slate-800 dark:text-slate-200">
            Active add-ons
          </h2>
          {activeAddons.length ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {activeAddons.map((addon) => (
                <AddonCard
                  key={addon._id}
                  addon={addon}
                  roles={roles}
                  id={addon._id}
                  showAction={false}
                  showBillingMeta={Boolean(isAdminOnly)}
                />
              ))}
            </div>
          ) : (
            <p className="text-slate-500 dark:text-slate-400">
              No active add-ons found.
            </p>
          )}
        </div>

        <div>
          <h2 className="mb-4 text-xl font-semibold text-slate-800 dark:text-slate-200">
            Expired add-ons
          </h2>
          {expiredAddons.length ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {expiredAddons.map((addon) => (
                <AddonCard
                  key={addon._id}
                  addon={addon}
                  roles={roles}
                  id={addon._id}
                  showAction={false}
                  showBillingMeta={Boolean(isAdminOnly)}
                />
              ))}
            </div>
          ) : (
            <p className="text-slate-500 dark:text-slate-400">
              No expired add-ons found.
            </p>
          )}
        </div>
      </div>
    </HubSubpageShell>
  );
};

export default MyAddOns;
