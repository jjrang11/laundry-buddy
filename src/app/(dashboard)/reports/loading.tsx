import { Skeleton } from '@/components/ui/skeleton'

export default function ReportsLoading() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Page header */}
      <div className="mb-8 space-y-1.5">
        <Skeleton className="w-24 h-6" />
        <Skeleton className="w-48 h-4" />
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="rounded-xl border border-gray-100 bg-white p-4 ring-1 ring-foreground/10"
          >
            <div className="flex items-center gap-3">
              <Skeleton className="w-8 h-8 rounded-lg shrink-0" />
              <div className="space-y-1.5">
                <Skeleton className="w-16 h-3" />
                <Skeleton className="w-20 h-6" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Filter bar */}
      <div className="mt-6 rounded-xl border border-gray-200 bg-white px-4 py-3">
        <div className="flex flex-wrap items-center gap-2">
          <Skeleton className="w-32 h-8 rounded-lg" />
          <Skeleton className="w-4 h-3" />
          <Skeleton className="w-32 h-8 rounded-lg" />
          <Skeleton className="w-px h-5" />
          <Skeleton className="w-44 h-8 rounded-lg" />
          <Skeleton className="w-44 h-8 rounded-lg" />
          <Skeleton className="w-32 h-8 rounded-lg" />
        </div>
      </div>

      {/* Table */}
      <div className="mt-6">
        <div className="mb-3 flex items-center justify-between">
          <Skeleton className="w-24 h-3" />
          <Skeleton className="w-32 h-3" />
        </div>
        <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
          <div className="px-4 py-2.5 bg-gray-50 border-b border-gray-200 flex gap-8">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-3 w-20" />
            ))}
          </div>
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="px-4 py-3 border-b border-gray-100 flex gap-8">
              {Array.from({ length: 5 }).map((_, j) => (
                <Skeleton key={j} className="h-4 w-20" />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
