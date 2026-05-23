import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { motion } from "framer-motion";
import {
  CalendarRange,
  Download,
  Receipt,
  Sparkles,
  Wallet,
} from "lucide-react";
import { getAdminBillingHistory } from "../../../features/actions/pricePlan";
import PageLimitEditor from "../../../components/PageLimitEditor";
import { getSuperAdmin } from "../../../features/actions/auth";
import { toast } from "sonner";
import { formatDateAsNumber } from "../../../utils/extra";
import { maskPiiDisplay } from "../../../utils/maskPii";
import { useNavigate } from "react-router-dom";
import useMediaQuery from "../../../hooks/useMediaQuery";
import { generateInvoicePdf } from "../../../utils/invoicePdf";
import HubSubpageShell from "../../../components/Layout/HubSubpageShell";
import { Button } from "../../../components/ui/button";

/** Compact billing-type chip for the desktop table */
function BillingTypePill({ text }) {
  if (!text || text === "-") {
    return (
      <span className="text-[13px] font-medium text-slate-400 dark:text-slate-500">—</span>
    );
  }
  return (
    <span
      className="inline-block max-w-[168px] truncate rounded-full bg-violet-100 px-2.5 py-1 text-left text-[11px] font-bold uppercase tracking-wide text-violet-800 shadow-sm ring-1 ring-violet-200/60 dark:bg-violet-950/55 dark:text-violet-200 dark:ring-violet-500/25"
      title={text}
    >
      {text}
    </span>
  );
}

