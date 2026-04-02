'use client'

import { useActionState, useEffect } from 'react'
import { toast } from 'sonner'
import { updatePricePerKg } from './settings.actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Loader2 } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

interface PricingSettingsProps {
  currentPrice: number
}

export function PricingSettings({ currentPrice }: PricingSettingsProps) {
  const [state, formAction, isPending] = useActionState(updatePricePerKg, null)

  useEffect(() => {
    if (!state) return
    if ('success' in state) toast.success('Price updated successfully.')
    if ('error' in state) toast.error(state.error)
  }, [state])

  return (
    <>
      {/* Current price display */}
      <div className="pb-4">
        <p className="text-xs text-gray-500 uppercase tracking-wide font-medium mb-1">
          Current Price per kg
        </p>
        <p className="text-3xl font-bold text-gray-900 tabular-nums">
          {formatCurrency(currentPrice)}
          <span className="text-base font-normal text-gray-400 ml-1">/ kg</span>
        </p>
      </div>

      <Separator className="mb-4" />

      {/* Update form */}
      <form action={formAction} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="price_per_kg">New Price per kg (₱)</Label>
          <div className="flex gap-2">
            <Input
              id="price_per_kg"
              name="price_per_kg"
              type="number"
              step="0.50"
              min="1"
              placeholder={currentPrice.toString()}
              disabled={isPending}
              className="max-w-[160px] tabular-nums"
            />
            <Button type="submit" disabled={isPending} size="sm" className="gap-1.5">
              {isPending ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Saving…</>
              ) : (
                'Update Price'
              )}
            </Button>
          </div>
          <p className="text-xs text-gray-400">
            New orders will automatically use this price.
          </p>
        </div>
      </form>
    </>
  )
}
