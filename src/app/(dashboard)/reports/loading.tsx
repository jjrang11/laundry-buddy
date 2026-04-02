import { Skeleton } from '@/components/ui/skeleton'

export default function ReportsLoading() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Page header */}
      <div className="mb-6 space-y-1.5">
        <Skeleton className="w-24 h-6" />
        <Skeleton className="w-48 h-4" />
      </div>

      {/* Tabs */}
      <Skeleton className="w-36 h-8 rounded-lg mb-6" />

      {/* Date row */}
      <div className="flex items-center justify-between mb-4">
        <Skeleton className="w-56 h-4" />
        <Skeleton className="w-28 h-8 rounded-lg" />
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="rounded-xl border border-gray-100 bg-white p-4 ring-1 ring-foreground/10"
          >
            <div className="flex items-center gap-3">
              <Skeleton className="w-8 h-8 rounded-lg" />
              <div className="space-y-1.5">
                <Skeleton className="w-20 h-3" />
                <Skeleton className="w-24 h-6" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Chart area */}
      <div className="mt-6 rounded-xl border border-gray-100 bg-white ring-1 ring-foreground/10 p-4 min-h-[180px]">
        <Skeleton className="w-full h-full min-h-[140px]" />
      </div>
    </div>
  )
}
