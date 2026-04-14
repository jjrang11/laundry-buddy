'use client'

import { useState, useCallback, useTransition } from 'react'
import { format, parseISO } from 'date-fns'
import { Search, ChevronLeft, ChevronRight, CalendarIcon, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select'
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { OrderModal } from '@/features/orders/OrderModal'
import { OrdersPDFDownload } from '@/features/orders/OrdersPDFDownload'
import {
  ORDER_STATUSES,
  STATUS_COLORS,
} from '@/lib/constants/order-statuses'
import { formatCurrency, computeGrandTotal } from '@/lib/utils'
import { PAGE_SIZE_OPTIONS, type OrdersParams } from './orders.params'
import type { Order } from '@/lib/types'
import type { UserRole } from '@/lib/auth-utils'
import { cn } from '@/lib/utils'
import { useTableNavigation } from '@/lib/hooks/useTableNavigation'
import { useDebouncedSearch } from '@/lib/hooks/useDebouncedSearch'
import { useRouter, usePathname } from 'next/navigation'

interface OrdersTableProps {
  orders: Order[]
  totalCount: number
  ordersParams: OrdersParams
  userRole: UserRole
  shopName: string
}

export function OrdersTable({ orders, totalCount, ordersParams, userRole, shopName }: OrdersTableProps) {
  const { page, pageSize, search, status, type, showDeleted, startDate, endDate } = ordersParams
  const { navigate, isPending } = useTableNavigation()
  const router = useRouter()
  const pathname = usePathname()
  const [, startResetTransition] = useTransition()
  const [editOrder, setEditOrder] = useState<Order | null>(null)
  const [startOpen, setStartOpen] = useState(false)
  const [endOpen, setEndOpen] = useState(false)

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

  const hasActiveFilters =
    search !== '' || status !== 'all' || type !== 'all' || showDeleted ||
    startDate !== null || endDate !== null

  const handleReset = useCallback(() => {
    startResetTransition(() => { router.push(pathname) })
  }, [router, pathname])

  const statusLabel = status === 'all' ? 'All statuses' : status
  const typeLabel = type === 'all' ? 'All types' : type === 'pickup' ? 'Pickup' : 'Walk-in'

  return (
    <>
      <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2 px-4 py-3 border-b border-gray-100 justify-between">
        <div className="flex flex-wrap items-center gap-2">

          {/* Start Date */}
          <Popover open={startOpen} onOpenChange={setStartOpen}>
            <PopoverTrigger className="flex items-center gap-1.5 px-3 h-8 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors whitespace-nowrap">
              <CalendarIcon className="h-3.5 w-3.5 text-gray-400 shrink-0" />
              {startDate ? format(parseISO(startDate), 'MMM d, yyyy') : 'Start date'}
            </PopoverTrigger>
            <PopoverContent side="bottom" align="start" sideOffset={4}>
              <p className="text-xs text-gray-500 font-medium mb-2 uppercase tracking-wide px-1">Start date</p>
              <Calendar
                mode="single"
                selected={startDate ? parseISO(startDate) : undefined}
                onSelect={(date) => {
                  setStartOpen(false)
                  navigate({ startDate: date ? format(date, 'yyyy-MM-dd') : undefined, page: 1 })
                }}
                disabled={(d) => d > new Date()}
                initialFocus
              />
              {startDate && (
                <button
                  onClick={() => { setStartOpen(false); navigate({ startDate: undefined, page: 1 }) }}
                  className="mt-1 w-full text-xs text-gray-400 hover:text-gray-600 py-1"
                >
                  Clear
                </button>
              )}
            </PopoverContent>
          </Popover>

          <span className="text-xs text-gray-400">to</span>

          {/* End Date */}
          <Popover open={endOpen} onOpenChange={setEndOpen}>
            <PopoverTrigger className="flex items-center gap-1.5 px-3 h-8 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors whitespace-nowrap">
              <CalendarIcon className="h-3.5 w-3.5 text-gray-400 shrink-0" />
              {endDate ? format(parseISO(endDate), 'MMM d, yyyy') : 'End date'}
            </PopoverTrigger>
            <PopoverContent side="bottom" align="start" sideOffset={4}>
              <p className="text-xs text-gray-500 font-medium mb-2 uppercase tracking-wide px-1">End date</p>
              <Calendar
                mode="single"
                selected={endDate ? parseISO(endDate) : undefined}
                onSelect={(date) => {
                  setEndOpen(false)
                  navigate({ endDate: date ? format(date, 'yyyy-MM-dd') : undefined, page: 1 })
                }}
                disabled={(d) => d > new Date()}
                initialFocus
              />
              {endDate && (
                <button
                  onClick={() => { setEndOpen(false); navigate({ endDate: undefined, page: 1 }) }}
                  className="mt-1 w-full text-xs text-gray-400 hover:text-gray-600 py-1"
                >
                  Clear
                </button>
              )}
            </PopoverContent>
          </Popover>

          <div className="w-px h-5 bg-gray-200 mx-1" />

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 pointer-events-none" />
            <Input
              placeholder="Search customer..."
              className="pl-8 h-8 text-sm w-full sm:w-44"
              value={searchValue}
              onChange={(e) => handleSearchChange(e.target.value)}
            />
          </div>

          {/* Status */}
          <Select value={status} onValueChange={(val) => navigate({ status: val, page: 1 })}>
            <SelectTrigger className="w-full sm:w-44 h-8 text-sm">
              <SelectValue>{statusLabel}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              {ORDER_STATUSES.map((s) => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Type */}
          <Select value={type} onValueChange={(val) => navigate({ type: val as OrdersParams['type'], page: 1 })}>
            <SelectTrigger className="w-full sm:w-32 h-8 text-sm">
              <SelectValue>{typeLabel}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All types</SelectItem>
              <SelectItem value="pickup">Pickup</SelectItem>
              <SelectItem value="walkin">Walk-in</SelectItem>
            </SelectContent>
          </Select>

          {/* Show deleted */}
          <label className="flex items-center gap-1.5 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={showDeleted}
              onChange={(e) => navigate({ showDeleted: e.target.checked || undefined, page: 1 })}
              className="h-3.5 w-3.5 rounded border-gray-300 accent-gray-800 cursor-pointer"
            />
            <span className="text-sm text-gray-600 whitespace-nowrap">Show deleted</span>
          </label>

          {/* Reset */}
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleReset}
              className="h-8 px-2.5 text-xs text-gray-500 hover:text-gray-900 gap-1"
            >
              <X className="h-3.5 w-3.5" />
              Reset
            </Button>
          )}
        </div>

        <OrdersPDFDownload params={ordersParams} shopName={shopName} />
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
              <th className="hidden sm:table-cell px-4 py-2.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Type</th>
              <th className="hidden sm:table-cell px-4 py-2.5 text-right text-xs font-medium text-gray-500 uppercase tracking-wide">Weight</th>
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
                  <td className="hidden sm:table-cell px-4 py-3 text-gray-600">
                    {order.order_type === 'pickup' ? 'Pickup' : 'Walk-in'}
                  </td>
                  <td className="hidden sm:table-cell px-4 py-3 text-right tabular-nums text-gray-600">
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
        <div className="px-4 py-3 border-t border-gray-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
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
