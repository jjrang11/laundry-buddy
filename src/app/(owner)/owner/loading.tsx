import { Skeleton } from '@/components/ui/skeleton'

function SectionSidebarSkeleton() {
  return (
    <div className="w-full sm:w-56 shrink-0 space-y-1.5">
      <Skeleton className="w-32 h-4" />
      <Skeleton className="w-48 h-3" />
    </div>
  )
}

function CreateShopSkeleton() {
  return (
    <div className="flex flex-col sm:flex-row gap-6 px-8 py-6">
      <SectionSidebarSkeleton />
      <div className="flex-1 min-w-0 space-y-3">
        <Skeleton className="w-full h-9" />
        <Skeleton className="w-full h-9" />
        <Skeleton className="w-28 h-9" />
      </div>
    </div>
  )
}

function ShopRowSkeleton() {
  return (
    <div className="flex items-center gap-4 py-3 border-b border-gray-100 last:border-b-0">
      <Skeleton className="w-1/3 h-4" />
      <Skeleton className="w-24 h-4" />
      <Skeleton className="w-20 h-7 ml-auto" />
    </div>
  )
}

function ShopListSkeleton() {
  return (
    <div className="flex flex-col sm:flex-row gap-6 px-8 py-6">
      <SectionSidebarSkeleton />
      <div className="flex-1 min-w-0">
        <ShopRowSkeleton />
        <ShopRowSkeleton />
        <ShopRowSkeleton />
      </div>
    </div>
  )
}

export default function OwnerLoading() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="mb-8 space-y-1.5">
        <Skeleton className="w-40 h-7" />
        <Skeleton className="w-64 h-4" />
      </div>

      <div className="rounded-xl border border-gray-200 bg-white overflow-hidden divide-y divide-gray-100">
        <CreateShopSkeleton />
        <ShopListSkeleton />
      </div>
    </div>
  )
}
