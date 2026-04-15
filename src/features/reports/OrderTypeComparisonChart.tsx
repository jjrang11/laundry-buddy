'use client'

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend } from 'recharts'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { formatCurrency } from '@/lib/utils'
import type { OrderTypeDataPoint } from './reports.types'

interface Props { data: OrderTypeDataPoint[] }

const config = {
  count: { label: 'Orders', color: '#2563eb' },
  revenue: { label: 'Revenue', color: '#10b981' },
}

export function OrderTypeComparisonChart({ data }: Props) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4">
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-gray-900">Pickup vs Walk-in</h3>
        <p className="text-xs text-gray-500 mt-0.5">Order count and revenue by type</p>
      </div>
      <ChartContainer config={config} className="h-[200px] w-full">
        <BarChart data={data} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
          <XAxis
            dataKey="type"
            tick={{ fontSize: 11, fill: '#9ca3af' }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            yAxisId="count"
            orientation="left"
            tick={{ fontSize: 11, fill: '#9ca3af' }}
            tickLine={false}
            axisLine={false}
            width={32}
          />
          <YAxis
            yAxisId="revenue"
            orientation="right"
            tick={{ fontSize: 11, fill: '#9ca3af' }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v) => `₱${(v / 1000).toFixed(0)}k`}
            width={48}
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
            yAxisId="count"
            dataKey="count"
            fill="#2563eb"
            radius={[3, 3, 0, 0]}
            maxBarSize={48}
            opacity={0.85}
          />
          <Bar
            yAxisId="revenue"
            dataKey="revenue"
            fill="#10b981"
            radius={[3, 3, 0, 0]}
            maxBarSize={48}
            opacity={0.85}
          />
          <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
        </BarChart>
      </ChartContainer>
    </div>
  )
}
