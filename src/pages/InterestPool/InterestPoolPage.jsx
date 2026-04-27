import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Info } from "lucide-react";
import { toast } from "sonner";
import {
  useInterestPoolSettings,
  useUpdateInterestPoolSettings,
  useInterestSearch,
} from "../../hooks/useInterestPool";
import { useTheme } from "../../contexts/ThemeContext";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../../components/ui/dialog";
import { cn } from "../../lib/utils";

const cardClass =
  "rounded-3xl border border-slate-200/90 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800/90 sm:p-6";

const InterestPoolPage = () => {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const [searchKeyword, setSearchKeyword] = useState("");
  const [results, setResults] = useState([]);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [settingsAccountId, setSettingsAccountId] = useState("");
  const [settingsAccessToken, setSettingsAccessToken] = useState("");

  const { data: settings, isLoading: isLoadingSettings } =
    useInterestPoolSettings();
  const { mutate: updateSettings, isPending: isSavingSettings } =
    useUpdateInterestPoolSettings();
  const {
    mutate: searchInterests,
    isPending: isLoading,
    error: searchError,
  } = useInterestSearch();

  const savedAccountId = settings?.accountId ?? "";
  const savedAccessToken = settings?.accessToken ?? "";
  const hasConfiguredSettings =
    savedAccountId.trim() !== "" && savedAccessToken.trim() !== "";

  const canSearch = useMemo(() => {
    return hasConfiguredSettings && searchKeyword.trim() !== "";
  }, [hasConfiguredSettings, searchKeyword]);

  const displayedResults = useMemo(() => {
    if (!Array.isArray(results) || results.length === 0) return [];

    return results.map((item) => {
      const lower = item?.audience_size_lower_bound;
      const upper = item?.audience_size_upper_bound;
      const lowerText = lower != null && lower !== "" ? String(lower) : "-";
      const upperText = upper != null && upper !== "" ? String(upper) : "-";

      return {
        name: item?.name ?? "",
        type: item?.type ?? "",
        path: item?.path ?? "",
        Audience: `${lowerText} - ${upperText}`,
        description: item?.description ?? "",
      };
    });
  }, [results]);

  const columns = useMemo(() => {
    return [
      { key: "name", label: "Name" },
      { key: "type", label: "Type" },
      { key: "path", label: "Path" },
      { key: "Audience", label: "Audience" },
      { key: "description", label: "Description" },
    ];
  }, []);


  const openSettings = () => {
    setSettingsAccountId(savedAccountId);
    setSettingsAccessToken(savedAccessToken);
    setIsSettingsOpen(true);
  };

  const handleSaveSettings = (e) => {
    e.preventDefault();
    const trimmedAccountId = settingsAccountId.trim();
    const trimmedAccessToken = settingsAccessToken.trim();

    if (!trimmedAccountId || !trimmedAccessToken) {
      toast.error("Account ID and Access Token are required.");
      return;
    }

    updateSettings(
      { accountId: trimmedAccountId, accessToken: trimmedAccessToken },
      {
        onSuccess: () => {
          setIsSettingsOpen(false);
        },
      },
    );
  };

  const handleFetch = (e) => {
    e.preventDefault();
    if (!canSearch) return;

    const effectiveAccountId = savedAccountId.trim();
    const effectiveAccessToken = savedAccessToken.trim();

    if (!effectiveAccountId || !effectiveAccessToken) {
      toast.error(
        "Please configure your Facebook Account ID and Access Token in Settings.",
      );
      return;
    }

    searchInterests(
      {
        accountId: effectiveAccountId,
        accessToken: effectiveAccessToken,
        q: searchKeyword.trim(),
      },
      {
        onSuccess: (data) => {
          const list = Array.isArray(data?.data) ? data.data : [];
          setResults(list);
          if (list.length === 0) {
            toast.info("No interests found for this keyword.");
          } else {
            toast.success(`Fetched ${list.length} interests.`);
          }
        },
        onError: () => {
          setResults([]);
        },
      },
    );
  };

  const handleDownloadCsv = () => {
    if (!displayedResults || displayedResults.length === 0) return;

    const csvRows = [];
    csvRows.push(columns.map((c) => c.label).join(","));

    displayedResults.forEach((item) => {
      const row = columns.map(({ key }) => {
        const value = item && item[key] != null ? item[key] : "";
        const serialized =
          typeof value === "object" ? JSON.stringify(value) : String(value);
        const escaped = serialized.replace(/"/g, '""');
        return `"${escaped}"`;
      });
      csvRows.push(row.join(","));
    });

    const blob = new Blob([csvRows.join("\n")], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    const safeKeyword = searchKeyword.trim() || "results";
    link.download = `interest-pool-${safeKeyword}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto space-y-6 transition-all duration-300">
      <motion.div
        className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
      >
        <div>
          <h2
            className="text-2xl font-bold tracking-tight"
            style={{ color: isDark ? "#f8fafc" : "#071028" }}
          >
            Interest pool
          </h2>
          <p
            className="mt-1 text-sm"
            style={{ color: isDark ? "#94a3b8" : "#64748b" }}
          >
            Find Meta targeting options that match your keyword search.
          </p>
        </div>
        <div className="flex w-full flex-col items-stretch gap-3 sm:w-auto sm:flex-row sm:items-center">
          <button
            type="button"
            onClick={openSettings}
            className="shrink-0 rounded-xl px-4 py-2 text-sm font-semibold shadow-sm transition-transform hover:scale-[1.02]"
            style={{
              backgroundColor: isDark ? "#1e293b" : "#ffffff",
              color: isDark ? "#f8fafc" : "#0f172a",
              border: `1px solid ${isDark ? "#334155" : "#e2e8f0"}`,
              boxShadow:
                theme === "light" ? "0 2px 4px rgba(0,0,0,0.04)" : "none",
            }}
          >
            Settings
          </button>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.04 }}
        className="mb-2 flex items-start gap-3 rounded-2xl border border-blue-200/80 bg-blue-50/90 p-4 dark:border-blue-500/25 dark:bg-blue-950/30 sm:items-center sm:gap-4"
      >
        <Info className="mt-0.5 shrink-0 text-blue-500 sm:mt-0" size={20} />
        <div className="space-y-2 text-xs font-semibold leading-relaxed text-blue-800 dark:text-blue-200/90">
          <p>
            Access tokens are sensitive. They are stored securely on the server
            per user and used only for your interest pool searches.
          </p>
        </div>
      </motion.div>

      {isLoadingSettings && (
        <p
          className="text-sm font-medium"
          style={{ color: isDark ? "#94a3b8" : "#64748b" }}
        >
          Loading saved credentials…
        </p>
      )}

      <AnimatePresence>
        {!hasConfiguredSettings && !isLoadingSettings && (
          <motion.div
            key="interest-pool-setup"
            initial={{ opacity: 0, height: 0, marginBottom: 0 }}
            animate={{ opacity: 1, height: "auto", marginBottom: 24 }}
            exit={{ opacity: 0, height: 0, marginBottom: 0 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <div className="flex flex-col gap-3 rounded-2xl border border-amber-200/90 bg-gradient-to-r from-amber-50 to-orange-50/80 px-4 py-4 dark:border-amber-500/30 dark:from-amber-950/40 dark:to-orange-950/30 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-bold text-amber-900 dark:text-amber-100">
                  Account not configured
                </p>
                <p className="mt-1 text-sm text-amber-800/90 dark:text-amber-200/90">
                  Add your Facebook Account ID and access token in Settings
                  before running searches.
                </p>
              </div>
              <button
                type="button"
                onClick={openSettings}
                className="h-9 shrink-0 rounded-xl px-4 text-sm font-semibold shadow-sm transition-transform hover:scale-[1.02]"
                style={{
                  backgroundColor: isDark ? "#1e293b" : "#ffffff",
                  color: isDark ? "#f8fafc" : "#0f172a",
                  border: `1px solid ${isDark ? "#334155" : "#e2e8f0"}`,
                  boxShadow:
                    theme === "light" ? "0 2px 4px rgba(0,0,0,0.04)" : "none",
                }}
              >
                Open settings
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.form
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          delay: 0.08,
          duration: 0.35,
          ease: [0.22, 1, 0.36, 1],
        }}
        onSubmit={handleFetch}
        className={cn(
          "relative mb-8 overflow-hidden",
          cardClass,
          "bg-gradient-to-br from-white via-white to-slate-50/50 dark:from-slate-800/90 dark:via-slate-800/90 dark:to-slate-900/50",
        )}
      >
        <div
          className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-wlh-brand/5 blur-3xl dark:bg-emerald-500/10"
          aria-hidden
        />
        <div className="relative space-y-5">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
                Search
              </h2>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Enter a keyword to query Meta&rsquo;s interest targeting
                library.
              </p>
            </div>
          </div>

          <div>
            <label
              htmlFor="interest-keyword"
              className="mb-1.5 block text-sm font-semibold text-slate-700 dark:text-slate-200"
            >
              Search keyword
            </label>
            <input
              id="interest-keyword"
              type="text"
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              placeholder="e.g. marketing, fitness, B2B…"
              disabled={isLoading}
              className="w-full rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-wlh-brand/30 transition-all"
              style={{
                backgroundColor: isDark ? "#1e293b" : "#ffffff",
                border: `1px solid ${isDark ? "#334155" : "#e2e8f0"}`,
                color: isDark ? "#f8fafc" : "#0f172a",
                boxShadow:
                  theme === "light" ? "0 2px 4px rgba(0,0,0,0.02)" : "none",
              }}
            />
          </div>

          {searchError && (
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="rounded-xl border border-red-200 bg-red-50/90 px-4 py-3 text-sm text-red-800 dark:border-red-500/40 dark:bg-red-950/50 dark:text-red-200"
            >
              {typeof searchError === "string"
                ? searchError
                : searchError?.message || "Failed to fetch interests."}
            </motion.div>
          )}

          <div className="flex flex-col gap-3 pt-1 sm:flex-row sm:flex-wrap sm:items-center">
            <button
              type="submit"
              disabled={!canSearch || isLoading}
              className="flex min-w-[140px] items-center justify-center rounded-xl px-4 py-2 text-sm font-semibold shadow-sm transition-transform hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100"
              style={{
                backgroundColor: !canSearch || isLoading ? "#94a3b8" : "#22B573",
                color: "white",
                border: "none",
                boxShadow:
                  !canSearch || isLoading
                    ? "none"
                    : "0 4px 10px rgba(34, 181, 115, 0.25)",
              }}
            >
              {isLoading ? "Fetching…" : "Fetch interests"}
            </button>
            <button
              type="button"
              onClick={handleDownloadCsv}
              disabled={results.length === 0}
              className="flex items-center justify-center rounded-xl px-4 py-2 text-sm font-semibold shadow-sm transition-transform hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100"
              style={{
                backgroundColor: isDark ? "#1e293b" : "#ffffff",
                color: isDark ? "#f8fafc" : "#0f172a",
                border: `1px solid ${isDark ? "#334155" : "#e2e8f0"}`,
                boxShadow:
                  results.length === 0
                    ? "none"
                    : theme === "light"
                      ? "0 2px 4px rgba(0,0,0,0.04)"
                      : "none",
              }}
            >
              Download CSV
            </button>
          </div>
        </div>
      </motion.form>

      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          delay: 0.08,
          duration: 0.35,
          ease: [0.22, 1, 0.36, 1],
        }}
        className={cardClass}
      >
        <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-sm font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
            Results
          </h2>
          <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-600 dark:text-slate-300">
            <span className="inline-flex h-6 min-w-[1.5rem] items-center justify-center rounded-lg bg-slate-100 px-2 text-xs dark:bg-slate-700/80">
              {displayedResults.length}
            </span>
            {displayedResults.length === 1 ? "record" : "records"}
          </span>
        </div>

        {displayedResults.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-16 text-center"
          >
            <p
              className="max-w-sm text-sm font-medium"
              style={{ color: isDark ? "#94a3b8" : "#64748b" }}
            >
              No data yet. Run a search above to load Meta interest suggestions
              here.
            </p>
          </motion.div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-slate-100 dark:border-slate-700/80">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead>
                <tr className="border-b border-blue-200/80 bg-blue-50/80 dark:border-blue-500/30 dark:bg-blue-950/40">
                  {columns.map(({ key, label }) => (
                    <th
                      key={key}
                      className="whitespace-nowrap px-4 py-3.5 text-xs font-bold uppercase tracking-wider text-slate-500 first:pl-5 last:pr-5 dark:text-slate-400"
                    >
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {displayedResults.map((item, rowIndex) => (
                  <motion.tr
                    key={`${item.name}-${rowIndex}`}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      delay: Math.min(rowIndex * 0.028, 0.45),
                      duration: 0.22,
                      ease: [0.22, 1, 0.36, 1],
                    }}
                    className="border-b border-slate-100/90 transition-colors last:border-0 hover:bg-slate-50/90 dark:border-slate-800 dark:hover:bg-slate-900/50"
                  >
                    {columns.map(({ key }) => {
                      const value = item && item[key] != null ? item[key] : "";
                      const displayValue =
                        typeof value === "object"
                          ? JSON.stringify(value)
                          : String(value);
                      return (
                        <td
                          key={key}
                          className="max-w-[14rem] break-words px-4 py-3 align-top text-slate-700 first:pl-5 last:pr-5 dark:text-slate-200"
                        >
                          {displayValue}
                        </td>
                      );
                    })}
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </motion.section>

      <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
        <DialogContent className="max-w-md rounded-2xl border-slate-200 bg-white p-0 dark:border-slate-700 dark:bg-slate-900">
          <div className="border-b border-slate-100 px-6 py-5 dark:border-slate-800">
            <DialogHeader>
              <DialogTitle className="text-lg text-slate-900 dark:text-slate-50">
                Interest pool settings
              </DialogTitle>
            </DialogHeader>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Facebook Marketing API credentials for searches.
            </p>
          </div>
          <form className="space-y-4 px-6 pb-6 pt-2" onSubmit={handleSaveSettings}>
            <div>
              <label
                htmlFor="fb-account-id"
                className="mb-1.5 block text-sm font-semibold text-slate-700 dark:text-slate-200"
              >
                Account ID
              </label>
              <Input
                id="fb-account-id"
                type="text"
                value={settingsAccountId}
                onChange={(e) => setSettingsAccountId(e.target.value)}
                placeholder="e.g. 1234567890"
                disabled={isSavingSettings}
                className="h-10 rounded-xl border-slate-200 dark:border-slate-600"
              />
            </div>
            <div>
              <label
                htmlFor="fb-access-token"
                className="mb-1.5 block text-sm font-semibold text-slate-700 dark:text-slate-200"
              >
                Access token
              </label>
              <Input
                id="fb-access-token"
                type="password"
                value={settingsAccessToken}
                onChange={(e) => setSettingsAccessToken(e.target.value)}
                placeholder="Paste your Facebook access token"
                disabled={isSavingSettings}
                className="h-10 rounded-xl border-slate-200 dark:border-slate-600"
              />
            </div>
            <p className="text-xs leading-relaxed text-slate-500 dark:text-slate-400">
              These credentials are saved per user and used as defaults for
              interest pool searches.
            </p>
            <div className="flex justify-end gap-2 border-t border-slate-100 pt-4 dark:border-slate-800">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsSettingsOpen(false)}
                disabled={isSavingSettings}
                className="rounded-xl"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSavingSettings}
                className="min-w-[88px] rounded-xl bg-wlh-brand text-white hover:bg-wlh-brand/90"
              >
                {isSavingSettings ? "Saving…" : "Save"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default InterestPoolPage;
