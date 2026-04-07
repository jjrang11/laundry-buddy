import { Skeleton } from '@/components/ui/skeleton'

export default function SettingsLoading() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-8 space-y-2">
        <Skeleton className="h-7 w-24" />
        <Skeleton className="h-4 w-52" />
      </div>
      <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
        <div className="flex min-h-[500px]">
          <div className="w-52 shrink-0 border-r border-gray-100 bg-gray-50/50 p-3 space-y-1">
            <Skeleton className="h-9 w-full rounded-md" />
            <Skeleton className="h-9 w-full rounded-md" />
            <Skeleton className="h-9 w-full rounded-md" />
          </div>
          <div className="flex-1 p-8 space-y-4">
            <Skeleton className="h-4 w-36" />
            <Skeleton className="h-3 w-60" />
            <div className="mt-6 space-y-3">
              <Skeleton className="h-8 w-64" />
              <Skeleton className="h-8 w-48" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
