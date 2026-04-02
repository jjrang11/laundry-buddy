import type { User } from '@supabase/supabase-js'

export type UserRole = 'admin' | 'staff'

export function getUserRole(user: User | null): UserRole {
  return (user?.user_metadata?.role as UserRole) ?? 'staff'
}
