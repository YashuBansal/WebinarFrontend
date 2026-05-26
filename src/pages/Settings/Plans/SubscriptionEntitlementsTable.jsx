import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ChevronUp } from "lucide-react";
import {
  effectiveLimit,
  formatDateDisplay,
} from "./subscriptionStatusUtils";

const numericCell =
  "py-4 px-4 text-sm tabular-nums text-right align-middle whitespace-nowrap font-medium text-slate-650 dark:text-slate-400";

function Row({ label, base, addon, effective, usageDisplay }) {
  const baseNum = typeof base === "number" ? base : 0;
  const addonNum = typeof addon === "number" ? addon : 0;
  const eff = effective != null ? effective : effectiveLimit(base, addon);

  return (
    <tr className="border-b border-slate-100 dark:border-slate-800/80 last:border-0 hover:bg-slate-50/40 dark:hover:bg-slate-900/20 transition-all duration-200">
      <th
        scope="row"
        className="py-4 pl-6 pr-3 text-left text-sm font-bold text-slate-800 dark:text-slate-200 align-middle"
      >
        {label}
      </th>
      <td className={numericCell}>{baseNum.toLocaleString()}</td>
      <td className={numericCell}>{addonNum.toLocaleString()}</td>
      <td className="py-4 px-4 text-right align-middle whitespace-nowrap">
        <span className="inline-flex items-center rounded-lg bg-blue-50 px-2.5 py-1 text-xs font-extrabold text-blue-700 ring-1 ring-inset ring-blue-600/10 dark:bg-blue-950/40 dark:text-blue-300 dark:ring-blue-500/20">
          {eff === 999999 ? "Unlimited" : eff.toLocaleString()}
        </span>
      </td>
      <td className="py-4 pl-4 pr-6 text-sm tabular-nums text-right align-middle whitespace-nowrap font-bold text-indigo-600 dark:text-indigo-400">
        {usageDisplay ?? "—"}
      </td>
    </tr>
  );
}

/**
 * @param {{ subscription: Record<string, unknown> }} props
 */
