'use client'

import { useCallback, useMemo } from 'react'
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  type ColumnDef,
} from '@tanstack/react-table'
import { ChevronUp, ChevronDown, ChevronsUpDown, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react'
import { cn, formatCurrency, computeGrandTotal } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table'
import { STATUS_COLORS } from '@/lib/constants/order-statuses'
import type { Order } from '@/lib/types'
import { useTableNavigation } from '@/lib/hooks/useTableNavigation'

// Local type definitions (self-contained — not sourced from reports.params)
const PAGE_SIZE_OPTIONS = [10, 20, 50] as const
type PageSize = typeof PAGE_SIZE_OPTIONS[number]
type SortColumn = 'created_at' | 'customer_name' | 'status' | 'order_type' | 'total_price'
type SortDir = 'asc' | 'desc'

interface ReportParams {
  startDate: string
  endDate: string
  status: string
  type: string
  page: number
  pageSize: PageSize
  sortBy: SortColumn
  sortDir: SortDir
}

interface SortIconProps {
  col: SortColumn
  sortBy: SortColumn
  sortDir: SortDir
}

function SortIcon({ col, sortBy, sortDir }: SortIconProps) {
  if (sortBy !== col) return <ChevronsUpDown className="h-3 w-3 text-gray-300" />
  return sortDir === 'asc'
    ? <ChevronUp className="h-3 w-3 text-gray-600" />
    : <ChevronDown className="h-3 w-3 text-gray-600" />
}

interface SortButtonProps {
  col: SortColumn
  label: string
  align?: 'left' | 'right'
  sortBy: SortColumn
  sortDir: SortDir
  onSort: (col: SortColumn) => void
}

function SortButton({ col, label, align = 'left', sortBy, sortDir, onSort }: SortButtonProps) {
  return (
    <button
      onClick={() => onSort(col)}
      aria-label={`Sort by ${label}${sortBy === col ? `, currently ${sortDir === 'asc' ? 'ascending' : 'descending'}` : ''}`}
      className={cn(
        'inline-flex items-center gap-1 transition-colors duration-100 hover:text-gray-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded',
        align === 'right' && 'ml-auto'
      )}
    >
      {label}
      <SortIcon col={col} sortBy={sortBy} sortDir={sortDir} />
    </button>
  )
}

interface ReportTransactionsTableProps {
  orders: Order[]
  totalCount: number
  params: ReportParams
  hasFilters: boolean
  externalPending?: boolean
}

export function DailyTransactionsTable({
  orders,
  totalCount,
  params,
  hasFilters,
  externalPending = false,
}: ReportTransactionsTableProps) {
  const { page, pageSize, sortBy, sortDir } = params
  const { navigate, isPending } = useTableNavigation()
  const isLoading = isPending || externalPending

  const toggleSort = useCallback(
    (col: SortColumn) => {
      const nextDir: SortDir = sortBy === col && sortDir === 'asc' ? 'desc' : 'asc'
      navigate({ sortBy: col, sortDir: nextDir, page: 1 })
    },
    [navigate, sortBy, sortDir]
  )

  const columns = useMemo<ColumnDef<Order>[]>(
    () => [
      {
        accessorKey: 'created_at',
        header: () => <SortButton col="created_at" label="Date & Time" sortBy={sortBy} sortDir={sortDir} onSort={toggleSort} />,
        cell: ({ row }) => (
          <span className="text-gray-500 text-xs tabular-nums whitespace-nowrap">
            {new Date(row.original.created_at).toLocaleString('en-PH', {
              timeZone: 'Asia/Manila',
              month: 'short',
              day: 'numeric',
              year: 'numeric',
              hour: 'numeric',
              minute: '2-digit',
            })}
          </span>
        ),
      },
      {
        accessorKey: 'customer_name',
        header: () => <SortButton col="customer_name" label="Customer" sortBy={sortBy} sortDir={sortDir} onSort={toggleSort} />,
        cell: ({ row }) => (
          <span className="font-medium text-gray-900 max-w-[160px] truncate block">
            {row.original.customer_name}
          </span>
        ),
      },
      {
        accessorKey: 'status',
        header: () => <SortButton col="status" label="Status" sortBy={sortBy} sortDir={sortDir} onSort={toggleSort} />,
        cell: ({ row }) => (
          <span
            className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[row.original.status] ?? 'bg-gray-100 text-gray-700'}`}
          >
            {row.original.status}
          </span>
        ),
      },
      {
        accessorKey: 'order_type',
        header: () => <SortButton col="order_type" label="Type" sortBy={sortBy} sortDir={sortDir} onSort={toggleSort} />,
        cell: ({ row }) => (
          <span className="text-gray-600">
            {row.original.order_type === 'pickup' ? 'Pickup' : 'Walk-in'}
          </span>
        ),
      },
      {
        id: 'total',
        header: () => <SortButton col="total_price" label="Total" align="right" sortBy={sortBy} sortDir={sortDir} onSort={toggleSort} />,
        cell: ({ row }) => {
          const total = computeGrandTotal(row.original)
          return (
            <span className="tabular-nums font-medium text-gray-900">
              {total != null ? formatCurrency(total) : '—'}
            </span>
          )
        },
      },
    ],
    [sortBy, sortDir, toggleSort]
  )

  const pageCount = Math.ceil(totalCount / pageSize)
  const canPrevious = page > 1
  const canNext = page < pageCount

  const rangeStart = totalCount === 0 ? 0 : (page - 1) * pageSize + 1
  const rangeEnd = Math.min(page * pageSize, totalCount)

  const table = useReactTable({
    data: orders,
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    manualSorting: true,
    manualFiltering: true,
    pageCount,
  })

  return (
    <div className="mt-6">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
          Transactions
        </h2>
        <p className="text-xs text-gray-400 tabular-nums">
          {totalCount === 0
            ? '0 orders'
            : `Showing ${rangeStart}–${rangeEnd} of ${totalCount} ${totalCount === 1 ? 'order' : 'orders'}`}
        </p>
      </div>

      <div
        className={cn(
          'relative rounded-xl border border-gray-200 overflow-hidden bg-white',
          isLoading && 'pointer-events-none'
        )}
      >
        {/* Loading overlay */}
        {isLoading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/70 backdrop-blur-[1px]">
            <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
          </div>
        )}
        <div className={cn('transition-opacity duration-150', isLoading && 'opacity-40')}>
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow
                key={headerGroup.id}
                className="border-b border-gray-200 bg-gray-50 hover:bg-gray-50"
              >
                {headerGroup.headers.map((header, i) => (
                  <TableHead
                    key={header.id}
                    className={cn(
                      'px-4 py-2.5 text-xs font-medium text-gray-500 uppercase tracking-wide h-auto',
                      i === 4 ? 'text-right' : 'text-left'
                    )}
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length > 0 ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  className="border-b border-gray-100 last:border-b-0 hover:bg-gray-50 transition-colors duration-100"
                >
                  {row.getVisibleCells().map((cell, i) => (
                    <TableCell
                      key={cell.id}
                      className={cn('px-4 py-3', i === 4 ? 'text-right' : 'text-left')}
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow className="hover:bg-white border-0">
                <TableCell colSpan={5} className="px-4 py-14 text-center">
                  {!hasFilters ? (
                    <>
                      <p className="text-sm font-medium text-gray-500">No orders found</p>
                      <p className="text-xs text-gray-400 mt-1">No orders exist in this date range.</p>
                    </>
                  ) : (
                    <>
                      <p className="text-sm font-medium text-gray-500">No orders match your filters</p>
                      <p className="text-xs text-gray-400 mt-1">Try adjusting your search or filters.</p>
                    </>
                  )}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        </div>
      </div>

      {totalCount > 0 && (
        <div className="mt-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400 whitespace-nowrap">Rows per page</span>
            <Select
              value={String(pageSize)}
              onValueChange={(value: string | null) => {
                if (value) navigate({ pageSize: Number(value) as PageSize, page: 1 })
              }}
            >
              <SelectTrigger size="sm" className="w-16 text-xs text-gray-600">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PAGE_SIZE_OPTIONS.map((size) => (
                  <SelectItem key={size} value={String(size)} label={String(size)}>
                    {size}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400 tabular-nums whitespace-nowrap">
              Page {pageCount === 0 ? 0 : page} of {pageCount}
            </span>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="icon-sm"
                onClick={() => navigate({ page: page - 1 })}
                disabled={!canPrevious || isLoading}
                aria-label="Previous page"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="outline"
                size="icon-sm"
                onClick={() => navigate({ page: page + 1 })}
                disabled={!canNext || isLoading}
                aria-label="Next page"
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
