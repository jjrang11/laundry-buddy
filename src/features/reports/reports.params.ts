export const VALID_SORT_COLUMNS = ['created_at', 'weight', 'total_price'] as const
export type SortColumn = typeof VALID_SORT_COLUMNS[number]
export type SortDir = 'asc' | 'desc'

export const PAGE_SIZE_OPTIONS = [10, 20, 50] as const
export type PageSize = typeof PAGE_SIZE_OPTIONS[number]

export interface TransactionParams {
  page: number // 1-based
  pageSize: PageSize
  search: string
  sortBy: SortColumn
  sortDir: SortDir
}

export const DEFAULT_PARAMS: TransactionParams = {
  page: 1,
  pageSize: 10,
  search: '',
  sortBy: 'created_at',
  sortDir: 'asc',
}

/**
 * Parses and validates raw URL searchParams into a safe TransactionParams object.
 * Any missing or invalid value falls back to the default.
 * sortBy is whitelist-checked to prevent arbitrary column names reaching Supabase .order().
 */
export function parseTransactionParams(
  raw: Record<string, string | string[] | undefined>
): TransactionParams {
  const page = Math.max(1, parseInt(String(raw.page ?? '1'), 10) || 1)

  const rawSize = parseInt(String(raw.pageSize ?? String(DEFAULT_PARAMS.pageSize)), 10)
  const pageSize: PageSize = (PAGE_SIZE_OPTIONS as readonly number[]).includes(rawSize)
    ? (rawSize as PageSize)
    : DEFAULT_PARAMS.pageSize

  const search = String(raw.search ?? '').trim()

  const rawSort = String(raw.sortBy ?? '')
  const sortBy: SortColumn = (VALID_SORT_COLUMNS as readonly string[]).includes(rawSort)
    ? (rawSort as SortColumn)
    : DEFAULT_PARAMS.sortBy

  const sortDir: SortDir = raw.sortDir === 'desc' ? 'desc' : 'asc'

  return { page, pageSize, search, sortBy, sortDir }
}
