import { getAllShops } from '@/features/owner/owner.actions'
import { CreateShopSection } from '@/features/owner/CreateShopSection'
import { ShopList } from '@/features/owner/ShopList'

export default async function OwnerPage() {
  const shops = await getAllShops()

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Owner Portal</h1>
        <p className="text-sm text-gray-500 mt-1">Manage shops and invite shop admins.</p>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white overflow-hidden divide-y divide-gray-100">

        {/* Create New Shop section */}
        <div className="flex flex-col sm:flex-row gap-6 px-8 py-6">
          <div className="w-full sm:w-56 shrink-0">
            <p className="text-sm font-semibold text-gray-900">Create New Shop</p>
            <p className="text-xs text-gray-500 mt-1">
              Set up a new shop and send an admin invitation to the owner&apos;s email.
            </p>
          </div>
          <div className="flex-1 min-w-0">
            <CreateShopSection />
          </div>
        </div>

        {/* All Shops section */}
        <div className="flex flex-col sm:flex-row gap-6 px-8 py-6">
          <div className="w-full sm:w-56 shrink-0">
            <p className="text-sm font-semibold text-gray-900">All Shops</p>
            <p className="text-xs text-gray-500 mt-1">
              View all registered shops and invite additional admins.
            </p>
          </div>
          <div className="flex-1 min-w-0">
            <ShopList shops={shops} />
          </div>
        </div>

      </div>
    </div>
  )
}
