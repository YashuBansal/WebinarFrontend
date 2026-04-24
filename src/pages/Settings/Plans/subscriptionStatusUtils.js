/** @typedef {'active' | 'expiring_soon' | 'expired' | 'unknown'} AccessTier */

const EXPIRING_SOON_DAYS = 14;

/**
 * @param {unknown} expiryRaw
 * @returns {{ tier: AccessTier; daysRemaining: number | null }}
 */
export function getAccessState(expiryRaw) {
  if (expiryRaw == null || expiryRaw === "") {
    return { tier: "unknown", daysRemaining: null };
  }
  const expiry = new Date(expiryRaw);
  if (Number.isNaN(expiry.getTime())) {
    return { tier: "unknown", daysRemaining: null };
  }

  const now = new Date();
  const endOfExpiryUtc = Date.UTC(
    expiry.getUTCFullYear(),
    expiry.getUTCMonth(),
    expiry.getUTCDate()
  );
  const endOfTodayUtc = Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate()
  );

  const msPerDay = 24 * 60 * 60 * 1000;
  const daysRemaining = Math.ceil((endOfExpiryUtc - endOfTodayUtc) / msPerDay);

  if (daysRemaining < 0) {
    return { tier: "expired", daysRemaining };
  }
  if (daysRemaining <= EXPIRING_SOON_DAYS) {
    return { tier: "expiring_soon", daysRemaining };
  }
  return { tier: "active", daysRemaining };
}

/**
 * @param {string | undefined | null} status
 * @returns {string}
 */
export function formatRazorpayStatus(status) {
  if (!status || typeof status !== "string") return "Unknown";
  const s = status.toLowerCase();
  const labels = {
    active: "Active",
    halted: "Halted",
    cancelled: "Cancelled",
    paused: "Paused",
    created: "Created",
    authenticated: "Authenticated",
    pending: "Pending",
  };
  return labels[s] || status.charAt(0).toUpperCase() + status.slice(1);
}

/**
 * @param {number | undefined | null} base
 * @param {number | undefined | null} addon
 * @returns {number}
 */
export function effectiveLimit(base, addon) {
  const b = typeof base === "number" && !Number.isNaN(base) ? base : 0;
  const a = typeof addon === "number" && !Number.isNaN(addon) ? addon : 0;
  return b + a;
}

/**
 * @param {string} id
 * @param {number} [head=6]
 * @param {number} [tail=4]
 * @returns {string}
 */
export function truncateMiddleId(id, head = 6, tail = 4) {
  if (!id || typeof id !== "string") return "";
  if (id.length <= head + tail + 1) return id;
  return `${id.slice(0, head)}…${id.slice(-tail)}`;
}

/**
 * @param {unknown} value
 * @returns {string}
 */
export function formatDateDisplay(value) {
  if (value == null || value === "") return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}
