'use client'

import { useCallback, useTransition } from 'react'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'

export function useTableNavigation<T extends Record<string, unknown>>() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()

  const navigate = useCallback(
    (updates: Partial<T>) => {
      const current = new URLSearchParams(searchParams.toString())
      Object.entries(updates).forEach(([k, v]) => {
        if (v == null || v === '') {
          current.delete(k)
        } else {
          current.set(k, String(v))
        }
      })
      startTransition(() => {
        router.push(`${pathname}?${current.toString()}`)
      })
    },
    [router, pathname, searchParams]
  )

  return { navigate, isPending }
}
