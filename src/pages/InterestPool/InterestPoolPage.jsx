import React, { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  useInterestPoolSettings,
  useUpdateInterestPoolSettings,
  useInterestSearch,
} from "../../hooks/useInterestPool";

const InterestPoolPage = () => {
  const [searchKeyword, setSearchKeyword] = useState("");
  const [results, setResults] = useState([]);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [settingsAccountId, setSettingsAccountId] = useState("");
  const [settingsAccessToken, setSettingsAccessToken] = useState("");

  const { data: settings, isLoading: isLoadingSettings } =
    useInterestPoolSettings();
  const { mutate: updateSettings, isPending: isSavingSettings } =
    useUpdateInterestPoolSettings();
  const { mutate: searchInterests, isPending: isLoading, error: searchError } =
    useInterestSearch();

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
    <div className="p-4 md:p-6 lg:p-8">
      <div className="flex items-center justify-between my-4 gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Interest Pool</h1>
          <p className="text-sm text-gray-600 mt-1">
          Find relevant targeting options in meta based on your keyword search.
          </p>
        </div>
        <button
          type="button"
          onClick={openSettings}
          className="inline-flex items-center px-3 py-2 rounded text-sm font-medium border border-gray-300 bg-white hover:bg-gray-50"
        >
          Settings
        </button>
      </div>
      <p className="text-xs text-gray-500 mb-4">
        Access tokens are sensitive. They are stored securely on the server per
        user and used for your Interest Pool searches.
      </p>

      {!hasConfiguredSettings && !isLoadingSettings && (
        <div className="mb-4 rounded border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-800 flex items-start justify-between gap-3">
          <div>
            <p className="font-semibold">Account not configured</p>
            <p>
              Please add your Facebook Account ID and Access Token in Settings
              before running searches.
            </p>
          </div>
          <button
            type="button"
            onClick={openSettings}
            className="shrink-0 rounded border border-amber-400 px-2 py-1 text-xs font-medium text-amber-900 hover:bg-amber-100"
          >
            Open Settings
          </button>
        </div>
      )}

      <form
        onSubmit={handleFetch}
        className="space-y-4 bg-white rounded-lg shadow p-4 md:p-6 mb-8"
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-3">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Search Keyword
            </label>
            <input
              type="text"
              className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              placeholder="e.g. marketing"
            />
          </div>
        </div>

        {searchError && (
          <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">
            {typeof searchError === "string"
              ? searchError
              : searchError?.message || "Failed to fetch interests."}
          </div>
        )}

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={!canSearch || isLoading}
            className={`inline-flex items-center px-4 py-2 rounded text-sm font-medium text-white ${
              !canSearch || isLoading
                ? "bg-blue-300 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700"
            }`}
          >
            {isLoading ? "Fetching..." : "Fetch Interests"}
          </button>
          <button
            type="button"
            onClick={handleDownloadCsv}
            disabled={results.length === 0}
            className={`inline-flex items-center px-4 py-2 rounded text-sm font-medium ${
              results.length === 0
                ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                : "bg-gray-800 text-white hover:bg-gray-900"
            }`}
          >
            Download CSV
          </button>
        </div>
      </form>

      <div className="bg-white rounded-lg shadow p-4 md:p-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-medium">Results</h2>
          <span className="text-sm text-gray-500">
            {displayedResults.length} record
            {displayedResults.length === 1 ? "" : "s"}
          </span>
        </div>

        {displayedResults.length === 0 ? (
          <p className="text-sm text-gray-500">
            No data to display. Run a search to see interests.
          </p>
        ) : (
          <div className="overflow-auto">
            <table className="min-w-full text-sm border border-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {columns.map(({ key, label }) => (
                    <th
                      key={key}
                      className="px-3 py-2 text-left font-semibold text-gray-700 border-b border-gray-200"
                    >
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {displayedResults.map((item, rowIndex) => (
                  <tr
                    key={rowIndex}
                    className={rowIndex % 2 === 0 ? "bg-white" : "bg-gray-50"}
                  >
                    {columns.map(({ key }) => {
                      const value =
                        item && item[key] != null ? item[key] : "";
                      const displayValue =
                        typeof value === "object"
                          ? JSON.stringify(value)
                          : String(value);
                      return (
                        <td
                          key={key}
                          className="px-3 py-2 text-gray-800 border-b border-gray-100 align-top max-w-xs break-words"
                        >
                          {displayValue}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {isSettingsOpen && (
        <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6">
            <h2 className="text-lg font-semibold mb-4">
              Interest Pool Settings
            </h2>
            <form className="space-y-4" onSubmit={handleSaveSettings}>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Account ID
                </label>
                <input
                  type="text"
                  className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={settingsAccountId}
                  onChange={(e) => setSettingsAccountId(e.target.value)}
                  placeholder="e.g. 1234567890"
                  disabled={isSavingSettings}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Access Token
                </label>
                <input
                  type="password"
                  className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={settingsAccessToken}
                  onChange={(e) => setSettingsAccessToken(e.target.value)}
                  placeholder="Paste your Facebook access token"
                  disabled={isSavingSettings}
                />
              </div>
              <p className="text-xs text-gray-500">
                These credentials are saved per user and used as defaults for
                Interest Pool searches. You can still override them in the
                search form if needed.
              </p>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsSettingsOpen(false)}
                  className="px-3 py-2 rounded text-sm font-medium border border-gray-300 bg-white hover:bg-gray-50"
                  disabled={isSavingSettings}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingSettings}
                  className={`px-3 py-2 rounded text-sm font-medium text-white ${
                    isSavingSettings
                      ? "bg-blue-300 cursor-not-allowed"
                      : "bg-blue-600 hover:bg-blue-700"
                  }`}
                >
                  {isSavingSettings ? "Saving..." : "Save"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default InterestPoolPage;

