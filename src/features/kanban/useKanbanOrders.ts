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

    const channel = supabase
      .channel("orders-realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "orders", filter: `shop_id=eq.${shopId}` },
        async (payload) => {
          const id = (payload.new as Order).id;
          const { data } = await supabase
            .from("orders")
            .select("*, order_charges(*)")
            .is("deleted_at", null)
            .eq("id", id)
            .single();
          const newOrder = (data as Order) ?? (payload.new as Order);

          setOrders((prev) =>
            prev.some((o) => o.id === newOrder.id) ? prev : [newOrder, ...prev]
          );

          // Phase 7: highlight card with pulsing ring, auto-clear after 30s
          setNewOrderIds((prev) => new Set(prev).add(newOrder.id));
          const t = setTimeout(() => {
            setNewOrderIds((prev) => {
              const next = new Set(prev);
              next.delete(newOrder.id);
              return next;
            });
            timeoutsRef.current.delete(newOrder.id);
          }, 30_000);
          timeoutsRef.current.set(newOrder.id, t);

          // Phase 7: browser notification when tab is not focused
          notifyIfHidden(newOrder);
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "orders", filter: `shop_id=eq.${shopId}` },
        async (payload) => {
          const id = (payload.new as Order).id;
          const { data } = await supabase
            .from("orders")
            .select("*, order_charges(*)")
            .eq("id", id)
            .single();
          if (data?.deleted_at) {
            setOrders((prev) => prev.filter((o) => o.id !== id))
            return
          }
          const updated = (data as Order) ?? (payload.new as Order);
          setOrders((prev) =>
            prev.map((o) => (o.id === updated.id ? updated : o))
          );
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
        if (status === "CLOSED") setRealtimeStatus("connecting");
      });

    const timeouts = timeoutsRef.current;
    return () => {
      supabase.removeChannel(channel);
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
