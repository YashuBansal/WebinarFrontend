import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useDispatch, useSelector } from "react-redux";
import {
  getClientAddons,
} from "../../../features/actions/pricePlan";
import { resetAddonsData } from "../../../features/slices/pricePlan";
import useRoles from "../../../hooks/useRoles";
import { useParams, useSearchParams } from "react-router-dom";
import AddonCard from "./AddonCard";
import { instance } from "../../../services/axiosInterceptor";
import { errorToast, successToast } from "../../../utils/extra";

const MyAddOns = () => {
  const dispatch = useDispatch();
  const roles = useRoles();
  const { id } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();



  const { addonsData } = useSelector(
    (state) => state.pricePlans
  );

  useEffect(() => {
    if (id) {
      dispatch(getClientAddons(id));
    }

    return () => {
      dispatch(resetAddonsData());
    }
  }, [id]);

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

    // Primary: expiryDate based classification
    if (addon.expiryDate) {
      const expiry = new Date(addon.expiryDate);
      if (!isNaN(expiry.getTime()) && expiry <= now) return true;
    }

    // Fallback: status-based classification (cron/status update can lag)
    return addon.status === "EXPIRED";
  };

  const activeAddons = addonsData?.filter((addon) => !isExpired(addon)) || [];
  const expiredAddons = addonsData?.filter((addon) => isExpired(addon)) || [];

  return (
    <div className="bg-gray-100 min-h-screen px-6 pt-14">
      <h1 className="text-2xl font-bold text-center mb-6">My AddOns</h1>

      <div className="space-y-10">
        <div>
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Active AddOns
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
                />
              ))}
            </div>
          ) : (
            <p className="text-gray-500">No active add-ons found.</p>
          )}
        </div>

        <div>
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Expired AddOns
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
                />
              ))}
            </div>
          ) : (
            <p className="text-gray-500">No expired add-ons found.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default MyAddOns;
