import { motion } from "framer-motion";
import { Sparkles, Table2 } from "lucide-react";
import HubSubpageShell from "../../components/Layout/HubSubpageShell";
import { MaskedTablesSettings } from "./SettingsSections";

const ViewMaskedTables = () => {
  return (
    <HubSubpageShell maxWidthClass="max-w-6xl">
      <motion.header
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        className="mb-8 flex flex-col gap-4 sm:mb-5"
      >
        <div className="flex items-start gap-4">
          <motion.div
            aria-hidden
            className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-blue-500/10 dark:bg-blue-500/15"
            initial={{ scale: 0.85, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{
              type: "spring",
              stiffness: 380,
              damping: 22,
              delay: 0.05,
            }}
          >
            <Table2 className="h-7 w-7 text-blue-500 dark:text-blue-400" />
          </motion.div>
          <div className="min-w-0 space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-slate-50 sm:text-3xl">
                Masked tables
              </h1>
              <Sparkles
                className="hidden h-5 w-5 text-amber-400 sm:inline sm:h-6 sm:w-6"
                aria-hidden
              />
            </div>
            <p className="max-w-xl text-sm font-medium leading-relaxed text-slate-500 dark:text-slate-400">
              Control which attendee lists mask sensitive fields so your team
              sees safer data by default.
            </p>
          </div>
        </div>
      </motion.header>
      <MaskedTablesSettings />
    </HubSubpageShell>
  );
};

export default ViewMaskedTables;
