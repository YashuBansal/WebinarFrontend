import React from 'react';
import { motion } from "framer-motion";
import { 
  CreditCard, 
  Users, 
  UserPlus, 
  Presentation, 
  MessageSquare, 
  Video, 
  Calendar, 
  RefreshCcw,
  Zap,
  CheckCircle2,
  Clock
} from "lucide-react";
import ComponentGuard from '../../components/AccessControl/ComponentGuard';
import { formatDateAsNumber } from '../../utils/extra';

const SubscriptionDetails = ({ roles, subscription, usedContacts }) => {
  const contactBase = subscription?.contactLimit || 0;
  const contactAddon = subscription?.contactLimitAddon || 0;
  const effectiveContact = contactBase + contactAddon;

  const employeeBase = subscription?.employeeLimit || 0;
  const employeeAddon = subscription?.employeeLimitAddon || 0;
  const effectiveEmployee = employeeBase + employeeAddon;

  const webinarBase = subscription?.webinarLimit || 0;
  const webinarAddon = subscription?.webinarLimitAddon || 0;
  const effectiveWebinar = webinarBase + webinarAddon;

  const whatsappBase = subscription?.whatsappProjectLimit || 0;
  const whatsappAddon = subscription?.whatsappProjectLimitAddon || 0;
  const effectiveWhatsapp = whatsappBase + whatsappAddon;

  const zoomBase = subscription?.zoomProjectLimit || 0;
  const zoomAddon = subscription?.zoomProjectLimitAddon || 0;
  const effectiveZoom = zoomBase + zoomAddon;

  const metrics = [
    { label: "Contact Uploads", value: effectiveContact, used: usedContacts, Icon: UserPlus, color: "blue" },
    { label: "Employees", value: effectiveEmployee, Icon: Users, color: "indigo" },
    { label: "Webinars", value: effectiveWebinar, Icon: Presentation, color: "violet" },
    { label: "WhatsApp Projects", value: effectiveWhatsapp, Icon: MessageSquare, color: "emerald" },
    { label: "Zoom Projects", value: effectiveZoom, Icon: Video, color: "sky" },
    { label: "Toggle Limit", value: subscription?.toggleLimit || 0, Icon: RefreshCcw, color: "amber" },
  ];

  return (
    <ComponentGuard allowedRoles={[roles.ADMIN]}>
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800/90">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 dark:border-slate-700/80">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10">
              <Zap className="h-6 w-6 text-blue-500" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-50">Active Subscription</h2>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Current plan details and usage limits</p>
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-full bg-emerald-500/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400">
            <CheckCircle2 className="h-3 w-3" />
            Active
          </div>
        </div>

        <div className="p-6">
          <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-3">
            <div className="col-span-1 rounded-2xl bg-slate-50 p-5 dark:bg-slate-900/50 md:col-span-2">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="space-y-1">
                  <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Current Plan</p>
                  <h3 className="text-2xl font-black text-slate-900 dark:text-slate-50">{subscription?.plan?.name || "N/A"}</h3>
                </div>
                <div className="flex flex-col gap-2 sm:text-right">
                  <div className="flex items-center gap-2 sm:justify-end">
                    <Calendar className="h-4 w-4 text-slate-400" />
                    <p className="text-sm font-bold text-slate-600 dark:text-slate-300">
                      Started: <span className="text-slate-900 dark:text-slate-100">{formatDateAsNumber(subscription?.startDate)}</span>
                    </p>
                  </div>
                  <div className="flex items-center gap-2 sm:justify-end text-rose-500">
                    <Clock className="h-4 w-4" />
                    <p className="text-sm font-bold">
                      Expires: <span className="underline underline-offset-4">{formatDateAsNumber(subscription?.expiryDate)}</span>
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex flex-col justify-center rounded-2xl border border-blue-100 bg-blue-50/30 p-5 dark:border-blue-900/30 dark:bg-blue-900/10">
              <p className="mb-1 text-xs font-bold uppercase tracking-widest text-blue-500/70">Usage Health</p>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-black text-blue-600">Perfect</span>
              </div>
              <p className="mt-1 text-[10px] font-medium text-blue-500/80">All systems operational within limits</p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {metrics.map((metric, i) => (
              <MetricCard key={i} {...metric} />
            ))}
          </div>
        </div>
      </div>
    </ComponentGuard>
  );
};

const MetricCard = ({ label, value, used, Icon, color }) => {
  const colorMap = {
    blue: "text-blue-500 bg-blue-500/10",
    indigo: "text-indigo-500 bg-indigo-500/10",
    violet: "text-violet-500 bg-violet-500/10",
    emerald: "text-emerald-500 bg-emerald-500/10",
    sky: "text-sky-500 bg-sky-500/10",
    amber: "text-amber-500 bg-amber-500/10",
  };

  const percentage = used != null ? Math.min((used / value) * 100, 100) : null;

  return (
    <div className="group rounded-xl border border-slate-100 bg-white p-4 transition-all hover:border-slate-200 hover:shadow-sm dark:border-slate-700/50 dark:bg-slate-900/40">
      <div className="mb-3 flex items-center justify-between">
        <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${colorMap[color]}`}>
          <Icon className="h-5 w-5" />
        </div>
        {percentage != null && (
          <span className={`text-[10px] font-bold uppercase ${percentage > 90 ? 'text-rose-500' : 'text-slate-400'}`}>
            {used} / {value}
          </span>
        )}
      </div>
      <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">{label}</p>
      <p className="text-xl font-black text-slate-800 dark:text-slate-100">{value}</p>
      
      {percentage != null && (
        <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${percentage}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
            className={`h-full rounded-full ${percentage > 90 ? 'bg-rose-500' : 'bg-blue-500'}`}
          />
        </div>
      )}
    </div>
  );
};

export default SubscriptionDetails;
