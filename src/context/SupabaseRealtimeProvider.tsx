'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

// Signals that the realtime auth token has been primed and it is safe for
// subscription hooks to call .subscribe(). Without this gate, concurrent
// setup() calls in useKanbanOrders and DeliveryBoard both trigger
// refreshSession() on the same singleton auth client, racing each other and
// leaving accessTokenValue null when the Phoenix channel join fires → TIMED_OUT.
const RealtimeReadyContext = createContext(false)

export function useRealtimeReady() {
  return useContext(RealtimeReadyContext)
}

export function SupabaseRealtimeProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const supabase = createClient()

    async function prime() {
      // 1. Get (or refresh) session — same conditional guard as before to avoid
      //    unnecessary TOKEN_REFRESHED events that disrupt in-flight UI actions.
      let { data: { session } } = await supabase.auth.getSession()
      if (!session?.user?.user_metadata?.shop_id) {
        const { data: refreshed } = await supabase.auth.refreshSession()
        session = refreshed.session
      }
      if (!session) {
        setReady(true)
        return
      }

      // 2. Re-call getSession() explicitly so the auth client's in-memory cache
      //    holds the latest session before setAuth() runs. This ensures that when
      //    the realtime client invokes _getAccessToken() during the channel join,
      //    it resolves synchronously from the cache rather than doing an async
      //    cookie read — removing the timing gap between setAuth() returning and
      //    the join payload being assembled.
      await supabase.auth.getSession()

      // 3. Register the callback without passing an explicit token, keeping
      //    _manuallySetToken = false. This preserves the 'ok'-handler setAuth()
      //    call that the server requires to begin routing postgres_changes events.
      await supabase.realtime.setAuth()

      setReady(true)
    }

    prime()

    // Keep realtime auth in sync when the JWT actually rotates (typically every
    // hour). Filtering to TOKEN_REFRESHED only — INITIAL_SESSION also fires on
    // every page load and would trigger a channel rejoin mid-subscription,
    // causing a brief window where realtime events are dropped.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event: string, session: { access_token?: string } | null) => {
      if (event === 'TOKEN_REFRESHED' && session?.access_token) {
        supabase.realtime.setAuth()
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  return (
    <RealtimeReadyContext.Provider value={ready}>
      {children}
    </RealtimeReadyContext.Provider>
  )
}
