'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getUserRole, getUserShopId } from '@/lib/auth-utils'
import type { ShopBranding } from '@/lib/types'

export type BrandingActionState = { error: string } | { success: true } | null

/** Extract the storage object path from a Supabase public URL. */
function extractStoragePath(url: string, bucket: string): string | null {
  const marker = `/object/public/${bucket}/`
  const idx = url.indexOf(marker)
  return idx !== -1 ? decodeURIComponent(url.slice(idx + marker.length)) : null
}

export async function getShopBranding(): Promise<ShopBranding> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const shopId = getUserShopId(user)
  if (!shopId) return { shop_name: null, logo_url: null }
  const { data } = await supabase
    .from('settings')
    .select('shop_name, logo_url')
    .eq('shop_id', shopId)
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
  const shopId = getUserShopId(user)
  if (!shopId) return { error: 'Not associated with a shop.' }

  const raw = (formData.get('shop_name') as string | null)?.trim() ?? ''
  if (!raw) return { error: 'Shop name cannot be empty.' }
  if (raw.length > 80) return { error: 'Shop name must be 80 characters or fewer.' }

  const { error } = await supabase
    .from('settings')
    .update({ shop_name: raw })
    .eq('shop_id', shopId)

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
  const shopId = getUserShopId(user)
  if (!shopId) return { error: 'Not associated with a shop.' }

  if (logoUrl !== null && !logoUrl.startsWith('https://')) {
    return { error: 'Logo URL must be a valid HTTPS URL.' }
  }

  // Fetch the current logo URL before overwriting so we can clean up the old file
  const { data: current } = await supabase
    .from('settings')
    .select('logo_url')
    .eq('shop_id', shopId)
    .single()
  const oldLogoUrl = current?.logo_url ?? null

  const { error } = await supabase
    .from('settings')
    .update({ logo_url: logoUrl })
    .eq('shop_id', shopId)

  if (error) {
    console.error('[updateLogoUrl]', error)
    return { error: 'Something went wrong. Please try again.' }
  }

  // Delete the previous file from Supabase Storage (non-fatal if it fails)
  if (oldLogoUrl && oldLogoUrl !== logoUrl) {
    const path = extractStoragePath(oldLogoUrl, 'shop-assets')
    if (path) {
      const { error: storageError } = await supabase.storage
        .from('shop-assets')
        .remove([path])
      if (storageError) {
        console.error('[updateLogoUrl] storage cleanup failed', storageError)
      }
    }
  }

  revalidatePath('/', 'layout')
  revalidatePath('/settings')
  return { success: true }
}
