export interface DailySummary {
  totalRevenue: number
  totalWeight: number
  totalOrders: number
  pickupCount: number
  walkinCount: number
  completedCount: number
  avgOrderValue: number       // totalRevenue / completedCount (0 if none)
  completionRate: number      // (completedCount / totalOrders) * 100 (0 if none)
}

export interface DayDataPoint {
  date: string    // formatted label e.g. "Apr 1"
  revenue: number
  orders: number
}

export interface StatusDataPoint {
  status: string
  count: number
}

export interface OrderTypeDataPoint {
  type: string    // "Pickup" | "Walk-in"
  count: number
  revenue: number
}

export interface ReportAnalytics {
  summary: DailySummary
  dailyTrend: DayDataPoint[]
  statusDistribution: StatusDataPoint[]
  orderTypeComparison: OrderTypeDataPoint[]
}
