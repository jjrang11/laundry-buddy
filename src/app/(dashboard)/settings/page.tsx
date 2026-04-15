import { Suspense } from 'react'
import { getUser } from '@/features/auth/auth.actions'
import { getUserRole, getUserShopId } from '@/lib/auth-utils'
import { getPricePerKg } from '@/features/settings/settings.actions'
import { getAdditionalCharges } from '@/features/settings/additional-charges.actions'
import { getShopBranding } from '@/features/settings/branding.actions'
import { getTeamMembers } from '@/features/settings/shop.actions'
import { SettingsTabs } from '@/features/settings/SettingsTabs'
import { Skeleton } from '@/components/ui/skeleton'
import type { AdditionalCharge, TeamMember } from '@/lib/types'

function SettingsTabsSkeleton() {
  return (
    <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
      <div className="flex min-h-[500px]">
        <div className="w-52 shrink-0 border-r border-gray-100 bg-gray-50/50 p-3 space-y-1">
          <Skeleton className="h-9 w-full rounded-md" />
          <Skeleton className="h-9 w-full rounded-md" />
          <Skeleton className="h-9 w-full rounded-md" />
        </div>
        <div className="flex-1 p-8 space-y-4">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-64" />
          <div className="mt-6 space-y-3">
            <Skeleton className="h-8 w-56" />
            <Skeleton className="h-8 w-40" />
          </div>
        </div>
      </div>
    </div>
  )
}

export default async function SettingsPage() {
  const user = await getUser()
  const role = getUserRole(user)
  const shopId = getUserShopId(user) ?? ''

  const isAdmin = role === 'admin'
  const [pricePerKg, charges, branding, teamMembers] = isAdmin
    ? await Promise.all([
        getPricePerKg(),
        getAdditionalCharges(),
        getShopBranding(),
        getTeamMembers(),
      ])
    : ([0, [], { shop_name: null, logo_url: null }, []] as [number, AdditionalCharge[], { shop_name: null; logo_url: null }, TeamMember[]])

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-sm text-gray-500 mt-1">Manage your account and shop configuration.</p>
      </div>

      <Suspense fallback={<SettingsTabsSkeleton />}>
        <SettingsTabs
          pricePerKg={pricePerKg}
          charges={charges}
          branding={branding}
          shopId={shopId}
          teamMembers={teamMembers}
          shopName={branding.shop_name ?? ''}
          role={role}
        />
      </Suspense>
    </div>
  )
}
