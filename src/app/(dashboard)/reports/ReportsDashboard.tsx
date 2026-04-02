'use client'

import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { DailyReportView } from '@/features/reports/DailyReportView'
import { MonthlyReportView } from '@/features/reports/MonthlyReportView'
import type { DailySummary, MonthlySummary } from '@/features/reports/reports.types'
import type { TransactionParams } from '@/features/reports/reports.params'
import type { Order } from '@/lib/types'

interface ReportsDashboardProps {
  dailySummary: DailySummary
  dailyPage: Order[]
  dailyTotalCount: number
  transactionParams: TransactionParams
  monthlyData: MonthlySummary[]
  date: string        // "YYYY-MM-DD"
  defaultTab: string  // "daily" or "monthly"
}

export function ReportsDashboard({
  dailySummary,
  dailyPage,
  dailyTotalCount,
  transactionParams,
  monthlyData,
  date,
  defaultTab,
}: ReportsDashboardProps) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
      <Tabs defaultValue={defaultTab}>
        <div className="px-6 py-3 border-b border-gray-100 flex items-center">
          <TabsList className="bg-gray-100 p-[3px] rounded-md h-auto gap-0 w-fit">
            <TabsTrigger
              value="daily"
              className="rounded-[4px] px-4 py-1.5 text-sm font-medium text-gray-500 transition-all duration-150 data-active:bg-white data-active:text-gray-900 data-active:shadow-sm data-active:shadow-gray-200/80 hover:text-gray-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40 focus-visible:ring-offset-1"
            >
              Daily
            </TabsTrigger>
            <TabsTrigger
              value="monthly"
              className="rounded-[4px] px-4 py-1.5 text-sm font-medium text-gray-500 transition-all duration-150 data-active:bg-white data-active:text-gray-900 data-active:shadow-sm data-active:shadow-gray-200/80 hover:text-gray-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40 focus-visible:ring-offset-1"
            >
              Monthly
            </TabsTrigger>
          </TabsList>
        </div>
        <TabsContent value="daily" className="mt-0 px-6 py-6">
          <DailyReportView
            summary={dailySummary}
            date={date}
            orders={dailyPage}
            totalCount={dailyTotalCount}
            transactionParams={transactionParams}
          />
        </TabsContent>
        <TabsContent value="monthly" className="mt-0 px-6 py-6">
          <MonthlyReportView data={monthlyData} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
