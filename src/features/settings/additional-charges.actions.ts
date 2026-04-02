'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getUserRole } from '@/lib/auth-utils'
import type { AdditionalCharge } from '@/lib/types'

export type ChargesActionState = { error: string } | { success: true } | null

export async function getAdditionalCharges(): Promise<AdditionalCharge[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('additional_charges')
    .select('*')
    .is('deleted_at', null)
    .order('created_at', { ascending: true })
  return (data as AdditionalCharge[]) ?? []
}

export async function createAdditionalCharge(
  _prev: ChargesActionState,
  formData: FormData
): Promise<ChargesActionState> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized.' }
  const role = getUserRole(user)
  if (role !== 'admin') return { error: 'Only admins can perform this action.' }

  const name = (formData.get('name') as string)?.trim()
  const raw = formData.get('amount') as string
  const amount = parseFloat(raw)

  if (!name) return { error: 'Charge name is required.' }
  if (!raw || isNaN(amount) || amount < 0) return { error: 'Amount must be a positive number.' }

  const { error } = await supabase
    .from('additional_charges')
    .insert({ name, amount })

  if (error) {
    console.error('[createAdditionalCharge]', error)
    return { error: 'Something went wrong. Please try again.' }
  }

  revalidatePath('/settings')
  return { success: true }
}

export async function updateAdditionalCharge(
  id: string,
  _prev: ChargesActionState,
  formData: FormData
): Promise<ChargesActionState> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized.' }
  const role = getUserRole(user)
  if (role !== 'admin') return { error: 'Only admins can perform this action.' }

  const name = (formData.get('name') as string)?.trim()
  const raw = formData.get('amount') as string
  const amount = parseFloat(raw)

  if (!name) return { error: 'Charge name is required.' }
  if (!raw || isNaN(amount) || amount < 0) return { error: 'Amount must be a positive number.' }

  const { error } = await supabase
    .from('additional_charges')
    .update({ name, amount })
    .eq('id', id)

  if (error) {
    console.error('[updateAdditionalCharge]', error)
    return { error: 'Something went wrong. Please try again.' }
  }

  revalidatePath('/settings')
  return { success: true }
}

export async function deleteAdditionalCharge(id: string): Promise<ChargesActionState> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized.' }
  const role = getUserRole(user)
  if (role !== 'admin') return { error: 'Only admins can perform this action.' }

  const { error } = await supabase
    .from('additional_charges')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id)

  if (error) {
    console.error('[deleteAdditionalCharge]', error)
    return { error: 'Something went wrong. Please try again.' }
  }

  revalidatePath('/settings')
  return { success: true }
}
