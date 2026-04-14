'use client'

import { createContext, useContext, useState } from 'react'

interface MobileNavContextValue {
  isMobileNavOpen: boolean
  openMobileNav: () => void
  closeMobileNav: () => void
}

const MobileNavContext = createContext<MobileNavContextValue | null>(null)

export function MobileNavProvider({ children }: { children: React.ReactNode }) {
  const [isMobileNavOpen, setOpen] = useState(false)
  return (
    <MobileNavContext.Provider value={{
      isMobileNavOpen,
      openMobileNav: () => setOpen(true),
      closeMobileNav: () => setOpen(false),
    }}>
      {children}
    </MobileNavContext.Provider>
  )
}

export function useMobileNav() {
  const ctx = useContext(MobileNavContext)
  if (!ctx) throw new Error('useMobileNav must be used within MobileNavProvider')
  return ctx
}