/** Pagination bar aligned with `WebinarTableShell` (range + Prev + page nums + Next). */
function BillingTablePagination({ page, setPage, totalPages, limit, rows, totalRecords }) {
  const maxPage = Math.max(1, Number(totalPages) || 1);
  const startIndex = rows.length === 0 ? 0 : (Number(page) - 1) * limit + 1;
  const endIndex = (Number(page) - 1) * limit + rows.length;
  const TR =
    Number(totalRecords) > 0
      ? Number(totalRecords)
      : rows.length > 0 && maxPage <= 1
        ? endIndex
        : 0;

  const totalLabel = TR || endIndex;

  return (
    <div className="flex flex-shrink-0 flex-col gap-4 border-t border-black/[0.05] bg-[#F9FAFB] p-4 dark:border-white/10 dark:bg-slate-900/90 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-4">
        <div className="text-sm text-slate-500 dark:text-slate-400">
          Showing {totalLabel > 0 ? Math.min(startIndex, totalLabel) : startIndex} to{" "}
          {totalLabel > 0 ? Math.min(endIndex, totalLabel) : endIndex} of {totalLabel}{" "}
          {totalLabel === 1 ? "invoice" : "invoices"}
        </div>
        <PageLimitEditor setPage={setPage} pageId="billingHistory" />
      </div>
      <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-end">
        <button
          type="button"
          onClick={() => {
            const nextPage = Math.max(1, Number(page) - 1);
            if (nextPage !== Number(page)) setPage(nextPage);
          }}
          disabled={Number(page) === 1}
          className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-[#0f172a] transition-colors hover:bg-black/5 disabled:opacity-50 dark:border-slate-600 dark:text-slate-100 dark:hover:bg-white/10"
        >
          Previous
        </button>
        <div className="flex items-center gap-1">
          {Array.from({ length: Math.min(5, maxPage) }, (_, i) => {
            let pageNum = i + 1;
            if (maxPage > 5) {
              if (Number(page) > 3) {
                pageNum = Number(page) - 3 + i;
                if (pageNum + (5 - i - 1) > maxPage) {
                  pageNum = maxPage - 4 + i;
                }
              }
            }
            return (
              <button
                type="button"
                key={pageNum}
                onClick={() => setPage(pageNum)}
                className={`flex h-8 w-8 items-center justify-center rounded-lg text-sm transition-colors ${
                  Number(page) === pageNum
                    ? "bg-blue-600 text-white"
                    : "text-[#0f172a] hover:bg-black/5 dark:text-slate-200 dark:hover:bg-white/10"
                }`}
              >
                {pageNum}
              </button>
            );
          })}
        </div>
        <button
          type="button"
          onClick={() => {
            const nextPage = Math.min(maxPage, Number(page) + 1);
            if (nextPage !== Number(page)) setPage(nextPage);
          }}
          disabled={Number(page) === maxPage}
          className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-[#0f172a] transition-colors hover:bg-black/5 disabled:opacity-50 dark:border-slate-600 dark:text-slate-100 dark:hover:bg-white/10"
        >
          Next
        </button>
      </div>
    </div>
  );
}

const BillingHistory = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { billingHistory, totalPages, billingHistoryTotal } = useSelector(
    (state) => state.pricePlans
  );
  const maskBillingHistory = useSelector((state) => state.table.maskBillingHistory);

  const [page, setPage] = useState(1);
  const LIMIT = useSelector(
    (state) => state.pageLimits["billingHistory"] || 10
  );

  useEffect(() => {
    dispatch(getAdminBillingHistory({ page, limit: LIMIT }));
  }, [page, LIMIT, dispatch]);

  useEffect(() => {
    dispatch(getSuperAdmin());
  }, [dispatch]);

  const downloadPDF = async (bill) => {
    await generateInvoicePdf({
      bill,
      billToName: bill?.admin?.companyName || "Company Name",
      onMissingAddress: () => {
        toast.error("Address is required to download the PDF");
        navigate("/profile");
      },
    });
  };

  const isSmallScreen = useMediaQuery("(max-width: 1280px)");
  const rows = Array.isArray(billingHistory) ? billingHistory : [];
  const hasHistory = rows.length > 0;
  const totalRecords = Number(billingHistoryTotal) || 0;
  const showPaginationFooter =
    hasHistory || totalRecords > 0 || (Number(totalPages) || 1) > 1;

  return (
    <HubSubpageShell>
      <motion.header
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        className="mb-8 flex flex-col gap-4 sm:mb-10"
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
            <Receipt className="h-7 w-7 text-blue-500 dark:text-blue-400" />
          </motion.div>
          <div className="min-w-0 space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-slate-50 sm:text-3xl">
                Billing history
              </h1>
              <Sparkles
                className="hidden h-5 w-5 text-amber-400 sm:inline sm:h-6 sm:w-6"
                aria-hidden
              />
            </div>
            <p className="max-w-xl text-sm font-medium leading-relaxed text-slate-500 dark:text-slate-400">
              Every subscription invoice in one place. Download PDFs for your records or accounting — same layout
              as your checkout receipts.
            </p>
          </div>
        </div>
      </motion.header>

      <div className="min-h-[280px] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800/90">
        <div className="p-5 sm:p-6">
        <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
              Invoices
            </h2>
            {hasHistory ? (
              <p className="mt-1 text-sm font-medium text-slate-500 dark:text-slate-400">
                {rows.length} on this page
              </p>
            ) : null}
          </div>
        </div>

        {!hasHistory ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/80 py-16 text-center dark:border-slate-600 dark:bg-slate-900/40 sm:rounded-2xl sm:py-20"
          >
            <Wallet className="mb-3 h-12 w-12 text-slate-300 dark:text-slate-600" />
            <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">
              No billing history yet
            </p>
            <p className="mt-1 max-w-sm px-4 text-xs font-medium text-slate-500 dark:text-slate-400">
              When you subscribe or renew, invoices will show up here with download links.
            </p>
          </motion.div>
        ) : isSmallScreen ? (
          <div className="space-y-4">
            {rows.map((bill, i) => (
              <BillingCard
                key={bill._id}
                bill={bill}
                onDownload={downloadPDF}
                index={i}
                maskInvoice={maskBillingHistory}
              />
            ))}
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            className="overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-600"
          >
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200/90 bg-gradient-to-r from-slate-50 via-slate-50 to-blue-50/40 dark:border-slate-700 dark:from-slate-900 dark:via-slate-900 dark:to-blue-950/25">
                    <th className="whitespace-nowrap py-3.5 pl-4 pr-3 text-left text-xs font-bold uppercase tracking-wider text-blue-900/70 dark:text-blue-200/80 sm:pl-5">
                      Invoice #
                    </th>
                    <th className="whitespace-nowrap px-3 py-3.5 text-left text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Created
                    </th>
                    <th className="whitespace-nowrap px-3 py-3.5 text-left text-xs font-bold uppercase tracking-wider text-sky-700/90 dark:text-sky-300/90">
                      Start
                    </th>
                    <th className="whitespace-nowrap px-3 py-3.5 text-left text-xs font-bold uppercase tracking-wider text-amber-800/85 dark:text-amber-200/90">
                      Expiry
                    </th>
                    <th className="whitespace-nowrap px-3 py-3.5 text-left text-xs font-bold uppercase tracking-wider text-violet-800/85 dark:text-violet-200/90">
                      Type
                    </th>
                    <th className="whitespace-nowrap px-3 py-3.5 text-left text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Duration
                    </th>
                    <th className="whitespace-nowrap px-3 py-3.5 text-left text-xs font-bold uppercase tracking-wider text-indigo-900/75 dark:text-indigo-200/85">
                      Plan
                    </th>
                    <th className="whitespace-nowrap px-3 py-3.5 text-right text-xs font-bold uppercase tracking-wider text-emerald-800/90 dark:text-emerald-300/90">
                      Amount
                    </th>
                    <th className="whitespace-nowrap py-3.5 pl-3 pr-4 text-center text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 sm:pr-5">
                      PDF
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700/80">
                  {rows.map((bill, index) => (
                    <motion.tr
                      key={bill._id}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{
                        duration: 0.28,
                        delay: Math.min(index * 0.04, 0.4),
                        ease: [0.22, 1, 0.36, 1],
                      }}
                      className="bg-white transition-colors hover:bg-slate-50/90 dark:bg-slate-800/30 dark:hover:bg-slate-800/70"
                    >
                      <td className="whitespace-nowrap py-3.5 pl-4 pr-3 sm:pl-5">
                        <span className="font-mono text-[13px] font-bold tracking-tight text-blue-700 dark:text-blue-300">
                          {maskPiiDisplay(bill.invoiceNumber, maskBillingHistory)}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-3 py-3.5 text-[13px] font-medium text-slate-500 dark:text-slate-400">
                        {formatDateAsNumber(bill?.createdAt)}
                      </td>
                      <td className="whitespace-nowrap px-3 py-3.5 text-[13px] font-semibold text-sky-700 dark:text-sky-300">
                        {formatDateAsNumber(bill?.startDate || bill?.createdAt)}
                      </td>
                      <td className="whitespace-nowrap px-3 py-3.5 text-[13px] font-semibold text-amber-800 dark:text-amber-200">
                        {formatDateAsNumber(bill?.expiryDate)}
                      </td>
                      <td className="whitespace-nowrap px-3 py-3.5">
                        <BillingTypePill text={formatBillingType(bill?.billingType)} />
                      </td>
                      <td className="whitespace-nowrap px-3 py-3.5 text-[13px] font-medium capitalize text-slate-600 dark:text-slate-300">
                        {bill?.durationType}
                      </td>
                      <td className="max-w-[220px] truncate px-3 py-3.5 text-[13px] font-semibold text-indigo-950 dark:text-indigo-100">
                        {bill?.plan?.name}
                      </td>
                      <td className="whitespace-nowrap px-3 py-3.5 text-right">
                        <span className="inline-flex items-baseline gap-0.5 font-black tabular-nums text-emerald-700 dark:text-emerald-400">
                          <span className="text-[11px] font-bold opacity-80">{"\u20B9"}</span>
                          {bill?.amount}
                        </span>
                      </td>
                      <td className="whitespace-nowrap py-3.5 pl-3 pr-4 text-center sm:pr-5">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-9 w-9 rounded-xl text-blue-600 hover:bg-blue-50 hover:text-blue-700 dark:text-blue-400 dark:hover:bg-blue-950/50 dark:hover:text-blue-300"
                          onClick={() => downloadPDF(bill)}
                          aria-label={`Download invoice ${bill?.invoiceNumber ?? ""}`}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}
        </div>

        {showPaginationFooter ? (
          <BillingTablePagination
            page={page}
            setPage={setPage}
            totalPages={totalPages || 1}
            limit={LIMIT}
            rows={rows}
            totalRecords={totalRecords}
          />
        ) : null}
      </div>
    </HubSubpageShell>
  );
};

export default BillingHistory;

const StatRow = ({ label, value, className = "" }) => (
  <div className="flex justify-between gap-4 py-2.5 text-sm">
    <dt className="shrink-0 text-slate-500 dark:text-slate-400">{label}</dt>
    <dd
      className={`text-right font-semibold text-slate-900 dark:text-slate-100 ${className}`}
    >
      {value}
    </dd>
  </div>
);

const formatBillingType = (type) => {
  if (!type) return "-";
  return type.split("_").join(" ");
};

const BillingCard = ({ bill, onDownload, index = 0, maskInvoice = false }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.35,
        delay: Math.min(index * 0.07, 0.35),
        ease: [0.22, 1, 0.36, 1],
      }}
      className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-600 dark:bg-slate-900/80"
    >
      <div className="flex items-start justify-between gap-3 border-b border-slate-100 bg-slate-50/80 px-4 py-4 dark:border-slate-700 dark:bg-slate-900/60 sm:px-5">
        <div className="flex min-w-0 items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-500/10 dark:bg-blue-500/15">
            <CalendarRange className="h-5 w-5 text-blue-500 dark:text-blue-400" />
          </div>
          <div className="min-w-0">
            <p className="truncate font-bold text-indigo-950 dark:text-indigo-100">
              {bill?.plan?.name || "N/A"}
            </p>
            <p className="mt-0.5 font-mono text-xs font-semibold text-blue-700 dark:text-blue-300">
              {maskPiiDisplay(bill.invoiceNumber, maskInvoice)}
            </p>
          </div>
        </div>
        <p className="shrink-0 text-lg font-black tabular-nums text-emerald-700 dark:text-emerald-400">
          <span className="text-sm font-bold opacity-85">{"\u20B9"}</span>
          {bill?.amount}
        </p>
      </div>

      <dl className="divide-y divide-slate-100 px-4 dark:divide-slate-700 sm:px-5">
        <div className="flex justify-between gap-4 py-2.5 text-sm">
          <dt className="shrink-0 text-slate-500 dark:text-slate-400">Period</dt>
          <dd className="text-right font-semibold">
            <span className="text-sky-700 dark:text-sky-300">
              {formatDateAsNumber(bill?.startDate || bill?.createdAt)}
            </span>
            <span className="mx-1 text-slate-400 dark:text-slate-500">→</span>
            <span className="text-amber-800 dark:text-amber-200">
              {formatDateAsNumber(bill?.expiryDate)}
            </span>
          </dd>
        </div>
        <div className="flex justify-between gap-4 py-2.5 text-sm">
          <dt className="shrink-0 text-slate-500 dark:text-slate-400">Billing type</dt>
          <dd className="text-right capitalize">
            <BillingTypePill text={formatBillingType(bill?.billingType)} />
          </dd>
        </div>
        <StatRow
          label="Duration type"
          className="capitalize"
          value={bill?.durationType || "-"}
        />
      </dl>

      <div className="flex items-center justify-between gap-3 border-t border-slate-100 bg-slate-50/50 px-4 py-3 dark:border-slate-700 dark:bg-slate-900/40 sm:px-5">
        <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
          Created {formatDateAsNumber(bill?.createdAt)}
        </span>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-9 gap-2 rounded-xl border-slate-200 bg-white font-bold text-blue-600 shadow-sm hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 dark:border-slate-600 dark:bg-slate-800 dark:text-blue-400 dark:hover:border-blue-500/40 dark:hover:bg-blue-950/40 dark:hover:text-blue-300"
          onClick={() => onDownload(bill)}
        >
          <Download className="h-3.5 w-3.5" strokeWidth={2.5} />
          PDF
        </Button>
      </div>
    </motion.div>
  );
};
