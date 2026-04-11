'use client'

import { useState, useCallback, useMemo, useTransition } from 'react'
import { format, parseISO, startOfMonth, endOfMonth } from 'date-fns'
import { CalendarIcon, X } from 'lucide-react'
import { useRouter, usePathname } from 'next/navigation'
import { Calendar } from '@/components/ui/calendar'
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ReportSummaryCards } from '@/features/reports/ReportSummaryCards'
import { ReportPDFDownload } from '@/features/reports/ReportPDFDownload'
import { RevenueVolumeChart } from '@/features/reports/RevenueVolumeChart'
import { StatusDistributionChart } from '@/features/reports/StatusDistributionChart'
import { OrderTypeComparisonChart } from '@/features/reports/OrderTypeComparisonChart'
import { ORDER_STATUSES } from '@/lib/constants/order-statuses'
import { useTableNavigation } from '@/lib/hooks/useTableNavigation'
import type { ReportAnalytics } from '@/features/reports/reports.types'
import type { ReportParams } from '@/features/reports/reports.params'

interface ReportsViewProps {
  analytics: ReportAnalytics
  params: ReportParams
  shopName: string
}

export function ReportsView({ analytics, params, shopName }: ReportsViewProps) {
  const { startDate, endDate, status, type } = params
  const { navigate, isPending } = useTableNavigation()
  const router = useRouter()
  const pathname = usePathname()
  const [, startResetTransition] = useTransition()
  const [startOpen, setStartOpen] = useState(false)
  const [endOpen, setEndOpen] = useState(false)

  // Compute default date range (current month) for reset comparison
  const defaultStartDate = useMemo(
    () => format(startOfMonth(new Date()), 'yyyy-MM-dd'),
    []
  )
  const defaultEndDate = useMemo(
    () => format(endOfMonth(new Date()), 'yyyy-MM-dd'),
    []
  )

  const isFiltered =
    startDate !== defaultStartDate ||
    endDate !== defaultEndDate ||
    status !== 'all' ||
    type !== 'all'

  const handleReset = useCallback(() => {
    startResetTransition(() => {
      router.push(pathname)
    })
  }, [router, pathname])

  // Derive human-readable labels for the select triggers
  const statusLabel = status === 'all' ? 'All statuses' : status
  const typeLabel =
    type === 'all' ? 'All types' : type === 'pickup' ? 'Pickup' : 'Walk-in'

  return (
    <div>
      {/* Summary cards */}
      <ReportSummaryCards summary={analytics.summary} />

      {/* Filter bar */}
      <div className="mt-6 rounded-xl border border-gray-200 bg-white px-4 py-3">
        <div className="flex flex-wrap items-center gap-2 justify-between">
          <div className="flex flex-wrap items-center gap-2">
            {/* Start Date */}
            <Popover open={startOpen} onOpenChange={setStartOpen}>
              <PopoverTrigger className="flex items-center gap-1.5 px-3 h-8 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors whitespace-nowrap">
                <CalendarIcon className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                {format(parseISO(startDate), 'MMM d, yyyy')}
              </PopoverTrigger>
              <PopoverContent side="bottom" align="start" sideOffset={4}>
                <p className="text-xs text-gray-500 font-medium mb-2 uppercase tracking-wide px-1">
                  Start date
                </p>
                <Calendar
                  mode="single"
                  selected={parseISO(startDate)}
                  onSelect={(date) => {
                    if (date) {
                      setStartOpen(false)
                      navigate({ startDate: format(date, 'yyyy-MM-dd') })
                    }
                  }}
                  disabled={(d) => d > new Date()}
                  initialFocus
                />
              </PopoverContent>
            </Popover>

            <span className="text-xs text-gray-400">to</span>

            {/* End Date */}
            <Popover open={endOpen} onOpenChange={setEndOpen}>
              <PopoverTrigger className="flex items-center gap-1.5 px-3 h-8 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors whitespace-nowrap">
                <CalendarIcon className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                {format(parseISO(endDate), 'MMM d, yyyy')}
              </PopoverTrigger>
              <PopoverContent side="bottom" align="start" sideOffset={4}>
                <p className="text-xs text-gray-500 font-medium mb-2 uppercase tracking-wide px-1">
                  End date
                </p>
                <Calendar
                  mode="single"
                  selected={parseISO(endDate)}
                  onSelect={(date) => {
                    if (date) {
                      setEndOpen(false)
                      navigate({ endDate: format(date, 'yyyy-MM-dd') })
                    }
                  }}
                  disabled={(d) => d > new Date()}
                  initialFocus
                />
              </PopoverContent>
            </Popover>

            <div className="w-px h-5 bg-gray-200 mx-1" />

            {/* Status */}
            <Select
              value={status}
              onValueChange={(val) => navigate({ status: val })}
            >
              <SelectTrigger className="h-8 text-sm w-44">
                <SelectValue>{statusLabel}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" label="All statuses">
                  All statuses
                </SelectItem>
                {ORDER_STATUSES.map((s) => (
                  <SelectItem key={s} value={s} label={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Type */}
            <Select
              value={type}
              onValueChange={(val) => navigate({ type: val })}
            >
              <SelectTrigger className="h-8 text-sm w-32">
                <SelectValue>{typeLabel}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" label="All types">
                  All types
                </SelectItem>
                <SelectItem value="pickup" label="Pickup">
                  Pickup
                </SelectItem>
                <SelectItem value="walkin" label="Walk-in">
                  Walk-in
                </SelectItem>
              </SelectContent>
            </Select>

            {/* Reset filters */}
            {isFiltered && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleReset}
                disabled={isPending}
                className="h-8 px-2.5 text-xs text-gray-500 hover:text-gray-900 gap-1"
              >
                <X className="h-3.5 w-3.5" />
                Reset
              </Button>
            )}
          </div>

          {/* Download PDF */}
          <ReportPDFDownload analytics={analytics} params={params} shopName={shopName} />
        </div>
      </div>

      {/* Charts grid */}
      <div className="mt-6 space-y-4">
        <RevenueVolumeChart data={analytics.dailyTrend} />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <StatusDistributionChart data={analytics.statusDistribution} />
          <OrderTypeComparisonChart data={analytics.orderTypeComparison} />
        </div>
      </div>
    </div>
  )
}
