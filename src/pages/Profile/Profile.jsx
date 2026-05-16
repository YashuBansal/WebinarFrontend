import React from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { UserCircle2, Sparkles } from "lucide-react";
import HubSubpageShell from "../../components/Layout/HubSubpageShell";
import { ProfileSettings } from "../Settings/SettingsSections";
import useRoles from "../../hooks/useRoles";
import useUserSubscription from "../../hooks/useUserSubscription";
import { useTheme } from "../../contexts/ThemeContext";

const ProfilePage = () => {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const roles = useRoles();
  const { userData } = useSelector((state) => state.auth);
  const { data: subscription } = useUserSubscription();

  return (
    <HubSubpageShell
      backTo="/settings"
      backLabel="Back to settings"
      maxWidthClass="max-w-6xl"
    >
      <motion.header
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        className="mb-8 flex flex-col gap-4 sm:mb-10 lg:flex-row lg:items-start lg:justify-between"
      >
        <div className="flex min-w-0 flex-1 items-start gap-4">
          <motion.div
            aria-hidden
            className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-indigo-500/10 dark:bg-indigo-500/15"
            initial={{ scale: 0.85, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 380, damping: 22, delay: 0.05 }}
          >
            <UserCircle2 className="h-7 w-7 text-indigo-500 dark:text-indigo-400" />
          </motion.div>
          <div className="min-w-0 space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-slate-50 sm:text-3xl">
                Profile
              </h1>
              <Sparkles className="hidden h-5 w-5 text-amber-400 sm:inline sm:h-6 sm:w-6" aria-hidden />
            </div>
            <p className="max-w-xl text-sm font-medium leading-relaxed text-slate-500 dark:text-slate-400">
              View and manage your personal information, security settings, and subscription details.
            </p>
          </div>
        </div>
      </motion.header>

      <ProfileSettings
        theme={theme}
        navigate={navigate}
        userData={userData}
        roles={roles}
        subscription={subscription}
      />
    </HubSubpageShell>
  );
};

export default ProfilePage;
