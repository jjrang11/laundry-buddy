"use client";

import { useState, useEffect } from "react";
import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { Badge } from "@/components/ui/badge";
import {
  computeGrandTotal,
  formatCurrency,
  formatRelativeTime,
} from "@/lib/utils";
import {
  ORDER_TYPE_COLORS,
  STATUS_COLORS,
} from "@/lib/constants/order-statuses";
import type { Order, OrderType } from "@/lib/types";
import type { OrderStatus } from "@/lib/constants/order-statuses";
import { MapPin, Store, Weight, Tag } from "lucide-react";

// Left border color per status — matches COLUMN_ACCENT hues
const STATUS_BORDER: Record<string, string> = {
  "New Order":          "border-l-slate-400",
  "For Pickup":         "border-l-amber-400",
  "Arrived at Shop":    "border-l-sky-400",
  Processing:           "border-l-orange-400",
  "Ready for Delivery": "border-l-teal-500",
  "Out for Delivery":   "border-l-cyan-400",
  Completed:            "border-l-emerald-500",
};

const ORDER_TYPE_LABEL: Record<OrderType, string> = {
  pickup: "Pickup",
  walkin: "Walk-in",
};

interface KanbanCardProps {
  order: Order;
  isNew: boolean;
  onClearNew: () => void;
  onEdit: (order: Order) => void;
  overlay?: boolean;
}

export function KanbanCard({
  order,
  isNew,
  onClearNew,
  onEdit,
  overlay = false,
}: KanbanCardProps) {
  const total = computeGrandTotal(order);
  const [relativeTime, setRelativeTime] = useState<string | null>(null);

  useEffect(() => {
    setRelativeTime(formatRelativeTime(order.created_at));
  }, [order.created_at]);

  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: order.id,
      data: { order },
    });

  const style = { transform: CSS.Translate.toString(transform) };
  const borderClass = STATUS_BORDER[order.status] ?? "border-l-slate-300";

  function handleClick() {
    if (isNew) onClearNew();
    if (!isDragging) onEdit(order);
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      onClick={handleClick}
      role="button"
      tabIndex={overlay ? undefined : 0}
      onKeyDown={
        overlay
          ? undefined
          : (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onEdit(order);
              }
            }
      }
      className={[
        "group relative bg-white rounded-xl border border-slate-200 border-l-[3px] p-3.5",
        "cursor-pointer select-none touch-none",
        borderClass,
        isDragging && !overlay
          ? "opacity-40 shadow-none cursor-grabbing"
          : "shadow-sm hover:shadow-md hover:-translate-y-px",
        overlay ? "shadow-xl rotate-1 scale-105 cursor-grabbing" : "",
        isNew ? "ring-2 ring-teal-400 ring-offset-1 animate-pulse" : "",
        "transition-all duration-150",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {/* Customer name */}
      <p className="font-semibold text-slate-800 text-sm leading-tight truncate pr-6">
        {order.customer_name}
      </p>

      {/* Order type + address */}
      <div className="flex items-center gap-1.5 mt-1.5">
        {order.order_type === "pickup" ? (
          <MapPin className="h-3 w-3 text-slate-400 shrink-0" />
        ) : (
          <Store className="h-3 w-3 text-slate-400 shrink-0" />
        )}
        <span className="text-xs text-slate-500 truncate">
          {order.order_type === "pickup" && order.address
            ? order.address
            : ORDER_TYPE_LABEL[order.order_type as OrderType]}
        </span>
      </div>

      {/* Separator + Weight + Total price */}
      <div className="flex items-center justify-between mt-2.5 pt-2.5 border-t border-slate-100">
        <div className="flex items-center gap-1 text-xs text-slate-500">
          <Weight className="h-3 w-3" />
          <span>{order.weight != null ? `${order.weight} kg` : "—"}</span>
        </div>
        <div className="flex items-center gap-1.5">
          {order.order_charges && order.order_charges.length > 0 && (
            <span className="flex items-center gap-0.5 text-xs text-amber-600 bg-amber-50 rounded px-1 py-0.5">
              <Tag className="h-2.5 w-2.5" />+{order.order_charges.length}
            </span>
          )}
          <span className="text-sm font-bold text-slate-800 tabular-nums">
            {total != null ? formatCurrency(total) : "—"}
          </span>
        </div>
      </div>

      {/* Type badge + relative time */}
      <div className="flex items-center justify-between mt-2">
        <Badge
          className={[
            "text-xs px-1.5 py-0",
            ORDER_TYPE_COLORS[order.order_type] ?? "",
          ].join(" ")}
          variant="outline"
        >
          {order.order_type === "pickup" ? "Pickup" : "Walk-in"}
        </Badge>
        <span className="text-xs text-slate-400 tabular-nums">
          {relativeTime ?? ""}
        </span>
      </div>

      {/* New order pulse dot */}
      {isNew && (
        <span className="absolute top-2 right-2 flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-teal-500" />
        </span>
      )}
    </div>
  );
}
