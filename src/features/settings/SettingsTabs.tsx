'use client'

import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useState, useEffect } from 'react'
import { Store, DollarSign, Users, KeyRound } from 'lucide-react'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { BrandingSettings } from './BrandingSettings'
import { PricingSettings } from './PricingSettings'
import { AdditionalChargesSettings } from './AdditionalChargesSettings'
import { TeamSettings } from './TeamSettings'
import { ChangePasswordSettings } from './ChangePasswordSettings'
import type { ShopBranding, AdditionalCharge, TeamMember } from '@/lib/types'
import type { UserRole } from '@/lib/auth-utils'

const ACCOUNT_TABS = [
  { id: 'account', label: 'Account', icon: KeyRound },
] as const

const ADMIN_TABS = [
  { id: 'shop-settings', label: 'Shop Settings', icon: Store },
  { id: 'pricing', label: 'Pricing', icon: DollarSign },
  { id: 'team', label: 'Team', icon: Users },
] as const

type TabId = 'account' | 'shop-settings' | 'pricing' | 'team'

interface SettingsTabsProps {
  pricePerKg: number
  charges: AdditionalCharge[]
  branding: ShopBranding
  shopId: string
  teamMembers: TeamMember[]
  shopName: string
  role: UserRole
}

function SectionHeader({ title, description }: { title: string; description: string }) {
  return (
    <div className="mb-5">
      <p className="text-sm font-semibold text-gray-900">{title}</p>
      <p className="text-xs text-gray-500 mt-0.5">{description}</p>
    </div>
  )
}

function TeamMembersTable({ members }: { members: TeamMember[] }) {
  if (members.length === 0) {
    return <p className="text-sm text-gray-400 py-4">No team members found.</p>
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="text-xs uppercase tracking-wide text-gray-500 font-medium">
            Email
          </TableHead>
          <TableHead className="text-xs uppercase tracking-wide text-gray-500 font-medium">
            Role
          </TableHead>
          <TableHead className="text-xs uppercase tracking-wide text-gray-500 font-medium">
            Joined
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {members.map((member) => (
          <TableRow key={member.id}>
            <TableCell className="text-gray-800 font-medium">{member.email}</TableCell>
            <TableCell>
              <Badge variant={member.role === 'admin' ? 'default' : 'secondary'}>
                {member.role}
              </Badge>
            </TableCell>
            <TableCell className="text-gray-500 tabular-nums">
              {format(new Date(member.created_at), 'MMM d, yyyy')}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

export function SettingsTabs({
  pricePerKg,
  charges,
  branding,
  shopId,
  teamMembers,
  shopName,
  role,
}: SettingsTabsProps) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  const [orientation, setOrientation] = useState<'vertical' | 'horizontal'>('vertical')

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 768px)')
    setOrientation(mq.matches ? 'vertical' : 'horizontal')
    const handler = (e: MediaQueryListEvent) => setOrientation(e.matches ? 'vertical' : 'horizontal')
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  const rawTab = searchParams.get('tab')
  const validIds = role === 'admin'
    ? ['account', 'shop-settings', 'pricing', 'team']
    : ['account']
  const activeTab: TabId = validIds.includes(rawTab as TabId)
    ? (rawTab as TabId)
    : role === 'admin'
      ? 'shop-settings'
      : 'account'

  function handleTabChange(tabId: string) {
    const params = new URLSearchParams(searchParams.toString())
    params.set('tab', tabId)
    router.push(`${pathname}?${params.toString()}`)
  }

  return (
    <Tabs
      orientation={orientation}
      value={activeTab}
      onValueChange={handleTabChange}
      className={cn('gap-0 rounded-xl border border-gray-200 bg-white overflow-hidden md:min-h-[500px]')}
    >
      <TabsList className="w-full md:w-52 h-auto self-stretch rounded-none border-b md:border-b-0 md:border-r border-gray-100 bg-gray-50/50 p-2 md:p-3 gap-1 overflow-x-auto">
        {ACCOUNT_TABS.map((tab) => (
          <TabsTrigger key={tab.id} value={tab.id}>
            <tab.icon />
            {tab.label}
          </TabsTrigger>
        ))}
        {role === 'admin' && ADMIN_TABS.map((tab) => (
          <TabsTrigger key={tab.id} value={tab.id}>
            <tab.icon />
            {tab.label}
          </TabsTrigger>
        ))}
      </TabsList>

      <TabsContent value="account" className="p-4 md:p-8">
        <SectionHeader
          title="Change Password"
          description="Update your account password. You'll need your current password to confirm."
        />
        <ChangePasswordSettings />
      </TabsContent>

      {role === 'admin' && <>
        <TabsContent value="shop-settings" className="p-4 md:p-8">
          <SectionHeader
            title="Shop Branding"
            description="Customize your shop's name and logo. Displayed in the dashboard header."
          />
          <BrandingSettings initialBranding={branding} shopId={shopId} />
        </TabsContent>

        <TabsContent value="pricing" className="p-8 space-y-8">
          <div>
            <SectionHeader
              title="Laundry Pricing"
              description="Applied to all new orders. Existing orders retain their original price."
            />
            <PricingSettings currentPrice={pricePerKg} />
          </div>
          <Separator />
          <div>
            <SectionHeader
              title="Additional Charges"
              description="Named surcharges available when creating or editing orders."
            />
            <AdditionalChargesSettings initialCharges={charges} />
          </div>
        </TabsContent>

        <TabsContent value="team" className="p-8 space-y-8">
          <div>
            <SectionHeader
              title="Invite Staff"
              description="Create a new staff account for your shop."
            />
            <TeamSettings shopName={shopName} />
          </div>
          <Separator />
          <div>
            <SectionHeader
              title="Team Members"
              description="All accounts with access to this shop."
            />
            <TeamMembersTable members={teamMembers} />
          </div>
        </TabsContent>
      </>}
    </Tabs>
  )
}
