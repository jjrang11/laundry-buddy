'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { ORDER_STATUSES } from '@/lib/constants/order-statuses'
import type { OrderStatus } from '@/lib/constants/order-statuses'
import { getUserShopId } from '@/lib/auth-utils'

export type OrderActionState = { error: string } | { success: true } | null

// ── Helpers ────────────────────────────────────────────────────────────────

function parseChargeIds(formData: FormData): string[] {
  try {
    const raw = formData.get('selected_charge_ids') as string
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed.filter((id) => typeof id === 'string') : []
  } catch {
    return []
  }
}

// ── Status update (used by drag-and-drop) ──────────────────────────────────

export async function updateOrderStatus(id: string, status: OrderStatus): Promise<void> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized.')
  if (!ORDER_STATUSES.includes(status as OrderStatus)) throw new Error('Invalid status.')
  const { error } = await supabase
    .from('orders')
    .update({ status })
    .eq('id', id)

  if (error) {
    console.error('[updateOrderStatus]', error)
    throw new Error('Something went wrong. Please try again.')
  }
  revalidatePath('/dashboard')
  revalidatePath('/orders')
  revalidatePath('/delivery')
}

// ── Create ─────────────────────────────────────────────────────────────────

export async function createOrder(
  _prev: OrderActionState,
  formData: FormData
): Promise<OrderActionState> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized.' }

  const shopId = getUserShopId(user)
  if (!shopId) return { error: 'Not associated with a shop.' }

  const customerName = (formData.get('customer_name') as string)?.trim()
  const contactNumber = (formData.get('contact_number') as string)?.trim()
  const orderType = formData.get('order_type') as string
  const address = (formData.get('address') as string)?.trim() || null
  const weightRaw = formData.get('weight') as string
  const notes = (formData.get('notes') as string)?.trim() || null

  if (!customerName) return { error: 'Customer name is required.' }
  if (orderType === 'walkin' && !contactNumber) return { error: 'Contact number is required for walk-in orders.' }
  if (orderType === 'pickup' && !address) return { error: 'Address is required for pickup orders.' }
  if (!['pickup', 'walkin'].includes(orderType)) return { error: 'Invalid order type.' }

  const weight = weightRaw ? parseFloat(weightRaw) : null
  if (weight !== null && (isNaN(weight) || weight <= 0)) {
    return { error: 'Weight must be a positive number.' }
  }

  // Snapshot current price_per_kg at time of order creation
  const { data: settings } = await supabase
    .from('settings')
    .select('price_per_kg')
    .single()
  const pricePerKg = settings?.price_per_kg ?? 0

  const { data: inserted, error } = await supabase
    .from('orders')
    .insert({
      customer_name: customerName,
      contact_number: contactNumber,
      order_type: orderType,
      address,
      weight,
      price_per_kg: pricePerKg,
      notes,
      status: orderType === 'walkin' ? 'Arrived at Shop' : 'New Order',
      shop_id: shopId,
    })
    .select('id')
    .single()

  if (error) {
    console.error('[createOrder]', error)
    return { error: 'Something went wrong. Please try again.' }
  }

  // Snapshot selected additional charges
  const chargeIds = parseChargeIds(formData)
  if (chargeIds.length > 0 && inserted) {
    const { data: catalog } = await supabase
      .from('additional_charges')
      .select('id, name, amount')
      .in('id', chargeIds)

    if (catalog && catalog.length > 0) {
      await supabase.from('order_charges').insert(
        catalog.map((c) => ({
          order_id: inserted.id,
          charge_name: c.name,
          charge_amount: c.amount,
        }))
      )
    }
  }

  revalidatePath('/dashboard')
  revalidatePath('/orders')
  return { success: true }
}

// ── Update ─────────────────────────────────────────────────────────────────

export async function updateOrder(
  id: string,
  _prev: OrderActionState,
  formData: FormData
): Promise<OrderActionState> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized.' }

  const customerName = (formData.get('customer_name') as string)?.trim()
  const contactNumber = (formData.get('contact_number') as string)?.trim()
  const orderType = formData.get('order_type') as string
  const address = (formData.get('address') as string)?.trim() || null
  const weightRaw = formData.get('weight') as string
  const notes = (formData.get('notes') as string)?.trim() || null

  if (!customerName) return { error: 'Customer name is required.' }
  if (orderType === 'walkin' && !contactNumber) return { error: 'Contact number is required for walk-in orders.' }
  if (orderType === 'pickup' && !address) return { error: 'Address is required for pickup orders.' }

  const weight = weightRaw ? parseFloat(weightRaw) : null
  if (weight !== null && (isNaN(weight) || weight <= 0)) {
    return { error: 'Weight must be a positive number.' }
  }

  const { error } = await supabase
    .from('orders')
    .update({
      customer_name: customerName,
      contact_number: contactNumber,
      order_type: orderType,
      address,
      weight,
      notes,
    })
    .eq('id', id)

  if (error) {
    console.error('[updateOrder]', error)
    return { error: 'Something went wrong. Please try again.' }
  }

  // Replace applied charges: delete existing, insert new snapshot
  const chargeIds = parseChargeIds(formData)

  await supabase.from('order_charges').delete().eq('order_id', id)

  if (chargeIds.length > 0) {
    const { data: catalog } = await supabase
      .from('additional_charges')
      .select('id, name, amount')
      .in('id', chargeIds)

    if (catalog && catalog.length > 0) {
      await supabase.from('order_charges').insert(
        catalog.map((c) => ({
          order_id: id,
          charge_name: c.name,
          charge_amount: c.amount,
        }))
      )
    }
  }

  revalidatePath('/dashboard')
  revalidatePath('/orders')
  return { success: true }
}

// ── Delete ─────────────────────────────────────────────────────────────────

export async function deleteOrder(id: string): Promise<OrderActionState> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized.' }

  const { error } = await supabase
    .from('orders')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id)

  if (error) {
    console.error('[deleteOrder]', error)
    return { error: 'Something went wrong. Please try again.' }
  }

  revalidatePath('/dashboard')
  revalidatePath('/orders')
  return { success: true }
}
