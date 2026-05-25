import {
  effectiveLimit,
  formatDateDisplay,
} from "./subscriptionStatusUtils";

const numericCell =
  "py-3 px-3 text-sm tabular-nums text-right align-middle whitespace-nowrap";
const numericCellStrong = `${numericCell} font-semibold text-gray-900`;
const numericCellMuted = `${numericCell} text-gray-600`;
const numericCellMutedLast =
  "py-3 pl-3 pr-5 text-sm tabular-nums text-right align-middle whitespace-nowrap text-gray-600";

function Row({ label, base, addon, effective, usageDisplay }) {
  const baseNum = typeof base === "number" ? base : 0;
  const addonNum = typeof addon === "number" ? addon : 0;
  const eff = effective != null ? effective : effectiveLimit(base, addon);

  return (
    <tr className="border-b border-gray-100 last:border-0">
      <th
        scope="row"
        className="py-3 pl-5 pr-3 text-left text-sm font-medium text-gray-900 align-middle"
      >
        {label}
      </th>
      <td className={numericCellMuted}>{baseNum}</td>
      <td className={numericCellMuted}>{addonNum}</td>
      <td className={numericCellStrong}>{eff}</td>
      <td className={numericCellMutedLast}>{usageDisplay ?? "—"}</td>
    </tr>
  );
}

/**
 * @param {{ subscription: Record<string, unknown> }} props
 */
export default function SubscriptionEntitlementsTable({ subscription }) {
  if (!subscription) return null;

  const s = subscription;
  const contactEff = effectiveLimit(s.contactLimit, s.contactLimitAddon);
  const contactUsage =
    typeof s.contactCount === "number" ? s.contactCount : null;
  const contactUsageDisplay =
    contactUsage != null ? `${contactUsage} / ${contactEff}` : null;

  const rows = [
    {
      key: "contacts",
      label: "Contacts",
      base: s.contactLimit,
      addon: s.contactLimitAddon,
      effective: contactEff,
      usageDisplay: contactUsageDisplay,
    },
    {
      key: "employees",
      label: "Employees",
      base: s.employeeLimit,
      addon: s.employeeLimitAddon,
      usageDisplay: null,
    },
    {
      key: "toggles",
      label: "Toggles",
      base: s.toggleLimit,
      addon: 0,
      usageDisplay: null,
    },
    {
      key: "webinars",
      label: "Webinars",
      base: s.webinarLimit,
      addon: s.webinarLimitAddon,
      usageDisplay: null,
    },
    {
      key: "whatsapp",
      label: "WhatsApp projects",
      base: s.whatsappProjectLimit,
      addon: s.whatsappProjectLimitAddon,
      usageDisplay: null,
    },
    {
      key: "zoom",
      label: "Zoom projects",
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
      className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden"
      aria-labelledby="entitlements-heading"
    >
      <div className="border-b border-gray-100 px-5 py-4 bg-gray-50/80">
        <h3
          id="entitlements-heading"
          className="text-lg font-semibold text-gray-900"
        >
          Limits and usage
        </h3>
        <p className="text-sm text-gray-500 mt-0.5">
          Base allocation from your plan plus purchased add-ons. Subscription
          record updated {updated}.
        </p>
      </div>

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
            <tr className="border-b border-gray-200 bg-white">
              <th
                scope="col"
                className="py-3 pl-5 pr-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 align-bottom"
              >
                Metric
              </th>
              <th
                scope="col"
                className="py-3 px-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500 align-bottom"
              >
                Base
              </th>
              <th
                scope="col"
                className="py-3 px-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500 align-bottom"
              >
                Add-on
              </th>
              <th
                scope="col"
                className="py-3 px-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500 align-bottom"
              >
                Effective
              </th>
              <th
                scope="col"
                className="py-3 pl-3 pr-5 text-right text-xs font-semibold uppercase tracking-wide text-gray-500 align-bottom"
              >
                Usage
              </th>
            </tr>
          </thead>
          <tbody>
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

      <ul className="md:hidden divide-y divide-gray-100">
        {rows.map((r) => {
          const eff =
            r.effective != null
              ? r.effective
              : effectiveLimit(r.base, r.addon);
          return (
            <li key={r.key} className="px-5 py-4">
              <div className="font-medium text-gray-900">{r.label}</div>
              <dl className="mt-2 grid grid-cols-[1fr_auto] gap-x-6 gap-y-1.5 text-sm items-baseline">
                <dt className="text-gray-500">Base</dt>
                <dd className="min-w-[3rem] text-right tabular-nums text-gray-800">
                  {typeof r.base === "number" ? r.base : 0}
                </dd>
                <dt className="text-gray-500">Add-on</dt>
                <dd className="min-w-[3rem] text-right tabular-nums text-gray-800">
                  {typeof r.addon === "number" ? r.addon : 0}
                </dd>
                <dt className="text-gray-500">Effective</dt>
                <dd className="min-w-[3rem] text-right font-semibold tabular-nums text-gray-900">
                  {eff}
                </dd>
                {r.usageDisplay && (
                  <>
                    <dt className="text-gray-500">Usage</dt>
                    <dd className="min-w-[3rem] text-right tabular-nums text-gray-800">
                      {r.usageDisplay}
                    </dd>
                  </>
                )}
              </dl>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
