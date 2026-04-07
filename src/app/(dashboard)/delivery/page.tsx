import { createClient } from '@/lib/supabase/server'
import { getUser } from '@/features/auth/auth.actions'
import { getUserShopId } from '@/lib/auth-utils'
import { DeliveryBoard } from '@/features/delivery/DeliveryBoard'
import type { Order } from '@/lib/types'

export default async function DeliveryPage() {
  const supabase = await createClient()
  const user = await getUser()
  const shopId = getUserShopId(user) ?? ''

  const { data } = await supabase
    .from('orders')
    .select('*, order_charges(*)')
    .in('status', ['Ready for Delivery', 'Out for Delivery'])
    .is('deleted_at', null)
    .order('updated_at', { ascending: true })

  const orders = (data ?? []) as Order[]
  const readyOrders = orders.filter((o) => o.status === 'Ready for Delivery')
  const outOrders = orders.filter((o) => o.status === 'Out for Delivery')

  return <DeliveryBoard readyOrders={readyOrders} outOrders={outOrders} shopId={shopId} />
}
