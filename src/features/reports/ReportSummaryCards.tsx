'use client'

import { PhilippinePeso, ShoppingBag, Weight, CheckCircle2, TrendingUp, BarChart3 } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import type { DailySummary } from './reports.types'

interface ReportSummaryCardsProps {
  summary: DailySummary
}

export function ReportSummaryCards({ summary }: ReportSummaryCardsProps) {
  const {
    totalRevenue,
    totalOrders,
    totalWeight,
    completedCount,
    avgOrderValue,
    completionRate,
  } = summary

  const cards = [
    {
      label: 'Revenue',
      value: formatCurrency(totalRevenue),
      icon: PhilippinePeso,
      iconClass: 'bg-blue-50 text-blue-600',
    },
    {
      label: 'Orders',
      value: String(totalOrders),
      icon: ShoppingBag,
      iconClass: 'bg-blue-50 text-blue-600',
    },
    {
      label: 'Completed',
      value: String(completedCount),
      icon: CheckCircle2,
      iconClass: 'bg-emerald-50 text-emerald-600',
    },
    {
      label: 'Weight',
      value: `${totalWeight.toFixed(1)} kg`,
      icon: Weight,
      iconClass: 'bg-blue-50 text-blue-600',
    },
    {
      label: 'Avg Order',
      value: completedCount > 0 ? formatCurrency(avgOrderValue) : '—',
      icon: TrendingUp,
      iconClass: 'bg-purple-50 text-purple-600',
    },
    {
      label: 'Completion Rate',
      value: `${completionRate.toFixed(1)}%`,
      icon: BarChart3,
      iconClass: 'bg-blue-50 text-blue-600',
    },
  ]

  return (
    <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
      {cards.map((card) => {
        const Icon = card.icon
        return (
          <div
            key={card.label}
            className="rounded-xl border border-gray-100 bg-white p-4 ring-1 ring-foreground/10"
          >
            <div className="flex flex-col gap-2">
              <div
                className={`flex items-center justify-center w-8 h-8 rounded-lg shrink-0 ${card.iconClass}`}
              >
                <Icon className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">
                  {card.label}
                </p>
                <p className="text-xl font-bold text-gray-900 tabular-nums mt-0.5 leading-tight">
                  {card.value}
                </p>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
