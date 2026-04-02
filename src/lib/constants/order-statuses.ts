export const ORDER_STATUSES = [
  'New Order',
  'For Pickup',
  'Arrived at Shop',
  'Processing',
  'Ready for Delivery',
  'Out for Delivery',
  'Completed',
] as const

export type OrderStatus = (typeof ORDER_STATUSES)[number]

export const STATUS_COLORS: Record<OrderStatus, string> = {
  'New Order':          'bg-gray-100 text-gray-700',
  'For Pickup':         'bg-yellow-100 text-yellow-700',
  'Arrived at Shop':    'bg-blue-100 text-blue-700',
  'Processing':         'bg-orange-100 text-orange-700',
  'Ready for Delivery': 'bg-teal-100 text-teal-700',
  'Out for Delivery':   'bg-green-100 text-green-700',
  'Completed':          'bg-emerald-100 text-emerald-700',
}
