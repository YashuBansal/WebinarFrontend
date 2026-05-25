/** Add-on is eligible for subscription checkout (Razorpay plan id configured). */
export function addonHasConfiguredRazorpayPlan(addon) {
  return /^plan_[A-Za-z0-9]+$/i.test(String(addon?.razorpayPlanId || "").trim());
}
