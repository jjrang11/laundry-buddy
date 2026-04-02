import { ORDER_STATUSES } from "@/lib/constants/order-statuses";

export const PAGE_SIZE_OPTIONS = [10, 20, 50] as const;
export type PageSize = (typeof PAGE_SIZE_OPTIONS)[number];

export const ORDER_TYPE_FILTERS = ["all", "pickup", "walkin"] as const;
export type OrderTypeFilter = (typeof ORDER_TYPE_FILTERS)[number];

const VALID_STATUS_FILTERS = ["all", ...ORDER_STATUSES] as const;
type StatusFilter = (typeof VALID_STATUS_FILTERS)[number];

export interface OrdersParams {
  page: number; // 1-based
  pageSize: PageSize;
  search: string;
  status: string; // 'all' or an exact ORDER_STATUSES value
  type: OrderTypeFilter;
  showDeleted: boolean;
}

export const DEFAULT_ORDERS_PARAMS: OrdersParams = {
  page: 1,
  pageSize: 10,
  search: "",
  status: "all",
  type: "all",
  showDeleted: false,
};

/**
 * Parses and validates raw URL searchParams into a safe OrdersParams object.
 * Any missing or invalid value falls back to the default.
 */
export function parseOrdersParams(
  raw: Record<string, string | string[] | undefined>
): OrdersParams {
  const page = Math.max(1, parseInt(String(raw.page ?? "1"), 10) || 1);

  const rawSize = parseInt(
    String(raw.pageSize ?? String(DEFAULT_ORDERS_PARAMS.pageSize)),
    10
  );
  const pageSize: PageSize = (PAGE_SIZE_OPTIONS as readonly number[]).includes(
    rawSize
  )
    ? (rawSize as PageSize)
    : DEFAULT_ORDERS_PARAMS.pageSize;

  const search = String(raw.search ?? "").trim();

  const rawStatus = String(raw.status ?? "all");
  const status: StatusFilter = (
    VALID_STATUS_FILTERS as readonly string[]
  ).includes(rawStatus)
    ? (rawStatus as StatusFilter)
    : "all";

  const rawType = String(raw.type ?? "all");
  const type: OrderTypeFilter = (
    ORDER_TYPE_FILTERS as readonly string[]
  ).includes(rawType)
    ? (rawType as OrderTypeFilter)
    : DEFAULT_ORDERS_PARAMS.type;

  const showDeleted = raw.showDeleted === "true";

  return { page, pageSize, search, status, type, showDeleted };
}
