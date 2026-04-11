export interface ReportParams {
  startDate: string  // YYYY-MM-DD
  endDate: string    // YYYY-MM-DD
  status: string     // 'all' or specific OrderStatus
  type: string       // 'all' | 'pickup' | 'walkin'
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/

export function parseReportParams(
  raw: Record<string, string | string[] | undefined>,
  defaultStartDate: string,
  defaultEndDate: string,
): ReportParams {
  const startDate = DATE_RE.test(String(raw.startDate ?? ''))
    ? String(raw.startDate)
    : defaultStartDate

  const endDate = DATE_RE.test(String(raw.endDate ?? ''))
    ? String(raw.endDate)
    : defaultEndDate

  const status = String(raw.status ?? 'all')

  const rawType = String(raw.type ?? 'all')
  const type = ['all', 'pickup', 'walkin'].includes(rawType) ? rawType : 'all'

  return { startDate, endDate, status, type }
}
