import type { OrderStatus } from '@/lib/constants/order-statuses'

export type { OrderStatus }
export type OrderType = 'pickup' | 'walkin'

export interface AdditionalCharge {
  id: string
  name: string
  amount: number
  created_at: string
  updated_at: string
  deleted_at?: string | null
}

export interface OrderCharge {
  id: string
  order_id: string
  charge_name: string
  charge_amount: number
  created_at: string
}

export interface Order {
  id: string
  customer_name: string
  contact_number: string
  order_type: OrderType
  address: string | null
  weight: number | null
  price_per_kg: number
  total_price: number | null
  notes: string | null
  status: OrderStatus
  created_at: string
  updated_at: string
  deleted_at?: string | null
  order_charges?: OrderCharge[]
}

export interface ShopBranding {
  shop_name: string | null
  logo_url: string | null
}
