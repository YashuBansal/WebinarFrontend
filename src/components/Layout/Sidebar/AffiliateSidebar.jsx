import React from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Compass,
  Users,
  Receipt,
  Landmark,
  Award,
  ArrowLeft,
  ShieldCheck,
  Crown,
} from "lucide-react";
import { useTheme } from "../../../contexts/ThemeContext";

const AffiliateSidebar = ({ variant, section, handleNavigation }) => {
  const location = useLocation();
  const { isDark } = useTheme();

  const navItems = [
    { name: "Get Started", path: "/affiliate/getstarted", icon: Compass },
    { name: "Referrals", path: "/affiliate/referrals", icon: Users },
    { name: "Commission Ledger", path: "/affiliate/ledger", icon: Receipt },
    { name: "Bank Details", path: "/affiliate/bank", icon: Landmark },
    { name: "Affiliate Plans", path: "/affiliate/plans", icon: Crown },
    { name: "Agreement", path: "https://help.webinarleadshub.com/?article=57667-affiliate-program-agreement", icon: ShieldCheck, isExternal: true },
  ];

  const isActive = (path) =>
    location.pathname === path ||
    (path === "/affiliate/getstarted" && location.pathname === "/affiliate");

  if (section === "top") {
    if (variant === "rail") {
      return (
        <div className="flex flex-col items-center justify-center py-3 border-b border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 h-[68px]">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-rose-50 dark:bg-rose-500/10 border border-rose-100 dark:border-rose-950 text-rose-500">
            <Award className="h-5 w-5" />
          </div>
        </div>
      );
    }
    return (
      <div className="px-4 py-3 border-b border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 h-[68px] flex flex-col justify-center">
        <div className="flex items-center gap-2 text-slate-800 dark:text-slate-100">
          <Award className="h-4 w-4 text-rose-500" />
          <span className="text-sm font-black tracking-tight" style={{ fontFamily: "Inter, sans-serif" }}>
            Affiliate Portal
          </span>
        </div>
      </div>
    );
  }

  if (section === "bottom") {
    if (variant === "rail") {
      return (
        <div className="flex items-center justify-center py-3 border-t border-gray-100 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-800/50 h-[55px]">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-rose-50 dark:bg-rose-500/10 text-rose-500">
            <ShieldCheck className="h-4 w-4" />
          </div>
        </div>
      );
    }
    return (
      <div className="px-4 py-3 border-t border-gray-100 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-800/50 h-[55px] flex flex-col justify-center">
        <div className="flex items-center gap-2 rounded-lg bg-rose-50 dark:bg-rose-500/10 px-2 py-1.5 text-[10px] font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400">
          <ShieldCheck className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate">Affiliate Active</span>
        </div>
      </div>
    );
  }

  return (
    <>
      {navItems.map((item) => {
        const active = !item.isExternal && isActive(item.path);
        const Icon = item.icon;

        if (variant === "mobile") {
          if (item.isExternal) {
            return (
              <li key={item.path}>
                <a
                  href={item.path}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 rounded-xl px-3 py-2.5 font-medium transition-colors text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-800"
                >
                  <Icon className="h-5 w-5 shrink-0 text-slate-500 dark:text-slate-400" strokeWidth={2} />
                  <span>{item.name}</span>
                </a>
              </li>
            );
          }
          return (
            <li key={item.path}>
              <Link
                to={item.path}
                onClick={() => handleNavigation(item.path)}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 font-medium transition-colors ${active
                    ? "bg-rose-50 dark:bg-rose-500/10 text-rose-600"
                    : "text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-800"
                  }`}
              >
                <Icon className={`h-5 w-5 shrink-0 ${active ? "text-rose-500" : "text-slate-500 dark:text-slate-400"}`} strokeWidth={2} />
                <span>{item.name}</span>
              </Link>
            </li>
          );
        }

        if (variant === "rail") {
          if (item.isExternal) {
            return (
              <li key={item.path}>
                <a
                  href={item.path}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="relative flex w-full items-center justify-center rounded-lg py-2.5 transition-colors hover:bg-black/[0.04] dark:hover:bg-white/[0.04]"
                  title={item.name}
                >
                  <Icon className="h-5 w-5 shrink-0 text-slate-400 dark:text-slate-500" strokeWidth={2} />
                </a>
              </li>
            );
          }
          return (
            <li key={item.path}>
              <Link
                to={item.path}
                onClick={() => handleNavigation(item.path)}
                className={`relative flex w-full items-center justify-center rounded-lg py-2.5 transition-colors hover:bg-black/[0.04] dark:hover:bg-white/[0.04] ${active ? "bg-rose-500/10" : ""
                  }`}
                title={item.name}
              >
                {active && (
                  <div className="absolute bottom-0 left-0 top-0 w-[3px] rounded-r-sm bg-rose-500" />
                )}
                <Icon className={`h-5 w-5 shrink-0 ${active ? "text-rose-500" : "text-slate-400 dark:text-slate-500"}`} strokeWidth={2} />
              </Link>
            </li>
          );
        }

        if (item.isExternal) {
          return (
            <li key={item.path}>
              <a
                href={item.path}
                target="_blank"
                rel="noopener noreferrer"
                className="flex w-full items-center rounded-lg px-2 py-2.5 text-left text-sm font-medium hover:bg-rose-50/50 dark:hover:bg-rose-950/20 text-slate-800 dark:text-slate-200"
                style={{ fontFamily: "Inter, sans-serif" }}
              >
                <span className="truncate whitespace-nowrap">{item.name}</span>
              </a>
            </li>
          );
        }

        return (
          <li key={item.path}>
            <Link
              to={item.path}
              onClick={() => handleNavigation(item.path)}
              className={`flex w-full items-center rounded-lg px-2 py-2.5 text-left text-sm font-medium hover:bg-rose-50/50 dark:hover:bg-rose-950/20 ${active
                  ? "text-rose-600 dark:text-rose-400 bg-rose-50/30 dark:bg-rose-950/10 font-bold"
                  : "text-slate-800 dark:text-slate-200"
                }`}
              style={{ fontFamily: "Inter, sans-serif" }}
            >
              <span className="truncate whitespace-nowrap">{item.name}</span>
            </Link>
          </li>
        );
      })}
    </>
  );
};

export default AffiliateSidebar;
