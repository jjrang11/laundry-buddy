"use client";

import { useState, useCallback } from "react";
import { signOut } from "@/features/auth/auth.actions";
import { OrderModal } from "@/features/orders/OrderModal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { WashingMachine, LogOut, Plus, Menu } from "lucide-react";
import type { UserRole } from "@/lib/auth-utils";
import type { ShopBranding } from "@/lib/types";
import { useMobileNav } from "@/components/layout/MobileNavProvider";

interface DashboardHeaderProps {
  email: string;
  role: UserRole;
  branding: ShopBranding;
}

export function DashboardHeader({ email, role, branding }: DashboardHeaderProps) {
  const [showNewOrder, setShowNewOrder] = useState(false);
  const handleCloseNewOrder = useCallback(() => setShowNewOrder(false), []);
  const { openMobileNav } = useMobileNav();

  return (
    <>
      <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-slate-200 bg-white/95 backdrop-blur-sm px-4 shadow-sm">
        {/* Hamburger (mobile only) */}
        <button
          onClick={openMobileNav}
          className="md:hidden flex items-center justify-center w-8 h-8 -ml-1 mr-1 rounded-md text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors"
          aria-label="Open navigation menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        {/* Brand */}
        <div className="flex items-center gap-2.5">
          {branding.logo_url ? (
            <img
              src={branding.logo_url}
              alt="Shop logo"
              className="w-7 h-7 rounded-lg object-cover"
            />
          ) : (
            <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-primary text-primary-foreground">
              <WashingMachine className="h-4 w-4" />
            </div>
          )}
          <span className="font-semibold text-slate-900 text-sm tracking-tight">
            {branding.shop_name ?? "Laundry Buddy"}
          </span>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={() => setShowNewOrder(true)}
            className="gap-1.5 h-8"
          >
            <Plus className="h-3.5 w-3.5" />
            New Order
          </Button>

          <div className="hidden sm:flex items-center gap-2 pl-2.5 border-l border-slate-200">
            <span className="text-sm text-slate-500">{email}</span>
            <Badge
              variant={role === "admin" ? "default" : "secondary"}
              className="capitalize"
            >
              {role}
            </Badge>
          </div>

          <form action={signOut} aria-label="Sign out">
            <Button
              type="submit"
              variant="ghost"
              size="sm"
              className="gap-1.5 h-8 text-slate-500 hover:text-slate-700"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Sign out</span>
            </Button>
          </form>
        </div>
      </header>

      {showNewOrder && (
        <OrderModal
          mode="create"
          open={showNewOrder}
          onClose={handleCloseNewOrder}
          userRole={role}
        />
      )}
    </>
  );
}
