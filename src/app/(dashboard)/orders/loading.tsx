import { Skeleton } from '@/components/ui/skeleton'

export default function AllOrdersLoading() {
  return (
    <div className="overflow-y-auto h-full">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="mb-6">
          <Skeleton className="h-5 w-28 mb-1.5" />
          <Skeleton className="h-4 w-48" />
        </div>
        <div className="flex items-center gap-2 mb-4">
          <Skeleton className="h-8 flex-1" />
          <Skeleton className="h-8 w-44" />
        </div>
        <Skeleton className="h-3.5 w-16 mb-2" />
        <div className="rounded-xl border border-gray-200 overflow-hidden bg-white">
          <div className="border-b border-gray-200 bg-gray-50 px-4 py-2.5">
            <Skeleton className="h-3 w-64" />
          </div>
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 px-4 py-3 border-b border-gray-100 last:border-b-0">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-5 w-24 rounded-full" />
              <Skeleton className="h-4 w-14" />
              <Skeleton className="h-4 w-12 ml-auto" />
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-20" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
