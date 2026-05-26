import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  Cloud,
  Mail,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Eye,
  EyeOff,
  Save,
  Link2,
} from "lucide-react";
import HubSubpageShell from "../../../components/Layout/HubSubpageShell";
import { Button } from "../../../components/ui/button";
import { Switch } from "../../../components/ui/switch";
import { useIntegrationsSettings, useUpdateIntegrationsSettings } from "../../../hooks/useIntegrations";
import { toast } from "sonner";

const ViewIntegrations = () => {
  const { data: settings, isLoading } = useIntegrationsSettings();
  const { mutate: updateSettings, isPending: isSaving } = useUpdateIntegrationsSettings();

  const [expandedId, setExpandedId] = useState(null);
  const [showPassword, setShowPassword] = useState({});

  // Local state for all fields
  const [formState, setFormState] = useState({
    convertkit: { apiKey: "", apiSecret: "", isActive: false },
    aweber: { apiKey: "", apiSecret: "", isActive: false },
    activecampaign: { apiKey: "", apiSecret: "", isActive: false },
    pabblyEmail: { apiKey: "", apiSecret: "", isActive: false },
    interestPool: { accountId: "", accessToken: "", isActive: false },
  });

  // Sync settings when loaded
  useEffect(() => {
    if (settings) {
      setFormState({
        convertkit: {
          apiKey: settings.convertkit?.apiKey || "",
          apiSecret: settings.convertkit?.apiSecret || "",
          isActive: !!settings.convertkit?.isActive,
        },
        aweber: {
          apiKey: settings.aweber?.apiKey || "",
          apiSecret: settings.aweber?.apiSecret || "",
          isActive: !!settings.aweber?.isActive,
        },
        activecampaign: {
          apiKey: settings.activecampaign?.apiKey || "",
          apiSecret: settings.activecampaign?.apiSecret || "",
          isActive: !!settings.activecampaign?.isActive,
        },
        pabblyEmail: {
          apiKey: settings.pabblyEmail?.apiKey || "",
          apiSecret: settings.pabblyEmail?.apiSecret || "",
          isActive: !!settings.pabblyEmail?.isActive,
        },
        interestPool: {
          accountId: settings.interestPool?.accountId || "",
          accessToken: settings.interestPool?.accessToken || "",
          isActive: !!settings.interestPool?.isActive,
        },
      });
    }
  }, [settings]);

  const toggleExpand = (id) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  const handleToggleActive = (integrationId, checked) => {
    setFormState((prev) => {
      const updated = {
        ...prev,
        [integrationId]: {
          ...prev[integrationId],
          isActive: checked,
        },
      };
      // Auto save active state change
      updateSettings(updated);
      return updated;
    });
  };

  const handleInputChange = (integrationId, field, value) => {
    setFormState((prev) => ({
      ...prev,
      [integrationId]: {
        ...prev[integrationId],
        [field]: value,
      },
    }));
  };

  const togglePasswordReveal = (fieldKey) => {
    setShowPassword((prev) => ({ ...prev, [fieldKey]: !prev[fieldKey] }));
  };

  const handleSaveIntegration = (integrationId) => {
    const integrationData = formState[integrationId];

    // Simple validation (only if turning active)
    if (integrationData.isActive) {
      if (integrationId === "convertkit" && (!integrationData.apiKey || !integrationData.apiSecret)) {
        toast.error("API Key and API Secret are required for ConvertKit.");
        return;
      }
      if (integrationId === "aweber" && (!integrationData.apiKey || !integrationData.apiSecret)) {
        toast.error("API Key and API Secret are required for AWeber.");
        return;
      }
      if (integrationId === "activecampaign" && (!integrationData.apiKey || !integrationData.apiSecret)) {
        toast.error("API Key and API Secret are required for ActiveCampaign.");
        return;
      }
      if (integrationId === "pabblyEmail" && (!integrationData.apiKey || !integrationData.apiSecret)) {
        toast.error("API Key and API Secret are required for Pabbly Emails.");
        return;
      }
      if (integrationId === "interestPool" && (!integrationData.accountId || !integrationData.accessToken)) {
        toast.error("Account ID and Access Token are required for Interest Pool.");
        return;
      }
    }

    updateSettings(formState);
  };

  const integrations = [
    {
      id: "convertkit",
      name: "ConvertKit",
      description: "Send subscriber details and event types to ConvertKit.",
      icon: Mail,
      themeColor: "from-pink-500/10 to-rose-500/10 border-rose-500/20 text-rose-500",
      accentBg: "bg-rose-500",
      fields: [
        { label: "API Key", key: "apiKey", type: "password", placeholder: "Enter ConvertKit API Key" },
        { label: "API Secret", key: "apiSecret", type: "password", placeholder: "Enter ConvertKit API Secret" },
      ],
    },
    {
      id: "aweber",
      name: "AWeber",
      description: "Automatically sync webinar leads to AWeber subscriber lists.",
      icon: Cloud,
      themeColor: "from-blue-500/10 to-indigo-500/10 border-blue-500/20 text-blue-500",
      accentBg: "bg-blue-600",
      fields: [
        { label: "API Key", key: "apiKey", type: "password", placeholder: "Enter AWeber API Key" },
        { label: "API Secret", key: "apiSecret", type: "password", placeholder: "Enter AWeber API Secret" },
      ],
    },
    {
      id: "activecampaign",
      name: "ActiveCampaign",
      description: "Connect ActiveCampaign contacts and configure automated flows.",
      icon: Sparkles,
      themeColor: "from-violet-500/10 to-purple-500/10 border-purple-500/20 text-purple-500",
      accentBg: "bg-purple-600",
      fields: [
        { label: "API Key", key: "apiKey", type: "password", placeholder: "Enter ActiveCampaign API Key" },
        { label: "API Secret", key: "apiSecret", type: "password", placeholder: "Enter ActiveCampaign API Secret" },
      ],
    },
    {
      id: "pabblyEmail",
      name: "Pabbly Emails",
      description: "Send leads directly to Pabbly Email Marketing software workflows.",
      icon: Mail,
      themeColor: "from-cyan-500/10 to-teal-500/10 border-cyan-500/20 text-cyan-500",
      accentBg: "bg-cyan-500",
      fields: [
        { label: "API Key", key: "apiKey", type: "password", placeholder: "Enter Pabbly Email API Key" },
        { label: "API Secret", key: "apiSecret", type: "password", placeholder: "Enter Pabbly Email API Secret" },
      ],
    },
    {
      id: "interestPool",
      name: "Interest Pool",
      description: "Configure Meta targeting APIs to fetch Facebook interests directly.",
      icon: Link2,
      themeColor: "from-emerald-500/10 to-teal-500/10 border-emerald-500/20 text-emerald-500",
      accentBg: "bg-emerald-500",
      fields: [
        { label: "Account ID", key: "accountId", type: "text", placeholder: "e.g. 1234567890" },
        { label: "Access Token", key: "accessToken", type: "password", placeholder: "Paste Facebook access token" },
      ],
    },
  ];

  if (isLoading) {
    return (
      <HubSubpageShell maxWidthClass="max-w-6xl">
        <div className="flex h-96 items-center justify-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-slate-200 border-t-blue-500" />
        </div>
      </HubSubpageShell>
    );
  }

  return (
    <HubSubpageShell maxWidthClass="max-w-6xl">
      <motion.header
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        className="mb-8 flex flex-col gap-4 sm:mb-8"
      >
        <div className="flex items-start gap-4">
          <motion.div
            aria-hidden
            className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-indigo-500/10 dark:bg-indigo-500/15"
            initial={{ scale: 0.85, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{
              type: "spring",
              stiffness: 380,
              damping: 22,
              delay: 0.05,
            }}
          >
            <Cloud className="h-7 w-7 text-indigo-500 dark:text-indigo-400" />
          </motion.div>
          <div className="min-w-0 space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-slate-50 sm:text-3xl">
                Integrations
              </h1>
              <Sparkles
                className="hidden h-5 w-5 text-indigo-400 sm:inline sm:h-6 sm:w-6"
                aria-hidden
              />
            </div>
            <p className="max-w-2xl text-sm font-medium leading-relaxed text-slate-500 dark:text-slate-400">
              Connect external marketing platforms and services. Turn them on to sync webinar attendees and manage search limits.
            </p>
          </div>
        </div>
      </motion.header>

      <div className="space-y-6">
        {integrations.map((item, index) => {
          const isExpanded = expandedId === item.id;
          const config = formState[item.id] || {};
          const Icon = item.icon;

          return (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: index * 0.05 }}
              className="overflow-hidden rounded-3xl border border-slate-200 bg-white/70 shadow-sm backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/60"
            >
              {/* Card Header */}
              <div
                className={`flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between cursor-pointer hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors`}
                onClick={() => toggleExpand(item.id)}
              >
                <div className="flex items-center gap-4">
                  <div className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${item.themeColor}`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-slate-50">
                      {item.name}
                    </h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      {item.description}
                    </p>
                  </div>
                </div>

                {/* Status Toggle & Expander */}
                <div className="flex items-center justify-between gap-4 sm:justify-end" onClick={(e) => e.stopPropagation()}>
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold ${config.isActive
                        ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
                        : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"
                      }`}
                  >
                    {config.isActive ? (
                      <>
                        <CheckCircle2 className="h-3 w-3" />
                        Active
                      </>
                    ) : (
                      "Inactive"
                    )}
                  </span>

                  <Switch
                    checked={config.isActive}
                    onCheckedChange={(checked) => handleToggleActive(item.id, checked)}
                  />

                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded-lg text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
                    onClick={() => toggleExpand(item.id)}
                  >
                    {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              {/* Card Body (Config fields) */}
              <AnimatePresence initial={false}>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                    className="border-t border-slate-100 dark:border-slate-800"
                  >
                    <div className="p-6 space-y-4">
                      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                        {item.fields.map((field) => {
                          const isPasswordField = field.type === "password";
                          const isRevealed = !!showPassword[`${item.id}_${field.key}`];

                          return (
                            <div key={field.key} className="space-y-1.5">
                              <label className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                                {field.label}
                              </label>
                              <div className="relative">
                                <input
                                  type={isPasswordField && !isRevealed ? "password" : "text"}
                                  value={config[field.key] || ""}
                                  onChange={(e) => handleInputChange(item.id, field.key, e.target.value)}
                                  placeholder={field.placeholder}
                                  className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3.5 pr-10 text-sm font-medium text-slate-900 outline-none ring-indigo-500/30 placeholder:text-slate-400 focus:ring-2 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
                                />
                                {isPasswordField && (
                                  <button
                                    type="button"
                                    onClick={() => togglePasswordReveal(`${item.id}_${field.key}`)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                                  >
                                    {isRevealed ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      <div className="flex justify-end pt-2">
                        <Button
                          type="button"
                          disabled={isSaving}
                          onClick={() => handleSaveIntegration(item.id)}
                          className={`rounded-xl px-5 font-bold text-white shadow-lg border-none transition-transform hover:scale-[1.02] ${item.accentBg}`}
                        >
                          <Save className="mr-2 h-4 w-4" />
                          Save Config
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>
    </HubSubpageShell>
  );
};

export default ViewIntegrations;
