import { redirect } from 'next/navigation'
import { getUser } from '@/features/auth/auth.actions'
import { getUserRole } from '@/lib/auth-utils'
import { getPricePerKg } from '@/features/settings/settings.actions'
import { getAdditionalCharges } from '@/features/settings/additional-charges.actions'
import { getShopBranding } from '@/features/settings/branding.actions'
import { PricingSettings } from '@/features/settings/PricingSettings'
import { AdditionalChargesSettings } from '@/features/settings/AdditionalChargesSettings'
import { BrandingSettings } from '@/features/settings/BrandingSettings'

export default async function SettingsPage() {
  const user = await getUser()
  const role = getUserRole(user)

  if (role !== 'admin') {
    redirect('/dashboard')
  }

  const [pricePerKg, charges, branding] = await Promise.all([
    getPricePerKg(),
    getAdditionalCharges(),
    getShopBranding(),
  ])

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-sm text-gray-500 mt-1">Manage your shop configuration.</p>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white overflow-hidden divide-y divide-gray-100">

        <div className="flex flex-col sm:flex-row gap-6 px-8 py-6">
          <div className="w-full sm:w-56 shrink-0">
            <p className="text-sm font-semibold text-gray-900">Shop Branding</p>
            <p className="text-xs text-gray-500 mt-1">
              Customize your shop&apos;s name and logo. Displayed in the dashboard header.
            </p>
          </div>
          <div className="flex-1 min-w-0">
            <BrandingSettings initialBranding={branding} />
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-6 px-8 py-6">
          <div className="w-full sm:w-56 shrink-0">
            <p className="text-sm font-semibold text-gray-900">Laundry Pricing</p>
            <p className="text-xs text-gray-500 mt-1">
              Applied to all new orders. Existing orders retain their original price.
            </p>
          </div>
          <div className="flex-1 min-w-0">
            <PricingSettings currentPrice={pricePerKg} />
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-6 px-8 py-6">
          <div className="w-full sm:w-56 shrink-0">
            <p className="text-sm font-semibold text-gray-900">Additional Charges</p>
            <p className="text-xs text-gray-500 mt-1">
              Named surcharges available when creating or editing orders.
            </p>
          </div>
          <div className="flex-1 min-w-0">
            <AdditionalChargesSettings initialCharges={charges} />
          </div>
        </div>

      </div>
    </div>
  )
}
