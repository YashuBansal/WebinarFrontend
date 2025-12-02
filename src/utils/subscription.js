// Centralized subscription evaluation logic for plan expiry warnings

export const SubscriptionStatus = {
  NONE: "NONE",
  ACTIVE: "ACTIVE",
  EXPIRING_SOON: "EXPIRING_SOON",
  EXPIRED: "EXPIRED",
};

function toUtcMidnight(dateLike) {
  if (!dateLike) return null;
  const d = new Date(dateLike);
  if (Number.isNaN(d.getTime())) return null;

  // Normalize to UTC midnight to avoid timezone drift issues
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

/**
 * Evaluate the subscription's status and whether a warning should be shown.
 *
 * @param {Object} params
 * @param {string|Date|null} params.expiryDate - The subscription expiry date.
 * @param {boolean} params.isActive - Whether the subscription/user is active.
 * @param {number} [params.warningThresholdDays=15] - Days before expiry when the warning starts.
 * @returns {{ status: string, daysLeft: number|null, showWarning: boolean }}
 */
export function evaluateSubscription({
  expiryDate,
  isActive,
  warningThresholdDays = 15,
}) {
  if (!expiryDate || !isActive) {
    return {
      status: SubscriptionStatus.NONE,
      daysLeft: null,
      showWarning: false,
    };
  }

  const expiry = toUtcMidnight(expiryDate);
  const now = toUtcMidnight(new Date());

  if (!expiry || !now) {
    return {
      status: SubscriptionStatus.NONE,
      daysLeft: null,
      showWarning: false,
    };
  }

  const msInDay = 1000 * 60 * 60 * 24;
  const diffDaysRaw = (expiry.getTime() - now.getTime()) / msInDay;
  // daysLeft = 0 means "expires today"
  const daysLeft = Math.ceil(diffDaysRaw);

  if (daysLeft < 0) {
    return {
      status: SubscriptionStatus.EXPIRED,
      daysLeft,
      showWarning: false,
    };
  }

  if (daysLeft <= warningThresholdDays) {
    return {
      status: SubscriptionStatus.EXPIRING_SOON,
      daysLeft,
      showWarning: true,
    };
  }

  return {
    status: SubscriptionStatus.ACTIVE,
    daysLeft,
    showWarning: false,
  };
}


