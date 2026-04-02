'use client'

import { useDroppable } from '@dnd-kit/core'
import { KanbanCard } from './KanbanCard'
import type { Order } from '@/lib/types'
import type { OrderStatus } from '@/lib/constants/order-statuses'

// Column header accent colors
const COLUMN_ACCENT: Record<string, string> = {
  'New Order':          'bg-gray-400',
  'For Pickup':         'bg-yellow-400',
  'Arrived at Shop':    'bg-blue-400',
  'Processing':         'bg-orange-400',
  'Ready for Delivery': 'bg-teal-400',
  'Out for Delivery':   'bg-green-400',
  'Completed':          'bg-emerald-400',
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

  const accentClass = COLUMN_ACCENT[status] ?? 'bg-gray-300'

  return (
    <div className="flex flex-col w-[272px] shrink-0 h-full">
      {/* Column header */}
      <div className="flex items-center gap-2 mb-2 px-1">
        <span className={['inline-block w-2 h-2 rounded-full', accentClass].join(' ')} />
        <div className="flex-1 min-w-0">
          <h2 className="text-xs font-semibold text-gray-700 uppercase tracking-wide truncate">
            {status}
          </h2>
          {subLabel && (
            <p className="text-[10px] text-gray-400 leading-none mt-0.5">{subLabel}</p>
          )}
        </div>
        <span className="text-xs font-medium text-gray-400 tabular-nums bg-gray-100 rounded-full px-1.5 py-0.5">
          {orders.length}
        </span>
      </div>

      {/* Drop zone */}
      <div
        ref={setNodeRef}
        className={[
          'flex flex-col flex-1 min-h-0 overflow-y-auto gap-2 rounded-xl p-2 transition-colors duration-150',
          isOver ? 'bg-blue-50 ring-2 ring-blue-300 ring-dashed' : 'bg-gray-100/60',
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
          <div className="flex-1 flex items-center justify-center py-6">
            <span className="text-xs text-gray-400">No orders</span>
          </div>
        )}
      </div>
    </div>
  )
}
