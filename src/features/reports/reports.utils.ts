import { eachDayOfInterval, parseISO, format } from 'date-fns'
import type { Order } from '@/lib/types'
import { computeGrandTotal } from '@/lib/utils'
import type { ReportAnalytics, DailySummary, DayDataPoint, StatusDataPoint, OrderTypeDataPoint } from './reports.types'

export function aggregateAnalytics(
  orders: Order[],
  startDate: string,
  endDate: string,
): ReportAnalytics {
  // --- summary ---
  let totalRevenue = 0
  let totalWeight = 0
  let pickupCount = 0
  let walkinCount = 0
  let completedCount = 0

  // --- daily trend ---
  const dayRevenueMap = new Map<string, number>()  // key: YYYY-MM-DD
  const dayOrdersMap = new Map<string, number>()

  // seed all days in range so gaps show as 0
  const days = eachDayOfInterval({ start: parseISO(startDate), end: parseISO(endDate) })
  for (const d of days) {
    const key = format(d, 'yyyy-MM-dd')
    dayRevenueMap.set(key, 0)
    dayOrdersMap.set(key, 0)
  }

  // --- status distribution ---
  const statusMap = new Map<string, number>()

  // --- order type ---
  const pickupRevenue = { count: 0, revenue: 0 }
  const walkinRevenue = { count: 0, revenue: 0 }

  for (const order of orders) {
    const grand = computeGrandTotal(order)
    const isCompleted = order.status === 'Completed'
    const dayKey = order.created_at.slice(0, 10)

    // summary
    if (order.weight != null) totalWeight += order.weight
    if (order.order_type === 'pickup') pickupCount++
    else walkinCount++
    if (isCompleted) {
      completedCount++
      if (grand != null) totalRevenue += grand
    }

    // daily trend
    if (dayOrdersMap.has(dayKey)) {
      dayOrdersMap.set(dayKey, (dayOrdersMap.get(dayKey) ?? 0) + 1)
    }
    if (isCompleted && grand != null && dayRevenueMap.has(dayKey)) {
      dayRevenueMap.set(dayKey, (dayRevenueMap.get(dayKey) ?? 0) + grand)
    }

    // status
    statusMap.set(order.status, (statusMap.get(order.status) ?? 0) + 1)

    // type comparison
    if (order.order_type === 'pickup') {
      pickupRevenue.count++
      if (isCompleted && grand != null) pickupRevenue.revenue += grand
    } else {
      walkinRevenue.count++
      if (isCompleted && grand != null) walkinRevenue.revenue += grand
    }
  }

  const avgOrderValue = completedCount > 0 ? totalRevenue / completedCount : 0
  const completionRate = orders.length > 0 ? (completedCount / orders.length) * 100 : 0

  const summary: DailySummary = {
    totalRevenue,
    totalWeight,
    totalOrders: orders.length,
    pickupCount,
    walkinCount,
    completedCount,
    avgOrderValue,
    completionRate,
  }

  const dailyTrend: DayDataPoint[] = days.map((d) => {
    const key = format(d, 'yyyy-MM-dd')
    return {
      date: format(d, 'MMM d'),
      revenue: dayRevenueMap.get(key) ?? 0,
      orders: dayOrdersMap.get(key) ?? 0,
    }
  })

  const statusDistribution: StatusDataPoint[] = Array.from(statusMap.entries())
    .map(([status, count]) => ({ status, count }))
    .sort((a, b) => b.count - a.count)

  const orderTypeComparison: OrderTypeDataPoint[] = [
    { type: 'Pickup', count: pickupRevenue.count, revenue: pickupRevenue.revenue },
    { type: 'Walk-in', count: walkinRevenue.count, revenue: walkinRevenue.revenue },
  ]

  return { summary, dailyTrend, statusDistribution, orderTypeComparison }
}
