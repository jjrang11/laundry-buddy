import { redirect } from 'next/navigation'
import { getUser } from '@/features/auth/auth.actions'
import { getUserRole } from '@/lib/auth-utils'
import { createClient } from '@/lib/supabase/server'
import { parseOrdersParams } from './orders.params'
import type { Order } from '@/lib/types'
import { OrdersTable } from './OrdersTable'

export default async function AllOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{
    page?: string
    pageSize?: string
    search?: string
    status?: string
    type?: string
    showDeleted?: string
  }>
}) {
  const user = await getUser()
  if (!user) redirect('/login')

  const role = getUserRole(user)

  const ordersParams = parseOrdersParams(await searchParams)
  const { page, pageSize, search, status, type, showDeleted } = ordersParams

  const supabase = await createClient()

  const from = (page - 1) * pageSize
  const to = from + pageSize - 1 // Supabase .range() is inclusive on both ends

  let query = supabase
    .from('orders')
    .select('*, order_charges(*)', { count: 'exact' })
    .order('created_at', { ascending: false })

  if (!showDeleted) {
    query = query.is('deleted_at', null)
  }

  if (search) {
    query = query.ilike('customer_name', `%${search}%`)
  }
  if (status !== 'all') {
    query = query.eq('status', status)
  }
  if (type !== 'all') {
    query = query.eq('order_type', type)
  }

  query = query.range(from, to)

  const { data, count, error } = await query

  if (error) {
    return (
      <div className="flex items-center justify-center h-64 text-sm text-red-500">
        Failed to load orders: {error.message}
      </div>
    )
  }

  return (
    <div className="overflow-y-auto h-full">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">All Orders</h1>
          <p className="text-sm text-gray-500 mt-1">Browse and search every order.</p>
        </div>
        <OrdersTable
          orders={(data as Order[]) ?? []}
          totalCount={count ?? 0}
          ordersParams={ordersParams}
          userRole={role}
        />
      </div>
    </div>
  )
}
