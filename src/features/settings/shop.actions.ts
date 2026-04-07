'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createServiceRoleClient } from '@/lib/supabase/service-role'
import { getUserRole } from '@/lib/auth-utils'
import type { TeamMember } from '@/lib/types'

export type ShopActionState = { error: string } | { success: true } | null

// ── Create shop (onboarding) ───────────────────────────────────────────────
// Called when a newly registered admin names their shop.
// The user is already authenticated but has no shop_id in their JWT yet.

export async function createShop(shopName: string): Promise<ShopActionState> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized.' }

  const trimmedName = shopName?.trim()
  if (!trimmedName) return { error: 'Shop name is required.' }

  const adminClient = createServiceRoleClient()

  // 1. Insert the shop record.
  const { data: shop, error: shopError } = await adminClient
    .from('shops')
    .insert({ name: trimmedName })
    .select('id')
    .single()

  if (shopError || !shop) {
    console.error('[createShop] shop insert', shopError)
    return { error: 'Could not create shop. Please try again.' }
  }

  // 2. Seed the settings row for this shop.
  const { error: settingsError } = await adminClient
    .from('settings')
    .insert({ shop_id: shop.id, price_per_kg: 80, shop_name: trimmedName })

  if (settingsError) {
    console.error('[createShop] settings insert', settingsError)
    return { error: 'Could not initialise shop settings. Please try again.' }
  }

  // 3. Stamp shop_id onto the user's metadata so the next JWT contains it.
  const { error: updateError } = await adminClient.auth.admin.updateUserById(
    user.id,
    {
      user_metadata: {
        ...user.user_metadata,
        shop_id: shop.id,
      },
    }
  )

  if (updateError) {
    console.error('[createShop] user metadata update', updateError)
    return { error: 'Could not link user to shop. Please try again.' }
  }

  // 4. Sign out so the user re-authenticates with a fresh JWT that carries shop_id.
  await supabase.auth.signOut()

  redirect('/login')
}

// ── Invite staff member ────────────────────────────────────────────────────
// Sends a Supabase magic-link invitation with role=staff and the admin's
// shop_id pre-baked into the new user's metadata.

export async function inviteStaff(email: string): Promise<ShopActionState> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized.' }

  const role = getUserRole(user)
  if (role !== 'admin') return { error: 'Only admins can invite staff.' }

  const shopId = user.user_metadata?.shop_id as string | undefined
  if (!shopId) return { error: 'Not associated with a shop.' }

  const trimmedEmail = email?.trim()
  if (!trimmedEmail) return { error: 'Email is required.' }

  const adminClient = createServiceRoleClient()

  // Fetch the shop name so the default password can be derived from it.
  const { data: shopData, error: shopError } = await adminClient
    .from('shops')
    .select('name')
    .eq('id', shopId)
    .single()

  if (shopError || !shopData) {
    console.error('[inviteStaff] shop fetch', shopError)
    return { error: 'Could not resolve shop. Please try again.' }
  }

  // Default password: shop name lowercased, spaces removed, suffixed with "123".
  // e.g. "Sunrise Laundry" → "sunriselaundry123"
  const defaultPassword =
    shopData.name.toLowerCase().replace(/\s+/g, '') + '123'

  const { error: inviteError } = await adminClient.auth.admin.createUser({
    email: trimmedEmail,
    password: defaultPassword,
    email_confirm: true,
    user_metadata: {
      role: 'staff',
      shop_id: shopId,
    },
  })

  if (inviteError) {
    console.error('[inviteStaff] create user error:', inviteError.message, inviteError)
    return { error: inviteError.message ?? 'Could not create staff user. Please try again.' }
  }

  return { success: true }
}

// ── List team members ──────────────────────────────────────────────────────
// Returns all auth users belonging to the current admin's shop.

export async function getTeamMembers(): Promise<TeamMember[]> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const role = getUserRole(user)
  if (role !== 'admin') return []

  const shopId = user.user_metadata?.shop_id as string | undefined
  if (!shopId) return []

  const adminClient = createServiceRoleClient()
  const { data, error } = await adminClient.auth.admin.listUsers({ perPage: 1000 })
  if (error) {
    console.error('[getTeamMembers]', error)
    return []
  }

  return data.users
    .filter((u) => u.user_metadata?.shop_id === shopId)
    .map((u) => ({
      id: u.id,
      email: u.email ?? '(no email)',
      role: (u.user_metadata?.role as string) ?? 'staff',
      created_at: u.created_at,
    }))
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
}
