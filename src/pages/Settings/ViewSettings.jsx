import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
} from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
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

  const [activeSection, setActiveSection] = useState(null);

  const currentSection = useMemo(() => {
    if (activeSection && sections.some((s) => s.id === activeSection))
      return activeSection;
    if (isDesktop && sections.length) return sections[0].id;
    return null;
  }, [activeSection, sections, isDesktop]);

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
      if (id === "profile") {
        setActiveSection(id);
        logSectionOpen(id);
        return;
      }
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
    if (sectionId === "profile") {
      return (
        <ProfileSettings
          theme={theme}
          navigate={navigate}
          userData={userData}
        />
      );
    }
    return null;
  };

  const activeMeta = sections.find((s) => s.id === currentSection);

  return (
    <div
      className="flex min-h-[calc(100vh-4rem)] flex-col overflow-hidden md:h-[calc(100vh-4rem)] md:max-h-[calc(100vh-4rem)] md:flex-row"
      style={{ backgroundColor: theme === "dark" ? "#0f172a" : "#F2F4F6" }}
    >
      <div
        className={`${currentSection && !isDesktop ? "hidden" : "flex"} h-full w-full flex-shrink-0 flex-col border-r md:w-72`}
        style={{
          backgroundColor:
            theme === "dark" ? "rgba(30, 41, 59, 0.5)" : "#ffffff",
          borderColor: theme === "dark" ? "#334155" : "#e2e8f0",
        }}
      >
        <div
          className="border-b p-6"
          style={{ borderColor: theme === "dark" ? "#334155" : "#e2e8f0" }}
        >
          <h2
            className="text-xl font-bold tracking-tight"
            style={{ color: theme === "dark" ? "#f8fafc" : "#071028" }}
          >
            Settings
          </h2>
          <p className="mt-1 text-xs font-medium text-gray-500">
            Manage your hub preferences
          </p>
        </div>

        <nav className="custom-scrollbar flex-1 space-y-1 overflow-y-auto p-3">
          {sections.map((section) => {
            const Icon = section.icon;
            const isActive = currentSection === section.id;
            return (
              <button
                key={section.id}
                type="button"
                onClick={() => handleSelectSection(section.id)}
                className={`group relative flex w-full items-center gap-3 rounded-xl px-4 py-3 transition-all duration-200 ${
                  isActive
                    ? theme === "dark"
                      ? "bg-blue-500/10 text-blue-400"
                      : "bg-blue-50 text-blue-600"
                    : theme === "dark"
                      ? "text-gray-400 hover:bg-white/5"
                      : "text-gray-600 hover:bg-gray-50"
                }`}
              >
                {isActive && isDesktop && (
                  <motion.div
                    layoutId="settings-active-pill"
                    className="absolute left-0 h-6 w-1 rounded-r-full bg-blue-500"
                  />
                )}
                <Icon
                  className={`h-4 w-4 ${isActive ? "text-blue-500" : "text-gray-400 group-hover:text-gray-300"}`}
                />
                <div className="min-w-0 flex-1 text-left">
                  <div className="text-sm font-semibold">{section.label}</div>
                  {!isDesktop && (
                    <div className="text-[10px] font-medium text-gray-500">
                      {section.description}
                    </div>
                  )}
                </div>
                <ChevronRight
                  className={`ml-auto h-3.5 w-3.5 transition-opacity ${isActive ? "opacity-100" : "opacity-30 group-hover:opacity-100"}`}
                />
              </button>
            );
          })}
        </nav>
      </div>

      <div
        className={`${!currentSection && !isDesktop ? "hidden" : "flex"} min-h-0 flex-1 flex-col overflow-hidden`}
      >
        {!isDesktop && currentSection && (
          <div
            className="sticky top-0 z-10 flex items-center gap-3 border-b bg-white p-4 dark:bg-slate-900"
            style={{ borderColor: theme === "dark" ? "#334155" : "#e2e8f0" }}
          >
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-9 w-9 rounded-full"
              onClick={() => setActiveSection(null)}
            >
              <ChevronRight className="h-5 w-5 rotate-180" />
            </Button>
            <div>
              <h3
                className="text-sm font-bold leading-none"
                style={{ color: theme === "dark" ? "#f8fafc" : "#071028" }}
              >
                {activeMeta?.label}
              </h3>
              <p className="mt-1 text-[10px] font-medium text-gray-500">
                Settings Overview
              </p>
            </div>
          </div>
        )}

        <div className="custom-scrollbar min-h-0 flex-1 overflow-y-auto">
          <AnimatePresence mode="wait">
            {currentSection && (
              <motion.div
                key={currentSection}
                initial={{
                  opacity: 0,
                  x: isDesktop ? 0 : 20,
                  y: isDesktop ? 10 : 0,
                }}
                animate={{ opacity: 1, x: 0, y: 0 }}
                exit={{
                  opacity: 0,
                  x: isDesktop ? 0 : -20,
                  y: isDesktop ? -10 : 0,
                }}
                transition={{ duration: 0.2 }}
                className="mx-auto w-full max-w-5xl p-4 sm:p-8"
              >
                <div className="mb-6 hidden sm:mb-8 sm:block">
                  <h1
                    className="mb-2 text-2xl font-black tracking-tight sm:text-3xl"
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
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default ViewSettings;
