"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ClipboardList,
  BarChart2,
  Settings,
  Truck,
  PanelLeftClose,
  PanelLeftOpen,
  X,
} from "lucide-react";
import type { UserRole } from "@/lib/auth-utils";
import { useMobileNav } from "@/components/layout/MobileNavProvider";

interface SideNavProps {
  role: UserRole;
}

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/delivery", label: "Delivery", icon: Truck },
  { href: "/orders", label: "Orders", icon: ClipboardList },
] as const;

const ADMIN_NAV_ITEMS = [
  { href: "/reports", label: "Reports", icon: BarChart2 },
] as const;

const SETTINGS_ITEM = { href: "/settings", label: "Settings", icon: Settings } as const;

export function SideNav({ role }: SideNavProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(true);
  const { isMobileNavOpen, closeMobileNav } = useMobileNav();

  // Close mobile drawer on route change
  useEffect(() => {
    closeMobileNav();
  }, [pathname]); // eslint-disable-line react-hooks/exhaustive-deps

  const items = [...NAV_ITEMS, ...(role === "admin" ? ADMIN_NAV_ITEMS : []), SETTINGS_ITEM];

  return (
    <>
      {/* ── Desktop sidebar (hidden on mobile) ─────────────────────────── */}
      <aside
        className={[
          "hidden md:flex shrink-0 flex-col bg-slate-900 transition-all duration-200 overflow-hidden",
          collapsed ? "w-12" : "w-52",
        ].join(" ")}
      >
        {/* Toggle button */}
        <div
          className={[
            "flex border-b border-slate-800 p-1.5",
            collapsed ? "justify-center" : "justify-end",
          ].join(" ")}
        >
          <button
            onClick={() => setCollapsed((c) => !c)}
            className="flex items-center justify-center w-7 h-7 rounded-md text-slate-500 hover:bg-slate-800 hover:text-slate-300 transition-colors"
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? (
              <PanelLeftOpen className="h-4 w-4" />
            ) : (
              <PanelLeftClose className="h-4 w-4" />
            )}
          </button>
        </div>

        {/* Nav links */}
        <nav className="flex flex-col gap-0.5 p-2 pt-3">
          {items.map(({ href, label, icon: Icon }) => {
            const isActive = pathname === href || pathname.startsWith(href + "/");
            return (
              <Link
                key={href}
                href={href}
                title={collapsed ? label : undefined}
                aria-label={collapsed ? label : undefined}
                className={[
                  "flex items-center rounded-lg py-2 text-sm font-medium transition-colors",
                  collapsed ? "justify-center px-2" : "gap-2.5 px-3",
                  isActive
                    ? "bg-teal-500/10 text-teal-300"
                    : "text-slate-400 hover:bg-slate-800 hover:text-slate-200",
                ].join(" ")}
              >
                <Icon
                  className={[
                    "h-4 w-4 shrink-0",
                    isActive ? "text-teal-400" : "text-slate-500",
                  ].join(" ")}
                />
                {!collapsed && label}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* ── Mobile backdrop ─────────────────────────────────────────────── */}
      {isMobileNavOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 md:hidden"
          onClick={closeMobileNav}
          aria-hidden="true"
        />
      )}

      {/* ── Mobile drawer ───────────────────────────────────────────────── */}
      <aside
        className={[
          "fixed inset-y-0 left-0 z-50 flex flex-col w-64 bg-slate-900 md:hidden",
          "transition-transform duration-200 ease-in-out",
          isMobileNavOpen ? "translate-x-0" : "-translate-x-full",
        ].join(" ")}
      >
        {/* Close button */}
        <div className="flex justify-end border-b border-slate-800 p-1.5">
          <button
            onClick={closeMobileNav}
            className="flex items-center justify-center w-7 h-7 rounded-md text-slate-500 hover:bg-slate-800 hover:text-slate-300 transition-colors"
            aria-label="Close menu"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Nav links — always expanded on mobile */}
        <nav className="flex flex-col gap-1 p-2 pt-3">
          {items.map(({ href, label, icon: Icon }) => {
            const isActive = pathname === href || pathname.startsWith(href + "/");
            return (
              <Link
                key={href}
                href={href}
                className={[
                  "flex items-center gap-2.5 px-3 rounded-lg py-2 min-h-[44px] text-sm font-medium transition-colors touch-manipulation",
                  isActive
                    ? "bg-teal-500/10 text-teal-300"
                    : "text-slate-400 hover:bg-slate-800 hover:text-slate-200",
                ].join(" ")}
              >
                <Icon
                  className={[
                    "h-4 w-4 shrink-0",
                    isActive ? "text-teal-400" : "text-slate-500",
                  ].join(" ")}
                />
                {label}
              </Link>
            );
          })}
        </nav>
      </aside>
    </>
  );
}
