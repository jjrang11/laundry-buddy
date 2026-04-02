'use client'

import { useState, useEffect, useRef, useCallback } from 'react'

const SEARCH_DEBOUNCE_MS = 400

export function useDebouncedSearch(urlValue: string, onCommit: (val: string) => void) {
  const [localValue, setLocalValue] = useState(urlValue)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    setLocalValue(urlValue)
  }, [urlValue])

  const handleChange = useCallback(
    (val: string) => {
      setLocalValue(val)
      if (timerRef.current) clearTimeout(timerRef.current)
      timerRef.current = setTimeout(() => onCommit(val), SEARCH_DEBOUNCE_MS)
    },
    [onCommit]
  )

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [])

  return { localValue, handleChange }
}
