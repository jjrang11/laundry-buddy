'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getUserRole } from '@/lib/auth-utils'

export type SettingsActionState = { error: string } | { success: true } | null

export async function getPricePerKg(): Promise<number> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('settings')
    .select('price_per_kg')
    .single()
  return data?.price_per_kg ?? 0
}

export async function updatePricePerKg(
  _prev: SettingsActionState,
  formData: FormData
): Promise<SettingsActionState> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized.' }
  const role = getUserRole(user)
  if (role !== 'admin') return { error: 'Only admins can perform this action.' }

  const raw = formData.get('price_per_kg') as string
  const price = parseFloat(raw)

  if (!raw || isNaN(price) || price <= 0) {
    return { error: 'Price must be a positive number.' }
  }

  const { error } = await supabase
    .from('settings')
    .update({ price_per_kg: price })
    .not('id', 'is', null)

  if (error) {
    console.error('[updatePricePerKg]', error)
    return { error: 'Something went wrong. Please try again.' }
  }

  revalidatePath('/dashboard')
  revalidatePath('/settings')
  return { success: true }
}
