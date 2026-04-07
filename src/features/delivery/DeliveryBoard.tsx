'use client'

import { useState, useTransition, useEffect } from 'react'
import { CheckCircle2, Package, Phone, MapPin, Scale } from 'lucide-react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { updateOrderStatus } from '@/features/orders/orders.actions'
import type { Order } from '@/lib/types'

const DELIVERY_STATUSES = new Set(['Ready for Delivery', 'Out for Delivery'])

interface DeliveryBoardProps {
  readyOrders: Order[]
  outOrders: Order[]
  shopId: string
}

function formatCurrency(amount: number | null) {
  if (amount == null) return '—'
  return new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(amount)
}

function OrderCard({
  order,
  actionLabel,
  accentClass,
  buttonClass,
  isPending,
  onAction,
}: {
  order: Order
  actionLabel: string
  accentClass: string
  buttonClass: string
  isPending: boolean
  onAction: () => void
}) {
  return (
    <div className="relative bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex">
      <div className={`w-1 shrink-0 ${accentClass}`} />
      <div className="flex-1 p-4 flex flex-col gap-3">
        <div className="flex items-start justify-between gap-2">
          <p className="font-semibold text-gray-900 text-sm leading-tight">{order.customer_name}</p>
          <p className="text-sm font-bold text-gray-800 shrink-0">{formatCurrency(order.total_price)}</p>
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
          {order.address && (
            <span className="flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              {order.address}
            </span>
          )}
          {order.contact_number && (
            <span className="flex items-center gap-1">
              <Phone className="h-3 w-3" />
              {order.contact_number}
            </span>
          )}
          {order.weight && (
            <span className="flex items-center gap-1">
              <Scale className="h-3 w-3" />
              {order.weight} kg
            </span>
          )}
        </div>
        <button
          disabled={isPending}
          onClick={onAction}
          className={`self-start px-4 py-1.5 rounded-full text-xs font-semibold transition-opacity disabled:opacity-50 ${buttonClass}`}
        >
          {isPending ? 'Updating…' : actionLabel}
        </button>
      </div>
    </div>
  )
}

function Section({
  title,
  subtitle,
  icon: Icon,
  iconClass,
  accentClass,
  buttonClass,
  orders,
  actionLabel,
  nextStatus,
  pendingId,
  onAction,
}: {
  title: string
  subtitle: string
  icon: React.ElementType
  iconClass: string
  accentClass: string
  buttonClass: string
  orders: Order[]
  actionLabel: string
  nextStatus: 'Out for Delivery' | 'Completed'
  pendingId: string | null
  onAction: (id: string, status: 'Out for Delivery' | 'Completed') => void
}) {
  return (
    <section>
      <div className="flex items-center gap-2 mb-4">
        <Icon className={`h-5 w-5 ${iconClass}`} />
        <div>
          <h2 className="text-sm font-semibold text-gray-900">{title}</h2>
          <p className="text-xs text-gray-400">{subtitle}</p>
        </div>
        <span className="ml-auto text-xs font-medium bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
          {orders.length}
        </span>
      </div>

      {orders.length === 0 ? (
        <p className="text-sm text-gray-400 py-8 text-center border border-dashed border-gray-200 rounded-xl">
          No orders here yet.
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {orders.map((order) => (
            <OrderCard
              key={order.id}
              order={order}
              accentClass={accentClass}
              buttonClass={buttonClass}
              actionLabel={actionLabel}
              isPending={pendingId === order.id}
              onAction={() => onAction(order.id, nextStatus)}
            />
          ))}
        </div>
      )}
    </section>
  )
}

export function DeliveryBoard({ readyOrders, outOrders, shopId }: DeliveryBoardProps) {
  const [, startTransition] = useTransition()
  const [pendingId, setPendingId] = useState<string | null>(null)
  const [orders, setOrders] = useState<Order[]>([...readyOrders, ...outOrders])

  // Sync state when server re-renders with fresh props
  useEffect(() => {
    setOrders([...readyOrders, ...outOrders])
  }, [readyOrders, outOrders])

  // Supabase real-time subscription
  useEffect(() => {
    const supabase = createClient()

    const channel = supabase
      .channel('delivery-realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'orders', filter: `shop_id=eq.${shopId}` },
        async (payload) => {
          const incoming = payload.new as Order
          if (!DELIVERY_STATUSES.has(incoming.status)) return
          const { data } = await supabase
            .from('orders')
            .select('*, order_charges(*)')
            .is('deleted_at', null)
            .eq('id', incoming.id)
            .single()
          const newOrder = (data as Order) ?? incoming
          setOrders((prev) =>
            prev.some((o) => o.id === newOrder.id) ? prev : [...prev, newOrder]
          )
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'orders', filter: `shop_id=eq.${shopId}` },
        async (payload) => {
          const id = (payload.new as Order).id
          const { data } = await supabase
            .from('orders')
            .select('*, order_charges(*)')
            .eq('id', id)
            .single()
          if (!data || data.deleted_at || !DELIVERY_STATUSES.has(data.status)) {
            setOrders((prev) => prev.filter((o) => o.id !== id))
            return
          }
          const updated = data as Order
          setOrders((prev) => {
            const exists = prev.some((o) => o.id === updated.id)
            return exists
              ? prev.map((o) => (o.id === updated.id ? updated : o))
              : [...prev, updated]
          })
        }
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'orders' },
        (payload) => {
          const deleted = payload.old as { id: string }
          setOrders((prev) => prev.filter((o) => o.id !== deleted.id))
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [shopId])

  const liveReady = orders.filter((o) => o.status === 'Ready for Delivery')
  const liveOut = orders.filter((o) => o.status === 'Out for Delivery')

  function handleAction(orderId: string, nextStatus: 'Out for Delivery' | 'Completed') {
    setPendingId(orderId)
    startTransition(async () => {
      try {
        await updateOrderStatus(orderId, nextStatus)
        toast.success(
          nextStatus === 'Out for Delivery' ? 'Order loaded to car.' : 'Order marked as completed.'
        )
      } catch {
        toast.error('Something went wrong. Please try again.')
      } finally {
        setPendingId(null)
      }
    })
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-10">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Delivery</h1>
        <p className="text-sm text-gray-500 mt-1">Manage orders going out and confirm deliveries.</p>
      </div>

      <Section
        title="Ready for Delivery"
        subtitle="Load these onto the car."
        icon={Package}
        iconClass="text-teal-600"
        accentClass="bg-teal-500"
        buttonClass="bg-teal-500 hover:bg-teal-600 text-white"
        orders={liveReady}
        actionLabel="Load to Car"
        nextStatus="Out for Delivery"
        pendingId={pendingId}
        onAction={handleAction}
      />

      <hr className="border-gray-200" />

      <Section
        title="Out for Delivery"
        subtitle="Confirm when delivered."
        icon={CheckCircle2}
        iconClass="text-green-600"
        accentClass="bg-green-500"
        buttonClass="bg-green-500 hover:bg-green-600 text-white"
        orders={liveOut}
        actionLabel="Mark Delivered"
        nextStatus="Completed"
        pendingId={pendingId}
        onAction={handleAction}
      />
    </div>
  )
}
