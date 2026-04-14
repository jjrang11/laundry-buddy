import { createClient } from '@/lib/supabase/server'
import { getUser } from '@/features/auth/auth.actions'
import { getUserRole, getUserShopId } from '@/lib/auth-utils'
import { KanbanBoard } from '@/features/kanban/KanbanBoard'
import type { Order } from '@/lib/types'

export default async function DashboardPage() {
  const [supabase, user] = await Promise.all([createClient(), getUser()])

  const userRole = getUserRole(user)
  const shopId = getUserShopId(user) ?? ''

  const { data, error } = await supabase
    .from('orders')
    .select('*, order_charges(*)')
    .is('deleted_at', null)
    .order('created_at', { ascending: true })

  if (error) {
    return (
      <div className="flex items-center justify-center h-64 text-sm text-red-500">
        Failed to load orders: {error.message}
      </div>
    )
  }

  return <KanbanBoard initialOrders={(data as Order[]) ?? []} userRole={userRole} shopId={shopId} />
}
