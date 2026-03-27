import { useMemo } from "react";
import {
  evaluateSubscription,
  SubscriptionStatus,
} from "../utils/subscription";
import { useSelector } from "react-redux";
import useUserSubscription from "./useUserSubscription";

/**
 * Hook to compute plan expiry warning info from Redux auth state.
 *
 * @param {number} warningThresholdDays - Days before expiry when warning starts (default 15).
 */
export default function usePlanExpiryWarning(warningThresholdDays = 15) {
  const { userData } = useSelector((state) => state.auth);
  const { data: subscription } = useUserSubscription();

  const result = useMemo(() => {
    const evaluation = evaluateSubscription({
      expiryDate: subscription?.expiryDate,
      isActive: userData?.isActive,
      warningThresholdDays,
    });

    return {
      ...evaluation,
      expiryDate: subscription?.expiryDate ?? null,
      status: evaluation.status ?? SubscriptionStatus.NONE,
    };
  }, [subscription?.expiryDate, userData?.isActive, warningThresholdDays]);

  return result;
}


