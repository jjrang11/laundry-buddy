"use client";

import { useOptimistic, useTransition, useState, useCallback, useMemo } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { toast } from "sonner";
import { KanbanColumn } from "./KanbanColumn";
import { KanbanCard } from "./KanbanCard";
import { useKanbanOrders } from "./useKanbanOrders";
import { OrderModal } from "@/features/orders/OrderModal";
import { updateOrderStatus } from "@/features/orders/orders.actions";
import { ORDER_STATUSES } from "@/lib/constants/order-statuses";
import type { Order } from "@/lib/types";
import type { OrderStatus } from "@/lib/constants/order-statuses";
import type { UserRole } from "@/lib/auth-utils";
import { WifiOff, Loader2 } from "lucide-react";

interface KanbanBoardProps {
  initialOrders: Order[];
  userRole: UserRole;
  shopId: string;
}

export function KanbanBoard({ initialOrders, userRole, shopId }: KanbanBoardProps) {
  const { orders, setOrders, newOrderIds, clearNewHighlight, realtimeStatus } =
    useKanbanOrders(initialOrders, shopId);

  const [activeOrder, setActiveOrder] = useState<Order | null>(null);
  const [editOrder, setEditOrder] = useState<Order | null>(null);
  const [, startTransition] = useTransition();
  const handleCloseEditModal = useCallback(() => setEditOrder(null), []);

  const [optimisticOrders, applyOptimistic] = useOptimistic(
    orders,
    (state: Order[], { id, status }: { id: string; status: OrderStatus }) =>
      state.map((o) => (o.id === id ? { ...o, status } : o))
  );

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor)
  );

  const todayLocal = useMemo(() => new Date().toLocaleDateString('en-CA'), []) // "YYYY-MM-DD" in PHT local TZ

  const groupedOrders = useMemo(() => ORDER_STATUSES.reduce((acc, status) => {
    if (status === 'Completed') {
      acc[status] = optimisticOrders.filter((o) => {
        if (o.status !== 'Completed') return false
        return new Date(o.updated_at).toLocaleDateString('en-CA') === todayLocal
      })
    } else {
      acc[status] = optimisticOrders.filter((o) => o.status === status)
    }
    return acc
  }, {} as Record<OrderStatus, Order[]>), [optimisticOrders, todayLocal]);

  function handleDragStart(event: DragStartEvent) {
    setActiveOrder((event.active.data.current?.order as Order) ?? null);
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveOrder(null);
    const { active, over } = event;
    if (!over) return;

    const orderId = active.id as string;
    const newStatus = over.id as OrderStatus;
    const order = orders.find((o) => o.id === orderId);
    if (!order || order.status === newStatus) return;

    startTransition(async () => {
      applyOptimistic({ id: orderId, status: newStatus });
      try {
        await updateOrderStatus(orderId, newStatus);
        setOrders((prev) =>
          prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
        );
      } catch {
        toast.error("Failed to update order status. Please try again.");
      }
    });
  }

  return (
    <>
      <DndContext
        id="kanban-board"
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        {/* Realtime status bar — only shown when not connected */}
        {realtimeStatus !== "connected" && (
          <div
            className={[
              "flex items-center gap-2 px-4 py-1.5 text-xs font-medium",
              realtimeStatus === "error"
                ? "bg-red-50 text-red-600 border-b border-red-100"
                : "bg-yellow-50 text-yellow-700 border-b border-yellow-100",
            ].join(" ")}
          >
            {realtimeStatus === "connecting" ? (
              <>
                <Loader2 className="h-3 w-3 animate-spin" /> Connecting to live
                updates…
              </>
            ) : (
              <>
                <WifiOff className="h-3 w-3" /> Live updates disconnected.
                Changes may not appear automatically.
              </>
            )}
          </div>
        )}

        {/* Hidden — shown only for screen readers when connected */}
        {realtimeStatus === "connected" && (
          <span className="sr-only" aria-live="polite">Live updates active</span>
        )}

        <div className="flex gap-4 h-full overflow-x-auto px-4 pb-4 pt-4">
          {ORDER_STATUSES.map((status) => (
            <KanbanColumn
              key={status}
              status={status}
              orders={groupedOrders[status]}
              newOrderIds={newOrderIds}
              onClearNew={clearNewHighlight}
              onEditOrder={setEditOrder}
              subLabel={status === 'Completed' ? 'Today only' : undefined}
            />
          ))}
        </div>

        <DragOverlay dropAnimation={null}>
          {activeOrder ? (
            <KanbanCard
              order={activeOrder}
              isNew={false}
              onClearNew={() => {}}
              onEdit={() => {}}
              overlay
            />
          ) : null}
        </DragOverlay>
      </DndContext>

      {/* Edit modal */}
      <OrderModal
        mode="edit"
        order={editOrder ?? undefined}
        open={editOrder !== null}
        onClose={handleCloseEditModal}
        userRole={userRole}
      />
    </>
  );
}
