import { Skeleton } from '@/components/ui/skeleton'
import { ORDER_STATUSES } from '@/lib/constants/order-statuses'

function SkeletonCard() {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-3 space-y-2">
      <Skeleton className="w-3/4 h-4" />
      <Skeleton className="w-1/2 h-3" />
      <div className="flex justify-between">
        <Skeleton className="w-16 h-3" />
        <Skeleton className="w-20 h-4" />
      </div>
      <div className="flex justify-between">
        <Skeleton className="w-20 h-5 rounded-full" />
        <Skeleton className="w-14 h-3" />
      </div>
    </div>
  )
}

function SkeletonColumn() {
  return (
    <div className="w-[272px] shrink-0 flex flex-col gap-3 h-full">
      <div className="flex items-center gap-2">
        <Skeleton className="w-2.5 h-2.5 rounded-full" />
        <Skeleton className="flex-1 h-4" />
        <Skeleton className="w-6 h-5 rounded-full" />
      </div>
      <SkeletonCard />
      <SkeletonCard />
      <SkeletonCard />
    </div>
  )
}

export default function DashboardLoading() {
  return (
    <div className="flex gap-4 h-full overflow-x-auto px-4 pb-4 pt-4">
      {ORDER_STATUSES.map((status) => (
        <SkeletonColumn key={status} />
      ))}
    </div>
  )
}
