'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { format, parseISO } from 'date-fns'
import { Calendar as CalendarIcon } from 'lucide-react'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover'
import { ReportSummaryCards } from '@/features/reports/ReportSummaryCards'
import { DailyTransactionsTable } from '@/features/reports/DailyTransactionsTable'
import type { DailySummary } from '@/features/reports/reports.types'
import type { TransactionParams } from '@/features/reports/reports.params'
import type { Order } from '@/lib/types'

interface DailyReportViewProps {
  summary: DailySummary
  date: string // "YYYY-MM-DD"
  orders: Order[]
  totalCount: number
  transactionParams: TransactionParams
}

export function DailyReportView({ summary, date, orders, totalCount, transactionParams }: DailyReportViewProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)

  return (
    <div>
      {/* Date picker row */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-gray-500">
          Showing results for{' '}
          <span className="font-medium text-gray-900">
            {format(parseISO(date), 'MMMM d, yyyy')}
          </span>
        </p>
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            <CalendarIcon className="h-4 w-4 text-gray-400" />
            Change date
          </PopoverTrigger>
          <PopoverContent side="bottom" align="end" sideOffset={4}>
            <Calendar
              mode="single"
              selected={parseISO(date)}
              onSelect={(selectedDate) => {
                if (selectedDate) {
                  setOpen(false)
                  router.push(
                    `/reports?tab=daily&date=${format(selectedDate, 'yyyy-MM-dd')}`
                  )
                }
              }}
              disabled={(d) => d > new Date()}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      </div>

      {/* Summary cards */}
      <ReportSummaryCards
        totalRevenue={summary.totalRevenue}
        totalOrders={summary.totalOrders}
        totalWeight={summary.totalWeight}
        pickupCount={summary.pickupCount}
        walkinCount={summary.walkinCount}
      />

      {/* Transactions table */}
      <DailyTransactionsTable
        orders={orders}
        totalCount={totalCount}
        transactionParams={transactionParams}
      />
    </div>
  )
}
