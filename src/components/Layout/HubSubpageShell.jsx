import { useSyncExternalStore } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft } from "lucide-react";

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

/**
 * Page chrome for hub routes opened from Settings (plans, tags, API, etc.):
 * same background as the new settings shell and optional back link.
 */
export default function HubSubpageShell({
  children,
  title,
  description,
  backTo = "/",
  backLabel = "Back to home",
  showBack = true,
  maxWidthClass = "max-w-6xl",
  contentClassName = "",
}) {
  const isDark = useSyncExternalStore(
    subscribeHtmlClass,
    getSnapshotIsDark,
    getServerSnapshotIsDark,
  );
  const bg = isDark ? "#0f172a" : "#F2F4F6";
  const heading = isDark ? "#f8fafc" : "#071028";
  const sub = isDark ? "rgb(148,163,184)" : "rgb(100,116,139)";

  return (
    <div
      className="min-h-[calc(100vh-4rem)] w-full transition-colors duration-300"
      style={{ backgroundColor: bg }}
    >
      <div
        className={`mx-auto ${maxWidthClass} px-4 pb-10 pt-14 sm:px-6 ${contentClassName}`}
      >
        {showBack && backTo ? (
          <Link
            to={backTo}
            className="mb-6 inline-flex items-center gap-1 text-sm font-semibold text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
          >
            <ChevronLeft className="h-4 w-4" />
            {backLabel}
          </Link>
        ) : null}

        {(title || description) && (
          <header className="mb-8">
            {title ? (
              <h1
                className="text-2xl font-black tracking-tight sm:text-3xl"
                style={{ color: heading }}
              >
                {title}
              </h1>
            ) : null}
            {description ? (
              <p
                className="mt-2 max-w-2xl text-sm font-medium sm:text-base"
                style={{ color: sub }}
              >
                {description}
              </p>
            ) : null}
          </header>
        )}

        {children}
      </div>
    </div>
  );
}
