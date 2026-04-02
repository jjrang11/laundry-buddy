import { Skeleton } from '@/components/ui/skeleton'

function CardShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
      {children}
    </div>
  )
}

function CardHeaderSkeleton() {
  return (
    <div className="flex items-center gap-3 p-4">
      <Skeleton className="w-8 h-8 rounded-lg" />
      <div className="space-y-1.5">
        <Skeleton className="w-32 h-4" />
        <Skeleton className="w-48 h-3" />
      </div>
    </div>
  )
}

function HorizontalRule() {
  return <div className="border-t border-gray-200" />
}

function PricingSettingsSkeleton() {
  return (
    <CardShell>
      <CardHeaderSkeleton />
      <HorizontalRule />
      <div className="p-4 space-y-2">
        <Skeleton className="w-28 h-3" />
        <Skeleton className="w-36 h-9" />
      </div>
      <HorizontalRule />
      <div className="flex items-center gap-3 p-4">
        <Skeleton className="w-40 h-8" />
        <Skeleton className="w-28 h-8" />
      </div>
    </CardShell>
  )
}

function TableRowSkeleton() {
  return (
    <div className="flex items-center gap-4 px-4 py-3 border-b border-gray-100 last:border-b-0">
      <Skeleton className="w-1/3 h-4" />
      <Skeleton className="w-20 h-4" />
      <Skeleton className="w-16 h-4" />
    </div>
  )
}

function AdditionalChargesSkeleton() {
  return (
    <CardShell>
      <CardHeaderSkeleton />
      <HorizontalRule />
      <div>
        <TableRowSkeleton />
        <TableRowSkeleton />
        <TableRowSkeleton />
      </div>
      <HorizontalRule />
      <div className="p-4">
        <Skeleton className="w-full h-8 border border-dashed border-gray-200 bg-transparent" />
      </div>
    </CardShell>
  )
}

export default function SettingsLoading() {
  return (
    <div className="max-w-lg mx-auto px-4 py-8">
      <div className="mb-6 space-y-1.5">
        <Skeleton className="w-32 h-6" />
        <Skeleton className="w-48 h-4" />
      </div>
      <PricingSettingsSkeleton />
      <div className="mt-6">
        <AdditionalChargesSkeleton />
      </div>
    </div>
  )
}
