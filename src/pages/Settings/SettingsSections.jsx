import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { motion } from "framer-motion";
import {
  Zap,
  Package,
  Tag,
  History,
  Key,
  Users,
  Layers,
  Check,
  Plus,
  X,
  ExternalLink,
  Shield,
  Info,
  Clock,
  AlertCircle,
  Download,
  Cloud,
  MessageCircle,
  Pencil,
  MapPin,
  PanelRight,
  FileImage,
  UserCircle2,
  Camera,
  Loader2,
} from "lucide-react";
import { Button } from "../../components/ui/button";
import { Switch } from "../../components/ui/switch";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "../../components/ui/avatar";
import {
  setTableMasked,
  setMaskBillingHistory,
  setMaskProductSalesDetail,
} from "../../features/slices/tableSlice";
import {
  getPricePlans,
  getAdminBillingHistory,
  getAddons,
} from "../../features/actions/pricePlan";
import { resetAddonsData } from "../../features/slices/pricePlan";
import { getAPIAccessTokens } from "../../features/actions/auth";
import { getLeadType } from "../../features/actions/assign";
import productLevelService from "../../services/productLevelService";
import { useTags } from "../../hooks/useTags";
import { formatDateAsNumber, successToast, DateFormat } from "../../utils/extra";
import EditUserForm from "../../components/Profile/EditUserForm";
import PasswordUpdateForm from "../../components/Profile/PasswordUpdateForm";
import TwoFactorAuthSection from "../Profile/TwoFactorAuthSection";
import SubscriptionDetails from "../Profile/SubscriptionDetails";
import { 
  deleteUserDocumet, 
  getCurrentUser, 
  updateUser 
} from "../../features/actions/auth";
import ComponentGuard from "../../components/AccessControl/ComponentGuard";
import { ExpandLess, ExpandMore, Delete } from "@mui/icons-material";
import { Collapse, IconButton, Typography, Box } from "@mui/material";
import ConfirmDeleteModal from "../../components/ConfirmDeleteModal";
import useAddUserActivity from "../../hooks/useAddUserActivity";

