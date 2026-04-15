'use client'

import { Bar, Line, ComposedChart, XAxis, YAxis, CartesianGrid, Legend } from 'recharts'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { formatCurrency } from '@/lib/utils'
import type { DayDataPoint } from './reports.types'

interface Props { data: DayDataPoint[] }

const config = {
  revenue: { label: 'Revenue', color: '#2563eb' },
  orders: { label: 'Orders', color: '#94a3b8' },
}

export function RevenueVolumeChart({ data }: Props) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4">
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-gray-900">Revenue & Volume</h3>
        <p className="text-xs text-gray-500 mt-0.5">Daily revenue (bars) and order count (line)</p>
      </div>
      <ChartContainer config={config} className="h-[220px] w-full">
        <ComposedChart data={data} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 11, fill: '#9ca3af' }}
            tickLine={false}
            axisLine={false}
            interval="preserveStartEnd"
          />
          <YAxis
            yAxisId="revenue"
            orientation="left"
            tick={{ fontSize: 11, fill: '#9ca3af' }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v) => `₱${(v / 1000).toFixed(0)}k`}
            width={48}
          />
          <YAxis
            yAxisId="orders"
            orientation="right"
            tick={{ fontSize: 11, fill: '#9ca3af' }}
            tickLine={false}
            axisLine={false}
            width={32}
          />
          <ChartTooltip
            content={
              <ChartTooltipContent
                formatter={(value, name) =>
                  name === 'revenue' ? formatCurrency(Number(value)) : String(value)
                }
              />
            }
          />
          <Bar
            yAxisId="revenue"
            dataKey="revenue"
            fill="#2563eb"
            radius={[3, 3, 0, 0]}
            maxBarSize={32}
            opacity={0.85}
          />
          <Line
            yAxisId="orders"
            dataKey="orders"
            stroke="#94a3b8"
            strokeWidth={2}
            dot={false}
          />
          <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
        </ComposedChart>
      </ChartContainer>
    </div>
  )
}
