'use client'

import { useDroppable } from '@dnd-kit/core'
import { KanbanCard } from './KanbanCard'
import type { Order } from '@/lib/types'
import type { OrderStatus } from '@/lib/constants/order-statuses'

// Vertical accent bar color per status
const COLUMN_ACCENT: Record<string, string> = {
  'New Order':          'bg-slate-400',
  'For Pickup':         'bg-amber-400',
  'Arrived at Shop':    'bg-sky-400',
  'Processing':         'bg-orange-400',
  'Ready for Delivery': 'bg-teal-500',
  'Out for Delivery':   'bg-cyan-400',
  'Completed':          'bg-emerald-500',
}

interface KanbanColumnProps {
  status: OrderStatus
  orders: Order[]
  newOrderIds: Set<string>
  onClearNew: (id: string) => void
  onEditOrder: (order: Order) => void
  subLabel?: string
}

export function KanbanColumn({ status, orders, newOrderIds, onClearNew, onEditOrder, subLabel }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: status })

  const accentClass = COLUMN_ACCENT[status] ?? 'bg-slate-400'

  return (
    <div className="flex flex-col w-[272px] shrink-0 h-full">
      {/* Column header */}
      <div className="flex items-center gap-2 mb-2 px-1">
        <div className={['w-1 h-4 rounded-full shrink-0', accentClass].join(' ')} />
        <div className="flex-1 min-w-0">
          <h2 className="text-[11px] font-semibold text-slate-500 uppercase tracking-widest truncate">
            {status}
          </h2>
          {subLabel && (
            <p className="text-[10px] text-slate-400 leading-none mt-0.5">{subLabel}</p>
          )}
        </div>
        <span className="text-[11px] font-semibold text-slate-400 tabular-nums bg-white border border-slate-200 rounded-full px-2 py-0.5 shadow-sm">
          {orders.length}
        </span>
      </div>

      {/* Drop zone */}
      <div
        ref={setNodeRef}
        className={[
          'flex flex-col flex-1 min-h-0 overflow-y-auto gap-2 rounded-xl p-2 border transition-colors duration-150',
          isOver
            ? 'bg-teal-50 border-teal-200 ring-1 ring-teal-200'
            : 'bg-white/60 border-slate-200/60',
        ].join(' ')}
      >
        {orders.map((order) => (
          <KanbanCard
            key={order.id}
            order={order}
            isNew={newOrderIds.has(order.id)}
            onClearNew={() => onClearNew(order.id)}
            onEdit={onEditOrder}
          />
        ))}

        {orders.length === 0 && (
          <div className="flex-1 flex items-center justify-center py-8">
            <span className="text-xs text-slate-400 text-center">Drop orders here</span>
          </div>
        )}
      </div>
    </div>
  )
}
