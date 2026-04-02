'use client'

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Cell, type MouseHandlerDataParam } from 'recharts'
import { Card, CardContent } from '@/components/ui/card'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart'
import type { MonthlySummary } from '@/features/reports/reports.types'

interface MonthlyBarChartProps {
  data: MonthlySummary[]
  dataKey: 'totalRevenue' | 'totalOrders'
  title: string
  color: string
  activeColor: string
  selectedMonthIndex: number
  onMonthSelect: (index: number) => void
  formatValue?: (value: number) => string
}

export function MonthlyBarChart({
  data,
  dataKey,
  title,
  color,
  activeColor,
  selectedMonthIndex,
  onMonthSelect,
  formatValue,
}: MonthlyBarChartProps) {
  const chartConfig: ChartConfig = {
    [dataKey]: { label: title, color },
  }

  return (
    <Card>
      <CardContent className="pt-4 pb-2">
        <p className="text-xs font-medium text-gray-500 mb-2">{title}</p>
        <ChartContainer config={chartConfig} className="h-48 w-full">
          <BarChart
            data={data}
            margin={{ top: 4, right: 4, left: 0, bottom: 0 }}
            onClick={(chartData: MouseHandlerDataParam) => {
              const idx = chartData?.activeTooltipIndex
              if (typeof idx === 'number') {
                onMonthSelect(idx)
              }
            }}
            style={{ cursor: 'pointer' }}
          >
            <CartesianGrid vertical={false} strokeDasharray="3 3" />
            <XAxis dataKey="label" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis hide={true} />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  formatter={
                    formatValue
                      ? (value) => {
                          const num = typeof value === 'number' ? value : Number(value)
                          return formatValue(num)
                        }
                      : undefined
                  }
                />
              }
            />
            <Bar
              dataKey={dataKey}
              radius={[4, 4, 0, 0]}
            >
              {data.map((_entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={index === selectedMonthIndex ? activeColor : color}
                />
              ))}
            </Bar>
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
