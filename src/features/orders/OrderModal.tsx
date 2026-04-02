"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Loader2, Trash2 } from "lucide-react";
import { createOrder, updateOrder, deleteOrder } from "./orders.actions";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { getPricePerKg } from "@/features/settings/settings.actions";
import { getAdditionalCharges } from "@/features/settings/additional-charges.actions";
import { formatCurrency } from "@/lib/utils";
import type { Order, AdditionalCharge } from "@/lib/types";
import type { UserRole } from "@/lib/auth-utils";

const orderSchema = z
  .object({
    customer_name: z.string().min(1, "Customer name is required."),
    contact_number: z.string().refine(
      (v) => v === "" || /^09\d{9}$/.test(v),
      "Contact number must be an 11-digit number starting with 09."
    ),
    order_type: z.enum(["walkin", "pickup"]),
    address: z.string(),
    weight: z.string(),
    notes: z.string(),
  })
  .superRefine((data, ctx) => {
    if (data.order_type === "walkin" && !data.contact_number?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Contact number is required for walk-in orders.",
        path: ["contact_number"],
      });
    }
    if (data.order_type === "pickup" && !data.address?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Address is required for pickup orders.",
        path: ["address"],
      });
    }
    if (data.weight) {
      const w = parseFloat(data.weight);
      if (isNaN(w) || w <= 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Weight must be a positive number.",
          path: ["weight"],
        });
      }
    }
  });

type OrderFormValues = z.infer<typeof orderSchema>;

interface OrderModalProps {
  mode: "create" | "edit";
  order?: Order;
  open: boolean;
  onClose: () => void;
  userRole: UserRole;
}

