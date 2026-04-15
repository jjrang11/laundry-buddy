'use client'

import { PieChart, Pie, Cell, Tooltip, Legend } from 'recharts'
import { ChartContainer } from '@/components/ui/chart'
import type { StatusDataPoint } from './reports.types'

const STATUS_CHART_COLORS: Record<string, string> = {
  'New Order':           '#64748b',
  'For Pickup':          '#f59e0b',
  'Arrived at Shop':     '#0ea5e9',
  'Processing':          '#f97316',
  'Ready for Delivery':  '#14b8a6',
  'Out for Delivery':    '#06b6d4',
  'Completed':           '#10b981',
}

const DEFAULT_COLOR = '#e5e7eb'

interface Props { data: StatusDataPoint[] }

export function StatusDistributionChart({ data }: Props) {
  const config = Object.fromEntries(
    data.map((d) => [
      d.status,
      { label: d.status, color: STATUS_CHART_COLORS[d.status] ?? DEFAULT_COLOR },
    ])
  )

  if (data.length === 0) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-4 flex items-center justify-center h-[280px]">
        <p className="text-sm text-gray-400">No data</p>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4">
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-gray-900">Order Status</h3>
        <p className="text-xs text-gray-500 mt-0.5">Distribution across all statuses</p>
      </div>
      <ChartContainer config={config} className="h-[200px] w-full">
        <PieChart>
          <Pie
            data={data}
            dataKey="count"
            nameKey="status"
            cx="50%"
            cy="50%"
            innerRadius="45%"
            outerRadius="70%"
            paddingAngle={2}
          >
            {data.map((entry) => (
              <Cell
                key={entry.status}
                fill={STATUS_CHART_COLORS[entry.status] ?? DEFAULT_COLOR}
                stroke="none"
              />
            ))}
          </Pie>
          <Tooltip
            formatter={(value, name) => [value, name]}
            contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e5e7eb' }}
          />
          <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
        </PieChart>
      </ChartContainer>
    </div>
  )
}
