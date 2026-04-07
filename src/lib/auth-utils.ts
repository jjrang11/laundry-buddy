import type { User } from '@supabase/supabase-js'

export type UserRole = 'admin' | 'staff' | 'owner'

export function getUserRole(user: User | null): UserRole {
  return (user?.user_metadata?.role as UserRole) ?? 'staff'
}

export function getUserShopId(user: User | null): string | null {
  return (user?.user_metadata?.shop_id as string) ?? null
}

export function isOwner(user: User | null): boolean {
  return user?.user_metadata?.role === 'owner'
}
