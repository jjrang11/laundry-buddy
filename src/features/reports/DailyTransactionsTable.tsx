'use client'

import { useCallback, useMemo } from 'react'
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  type ColumnDef,
} from '@tanstack/react-table'
import { Search, ChevronUp, ChevronDown, ChevronsUpDown, ChevronLeft, ChevronRight } from 'lucide-react'
import { cn, formatCurrency, computeGrandTotal } from '@/lib/utils'
import { Input } from '@/components/ui/input'
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
import { STATUS_COLORS, type OrderStatus } from '@/lib/constants/order-statuses'
import {
  PAGE_SIZE_OPTIONS,
  type TransactionParams,
  type SortColumn,
  type SortDir,
} from './reports.params'
import type { Order } from '@/lib/types'
import { useTableNavigation } from '@/lib/hooks/useTableNavigation'
import { useDebouncedSearch } from '@/lib/hooks/useDebouncedSearch'

interface DailyTransactionsTableProps {
  orders: Order[]
  totalCount: number
  transactionParams: TransactionParams
}

export function DailyTransactionsTable({
  orders,
  totalCount,
  transactionParams,
}: DailyTransactionsTableProps) {
  const { page, pageSize, search, sortBy, sortDir } = transactionParams
  const { navigate, isPending } = useTableNavigation()

  const handleSearchCommit = useCallback(
    (val: string) => navigate({ search: val, page: 1 }),
    [navigate]
  )
  const { localValue: searchValue, handleChange: handleSearchChange } = useDebouncedSearch(
    search,
    handleSearchCommit
  )

  // Sort toggle helper: if already sorted on this column, flip direction; otherwise sort asc.
  const toggleSort = useCallback(
    (col: SortColumn) => {
      const nextDir: SortDir = sortBy === col && sortDir === 'asc' ? 'desc' : 'asc'
      navigate({ sortBy: col, sortDir: nextDir, page: 1 })
    },
    [navigate, sortBy, sortDir]
  )

  // Sort indicator for a given column
  const SortIcon = useCallback(
    ({ col }: { col: SortColumn }) => {
      if (sortBy !== col) return <ChevronsUpDown className="h-3 w-3 text-gray-300" />
      return sortDir === 'asc'
        ? <ChevronUp className="h-3 w-3 text-gray-600" />
        : <ChevronDown className="h-3 w-3 text-gray-600" />
    },
    [sortBy, sortDir]
  )

  // Column definitions live inside the component so sort headers can close over navigate/sortBy/sortDir.
  const columns = useMemo<ColumnDef<Order>[]>(
    () => [
      {
        accessorKey: 'created_at',
        header: () => (
          <button
            onClick={() => toggleSort('created_at')}
            aria-label={`Sort by time${sortBy === 'created_at' ? `, currently ${sortDir === 'asc' ? 'ascending' : 'descending'}` : ''}`}
            className="inline-flex items-center gap-1 transition-colors duration-100 hover:text-gray-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded"
          >
            Time
            <SortIcon col="created_at" />
          </button>
        ),
        cell: ({ row }) => (
          <span className="text-gray-500 text-xs tabular-nums whitespace-nowrap">
            {new Date(row.original.created_at).toLocaleTimeString('en-PH', {
              timeZone: 'Asia/Manila',
              hour: 'numeric',
              minute: '2-digit',
            })}
          </span>
        ),
      },
      {
        accessorKey: 'customer_name',
        header: 'Customer',
        cell: ({ row }) => (
          <span className="font-medium text-gray-900 max-w-[160px] truncate block">
            {row.original.customer_name}
          </span>
        ),
      },
      {
        accessorKey: 'status',
        header: 'Status',
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
        header: 'Type',
        cell: ({ row }) => (
          <span className="text-gray-600">
            {row.original.order_type === 'pickup' ? 'Pickup' : 'Walk-in'}
          </span>
        ),
      },
      {
        accessorKey: 'weight',
        header: () => (
          <button
            onClick={() => toggleSort('weight')}
            aria-label={`Sort by weight${sortBy === 'weight' ? `, currently ${sortDir === 'asc' ? 'ascending' : 'descending'}` : ''}`}
            className="inline-flex items-center gap-1 ml-auto transition-colors duration-100 hover:text-gray-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded"
          >
            Weight
            <SortIcon col="weight" />
          </button>
        ),
        cell: ({ row }) => (
          <span className="tabular-nums text-gray-600">
            {row.original.weight != null ? `${row.original.weight} kg` : '—'}
          </span>
        ),
      },
      {
        id: 'total',
        // NOTE: Server-side sort uses total_price (the stored column) only.
        // computeGrandTotal also adds order_charges amounts, which cannot be
        // included in a Supabase .order() call without a DB view or generated column.
        header: () => (
          <button
            onClick={() => toggleSort('total_price')}
            aria-label={`Sort by total${sortBy === 'total_price' ? `, currently ${sortDir === 'asc' ? 'ascending' : 'descending'}` : ''}`}
            className="inline-flex items-center gap-1 ml-auto transition-colors duration-100 hover:text-gray-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded"
          >
            Total
            <SortIcon col="total_price" />
          </button>
        ),
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [toggleSort, SortIcon]
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
    // Sorting, filtering, and pagination are all handled server-side.
    manualPagination: true,
    manualSorting: true,
    manualFiltering: true,
    pageCount,
  })

  return (
    <div>
      {/* Section header + search */}
      <div className="mt-6 mb-3 flex items-center justify-between">
        <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
          Transactions
        </h2>
        <div className="relative w-52">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 pointer-events-none" />
          <Input
            placeholder="Search by name..."
            className="pl-8 h-8 text-sm"
            value={searchValue}
            onChange={(e) => handleSearchChange(e.target.value)}
          />
        </div>
      </div>

      {/* Row count */}
      <p className="text-xs text-gray-400 mb-2">
        {totalCount === 0
          ? '0 orders'
          : `Showing ${rangeStart}–${rangeEnd} of ${totalCount} ${totalCount === 1 ? 'order' : 'orders'}`}
      </p>

      {/* Table — opacity overlay while RSC re-render is in flight */}
      <div
        className={cn(
          'rounded-xl border border-gray-200 overflow-hidden bg-white',
          isPending && 'opacity-60 pointer-events-none transition-opacity duration-150'
        )}
      >
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow
                key={headerGroup.id}
                className="border-b border-gray-200 bg-gray-50 hover:bg-gray-50"
              >
                {headerGroup.headers.map((header, i) => {
                  const isRight = i >= 4
                  return (
                    <TableHead
                      key={header.id}
                      className={cn(
                        'px-4 py-2.5 text-xs font-medium text-gray-500 uppercase tracking-wide h-auto',
                        isRight ? 'text-right' : 'text-left'
                      )}
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(header.column.columnDef.header, header.getContext())}
                    </TableHead>
                  )
                })}
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
                  {row.getVisibleCells().map((cell, i) => {
                    const isRight = i >= 4
                    return (
                      <TableCell
                        key={cell.id}
                        className={cn('px-4 py-3', isRight ? 'text-right' : 'text-left')}
                      >
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    )
                  })}
                </TableRow>
              ))
            ) : (
              <TableRow className="hover:bg-white border-0">
                <TableCell colSpan={6} className="px-4 py-14 text-center">
                  {search === '' ? (
                    <>
                      <p className="text-sm font-medium text-gray-500">No orders on this day</p>
                      <p className="text-xs text-gray-400 mt-1">Try selecting a different date.</p>
                    </>
                  ) : (
                    <>
                      <p className="text-sm font-medium text-gray-500">No orders match your search</p>
                      <p className="text-xs text-gray-400 mt-1">Try a different customer name.</p>
                    </>
                  )}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination controls — only shown when there are rows */}
      {totalCount > 0 && (
        <div className="mt-3 flex items-center justify-between gap-4">
          {/* Page size selector */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400 whitespace-nowrap">Rows per page</span>
            <Select
              value={String(pageSize)}
              onValueChange={(value) => {
                if (value) navigate({ pageSize: Number(value) as typeof pageSize, page: 1 })
              }}
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
  )
}
