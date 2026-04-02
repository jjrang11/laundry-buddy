import { format, startOfMonth, subMonths, parseISO } from 'date-fns'
import type { Order } from '@/lib/types'
import { computeGrandTotal } from '@/lib/utils'
import type { DailySummary, MonthlySummary } from './reports.types'

export function aggregateDaily(orders: Order[]): DailySummary {
  let totalRevenue = 0
  let totalWeight = 0
  let pickupCount = 0
  let walkinCount = 0

  for (const order of orders) {
    if (order.status === 'Completed') {
      const grand = computeGrandTotal(order)
      if (grand !== null) {
        totalRevenue += grand
      }
    }

    if (order.weight !== null) {
      totalWeight += order.weight
    }

    if (order.order_type === 'pickup') {
      pickupCount++
    } else {
      walkinCount++
    }
  }

  return {
    totalRevenue,
    totalWeight,
    totalOrders: orders.length,
    pickupCount,
    walkinCount,
  }
}

export function aggregateMonthly(orders: Order[]): MonthlySummary[] {
  const now = new Date()

  // Build the ordered list of the last 6 months (oldest first, newest last)
  const months: string[] = []
  for (let i = 5; i >= 0; i--) {
    const monthStart = startOfMonth(subMonths(now, i))
    months.push(format(monthStart, 'yyyy-MM'))
  }

  // Initialise a map with zero-value buckets for every month in the window
  const buckets = new Map<string, MonthlySummary>()
  for (const month of months) {
    // Parse "yyyy-MM" back to a date to derive the display label
    const parsed = parseISO(`${month}-01`)
    buckets.set(month, {
      month,
      label: format(parsed, 'MMM yyyy'),
      totalRevenue: 0,
      totalWeight: 0,
      totalOrders: 0,
      pickupCount: 0,
      walkinCount: 0,
      statusBreakdown: {},
    })
  }

  // Accumulate order data into the matching bucket (ignore orders outside the window)
  for (const order of orders) {
    const monthKey = format(parseISO(order.created_at), 'yyyy-MM')
    const bucket = buckets.get(monthKey)
    if (bucket === undefined) continue

    if (order.status === 'Completed') {
      const grand = computeGrandTotal(order)
      if (grand !== null) {
        bucket.totalRevenue += grand
      }
    }

    if (order.weight !== null) {
      bucket.totalWeight += order.weight
    }

    bucket.totalOrders++
    bucket.statusBreakdown[order.status] = (bucket.statusBreakdown[order.status] ?? 0) + 1

    if (order.order_type === 'pickup') {
      bucket.pickupCount++
    } else {
      bucket.walkinCount++
    }
  }

  return months.map((m) => buckets.get(m) as MonthlySummary)
}