export default function SubscriptionEntitlementsTable({ subscription }) {
  const [isOpen, setIsOpen] = useState(false);

  if (!subscription) return null;

  const s = subscription;
  const contactEff = effectiveLimit(s.contactLimit, s.contactLimitAddon);
  const contactUsage =
    typeof s.contactCount === "number" ? s.contactCount : null;
  const contactUsageDisplay =
    contactUsage != null ? `${contactUsage.toLocaleString()} / ${contactEff === 999999 ? "Unlimited" : contactEff.toLocaleString()}` : null;

  const rows = [
    {
      key: "contacts",
      label: "Contacts Limit",
      base: s.contactLimit,
      addon: s.contactLimitAddon,
      effective: contactEff,
      usageDisplay: contactUsageDisplay,
    },
    {
      key: "employees",
      label: "Employees Limit",
      base: s.employeeLimit,
      addon: s.employeeLimitAddon,
      usageDisplay: null,
    },
    {
      key: "toggles",
      label: "Toggle Limit",
      base: s.toggleLimit,
      addon: 0,
      usageDisplay: null,
    },
    {
      key: "webinars",
      label: "Webinars Limit",
      base: s.webinarLimit,
      addon: s.webinarLimitAddon,
      usageDisplay: null,
    },
    {
      key: "whatsapp",
      label: "WhatsApp Projects",
      base: s.whatsappProjectLimit,
      addon: s.whatsappProjectLimitAddon,
      usageDisplay: null,
    },
    {
      key: "zoom",
      label: "Zoom Projects",
      base: s.zoomProjectLimit,
      addon: s.zoomProjectLimitAddon,
      usageDisplay: null,
    },
  ];

  const updated =
    formatDateDisplay(s.updatedAt ?? s.updated_at) !== "—"
      ? formatDateDisplay(s.updatedAt ?? s.updated_at)
      : "—";

  return (
    <section
      className="overflow-hidden rounded-3xl border border-slate-200 bg-white/70 shadow-sm backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/60"
      aria-labelledby="entitlements-heading"
    >
      <div
        className="border-b border-slate-100 dark:border-slate-800 px-6 py-5 bg-gradient-to-r from-slate-50/50 to-white/10 flex items-center justify-between cursor-pointer select-none"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="min-w-0">
          <h3
            id="entitlements-heading"
            className="text-lg font-black text-slate-900 dark:text-slate-550 tracking-tight"
          >
            Limits and usage
          </h3>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
            Base allocation from your active plan plus purchased add-ons. Last sync on {updated}.
          </p>
        </div>
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 hover:bg-slate-200/80 dark:bg-slate-800 dark:hover:bg-slate-700/80 text-slate-500 dark:text-slate-400 transition-colors">
          {isOpen ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
        </div>
      </div>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full min-w-[560px] table-fixed border-collapse text-left">
                <colgroup>
                  <col className="min-w-0 w-[38%]" />
                  <col className="w-[15.5%]" />
                  <col className="w-[15.5%]" />
                  <col className="w-[15.5%]" />
                  <col className="w-[15.5%]" />
                </colgroup>
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-900/10">
                    <th
                      scope="col"
                      className="py-3.5 pl-6 pr-3 text-left text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500"
                    >
                      Metric
                    </th>
                    <th
                      scope="col"
                      className="py-3.5 px-4 text-right text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500"
                    >
                      Base
                    </th>
                    <th
                      scope="col"
                      className="py-3.5 px-4 text-right text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500"
                    >
                      Add-on
                    </th>
                    <th
                      scope="col"
                      className="py-3.5 px-4 text-right text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500"
                    >
                      Effective
                    </th>
                    <th
                      scope="col"
                      className="py-3.5 pl-4 pr-6 text-right text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500"
                    >
                      Usage
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100/50 dark:divide-slate-800/80">
                  {rows.map((r) => (
                    <Row
                      key={r.key}
                      label={r.label}
                      base={r.base}
                      addon={r.addon}
                      effective={r.effective}
                      usageDisplay={r.usageDisplay}
                    />
                  ))}
                </tbody>
              </table>
            </div>

            <ul className="md:hidden divide-y divide-slate-100 dark:divide-slate-800">
              {rows.map((r) => {
                const eff =
                  r.effective != null
                    ? r.effective
                    : effectiveLimit(r.base, r.addon);
                return (
                  <li key={r.key} className="px-6 py-5">
                    <div className="font-bold text-slate-800 dark:text-slate-100 text-base">{r.label}</div>
                    <dl className="mt-3.5 grid grid-cols-[1fr_auto] gap-x-6 gap-y-2 text-sm items-baseline">
                      <dt className="text-slate-500 dark:text-slate-400 font-medium">Base Allocation</dt>
                      <dd className="min-w-[3rem] text-right tabular-nums font-semibold text-slate-700 dark:text-slate-300">
                        {typeof r.base === "number" ? r.base.toLocaleString() : 0}
                      </dd>
                      <dt className="text-slate-500 dark:text-slate-400 font-medium">Purchased Add-on</dt>
                      <dd className="min-w-[3rem] text-right tabular-nums font-semibold text-slate-700 dark:text-slate-300">
                        {typeof r.addon === "number" ? r.addon.toLocaleString() : 0}
                      </dd>
                      <dt className="text-slate-500 dark:text-slate-400 font-medium">Effective Limit</dt>
                      <dd className="min-w-[3rem] text-right">
                        <span className="inline-flex items-center rounded-lg bg-blue-50 px-2 py-0.5 text-xs font-black text-blue-700 ring-1 ring-inset ring-blue-600/10 dark:bg-blue-950/40 dark:text-blue-300 dark:ring-blue-500/20">
                          {eff === 999999 ? "Unlimited" : eff.toLocaleString()}
                        </span>
                      </dd>
                      {r.usageDisplay && (
                        <>
                          <dt className="text-slate-500 dark:text-slate-400 font-medium">Current Usage</dt>
                          <dd className="min-w-[3rem] text-right tabular-nums font-extrabold text-indigo-600 dark:text-indigo-400">
                            {r.usageDisplay}
                          </dd>
                        </>
                      )}
                    </dl>
                  </li>
                );
              })}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
