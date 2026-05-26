import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
} from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Zap,
  Package,
  Tag,
  History,
  Key,
  Settings,
  Users,
  Layers,
  Table,
  ChevronRight,
  MapPin,
  PanelRight,
  FileImage,
  UserCircle2,
  Cloud,
} from "lucide-react";
import { Button } from "../../components/ui/button";
import { clearOTPGenerated } from "../../features/slices/auth";
import useAddUserActivity from "../../hooks/useAddUserActivity";
import useMediaQuery from "../../hooks/useMediaQuery";
import useRoles from "../../hooks/useRoles";
import useUserSubscription from "../../hooks/useUserSubscription";
import { ProfileSettings } from "./SettingsSections";

function subscribeHtmlClass(onStoreChange) {
  const root = document.documentElement;
  const mo = new MutationObserver(() => onStoreChange());
  mo.observe(root, { attributes: true, attributeFilter: ["class"] });
  return () => mo.disconnect();
}

function getSnapshotIsDark() {
  return document.documentElement.classList.contains("dark");
}

function getServerSnapshotIsDark() {
  return false;
}

const ViewSettings = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const roles = useRoles();
  const logUserActivity = useAddUserActivity();
  const { isSuccess, userData } = useSelector((state) => state.auth);
  const { data: subscription } = useUserSubscription();
  const tableConfig = subscription?.plan?.attendeeTableConfig || {};
  const isCustomStatusEnabled = Boolean(tableConfig?.isCustomOptionsAllowed);

  const isDesktop = useMediaQuery("(min-width: 768px)");
  const hubIsDark = useSyncExternalStore(
    subscribeHtmlClass,
    getSnapshotIsDark,
    getServerSnapshotIsDark,
  );
  const theme = hubIsDark ? "dark" : "light";

  const userRole = userData?.role;

  const sections = useMemo(() => {
    const role = userRole;
    const isSuper = roles.isSuperAdmin();
    const can = (allowed) => !allowed?.length || allowed.includes(role);

    const list = [];

    const add = (item) => {
      if (item.conditions?.includes(false)) return;
      if (!can(item.allowedRoles)) return;
      list.push(item);
    };

    add({
      id: "profile",
      label: "Profile",
      icon: UserCircle2,
      description: "Photo, name, email, and security",
      allowedRoles: [],
      path: "/profile",
    });
    add({
      id: "plans",
      label: "Plans",
      icon: Zap,
      description: "Manage your subscription and usage limits",
      allowedRoles: [roles.SUPER_ADMIN, roles.ADMIN],
      path: "/plans",
    });
    add({
      id: "addons",
      label: isSuper ? "Manage Addons" : "Buy Addons",
      icon: Package,
      description: isSuper
        ? "Configure purchased features and capacity"
        : "Purchase additional features and capacity",
      allowedRoles: [roles.SUPER_ADMIN, roles.ADMIN],
      path: isSuper ? "/addons" : "/addons/buy",
    });
    add({
      id: "tags",
      label: "Tags",
      icon: Tag,
      description: "Configure global lead and product tags",
      allowedRoles: [roles.ADMIN],
      path: "/tags",
    });
    add({
      id: "billing",
      label: "Billing History",
      icon: History,
      description: "View and download your past invoices",
      allowedRoles: [roles.ADMIN],
      path: "/billing-history",
    });
    add({
      id: "api",
      label: "External API Token",
      icon: Key,
      description: "Generate tokens for API integrations",
      allowedRoles: [roles.SUPER_ADMIN, roles.ADMIN],
      path: "/api-docs",
    });
    add({
      id: "custom",
      label: `${isSuper ? "Default" : "Custom"} Options`,
      icon: Settings,
      description: "Personalize your hub experience",
      allowedRoles: [roles.SUPER_ADMIN, roles.ADMIN],
      conditions: [isCustomStatusEnabled || isSuper],
      path: "/settings/custom-status",
    });
    add({
      id: "integrations",
      label: "Integrations",
      icon: Cloud,
      description: "Manage ConvertKit, AWeber, ActiveCampaign, Pabbly Emails, and Interest Pool",
      allowedRoles: [roles.SUPER_ADMIN, roles.ADMIN],
      path: "/settings/integrations",
    });
    add({
      id: "leads",
      label: "Lead Types",
      icon: Users,
      description: "Define and categorize your lead segments",
      allowedRoles: [roles.ADMIN],
      path: "/lead-type",
    });
    add({
      id: "levels",
      label: "Product Level",
      icon: Layers,
      description: "Configure hierarchy levels for products",
      allowedRoles: [roles.ADMIN],
      path: "/product-level",
    });
    add({
      id: "masked",
      label: "Masked Tables",
      icon: Table,
      description: "Control data visibility and privacy",
      allowedRoles: [],
      path: "/maskedtables",
    });
    add({
      id: "locations",
      label: "Locations",
      icon: MapPin,
      description: "Manage webinar and hub locations",
      allowedRoles: [roles.SUPER_ADMIN],
      path: "/locations",
    });
    add({
      id: "sidebar",
      label: "Sidebar Links",
      icon: PanelRight,
      description: "Customize navigation links in the sidebar",
      allowedRoles: [roles.SUPER_ADMIN],
      path: "/sidebarLinks",
    });
    add({
      id: "landing",
      label: "Landing Page",
      icon: FileImage,
      description: "Edit your public landing experience",
      allowedRoles: [roles.SUPER_ADMIN],
      path: "/update-landing-page",
    });

    return list;
  }, [userRole, roles, isCustomStatusEnabled]);

  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get("tab");

  const currentSection = useMemo(() => {
    if (tabParam && sections.some((s) => s.id === tabParam))
      return tabParam;
    return null;
  }, [tabParam, sections]);

  const setActiveSection = (id) => {
    if (id) {
      setSearchParams({ tab: id });
    } else {
      setSearchParams({});
    }
  };

  const logSectionOpen = useCallback(
    (id) => {
      logUserActivity({
        action: "navigate",
        detailItem: `/settings#${id}`,
        navigateType: "settings section",
      });
    },
    [logUserActivity],
  );

  const handleSelectSection = useCallback(
    (id) => {
      const target = sections.find((s) => s.id === id);
      if (target?.path) {
        logUserActivity({
          action: "navigate",
          detailItem: target.path,
          navigateType: "page",
        });
        navigate(target.path);
      }
    },
    [sections, logUserActivity, navigate, logSectionOpen],
  );

  useEffect(() => {
    if (isSuccess) {
      dispatch(clearOTPGenerated());
    }
  }, [isSuccess, dispatch]);

  const renderSectionContent = (sectionId) => {
    return null;
  };

  const activeMeta = sections.find((s) => s.id === currentSection);

  return (
    <div
      className="flex min-h-[calc(100vh-4rem)] flex-col overflow-hidden"
      style={{ backgroundColor: theme === "dark" ? "#0f172a" : "#F2F4F6" }}
    >
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        {currentSection && (
          <div
            className="sticky top-0 z-10 flex items-center gap-4 border-b p-4 sm:px-10 sm:py-6"
            style={{ 
              backgroundColor: theme === "dark" ? "rgba(15, 23, 42, 0.8)" : "rgba(255, 255, 255, 0.8)",
              borderColor: theme === "dark" ? "#334155" : "#e2e8f0",
              backdropFilter: "blur(12px)"
            }}
          >
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-10 w-10 rounded-xl bg-white/5 shadow-sm transition-all hover:bg-white/10 dark:bg-slate-800/50"
              onClick={() => setActiveSection(null)}
            >
              <ChevronRight className="h-5 w-5 rotate-180" />
            </Button>
            <div>
              <h3
                className="text-lg font-black leading-none tracking-tight"
                style={{ color: theme === "dark" ? "#f8fafc" : "#071028" }}
              >
                {activeMeta?.label}
              </h3>
              <p className="mt-1 text-xs font-medium text-gray-500">
                Settings / {activeMeta?.label}
              </p>
            </div>
          </div>
        )}

        <div className="custom-scrollbar min-h-0 flex-1 overflow-y-auto">
          <AnimatePresence mode="wait">
            {currentSection ? (
              <motion.div
                key={currentSection}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{
                  duration: 0.5,
                  ease: [0.22, 1, 0.36, 1],
                }}
                className="mx-auto w-full max-w-[1400px] p-4 sm:p-8"
              >
                <div className="mb-6 hidden sm:mb-8 sm:block px-2">
                  <h1
                    className="mb-1 text-2xl font-bold tracking-tight"
                    style={{ color: theme === "dark" ? "#f8fafc" : "#071028" }}
                  >
                    {activeMeta?.label}
                  </h1>
                  <p className="text-sm font-medium text-gray-500 sm:text-base">
                    {activeMeta?.description}
                  </p>
                </div>

                {renderSectionContent(currentSection)}
              </motion.div>
            ) : (
              <motion.div
                key="overview"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{
                  duration: 0.5,
                  ease: [0.22, 1, 0.36, 1],
                }}
                className="mx-auto w-full max-w-[1400px] p-6 sm:p-10"
              >
                <div className="mb-10">
                  <h1
                    className="text-2xl font-bold tracking-tight sm:text-3xl"
                    style={{ color: theme === "dark" ? "#f8fafc" : "#071028" }}
                  >
                    Settings Overview
                  </h1>
                  <p className="mt-1 text-sm font-medium text-gray-500 sm:text-base">
                    Choose a category below to manage your hub preferences.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                  {sections.map((section) => {
                    const Icon = section.icon;
                    return (
                      <button
                        key={section.id}
                        type="button"
                        onClick={() => handleSelectSection(section.id)}
                        className="group flex flex-col items-start p-6 rounded-2xl border transition-all duration-300 hover:shadow-xl hover:-translate-y-1 text-left"
                        style={{
                          backgroundColor: theme === "dark" ? "#1e293b" : "#ffffff",
                          borderColor: theme === "dark" ? "#334155" : "#e2e8f0",
                        }}
                      >
                        <div className="size-12 rounded-xl bg-blue-500/10 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                          <Icon className="size-6 text-blue-500" />
                        </div>
                        <h3 className="text-lg font-bold mb-2" style={{ color: theme === "dark" ? "#f8fafc" : "#1e293b" }}>
                          {section.label}
                        </h3>
                        <p className="text-sm text-gray-500 line-clamp-2 leading-relaxed">
                          {section.description}
                        </p>
                        <div className="mt-6 flex items-center text-xs font-bold text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity uppercase tracking-widest">
                          Configure <ChevronRight className="size-3.5 ml-1" />
                        </div>
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default ViewSettings;
