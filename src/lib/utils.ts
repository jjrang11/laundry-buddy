import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import type { Order } from '@/lib/types'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
  }).format(amount)
}

export function computeGrandTotal(order: Order): number | null {
  const chargesSum = order.order_charges?.reduce((acc, c) => acc + c.charge_amount, 0) ?? 0
  if (order.total_price == null && chargesSum === 0) return null
  return (order.total_price ?? 0) + chargesSum
}

export function formatRelativeTime(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  if (diffMins < 1) return 'just now'
  if (diffMins < 60) return `${diffMins}m ago`
  const diffHours = Math.floor(diffMins / 60)
  if (diffHours < 24) return `${diffHours}h ago`
  const diffDays = Math.floor(diffHours / 24)
  return `${diffDays}d ago`
}
