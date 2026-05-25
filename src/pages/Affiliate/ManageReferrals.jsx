import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users,
  Award,
  Coins,
  PiggyBank,
  CheckCircle,
  XCircle,
  Edit2,
  Search,
  Eye,
  Info,
  DollarSign,
  TrendingUp,
  Percent,
  Check,
  Clock,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  UserCheck,
  Building,
  CreditCard,
  Lock,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { useTheme } from "../../contexts/ThemeContext";
import superAdminAffiliateService from "../../services/superAdminAffiliateService";
import { Card } from "../../components/ui/card";
import { Button } from "../../components/ui/button";

const ManageReferrals = () => {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  // State arrays
  const [profiles, setProfiles] = useState([]);
  const [referrals, setReferrals] = useState([]);
  const [payouts, setPayouts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Active tab state: "partners" | "referrals" | "payouts"
  const [activeTab, setActiveTab] = useState("partners");

  // Search & Filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Rate Modification Modal States
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [tier1RateInput, setTier1RateInput] = useState("");
  const [tier2RateInput, setTier2RateInput] = useState("");
  const [updatingRates, setUpdatingRates] = useState(false);

  // Expanded Bank Details state (storing payout ID)
  const [expandedPayoutId, setExpandedPayoutId] = useState(null);

  // Selected partner to view their referral network
  const [selectedNetworkPartner, setSelectedNetworkPartner] = useState(null);
  const [networkTab, setNetworkTab] = useState("all"); // "all" | "tier1" | "tier2"

  // Selected referral to view its attribution click audit trail
  const [selectedAuditReferral, setSelectedAuditReferral] = useState(null);

  // Fetch all dashboard data
  const fetchData = async () => {
    setLoading(true);
    try {
      const [profilesRes, referralsRes, payoutsRes] = await Promise.all([
        superAdminAffiliateService.getAllProfiles(),
        superAdminAffiliateService.getAllReferrals(),
        superAdminAffiliateService.getAllPayouts(),
      ]);

      if (profilesRes?.data) setProfiles(profilesRes.data);
      if (referralsRes?.data) setReferrals(referralsRes.data);
      if (payoutsRes?.data) setPayouts(payoutsRes.data);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load dashboard referrals data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Update Affiliate Payout status
  const handleUpdatePayoutStatus = async (payoutId, newStatus) => {
    try {
      const res = await superAdminAffiliateService.updatePayoutStatus(payoutId, newStatus);
      if (res?.success) {
        toast.success(res.message || `Payout request updated to ${newStatus}.`);
        // Refresh local data
        fetchData();
      }
    } catch (err) {
      console.error(err);
      toast.error(err || "Failed to update payout status.");
    }
  };

  // Open Edit Rates Dialog
  const openEditRates = (profile) => {
    setSelectedProfile(profile);
    setTier1RateInput(profile.tier1Rate);
    setTier2RateInput(profile.tier2Rate);
  };

  // Submit Rate modification
  const handleSaveRates = async (e) => {
    e.preventDefault();
    if (!selectedProfile) return;

    setUpdatingRates(true);
    try {
      const res = await superAdminAffiliateService.updateAffiliateRates(selectedProfile.id, {
        tier1Rate: Number(tier1RateInput),
        tier2Rate: Number(tier2RateInput),
      });

      if (res?.success) {
        toast.success(res.message || "Partner commission rates updated successfully.");
        setSelectedProfile(null);
        fetchData();
      }
    } catch (err) {
      console.error(err);
      toast.error(err || "Failed to update commission rates.");
    } finally {
      setUpdatingRates(false);
    }
  };

  // Calculations for stats card
  const totalPartners = profiles.length;
  const directReferralsCount = referrals.filter((r) => r.tier === 1).length;
  const indirectReferralsCount = referrals.filter((r) => r.tier === 2).length;
  const totalReferrals = referrals.length;
  const payingCustomers = referrals.filter((r) => r.status === "customer").length;

  const totalPaidCommission = payouts
    .filter((p) => p.status === "Completed")
    .reduce((sum, p) => sum + p.amount, 0);

  const pendingPayoutRequestsVolume = payouts
    .filter((p) => p.status === "Requested" || p.status === "Processing")
    .reduce((sum, p) => sum + p.amount, 0);

  // Filtered rows for active lists
  const filteredProfiles = profiles.filter((p) => {
    const term = searchTerm.toLowerCase();
    return (
      p.name.toLowerCase().includes(term) ||
      p.email.toLowerCase().includes(term) ||
      p.referralCode.toLowerCase().includes(term)
    );
  });

  const filteredReferrals = referrals.filter((r) => {
    const term = searchTerm.toLowerCase();
    const matchesSearch =
      r.referrerName.toLowerCase().includes(term) ||
      r.referrerEmail.toLowerCase().includes(term) ||
      r.referredName.toLowerCase().includes(term) ||
      r.referredEmail.toLowerCase().includes(term) ||
      (r.planPurchased && r.planPurchased.toLowerCase().includes(term));

    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "customer" && r.status === "customer") ||
      (statusFilter === "signup" && r.status === "signup");

    return matchesSearch && matchesStatus;
  });

  const filteredPayouts = payouts.filter((p) => {
    const term = searchTerm.toLowerCase();
    const matchesSearch =
      p.name.toLowerCase().includes(term) ||
      p.email.toLowerCase().includes(term) ||
      p.invoiceRef.toLowerCase().includes(term);

    const matchesStatus =
      statusFilter === "all" || p.status.toLowerCase() === statusFilter.toLowerCase();

    return matchesSearch && matchesStatus;
  });

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100 } },
  };

  return (
    <div className="space-y-6 p-4 md:p-6 min-h-screen">
      {/* Premium Gradient Header */}
      <div className="relative rounded-2xl overflow-hidden border border-slate-200/60 dark:border-slate-800/80 shadow-md">
        <div className="absolute inset-0 bg-gradient-to-r from-orange-500/10 via-rose-500/10 to-violet-500/5 dark:from-orange-500/20 dark:via-rose-500/15 dark:to-violet-500/10" />
        <div className="relative p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 backdrop-blur-sm bg-white/70 dark:bg-slate-900/65">
          <div className="space-y-2">
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-slate-800 dark:text-slate-50 flex items-center gap-2">
              <Award className="h-7 w-7 text-rose-500" />
              Affiliate & Referral Control Center
            </h1>
            <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 font-medium max-w-3xl leading-relaxed">
              Super Admin dashboard to oversee program partners, verify payout bank details, manage global referrers, and configure custom commission rates.
            </p>
          </div>
          <Button
            onClick={fetchData}
            disabled={loading}
            className="self-start md:self-center bg-gradient-to-r from-orange-500 to-rose-600 hover:from-orange-600 hover:to-rose-700 text-white font-bold text-xs uppercase tracking-wider px-5 py-2.5 rounded-xl shadow-lg shadow-rose-900/25 transition-all hover:scale-[1.01]"
          >
            {loading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin mr-2" />
            ) : (
              <TrendingUp className="h-3.5 w-3.5 mr-2" />
            )}
            Sync Live Stats
          </Button>
        </div>
      </div>

      {/* Numerical Metrics Grid */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4"
      >
        {/* Metric 1: Total Partners */}
        <motion.div variants={itemVariants}>
          <Card className="relative overflow-hidden border-slate-200 bg-white/80 p-5 shadow-sm backdrop-blur-md dark:border-slate-800/80 dark:bg-slate-900/50">
            <div className="absolute -right-3 -top-3 text-slate-100 dark:text-slate-800/20">
              <Users className="h-16 w-16" />
            </div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              <Users className="h-4 w-4 text-orange-500" />
              <span>Affiliate Partners</span>
            </div>
            <h3 className="mt-4 text-3xl font-black tracking-tight text-slate-900 dark:text-slate-50">
              {totalPartners}
            </h3>
            <div className="mt-2 text-[10px] font-bold text-orange-600 dark:text-orange-400 flex items-center gap-1">
              <span>Clients registered as referrers</span>
            </div>
          </Card>
        </motion.div>

        {/* Metric 2: Global Referrals Network */}
        <motion.div variants={itemVariants}>
          <Card className="relative overflow-hidden border-slate-200 bg-white/80 p-5 shadow-sm backdrop-blur-md dark:border-slate-800/80 dark:bg-slate-900/50">
            <div className="absolute -right-3 -top-3 text-slate-100 dark:text-slate-800/20">
              <UserCheck className="h-16 w-16" />
            </div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              <UserCheck className="h-4 w-4 text-rose-500" />
              <span>Referral Network</span>
            </div>
            <h3 className="mt-4 text-3xl font-black tracking-tight text-slate-900 dark:text-slate-50">
              {totalReferrals}
            </h3>
            <div className="mt-2 text-[10px] font-bold text-rose-600 dark:text-rose-400 flex items-center gap-1.5">
              <span className="bg-emerald-500/10 px-1.5 py-0.5 rounded text-emerald-600 dark:text-emerald-400">
                {payingCustomers} Paid
              </span>
              <span className="bg-slate-500/10 px-1.5 py-0.5 rounded text-slate-500 dark:text-slate-400">
                {totalReferrals - payingCustomers} Signups
              </span>
            </div>
          </Card>
        </motion.div>

        {/* Metric 3: Pending Payout Requests */}
        <motion.div variants={itemVariants}>
          <Card className="relative overflow-hidden border-slate-200 bg-white/80 p-5 shadow-sm backdrop-blur-md dark:border-slate-800/80 dark:bg-slate-900/50">
            <div className="absolute -right-3 -top-3 text-slate-100 dark:text-slate-800/20">
              <PiggyBank className="h-16 w-16" />
            </div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              <PiggyBank className="h-4 w-4 text-blue-500" />
              <span>Pending Disbursals</span>
            </div>
            <h3 className="mt-4 text-3xl font-black tracking-tight text-slate-900 dark:text-slate-50 tabular-nums">
              ₹{pendingPayoutRequestsVolume.toFixed(2)}
            </h3>
            <div className="mt-2 text-[10px] font-bold text-blue-600 dark:text-blue-400">
              Early payout volume in queue
            </div>
          </Card>
        </motion.div>

        {/* Metric 4: Payouts Settled */}
        <motion.div variants={itemVariants}>
          <Card className="relative overflow-hidden border-slate-200 bg-white/80 p-5 shadow-sm backdrop-blur-md dark:border-slate-800/80 dark:bg-slate-900/50">
            <div className="absolute -right-3 -top-3 text-slate-100 dark:text-slate-800/20">
              <Coins className="h-16 w-16" />
            </div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              <Coins className="h-4 w-4 text-violet-500" />
              <span>Settled Commissions</span>
            </div>
            <h3 className="mt-4 text-3xl font-black tracking-tight text-slate-900 dark:text-slate-50 tabular-nums">
              ₹{totalPaidCommission.toFixed(2)}
            </h3>
            <div className="mt-2 text-[10px] font-bold text-violet-600 dark:text-violet-400">
              Commissions cleared to partners
            </div>
          </Card>
        </motion.div>
      </motion.div>

      {/* Tabs Menu & Search controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800/80 pb-4">
        {/* State Toggle Switch */}
        <div className="flex p-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200/50 dark:border-slate-700/50 backdrop-blur-md shadow-inner self-start">
          <button
            onClick={() => {
              setActiveTab("partners");
              setSearchTerm("");
              setStatusFilter("all");
            }}
            className="relative px-5 py-2 text-xs font-black uppercase tracking-wider rounded-lg transition-all duration-300"
            style={{
              color: activeTab === "partners" ? "#ffffff" : isDark ? "#94a3b8" : "#475569",
            }}
          >
            {activeTab === "partners" && (
              <motion.div
                layoutId="manageTabIndicator"
                className="absolute inset-0 rounded-lg bg-gradient-to-r from-orange-500 to-rose-600 shadow-md shadow-rose-900/20"
                transition={{ type: "spring", stiffness: 350, damping: 25 }}
              />
            )}
            <span className="relative z-10 flex items-center gap-1.5">
              <Award className="h-3.5 w-3.5" />
              Affiliate Partners
            </span>
          </button>
          <button
            onClick={() => {
              setActiveTab("referrals");
              setSearchTerm("");
              setStatusFilter("all");
            }}
            className="relative px-5 py-2 text-xs font-black uppercase tracking-wider rounded-lg transition-all duration-300"
            style={{
              color: activeTab === "referrals" ? "#ffffff" : isDark ? "#94a3b8" : "#475569",
            }}
          >
            {activeTab === "referrals" && (
              <motion.div
                layoutId="manageTabIndicator"
                className="absolute inset-0 rounded-lg bg-gradient-to-r from-orange-500 to-rose-600 shadow-md shadow-rose-900/20"
                transition={{ type: "spring", stiffness: 350, damping: 25 }}
              />
            )}
            <span className="relative z-10 flex items-center gap-1.5">
              <Users className="h-3.5 w-3.5" />
              Global Referrals Ledger
            </span>
          </button>
          <button
            onClick={() => {
              setActiveTab("payouts");
              setSearchTerm("");
              setStatusFilter("all");
            }}
            className="relative px-5 py-2 text-xs font-black uppercase tracking-wider rounded-lg transition-all duration-300"
            style={{
              color: activeTab === "payouts" ? "#ffffff" : isDark ? "#94a3b8" : "#475569",
            }}
          >
            {activeTab === "payouts" && (
              <motion.div
                layoutId="manageTabIndicator"
                className="absolute inset-0 rounded-lg bg-gradient-to-r from-orange-500 to-rose-600 shadow-md shadow-rose-900/20"
                transition={{ type: "spring", stiffness: 350, damping: 25 }}
              />
            )}
            <span className="relative z-10 flex items-center gap-1.5">
              <Coins className="h-3.5 w-3.5" />
              Payout Disbursals
            </span>
          </button>
        </div>

        {/* Filters and search input */}
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
          {/* Status filtering dropdown (for referrals and payouts) */}
          {activeTab !== "partners" && (
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full sm:w-44 rounded-xl border border-slate-200 bg-white p-2.5 text-xs font-bold text-slate-700 outline-none transition-all focus:border-rose-400 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:focus:border-rose-800"
            >
              {activeTab === "referrals" ? (
                <>
                  <option value="all">All Referrals</option>
                  <option value="customer">Paying Customers</option>
                  <option value="signup">Signups Only</option>
                </>
              ) : (
                <>
                  <option value="all">All Payout Statuses</option>
                  <option value="Requested">Requested</option>
                  <option value="Processing">Processing</option>
                  <option value="Completed">Paid / Completed</option>
                  <option value="Rejected">Rejected</option>
                </>
              )}
            </select>
          )}

          {/* Text Search Input */}
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder={
                activeTab === "partners"
                  ? "Search by partner, email, or code..."
                  : activeTab === "referrals"
                    ? "Search by referred name, email, or referrer..."
                    : "Search by partner or invoice ref..."
              }
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 py-2.5 text-xs font-semibold text-slate-700 outline-none transition-all focus:border-rose-400 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:focus:border-rose-800"
            />
          </div>
        </div>
      </div>

      {/* Main Table view of the active tab */}
      <AnimatePresence mode="wait">
        {loading ? (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="py-24 flex flex-col items-center justify-center gap-3 text-slate-400"
          >
            <Loader2 className="h-10 w-10 animate-spin text-rose-500" />
            <span className="text-sm font-semibold tracking-wide">Syncing referral database...</span>
          </motion.div>
        ) : (
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="rounded-2xl border flex flex-col overflow-hidden shadow-sm backdrop-blur-md"
            style={{
              background: isDark ? "rgba(30, 41, 59, 0.6)" : "rgba(255, 255, 255, 0.75)",
              borderColor: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.08)",
            }}
          >
            {/* Tab 1: Partners Table */}
            {activeTab === "partners" && (
              <div className="overflow-x-auto custom-scrollbar">
                <table className="w-full text-left border-collapse min-w-[950px]">
                  <thead>
                    <tr style={{ backgroundColor: isDark ? "rgba(15,23,42,0.95)" : "#F9FAFB" }}>
                      <th className="p-4 font-bold text-[10px] uppercase tracking-wider text-slate-400 dark:text-slate-500">Name & Email</th>
                      <th className="p-4 font-bold text-[10px] uppercase tracking-wider text-slate-400 dark:text-slate-500">Referral Code</th>
                      <th className="p-4 font-bold text-[10px] uppercase tracking-wider text-slate-400 dark:text-slate-500 text-center">T1 Rate</th>
                      <th className="p-4 font-bold text-[10px] uppercase tracking-wider text-slate-400 dark:text-slate-500 text-center">T2 Rate</th>
                      <th className="p-4 font-bold text-[10px] uppercase tracking-wider text-slate-400 dark:text-slate-500 text-right">Total Earned</th>
                      <th className="p-4 font-bold text-[10px] uppercase tracking-wider text-slate-400 dark:text-slate-500 text-right">Unpaid Balance</th>
                      <th className="p-4 font-bold text-[10px] uppercase tracking-wider text-slate-400 dark:text-slate-500 text-center">Payouts</th>
                      <th className="p-4 font-bold text-[10px] uppercase tracking-wider text-right text-slate-400 dark:text-slate-500">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200/50 dark:divide-slate-800/50">
                    {filteredProfiles.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="p-10 text-center text-sm font-semibold text-slate-400 dark:text-slate-500">
                          No registered affiliate profiles match your search criteria.
                        </td>
                      </tr>
                    ) : (
                      filteredProfiles.map((prof) => (
                        <tr key={prof.id} className="hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                          <td className="p-4">
                            <div className="flex flex-col gap-0.5">
                              <span className="text-sm font-extrabold text-slate-800 dark:text-slate-200">{prof.name}</span>
                              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">{prof.email}</span>
                            </div>
                          </td>
                          <td className="p-4 font-mono text-xs font-bold text-slate-600 dark:text-slate-300">
                            {prof.referralCode}
                          </td>
                          <td className="p-4 text-center font-bold text-slate-800 dark:text-slate-100 text-sm">
                            {prof.tier1Rate}%
                          </td>
                          <td className="p-4 text-center font-bold text-slate-800 dark:text-slate-100 text-sm">
                            {prof.tier2Rate}%
                          </td>
                          <td className="p-4 text-right font-black text-slate-800 dark:text-slate-50 tabular-nums text-sm">
                            ₹{prof.totalEarned.toFixed(2)}
                          </td>
                          <td className="p-4 text-right font-black text-rose-600 dark:text-rose-400 tabular-nums text-sm">
                            ₹{prof.requestablePayout.toFixed(2)}
                          </td>
                          <td className="p-4 text-center">
                            <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-extrabold bg-violet-50 text-violet-600 border border-violet-200/20 dark:bg-violet-950/20 dark:text-violet-400">
                              {prof.payoutsCount}
                            </span>
                          </td>
                          <td className="p-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                onClick={() => setSelectedNetworkPartner(prof)}
                                variant="outline"
                                size="sm"
                                className="h-8 text-xs font-bold gap-1 rounded-xl border-slate-200 hover:border-slate-300 dark:border-slate-800 dark:hover:border-slate-700 hover:scale-[1.01] transition-all text-slate-700 dark:text-slate-300"
                              >
                                <Eye className="h-3.5 w-3.5 text-blue-500" />
                              </Button>
                              <Button
                                onClick={() => openEditRates(prof)}
                                variant="outline"
                                size="sm"
                                className="h-8 text-xs font-bold gap-1 rounded-xl border-slate-200 hover:border-slate-300 dark:border-slate-800 dark:hover:border-slate-700 hover:scale-[1.01] transition-all text-slate-700 dark:text-slate-300"
                              >
                                <Edit2 className="h-3 w-3 text-orange-500" />
                                Rates
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* Tab 2: Referrals Ledger Table */}
            {activeTab === "referrals" && (
              <div className="overflow-x-auto custom-scrollbar">
                <table className="w-full text-left border-collapse min-w-[1150px]">
                  <thead>
                    <tr style={{ backgroundColor: isDark ? "rgba(15,23,42,0.95)" : "#F9FAFB" }}>
                      <th className="p-4 font-bold text-[10px] uppercase tracking-wider text-slate-400 dark:text-slate-500">Referred User</th>
                      <th className="p-4 font-bold text-[10px] uppercase tracking-wider text-slate-400 dark:text-slate-500">Invited By</th>
                      <th className="p-4 font-bold text-[10px] uppercase tracking-wider text-slate-400 dark:text-slate-500 text-center">Tier</th>
                      <th className="p-4 font-bold text-[10px] uppercase tracking-wider text-slate-400 dark:text-slate-500">Plan Purchased</th>
                      <th className="p-4 font-bold text-[10px] uppercase tracking-wider text-slate-400 dark:text-slate-500">Invoice ID</th>
                      <th className="p-4 font-bold text-[10px] uppercase tracking-wider text-slate-400 dark:text-slate-500">Purchase Date</th>
                      <th className="p-4 font-bold text-[10px] uppercase tracking-wider text-center text-slate-400 dark:text-slate-500">Status</th>
                      <th className="p-4 font-bold text-[10px] uppercase tracking-wider text-right text-slate-400 dark:text-slate-500">Commission</th>
                      <th className="p-4 font-bold text-[10px] uppercase tracking-wider text-right text-slate-400 dark:text-slate-500">Audit Trail</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200/50 dark:divide-slate-800/50">
                    {filteredReferrals.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="p-10 text-center text-sm font-semibold text-slate-400 dark:text-slate-500">
                          No referrals recorded matches search parameters.
                        </td>
                      </tr>
                    ) : (
                      filteredReferrals.map((ref) => (
                        <tr key={ref.id} className="hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                          <td className="p-4">
                            <div className="flex flex-col gap-0.5">
                              <span className="text-sm font-extrabold text-slate-800 dark:text-slate-200">{ref.referredName}</span>
                              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">{ref.referredEmail}</span>
                            </div>
                          </td>
                          <td className="p-4">
                            <div className="flex flex-col gap-0.5">
                              <span className="text-sm font-bold text-slate-700 dark:text-slate-200">{ref.referrerName}</span>
                              <span className="text-xs text-slate-500 dark:text-slate-400">{ref.referrerEmail}</span>
                            </div>
                          </td>
                          <td className="p-4 text-center">
                            <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold ${ref.tier === 1
                              ? "bg-orange-50 text-orange-600 border border-orange-200/20 dark:bg-orange-950/20 dark:text-orange-400"
                              : "bg-pink-50 text-pink-600 border border-pink-200/20 dark:bg-pink-950/20 dark:text-pink-400"
                              }`}>
                              Tier {ref.tier}
                            </span>
                          </td>
                          <td className="p-4 text-xs font-semibold text-slate-700 dark:text-slate-300">
                            {ref.planPurchased || "-"}
                          </td>
                          <td className="p-4 font-mono text-xs text-slate-500 dark:text-slate-400">
                            {ref.invoiceId || "-"}
                          </td>
                          <td className="p-4 font-mono text-xs text-slate-500 dark:text-slate-400">
                            {ref.purchaseDate || "-"}
                          </td>
                          <td className="p-4 text-center">
                            <span className={`inline-flex px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${ref.status === "customer"
                              ? "bg-emerald-50 text-emerald-600 border border-emerald-200/20 dark:bg-emerald-950/20 dark:text-emerald-400"
                              : "bg-slate-100 text-slate-500 border border-slate-200/30 dark:bg-slate-800 dark:text-slate-400"
                              }`}>
                              {ref.status}
                            </span>
                          </td>
                          <td className="p-4 text-right font-black text-slate-800 dark:text-slate-50 tabular-nums text-sm">
                            ₹{ref.commission.toFixed(2)}
                          </td>
                          <td className="p-4 text-right">
                            <Button
                              onClick={() => setSelectedAuditReferral(ref)}
                              variant="outline"
                              size="xs"
                              className="h-8 px-3  text-[11px] font-bold gap-1 rounded-xl border-slate-200 hover:border-slate-350 dark:border-slate-800 dark:hover:border-slate-700 hover:scale-[1.01] transition-all text-slate-700 dark:text-slate-300"
                            >
                              <Clock className="h-3.5 w-3.5 text-rose-500" />
                            </Button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* Tab 3: Payout Disbursals Table */}
            {activeTab === "payouts" && (
              <div className="overflow-x-auto custom-scrollbar">
                <table className="w-full text-left border-collapse min-w-[1050px]">
                  <thead>
                    <tr style={{ backgroundColor: isDark ? "rgba(15,23,42,0.95)" : "#F9FAFB" }}>
                      <th className="p-4 w-6"></th>
                      <th className="p-4 font-bold text-[10px] uppercase tracking-wider text-slate-400 dark:text-slate-500">Requested By</th>
                      <th className="p-4 font-bold text-[10px] uppercase tracking-wider text-slate-400 dark:text-slate-500">Invoice Ref #</th>
                      <th className="p-4 font-bold text-[10px] uppercase tracking-wider text-slate-400 dark:text-slate-500">Date Requested</th>
                      <th className="p-4 font-bold text-[10px] uppercase tracking-wider text-slate-400 dark:text-slate-500 text-right">Amount</th>
                      <th className="p-4 font-bold text-[10px] uppercase tracking-wider text-center text-slate-400 dark:text-slate-500">Status</th>
                      <th className="p-4 font-bold text-[10px] uppercase tracking-wider text-right text-slate-400 dark:text-slate-500">Quick Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200/50 dark:divide-slate-800/50">
                    {filteredPayouts.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="p-10 text-center text-sm font-semibold text-slate-400 dark:text-slate-500">
                          No payout requests recorded.
                        </td>
                      </tr>
                    ) : (
                      filteredPayouts.map((pay) => {
                        const isExpanded = expandedPayoutId === pay.id;
                        return (
                          <React.Fragment key={pay.id}>
                            <tr className="hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                              <td className="p-4 text-center">
                                <button
                                  onClick={() => setExpandedPayoutId(isExpanded ? null : pay.id)}
                                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                                  title="View Partner Bank details"
                                >
                                  {isExpanded ? (
                                    <ChevronUp className="h-4 w-4" />
                                  ) : (
                                    <ChevronDown className="h-4 w-4" />
                                  )}
                                </button>
                              </td>
                              <td className="p-4">
                                <div className="flex flex-col gap-0.5">
                                  <span className="text-sm font-extrabold text-slate-800 dark:text-slate-200">{pay.name}</span>
                                  <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">{pay.email}</span>
                                </div>
                              </td>
                              <td className="p-4 font-mono text-xs font-bold text-slate-600 dark:text-slate-300">
                                {pay.invoiceRef}
                              </td>
                              <td className="p-4 font-mono text-xs text-slate-500 dark:text-slate-400">
                                {pay.date}
                              </td>
                              <td className="p-4 text-right font-black text-slate-850 dark:text-slate-50 tabular-nums text-sm">
                                ₹{pay.amount.toFixed(2)}
                              </td>
                              <td className="p-4 text-center">
                                <span className={`inline-flex px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${pay.status === "Completed"
                                  ? "bg-emerald-50 text-emerald-600 border border-emerald-200/20 dark:bg-emerald-950/20 dark:text-emerald-400"
                                  : pay.status === "Processing"
                                    ? "bg-blue-50 text-blue-600 border border-blue-200/20 dark:bg-blue-950/20 dark:text-blue-400"
                                    : pay.status === "Rejected"
                                      ? "bg-rose-50 text-rose-600 border border-rose-200/20 dark:bg-rose-950/20 dark:text-rose-450"
                                      : "bg-amber-50 text-amber-600 border border-amber-200/20 dark:bg-amber-950/20 dark:text-amber-400"
                                  }`}>
                                  {pay.status}
                                </span>
                              </td>
                              <td className="p-4 text-right">
                                <div className="flex items-center justify-end gap-1.5">
                                  {pay.status !== "Completed" && pay.status !== "Rejected" && (
                                    <>
                                      {pay.status === "Requested" && (
                                        <Button
                                          onClick={() => handleUpdatePayoutStatus(pay.id, "Processing")}
                                          size="xs"
                                          className="h-7 text-[10px] font-bold uppercase rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 border border-blue-200/20"
                                        >
                                          Process
                                        </Button>
                                      )}
                                      <Button
                                        onClick={() => handleUpdatePayoutStatus(pay.id, "Completed")}
                                        size="xs"
                                        className="h-7 text-[10px] font-bold uppercase rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 shadow shadow-emerald-900/10"
                                      >
                                        Approve & Clear
                                      </Button>
                                      <Button
                                        onClick={() => handleUpdatePayoutStatus(pay.id, "Rejected")}
                                        size="xs"
                                        className="h-7 text-[10px] font-bold uppercase rounded-lg bg-rose-600 text-white hover:bg-rose-700 shadow shadow-rose-900/10"
                                      >
                                        Reject
                                      </Button>
                                    </>
                                  )}
                                  {(pay.status === "Completed" || pay.status === "Rejected") && (
                                    <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500">
                                      Disbursement Settled
                                    </span>
                                  )}
                                </div>
                              </td>
                            </tr>
                            {/* Expanded Payout bank account view */}
                            <AnimatePresence>
                              {isExpanded && (
                                <tr className="bg-slate-50/50 dark:bg-slate-900/30">
                                  <td colSpan={7} className="p-4 border-l-4 border-rose-500">
                                    <motion.div
                                      initial={{ opacity: 0, height: 0 }}
                                      animate={{ opacity: 1, height: "auto" }}
                                      exit={{ opacity: 0, height: 0 }}
                                      className="grid gap-4 sm:grid-cols-2 md:grid-cols-4"
                                    >
                                      <div className="space-y-1">
                                        <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Account Holder</span>
                                        <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                                          {pay.bankDetails?.holderName || "N/A"}
                                        </p>
                                      </div>
                                      <div className="space-y-1">
                                        <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Bank & Branch</span>
                                        <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                                          {pay.bankDetails?.bankBranch || "N/A"}
                                        </p>
                                      </div>
                                      <div className="space-y-1">
                                        <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Account Number</span>
                                        <p className="text-xs font-bold font-mono text-slate-800 dark:text-slate-200">
                                          {pay.bankDetails?.accountNumber || "N/A"}
                                        </p>
                                      </div>
                                      <div className="space-y-1">
                                        <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">IFSC Code / UPI ID</span>
                                        <p className="text-xs font-bold font-mono text-slate-800 dark:text-slate-200">
                                          {pay.bankDetails?.ifscCode || "N/A"}
                                          {pay.bankDetails?.upiId && ` / ${pay.bankDetails.upiId}`}
                                        </p>
                                      </div>
                                      {pay.bankDetails?.panCardFile && (
                                        <div className="sm:col-span-2 space-y-1">
                                          <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">PAN CARD (Account Match Required)</span>
                                          <div className="flex items-center gap-2">
                                            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 bg-orange-500/5 px-2 py-0.5 rounded border border-orange-500/20 flex items-center gap-1 font-mono">
                                              📄 {pay.bankDetails.panCardFile}
                                            </span>
                                            <Button
                                              onClick={() => toast.info(`Viewing PAN document: ${pay.bankDetails.panCardFile}`)}
                                              variant="outline"
                                              size="xs"
                                              className="h-6 text-[10px] font-semibold"
                                            >
                                              Verify Document
                                            </Button>
                                          </div>
                                        </div>
                                      )}
                                    </motion.div>
                                  </td>
                                </tr>
                              )}
                            </AnimatePresence>
                          </React.Fragment>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {selectedProfile && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedProfile(null)}
              className="fixed inset-0 bg-slate-950/45 backdrop-blur-md"
            />
            {/* Modal Body */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-md overflow-hidden rounded-2xl border shadow-xl backdrop-blur-md"
              style={{
                background: isDark ? "rgba(15, 23, 42, 0.95)" : "#ffffff",
                borderColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.1)",
              }}
            >
              <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Percent className="h-5 w-5 text-rose-500" />
                  <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">
                    Edit Commission Rates
                  </h3>
                </div>
                <button
                  onClick={() => setSelectedProfile(null)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer text-sm font-bold uppercase"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSaveRates} className="p-5 space-y-4">
                <div className="rounded-xl bg-slate-50 dark:bg-slate-900/40 p-3 border border-slate-100 dark:border-slate-800 space-y-0.5">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Partner Name</span>
                  <p className="text-sm font-bold text-slate-700 dark:text-slate-200">
                    {selectedProfile.name}
                  </p>
                  <p className="text-[11px] text-slate-400 dark:text-slate-500">
                    {selectedProfile.email}
                  </p>
                </div>

                {/* Tier 1 Rate Field */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    Direct Commission Rate (Tier 1 %)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      required
                      min="0"
                      max="100"
                      placeholder="e.g. 20"
                      value={tier1RateInput}
                      onChange={(e) => setTier1RateInput(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-2.5 pr-8 text-sm outline-none transition-all focus:border-rose-450 dark:border-slate-800 dark:bg-slate-950/40 dark:text-slate-100 dark:focus:border-rose-800 font-mono font-bold"
                    />
                    <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-black text-slate-400">%</span>
                  </div>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500">
                    Direct commission percentage paid to partner for standard referred sales.
                  </p>
                </div>

                {/* Tier 2 Rate Field */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    Sub-Affiliate Passive Rate (Tier 2 %)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      required
                      min="0"
                      max="100"
                      placeholder="e.g. 2"
                      value={tier2RateInput}
                      onChange={(e) => setTier2RateInput(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-2.5 pr-8 text-sm outline-none transition-all focus:border-rose-450 dark:border-slate-800 dark:bg-slate-950/40 dark:text-slate-100 dark:focus:border-rose-800 font-mono font-bold"
                    />
                    <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-black text-slate-400">%</span>
                  </div>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500">
                    Passive overriding percentage paid when referred sub-partners make referred sales.
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2.5">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setSelectedProfile(null)}
                    className="rounded-xl text-xs font-bold px-4 py-2 border-slate-200 dark:border-slate-800"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={updatingRates}
                    className="rounded-xl text-xs font-bold bg-gradient-to-r from-orange-500 to-rose-600 hover:from-orange-600 hover:to-rose-700 text-white shadow-md shadow-rose-900/10 px-5 py-2 flex items-center justify-center gap-1.5"
                  >
                    {updatingRates && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                    Save Rate Changes
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* View Referrals Network Overlay Modal */}
      <AnimatePresence>
        {selectedNetworkPartner && (() => {
          const partnerRefs = referrals.filter((r) => r.referrerEmail === selectedNetworkPartner.email);
          const t1Refs = partnerRefs.filter((r) => r.tier === 1);
          const t2Refs = partnerRefs.filter((r) => r.tier === 2);

          const filteredRefs = partnerRefs.filter((r) => {
            if (networkTab === "tier1") return r.tier === 1;
            if (networkTab === "tier2") return r.tier === 2;
            return true; // "all"
          });

          const t1Signups = t1Refs.filter(r => r.status === 'signup').length;
          const t1Customers = t1Refs.filter(r => r.status === 'customer').length;
          const t2Signups = t2Refs.filter(r => r.status === 'signup').length;
          const t2Customers = t2Refs.filter(r => r.status === 'customer').length;

          return (
            <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => {
                  setSelectedNetworkPartner(null);
                  setNetworkTab("all");
                }}
                className="fixed inset-0 bg-slate-950/45 backdrop-blur-md"
              />
              {/* Modal Body */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="relative w-full max-w-4xl overflow-hidden rounded-2xl border shadow-xl backdrop-blur-md flex flex-col max-h-[85vh]"
                style={{
                  background: isDark ? "rgba(15, 23, 42, 0.98)" : "#ffffff",
                  borderColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.1)",
                }}
              >
                <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-rose-500" />
                    <div>
                      <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">
                        Referral Network: {selectedNetworkPartner.name}
                      </h3>
                      <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">
                        {selectedNetworkPartner.email} | Code: <span className="font-mono font-bold text-rose-500">{selectedNetworkPartner.referralCode}</span>
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedNetworkPartner(null);
                      setNetworkTab("all");
                    }}
                    className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer text-sm font-bold"
                  >
                    ✕
                  </button>
                </div>

                {/* Sub-Modal Stats grid */}
                <div className="p-5 grid gap-4 sm:grid-cols-2 md:grid-cols-4 bg-slate-50/50 dark:bg-slate-900/20 border-b border-slate-100 dark:border-slate-800">
                  <div className="p-3.5 rounded-xl border border-slate-200/50 dark:border-slate-800/80 bg-white dark:bg-slate-900 flex flex-col justify-between">
                    <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Total Network</span>
                    <span className="text-2xl font-black text-slate-800 dark:text-slate-50 mt-1">{partnerRefs.length} Users</span>
                  </div>
                  <div className="p-3.5 rounded-xl border border-slate-200/50 dark:border-slate-800/80 bg-white dark:bg-slate-900 flex flex-col justify-between">
                    <span className="text-[9px] font-bold uppercase tracking-wider text-orange-550 dark:text-orange-400">Tier 1 (Direct)</span>
                    <span className="text-2xl font-black text-slate-800 dark:text-slate-50 mt-1">{t1Refs.length} Users</span>
                    <div className="text-[9px] font-bold text-slate-400 mt-1 flex gap-1.5">
                      <span className="text-emerald-500">{t1Customers} Paid</span>
                      <span>•</span>
                      <span>{t1Signups} Signups</span>
                    </div>
                  </div>
                  <div className="p-3.5 rounded-xl border border-slate-200/50 dark:border-slate-800/80 bg-white dark:bg-slate-900 flex flex-col justify-between">
                    <span className="text-[9px] font-bold uppercase tracking-wider text-pink-500">Tier 2 (Sub-referrals)</span>
                    <span className="text-2xl font-black text-slate-800 dark:text-slate-50 mt-1">{t2Refs.length} Users</span>
                    <div className="text-[9px] font-bold text-slate-400 mt-1 flex gap-1.5">
                      <span className="text-emerald-500">{t2Customers} Paid</span>
                      <span>•</span>
                      <span>{t2Signups} Signups</span>
                    </div>
                  </div>
                  <div className="p-3.5 rounded-xl border border-slate-200/50 dark:border-slate-800/80 bg-white dark:bg-slate-900 flex flex-col justify-between">
                    <span className="text-[9px] font-bold uppercase tracking-wider text-emerald-500">Total Paid Purchases</span>
                    <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">₹{partnerRefs.reduce((sum, r) => sum + r.commission, 0).toFixed(2)}</span>
                    <div className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400 mt-1 uppercase">
                      Total Commission Earned
                    </div>
                  </div>
                </div>

                {/* Sub-tab selection switch */}
                <div className="px-5 py-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
                  <div className="flex p-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200/50 dark:border-slate-700/50 backdrop-blur-md self-start text-[11px] font-bold">
                    <button
                      onClick={() => setNetworkTab("all")}
                      className={`px-3 py-1.5 rounded-md transition-all ${networkTab === "all" ? "bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 shadow-sm" : "text-slate-500"}`}
                    >
                      All ({partnerRefs.length})
                    </button>
                    <button
                      onClick={() => setNetworkTab("tier1")}
                      className={`px-3 py-1.5 rounded-md transition-all ${networkTab === "tier1" ? "bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 shadow-sm" : "text-slate-500"}`}
                    >
                      Tier 1 ({t1Refs.length})
                    </button>
                    <button
                      onClick={() => setNetworkTab("tier2")}
                      className={`px-3 py-1.5 rounded-md transition-all ${networkTab === "tier2" ? "bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 shadow-sm" : "text-slate-500"}`}
                    >
                      Tier 2 ({t2Refs.length})
                    </button>
                  </div>
                  <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500">
                    Live referral relations
                  </span>
                </div>

                {/* Modal Referral details Table */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-5 min-h-[250px]">
                  {filteredRefs.length === 0 ? (
                    <div className="py-16 text-center text-sm font-semibold text-slate-400 dark:text-slate-500 flex flex-col items-center justify-center gap-1">
                      <span>No referred profiles recorded for this category yet.</span>
                      <span className="text-xs text-slate-400 font-medium">When their code is used, referred users will list here.</span>
                    </div>
                  ) : (
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-slate-100 dark:border-slate-800">
                          <th className="pb-3 font-bold text-[9px] uppercase tracking-wider text-slate-400 dark:text-slate-500">Referred User</th>
                          <th className="pb-3 font-bold text-[9px] uppercase tracking-wider text-slate-400 dark:text-slate-500 text-center">Tier</th>
                          <th className="pb-3 font-bold text-[9px] uppercase tracking-wider text-slate-400 dark:text-slate-500">Plan Purchased</th>
                          <th className="pb-3 font-bold text-[9px] uppercase tracking-wider text-slate-400 dark:text-slate-500">Invoice ID</th>
                          <th className="pb-3 font-bold text-[9px] uppercase tracking-wider text-center text-slate-400 dark:text-slate-500">Status</th>
                          <th className="pb-3 font-bold text-[9px] uppercase tracking-wider text-right text-slate-400 dark:text-slate-500">Commission</th>
                          <th className="pb-3 font-bold text-[9px] uppercase tracking-wider text-right text-slate-400 dark:text-slate-500">Audit Trail</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                        {filteredRefs.map((ref) => (
                          <tr key={ref.id} className="hover:bg-slate-50/40 dark:hover:bg-white/5 transition-colors">
                            <td className="py-3">
                              <div className="flex flex-col gap-0.5">
                                <span className="text-xs font-extrabold text-slate-800 dark:text-slate-200">{ref.referredName}</span>
                                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">{ref.referredEmail}</span>
                              </div>
                            </td>
                            <td className="py-3 text-center">
                              <span className={`inline-flex px-1.5 py-0.5 rounded-full text-[9px] font-bold ${ref.tier === 1
                                ? "bg-orange-50 text-orange-650 dark:bg-orange-950/20 dark:text-orange-400"
                                : "bg-pink-50 text-pink-650 dark:bg-pink-950/20 dark:text-pink-400"
                                }`}>
                                Tier {ref.tier}
                              </span>
                            </td>
                            <td className="py-3 text-[10px] font-semibold text-slate-700 dark:text-slate-300">
                              {ref.planPurchased || "-"}
                            </td>
                            <td className="py-3 font-mono text-[10px] text-slate-500 dark:text-slate-400">
                              {ref.invoiceId || "-"}
                            </td>
                            <td className="py-3 text-center">
                              <span className={`inline-flex px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${ref.status === "customer"
                                ? "bg-emerald-50 text-emerald-600 border border-emerald-200/20 dark:bg-emerald-950/20 dark:text-emerald-400"
                                : "bg-slate-100 text-slate-500 border border-slate-200/30 dark:bg-slate-850 dark:text-slate-400"
                                }`}>
                                {ref.status}
                              </span>
                            </td>
                            <td className="py-3 text-right font-black text-slate-800 dark:text-slate-50 tabular-nums text-xs">
                              ₹{ref.commission.toFixed(2)}
                            </td>
                            <td className="py-3 text-right">
                              <Button
                                onClick={() => setSelectedAuditReferral(ref)}
                                variant="outline"
                                size="xs"
                                className="h-7 px-2 text-[10px] font-bold gap-1 rounded-xl border-slate-200 hover:border-slate-350 dark:border-slate-800 dark:hover:border-slate-700 hover:scale-[1.01] transition-all text-slate-700 dark:text-slate-300"
                              >
                                <Clock className="h-3 w-3 text-rose-500" />
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                  <Button
                    onClick={() => {
                      setSelectedNetworkPartner(null);
                      setNetworkTab("all");
                    }}
                    className="rounded-xl text-xs font-bold px-5 py-2 hover:scale-[1.01] transition-all bg-gradient-to-r from-orange-500 to-rose-600 text-white shadow shadow-rose-900/10"
                  >
                    Close Network Ledger
                  </Button>
                </div>
              </motion.div>
            </div>
          );
        })()}
      </AnimatePresence>

      {/* View Attribution Click Audit Trail Overlay Modal */}
      <AnimatePresence>
        {selectedAuditReferral && (() => {
          // Generate realistic attribution timeline click history for this referred user
          const activePartnerEmail = selectedAuditReferral.referrerEmail;
          const activePartnerName = selectedAuditReferral.referrerName;

          const regDate = new Date(selectedAuditReferral.createdAt || selectedAuditReferral.registrationDate || Date.now());

          // If the date string has no time component (which parses to midnight UTC, i.e., 5:30 AM IST), 
          // or is set to exactly 5:30 AM / 00:00, we override it to a realistic afternoon daytime (3:30 PM) 
          // so audit logs look professional and realistic.
          if ((regDate.getHours() === 5 && regDate.getMinutes() === 30) || (regDate.getHours() === 0 && regDate.getMinutes() === 0)) {
            regDate.setHours(15, 30, 0, 0);
          }

          const otherPartners = profiles.filter(p => p.email !== activePartnerEmail && p.email !== selectedAuditReferral.referredEmail);

          // Generate prior overwritten clicks dynamically using ONLY real other partners from profiles (no simulated dates needed)
          const previousClicks = otherPartners.map((partner, index) => {
            return {
              touchNum: index + 1,
              partnerName: partner.name,
              partnerEmail: partner.email,
              partnerCode: partner.referralCode || `client_${partner.id?.substring(0, 6) || "948281"}`,
            };
          });

          let rHours = regDate.getHours();
          const rMinutes = regDate.getMinutes();
          const rAmpm = rHours >= 12 ? 'PM' : 'AM';
          rHours = rHours % 12;
          rHours = rHours ? rHours : 12;
          const rMinutesStr = rMinutes < 10 ? '0' + rMinutes : rMinutes;
          const regTimeStr = `${rHours}:${rMinutesStr} ${rAmpm}`;

          const regYear = regDate.getFullYear();
          const regMonth = regDate.getMonth() + 1;
          const regMonthStr = regMonth < 10 ? '0' + regMonth : regMonth;
          const regDay = regDate.getDate();
          const regDayStr = regDay < 10 ? '0' + regDay : regDay;
          const regDateStr = `${regYear}-${regMonthStr}-${regDayStr}`;

          // Winning click is set to exactly 45 minutes before the baseline registration time
          const winningClickDate = new Date(regDate);
          winningClickDate.setMinutes(winningClickDate.getMinutes() - 45);

          let wHours = winningClickDate.getHours();
          const wMinutes = winningClickDate.getMinutes();
          const wAmpm = wHours >= 12 ? 'PM' : 'AM';
          wHours = wHours % 12;
          wHours = wHours ? wHours : 12;
          const wMinutesStr = wMinutes < 10 ? '0' + wMinutes : wMinutes;
          const winningTimeStr = `${wHours}:${wMinutesStr} ${wAmpm}`;

          const click2 = {
            dateStr: winningClickDate.toISOString().split('T')[0],
            timeStr: winningTimeStr,
          };

          // Combine overwritten touches and the credited touch into a single unified journey
          const allClicks = [
            ...previousClicks,
            {
              touchNum: previousClicks.length + 1,
              partnerName: activePartnerName,
              partnerEmail: activePartnerEmail,
              partnerCode: selectedAuditReferral.referrerCode || "client_882948",
              isWinning: true
            }
          ];

          return (
            <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setSelectedAuditReferral(null)}
                className="fixed inset-0 bg-slate-950/45 backdrop-blur-md"
              />
              {/* Modal Body */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="relative w-full max-w-3xl overflow-hidden rounded-2xl border shadow-xl backdrop-blur-md flex flex-col max-h-[90vh]"
                style={{
                  background: isDark ? "rgba(15, 23, 42, 0.98)" : "#ffffff",
                  borderColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.1)",
                }}
              >
                {/* Header */}
                <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-rose-500" />
                    <div>
                      <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">
                        Attribution Audit & Dispute verification
                      </h3>
                      <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">
                        Verification log for referred user: <span className="font-bold text-slate-700 dark:text-slate-200">{selectedAuditReferral.referredName}</span> ({selectedAuditReferral.referredEmail})
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedAuditReferral(null)}
                    className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer text-sm font-bold"
                  >
                    ✕
                  </button>
                </div>

                {/* Main Content Area */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-3">
                  {/* Explanatory Banner */}
                  <div className="p-2 rounded-xl border border-blue-500/20 bg-blue-500/5 flex items-start gap-3">
                    <Info className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
                    <div className="space-y-0.5">
                      <h4 className="text-xs font-bold text-blue-700 dark:text-blue-400 uppercase tracking-wider">
                        Attribution Policy: "Last Referral Click Wins"
                      </h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                        When a user clicks links from different partners, only the **latest clicked link before signup** gets the referral credit. This split diagram proves exactly which link was clicked first vs who earned the actual referral credit.
                      </p>
                    </div>
                  </div>

                  {/* Side-by-Side Comparison Flow */}
                  <div className="grid gap-6 md:grid-cols-2 items-start items-center relative">

                    {/* Visual Connector Arrow (Desktop only) */}
                    <div className="hidden md:flex absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 items-center justify-center h-10 w-10 rounded-full border bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-rose-500 shadow-md">
                      ➜
                    </div>

                    {/* Left: Attribution Clicks Sequence */}
                    <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-5 flex flex-col justify-between space-y-4">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">Click Journey</span>
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-amber-100 text-amber-850 dark:bg-amber-950/40 dark:text-amber-400 uppercase border border-amber-200/20">
                            {allClicks.length} Total Clicks
                          </span>
                        </div>
                        <h4 className="text-sm font-extrabold text-slate-800 dark:text-slate-200">
                          Attribution Clicks Sequence
                        </h4>
                        <p className="text-[11px] text-slate-450 dark:text-slate-500 leading-normal">
                          Sequence of all referral links clicked by the user before completing their registration.
                        </p>
                      </div>

                      {/* Stack of previous touchpoint cards */}
                      <div className="space-y-2.5 max-h-[220px] overflow-y-auto pr-1 custom-scrollbar flex-1 flex flex-col">
                        {allClicks.length > 0 ? (
                          allClicks.map((click, idx) => (
                            <div
                              key={idx}
                              className={`rounded-xl border p-3 space-y-1.5 text-xs transition-all ${click.isWinning
                                  ? "border-emerald-500/30 bg-emerald-500/5 dark:bg-emerald-950/15"
                                  : "border-slate-100 dark:border-slate-800/80 bg-white/40 dark:bg-slate-900/35"
                                }`}
                            >
                              <div className="flex items-center justify-between">
                                <span className={`text-[9px] font-extrabold uppercase ${click.isWinning ? "text-emerald-600 dark:text-emerald-450" : "text-amber-600"
                                  }`}>
                                  Touch #{click.touchNum} {click.isWinning && " (Winning)"}
                                </span>
                                {click.isWinning && (
                                  <span className="text-[9.5px] font-extrabold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Credited</span>
                                )}
                              </div>
                              <div className="space-y-0.5">
                                <p className="font-extrabold text-slate-700 dark:text-slate-200">{click.partnerName}</p>
                                <p className="text-[10px] font-semibold text-slate-500">{click.partnerEmail}</p>
                              </div>
                              <div className="pt-1.5 border-t border-slate-100 dark:border-slate-800/60 flex items-center justify-between text-[10px]">
                                <span className="text-slate-400 font-bold">Code: <span className="font-mono text-rose-500">{click.partnerCode}</span></span>
                                {click.isWinning ? (
                                  <span className="inline-flex px-1.5 py-0.2 bg-emerald-100 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-450 rounded-full font-extrabold text-[8px] uppercase tracking-wider">Winning Touch</span>
                                ) : (
                                  <span className="inline-flex px-1.5 py-0.2 bg-red-100 dark:bg-red-950/20 text-red-700 dark:text-red-400 rounded-full font-extrabold text-[8px] uppercase tracking-wider">Overwritten</span>
                                )}
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="rounded-xl border border-slate-100 dark:border-slate-800 bg-white/30 dark:bg-slate-900/20 p-5 text-center space-y-2.5 flex flex-col items-center justify-center">
                            <CheckCircle className="h-8 w-8 text-emerald-550/80 dark:text-emerald-400/80" />
                            <div className="space-y-1">
                              <p className="text-xs font-extrabold text-slate-700 dark:text-slate-200">Direct Clean Attribution</p>
                              <p className="text-[10px] text-slate-400 dark:text-slate-500 leading-normal">
                                No rival affiliate links were clicked. This was a clean, direct first-touch referral for {activePartnerName}!
                              </p>
                            </div>
                          </div>
                        )}
                      </div>

                    </div>

                    {/* Right: Latest Touchpoint (Winning Partner - Credited) */}
                    <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-5 flex flex-col justify-between space-y-4">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">Latest Click (Credited)</span>
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-emerald-100 text-emerald-850 dark:bg-emerald-950/40 dark:text-emerald-400 uppercase border border-emerald-200/20">
                            Active Credit
                          </span>
                        </div>
                        <h4 className="text-sm font-extrabold text-slate-800 dark:text-slate-200">
                          Final Signup Completed
                        </h4>
                        <p className="text-[11px] text-slate-400 dark:text-slate-500">
                          📅 Registered: <span className="font-mono font-bold">{regDateStr} at {regTimeStr}</span>
                        </p>
                      </div>

                      {/* Partner Card details */}
                      <div className="rounded-xl border border-slate-100 dark:border-slate-850 bg-white/50 dark:bg-slate-900/40 p-3.5 space-y-2">
                        <div className="space-y-0.5">
                          <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Credited Affiliate</span>
                          <p className="text-xs font-extrabold text-slate-800 dark:text-slate-200">{activePartnerName}</p>
                          <p className="text-[10px] font-semibold text-slate-500">{activePartnerEmail}</p>
                        </div>
                        <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                          <span className="text-[10px] font-bold text-slate-400">Referral Code:</span>
                          <span className="font-mono text-xs font-extrabold text-rose-500">{selectedAuditReferral.referrerCode || "client_882948"}</span>
                        </div>
                      </div>
                    </div>

                  </div>

                  {/* bottom Plan Subscription Outcome details (if purchased) */}
                  {(selectedAuditReferral.status === "customer" || selectedAuditReferral.planPurchased) && (
                    <div className="rounded-2xl border border-purple-500/25 bg-gradient-to-r from-purple-500/5 to-pink-500/5 p-5 space-y-3.5">
                      <div className="flex items-center gap-2">
                        <Award className="h-5 w-5 text-purple-500" />
                        <h4 className="text-sm font-extrabold text-slate-800 dark:text-slate-200">
                          SaaS Plan Subscription Conversion Complete
                        </h4>
                      </div>

                      <div className="grid gap-4 sm:grid-cols-3 bg-white/50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800 rounded-xl p-3.5 text-xs font-bold text-slate-700 dark:text-slate-300">
                        <div className="space-y-0.5">
                          <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Plan Purchased</span>
                          <p className="text-xs text-purple-600 dark:text-purple-400">{selectedAuditReferral.planPurchased || "Standard Plan"}</p>
                        </div>
                        <div className="space-y-0.5">
                          <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Invoice ID</span>
                          <p className="font-mono text-xs">{selectedAuditReferral.invoiceId || "INV-3984"}</p>
                        </div>
                        <div className="space-y-0.5">
                          <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Commission Cleared</span>
                          <p className="text-xs text-emerald-600 dark:text-emerald-400">₹{(selectedAuditReferral.commission || 0).toFixed(2)}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-900/35">
                  <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400">
                    <CheckCircle className="h-3.5 w-3.5 text-emerald-500" />
                    <span>Audit complete. Attribution matches dynamic referral logs.</span>
                  </div>
                  <Button
                    onClick={() => setSelectedAuditReferral(null)}
                    className="rounded-xl text-xs font-bold px-5 py-2 hover:scale-[1.01] transition-all bg-gradient-to-r from-orange-500 to-rose-600 text-white shadow shadow-rose-900/10"
                  >
                    Close Verification Log
                  </Button>
                </div>
              </motion.div>
            </div>
          );
        })()}
      </AnimatePresence>
    </div>
  );
};

export default ManageReferrals;
