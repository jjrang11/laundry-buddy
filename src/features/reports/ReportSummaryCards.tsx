"use client";

import { PhilippinePeso, ShoppingBag, Weight, Users } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface ReportSummaryCardsProps {
  totalRevenue: number;
  totalOrders: number;
  totalWeight: number;
  pickupCount: number;
  walkinCount: number;
}

export function ReportSummaryCards({
  totalRevenue,
  totalOrders,
  totalWeight,
  pickupCount,
  walkinCount,
}: ReportSummaryCardsProps) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {/* Total Revenue */}
      <div className="rounded-xl border border-gray-100 bg-white p-4 ring-1 ring-foreground/10">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-50 text-blue-600 shrink-0">
            <PhilippinePeso className="h-4 w-4" />
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">
              Revenue
            </p>
            <p className="text-2xl font-bold text-gray-900 tabular-nums">
              {formatCurrency(totalRevenue)}
            </p>
          </div>
        </div>
      </div>

      {/* Total Orders */}
      <div className="rounded-xl border border-gray-100 bg-white p-4 ring-1 ring-foreground/10">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-50 text-blue-600 shrink-0">
            <ShoppingBag className="h-4 w-4" />
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">
              Orders
            </p>
            <p className="text-2xl font-bold text-gray-900 tabular-nums">
              {totalOrders}
            </p>
          </div>
        </div>
      </div>

      {/* Total Weight */}
      <div className="rounded-xl border border-gray-100 bg-white p-4 ring-1 ring-foreground/10">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-50 text-blue-600 shrink-0">
            <Weight className="h-4 w-4" />
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">
              Weight
            </p>
            <p className="text-2xl font-bold text-gray-900 tabular-nums">
              {totalWeight.toFixed(1)} kg
            </p>
          </div>
        </div>
      </div>

      {/* Order Types */}
      <div className="rounded-xl border border-gray-100 bg-white p-4 ring-1 ring-foreground/10">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-50 text-blue-600 shrink-0">
            <Users className="h-4 w-4" />
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">
              Order Types
            </p>
            <div className="mt-1 space-y-0.5">
              <div className="flex items-center gap-1.5">
                <span className="inline-block w-2 h-2 rounded-full bg-blue-600 shrink-0" />
                <span className="text-sm font-semibold text-gray-900 tabular-nums">
                  {pickupCount}
                </span>
                <span className="text-xs text-gray-500">Pickup</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="inline-block w-2 h-2 rounded-full bg-gray-400 shrink-0" />
                <span className="text-sm font-semibold text-gray-900 tabular-nums">
                  {walkinCount}
                </span>
                <span className="text-xs text-gray-500">Walk-in</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
