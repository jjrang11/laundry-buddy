"use client";

import { useState } from "react";
import { ReportSummaryCards } from "@/features/reports/ReportSummaryCards";
import { MonthlyBarChart } from "@/features/reports/MonthlyBarChart";
import { OrderTypeChart } from "@/features/reports/OrderTypeChart";
import { OrderStatusChart } from "@/features/reports/OrderStatusChart";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatCurrency } from "@/lib/utils";
import type { MonthlySummary } from "@/features/reports/reports.types";

interface MonthlyReportViewProps {
  data: MonthlySummary[]; // 6 items, oldest first, newest last
}

export function MonthlyReportView({ data }: MonthlyReportViewProps) {
  const [selectedIndex, setSelectedIndex] = useState(data.length - 1);

  const selected = data[selectedIndex];

  return (
    <div>
      {/* Month filter row */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-gray-500">
          Showing results for{" "}
          <span className="font-medium text-gray-900">{selected.label}</span>
        </p>
        <Select
          value={String(selectedIndex)}
          onValueChange={(val) => setSelectedIndex(Number(val))}
        >
          <SelectTrigger size="default">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {data.map((item, index) => (
              <SelectItem key={item.month} value={String(index)}>
                {item.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Summary cards for selected month */}
      <ReportSummaryCards
        totalRevenue={selected.totalRevenue}
        totalOrders={selected.totalOrders}
        totalWeight={selected.totalWeight}
        pickupCount={selected.pickupCount}
        walkinCount={selected.walkinCount}
      />
      {/* Pie charts row */}
      <div className="mt-4 flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <OrderStatusChart statusBreakdown={selected.statusBreakdown} />
        </div>
        <div className="flex-1">
          <OrderTypeChart
            pickupCount={selected.pickupCount}
            walkinCount={selected.walkinCount}
          />
        </div>
      </div>

      {/* Bar charts */}
      <div className="mt-6 space-y-4">
        <MonthlyBarChart
          title="Revenue by Month"
          dataKey="totalRevenue"
          color="#2563eb"
          activeColor="#1d4ed8"
          data={data}
          selectedMonthIndex={selectedIndex}
          onMonthSelect={setSelectedIndex}
          formatValue={formatCurrency}
        />
        <MonthlyBarChart
          title="Orders by Month"
          dataKey="totalOrders"
          color="#93c5fd"
          activeColor="#2563eb"
          data={data}
          selectedMonthIndex={selectedIndex}
          onMonthSelect={setSelectedIndex}
        />
      </div>

      <p className="text-xs text-gray-400 text-center mt-2">
        Click a bar to view that month&apos;s summary
      </p>
    </div>
  );
}
