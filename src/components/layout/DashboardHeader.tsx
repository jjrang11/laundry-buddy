"use client";

import { useState, useCallback } from "react";
import { signOut } from "@/features/auth/auth.actions";
import { OrderModal } from "@/features/orders/OrderModal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { WashingMachine, LogOut, Plus } from "lucide-react";
import type { UserRole } from "@/lib/auth-utils";
import type { ShopBranding } from "@/lib/types";

interface DashboardHeaderProps {
  email: string;
  role: UserRole;
  branding: ShopBranding;
}

export function DashboardHeader({ email, role, branding }: DashboardHeaderProps) {
  const [showNewOrder, setShowNewOrder] = useState(false);
  const handleCloseNewOrder = useCallback(() => setShowNewOrder(false), []);

  return (
    <>
      <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-gray-200 bg-white px-4 shadow-sm">
        <div className="flex items-center gap-2">
          {branding.logo_url ? (
            <img
              src={branding.logo_url}
              alt="Shop logo"
              className="w-7 h-7 rounded-lg object-cover"
            />
          ) : (
            <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-blue-600 text-white">
              <WashingMachine className="h-4 w-4" />
            </div>
          )}
          <span className="font-semibold text-gray-900 text-sm">
            {branding.shop_name ?? 'Laundry Buddy'}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={() => setShowNewOrder(true)}
            className="gap-1.5 bg-blue-600 hover:bg-blue-700 text-white h-8"
          >
            <Plus className="h-3.5 w-3.5" />
            New Order
          </Button>

          <span className="hidden sm:block text-sm text-gray-400">|</span>
          <span className="hidden sm:block text-sm text-gray-500">{email}</span>
          <Badge
            variant={role === "admin" ? "default" : "secondary"}
            className="capitalize"
          >
            {role}
          </Badge>
          <form action={signOut} aria-label="Sign out">
            <Button
              type="submit"
              variant="ghost"
              size="sm"
              className="gap-1.5 h-8"
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
