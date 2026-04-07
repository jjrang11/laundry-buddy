'use server'

import { createClient } from '@/lib/supabase/server'

export type ChangePasswordActionState = { error: string } | { success: true } | null

export async function changePassword(
  _prev: ChangePasswordActionState,
  formData: FormData
): Promise<ChangePasswordActionState> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized.' }

  const currentPassword = formData.get('current_password') as string
  const newPassword     = formData.get('new_password') as string
  const confirmPassword = formData.get('confirm_password') as string

  if (!currentPassword || !newPassword || !confirmPassword)
    return { error: 'All fields are required.' }

  if (newPassword !== confirmPassword)
    return { error: 'New passwords do not match.' }

  if (newPassword.length < 8)
    return { error: 'New password must be at least 8 characters.' }

  if (newPassword === currentPassword)
    return { error: 'New password must be different from your current password.' }

  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: user.email!,
    password: currentPassword,
  })
  if (signInError) return { error: 'Current password is incorrect.' }

  const { error: updateError } = await supabase.auth.updateUser({ password: newPassword })
  if (updateError) {
    console.error('[changePassword]', updateError)
    return { error: 'Failed to update password. Please try again.' }
  }

  return { success: true }
}
