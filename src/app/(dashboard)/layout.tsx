import { redirect } from 'next/navigation'
import { getUser } from '@/features/auth/auth.actions'
import { getUserRole, getUserShopId, isOwner } from '@/lib/auth-utils'
import { getShopBranding } from '@/features/settings/branding.actions'
import { createServiceRoleClient } from '@/lib/supabase/service-role'
import { DashboardHeader } from '@/components/layout/DashboardHeader'
import { SideNav } from '@/components/layout/SideNav'
import { MobileNavProvider } from '@/components/layout/MobileNavProvider'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getUser()

  if (!user) {
    redirect('/login')
  }

  const role = getUserRole(user)

  if (isOwner(user)) {
    redirect('/owner')
  }

  const shopId = getUserShopId(user)
  if (!shopId) {
    redirect('/onboarding')
  }

  // Block access for suspended shops. Uncached so reactivation takes effect immediately.
  const adminClient = createServiceRoleClient()
  const { data: shop } = await adminClient
    .from('shops')
    .select('is_suspended')
    .eq('id', shopId)
    .single()

  if (shop?.is_suspended) {
    redirect('/suspended')
  }

  const [branding] = await Promise.all([getShopBranding()])

  return (
    <div className="flex flex-col h-screen bg-[#F8FAFC] overflow-hidden">
      <MobileNavProvider>
        <DashboardHeader email={user.email ?? ''} role={role} branding={branding} />
        <div className="flex flex-1 overflow-hidden">
          <SideNav role={role} />
          <main className="flex-1 overflow-y-auto">{children}</main>
        </div>
      </MobileNavProvider>
    </div>
  )
}
