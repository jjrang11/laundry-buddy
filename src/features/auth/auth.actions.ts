'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createServiceRoleClient } from '@/lib/supabase/service-role'
import { getUserShopId, isOwner } from '@/lib/auth-utils'

export async function signIn(
  _prevState: { error: string } | null,
  formData: FormData
): Promise<{ error: string }> {
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  if (!email || !password) {
    return { error: 'Email and password are required.' }
  }

  const supabase = await createClient()
  const { data: authData, error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    return { error: 'Invalid email or password.' }
  }

  // Block suspended shops. Owners have no shop_id and are never blocked.
  const shopId = getUserShopId(authData.user)
  if (shopId && !isOwner(authData.user)) {
    const adminClient = createServiceRoleClient()
    const { data: shop } = await adminClient
      .from('shops')
      .select('is_suspended')
      .eq('id', shopId)
      .single()

    if (shop?.is_suspended) {
      await supabase.auth.signOut()
      return { error: 'Your shop has been suspended. Please contact support to restore access.' }
    }
  }

  redirect('/dashboard')
}

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}

export async function getUser() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  return user
}

