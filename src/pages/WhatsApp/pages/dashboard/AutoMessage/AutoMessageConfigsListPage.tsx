import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Plus, MessageSquare } from "lucide-react";
import AutoMessageConfigsList from "./AutoMessageConfigsList";

export default function AutoMessageConfigsListPage() {
  const { projectId } = useParams<{ projectId: string }>();

  return (
    <div className="min-h-full w-full min-w-0 max-w-full box-border p-2 transition-colors duration-500 sm:p-2 md:p-0 lg:p-0 xl:p-2 2xl:p-4">
      {/* Premium Header */}
      <motion.div
        className="mb-6 rounded-2xl border border-slate-200/60 p-4 sm:p-5 bg-white dark:bg-slate-800/50 shadow-sm dark:border-slate-700/50"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-green-600 dark:text-green-400 font-bold text-xs uppercase tracking-widest mb-1">
              <MessageSquare className="h-3.5 w-3.5" />
              Automations
            </div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-2xl">
              Auto Message Configurations
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-xs font-medium">
              Manage automatic WhatsApp messages for <span className="text-slate-900 dark:text-white font-bold">Webinar Registrations</span>
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link to={`/whatsapp/dashboard/${projectId}/auto-message/create`}>
              <Button
                className="h-11 px-6 rounded-xl flex items-center gap-2 font-bold text-sm shadow-lg shadow-green-600/20 bg-[#22B573] hover:bg-[#1da467] text-white transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">Create Configuration</span>
                <span className="sm:hidden">Create</span>
              </Button>
            </Link>
          </div>
        </div>
      </motion.div>

      <main className="container mx-auto pb-12">
        <AutoMessageConfigsList />
      </main>
    </div>
  );
}


