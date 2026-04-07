'use server'

import { createClient } from '@/lib/supabase/server'

export async function setPassword(
  password: string
): Promise<{ error: string } | { success: true }> {
  const supabase = await createClient()
  const { error } = await supabase.auth.updateUser({ password })
  if (error) return { error: error.message }
  return { success: true }
}
