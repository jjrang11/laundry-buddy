'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getUserRole } from '@/lib/auth-utils'
import type { ShopBranding } from '@/lib/types'

export type BrandingActionState = { error: string } | { success: true } | null

export async function getShopBranding(): Promise<ShopBranding> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('settings')
    .select('shop_name, logo_url')
    .single()
  return {
    shop_name: data?.shop_name ?? null,
    logo_url: data?.logo_url ?? null,
  }
}

export async function updateShopName(
  _prev: BrandingActionState,
  formData: FormData
): Promise<BrandingActionState> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized.' }
  const role = getUserRole(user)
  if (role !== 'admin') return { error: 'Only admins can perform this action.' }

  const raw = (formData.get('shop_name') as string | null)?.trim() ?? ''
  if (!raw) return { error: 'Shop name cannot be empty.' }
  if (raw.length > 80) return { error: 'Shop name must be 80 characters or fewer.' }

  const { error } = await supabase
    .from('settings')
    .update({ shop_name: raw })
    .not('id', 'is', null)

  if (error) {
    console.error('[updateShopName]', error)
    return { error: 'Something went wrong. Please try again.' }
  }

  revalidatePath('/', 'layout')
  revalidatePath('/settings')
  return { success: true }
}

export async function updateLogoUrl(logoUrl: string | null): Promise<BrandingActionState> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized.' }
  const role = getUserRole(user)
  if (role !== 'admin') return { error: 'Only admins can perform this action.' }

  if (logoUrl !== null && !logoUrl.startsWith('https://')) {
    return { error: 'Logo URL must be a valid HTTPS URL.' }
  }

  const { error } = await supabase
    .from('settings')
    .update({ logo_url: logoUrl })
    .not('id', 'is', null)

  if (error) {
    console.error('[updateLogoUrl]', error)
    return { error: 'Something went wrong. Please try again.' }
  }

  revalidatePath('/', 'layout')
  revalidatePath('/settings')
  return { success: true }
}
