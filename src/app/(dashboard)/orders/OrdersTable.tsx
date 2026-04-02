'use client'

import { useState, useCallback } from 'react'
import { format } from 'date-fns'
import { Search, ChevronLeft, ChevronRight } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select'
import { OrderModal } from '@/features/orders/OrderModal'
import {
  ORDER_STATUSES,
  STATUS_COLORS,
  type OrderStatus,
} from '@/lib/constants/order-statuses'
import { formatCurrency, computeGrandTotal } from '@/lib/utils'
import { PAGE_SIZE_OPTIONS, type OrdersParams } from './orders.params'
import type { Order } from '@/lib/types'
import type { UserRole } from '@/lib/auth-utils'
import { cn } from '@/lib/utils'
import { useTableNavigation } from '@/lib/hooks/useTableNavigation'
import { useDebouncedSearch } from '@/lib/hooks/useDebouncedSearch'

interface OrdersTableProps {
  orders: Order[]
  totalCount: number
  ordersParams: OrdersParams
  userRole: UserRole
}

export function OrdersTable({ orders, totalCount, ordersParams, userRole }: OrdersTableProps) {
  const { page, pageSize, search, status, type, showDeleted } = ordersParams
  const { navigate, isPending } = useTableNavigation()
  const [editOrder, setEditOrder] = useState<Order | null>(null)

  const handleSearchCommit = useCallback(
    (val: string) => navigate({ search: val, page: 1 }),
    [navigate]
  )
  const { localValue: searchValue, handleChange: handleSearchChange } = useDebouncedSearch(
    search,
    handleSearchCommit
  )

  const pageCount = Math.ceil(totalCount / pageSize)
  const canPrevious = page > 1
  const canNext = page < pageCount

  const rangeStart = totalCount === 0 ? 0 : (page - 1) * pageSize + 1
  const rangeEnd = Math.min(page * pageSize, totalCount)

  const hasActiveFilters = search !== '' || status !== 'all' || type !== 'all' || showDeleted

  return (
    <>
      <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 pointer-events-none" />
          <Input
            placeholder="Search by customer name..."
            className="pl-8 h-8 text-sm"
            value={searchValue}
            onChange={(e) => handleSearchChange(e.target.value)}
          />
        </div>
        <Select
          value={status}
          onValueChange={(val) => navigate({ status: val, page: 1 })}
        >
          <SelectTrigger className="w-44 h-8 text-sm">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {ORDER_STATUSES.map((s) => (
              <SelectItem key={s} value={s}>{s}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={type}
          onValueChange={(val) => navigate({ type: val as OrdersParams['type'], page: 1 })}
        >
          <SelectTrigger className="w-36 h-8 text-sm">
            <SelectValue placeholder="All types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All types</SelectItem>
            <SelectItem value="pickup">Pickup</SelectItem>
            <SelectItem value="walkin">Walk-in</SelectItem>
          </SelectContent>
        </Select>
        <label className="flex items-center gap-1.5 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={showDeleted}
            onChange={(e) => navigate({ showDeleted: e.target.checked || undefined, page: 1 })}
            className="h-3.5 w-3.5 rounded border-gray-300 accent-gray-800 cursor-pointer"
          />
          <span className="text-sm text-gray-600 whitespace-nowrap">Show deleted</span>
        </label>
      </div>

      {/* Table */}
      <div
        className={cn(
          isPending && 'opacity-60 pointer-events-none transition-opacity duration-150'
        )}
      >
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Customer</th>
              <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Status</th>
              <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Type</th>
              <th className="px-4 py-2.5 text-right text-xs font-medium text-gray-500 uppercase tracking-wide">Weight</th>
              <th className="px-4 py-2.5 text-right text-xs font-medium text-gray-500 uppercase tracking-wide">Total</th>
              <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Created</th>
            </tr>
          </thead>
          <tbody>
            {orders.length > 0 ? (
              orders.map((order) => {
                const total = computeGrandTotal(order)
                return (
                <tr
                  key={order.id}
                  onClick={() => setEditOrder(order)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setEditOrder(order) } }}
                  aria-label={`Edit order for ${order.customer_name}`}
                  className={cn(
                    'border-b border-gray-100 last:border-b-0 cursor-pointer transition-colors duration-100',
                    order.deleted_at
                      ? 'opacity-50 hover:opacity-70 bg-gray-50'
                      : 'hover:bg-blue-50/40'
                  )}
                >
                  <td className="px-4 py-3 font-medium text-gray-900 max-w-[180px] truncate">
                    <span className={order.deleted_at ? 'line-through' : ''}>{order.customer_name}</span>
                  </td>
                  <td className="px-4 py-3">
                    {order.deleted_at ? (
                      <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-500">
                        Deleted
                      </span>
                    ) : (
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[order.status] ?? 'bg-gray-100 text-gray-700'}`}>
                      {order.status}
                    </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {order.order_type === 'pickup' ? 'Pickup' : 'Walk-in'}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-gray-600">
                    {order.weight != null ? `${order.weight} kg` : '—'}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums font-medium text-gray-900">
                    {total != null ? formatCurrency(total) : '—'}
                  </td>
                  <td className="px-4 py-3 text-gray-400 text-xs tabular-nums whitespace-nowrap">
                    {format(new Date(order.created_at), 'MMM d, yyyy')}
                  </td>
                </tr>
                )
              })
            ) : (
              <tr>
                <td colSpan={6} className="px-4 py-16 text-center">
                  {!hasActiveFilters ? (
                    <>
                      <p className="text-sm font-medium text-gray-500">No orders yet</p>
                      <p className="text-xs text-gray-400 mt-1">Orders will appear here once they are created.</p>
                    </>
                  ) : (
                    <>
                      <p className="text-sm font-medium text-gray-500">No orders match your search</p>
                      <p className="text-xs text-gray-400 mt-1">Try a different name or status filter.</p>
                    </>
                  )}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalCount > 0 && (
        <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between gap-4">
          {/* Result count + page size */}
          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-400 tabular-nums">
              {`Showing ${rangeStart}–${rangeEnd} of ${totalCount} ${totalCount === 1 ? 'order' : 'orders'}`}
            </span>
            <Select
              value={String(pageSize)}
              onValueChange={(val) => navigate({ pageSize: Number(val) as typeof pageSize, page: 1 })}
            >
              <SelectTrigger size="sm" className="w-16 text-xs text-gray-600">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PAGE_SIZE_OPTIONS.map((size) => (
                  <SelectItem key={size} value={String(size)}>
                    {size}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Page indicator + navigation */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400 tabular-nums whitespace-nowrap">
              Page {pageCount === 0 ? 0 : page} of {pageCount}
            </span>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="icon-sm"
                onClick={() => navigate({ page: page - 1 })}
                disabled={!canPrevious || isPending}
                aria-label="Previous page"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="outline"
                size="icon-sm"
                onClick={() => navigate({ page: page + 1 })}
                disabled={!canNext || isPending}
                aria-label="Next page"
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </div>
      )}
      </div>

      {/* Edit modal */}
      <OrderModal
        mode="edit"
        order={editOrder ?? undefined}
        open={editOrder !== null}
        onClose={() => setEditOrder(null)}
        userRole={userRole}
      />
    </>
  )
}
