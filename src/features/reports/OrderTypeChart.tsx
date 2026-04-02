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

interface OrderTypeChartProps {
  pickupCount: number;
  walkinCount: number;
}

const PICKUP_COLOR = "#2563eb";
const WALKIN_COLOR = "#9ca3af";

const chartConfig: ChartConfig = {
  pickup: { label: "Pickup", color: PICKUP_COLOR },
  walkin: { label: "Walk-in", color: WALKIN_COLOR },
};

export function OrderTypeChart({
  pickupCount,
  walkinCount,
}: OrderTypeChartProps) {
  const totalOrders = pickupCount + walkinCount;

  if (totalOrders === 0) {
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

  const data = [
    { name: "pickup", value: pickupCount },
    { name: "walkin", value: walkinCount },
  ];

  return (
    <Card>
      <CardContent className="pt-4 pb-2">
        <p className="text-xs font-medium text-gray-500 mb-2">Order Types</p>
        {/* Legend */}
        <div className="flex flex-col sm:flex-row items-center gap-6">
          <div className="flex flex-col gap-1.5 shrink-0">
            <div className="flex items-center gap-2">
              <span
                className="inline-block w-2.5 h-2.5 rounded-full shrink-0"
                style={{ backgroundColor: PICKUP_COLOR }}
              />
              <span className="text-xs text-gray-600 truncate max-w-[120px]">
                Pickup
              </span>
              <span className="ml-auto text-xs font-semibold text-gray-900 tabular-nums pl-2">
                {pickupCount}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span
                className="inline-block w-2.5 h-2.5 rounded-full shrink-0"
                style={{ backgroundColor: WALKIN_COLOR }}
              />
              <span className="text-xs text-gray-600 truncate max-w-[120px]">
                Walk-in
              </span>
              <span className="ml-auto text-xs font-semibold text-gray-900 tabular-nums pl-2">
                {walkinCount}
              </span>
            </div>
          </div>

          {/* Donut chart */}
          <ChartContainer
            config={chartConfig}
            className="h-48 w-full max-w-[200px]"
          >
            <PieChart>
              <ChartTooltip content={<ChartTooltipContent hideLabel />} />
              <Pie
                data={data}
                dataKey="value"
                nameKey="name"
                innerRadius={55}
                outerRadius={80}
              >
                {data.map((entry) => (
                  <Cell
                    key={entry.name}
                    fill={entry.name === "pickup" ? PICKUP_COLOR : WALKIN_COLOR}
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
