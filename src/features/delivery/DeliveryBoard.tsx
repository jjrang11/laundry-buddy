'use client'

import { useState, useTransition, useEffect, useRef } from 'react'
import { CheckCircle2, Package, Phone, MapPin, Scale, Truck, PackageCheck } from 'lucide-react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { updateOrderStatus, bulkUpdateOrderStatus } from '@/features/orders/orders.actions'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
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
    <div className="relative bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex">
      <div className={`w-1 shrink-0 ${accentClass}`} />
      <div className="flex-1 p-4 flex flex-col gap-3">
        <div className="flex items-start justify-between gap-2">
          <p className="font-semibold text-slate-800 text-sm leading-tight">{order.customer_name}</p>
          <p className="text-sm font-bold text-slate-800 shrink-0">{formatCurrency(order.total_price)}</p>
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
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
  bulkButtonClass,
  bulkIcon: BulkIcon,
  orders,
  actionLabel,
  bulkLabel,
  nextStatus,
  pendingId,
  bulkPending,
  onAction,
  onBulkAction,
}: {
  title: string
  subtitle: string
  icon: React.ElementType
  iconClass: string
  accentClass: string
  buttonClass: string
  bulkButtonClass: string
  bulkIcon: React.ElementType
  orders: Order[]
  actionLabel: string
  bulkLabel: string
  nextStatus: 'Out for Delivery' | 'Completed'
  pendingId: string | null
  bulkPending: boolean
  onAction: (id: string, status: 'Out for Delivery' | 'Completed') => void
  onBulkAction: () => void
}) {
  return (
    <section>
      <div className="flex items-center gap-2 mb-4">
        <Icon className={`h-5 w-5 ${iconClass}`} />
        <div>
          <h2 className="text-sm font-semibold text-slate-800">{title}</h2>
          <p className="text-xs text-slate-400">{subtitle}</p>
        </div>
        <span className="ml-2 text-xs font-semibold bg-white border border-slate-200 text-slate-500 px-2 py-0.5 rounded-full shadow-sm">
          {orders.length}
        </span>
        {orders.length > 0 && (
          <button
            disabled={bulkPending || pendingId !== null}
            onClick={onBulkAction}
            className={`ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-opacity disabled:opacity-50 ${bulkButtonClass}`}
          >
            <BulkIcon className="h-3.5 w-3.5" />
            {bulkPending ? 'Updating…' : bulkLabel}
          </button>
        )}
      </div>

      {orders.length === 0 ? (
        <p className="text-sm text-slate-400 py-8 text-center border border-dashed border-slate-200 rounded-xl">
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

type BulkTarget = 'ready' | 'out'

export function DeliveryBoard({ readyOrders, outOrders, shopId }: DeliveryBoardProps) {
  const [, startTransition] = useTransition()
  const [pendingId, setPendingId] = useState<string | null>(null)
  const [bulkPending, setBulkPending] = useState<BulkTarget | null>(null)
  const [confirmTarget, setConfirmTarget] = useState<BulkTarget | null>(null)
  const [orders, setOrders] = useState<Order[]>([...readyOrders, ...outOrders])

  // Reconnect state — incremented to force the subscription useEffect to re-run
  const retryCountRef = useRef(0)
  const retryTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [retryKey, setRetryKey] = useState(0)

  // Sync state when server re-renders with fresh props
  useEffect(() => {
    setOrders([...readyOrders, ...outOrders])
  }, [readyOrders, outOrders])

  // Supabase real-time subscription
  useEffect(() => {
    const supabase = createClient()
    let cancelled = false
    let channelRef: ReturnType<typeof supabase.channel> | null = null

    async function setup() {
      // Prime the realtime auth token before subscribing.
      // See useKanbanOrders.ts setup() for the full rationale.
      // Use setAuth() without explicit token (callback-based) to keep
      // _manuallySetToken = false so the post-subscription setAuth() in the
      // channel 'ok' handler still fires — that is what causes the server to
      // route postgres_changes events.
      let { data: { session } } = await supabase.auth.getSession()
      if (!session?.user?.user_metadata?.shop_id) {
        const { data: refreshed } = await supabase.auth.refreshSession()
        session = refreshed.session
      }
      if (session) {
        await supabase.realtime.setAuth() // no token — uses callback, keeps _manuallySetToken false
      }
      if (cancelled) return

      const channel = supabase
        .channel('delivery-realtime')
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'orders', filter: `shop_id=eq.${shopId}` },
          (payload) => {
            const incoming = payload.new as Order
            // Guard both status and soft-delete — previously handled by .is('deleted_at', null) in the SELECT
            if (!DELIVERY_STATUSES.has(incoming.status) || incoming.deleted_at) return
            setOrders((prev) =>
              prev.some((o) => o.id === incoming.id) ? prev : [...prev, incoming]
            )
          }
        )
        .on(
          'postgres_changes',
          { event: 'UPDATE', schema: 'public', table: 'orders', filter: `shop_id=eq.${shopId}` },
          (payload) => {
            const updated = payload.new as Order
            if (!updated || updated.deleted_at || !DELIVERY_STATUSES.has(updated.status)) {
              setOrders((prev) => prev.filter((o) => o.id !== updated?.id))
              return
            }
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
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            // Successful connection — reset backoff counter and cancel any pending retry
            retryCountRef.current = 0
            if (retryTimeoutRef.current) {
              clearTimeout(retryTimeoutRef.current)
              retryTimeoutRef.current = null
            }
          }
          if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
            // Exponential backoff: 1s, 2s, 4s … capped at 30s
            const delay = Math.min(1_000 * 2 ** retryCountRef.current, 30_000)
            retryCountRef.current++
            retryTimeoutRef.current = setTimeout(() => {
              setRetryKey((k) => k + 1) // triggers this useEffect to re-run with a fresh channel
            }, delay)
          }
          // CLOSED: no reconnect needed here.
          // Supabase's realtime client automatically re-joins channels on socket
          // reconnect (fires CHANNEL_ERROR/TIMED_OUT → backoff handles those).
          // CLOSED only fires on explicit removeChannel() (guarded by cancelled)
          // or server-side leave — neither needs an additional reconnect here.
        })

      channelRef = channel
    }

    setup()

    return () => {
      cancelled = true
      if (channelRef) supabase.removeChannel(channelRef)
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current)
        retryTimeoutRef.current = null
      }
    }
  }, [shopId, retryKey]) // retryKey forces re-subscription after a failed channel

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

  function handleBulkConfirm() {
    if (!confirmTarget) return
    const target = confirmTarget
    setConfirmTarget(null)
    const ids = target === 'ready'
      ? liveReady.map((o) => o.id)
      : liveOut.map((o) => o.id)
    const nextStatus: 'Out for Delivery' | 'Completed' =
      target === 'ready' ? 'Out for Delivery' : 'Completed'
    setBulkPending(target)
    startTransition(async () => {
      try {
        await bulkUpdateOrderStatus(ids, nextStatus)
        toast.success(
          target === 'ready'
            ? `${ids.length} order${ids.length !== 1 ? 's' : ''} loaded to car.`
            : `${ids.length} order${ids.length !== 1 ? 's' : ''} marked as completed.`
        )
      } catch {
        toast.error('Something went wrong. Please try again.')
      } finally {
        setBulkPending(null)
      }
    })
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-10">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Delivery</h1>
        <p className="text-sm text-slate-500 mt-1">Manage orders going out and confirm deliveries.</p>
      </div>

      <Section
        title="Ready for Delivery"
        subtitle="Load these onto the car."
        icon={Package}
        iconClass="text-teal-600"
        accentClass="bg-teal-500"
        buttonClass="bg-teal-500 hover:bg-teal-600 text-white"
        bulkButtonClass="bg-teal-500 hover:bg-teal-600 text-white"
        bulkIcon={Truck}
        orders={liveReady}
        actionLabel="Load to Car"
        bulkLabel="Load All to Car"
        nextStatus="Out for Delivery"
        pendingId={pendingId}
        bulkPending={bulkPending === 'ready'}
        onAction={handleAction}
        onBulkAction={() => setConfirmTarget('ready')}
      />

      <hr className="border-slate-200" />

      <Section
        title="Out for Delivery"
        subtitle="Confirm when delivered."
        icon={CheckCircle2}
        iconClass="text-green-600"
        accentClass="bg-green-500"
        buttonClass="bg-green-500 hover:bg-green-600 text-white"
        bulkButtonClass="bg-green-500 hover:bg-green-600 text-white"
        bulkIcon={PackageCheck}
        orders={liveOut}
        actionLabel="Mark Delivered"
        bulkLabel="Mark All Delivered"
        nextStatus="Completed"
        pendingId={pendingId}
        bulkPending={bulkPending === 'out'}
        onAction={handleAction}
        onBulkAction={() => setConfirmTarget('out')}
      />

      <ConfirmDialog
        open={confirmTarget === 'ready'}
        title="Load all to car?"
        description={`This will move all ${liveReady.length} order${liveReady.length !== 1 ? 's' : ''} in "Ready for Delivery" to "Out for Delivery". This cannot be undone.`}
        confirmLabel="Load All to Car"
        confirmVariant="default"
        confirmClassName="bg-teal-500 hover:bg-teal-600 text-white border-0"
        isPending={bulkPending === 'ready'}
        onConfirm={handleBulkConfirm}
        onCancel={() => setConfirmTarget(null)}
      />

      <ConfirmDialog
        open={confirmTarget === 'out'}
        title="Mark all as delivered?"
        description={`This will mark all ${liveOut.length} order${liveOut.length !== 1 ? 's' : ''} in "Out for Delivery" as "Completed". This cannot be undone.`}
        confirmLabel="Mark All Delivered"
        confirmVariant="default"
        confirmClassName="bg-green-500 hover:bg-green-600 text-white border-0"
        isPending={bulkPending === 'out'}
        onConfirm={handleBulkConfirm}
        onCancel={() => setConfirmTarget(null)}
      />
    </div>
  )
}
