'use server'

import { createClient } from '@/lib/supabase/server'
import { getUser } from '@/features/auth/auth.actions'
import { ORDER_STATUSES } from '@/lib/constants/order-statuses'
import type { Order } from '@/lib/types'
import type { OrdersParams } from '@/app/(dashboard)/orders/orders.params'

export async function fetchAllOrdersForExport(
  params: Pick<OrdersParams, 'search' | 'status' | 'type' | 'showDeleted' | 'startDate' | 'endDate'>
): Promise<Order[]> {
  const user = await getUser()
  if (!user) throw new Error('Unauthorized')

  const supabase = await createClient()
  const { search, status, type, showDeleted, startDate, endDate } = params

  let query = supabase
    .from('orders')
    .select('*, order_charges(*)')
    .order('created_at', { ascending: false })

  if (!showDeleted) {
    query = query.is('deleted_at', null)
  }

  if (startDate) {
    query = query.gte('created_at', `${startDate}T00:00:00+08:00`)
  }
  if (endDate) {
    query = query.lte('created_at', `${endDate}T23:59:59+08:00`)
  }

  if (search) {
    query = query.ilike('customer_name', `%${search}%`)
  }

  if (status !== 'all' && (ORDER_STATUSES as readonly string[]).includes(status)) {
    query = query.eq('status', status)
  }

  if (type !== 'all') {
    query = query.eq('order_type', type)
  }

  const { data, error } = await query
  if (error) throw new Error(error.message)

  return (data as Order[]) ?? []
}
