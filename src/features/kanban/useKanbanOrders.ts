"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Order } from "@/lib/types";
import type { OrderStatus } from "@/lib/constants/order-statuses";

export type GroupedOrders = Record<OrderStatus, Order[]>;

// Request permission and fire a browser notification only when the tab is not visible.
// Permission is requested lazily (on first event, not on mount) — avoids immediate popups
// that users dismiss without reading (@react-best-practices: lazy initialization).
async function notifyIfHidden(order: Order) {
  if (typeof window === "undefined") return;
  if (!("Notification" in window)) return;
  if (document.visibilityState === "visible") return;

  let permission = Notification.permission;
  if (permission === "default") {
    permission = await Notification.requestPermission();
  }
  if (permission !== "granted") return;

  new Notification("New Order — Laundry Buddy", {
    body: `${order.customer_name} · ${
      order.order_type === "pickup" ? "Pickup" : "Walk-in"
    }`,
    icon: "/favicon.ico",
    tag: order.id, // de-duplicates rapid successive notifications
  });
}

export type RealtimeStatus = "connecting" | "connected" | "error";

export function useKanbanOrders(initialOrders: Order[], shopId: string) {
  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [newOrderIds, setNewOrderIds] = useState<Set<string>>(new Set());
  const [realtimeStatus, setRealtimeStatus] =
    useState<RealtimeStatus>("connecting");
  const timeoutsRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(
    new Map()
  );

  // Reconnect state — incremented to force the subscription useEffect to re-run
  const retryCountRef = useRef(0);
  const retryTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [retryKey, setRetryKey] = useState(0);

  // Sync server-fetched orders into state when router.refresh() produces new data
  useEffect(() => {
    setOrders(initialOrders);
  }, [initialOrders]);

  useEffect(() => {
    const supabase = createClient();
    let cancelled = false;
    let channelRef: ReturnType<typeof supabase.channel> | null = null;

    async function setup() {
      // Prime the realtime auth token before subscribing.
      //
      // Phoenix socket onConnOpen() calls flushSendBuffer() BEFORE it fires
      // triggerStateCallbacks("open"), so the channel join message leaves the
      // client before our onOpen handler runs. If accessTokenValue is null the
      // join carries no token, get_my_shop_id() returns null, and the server
      // never routes postgres_changes events to this subscription.
      //
      // We call setAuth() here WITHOUT an explicit token so it uses the
      // accessToken callback (_getAccessToken → auth.getSession()), which:
      //   1. Sets accessTokenValue so the join payload includes access_token.
      //   2. Keeps _manuallySetToken = false, preserving the post-subscription
      //      setAuth() call in the channel's 'ok' receive handler — that call
      //      is what actually causes the server to begin routing events.
      //
      // Passing an explicit token would set _manuallySetToken = true, silencing
      // the 'ok'-handler setAuth() and breaking server-side event delivery even
      // though SUBSCRIBED fires successfully.
      //
      // Only refresh when shop_id is absent from the cached JWT — @supabase/ssr's
      // internal listener reacts to TOKEN_REFRESHED and disrupts in-flight UI
      // actions (e.g. form dialogs won't close) if called unconditionally.
      let { data: { session } } = await supabase.auth.getSession();
      if (!session?.user?.user_metadata?.shop_id) {
        const { data: refreshed } = await supabase.auth.refreshSession();
        session = refreshed.session;
      }
      if (session) {
        await supabase.realtime.setAuth(); // no token — uses callback, keeps _manuallySetToken false
      }
      if (cancelled) return;

      const channel = supabase
        .channel("orders-realtime")
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "orders",
            filter: `shop_id=eq.${shopId}`,
          },
          async (payload) => {
            const partial = {
              ...(payload.new as Order),
              order_charges: [] as Order["order_charges"],
            };

            // Immediately add to board so the card appears in <1s
            setOrders((prev) =>
              prev.some((o) => o.id === partial.id) ? prev : [...prev, partial]
            );

            // Highlight and notify right away — before the background fetch
            setNewOrderIds((prev) => new Set(prev).add(partial.id));
            const t = setTimeout(() => {
              setNewOrderIds((prev) => {
                const next = new Set(prev);
                next.delete(partial.id);
                return next;
              });
              timeoutsRef.current.delete(partial.id);
            }, 30_000);
            timeoutsRef.current.set(partial.id, t);
            notifyIfHidden(partial);

            // Background fetch for order_charges (+N badge and correct grand total)
            const { data } = await supabase
              .from("orders")
              .select("*, order_charges(*)")
              .is("deleted_at", null)
              .eq("id", partial.id)
              .single();
            if (data) {
              setOrders((prev) =>
                prev.map((o) =>
                  o.id === data.id && data.updated_at >= o.updated_at
                    ? (data as Order)
                    : o
                )
              );
            }
          }
        )
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "orders",
            filter: `shop_id=eq.${shopId}`,
          },
          async (payload) => {
            const partial = payload.new as Order;

            // Immediately apply the change — spread keeps existing order_charges intact
            // (payload.new never includes order_charges since it's a separate table)
            if (partial.deleted_at) {
              setOrders((prev) => prev.filter((o) => o.id !== partial.id));
              return;
            }
            setOrders((prev) =>
              prev.map((o) => (o.id === partial.id ? { ...o, ...partial } : o))
            );

            // Background fetch to get correct order_charges
            const { data } = await supabase
              .from("orders")
              .select("*, order_charges(*)")
              .eq("id", partial.id)
              .single();
            if (data) {
              if (data.deleted_at) {
                setOrders((prev) => prev.filter((o) => o.id !== data.id));
              } else {
                setOrders((prev) =>
                  prev.map((o) =>
                    o.id === data.id && data.updated_at >= o.updated_at
                      ? (data as Order)
                      : o
                  )
                );
              }
            }
          }
        )
        .on(
          "postgres_changes",
          { event: "DELETE", schema: "public", table: "orders" },
          (payload) => {
            const deleted = payload.old as { id: string };
            setOrders((prev) => prev.filter((o) => o.id !== deleted.id));
          }
        )
        .subscribe((status) => {
          if (status === "SUBSCRIBED") {
            setRealtimeStatus("connected");
            // Successful connection — reset backoff counter and cancel any pending retry
            retryCountRef.current = 0;
            if (retryTimeoutRef.current) {
              clearTimeout(retryTimeoutRef.current);
              retryTimeoutRef.current = null;
            }
          }
          if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
            setRealtimeStatus("error");
            // Exponential backoff: 1s, 2s, 4s … capped at 30s
            const delay = Math.min(1_000 * 2 ** retryCountRef.current, 30_000);
            retryCountRef.current++;
            retryTimeoutRef.current = setTimeout(() => {
              setRealtimeStatus("connecting");
              setRetryKey((k) => k + 1); // triggers this useEffect to re-run with a fresh channel
            }, delay);
          }
          // CLOSED: no reconnect needed here.
          // Supabase's realtime client automatically re-joins channels on socket
          // reconnect (fires CHANNEL_ERROR/TIMED_OUT → backoff handles those).
          // CLOSED only fires on explicit removeChannel() (guarded by cancelled)
          // or server-side leave — neither needs an additional reconnect here.
        });

      channelRef = channel;
    }

    setup();

    const timeouts = timeoutsRef.current;
    return () => {
      cancelled = true;
      if (channelRef) supabase.removeChannel(channelRef);
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
        retryTimeoutRef.current = null;
      }
      timeouts.forEach(clearTimeout);
    };
  }, [shopId, retryKey]); // retryKey forces re-subscription after a failed channel

  function clearNewHighlight(id: string) {
    const t = timeoutsRef.current.get(id);
    if (t) {
      clearTimeout(t);
      timeoutsRef.current.delete(id);
    }
    setNewOrderIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  }

  return {
    orders,
    setOrders,
    newOrderIds,
    clearNewHighlight,
    realtimeStatus,
  };
}
