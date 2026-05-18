import { useState, useCallback } from "react";
import { toast } from "sonner";

export const useAffiliateStats = () => {
  // Demo states that simulate real Redux/API backend states
  const [stats, setStats] = useState({
    totalReferralIncome: 1850.00,
    requestablePayout: 650.00,
  });

  const [referrals, setReferrals] = useState([
    { id: "ref-1", email: "alex.jones@example.com", tier: 1, date: "2026-05-10", commission: 120.00, status: "Cleared" },
    { id: "ref-2", email: "sarah.smith@example.com", tier: 1, date: "2026-05-12", commission: 250.00, status: "Cleared" },
    { id: "ref-3", email: "david.miller@example.com", tier: 2, date: "2026-05-14", commission: 12.00, status: "Cleared" },
    { id: "ref-4", email: "emma.watson@example.com", tier: 1, date: "2026-05-16", commission: 280.00, status: "Cleared" },
    { id: "ref-5", email: "james.bond@example.com", tier: 1, date: "2026-05-17", commission: 300.00, status: "Pending (Clearing)" },
    { id: "ref-6", email: "robert.downey@example.com", tier: 2, date: "2026-05-18", commission: 8.00, status: "Pending (Clearing)" },
  ]);

  const [payouts, setPayouts] = useState([
    { id: "pay-1", date: "2026-04-15", amount: 400.00, status: "Completed" },
    { id: "pay-2", date: "2026-05-01", amount: 800.00, status: "Completed" },
  ]);

  const referralLink = "https://webinarwlh.com/signup?ref=client_789456";

  const tier1CommissionRate = 20; // 20%
  const tier2CommissionRate = 2;  // 2%

  // Calculate pending income
  const pendingIncome = stats.totalReferralIncome - stats.requestablePayout;

  const requestPayout = useCallback(() => {
    if (stats.requestablePayout <= 0) {
      toast.error("You do not have any requestable payout at this time.");
      return;
    }

    const payoutAmount = stats.requestablePayout;
    
    // Add to payout history
    const newPayout = {
      id: `pay-${Date.now()}`,
      date: new Date().toISOString().split("T")[0],
      amount: payoutAmount,
      status: "Processing",
    };

    setPayouts(prev => [newPayout, ...prev]);
    
    // Deduct the requested amount from requestable payout
    setStats(prev => ({
      ...prev,
      requestablePayout: 0,
    }));

    toast.success(`Successfully requested payout of $${payoutAmount.toFixed(2)}! It will be reviewed and cleared shortly.`);
  }, [stats.requestablePayout]);

  return {
    referralLink,
    tier1CommissionRate,
    tier2CommissionRate,
    totalReferralIncome: stats.totalReferralIncome,
    requestablePayout: stats.requestablePayout,
    pendingIncome,
    referrals,
    payouts,
    requestPayout,
  };
};
