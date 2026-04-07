"use client";

import { useState } from "react";
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
} from "lucide-react";
import type { UserRole } from "@/lib/auth-utils";

interface SideNavProps {
  role: UserRole;
}

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/delivery", label: "Delivery", icon: Truck },
  { href: "/orders", label: "Orders", icon: ClipboardList },
  { href: "/settings", label: "Settings", icon: Settings },
] as const;

const ADMIN_NAV_ITEMS = [
  { href: "/reports", label: "Reports", icon: BarChart2 },
] as const;

export function SideNav({ role }: SideNavProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(true);

  const items = [...NAV_ITEMS, ...(role === "admin" ? ADMIN_NAV_ITEMS : [])];

  return (
    <aside
      className={[
        "shrink-0 flex flex-col border-r border-gray-200 bg-white transition-all duration-200 overflow-hidden",
        collapsed ? "w-12" : "w-48",
      ].join(" ")}
    >
      {/* Toggle button */}
      <div
        className={[
          "flex border-b border-gray-100 p-1.5",
          collapsed ? "justify-center" : "justify-end",
        ].join(" ")}
      >
        <button
          onClick={() => setCollapsed((c) => !c)}
          className="flex items-center justify-center w-7 h-7 rounded-md text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
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
                  ? "bg-blue-50 text-blue-700"
                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-900",
              ].join(" ")}
            >
              <Icon
                className={[
                  "h-4 w-4 shrink-0",
                  isActive ? "text-blue-600" : "text-gray-400",
                ].join(" ")}
              />
              {!collapsed && label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
