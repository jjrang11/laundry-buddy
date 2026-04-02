'use client'

import { useActionState, useEffect, useState } from 'react'
import { toast } from 'sonner'
import {
  createAdditionalCharge,
  updateAdditionalCharge,
  deleteAdditionalCharge,
  getAdditionalCharges,
} from './additional-charges.actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { Loader2, Pencil, Trash2, Plus, X, Check } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import type { AdditionalCharge } from '@/lib/types'

interface AdditionalChargesSettingsProps {
  initialCharges: AdditionalCharge[]
}

// ── Inline edit row ────────────────────────────────────────────────────────

function EditRow({
  charge,
  onDone,
}: {
  charge: AdditionalCharge
  onDone: () => void
}) {
  const action = updateAdditionalCharge.bind(null, charge.id)
  const [state, formAction, isPending] = useActionState(action, null)

  useEffect(() => {
    if (!state) return
    if ('success' in state) {
      toast.success('Charge updated.')
      onDone()
    }
    if ('error' in state) toast.error(state.error)
  }, [state, onDone])

  return (
    <tr>
      <td colSpan={3} className="py-1.5">
        <form action={formAction} className="flex items-center gap-2">
          <Input
            name="name"
            defaultValue={charge.name}
            placeholder="Charge name"
            disabled={isPending}
            className="h-8 flex-1 text-sm"
          />
          <Input
            name="amount"
            type="number"
            step="0.50"
            min="0"
            defaultValue={charge.amount}
            placeholder="0.00"
            disabled={isPending}
            className="h-8 w-28 text-sm tabular-nums"
          />
          <Button type="submit" size="sm" variant="ghost" disabled={isPending} className="h-8 w-8 p-0">
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4 text-green-600" />}
          </Button>
          <Button type="button" size="sm" variant="ghost" onClick={onDone} disabled={isPending} className="h-8 w-8 p-0">
            <X className="h-4 w-4 text-gray-400" />
          </Button>
        </form>
      </td>
    </tr>
  )
}

// ── Add charge form ────────────────────────────────────────────────────────

function AddChargeForm({ onSuccess, onClose }: { onSuccess: () => void; onClose: () => void }) {
  const [state, formAction, isPending] = useActionState(createAdditionalCharge, null)

  useEffect(() => {
    if (!state) return
    if ('success' in state) {
      toast.success('Charge added.')
      onSuccess()
    }
    if ('error' in state) toast.error(state.error)
  }, [state, onSuccess])

  return (
    <form action={formAction} className="flex items-center gap-2">
      <Input
        name="name"
        placeholder="e.g. Rush Order"
        disabled={isPending}
        autoFocus
        className="h-8 flex-1 text-sm"
      />
      <Input
        name="amount"
        type="number"
        step="0.50"
        min="0"
        placeholder="0.00"
        disabled={isPending}
        className="h-8 w-28 text-sm tabular-nums"
      />
      <Button type="submit" size="sm" disabled={isPending} className="h-8 gap-1">
        {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
        Add
      </Button>
      <Button
        type="button"
        size="sm"
        variant="ghost"
        onClick={onClose}
        disabled={isPending}
        className="h-8 w-8 p-0"
      >
        <X className="h-4 w-4 text-gray-400" />
      </Button>
    </form>
  )
}

// ── Main component ─────────────────────────────────────────────────────────

export function AdditionalChargesSettings({ initialCharges }: AdditionalChargesSettingsProps) {
  const [charges, setCharges] = useState<AdditionalCharge[]>(initialCharges)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)

  async function refetch() {
    setCharges(await getAdditionalCharges())
  }

  async function handleDelete(id: string) {
    setDeletingId(id)
    try {
      const result = await deleteAdditionalCharge(id)
      if (result && 'error' in result) {
        toast.error(result.error)
      } else {
        toast.success('Charge deleted.')
        setCharges((prev) => prev.filter((c) => c.id !== id))
      }
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <>
      {/* Charges table */}
      <div>
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-gray-100">
              <th scope="col" className="text-left text-xs font-medium text-gray-500 uppercase tracking-wide py-3 pr-4">
                Charge Name
              </th>
              <th scope="col" className="text-left text-xs font-medium text-gray-500 uppercase tracking-wide py-3 pr-4">
                Amount
              </th>
              <th scope="col" className="py-3 w-20" />
            </tr>
          </thead>
          <tbody>
            {charges.length === 0 && editingId === null && (
              <tr>
                <td colSpan={3} className="py-6 text-sm text-gray-400 text-center">
                  No charges configured yet.
                </td>
              </tr>
            )}
            {charges.map((charge) =>
              editingId === charge.id ? (
                <EditRow
                  key={charge.id}
                  charge={charge}
                  onDone={async () => {
                    setEditingId(null)
                    await refetch()
                  }}
                />
              ) : (
                <tr key={charge.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50">
                  <td className="py-2.5 pr-4 font-medium text-gray-800">{charge.name}</td>
                  <td className="py-2.5 pr-4 text-gray-500 tabular-nums">{formatCurrency(charge.amount)}</td>
                  <td className="py-2.5 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setEditingId(charge.id)}
                        className="h-7 w-7 p-0 text-gray-400 hover:text-gray-700"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setConfirmDeleteId(charge.id)}
                        disabled={deletingId === charge.id}
                        className="h-7 w-7 p-0 text-gray-400 hover:text-red-600"
                      >
                        {deletingId === charge.id
                          ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          : <Trash2 className="h-3.5 w-3.5" />
                        }
                      </Button>
                    </div>
                  </td>
                </tr>
              )
            )}
          </tbody>
        </table>
      </div>

      <Separator className="mt-1" />

      {/* Add form */}
      <div className="pt-4">
        {showAddForm ? (
          <AddChargeForm
            onSuccess={async () => { setShowAddForm(false); await refetch() }}
            onClose={() => setShowAddForm(false)}
          />
        ) : (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setShowAddForm(true)}
            className="gap-1.5 h-8 w-full border-dashed text-gray-500 hover:text-gray-700"
          >
            <Plus className="h-3.5 w-3.5" />
            Add Charge
          </Button>
        )}
      </div>
      <ConfirmDialog
        open={confirmDeleteId !== null}
        title="Delete this charge?"
        description="This charge will be removed from the list and won't be available for new orders. Existing orders are not affected."
        confirmLabel="Delete Charge"
        onConfirm={async () => {
          const id = confirmDeleteId!;
          setConfirmDeleteId(null);
          await handleDelete(id);
        }}
        onCancel={() => setConfirmDeleteId(null)}
        isPending={deletingId !== null}
      />
    </>
  )
}