function initialsFromName(name) {
  if (!name || typeof name !== "string") return "?";
  const p = name.trim().split(/\s+/);
  if (p.length >= 2) return (p[0][0] + p[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

function monthlyDisplayPrice(plan) {
  const cfg = plan?.planDurationConfig?.monthly;
  if (!cfg?.isEnabled) return Number(plan?.amount) || 0;
  let base = Number(cfg.price ?? plan?.amount) || 0;
  if (cfg.discountType === "flat") {
    base = Math.max(base - (Number(cfg.discountValue) || 0), 0);
  } else if (cfg.discountType === "percent") {
    const d = Number(cfg.discountValue) || 0;
    base = Math.max(base * ((100 - d) / 100), 0);
  }
  return base;
}

function planFeaturesList(plan) {
  const lines = [];
  if (plan?.employeeCount != null)
    lines.push(`${plan.employeeCount} employees`);
  if (plan?.contactLimit != null)
    lines.push(`${plan.contactLimit} contact uploads`);
  if (plan?.toggleLimit != null) lines.push(`${plan.toggleLimit} toggle limit`);
  const ac = plan?.attendeeTableConfig || {};
  if (ac.isCustomOptionsAllowed) lines.push("Custom options");
  if (plan?.employeeInactivity) lines.push("Employee inactivity tracking");
  if (plan?.calendarFeatures) lines.push("Calendar & alarm history");
  if (plan?.productRevenueMetrics) lines.push("Product revenue metrics");
  if (plan?.assignmentMetrics) lines.push("Assignment metrics");
  return lines.length ? lines : ["View all features on the Plans page"];
}

export function ProfileSettings({ theme, navigate, userData, roles, subscription }) {
  const dispatch = useDispatch();
  const logUserActivity = useAddUserActivity();
  const { isLoading, isSuccess } = useSelector((state) => state.auth);

  const [isEditingInfo, setIsEditingInfo] = useState(false);
  const [isDocumentOpen, setIsDocumentOpen] = useState(false);
  const [docToDelete, setDocToDelete] = useState(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  const dateFormat = userData?.dateFormat || DateFormat.DD_MM_YYYY;
  const usedContacts = subscription?.contactCount ?? 0;

  const toggleEdit = () => setIsEditingInfo((prev) => !prev);

  const handleDeleteDocument = () => {
    if (!docToDelete) return;
    dispatch(deleteUserDocumet(docToDelete.filename)).then((res) => {
      if (res?.meta?.requestStatus === "fulfilled") {
        logUserActivity({
          action: "delete",
          type: "document",
          detailItem: docToDelete.filename,
        });
        setDeleteModalOpen(false);
      }
    });
  };

  const handleSaveInfo = (data) => {
    if (data.document) data.document = data.document[0];
    dispatch(updateUser(data));
    logUserActivity({
      action: "update",
      details: "User updated the profile information via settings",
    });
  };

  useEffect(() => {
    if (isSuccess) {
      setIsEditingInfo(false);
      setIsUploadingImage(false);
    }
  }, [isSuccess]);

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setPreviewUrl(URL.createObjectURL(file));
      setIsUploadingImage(true);
      
      const payload = {
        profileImage: file,
      };
      
      dispatch(updateUser(payload)).then((res) => {
        if (res?.meta?.requestStatus === "fulfilled") {
          successToast("Profile picture updated successfully");
          dispatch(getCurrentUser());
        }
        setIsUploadingImage(false);
      });

      logUserActivity({
        action: "update",
        details: "User updated their profile picture",
      });
    }
  };

  const isDark = theme === "dark";

  return (
    <div className="space-y-8 max-w-full">
      {/* Header Profile Summary */}
      <div
        className="p-6 sm:p-8 rounded-2xl border flex flex-col sm:flex-row items-center gap-8 transition-all duration-300"
        style={{
          backgroundColor: isDark ? "#1e293b" : "#ffffff",
          borderColor: isDark ? "#334155" : "#e2e8f0",
          boxShadow: "0 4px 20px rgba(0,0,0,0.05)",
        }}
      >
        <div className="relative group">
          <div className="relative size-28 sm:size-32">
            <Avatar className="size-full ring-4 ring-offset-2 ring-offset-transparent transition-all duration-300 group-hover:ring-indigo-500/30 ring-indigo-500/10 rounded-2xl overflow-hidden">
              {previewUrl ? (
                <AvatarImage src={previewUrl} alt="Profile" />
              ) : userData?.profileImageUrl ? (
                <AvatarImage src={userData.profileImageUrl} alt="Profile" />
              ) : null}
              <AvatarFallback className="text-2xl sm:text-3xl bg-indigo-50 dark:bg-indigo-900/20 text-indigo-500">
                {initialsFromName(userData?.userName)}
              </AvatarFallback>
            </Avatar>
            <label className={`absolute -bottom-2 -right-2 flex size-10 cursor-pointer items-center justify-center rounded-xl bg-indigo-600 text-white shadow-lg transition-all hover:scale-110 hover:bg-indigo-700 ring-4 ring-white dark:ring-slate-900 ${isUploadingImage ? 'opacity-50 cursor-not-allowed' : ''}`}>
              {isUploadingImage ? <Loader2 className="size-5 animate-spin" /> : <Camera className="size-5" />}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                disabled={isUploadingImage}
                onChange={handleImageChange}
              />
            </label>
          </div>
        </div>

        <div className="flex-1 text-center sm:text-left space-y-4">
          <div>
            <h3 className="text-2xl font-black tracking-tight" style={{ color: isDark ? "#f8fafc" : "#0f172a" }}>
              {userData?.userName || "User Profile"}
            </h3>
            <div className="mt-1 flex flex-wrap justify-center sm:justify-start items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-500 text-[10px] font-bold uppercase tracking-wider">
                {roles.getRoleNameById(userData?.role)}
              </span>
              <span className="text-gray-400 text-xs">•</span>
              <span className="text-gray-500 text-sm font-medium">{userData?.email}</span>
            </div>
          </div>
          <p className="text-sm text-gray-500 font-medium max-w-md">
            Manage your personal information, security preferences, and active subscription details in one unified view.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* User Information Card */}
        <div 
          className="rounded-2xl border p-6 sm:p-8"
          style={{
            backgroundColor: isDark ? "#1e293b" : "#ffffff",
            borderColor: isDark ? "#334155" : "#e2e8f0",
          }}
        >
          <div className="flex items-center justify-between mb-8">
            <h4 className="text-lg font-bold flex items-center gap-2">
              <UserCircle2 className="size-5 text-indigo-500" />
              User Information
            </h4>
            <Button
              onClick={toggleEdit}
              variant="ghost"
              size="sm"
              className="rounded-xl font-bold gap-2 text-indigo-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20"
            >
              {isEditingInfo ? <X className="size-4" /> : <Pencil className="size-4" />}
              {isEditingInfo ? "Cancel" : "Edit Profile"}
            </Button>
          </div>

          {!isEditingInfo ? (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <ProfileDetail label="Full Name" value={userData?.userName} />
                <ProfileDetail label="Email Address" value={userData?.email} />
                <ProfileDetail label="Phone Number" value={userData?.phone || "Not provided"} />
                <ProfileDetail label="Company" value={userData?.companyName || "Not provided"} />
                <ProfileDetail label="Date Format" value={dateFormat?.toUpperCase().replaceAll("-", "/")} />
                <ComponentGuard allowedRoles={[roles.ADMIN]}>
                  <ProfileDetail label="GST Number" value={userData?.gst || "Not provided"} />
                </ComponentGuard>
              </div>

              <ComponentGuard allowedRoles={[roles.ADMIN, roles.SUPER_ADMIN]}>
                <div className="pt-4 border-t border-gray-100 dark:border-gray-700/50">
                   <ProfileDetail label="Office Address" value={userData?.address || "No address saved"} />
                </div>
              </ComponentGuard>

              <ComponentGuard allowedRoles={[roles.ADMIN]}>
                <div className="pt-4 mt-2">
                  <button
                    onClick={() => setIsDocumentOpen(!isDocumentOpen)}
                    className="flex items-center justify-between w-full p-4 rounded-2xl bg-gray-50 dark:bg-slate-900/50 hover:bg-gray-100 dark:hover:bg-slate-900 transition-colors"
                  >
                    <span className="text-sm font-bold flex items-center gap-2">
                      <FileImage className="size-4 text-indigo-500" />
                      Verification Documents
                    </span>
                    {isDocumentOpen ? <ExpandLess /> : <ExpandMore />}
                  </button>
                  <Collapse in={isDocumentOpen} timeout="auto" unmountOnExit>
                    <div className="pt-3 space-y-2 px-2">
                      {Array.isArray(userData?.documents) && userData.documents.length > 0 ? (
                        userData.documents.map((doc, idx) => (
                          <div key={idx} className="flex items-center justify-between p-3 rounded-xl border border-dashed border-gray-200 dark:border-gray-700">
                            <span className="text-xs font-medium truncate max-w-[200px]">{doc?.originalname}</span>
                            <button
                              onClick={() => {
                                setDocToDelete(doc);
                                setDeleteModalOpen(true);
                              }}
                              className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                            >
                              <Delete fontSize="small" />
                            </button>
                          </div>
                        ))
                      ) : (
                        <p className="text-xs text-gray-500 py-4 text-center italic">No documents uploaded yet</p>
                      )}
                    </div>
                  </Collapse>
                </div>
              </ComponentGuard>
            </div>
          ) : (
            <div className="mt-4">
              <EditUserForm onSubmit={handleSaveInfo} onClose={toggleEdit} />
            </div>
          )}
        </div>

        {/* Security & Password Section */}
        <div className="space-y-8">
          <div className="space-y-8">
            <div 
              className="rounded-2xl border p-6 sm:p-8 shadow-sm h-full"
              style={{
                backgroundColor: isDark ? "#1e293b" : "#ffffff",
                borderColor: isDark ? "#334155" : "#e2e8f0",
              }}
            >
              <h4 className="text-lg font-bold flex items-center gap-2 mb-8">
                <Shield className="size-5 text-emerald-500" />
                Password & Security
              </h4>
              <PasswordUpdateForm />
            </div>
            
            <ComponentGuard allowedRoles={[roles.SUPER_ADMIN]}>
              <TwoFactorAuthSection />
            </ComponentGuard>
          </div>
        </div>
      </div>

      {/* Subscription Details Section */}
      <SubscriptionDetails
        roles={roles}
        subscription={subscription}
        usedContacts={usedContacts}
      />

      {deleteModalOpen && (
        <ConfirmDeleteModal
          setModal={setDeleteModalOpen}
          triggerDelete={handleDeleteDocument}
          isLoading={isLoading}
        />
      )}
    </div>
  );
}

const ProfileDetail = ({ label, value }) => (
  <div className="space-y-1">
    <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
      {label}
    </p>
    <p className="text-[15px] font-semibold text-slate-700 dark:text-slate-200 truncate">
      {value || "—"}
    </p>
  </div>
);

export function PlansSettings({ theme, navigate, subscription, isSuperAdmin }) {
  const dispatch = useDispatch();
  const { planData = [] } = useSelector((s) => s.pricePlans);
  const { total: webinarTotal = 0 } = useSelector(
    (s) => s.webinarContact?.pagination || {},
  );

  useEffect(() => {
    dispatch(getPricePlans({ isActive: "active" }));
  }, [dispatch]);

  const planName =
    subscription?.plan?.name || (isSuperAdmin ? "Super admin" : "Your plan");
  const nextBill =
    subscription?.plan?.nextBillingDate || subscription?.nextBillingDate;

  const usageStats = useMemo(() => {
    if (isSuperAdmin || !subscription) {
      const used = Number(webinarTotal) || 0;
      return [
        {
          label: "Webinars",
          usageLabel: String(used),
          limitLabel: "N/A",
          pct: 0,
          color: "#3b82f6",
          hint: "Total webinars in hub (super admin has no subscription limits here).",
        },
      ];
    }

    const webinarBase =
      Number(
        subscription?.webinarLimit ?? subscription?.plan?.webinarLimit ?? 0,
      ) || 0;
    const webinarAddon = Number(subscription?.webinarLimitAddon ?? 0) || 0;
    const webinarLimit = webinarBase + webinarAddon;

    const contactBase = Number(subscription?.contactLimit) || 0;
    const contactAddon = Number(subscription?.contactLimitAddon) || 0;
    const contactLimit = contactBase + contactAddon;
    const contactUsed = Number(subscription?.contactCount) || 0;

    const stats = [];
    if (webinarLimit > 0) {
      const usage = Math.min(Number(webinarTotal) || 0, webinarLimit);
      stats.push({
        label: "Webinars",
        usageLabel: String(usage),
        limitLabel: String(webinarLimit),
        pct: Math.min(100, (usage / webinarLimit) * 100),
        color: "#3b82f6",
      });
    } else if (Number(webinarTotal) > 0) {
      stats.push({
        label: "Webinars",
        usageLabel: String(webinarTotal),
        limitLabel: "Unlimited",
        pct: 100,
        color: "#3b82f6",
      });
    }

    if (contactLimit > 0) {
      const usage = Math.min(contactUsed, contactLimit);
      stats.push({
        label: "Contacts",
        usageLabel: String(usage),
        limitLabel: String(contactLimit),
        pct: Math.min(100, (usage / contactLimit) * 100),
        color: "#22B573",
      });
    }

    return stats;
  }, [subscription, webinarTotal, isSuperAdmin]);

  const catalogPlans = useMemo(() => {
    const rows = Array.isArray(planData) ? planData : [];
    return rows
      .filter((p) => p?.planDurationConfig?.monthly?.isEnabled === true)
      .map((p) => {
        const price = monthlyDisplayPrice(p);
        const currentId = subscription?.plan?._id;
        const isCurrent = Boolean(currentId && p?._id === currentId);
        return {
          _id: p._id,
          name: p.name || "Plan",
          priceLabel: price > 0 ? `₹${Math.round(price)}` : "Custom",
          features: planFeaturesList(p),
          current: isCurrent,
        };
      });
  }, [planData, subscription]);

  return (
    <div className="space-y-6">
      <div
        className="p-6 rounded-2xl border relative overflow-hidden"
        style={{
          backgroundColor: theme === "dark" ? "#1e293b" : "#ffffff",
          borderColor: theme === "dark" ? "#334155" : "#e2e8f0",
          boxShadow: "0 4px 20px rgba(0,0,0,0.05)",
        }}
      >
        <div className="absolute top-0 right-0 p-8 opacity-5">
          <Zap size={120} />
        </div>
        <div className="flex justify-between items-start mb-6 flex-wrap gap-4">
          <div>
            <span className="px-3 py-1 rounded-full bg-blue-500/10 text-blue-500 text-[10px] font-bold uppercase tracking-wider mb-2 inline-block">
              Current Plan
            </span>
            <h3
              className="text-2xl font-bold"
              style={{ color: theme === "dark" ? "#f8fafc" : "#1e293b" }}
            >
              {planName}
            </h3>
            <p className="text-gray-500 text-sm">
              {nextBill
                ? `Next billing: ${nextBill}`
                : "Manage subscription and limits on the Plans page."}
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate("/plans")}
            className="rounded-xl border-2 font-bold text-[10px] sm:text-xs h-8 sm:h-10 px-2 sm:px-4"
          >
            OPEN PLANS
          </Button>
        </div>
        {usageStats.length === 0 ? (
          <p className="text-sm text-gray-500 font-medium">
            No webinar or contact limits on your subscription yet. Open Plans
            for full usage and limits.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {usageStats.map((stat) => (
              <div
                key={stat.label}
                className="p-4 rounded-2xl bg-gray-50 dark:bg-slate-900/50"
              >
                <div className="flex justify-between items-end mb-2 gap-2">
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                    {stat.label}
                  </span>
                  <span
                    className="text-sm font-bold text-right"
                    style={{ color: theme === "dark" ? "#f8fafc" : "#1e293b" }}
                  >
                    {stat.usageLabel} / {stat.limitLabel}
                  </span>
                </div>
                {stat.hint ? (
                  <p className="text-[10px] text-gray-500 mb-2">{stat.hint}</p>
                ) : null}
                <div className="h-1.5 w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${stat.pct}%` }}
                    className="h-full rounded-full"
                    style={{ backgroundColor: stat.color }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <h4 className="text-base sm:text-lg font-bold mt-6 sm:mt-8 mb-4">
        Available Plans
      </h4>
      {catalogPlans.length === 0 ? (
        <p className="text-sm text-gray-500 font-medium">
          No active plans loaded. Open the Plans page to browse or refresh.
        </p>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          {catalogPlans.map((plan) => (
            <div
              key={plan._id}
              className={`p-6 rounded-2xl border transition-all duration-300 hover:scale-[1.02] ${
                plan.current ? "ring-2 ring-blue-500" : ""
              }`}
              style={{
                backgroundColor: theme === "dark" ? "#1e293b" : "#ffffff",
                borderColor:
                  theme === "dark"
                    ? plan.current
                      ? "#3b82f6"
                      : "#334155"
                    : plan.current
                      ? "#3b82f6"
                      : "#e2e8f0",
              }}
            >
              <h5 className="font-bold text-lg mb-1">{plan.name}</h5>
              <div className="flex items-baseline gap-1 mb-6">
                <span className="text-2xl font-black">{plan.priceLabel}</span>
                <span className="text-gray-500 text-xs font-medium">
                  / month
                </span>
              </div>
              <ul className="space-y-3 mb-8">
                {plan.features.map((f) => (
                  <li
                    key={f}
                    className="flex items-center gap-2 text-sm text-gray-500 font-medium"
                  >
                    <Check className="w-4 h-4 text-green-500 shrink-0" /> {f}
                  </li>
                ))}
              </ul>
              <Button
                type="button"
                onClick={() => navigate("/plans")}
                className="w-full rounded-xl font-bold py-5"
                style={{
                  backgroundColor: plan.current ? "#22B573" : "transparent",
                  color: plan.current
                    ? "white"
                    : theme === "dark"
                      ? "#cbd5e1"
                      : "#475569",
                  border: plan.current
                    ? "none"
                    : `2px solid ${theme === "dark" ? "#334155" : "#e2e8f0"}`,
                }}
                disabled={plan.current}
              >
                {plan.current ? "CURRENT PLAN" : "VIEW ON PLANS"}
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function addonSummaryLines(addon) {
  const parts = [];
  if (addon?.employeeLimit) parts.push(`${addon.employeeLimit} employees`);
  if (addon?.contactLimit) parts.push(`${addon.contactLimit} contacts`);
  if (addon?.webinarLimit) parts.push(`${addon.webinarLimit} webinars`);
  if (addon?.whatsappProjectLimit)
    parts.push(`${addon.whatsappProjectLimit} WhatsApp`);
  if (addon?.zoomProjectLimit) parts.push(`${addon.zoomProjectLimit} Zoom`);
  return parts.length ? parts.join(" · ") : "";
}

export function AddonsSettings({ theme, navigate, isSuper }) {
  const dispatch = useDispatch();
  const { addonsData = [] } = useSelector((s) => s.pricePlans);

  useEffect(() => {
    dispatch(getAddons());
    return () => {
      dispatch(resetAddonsData());
    };
  }, [dispatch]);

  if (!Array.isArray(addonsData) || addonsData.length === 0) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-gray-500 font-medium">
          No add-ons returned from the server yet. Open add-ons to load or
          create catalog items.
        </p>
        <Button
          type="button"
          onClick={() => navigate(isSuper ? "/addons" : "/addons/buy")}
          className="rounded-xl font-bold bg-[#1877F2] text-white"
        >
          {isSuper ? "Open manage add-ons" : "Open buy add-ons"}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {addonsData.map((addon) => {
          const summary = addonSummaryLines(addon);
          const Icon =
            addon?.whatsappProjectLimit > 0
              ? MessageCircle
              : addon?.zoomProjectLimit > 0
                ? Cloud
                : addon?.webinarLimit > 0
                  ? Zap
                  : Shield;
          return (
            <div
              key={addon._id}
              className="p-4 sm:p-6 rounded-2xl sm:rounded-2xl border flex gap-3 sm:gap-5 hover:shadow-xl transition-all group"
              style={{
                backgroundColor: theme === "dark" ? "#1e293b" : "#ffffff",
                borderColor: theme === "dark" ? "#334155" : "#e2e8f0",
              }}
            >
              <div className="w-14 h-14 rounded-2xl bg-blue-500/10 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                <Icon className="w-7 h-7 text-blue-500" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start mb-1 gap-2">
                  <h4 className="font-bold text-lg truncate">
                    {addon.addonName || "Add-on"}
                  </h4>
                  <span className="font-black text-blue-500 shrink-0">
                    {addon.addOnPrice != null ? `₹${addon.addOnPrice}` : ""}
                  </span>
                </div>
                {summary ? (
                  <p className="text-gray-500 text-sm mb-4">{summary}</p>
                ) : null}
                <div className="flex justify-between items-center flex-wrap gap-2">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                    {addon.validityInDays
                      ? `${addon.validityInDays}d validity`
                      : "Add-on"}
                  </span>
                  <Button
                    type="button"
                    onClick={() =>
                      navigate(isSuper ? "/addons" : "/addons/buy")
                    }
                    className="rounded-lg h-8 px-4 text-xs font-bold bg-blue-500 hover:bg-blue-600 text-white border-none shadow-lg shadow-blue-500/20"
                  >
                    {isSuper ? "MANAGE" : "ADD TO PLAN"}
                  </Button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

const tagsChipContainer = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.05, delayChildren: 0.04 },
  },
};

const tagsChipItem = {
  hidden: { opacity: 0, scale: 0.92 },
  show: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.32, ease: [0.22, 1, 0.36, 1] },
  },
};

export function TagsSettings({ theme, navigate }) {
  const { data: tagsFromApi = [], isLoading } = useTags();
  const colors = [
    "#3b82f6",
    "#22c55e",
    "#f59e0b",
    "#ef4444",
    "#8b5cf6",
    "#ec4899",
    "#06b6d4",
  ];

  const tags = useMemo(
    () =>
      Array.isArray(tagsFromApi) ? tagsFromApi.filter((t) => t?.name) : [],
    [tagsFromApi],
  );

  return (
    <div className="space-y-6">
      <div
        className="min-h-[280px] rounded-2xl border p-6 shadow-sm"
        style={{
          backgroundColor: theme === "dark" ? "#1e293b" : "#ffffff",
          borderColor: theme === "dark" ? "#334155" : "#e2e8f0",
        }}
      >
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h4 className="text-xs font-bold uppercase tracking-widest text-gray-400">
            Global tags
          </h4>
          <Button
            type="button"
            onClick={() => navigate("/tags")}
            className="flex h-9 items-center gap-2 rounded-xl border-none bg-blue-500 px-4 text-xs font-bold text-white shadow-lg shadow-blue-500/20 hover:bg-blue-600 dark:shadow-blue-900/40"
          >
            <Plus size={14} strokeWidth={2.5} /> ADD NEW TAG
          </Button>
        </div>
        {isLoading ? (
          <p className="text-sm text-gray-500 dark:text-slate-400">
            Loading tags…
          </p>
        ) : tags.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-slate-400">
            No tags yet. Open the Tags page to add one.
          </p>
        ) : (
          <motion.div
            variants={tagsChipContainer}
            initial="hidden"
            animate="show"
            className="flex flex-wrap gap-3"
          >
            {tags.map((tagRow, i) => (
              <motion.div
                key={tagRow._id || tagRow.name}
                variants={tagsChipItem}
                layout
                className="group flex items-center gap-3 rounded-xl border px-4 py-2 transition-all hover:shadow-md"
                style={{
                  backgroundColor:
                    theme === "dark" ? "rgba(15, 23, 42, 0.5)" : "#f8fafc",
                  borderColor: theme === "dark" ? "#334155" : "#e5e7eb",
                }}
              >
                <div
                  className="h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: colors[i % colors.length] }}
                />
                <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                  {tagRow.name}
                </span>
                <button
                  type="button"
                  onClick={() => navigate("/tags")}
                  className="rounded-md p-1 text-red-400 opacity-0 transition-all hover:bg-red-50 group-hover:opacity-100 dark:hover:bg-red-950/40 dark:hover:text-red-300"
                  aria-label="Open tags page"
                  title="Manage on Tags page"
                >
                  <X size={14} strokeWidth={2.5} />
                </button>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </div>
  );
}

function formatBillingType(type) {
  if (!type) return "—";
  return String(type).split("_").join(" ");
}

export function BillingSettings({ theme, navigate }) {
  const dispatch = useDispatch();
  const { billingHistory = [] } = useSelector((s) => s.pricePlans);
  const LIMIT = useSelector((s) => s.pageLimits?.billingHistory || 8);

  useEffect(() => {
    dispatch(getAdminBillingHistory({ page: 1, limit: LIMIT }));
  }, [dispatch, LIMIT]);

  const downloadPdf = async (bill) => {
    const { generateInvoicePdf } = await import("../../utils/invoicePdf");
    const { toast } = await import("sonner");
    await generateInvoicePdf({
      bill,
      billToName: bill?.admin?.companyName || "Company Name",
      onMissingAddress: () => {
        toast.error("Address is required to download the PDF");
        navigate("/profile");
      },
    });
  };

  const rows = Array.isArray(billingHistory) ? billingHistory : [];

  return (
    <div className="space-y-4">
      <div
        className="rounded-2xl sm:rounded-2xl border overflow-hidden shadow-sm overflow-x-auto custom-scrollbar"
        style={{
          backgroundColor: theme === "dark" ? "#1e293b" : "#ffffff",
          borderColor: theme === "dark" ? "#334155" : "#e2e8f0",
        }}
      >
        <table className="w-full text-left border-collapse min-w-[600px]">
          <thead>
            <tr
              className="border-b"
              style={{
                borderColor: theme === "dark" ? "#334155" : "#e2e8f0",
                backgroundColor:
                  theme === "dark" ? "rgba(15,23,42,0.5)" : "#F9FAFB",
              }}
            >
              <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-gray-500">
                Invoice ID
              </th>
              <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-gray-500">
                Date
              </th>
              <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-gray-500">
                Plan
              </th>
              <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-gray-500">
                Amount
              </th>
              <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-gray-500 text-right">
                Billing
              </th>
              <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-gray-500 text-right">
                Action
              </th>
            </tr>
          </thead>
          <tbody
            className="divide-y"
            style={{ borderColor: theme === "dark" ? "#334155" : "#e2e8f0" }}
          >
            {rows.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-6 py-8 text-center text-sm text-gray-500"
                >
                  No billing history loaded. Open Billing History for the full
                  list.
                </td>
              </tr>
            ) : (
              rows.map((bill) => (
                <tr
                  key={bill._id}
                  className="hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                >
                  <td className="px-6 py-4 text-sm font-bold font-mono text-blue-500">
                    {bill.invoiceNumber || "—"}
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-gray-500">
                    {formatDateAsNumber(bill?.createdAt)}
                  </td>
                  <td className="px-6 py-4 text-sm font-semibold">
                    {bill?.plan?.name || "—"}
                  </td>
                  <td className="px-6 py-4 text-sm font-black">
                    {"\u20B9"}
                    {bill?.amount ?? "—"}
                  </td>
                  <td className="px-6 py-4 text-right text-xs font-medium text-gray-500 capitalize">
                    {formatBillingType(bill?.billingType)}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      type="button"
                      onClick={() => downloadPdf(bill)}
                      className="p-2 hover:bg-blue-500/10 rounded-lg text-blue-500 transition-all"
                      aria-label="Download invoice PDF"
                    >
                      <Download size={16} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <Button
        type="button"
        onClick={() => navigate("/billing-history")}
        className="rounded-xl font-bold bg-[#1877F2] text-white"
      >
        Open billing history
      </Button>
    </div>
  );
}

export function ApiSettings({ theme, navigate }) {
  const dispatch = useDispatch();
  const [tokens, setTokens] = useState([]);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    dispatch(getAPIAccessTokens())
      .unwrap()
      .then((res) => {
        setTokens(Array.isArray(res) ? res : []);
      })
      .catch(() => setTokens([]));
  }, [dispatch]);

  const primary = tokens[0];
  const masked = primary?.token
    ? `${String(primary.token).slice(0, 8)}…${String(primary.token).slice(-6)}`
    : "";
  const displayValue = !primary?.token
    ? "No API token yet — generate one from the API docs page."
    : revealed
      ? primary.token
      : masked;

  const handleCopy = () => {
    if (!primary?.token) {
      navigate("/api-docs");
      return;
    }
    navigator.clipboard.writeText(primary.token);
    successToast("Copied to clipboard!");
  };

  return (
    <div className="space-y-6">
      <div
        className="p-6 rounded-2xl border bg-gradient-to-br"
        style={{
          backgroundColor: theme === "dark" ? "#1e293b" : "#ffffff",
          borderColor: theme === "dark" ? "#334155" : "#e2e8f0",
          backgroundImage:
            theme === "dark"
              ? "linear-gradient(to bottom right, #1e293b, #0f172a)"
              : "linear-gradient(to bottom right, #ffffff, #f8fafc)",
        }}
      >
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-orange-500/10 flex items-center justify-center">
            <Key className="w-6 h-6 text-orange-500" />
          </div>
          <div>
            <h4 className="font-bold text-lg">Your API Token</h4>
            <p className="text-gray-500 text-sm italic">
              Never share this token with anyone!
            </p>
            {primary?.label ? (
              <p className="text-xs text-gray-400 mt-1">
                Label: {primary.label}
              </p>
            ) : null}
          </div>
        </div>
        <div className="relative group">
          <input
            type="text"
            readOnly
            value={displayValue}
            className="w-full p-4 pr-36 rounded-2xl border-2 font-mono text-sm tracking-wider"
            style={{
              backgroundColor: theme === "dark" ? "#111827" : "#f1f5f9",
              borderColor: theme === "dark" ? "#334155" : "#e2e8f0",
              color: theme === "dark" ? "#cbd5e1" : "#475569",
            }}
          />
          <div className="absolute right-1 top-1 bottom-1 flex gap-1 sm:right-2 sm:top-2 sm:bottom-2">
            <Button
              type="button"
              variant="ghost"
              disabled={!primary?.token}
              onClick={() => setRevealed((r) => !r)}
              className="h-full rounded-lg sm:rounded-xl px-2 sm:px-4 text-blue-500 font-bold text-[10px] sm:text-xs"
            >
              {revealed ? "HIDE" : "REVEAL"}
            </Button>
            <Button
              type="button"
              onClick={handleCopy}
              className="h-full rounded-lg sm:rounded-xl px-2 sm:px-4 bg-blue-500 text-white font-bold text-[10px] sm:text-xs border-none shadow-md shadow-blue-500/20"
            >
              COPY
            </Button>
          </div>
        </div>
        <div className="mt-6 sm:mt-8 grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <button
            type="button"
            onClick={() => navigate("/api-docs")}
            className="p-4 rounded-2xl border bg-black/5 flex items-center gap-4 text-left w-full hover:bg-black/10 transition-colors"
            style={{ borderColor: theme === "dark" ? "#334155" : "#e2e8f0" }}
          >
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
              <ExternalLink size={18} className="text-blue-500" />
            </div>
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                Documentation
              </p>
              <span className="text-sm font-bold text-blue-500">
                Open API docs and tools
              </span>
            </div>
          </button>
          <button
            type="button"
            onClick={() => navigate("/api-docs")}
            className="p-4 rounded-2xl border bg-black/5 flex items-center gap-4 text-left w-full hover:bg-black/10 transition-colors"
            style={{ borderColor: theme === "dark" ? "#334155" : "#e2e8f0" }}
          >
            <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center">
              <Shield size={18} className="text-red-500" />
            </div>
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                Security
              </p>
              <span className="text-sm font-bold text-red-500">
                Expire tokens in API console
              </span>
            </div>
          </button>
        </div>
      </div>
      <Button
        type="button"
        onClick={() => navigate("/api-docs")}
        className="rounded-xl font-bold bg-[#22B573] text-white"
      >
        Open API token page
      </Button>
    </div>
  );
}

const LEAD_ICONS = [Zap, Clock, AlertCircle, Shield];

export function LeadTypesSettings({ theme, navigate }) {
  const dispatch = useDispatch();
  const { leadTypeData = [] } = useSelector((s) => s.assign);

  useEffect(() => {
    dispatch(getLeadType());
  }, [dispatch]);

  if (!Array.isArray(leadTypeData) || leadTypeData.length === 0) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-gray-500 font-medium">
          No lead types returned from the server. Add and manage them on the
          Lead Types page.
        </p>
        <Button
          type="button"
          onClick={() => navigate("/lead-type")}
          className="w-full py-4 sm:py-6 rounded-2xl border-2 border-dashed font-bold text-gray-400 hover:text-blue-500 hover:border-blue-500 hover:bg-blue-50/50 dark:hover:bg-blue-500/5 transition-all text-xs sm:text-base"
        >
          <Plus size={18} className="mr-2 inline" /> OPEN LEAD TYPES
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {leadTypeData.map((lt, i) => {
        const color = lt.color || "#3b82f6";
        const Icon = LEAD_ICONS[i % LEAD_ICONS.length];
        return (
          <div
            key={lt._id || lt.label || i}
            className="p-4 rounded-2xl border flex items-center gap-5 hover:bg-black/5 transition-all"
            style={{
              backgroundColor: theme === "dark" ? "#1e293b" : "#ffffff",
              borderColor: theme === "dark" ? "#334155" : "#e2e8f0",
            }}
          >
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: `${color}20`, color }}
            >
              <Icon size={22} />
            </div>
            <div className="flex-1 min-w-0">
              <h5 className="font-bold">{lt.label}</h5>
            </div>
            <div className="flex gap-2 shrink-0">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="w-9 h-9 rounded-xl hover:bg-blue-500/10"
                onClick={() => navigate("/lead-type")}
              >
                <Pencil size={16} className="text-blue-500" />
              </Button>
            </div>
          </div>
        );
      })}
      <Button
        type="button"
        onClick={() => navigate("/lead-type")}
        className="w-full py-4 sm:py-6 rounded-2xl border-2 border-dashed font-bold text-gray-400 hover:text-blue-500 hover:border-blue-500 hover:bg-blue-50/50 dark:hover:bg-blue-500/5 transition-all text-xs sm:text-base"
      >
        <Plus size={18} className="mr-2 inline" /> OPEN LEAD TYPES
      </Button>
    </div>
  );
}

export function ProductLevelSettings({ theme, navigate }) {
  const [levels, setLevels] = useState([]);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    productLevelService
      .getProductLevels()
      .then((res) => {
        if (res?.success && Array.isArray(res.data)) {
          setLevels(res.data);
        } else {
          setLevels([]);
        }
      })
      .catch(() => {
        setLoadError(true);
        setLevels([]);
      });
  }, []);

  if (loadError) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-red-500 font-medium">
          Could not load product levels.
        </p>
        <Button
          type="button"
          onClick={() => navigate("/product-level")}
          className="rounded-xl font-bold bg-[#1877F2] text-white"
        >
          Open product levels
        </Button>
      </div>
    );
  }

  if (!levels.length) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-gray-500 font-medium">
          No product levels configured yet. Create them on the Product Level
          page.
        </p>
        <Button
          type="button"
          onClick={() => navigate("/product-level")}
          className="rounded-xl font-bold bg-[#1877F2] text-white"
        >
          Open product levels
        </Button>
      </div>
    );
  }

  const sorted = [...levels].sort((a, b) => Number(a.level) - Number(b.level));

  return (
    <div className="space-y-6">
      <div
        className="p-4 sm:p-8 rounded-2xl border relative overflow-hidden"
        style={{
          backgroundColor: theme === "dark" ? "#1e293b" : "#ffffff",
          borderColor: theme === "dark" ? "#334155" : "#e2e8f0",
        }}
      >
        <div className="flex flex-col gap-8 relative">
          {sorted.map((row, i) => (
            <div
              key={row._id || row.level}
              className="flex items-center gap-3 sm:gap-6 relative"
            >
              {i < sorted.length - 1 && (
                <div
                  className="absolute left-5 sm:left-6 top-8 sm:top-10 bottom-[-20px] w-0.5 border-l-2 border-dashed"
                  style={{
                    borderColor: theme === "dark" ? "#334155" : "#e2e8f0",
                  }}
                />
              )}
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-blue-500 text-white flex items-center justify-center font-black shadow-lg shadow-blue-500/20 z-10 text-xs sm:text-base">
                L{row.level}
              </div>
              <div
                className="flex-1 p-3 sm:p-4 rounded-xl sm:rounded-2xl border bg-black/5"
                style={{
                  borderColor: theme === "dark" ? "#334155" : "#e2e8f0",
                }}
              >
                <div className="flex justify-between items-center flex-wrap gap-2">
                  <div>
                    <h5 className="font-bold text-sm">
                      {row.label || `Level ${row.level}`}
                    </h5>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                      Product level {row.level}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="w-8 h-8 rounded-lg"
                    onClick={() => navigate("/product-level")}
                  >
                    <Pencil size={14} />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <Button
        type="button"
        onClick={() => navigate("/product-level")}
        className="rounded-xl font-bold bg-[#1877F2] text-white"
      >
        Open product levels
      </Button>
    </div>
  );
}

/** Masked table toggles — Redux `table` slice + `localStorage` until APIs exist. */
export function MaskedTablesSettings() {
  const dispatch = useDispatch();
  const { isTablesMasked, maskBillingHistory, maskProductSalesDetail } =
    useSelector((state) => state.table);

  const rows = useMemo(
    () => [
      {
        key: "attendees",
        table: "Attendees Main List",
        fields: ["Email", "Phone"],
        checked: Boolean(isTablesMasked),
        onCheckedChange: (v) => dispatch(setTableMasked(Boolean(v))),
      },
      {
        key: "billing",
        table: "Billing History",
        fields: ["Transaction ID"],
        checked: Boolean(maskBillingHistory),
        onCheckedChange: (v) => dispatch(setMaskBillingHistory(Boolean(v))),
      },
      {
        key: "sales",
        table: "Product Sales Detail",
        fields: ["Customer Identity"],
        checked: Boolean(maskProductSalesDetail),
        onCheckedChange: (v) => dispatch(setMaskProductSalesDetail(Boolean(v))),
      },
    ],
    [dispatch, isTablesMasked, maskBillingHistory, maskProductSalesDetail],
  );

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="mb-2 flex items-start gap-3 rounded-2xl border border-blue-200/80 bg-blue-50/90 p-4 dark:border-blue-500/25 dark:bg-blue-950/30 sm:items-center sm:gap-4"
      >
        <Info className="mt-0.5 shrink-0 text-blue-500 sm:mt-0" size={20} />
        <div className="space-y-2 text-xs font-semibold leading-relaxed text-blue-800 dark:text-blue-200/90">
          <p>
            Masked tables hide sensitive data (like phone numbers and emails)
            for specific roles unless explicitly authorized — same layout as the
            new settings reference.
          </p>
        </div>
      </motion.div>
      <div className="min-h-[120px] overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800/90 sm:p-6">
        <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
          Tables
        </h2>
        <div className="mt-5 space-y-3">
          {rows.map((mask, i) => (
            <motion.div
              key={mask.key}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: 0.08 + i * 0.06 }}
              className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-slate-50/50 p-4 sm:flex-row sm:items-center sm:justify-between dark:border-slate-600 dark:bg-slate-900/60 sm:p-5"
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h5 className="font-bold text-slate-900 dark:text-slate-50">
                    {mask.table}
                  </h5>
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {mask.fields.map((f) => (
                    <span
                      key={f}
                      className="rounded-md bg-white px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-500 shadow-sm ring-1 ring-slate-200/80 dark:bg-slate-800 dark:text-slate-400 dark:ring-slate-600"
                    >
                      {f}
                    </span>
                  ))}
                </div>
              </div>
              <div className="flex shrink-0 items-center justify-between gap-4 sm:justify-end">
                <span
                  className={`text-[10px] font-black uppercase tracking-widest ${
                    mask.checked
                      ? "text-emerald-600 dark:text-emerald-400"
                      : "text-slate-400 dark:text-slate-500"
                  }`}
                >
                  {mask.checked ? "Active" : "Disabled"}
                </span>
                <Switch
                  checked={mask.checked}
                  onCheckedChange={mask.onCheckedChange}
                />
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function CustomOptionsSettings({
  theme,
  hubIsDark,
  setDarkClass,
  navigate,
}) {
  return (
    <div className="space-y-4 sm:space-y-6">
      <div
        className="p-4 sm:p-6 rounded-2xl sm:rounded-2xl border space-y-4 max-w-xl"
        style={{
          backgroundColor: theme === "dark" ? "#1e293b" : "#ffffff",
          borderColor: theme === "dark" ? "#334155" : "#e2e8f0",
        }}
      >
        <h4 className="font-bold flex items-center gap-2">
          <Zap size={18} className="text-blue-500" /> Hub appearance
        </h4>
        <div className="flex justify-between items-center gap-4">
          <span className="text-sm font-medium">Dark mode</span>
          <Switch
            checked={hubIsDark}
            onCheckedChange={(v) => setDarkClass(Boolean(v))}
          />
        </div>
      </div>
      <p className="text-sm text-gray-500 max-w-xl">
        Lead statuses, dropdowns, and other business custom options are edited
        on the dedicated page (not stored here).
      </p>
      <Button
        type="button"
        onClick={() => navigate("/settings/custom-status")}
        className="rounded-xl font-bold bg-[#1877F2] text-white w-full sm:w-auto"
      >
        Open custom options
      </Button>
    </div>
  );
}

export function LinkoutSettings({
  theme,
  navigate,
  title,
  description,
  path,
  icon: Icon,
}) {
  return (
    <div
      className="p-6 rounded-2xl border space-y-4"
      style={{
        backgroundColor: theme === "dark" ? "#1e293b" : "#ffffff",
        borderColor: theme === "dark" ? "#334155" : "#e2e8f0",
      }}
    >
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center">
          <Icon className="w-6 h-6 text-blue-500" />
        </div>
        <div>
          <h3
            className="text-lg font-bold"
            style={{ color: theme === "dark" ? "#f8fafc" : "#071028" }}
          >
            {title}
          </h3>
          <p className="text-sm text-gray-500 font-medium">{description}</p>
        </div>
      </div>
      <Button
        type="button"
        onClick={() => navigate(path)}
        className="rounded-xl font-bold bg-[#1877F2] text-white w-full sm:w-auto"
      >
        Open
      </Button>
    </div>
  );
}
