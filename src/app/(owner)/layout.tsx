import { redirect } from 'next/navigation'
import { getUser } from '@/features/auth/auth.actions'
import { isOwner } from '@/lib/auth-utils'
import { OwnerHeader } from '@/components/layout/OwnerHeader'

export default async function OwnerLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getUser()

  if (!user) {
    redirect('/login')
  }

  if (!isOwner(user)) {
    redirect('/dashboard')
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#f7f6f3]">
      <OwnerHeader email={user.email ?? ''} />
      <main className="flex-1">{children}</main>
    </div>
  )
}
