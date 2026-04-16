import { createBrowserClient } from '@supabase/ssr'

// Module-level singleton — ensures a single WebSocket connection and a single
// auth state across all components (useKanbanOrders, DeliveryBoard, etc.).
// Calling createBrowserClient() more than once is safe (@supabase/ssr caches
// internally by URL+key), but being explicit prevents any version-dependent drift.
let _client: ReturnType<typeof createBrowserClient> | null = null

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) throw new Error('Missing Supabase environment variables: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY must be set.')
  if (!_client) {
    _client = createBrowserClient(url, key)
  }
  return _client
}
