"use client";

import { BarChart2 } from "lucide-react";
import { PieChart, Pie, Cell } from "recharts";
import { Card, CardContent } from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";

interface OrderStatusChartProps {
  statusBreakdown: Record<string, number>;
}

const STATUS_CHART_COLORS: Record<string, string> = {
  "New Order": "#a78bfa",
  "For Pickup": "#60a5fa",
  "Arrived at Shop": "#34d399",
  Washing: "#38bdf8",
  Drying: "#fb923c",
  "Folding / Ironing": "#f472b6",
  "Ready for Delivery": "#4ade80",
  "Out for Delivery": "#facc15",
  Completed: "#6b7280",
};

const FALLBACK_COLOR = "#d1d5db";

export function OrderStatusChart({ statusBreakdown }: OrderStatusChartProps) {
  const pieData = Object.entries(statusBreakdown)
    .filter(([, count]) => count > 0)
    .map(([status, count]) => ({ name: status, value: count }));

  if (pieData.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center min-h-[180px] gap-2 text-center">
          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gray-100">
            <BarChart2 className="h-5 w-5 text-gray-400" />
          </div>
          <p className="text-sm font-medium text-gray-700">No orders</p>
          <p className="text-xs text-gray-400">
            There are no orders to display.
          </p>
        </CardContent>
      </Card>
    );
  }

  const chartConfig: ChartConfig = Object.fromEntries(
    pieData.map(({ name }) => [
      name,
      { label: name, color: STATUS_CHART_COLORS[name] ?? FALLBACK_COLOR },
    ])
  );

  return (
    <Card>
      <CardContent className="pt-4 pb-2">
        <p className="text-xs font-medium text-gray-500 mb-2">
          Status Breakdown
        </p>
        <div className="flex flex-col sm:flex-row items-center gap-6">
          {/* Legend */}
          <div className="flex flex-col gap-1.5 shrink-0">
            {pieData.map(({ name, value }) => (
              <div key={name} className="flex items-center gap-2">
                <span
                  className="inline-block w-2.5 h-2.5 rounded-full shrink-0"
                  style={{
                    backgroundColor: STATUS_CHART_COLORS[name] ?? FALLBACK_COLOR,
                  }}
                />
                <span className="text-xs text-gray-600 truncate max-w-[120px]">
                  {name}
                </span>
                <span className="ml-auto text-xs font-semibold text-gray-900 tabular-nums pl-2">
                  {value}
                </span>
              </div>
            ))}
          </div>

          {/* Donut chart */}
          <ChartContainer
            config={chartConfig}
            className="h-48 w-full max-w-[200px]"
          >
            <PieChart>
              <ChartTooltip content={<ChartTooltipContent hideLabel />} />
              <Pie
                data={pieData}
                dataKey="value"
                nameKey="name"
                innerRadius={55}
                outerRadius={80}
              >
                {pieData.map((entry) => (
                  <Cell
                    key={entry.name}
                    fill={STATUS_CHART_COLORS[entry.name] ?? FALLBACK_COLOR}
                  />
                ))}
              </Pie>
            </PieChart>
          </ChartContainer>
        </div>
      </CardContent>
    </Card>
  );
}
