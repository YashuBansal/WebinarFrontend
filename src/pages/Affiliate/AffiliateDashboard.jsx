import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Share2,
  Copy,
  Check,
  TrendingUp,
  Coins,
  Clock,
  ArrowUpRight,
  HelpCircle,
  Activity,
  UserCheck,
  Users,
  Info,
  DollarSign,
  Compass,
  Landmark,
  Award,
  Lock,
  Zap,
  Crown,
  Sparkles,
  ArrowRight,
  PiggyBank,
  CheckCircle2,
  Receipt,
} from "lucide-react";
import { useAffiliateStats } from "../../hooks/useAffiliateStats";
import { Button } from "../../components/ui/button";
import { Card } from "../../components/ui/card";
import { toast } from "sonner";
import { useTheme } from "../../contexts/ThemeContext";

const AffiliateDashboard = ({ view = "dashboard" }) => {
  const {
    loading,
    referralLink,
    tier1CommissionRate,
    tier2CommissionRate,
    totalReferralIncome,
    requestablePayout,
    pendingIncome,
    referrals,
    payouts,
    bankDetails,
    setBankDetails,
    savingBank,
    saveBankDetails,
    requestPayout,
  } = useAffiliateStats();

  const [copied, setCopied] = useState(false);
  const [referralTab, setReferralTab] = useState("customers"); // "customers" or "signups"
  const { theme } = useTheme();
  const isDark = theme === "dark";

  // Memoized check if bank account number is already submitted & locked
  const isAccountSubmitted = React.useMemo(() => {
    return !!bankDetails?.accountNumber;
  }, [bankDetails?.accountNumber]);

  const [confirmAccountNumber, setConfirmAccountNumber] = useState("");

  React.useEffect(() => {
    if (bankDetails?.accountNumber) {
      setConfirmAccountNumber(bankDetails.accountNumber);
    }
  }, [bankDetails?.accountNumber]);

  React.useEffect(() => {
    const el = document.querySelector(".custom-scrollbar.absolute") || document.querySelector(".custom-scrollbar");
    if (el) {
      el.scrollTop = 0;
    } else {
      window.scrollTo({ top: 0, behavior: "instant" });
    }
  }, [view]);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    toast.success("Referral link copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveBankDetails = async (e) => {
    e.preventDefault();
    if (bankDetails.accountNumber !== confirmAccountNumber) {
      toast.error("Bank Account Number and Confirm Account Number do not match!");
      return;
    }
    await saveBankDetails(bankDetails);
  };

  // Framer Motion Variants
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.06,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 120, damping: 14 } },
  };

  // Get localized views matching the route paths
  const renderViewContent = () => {
    switch (view) {
      case "referrals":
        return (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="space-y-6"
          >
            {/* Referrals Stats Row */}
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              <motion.div variants={itemVariants}>
                <Card className="relative overflow-hidden border-slate-200 bg-white/70 p-6 shadow-sm backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/50">
                  <div className="absolute -right-3 -top-3 text-slate-100 dark:text-slate-800/20">
                    <UserCheck className="h-20 w-20" />
                  </div>
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                    <UserCheck className="h-4 w-4 text-blue-500" />
                    <span>Direct Referrals (Tier 1)</span>
                  </div>
                  <h3 className="mt-4 text-3xl font-black tracking-tight text-slate-900 dark:text-slate-50">
                    {referrals.filter((r) => r.tier === 1).length} Accounts
                  </h3>
                  <div className="mt-3 text-[11px] font-semibold text-blue-600 dark:text-blue-400">
                    Earning 20% on each sale
                  </div>
                </Card>
              </motion.div>

              <motion.div variants={itemVariants}>
                <Card className="relative overflow-hidden border-slate-200 bg-white/70 p-6 shadow-sm backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/50">
                  <div className="absolute -right-3 -top-3 text-slate-100 dark:text-slate-800/20">
                    <Users className="h-20 w-20" />
                  </div>
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                    <Users className="h-4 w-4 text-pink-500" />
                    <span>Sub-Referrals (Tier 2)</span>
                  </div>
                  <h3 className="mt-4 text-3xl font-black tracking-tight text-slate-900 dark:text-slate-50">
                    {referrals.filter((r) => r.tier === 2).length} Accounts
                  </h3>
                  <div className="mt-3 text-[11px] font-semibold text-pink-600 dark:text-pink-400">
                    Earning 2% passive recurring commission
                  </div>
                </Card>
              </motion.div>

              <motion.div variants={itemVariants}>
                <Card className="relative overflow-hidden border-slate-200 bg-white/70 p-6 shadow-sm backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/50">
                  <div className="absolute -right-3 -top-3 text-slate-100 dark:text-slate-800/20">
                    <TrendingUp className="h-20 w-20" />
                  </div>
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                    <TrendingUp className="h-4 w-4 text-violet-500" />
                    <span>Total Referral Network</span>
                  </div>
                  <h3 className="mt-4 text-3xl font-black tracking-tight text-slate-900 dark:text-slate-50">
                    {referrals.length} Active Users
                  </h3>
                  <div className="mt-3 text-[11px] font-semibold text-violet-600 dark:text-violet-400">
                    Healthy conversion rates active
                  </div>
                </Card>
              </motion.div>
            </div>

            {/* Toggle Switch between Customers and Signups */}
            <motion.div
              variants={itemVariants}
              className="flex justify-center md:justify-start"
            >
              <div className="flex p-1 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200/50 dark:border-slate-700/50 backdrop-blur-md relative shadow-sm">
                <button
                  onClick={() => setReferralTab("customers")}
                  className="relative px-6 py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-colors duration-300"
                  style={{
                    color: referralTab === "customers" ? "#ffffff" : isDark ? "#94a3b8" : "#64748b"
                  }}
                >
                  {referralTab === "customers" && (
                    <motion.div
                      layoutId="activeReferralTab"
                      className="absolute inset-0 rounded-lg bg-gradient-to-r from-rose-600 to-red-600 shadow-md shadow-rose-900/20"
                      transition={{ type: "spring", stiffness: 380, damping: 30 }}
                    />
                  )}
                  <span className="relative z-10">Customers</span>
                </button>
                <button
                  onClick={() => setReferralTab("signups")}
                  className="relative px-6 py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-colors duration-300"
                  style={{
                    color: referralTab === "signups" ? "#ffffff" : isDark ? "#94a3b8" : "#64748b"
                  }}
                >
                  {referralTab === "signups" && (
                    <motion.div
                      layoutId="activeReferralTab"
                      className="absolute inset-0 rounded-lg bg-gradient-to-r from-rose-600 to-red-600 shadow-md shadow-rose-900/20"
                      transition={{ type: "spring", stiffness: 380, damping: 30 }}
                    />
                  )}
                  <span className="relative z-10">Signups</span>
                </button>
              </div>
            </motion.div>

            {/* Referrals Table Container */}
            <motion.div
              variants={itemVariants}
              className="rounded-2xl border flex flex-col overflow-hidden shadow-sm"
              style={{
                background: isDark ? "rgba(30, 41, 59, 0.7)" : "rgba(255, 255, 255, 0.7)",
                backdropFilter: "blur(16px)",
                borderColor: isDark ? "rgba(255,255,255,0.05)" : "rgba(255,255,255,0.4)",
              }}
            >
              <div
                className="p-4 border-b flex items-center gap-2"
                style={{ borderColor: isDark ? "#334155" : "rgba(0,0,0,0.05)" }}
              >
                <Users className="h-4 w-4 text-rose-500" />
                <span className="text-sm font-bold text-slate-800 dark:text-slate-100">
                  {referralTab === "customers" ? "Referred Paid Customers" : "Referred Signups List"}
                </span>
              </div>
              <div className="overflow-x-auto custom-scrollbar">
                {referralTab === "customers" ? (
                  <table className="w-full text-left border-collapse min-w-[900px]">
                    <thead>
                      <tr style={{ backgroundColor: isDark ? "rgba(15,23,42,0.95)" : "#F9FAFB" }}>
                        <th className="p-4 font-semibold text-xs uppercase tracking-wider" style={{ color: isDark ? "#94a3b8" : "#64748b" }}>Name</th>
                        <th className="p-4 font-semibold text-xs uppercase tracking-wider" style={{ color: isDark ? "#94a3b8" : "#64748b" }}>Email</th>
                        <th className="p-4 font-semibold text-xs uppercase tracking-wider" style={{ color: isDark ? "#94a3b8" : "#64748b" }}>Number</th>
                        <th className="p-4 font-semibold text-xs uppercase tracking-wider" style={{ color: isDark ? "#94a3b8" : "#64748b" }}>Invoice ID</th>
                        <th className="p-4 font-semibold text-xs uppercase tracking-wider" style={{ color: isDark ? "#94a3b8" : "#64748b" }}>Purchase Date</th>
                        <th className="p-4 font-semibold text-xs uppercase tracking-wider" style={{ color: isDark ? "#94a3b8" : "#64748b" }}>Plan Purchased</th>
                        <th className="p-4 font-semibold text-xs uppercase tracking-wider text-right" style={{ color: isDark ? "#94a3b8" : "#64748b" }}>Commission Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200/50 dark:divide-slate-800/50">
                      {referrals.filter(r => r.status === 'customer').length === 0 ? (
                        <tr>
                          <td colSpan={7} className="p-8 text-center text-sm font-semibold text-slate-400 dark:text-slate-500">
                            No referred paid customers yet. Share your link to start earning!
                          </td>
                        </tr>
                      ) : (
                        referrals
                          .filter((r) => r.status === "customer")
                          .map((cust) => (
                            <tr key={cust.id} className="hover:bg-black/5 dark:hover:bg-white/5 transition-colors" style={{ borderColor: isDark ? "#334155" : "#e2e8f0" }}>
                              <td className="p-4 text-sm font-bold text-slate-800 dark:text-slate-200">{cust.name}</td>
                              <td className="p-4 text-sm text-slate-600 dark:text-slate-400 font-medium">{cust.email}</td>
                              <td className="p-4 text-xs font-mono text-slate-500 dark:text-slate-400">{cust.number}</td>
                              <td className="p-4 text-xs font-mono text-slate-500 dark:text-slate-400">{cust.invoiceId || "-"}</td>
                              <td className="p-4 text-xs font-mono text-slate-500 dark:text-slate-400">{cust.purchaseDate || "-"}</td>
                              <td className="p-4">
                                <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-600 border border-emerald-200/30 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/30">
                                  {cust.planPurchased || "WLH Standard"}
                                </span>
                              </td>
                              <td className="p-4 text-sm font-black text-slate-900 dark:text-slate-50 text-right tabular-nums">
                                ₹{cust.commissionAmount.toFixed(2)}
                              </td>
                            </tr>
                          ))
                      )}
                    </tbody>
                  </table>
                ) : (
                  <table className="w-full text-left border-collapse min-w-[700px]">
                    <thead>
                      <tr style={{ backgroundColor: isDark ? "rgba(15,23,42,0.95)" : "#F9FAFB" }}>
                        <th className="p-4 font-semibold text-xs uppercase tracking-wider" style={{ color: isDark ? "#94a3b8" : "#64748b" }}>Name</th>
                        <th className="p-4 font-semibold text-xs uppercase tracking-wider" style={{ color: isDark ? "#94a3b8" : "#64748b" }}>Email</th>
                        <th className="p-4 font-semibold text-xs uppercase tracking-wider" style={{ color: isDark ? "#94a3b8" : "#64748b" }}>Number</th>
                        <th className="p-4 font-semibold text-xs uppercase tracking-wider text-right" style={{ color: isDark ? "#94a3b8" : "#64748b" }}>Registration Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200/50 dark:divide-slate-800/50">
                      {referrals.filter(r => r.status === 'signup').length === 0 ? (
                        <tr>
                          <td colSpan={4} className="p-8 text-center text-sm font-semibold text-slate-400 dark:text-slate-500">
                            No referred signups yet. Share your link to start earning!
                          </td>
                        </tr>
                      ) : (
                        referrals
                          .filter((r) => r.status === "signup")
                          .map((signup) => (
                            <tr key={signup.id} className="hover:bg-black/5 dark:hover:bg-white/5 transition-colors" style={{ borderColor: isDark ? "#334155" : "#e2e8f0" }}>
                              <td className="p-4 text-sm font-bold text-slate-800 dark:text-slate-200">{signup.name}</td>
                              <td className="p-4 text-sm text-slate-600 dark:text-slate-400 font-medium">{signup.email}</td>
                              <td className="p-4 text-xs font-mono text-slate-500 dark:text-slate-400">{signup.number}</td>
                              <td className="p-4 text-xs font-mono text-slate-500 dark:text-slate-400 text-right">{signup.registrationDate}</td>
                            </tr>
                          ))
                      )}
                    </tbody>
                  </table>
                )}
              </div>
            </motion.div>
          </motion.div>
        );

      case "ledger":
        const totalAmountEarned = totalReferralIncome;
        const payoutsDoneAmount = payouts
          .filter((p) => p.status === "Completed")
          .reduce((sum, p) => sum + p.amount, 0);

        // Derive invoices dynamically from database payout records
        const affiliateInvoices = payouts.map(p => ({
          id: p.id,
          number: p.invoiceRef,
          date: p.date,
          amount: p.amount,
          status: p.status,
          type: "Self-Billing Statement"
        }));

        return (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="space-y-6"
          >
            {/* Elegant Info Message Banner with Tooltip (i button) */}
            <motion.div
              variants={itemVariants}
              className="rounded-2xl border p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 backdrop-blur-md shadow-sm"
              style={{
                background: isDark ? "rgba(244, 63, 94, 0.05)" : "#fff5f5",
                borderColor: isDark ? "rgba(244, 63, 94, 0.15)" : "#fecdd3",
              }}
            >
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400">
                  <Info className="h-5 w-5 animate-bounce" />
                </div>
                <div className="text-xs font-semibold text-slate-700 dark:text-slate-300 leading-relaxed">
                  Payouts for <span className="font-extrabold text-rose-600 dark:text-rose-400">WLH Promoters</span> will be processed on the 15th of every month.
                </div>
              </div>

              {/* (i Button) Tooltip Policy Trigger */}
              <div className="relative group">
                <button
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-[11px] font-bold uppercase transition-all bg-white hover:bg-slate-50 border-slate-200 text-slate-600 dark:bg-slate-900 dark:hover:bg-slate-800 dark:border-slate-800 dark:text-slate-300 cursor-pointer"
                >
                  <HelpCircle className="h-3.5 w-3.5 text-rose-500" />
                  View Threshold Policy
                </button>
                {/* Custom hovering pure CSS tooltip */}
                <div className="absolute right-0 bottom-full mb-2 w-72 p-3 rounded-xl shadow-xl border bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400 leading-relaxed opacity-0 invisible scale-95 group-hover:opacity-100 group-hover:visible group-hover:scale-100 transition-all duration-200 z-50 pointer-events-none">
                  <div className="font-bold text-slate-800 dark:text-slate-100 mb-1 flex items-center gap-1">
                    <Info className="h-3.5 w-3.5 text-rose-500" />
                    Minimum Payout Rules
                  </div>
                  A minimum payout threshold of <strong className="text-rose-600 dark:text-rose-400">₹1999</strong> applies to all partners. Accounts below this threshold will roll over to the next billing cycle automatically.
                </div>
              </div>
            </motion.div>

            {/* Financial Ledger Cards */}
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {/* Card 1: Total Amount Earned */}
              <motion.div variants={itemVariants}>
                <Card className="relative overflow-hidden border-slate-200 bg-white/70 p-6 shadow-sm backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/50">
                  <div className="absolute -right-3 -top-3 text-slate-100 dark:text-slate-800/20">
                    <Coins className="h-20 w-20" />
                  </div>
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                    <Coins className="h-4 w-4 text-violet-500" />
                    <span>Total Amount Earned</span>
                  </div>
                  <h3 className="mt-4 text-3xl font-black tracking-tight text-slate-900 dark:text-slate-50 tabular-nums">
                    ₹{totalAmountEarned.toFixed(2)}
                  </h3>
                  <div className="mt-3 text-[11px] font-semibold text-violet-600 dark:text-violet-400">
                    Lifetime cumulative earnings
                  </div>
                </Card>
              </motion.div>

              {/* Card 2: Payout Pending (Instant Payout Request) */}
              <motion.div variants={itemVariants}>
                <Card className="relative overflow-hidden border-slate-200 bg-white/70 p-6 shadow-sm backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/50">
                  <div className="absolute -right-3 -top-3 text-slate-100 dark:text-slate-800/20">
                    <PiggyBank className="h-20 w-20" />
                  </div>
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                    <PiggyBank className="h-4 w-4 text-emerald-500" />
                    <span>Payout Pending</span>
                  </div>
                  <h3 className="mt-4 text-3xl font-black tracking-tight text-slate-900 dark:text-slate-50 tabular-nums">
                    ₹{requestablePayout.toFixed(2)}
                  </h3>
                  <div className="mt-3.5 flex flex-col gap-2">
                    <Button
                      onClick={() => {
                        if (requestablePayout <= 0) {
                          toast.error("You do not have any pending payout to withdraw.");
                          return;
                        }
                        const fee = requestablePayout * 0.10;
                        const net = requestablePayout * 0.90;
                        requestPayout();
                        toast.success(`Instant payout requested! 10% fee (₹${fee.toFixed(2)}) applied. Net ₹${net.toFixed(2)} is being processed!`);
                      }}
                      disabled={requestablePayout <= 0}
                      className={`h-8 w-full rounded-lg text-xs font-bold shadow-md transition-all ${requestablePayout > 0
                        ? "bg-rose-600 text-white hover:bg-rose-700 hover:scale-[1.02]"
                        : "bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-600 cursor-not-allowed"
                        }`}
                    >
                      Early Payout Request (-10%)
                    </Button>
                    <div className="text-[9px] font-bold text-rose-500 dark:text-rose-400 text-center uppercase tracking-wider">
                      -10% early clearing fee applies
                    </div>
                  </div>
                </Card>
              </motion.div>

              {/* Card 3: Payouts Done */}
              <motion.div variants={itemVariants}>
                <Card className="relative overflow-hidden border-slate-200 bg-white/70 p-6 shadow-sm backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/50">
                  <div className="absolute -right-3 -top-3 text-slate-100 dark:text-slate-800/20">
                    <CheckCircle2 className="h-20 w-20" />
                  </div>
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                    <CheckCircle2 className="h-4 w-4 text-blue-500" />
                    <span>Payouts Done</span>
                  </div>
                  <h3 className="mt-4 text-3xl font-black tracking-tight text-slate-900 dark:text-slate-50 tabular-nums">
                    ₹{payoutsDoneAmount.toFixed(2)}
                  </h3>
                  <div className="mt-3 text-[11px] font-semibold text-blue-600 dark:text-blue-400">
                    Successfully disbursed payouts
                  </div>
                </Card>
              </motion.div>
            </div>

            {/* Invoices for Payouts Grid / History Table - Styled Like Systeme.io */}
            <div className="grid gap-6 lg:grid-cols-3">
              {/* Transactions History List */}
              <motion.div
                variants={itemVariants}
                className="rounded-2xl border flex flex-col overflow-hidden shadow-sm lg:col-span-1"
                style={{
                  background: isDark ? "rgba(30, 41, 59, 0.7)" : "rgba(255, 255, 255, 0.7)",
                  backdropFilter: "blur(16px)",
                  borderColor: isDark ? "rgba(255,255,255,0.05)" : "rgba(255,255,255,0.4)",
                }}
              >
                <div
                  className="p-4 border-b flex items-center gap-2"
                  style={{ borderColor: isDark ? "#334155" : "rgba(0,0,0,0.05)" }}
                >
                  <Activity className="h-4 w-4 text-rose-500 animate-pulse" />
                  <span className="text-sm font-bold text-slate-800 dark:text-slate-100">
                    Payout Status Log
                  </span>
                </div>
                <div className="overflow-x-auto custom-scrollbar">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr style={{ backgroundColor: isDark ? "rgba(15,23,42,0.95)" : "#F9FAFB" }}>
                        <th className="p-3 font-semibold text-xs uppercase tracking-wider text-slate-400 dark:text-slate-500">Date</th>
                        <th className="p-3 font-semibold text-xs uppercase tracking-wider text-slate-400 dark:text-slate-500">Amount</th>
                        <th className="p-3 font-semibold text-xs uppercase tracking-wider text-right text-slate-400 dark:text-slate-500">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200/50 dark:divide-slate-800/50">
                      {payouts.length === 0 ? (
                        <tr>
                          <td colSpan={3} className="p-4 text-center text-xs font-semibold text-slate-400 dark:text-slate-500">
                            No payouts logged yet.
                          </td>
                        </tr>
                      ) : (
                        payouts.map((pay) => (
                          <tr key={pay.id} className="hover:bg-black/5 dark:hover:bg-white/5 transition-colors" style={{ borderColor: isDark ? "#334155" : "#e2e8f0" }}>
                            <td className="p-3 text-slate-500 dark:text-slate-400 font-mono text-[11px]">{pay.date}</td>
                            <td className="p-3 text-xs font-bold text-slate-900 dark:text-slate-50">₹{pay.amount.toFixed(2)}</td>
                            <td className="p-3 text-right">
                              <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[9px] font-bold ${pay.status === "Completed"
                                ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400"
                                : "bg-blue-50 text-blue-600 dark:bg-blue-950/30 dark:text-blue-400"
                                }`}>
                                {pay.status}
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </motion.div>

              {/* Invoices for Payouts - Like Systeme.io */}
              <motion.div
                variants={itemVariants}
                className="rounded-2xl border flex flex-col overflow-hidden shadow-sm lg:col-span-2"
                style={{
                  background: isDark ? "rgba(30, 41, 59, 0.7)" : "rgba(255, 255, 255, 0.7)",
                  backdropFilter: "blur(16px)",
                  borderColor: isDark ? "rgba(255,255,255,0.05)" : "rgba(255,255,255,0.4)",
                }}
              >
                <div
                  className="p-4 border-b flex items-center gap-2"
                  style={{ borderColor: isDark ? "#334155" : "rgba(0,0,0,0.05)" }}
                >
                  <Receipt className="h-4 w-4 text-violet-500" />
                  <span className="text-sm font-bold text-slate-800 dark:text-slate-100">
                    Invoices for Payouts (Systeme Style)
                  </span>
                </div>
                <div className="overflow-x-auto custom-scrollbar">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr style={{ backgroundColor: isDark ? "rgba(15,23,42,0.95)" : "#F9FAFB" }}>
                        <th className="p-4 font-semibold text-xs uppercase tracking-wider text-slate-400 dark:text-slate-500">Invoice Ref #</th>
                        <th className="p-4 font-semibold text-xs uppercase tracking-wider text-slate-400 dark:text-slate-500">Statement Date</th>
                        <th className="p-4 font-semibold text-xs uppercase tracking-wider text-slate-400 dark:text-slate-500">Type</th>
                        <th className="p-4 font-semibold text-xs uppercase tracking-wider text-slate-400 dark:text-slate-500">Total Amount</th>
                        <th className="p-4 font-semibold text-xs uppercase tracking-wider text-right text-slate-400 dark:text-slate-500">Invoice</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200/50 dark:divide-slate-800/50">
                      {affiliateInvoices.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="p-4 text-center text-xs font-semibold text-slate-400 dark:text-slate-500">
                            No billing invoice statements generated yet.
                          </td>
                        </tr>
                      ) : (
                        affiliateInvoices.map((inv) => (
                          <tr key={inv.id} className="hover:bg-black/5 dark:hover:bg-white/5 transition-colors" style={{ borderColor: isDark ? "#334155" : "#e2e8f0" }}>
                            <td className="p-4 text-sm font-bold text-slate-800 dark:text-slate-200 font-mono">{inv.number}</td>
                            <td className="p-4 text-xs text-slate-500 dark:text-slate-400 font-mono">{inv.date}</td>
                            <td className="p-4 text-xs font-semibold text-slate-600 dark:text-slate-300">{inv.type}</td>
                            <td className="p-4 text-sm font-bold text-slate-900 dark:text-slate-50">₹{inv.amount.toFixed(2)}</td>
                            <td className="p-4 text-right">
                              <Button
                                onClick={() => toast.success(`Preparing and downloading billing PDF statement: ${inv.number}`)}
                                variant="outline"
                                size="sm"
                                className="h-7 text-[10px] font-bold gap-1 rounded-md border-slate-200 dark:border-slate-800 hover:scale-[1.01]"
                              >
                                <Copy className="h-3 w-3" />
                                PDF
                              </Button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            </div>
          </motion.div>
        );

      case "bank":
        return (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="w-full"
          >
            <motion.div
              variants={itemVariants}
              className="rounded-2xl border p-6 shadow-sm backdrop-blur-md"
              style={{
                background: isDark ? "rgba(30, 41, 59, 0.7)" : "rgba(255, 255, 255, 0.75)",
                borderColor: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.08)",
              }}
            >
              <div className="mb-6 flex items-center gap-3 border-b border-slate-100 pb-4 dark:border-slate-800">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-50 dark:bg-rose-500/10 text-rose-500">
                  <Landmark className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">
                    Bank Payout Method Setup
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Configure your primary bank details where payouts should be transferred securely.
                  </p>
                </div>
              </div>

              <form onSubmit={handleSaveBankDetails} className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  {/* Account Holder Name */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                      Account Holder Name
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Enter account holder name"
                      value={bankDetails.holderName}
                      onChange={(e) =>
                        setBankDetails((p) => ({ ...p, holderName: e.target.value }))
                      }
                      className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-2.5 text-sm outline-none transition-all focus:border-rose-400 dark:border-slate-800 dark:bg-slate-950/40 dark:text-slate-100 dark:focus:border-rose-800"
                    />
                  </div>

                  {/* Bank Branch */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                      Bank Branch
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Connaught Place, New Delhi"
                      value={bankDetails.bankBranch}
                      onChange={(e) =>
                        setBankDetails((p) => ({ ...p, bankBranch: e.target.value }))
                      }
                      className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-2.5 text-sm outline-none transition-all focus:border-rose-400 dark:border-slate-800 dark:bg-slate-950/40 dark:text-slate-100 dark:focus:border-rose-800"
                    />
                  </div>

                  {/* Bank Account Number */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                        Bank Account Number
                      </label>
                      {isAccountSubmitted && (
                        <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-200/30 flex items-center gap-1">
                          <Lock className="h-3 w-3" /> Locked
                        </span>
                      )}
                    </div>
                    <input
                      type={isAccountSubmitted ? "password" : "text"}
                      required
                      disabled={isAccountSubmitted}
                      placeholder="Enter bank account number"
                      value={bankDetails.accountNumber}
                      onChange={(e) =>
                        setBankDetails((p) => ({ ...p, accountNumber: e.target.value }))
                      }
                      className={`w-full rounded-xl border p-2.5 text-sm outline-none transition-all font-mono ${isAccountSubmitted
                        ? "bg-slate-100 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed"
                        : "bg-slate-50/50 border-slate-200 focus:border-rose-400 dark:border-slate-800 dark:bg-slate-950/40 dark:text-slate-100 dark:focus:border-rose-800"
                        }`}
                    />
                  </div>

                  {/* Confirm Bank Account Number */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                        Confirm Bank Account Number
                      </label>
                    </div>
                    <input
                      type={isAccountSubmitted ? "password" : "text"}
                      required
                      disabled={isAccountSubmitted}
                      placeholder="Confirm bank account number"
                      value={confirmAccountNumber}
                      onChange={(e) => setConfirmAccountNumber(e.target.value)}
                      className={`w-full rounded-xl border p-2.5 text-sm outline-none transition-all font-mono ${isAccountSubmitted
                        ? "bg-slate-100 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed"
                        : "bg-slate-50/50 border-slate-200 focus:border-rose-400 dark:border-slate-800 dark:bg-slate-950/40 dark:text-slate-100 dark:focus:border-rose-800"
                        }`}
                    />
                  </div>

                  {/* Account Number Modification Notice */}
                  <div className="sm:col-span-2 text-xs font-semibold text-slate-400 dark:text-slate-500 flex items-center gap-1.5 leading-relaxed">
                    <span>⚠️ Account Number once submitted can not be changed. If required to change, please contact <a href="mailto:support@webinarleadshub.com" className="text-rose-500 hover:text-rose-600 font-bold underline">support@webinarleadshub.com</a></span>
                  </div>

                  {/* IFSC Code */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                      IFSC Code
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. HDFC0000123"
                      value={bankDetails.ifscCode}
                      onChange={(e) =>
                        setBankDetails((p) => ({ ...p, ifscCode: e.target.value.toUpperCase() }))
                      }
                      className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-2.5 text-sm outline-none transition-all focus:border-rose-400 dark:border-slate-800 dark:bg-slate-950/40 dark:text-slate-100 dark:focus:border-rose-800 font-mono"
                    />
                  </div>

                  {/* UPI ID */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                      UPI ID
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. johndoe@upi"
                      value={bankDetails.upiId}
                      onChange={(e) => setBankDetails((p) => ({ ...p, upiId: e.target.value }))}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-2.5 text-sm outline-none transition-all focus:border-rose-400 dark:border-slate-800 dark:bg-slate-950/40 dark:text-slate-100 dark:focus:border-rose-800 font-mono"
                    />
                  </div>

                  {/* PAN CARD - Upload File */}
                  <div className="space-y-2 sm:col-span-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                      PAN CARD - Upload File
                    </label>
                    <div
                      className="border-2 border-dashed rounded-2xl p-6 text-center transition-all bg-slate-50/20 dark:bg-slate-900/10 hover:bg-slate-50/40 dark:hover:bg-slate-900/20 flex flex-col items-center justify-center cursor-pointer relative"
                      style={{
                        borderColor: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)",
                      }}
                    >
                      <input
                        type="file"
                        accept="image/*,application/pdf"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            setBankDetails((p) => ({ ...p, panCardFile: file.name }));
                            toast.success(`PAN Card selected: ${file.name}`);
                          }
                        }}
                        className="absolute inset-0 opacity-0 cursor-pointer"
                      />
                      {bankDetails.panCardFile ? (
                        <div className="flex flex-col items-center gap-1.5">
                          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-500">
                            <Check className="h-5 w-5" />
                          </div>
                          <span className="text-sm font-bold text-slate-700 dark:text-slate-200">
                            {bankDetails.panCardFile}
                          </span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setBankDetails((p) => ({ ...p, panCardFile: null }));
                              toast.info("PAN Card file removed.");
                            }}
                            className="text-xs font-bold text-rose-500 hover:text-rose-600 underline cursor-pointer"
                          >
                            Remove File
                          </button>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-2">
                          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-500/10 text-rose-500">
                            <ArrowUpRight className="h-5 w-5 rotate-45" />
                          </div>
                          <div className="text-sm font-bold text-slate-700 dark:text-slate-300">
                            Click or drag file to upload PAN Card
                          </div>
                          <div className="text-[10px] text-slate-400 dark:text-slate-500">
                            Supported: PDF, JPG, PNG (Max 5MB)
                          </div>
                        </div>
                      )}
                    </div>
                    <p className="text-[10px] font-bold text-amber-500 dark:text-amber-400 bg-amber-500/5 px-2.5 py-1.5 rounded-lg border border-amber-500/20 text-center uppercase tracking-wider">
                      ⚠️ (PAN CARD HOLDER * ACCOUNT HOLDER NAME MUST MATCH)
                    </p>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-2 text-[10px] text-slate-400 dark:text-slate-500 font-semibold uppercase tracking-wider">
                    <Lock className="h-3.5 w-3.5 text-emerald-500" />
                    Encrypted and securely processed
                  </div>
                  <Button
                    type="submit"
                    disabled={savingBank}
                    className="h-10 rounded-xl bg-rose-600 px-5 text-xs font-bold text-white hover:bg-rose-700 shadow-md shadow-rose-600/20 transition-all hover:scale-[1.02] flex items-center gap-2"
                  >
                    {savingBank ? (
                      <>
                        <Activity className="h-3.5 w-3.5 animate-spin" />
                        Saving Secured Details...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Save Account Details
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        );

      case "plans":
        return (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="space-y-6"
          >
            {/* Top explainer in a full-width Card */}
            <motion.div variants={itemVariants} className="w-full">
              <Card
                className="relative overflow-hidden border p-6 shadow-sm backdrop-blur-md"
                style={{
                  background: isDark ? "rgba(30, 41, 59, 0.7)" : "rgba(255, 255, 255, 0.75)",
                  borderColor: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.08)",
                }}
              >
                <h3 className="text-lg font-black text-slate-800 dark:text-slate-100 flex items-center gap-2">
                  <Award className="h-5 w-5 text-rose-500 animate-pulse" />
                  Affiliate Partnership Tiers & Rewards
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                  As your referred network expands, your commission tier upgrades! Unlock increased payouts, direct access to priority clearing, and premium custom commission packages.
                </p>
              </Card>
            </motion.div>

            {/* Matrix of Plans */}
            <div className="grid gap-6 md:grid-cols-2 w-full">
              {/* WLH Promoters */}
              <motion.div
                variants={itemVariants}
                className="relative rounded-2xl border p-6 shadow-sm backdrop-blur-md flex flex-col justify-between min-h-[340px] transition-all hover:shadow-md"
                style={{
                  background: isDark ? "rgba(30, 41, 59, 0.5)" : "white",
                  borderColor: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.08)",
                }}
              >
                <div>
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-500/10 text-orange-600 dark:bg-orange-500/20 dark:text-orange-400">
                    <Sparkles className="h-5 w-5" />
                  </div>
                  <h4 className="mt-4 text-xs font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">
                    Standard Partner Tier
                  </h4>
                  <h3 className="mt-1 text-2xl font-black text-slate-900 dark:text-slate-50">
                    WLH Promoters
                  </h3>

                  {/* Rates */}
                  <div className="mt-4 grid grid-cols-2 gap-2 bg-slate-50 dark:bg-slate-900/50 p-3 rounded-xl border border-slate-100 dark:border-slate-800/40">
                    <div className="text-center border-r border-slate-100 dark:border-slate-800">
                      <span className="block text-[10px] font-bold text-slate-400 uppercase">Tier A (Direct)</span>
                      <span className="text-lg font-black text-rose-500">20%</span>
                    </div>
                    <div className="text-center">
                      <span className="block text-[10px] font-bold text-slate-400 uppercase">Tier B (Passive)</span>
                      <span className="text-lg font-black text-rose-500">2%</span>
                    </div>
                  </div>

                  <p className="mt-4 text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                    Our standard partner package. Receive 20% direct commission on all direct sales and 2% passive commission on all sub-referrals registered under your link.
                  </p>
                </div>
                <div className="pt-4 mt-6 border-t border-slate-100 dark:border-slate-800 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> Active by Default
                </div>
              </motion.div>

              {/* WLH PRIME Promoters */}
              <motion.div
                variants={itemVariants}
                className="relative rounded-2xl border p-6 shadow-sm backdrop-blur-md flex flex-col justify-between min-h-[340px] transition-all hover:shadow-md border-rose-500/30"
                style={{
                  background: isDark ? "rgba(244, 63, 94, 0.05)" : "#fffbfe",
                }}
              >
                <div className="absolute right-4 top-4 rounded-full bg-rose-500/10 px-2.5 py-0.5 text-[9px] font-black uppercase tracking-wider text-rose-600 dark:text-rose-400 animate-pulse">
                  Premium Prime
                </div>
                <div>
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-500/10 text-rose-500 dark:bg-rose-500/20 dark:text-rose-400">
                    <Crown className="h-5 w-5" />
                  </div>
                  <h4 className="mt-4 text-xs font-black uppercase tracking-widest text-rose-500 dark:text-rose-400">
                    Premium Partner Tier
                  </h4>
                  <h3 className="mt-1 text-2xl font-black text-slate-900 dark:text-slate-50 flex items-baseline gap-1">
                    WLH PRIME Promoters
                  </h3>
                  <div className="text-[10px] font-bold text-rose-500 dark:text-rose-400">
                    Yearly Membership @ ₹9999 + GST
                  </div>

                  {/* Rates */}
                  <div className="mt-4 grid grid-cols-2 gap-2 bg-rose-500/5 p-3 rounded-xl border border-rose-500/10">
                    <div className="text-center border-r border-rose-500/10">
                      <span className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">Tier A (Direct)</span>
                      <span className="text-lg font-black text-rose-600 dark:text-rose-400">25%</span>
                    </div>
                    <div className="text-center">
                      <span className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">Tier B (Passive)</span>
                      <span className="text-lg font-black text-rose-600 dark:text-rose-400">5%</span>
                    </div>
                  </div>

                  {/* Feature Perk */}
                  <div className="mt-3 flex items-center gap-1.5 bg-emerald-500/10 dark:bg-emerald-500/25 px-2.5 py-1.5 rounded-lg border border-emerald-500/20">
                    <Zap className="h-3.5 w-3.5 text-emerald-500" />
                    <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                      Instant Payout Fee - 7.5% Only
                    </span>
                  </div>

                  <p className="mt-4 text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                    Become a Prime Promoter to boost Direct commissions to 25% and Passive commissions to 5%. Plus, enjoy lowered early clearing instant fee support of just 7.5%.
                  </p>
                </div>
                <div className="pt-4 mt-6 border-t border-rose-500/10 text-[10px] font-bold text-rose-500 dark:text-rose-400 uppercase tracking-widest flex items-center gap-1">
                  <ArrowRight className="h-3.5 w-3.5 text-rose-500" /> Upgrade to Prime Tier
                </div>
              </motion.div>
            </div>
          </motion.div>
        );

      default: // dashboard case
        return (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="space-y-6"
          >
            {/* 1. Landscape Balanced Video Hero Section with Animated Side Decorations */}
            <motion.div
              variants={itemVariants}
              className="relative w-full rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-900/20 py-5 px-4 md:px-8 overflow-hidden flex flex-col items-center justify-center min-h-[480px] shadow-sm backdrop-blur-sm"
            >
              {/* Inline CSS styles for floating animations */}
              <style dangerouslySetInnerHTML={{
                __html: `
                @keyframes floatSlow {
                  0%, 100% { transform: translateY(0px) rotate(0deg); }
                  50% { transform: translateY(-20px) rotate(5deg); }
                }
                @keyframes floatMedium {
                  0%, 100% { transform: translateY(0px) rotate(0deg); }
                  50% { transform: translateY(-15px) rotate(-8deg); }
                }
                @keyframes floatFast {
                  0%, 100% { transform: translateY(0px) rotate(0deg); }
                  50% { transform: translateY(-10px) rotate(12deg); }
                }
                .animate-float-slow {
                  animation: floatSlow 8s ease-in-out infinite;
                }
                .animate-float-medium {
                  animation: floatMedium 6s ease-in-out infinite;
                }
                .animate-float-fast {
                  animation: floatFast 4s ease-in-out infinite;
                }
              `}} />
              {/* Dynamic Animated Floating Coins & Currency Symbols (Decorations on Left and Right) */}
              <div className="absolute inset-0 pointer-events-none overflow-hidden select-none">
                {/* Left Side Floating Icons */}
                <div className="absolute left-[8%] top-[15%] text-rose-500/20 dark:text-rose-500/10 text-5xl font-black animate-float-slow">
                  ₹
                </div>
                <div className="absolute left-[15%] bottom-[20%] text-emerald-500/20 dark:text-emerald-500/10 text-4xl font-extrabold animate-float-fast">
                  $
                </div>
                <div className="absolute left-[6%] top-[55%] text-amber-500/20 dark:text-amber-500/10 text-3xl animate-float-medium">
                  <Coins className="h-8 w-8" />
                </div>

                {/* Right Side Floating Icons */}
                <div className="absolute right-[8%] top-[25%] text-rose-500/20 dark:text-rose-500/10 text-5xl font-black animate-float-medium">
                  ₹
                </div>
                <div className="absolute right-[16%] bottom-[15%] text-rose-500/20 dark:text-rose-500/10 text-3xl font-extrabold animate-float-slow">
                  ₹
                </div>
                <div className="absolute right-[7%] top-[60%] text-amber-500/20 dark:text-amber-500/10 text-4xl animate-float-fast">
                  <Coins className="h-10 w-10" />
                </div>
              </div>

              {/* Main Content Container (Landscape Video Player centered) */}
              <div className="relative z-10 w-full max-w-[850px] aspect-video rounded-2xl overflow-hidden border-2 border-white dark:border-slate-800 shadow-2xl bg-slate-950 dark:bg-slate-950 group transition-transform duration-300 hover:scale-[1.005]">
                {/* Playable Training Video */}
                <iframe
                  src="https://www.youtube.com/embed/dQw4w9WgXcQ?rel=0"
                  className="w-full h-full border-0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  title="Understanding the Partner Program"
                />
              </div>

              {/* Little elegant subtitle badge under the video player */}
              <div className="mt-4 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-[10px] font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400 z-10 flex items-center gap-1.5 animate-pulse">
                <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
                Partner Program Video Guide
              </div>
            </motion.div>

            {/* 2. Onboarding Steps Card */}
            <motion.div
              variants={itemVariants}
              className="rounded-2xl border p-6 md:p-8 shadow-sm backdrop-blur-md"
              style={{
                background: isDark ? "rgba(30, 41, 59, 0.7)" : "rgba(255, 255, 255, 0.7)",
                borderColor: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.08)",
              }}
            >
              <div className="max-w-3xl mb-8">
                <h3 className="text-2xl font-black text-slate-900 dark:text-slate-50 flex items-center gap-2">
                  <Sparkles className="h-6 w-6 text-rose-500 animate-pulse" />
                  Let's get started
                </h3>
                <p className="text-sm text-slate-500 mt-2 dark:text-slate-400 leading-relaxed font-medium">
                  Follow these simple steps to unlock your earning potential and make the most of your partnership!
                </p>
              </div>

              {/* Responsive Steps Grid */}
              <div className="grid gap-6 md:grid-cols-3">
                {/* Step 1 */}
                {/* Step 1 */}
                <motion.div
                  whileHover={{ y: -6, scale: 1.02 }}
                  transition={{ type: "spring", stiffness: 350, damping: 18 }}
                  className="relative overflow-hidden rounded-xl border border-slate-200/50 bg-slate-50/50 p-5 transition-all hover:shadow-md dark:border-slate-800/40 dark:bg-slate-950/20 flex flex-col justify-between cursor-pointer"
                >
                  <div className="absolute -right-4 -top-4 flex h-14 w-14 items-center justify-center rounded-full bg-rose-500/5 text-rose-500/10 font-black text-4xl select-none">
                    1
                  </div>
                  <div>
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-500/10 text-rose-600 dark:bg-rose-500/20 dark:text-rose-400 font-extrabold text-sm mb-3">
                      1
                    </div>
                    <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 leading-snug">
                      Understanding the Partner Program
                    </h4>
                    <p className="mt-2 text-xs font-medium text-slate-500 dark:text-slate-400 leading-relaxed">
                      Get to know how the Partner Program works and the exciting benefits you'll enjoy. Watch this short video for a complete overview.
                    </p>
                  </div>
                </motion.div>

                {/* Step 2 */}
                <motion.div
                  whileHover={{ y: -6, scale: 1.02 }}
                  transition={{ type: "spring", stiffness: 350, damping: 18 }}
                  className="relative overflow-hidden rounded-xl border border-slate-200/50 bg-slate-50/50 p-5 transition-all hover:shadow-md dark:border-slate-800/40 dark:bg-slate-950/20 flex flex-col justify-between cursor-pointer"
                >
                  <div className="absolute -right-4 -top-4 flex h-14 w-14 items-center justify-center rounded-full bg-rose-500/5 text-rose-500/10 font-black text-4xl select-none">
                    2
                  </div>
                  <div>
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-500/10 text-rose-600 dark:bg-rose-500/20 dark:text-rose-400 font-extrabold text-sm mb-3">
                      2
                    </div>
                    <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 leading-snug">
                      Share Your Referral Link
                    </h4>
                    <p className="mt-2 text-xs font-medium text-slate-500 dark:text-slate-400 leading-relaxed">
                      Your unique referral link is ready! Share it with your network to promote our products and start earning commissions.
                    </p>
                  </div>
                </motion.div>

                {/* Step 3 */}
                <motion.div
                  whileHover={{ y: -6, scale: 1.02 }}
                  transition={{ type: "spring", stiffness: 350, damping: 18 }}
                  className="relative overflow-hidden rounded-xl border border-slate-200/50 bg-slate-50/50 p-5 transition-all hover:shadow-md dark:border-slate-800/40 dark:bg-slate-950/20 flex flex-col justify-between cursor-pointer"
                >
                  <div className="absolute -right-4 -top-4 flex h-14 w-14 items-center justify-center rounded-full bg-rose-500/5 text-rose-500/10 font-black text-4xl select-none">
                    3
                  </div>
                  <div>
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-500/10 text-rose-600 dark:bg-rose-500/20 dark:text-rose-400 font-extrabold text-sm mb-3">
                      3
                    </div>
                    <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 leading-snug">
                      Track and Earn
                    </h4>
                    <p className="mt-2 text-xs font-medium text-slate-500 dark:text-slate-400 leading-relaxed">
                      Keep an eye on your referrals and commissions in the dashboard. Use insights and tools to grow your success.
                    </p>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          </motion.div>
        );
    }
  };

  const getPageHeaderLabel = () => {
    switch (view) {
      case "referrals":
        return "My Referral Network";
      case "ledger":
        return "Commission & Payout Ledger";
      case "bank":
        return "Secure Bank Details Setup";
      case "plans":
        return "Affiliate Plans Matrix";
      default:
        return "Affiliate Dashboard";
    }
  };

  const getPageSubheaderLabel = () => {
    switch (view) {
      case "referrals":
        return "Track Tier-1 direct accounts and passive Tier-2 sub-affiliates conversion rates.";
      case "ledger":
        return "View your lifetime earnings ledger, audit transactions, and claim payout clearing.";
      case "bank":
        return "Configure encrypted bank accounts or PayPal credentials for direct wire transfers.";
      case "plans":
        return "Compare referral program tiers, sub-commission levels, and custom business rates.";
      default:
        return "Track your lifetime earnings, referral history, and manage payout requests.";
    }
  };

  return (
    <div className="relative pt-2 pb-6 px-4 sm:px-6 lg:px-8 max-w-[1600px] mx-auto space-y-5 transition-all duration-300 overflow-hidden">
      {/* Premium Ambient Glowing Background Spotlights (Eye-catching visual element) */}
      <div className="absolute inset-0 -z-10 pointer-events-none overflow-hidden select-none">
        <div className="absolute -top-[10%] left-[20%] w-[350px] h-[350px] rounded-full bg-rose-500/10 dark:bg-rose-500/5 blur-[90px] animate-pulse" style={{ animationDuration: '6s' }} />
        <div className="absolute top-[30%] -right-[5%] w-[400px] h-[400px] rounded-full bg-indigo-500/10 dark:bg-indigo-500/5 blur-[120px] animate-pulse" style={{ animationDuration: '8s' }} />
        <div className="absolute -bottom-[10%] left-[5%] w-[300px] h-[300px] rounded-full bg-rose-500/10 dark:bg-rose-500/5 blur-[80px] animate-pulse" style={{ animationDuration: '7s' }} />
      </div>

      {/* 1. Header Section Styled exactly like Products Table */}
      <motion.div
        className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-3"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
      >
        <div>
          <h2 className="text-2xl font-bold tracking-tight flex items-center gap-3 flex-wrap text-slate-900 dark:text-slate-50">
            {getPageHeaderLabel()}
            <span
              className="text-xs font-semibold px-2.5 py-1 rounded-lg"
              style={{
                backgroundColor: isDark ? "rgba(244, 63, 94, 0.15)" : "#fff5f5",
                color: isDark ? "#f43f5e" : "#e11d48",
                border: `1px solid ${isDark ? "rgba(244, 63, 94, 0.3)" : "#fecdd3"}`,
              }}
            >
              2-Tier System Active
            </span>
          </h2>
          <p className="text-sm text-slate-500 mt-1 dark:text-slate-400">
            {getPageSubheaderLabel()}
          </p>
        </div>

        {/* Referral Link Quick Copy Box (Header Action) */}
        <div className="w-full shrink-0 rounded-2xl border border-slate-200 bg-white p-3.5 shadow-sm dark:border-slate-800/80 dark:bg-slate-900/60 sm:w-80 backdrop-blur-md">
          <div className="mb-2 flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            <span>Your Referral Link</span>
            <Share2 className="h-3.5 w-3.5 text-rose-500 animate-pulse" />
          </div>
          <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50/50 p-1.5 dark:border-slate-800 dark:bg-slate-950/40">
            <span className="w-full truncate pl-2 font-mono text-xs text-slate-600 dark:text-slate-300">
              {referralLink}
            </span>
            <Button
              onClick={handleCopyLink}
              size="sm"
              className={`h-8 shrink-0 gap-1.5 rounded-lg px-3 font-semibold transition-all ${copied
                ? "bg-emerald-500 text-white hover:bg-emerald-600"
                : "bg-rose-600 text-white hover:bg-rose-700"
                }`}
            >
              {copied ? (
                <>
                  <Check className="h-3.5 w-3.5" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" />
                  Copy
                </>
              )}
            </Button>
          </div>
        </div>
      </motion.div>

      {/* 2. Primary Page Views Render */}
      <AnimatePresence mode="wait">
        <motion.div
          key={view}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 10 }}
          transition={{ duration: 0.22, ease: "easeOut" }}
        >
          {loading ? (
            <div className="h-[40vh] w-full flex items-center justify-center bg-transparent">
              <div className="flex flex-col items-center gap-3 animate-pulse">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-rose-500"></div>
                <span className="text-sm font-extrabold text-slate-500 dark:text-slate-400">Loading affiliate details...</span>
              </div>
            </div>
          ) : (
            renderViewContent()
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default AffiliateDashboard;
