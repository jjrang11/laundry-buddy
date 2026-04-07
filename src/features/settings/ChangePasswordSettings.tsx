'use client'

import { useActionState, useEffect, useRef } from 'react'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import { changePassword } from './account.actions'
import type { ChangePasswordActionState } from './account.actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export function ChangePasswordSettings() {
  const [state, formAction, isPending] = useActionState<ChangePasswordActionState, FormData>(changePassword, null)
  const formRef = useRef<HTMLFormElement>(null)

  useEffect(() => {
    if (!state) return
    if ('success' in state) {
      toast.success('Password updated successfully.')
      formRef.current?.reset()
    }
    if ('error' in state) {
      toast.error(state.error)
    }
  }, [state])

  return (
    <form ref={formRef} action={formAction} className="space-y-4 max-w-sm">
      <div className="space-y-1.5">
        <Label htmlFor="current_password">Current Password</Label>
        <Input
          id="current_password"
          name="current_password"
          type="password"
          autoComplete="current-password"
          disabled={isPending}
          required
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="new_password">New Password</Label>
        <Input
          id="new_password"
          name="new_password"
          type="password"
          autoComplete="new-password"
          minLength={8}
          disabled={isPending}
          required
        />
        <p className="text-xs text-gray-400">Minimum 8 characters.</p>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="confirm_password">Confirm New Password</Label>
        <Input
          id="confirm_password"
          name="confirm_password"
          type="password"
          autoComplete="new-password"
          minLength={8}
          disabled={isPending}
          required
        />
      </div>
      <Button type="submit" disabled={isPending} size="sm" className="gap-1.5">
        {isPending ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Updating…
          </>
        ) : (
          'Update Password'
        )}
      </Button>
    </form>
  )
}
