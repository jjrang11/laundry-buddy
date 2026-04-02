import { redirect } from 'next/navigation'
import { format, startOfMonth, subMonths } from 'date-fns'
import { getUser } from '@/features/auth/auth.actions'
import { getUserRole } from '@/lib/auth-utils'
import { createClient } from '@/lib/supabase/server'
import { aggregateDaily, aggregateMonthly } from '@/features/reports/reports.utils'
import { parseTransactionParams } from '@/features/reports/reports.params'
import type { Order } from '@/lib/types'
import { ReportsDashboard } from './ReportsDashboard'

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{
    date?: string
    tab?: string
    page?: string
    pageSize?: string
    search?: string
    sortBy?: string
    sortDir?: string
  }>
}) {
  const user = await getUser()
  const role = getUserRole(user)
  if (role !== 'admin') redirect('/dashboard')

  const { date: dateParam, tab, ...paginationRaw } = await searchParams
  const today = format(new Date(), 'yyyy-MM-dd')
  const date = dateParam ?? today
  const defaultTab = tab ?? 'daily'

  const transactionParams = parseTransactionParams(paginationRaw)
  const { page, pageSize, search, sortBy, sortDir } = transactionParams

  const supabase = await createClient()

  const dayStart = `${date}T00:00:00+08:00`
  const dayEnd   = `${date}T23:59:59+08:00`

  // Fetch monthly orders (last 6 months)
  const sixMonthsAgo = startOfMonth(subMonths(new Date(), 5)).toISOString()

  // Build the paginated slice query
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1 // Supabase .range() is inclusive on both ends

  let pageQuery = supabase
    .from('orders')
    .select('*, order_charges(*)', { count: 'exact' })
    .is('deleted_at', null)
    .gte('created_at', dayStart)
    .lte('created_at', dayEnd)

  if (search) {
    pageQuery = pageQuery.ilike('customer_name', `%${search}%`)
  }

  // sortBy is pre-validated by parseTransactionParams — safe to pass directly
  pageQuery = pageQuery.order(sortBy, { ascending: sortDir === 'asc' }).range(from, to)

  const [dailyAllResult, dailyPageResult, monthlyResult] = await Promise.all([
    // Full day — for summary cards via aggregateDaily (unfiltered, unpaginated)
    supabase
      .from('orders')
      .select('*, order_charges(*)')
      .is('deleted_at', null)
      .gte('created_at', dayStart)
      .lte('created_at', dayEnd),
    // Paginated, filtered, sorted slice — for the transactions table
    pageQuery,
    // Monthly — unchanged
    supabase
      .from('orders')
      .select('*, order_charges(*)')
      .is('deleted_at', null)
      .gte('created_at', sixMonthsAgo)
      .order('created_at', { ascending: true }),
  ])

  const dailySummary = aggregateDaily((dailyAllResult.data as Order[]) ?? [])
  const monthlyData = aggregateMonthly((monthlyResult.data as Order[]) ?? [])

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
        <p className="text-sm text-gray-500 mt-1">Revenue and order analytics.</p>
      </div>
      <ReportsDashboard
        dailySummary={dailySummary}
        dailyPage={(dailyPageResult.data as Order[]) ?? []}
        dailyTotalCount={dailyPageResult.count ?? 0}
        transactionParams={transactionParams}
        monthlyData={monthlyData}
        date={date}
        defaultTab={defaultTab}
      />
    </div>
  )
}
