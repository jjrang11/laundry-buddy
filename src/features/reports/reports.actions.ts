'use server'

import { createClient } from '@/lib/supabase/server'
import { getUser } from '@/features/auth/auth.actions'
import { getUserRole } from '@/lib/auth-utils'
import { ORDER_STATUSES } from '@/lib/constants/order-statuses'
import type { Order } from '@/lib/types'

export async function fetchAllReportOrders(
  params: {
    startDate: string
    endDate: string
    status: string
    type: string
  }
): Promise<Order[]> {
  const user = await getUser()
  const role = getUserRole(user)
  if (role !== 'admin') throw new Error('Unauthorized')

  const supabase = await createClient()
  const { startDate, endDate, status, type } = params

  const dayStart = `${startDate}T00:00:00+08:00`
  const dayEnd = `${endDate}T23:59:59+08:00`

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

  const { data, error } = await query
  if (error) throw new Error(error.message)

  return (data as Order[]) ?? []
}
