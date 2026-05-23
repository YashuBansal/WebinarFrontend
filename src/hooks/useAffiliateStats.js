import { useState, useCallback, useEffect } from "react";
import { toast } from "sonner";
import { instance } from "../services/axiosInterceptor";

export const useAffiliateStats = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    referralCode: "",
    referralLink: "",
    tier1CommissionRate: 20,
    tier2CommissionRate: 2,
    totalReferralIncome: 0,
    requestablePayout: 0,
    pendingIncome: 0,
  });

  const [referrals, setReferrals] = useState([]);
  const [payouts, setPayouts] = useState([]);
  const [bankDetails, setBankDetails] = useState({
    holderName: "",
    bankBranch: "",
    accountNumber: "",
    ifscCode: "",
    upiId: "",
    panCardFile: null,
  });
  const [savingBank, setSavingBank] = useState(false);

  const fetchAffiliateData = useCallback(async () => {
    try {
      setLoading(true);
      
      // Fetch stats
      const statsRes = await instance.get("affiliate/stats");
      if (statsRes.data?.statusCode === 200 || statsRes.data?.success) {
        const d = statsRes.data.data;
        setStats({
          referralCode: d.referralCode,
          referralLink: d.referralLink,
          tier1CommissionRate: d.tier1CommissionRate,
          tier2CommissionRate: d.tier2CommissionRate,
          totalReferralIncome: d.totalReferralIncome,
          requestablePayout: d.requestablePayout,
          pendingIncome: d.pendingIncome,
        });
      }

      // Fetch referrals
      const referralsRes = await instance.get("affiliate/referrals");
      if (referralsRes.data?.statusCode === 200 || referralsRes.data?.success) {
        setReferrals(referralsRes.data.data || []);
      }

      // Fetch payouts
      const payoutsRes = await instance.get("affiliate/payouts");
      if (payoutsRes.data?.statusCode === 200 || payoutsRes.data?.success) {
        setPayouts(payoutsRes.data.data || []);
      }

      // Fetch bank details
      const bankRes = await instance.get("affiliate/bank-details");
      if (bankRes.data?.statusCode === 200 || bankRes.data?.success) {
        const b = bankRes.data.data;
        if (b) {
          setBankDetails({
            holderName: b.holderName || "",
            bankBranch: b.bankBranch || "",
            accountNumber: b.accountNumber || "",
            ifscCode: b.ifscCode || "",
            upiId: b.upiId || "",
            panCardFile: b.panCardFile || null,
          });
        }
      }
    } catch (error) {
      console.error("Error fetching affiliate data:", error);
      toast.error(error || "Failed to load affiliate details");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAffiliateData();
  }, [fetchAffiliateData]);

  const requestPayout = useCallback(async () => {
    if (stats.requestablePayout <= 0) {
      toast.error("You do not have any requestable payout at this time.");
      return;
    }

    try {
      const { data } = await instance.post("affiliate/payouts/request");
      if (data.statusCode === 200 || data.success) {
        toast.success(data.message || "Early payout requested successfully.");
        await fetchAffiliateData();
      }
    } catch (error) {
      console.error("Error requesting payout:", error);
      toast.error(error || "Failed to request payout");
    }
  }, [stats.requestablePayout, fetchAffiliateData]);

  const saveBankDetails = useCallback(async (details) => {
    try {
      setSavingBank(true);
      const { data } = await instance.post("affiliate/bank-details", details);
      if (data.statusCode === 200 || data.success) {
        toast.success(data.message || "Payout bank account details updated securely!");
        if (data.data) {
          setBankDetails({
            holderName: data.data.holderName || "",
            bankBranch: data.data.bankBranch || "",
            accountNumber: data.data.accountNumber || "",
            ifscCode: data.data.ifscCode || "",
            upiId: data.data.upiId || "",
            panCardFile: data.data.panCardFile || null,
          });
        }
        return true;
      }
    } catch (error) {
      console.error("Error saving bank details:", error);
      toast.error(error || "Failed to save bank details");
      return false;
    } finally {
      setSavingBank(false);
    }
  }, []);

  return {
    loading,
    referralLink: stats.referralLink,
    tier1CommissionRate: stats.tier1CommissionRate,
    tier2CommissionRate: stats.tier2CommissionRate,
    totalReferralIncome: stats.totalReferralIncome,
    requestablePayout: stats.requestablePayout,
    pendingIncome: stats.pendingIncome,
    referrals,
    payouts,
    bankDetails,
    setBankDetails,
    savingBank,
    saveBankDetails,
    requestPayout,
    refreshData: fetchAffiliateData,
  };
};
