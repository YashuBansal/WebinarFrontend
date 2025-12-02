import { evaluateSubscription, SubscriptionStatus } from "../subscription";

// Helper to build a date offset in days from today, in local time.
function daysFromNow(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d;
}

describe("evaluateSubscription", () => {
  it("returns NONE when there is no expiry date", () => {
    const result = evaluateSubscription({
      expiryDate: null,
      isActive: true,
    });

    expect(result.status).toBe(SubscriptionStatus.NONE);
    expect(result.showWarning).toBe(false);
    expect(result.daysLeft).toBeNull();
  });

  it("returns NONE when user is not active", () => {
    const result = evaluateSubscription({
      expiryDate: daysFromNow(10),
      isActive: false,
    });

    expect(result.status).toBe(SubscriptionStatus.NONE);
    expect(result.showWarning).toBe(false);
  });

  it("returns ACTIVE with no warning when daysLeft is greater than threshold", () => {
    const result = evaluateSubscription({
      expiryDate: daysFromNow(20),
      isActive: true,
      warningThresholdDays: 15,
    });

    expect(result.status).toBe(SubscriptionStatus.ACTIVE);
    expect(result.showWarning).toBe(false);
    expect(result.daysLeft).toBeGreaterThan(15);
  });

  it("returns EXPIRING_SOON with warning when exactly at threshold", () => {
    const result = evaluateSubscription({
      expiryDate: daysFromNow(15),
      isActive: true,
      warningThresholdDays: 15,
    });

    expect(result.status).toBe(SubscriptionStatus.EXPIRING_SOON);
    expect(result.showWarning).toBe(true);
  });

  it("returns EXPIRING_SOON with warning when expiring today (0 days left)", () => {
    const result = evaluateSubscription({
      expiryDate: daysFromNow(0),
      isActive: true,
      warningThresholdDays: 15,
    });

    expect(result.status).toBe(SubscriptionStatus.EXPIRING_SOON);
    expect(result.showWarning).toBe(true);
  });

  it("returns EXPIRED with no warning when already expired", () => {
    const result = evaluateSubscription({
      expiryDate: daysFromNow(-1),
      isActive: true,
      warningThresholdDays: 15,
    });

    expect(result.status).toBe(SubscriptionStatus.EXPIRED);
    expect(result.showWarning).toBe(false);
    expect(result.daysLeft).toBeLessThan(0);
  });

  it("returns NONE when expiry date is invalid", () => {
    const result = evaluateSubscription({
      expiryDate: "invalid-date-value",
      isActive: true,
      warningThresholdDays: 15,
    });

    expect(result.status).toBe(SubscriptionStatus.NONE);
    expect(result.showWarning).toBe(false);
    expect(result.daysLeft).toBeNull();
  });
});