export function OrderModal({
  mode,
  order,
  open,
  onClose,
  userRole,
}: OrderModalProps) {
  const router = useRouter();
  const [pricePerKg, setPricePerKg] = useState<number>(
    order?.price_per_kg ?? 0
  );
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isLoadingModal, setIsLoadingModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [availableCharges, setAvailableCharges] = useState<AdditionalCharge[]>(
    []
  );
  const [selectedChargeIds, setSelectedChargeIds] = useState<Set<string>>(
    new Set()
  );


  const form = useForm<OrderFormValues>({
    resolver: zodResolver(orderSchema),
    defaultValues: {
      customer_name: "",
      contact_number: "",
      order_type: "walkin",
      address: "",
      weight: "",
      notes: "",
    },
  });

  const orderType = form.watch("order_type");
  const weightValue = form.watch("weight");

  // Fetch price_per_kg + available charges when modal opens
  useEffect(() => {
    if (!open) return;

    setIsLoadingModal(true);

    getAdditionalCharges()
      .then((charges) => {
        setAvailableCharges(charges);

        if (mode === "create") {
          form.reset({
            customer_name: "",
            contact_number: "",
            order_type: "walkin",
            address: "",
            weight: "",
            notes: "",
          });
          setSelectedChargeIds(new Set());
          return getPricePerKg().then(setPricePerKg);
        } else if (order) {
          form.reset({
            customer_name: order.customer_name,
            contact_number: order.contact_number ?? "",
            order_type: order.order_type,
            address: order.address ?? "",
            weight: order.weight?.toString() ?? "",
            notes: order.notes ?? "",
          });
          setPricePerKg(order.price_per_kg);

          if (order.order_charges && order.order_charges.length > 0) {
            const matched = new Set(
              order.order_charges
                .map((oc) => charges.find((c) => c.name === oc.charge_name)?.id)
                .filter((id): id is string => id !== undefined)
            );
            setSelectedChargeIds(matched);
          } else {
            setSelectedChargeIds(new Set());
          }
        }
      })
      .finally(() => {
        setIsLoadingModal(false);
      });
  }, [open, mode, order, form]);

  function toggleCharge(id: string) {
    setSelectedChargeIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const baseTotalPrice =
    weightValue && pricePerKg ? parseFloat(weightValue) * pricePerKg : null;
  const chargesTotal = availableCharges
    .filter((c) => selectedChargeIds.has(c.id))
    .reduce((acc, c) => acc + c.amount, 0);
  const grandTotal =
    baseTotalPrice !== null
      ? baseTotalPrice + chargesTotal
      : chargesTotal > 0
      ? chargesTotal
      : null;

  async function onSubmit(data: OrderFormValues) {
    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.set("customer_name", data.customer_name);
      formData.set("contact_number", data.contact_number ?? "");
      formData.set("order_type", data.order_type);
      formData.set("address", data.address ?? "");
      formData.set("weight", data.weight ?? "");
      formData.set("notes", data.notes ?? "");
      formData.set(
        "selected_charge_ids",
        JSON.stringify([...selectedChargeIds])
      );

      const result =
        mode === "create"
          ? await createOrder(null, formData)
          : await updateOrder(order!.id, null, formData);

      if (result && "error" in result) {
        toast.error(result.error);
      } else {
        toast.success(mode === "create" ? "Order created." : "Order updated.");
        router.refresh();
        onClose();
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!order) return;
    setIsDeleting(true);
    try {
      const result = await deleteOrder(order.id);
      if (result && "error" in result) {
        toast.error(result.error);
      } else {
        toast.success("Order deleted.");
        onClose();
      }
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-base font-semibold">
            {mode === "create" ? "New Order" : "Edit Order"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {/* Order type toggle */}
          <div className="space-y-1.5">
            <Label>Order Type</Label>
            <div className="flex rounded-lg border border-gray-200 overflow-hidden">
              <button
                type="button"
                onClick={() => {
                  form.setValue("order_type", "walkin");
                  form.trigger(["contact_number", "address"]);
                }}
                className={[
                  "flex-1 py-2 text-sm font-medium transition-colors",
                  orderType === "walkin"
                    ? "bg-gray-900 text-white"
                    : "bg-white text-gray-600 hover:bg-gray-50",
                ].join(" ")}
              >
                Walk-in
              </button>
              <button
                type="button"
                onClick={() => {
                  form.setValue("order_type", "pickup");
                  form.trigger(["contact_number", "address"]);
                }}
                className={[
                  "flex-1 py-2 text-sm font-medium transition-colors",
                  orderType === "pickup"
                    ? "bg-gray-900 text-white"
                    : "bg-white text-gray-600 hover:bg-gray-50",
                ].join(" ")}
              >
                Pickup
              </button>
            </div>
          </div>

          {/* Customer details */}
          <div className="grid grid-cols-2 gap-3">
            <Controller
              name="customer_name"
              control={form.control}
              render={({ field, fieldState }) => (
                <div className="col-span-2 space-y-1.5">
                  <Label htmlFor="customer_name">
                    Customer Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    {...field}
                    id="customer_name"
                    placeholder="Maria Santos"
                    aria-invalid={fieldState.invalid}
                    disabled={isSubmitting}
                  />
                  {fieldState.error && (
                    <p className="text-xs text-red-500">
                      {fieldState.error.message}
                    </p>
                  )}
                </div>
              )}
            />
            <Controller
              name="contact_number"
              control={form.control}
              render={({ field, fieldState }) => (
                <div className="col-span-2 space-y-1.5">
                  <Label htmlFor="contact_number">
                    Contact Number{" "}
                    {orderType === "walkin" && (
                      <span className="text-red-500">*</span>
                    )}
                  </Label>
                  <Input
                    {...field}
                    id="contact_number"
                    placeholder="09171234567"
                    aria-invalid={fieldState.invalid}
                    disabled={isSubmitting}
                  />
                  {fieldState.error && (
                    <p className="text-xs text-red-500">
                      {fieldState.error.message}
                    </p>
                  )}
                </div>
              )}
            />
            <Controller
              name="address"
              control={form.control}
              render={({ field, fieldState }) => (
                <div className="col-span-2 space-y-1.5">
                  <Label htmlFor="address">
                    Address{" "}
                    {orderType === "pickup" && (
                      <span className="text-red-500">*</span>
                    )}
                  </Label>
                  <Input
                    {...field}
                    id="address"
                    placeholder="Block 3 Lot 5, Sampaguita St"
                    aria-invalid={fieldState.invalid}
                    disabled={isSubmitting}
                  />
                  {fieldState.error && (
                    <p className="text-xs text-red-500">
                      {fieldState.error.message}
                    </p>
                  )}
                </div>
              )}
            />
          </div>

          <Separator />

          {/* Weight + pricing */}
          <div className="grid grid-cols-2 gap-3">
            <Controller
              name="weight"
              control={form.control}
              render={({ field, fieldState }) => (
                <div className="space-y-1.5">
                  <Label htmlFor="weight">Weight (kg)</Label>
                  <Input
                    {...field}
                    id="weight"
                    type="number"
                    step="0.5"
                    min="0.5"
                    placeholder="3.5"
                    aria-invalid={fieldState.invalid}
                    disabled={isSubmitting}
                  />
                  {fieldState.error && (
                    <p className="text-xs text-red-500">
                      {fieldState.error.message}
                    </p>
                  )}
                </div>
              )}
            />
            <div className="space-y-1.5">
              <Label>Price / kg</Label>
              <div className="flex h-9 items-center rounded-md border border-gray-200 bg-gray-50 px-3 text-sm text-gray-500 tabular-nums">
                {formatCurrency(pricePerKg)}
              </div>
            </div>
          </div>

          {/* Additional charges */}
          {isLoadingModal ? (
            <>
              <Separator />
              <div className="space-y-2">
                <Label>Additional Charges</Label>
                <div className="flex flex-wrap gap-2">
                  <Skeleton className="w-24 h-7 rounded-full" />
                  <Skeleton className="w-24 h-7 rounded-full" />
                  <Skeleton className="w-24 h-7 rounded-full" />
                </div>
              </div>
            </>
          ) : availableCharges.length > 0 ? (
            <>
              <Separator />
              <div className="space-y-2">
                <Label>Additional Charges</Label>
                <div className="flex flex-wrap gap-2">
                  {availableCharges.map((charge) => {
                    const selected = selectedChargeIds.has(charge.id);
                    return (
                      <button
                        key={charge.id}
                        type="button"
                        aria-pressed={selected}
                        onClick={() => toggleCharge(charge.id)}
                        disabled={isSubmitting}
                        className={[
                          "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium border transition-colors",
                          selected
                            ? "bg-blue-600 text-white border-blue-600"
                            : "bg-white text-gray-600 border-gray-200 hover:border-gray-300 hover:bg-gray-50",
                        ].join(" ")}
                      >
                        {charge.name}
                        <span
                          className={
                            selected ? "text-blue-200" : "text-gray-400"
                          }
                        >
                          {formatCurrency(charge.amount)}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </>
          ) : null}

          {/* Notes */}
          <Controller
            name="notes"
            control={form.control}
            render={({ field, fieldState }) => (
              <div className="space-y-1.5">
                <Label htmlFor="notes">Notes</Label>
                <Input
                  {...field}
                  id="notes"
                  placeholder="Handle with care, separate whites…"
                  aria-invalid={fieldState.invalid}
                  disabled={isSubmitting}
                />
                {fieldState.error && (
                  <p className="text-xs text-red-500">
                    {fieldState.error.message}
                  </p>
                )}
              </div>
            )}
          />

          {/* Grand total */}
          {grandTotal !== null && !isNaN(grandTotal) && (
            <div className="flex items-center justify-between rounded-lg bg-gray-50 border border-gray-200 px-3 py-2">
              <div className="space-y-0.5">
                <span className="text-sm text-gray-600">Estimated Total</span>
                {chargesTotal > 0 && baseTotalPrice !== null && (
                  <p className="text-xs text-gray-400 tabular-nums">
                    {formatCurrency(baseTotalPrice)} base +{" "}
                    {formatCurrency(chargesTotal)} charges
                  </p>
                )}
              </div>
              <span className="text-base font-bold text-gray-900 tabular-nums">
                {formatCurrency(grandTotal)}
              </span>
            </div>
          )}

          <DialogFooter className="gap-2 pt-2">
            {mode === "edit" && userRole === "admin" && (
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={() => setShowDeleteConfirm(true)}
                disabled={isDeleting || isSubmitting}
                className="mr-auto"
              >
                {isDeleting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
              </Button>
            )}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={isSubmitting || isLoadingModal}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving…
                </>
              ) : mode === "create" ? (
                "Create Order"
              ) : (
                "Save Changes"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
      <ConfirmDialog
        open={showDeleteConfirm}
        title="Delete this order?"
        description="This order will be removed from the dashboard and will no longer appear in any views or reports."
        confirmLabel="Delete Order"
        onConfirm={async () => {
          setShowDeleteConfirm(false);
          await handleDelete();
        }}
        onCancel={() => setShowDeleteConfirm(false)}
        isPending={isDeleting}
      />
    </Dialog>
  );
}
