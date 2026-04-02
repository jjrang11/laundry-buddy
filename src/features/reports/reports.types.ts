export interface DailySummary {
  totalRevenue: number
  totalWeight: number
  totalOrders: number
  pickupCount: number
  walkinCount: number
}

export interface MonthlySummary {
  month: string   // "YYYY-MM" e.g. "2026-03"
  label: string   // Short label e.g. "Mar 2026"
  totalRevenue: number
  totalWeight: number
  totalOrders: number
  pickupCount: number
  walkinCount: number
  statusBreakdown: Record<string, number>
}
