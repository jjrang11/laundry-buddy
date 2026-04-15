export const ORDER_STATUSES = [
  "New Order",
  "For Pickup",
  "Arrived at Shop",
  "Processing",
  "Ready for Delivery",
  "Out for Delivery",
  "Completed",
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const STATUS_COLORS: Record<OrderStatus, string> = {
  "New Order":          "bg-slate-100 text-slate-700",
  "For Pickup":         "bg-amber-100 text-amber-700",
  "Arrived at Shop":    "bg-sky-100 text-sky-700",
  Processing:           "bg-orange-100 text-orange-700",
  "Ready for Delivery": "bg-teal-100 text-teal-700",
  "Out for Delivery":   "bg-cyan-100 text-cyan-700",
  Completed:            "bg-emerald-100 text-emerald-700",
};

export const ORDER_TYPE_COLORS = {
  walkin: "bg-violet-100 text-violet-700",
  pickup: "bg-sky-100 text-sky-700",
};
