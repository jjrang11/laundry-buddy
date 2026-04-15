import { redirect } from 'next/navigation'
import { format, startOfMonth, endOfMonth } from 'date-fns'
import { getUser } from '@/features/auth/auth.actions'
import { getUserRole } from '@/lib/auth-utils'
import { createClient } from '@/lib/supabase/server'
import { aggregateAnalytics } from '@/features/reports/reports.utils'
import { parseReportParams } from '@/features/reports/reports.params'
import { getShopBranding } from '@/features/settings/branding.actions'
import { ORDER_STATUSES } from '@/lib/constants/order-statuses'
import type { Order } from '@/lib/types'
import { ReportsView } from '@/features/reports/ReportsView'

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const user = await getUser()
  const role = getUserRole(user)
  if (role !== 'admin') redirect('/dashboard')

  const now = new Date()
  const defaultStartDate = format(startOfMonth(now), 'yyyy-MM-dd')
  const defaultEndDate = format(endOfMonth(now), 'yyyy-MM-dd')

  const raw = await searchParams
  const params = parseReportParams(raw, defaultStartDate, defaultEndDate)
  const { startDate, endDate, status, type } = params

  const supabase = await createClient()

  const dayStart = `${startDate}T00:00:00+08:00`
  const dayEnd   = `${endDate}T23:59:59+08:00`

  let query = supabase
    .from('orders')
    .select('*, order_charges(*)')
    .is('deleted_at', null)
    .gte('created_at', dayStart)
    .lte('created_at', dayEnd)

  if (status !== 'all' && (ORDER_STATUSES as readonly string[]).includes(status)) {
    query = query.eq('status', status)
  }
  if (type !== 'all') {
    query = query.eq('order_type', type)
  }

  const [{ data }, branding] = await Promise.all([query, getShopBranding()])
  const analytics = aggregateAnalytics((data as Order[]) ?? [], startDate, endDate)
  const shopName = branding.shop_name ?? 'Laundry Buddy'

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
        <p className="text-sm text-gray-500 mt-1">Revenue and order analytics.</p>
      </div>
      <ReportsView analytics={analytics} params={params} shopName={shopName} />
    </div>
  )
}
