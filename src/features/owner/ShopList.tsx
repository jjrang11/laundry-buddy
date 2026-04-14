"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { deleteShop, setShopSuspension } from "@/features/owner/owner.actions";
import { InviteAdminForm } from "@/features/owner/InviteAdminForm";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Trash2 } from "lucide-react";
import type { Shop } from "@/lib/types";

interface ShopListProps {
  shops: Shop[];
}

export function ShopList({ shops }: ShopListProps) {
  const [activeShopId, setActiveShopId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [confirmSuspendId, setConfirmSuspendId] = useState<string | null>(null);
  const [confirmUnsuspendId, setConfirmUnsuspendId] = useState<string | null>(null);
  const [isPendingDelete, startDeleteTransition] = useTransition();
  const [isPendingSuspend, startSuspendTransition] = useTransition();
  const router = useRouter();

  function toggleShop(shopId: string) {
    setActiveShopId((current) => (current === shopId ? null : shopId));
  }

  function handleDelete() {
    if (!confirmDeleteId) return;
    startDeleteTransition(async () => {
      const res = await deleteShop(confirmDeleteId);
      setConfirmDeleteId(null);
      if (res && "error" in res) {
        toast.error(res.error);
      } else {
        toast.success("Shop deleted.");
        router.refresh();
      }
    });
  }

  function handleSuspend() {
    if (!confirmSuspendId) return;
    startSuspendTransition(async () => {
      const res = await setShopSuspension(confirmSuspendId, true);
      setConfirmSuspendId(null);
      if (res && "error" in res) {
        toast.error(res.error);
      } else {
        toast.success("Shop suspended.");
        router.refresh();
      }
    });
  }

  function handleUnsuspend() {
    if (!confirmUnsuspendId) return;
    startSuspendTransition(async () => {
      const res = await setShopSuspension(confirmUnsuspendId, false);
      setConfirmUnsuspendId(null);
      if (res && "error" in res) {
        toast.error(res.error);
      } else {
        toast.success("Shop reactivated.");
        router.refresh();
      }
    });
  }

  const confirmDeleteShop = shops.find((s) => s.id === confirmDeleteId);
  const confirmSuspendShop = shops.find((s) => s.id === confirmSuspendId);
  const confirmUnsuspendShop = shops.find((s) => s.id === confirmUnsuspendId);

  if (shops.length === 0) {
    return (
      <p className="text-sm text-gray-400 text-center py-4">
        No shops yet. Create one above.
      </p>
    );
  }

  return (
    <>
      <ul className="divide-y divide-gray-100 w-full">
        {shops.map((shop) => (
          <li key={shop.id} className="py-3 first:pt-0 last:pb-0">
            <div className="flex items-center justify-between gap-4">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-sm text-gray-900 truncate">{shop.display_name}</p>
                  {shop.is_suspended && (
                    <span className="inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700">
                      Suspended
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-400 mt-0.5">
                  Created {new Date(shop.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => toggleShop(shop.id)}
                  aria-expanded={activeShopId === shop.id}
                  disabled={isPendingSuspend}
                >
                  {activeShopId === shop.id ? "Cancel" : "Invite Admin"}
                </Button>
                {shop.is_suspended ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setConfirmUnsuspendId(shop.id)}
                    className="text-amber-600 hover:text-amber-700 hover:bg-amber-50 border-amber-200"
                    aria-label={`Reactivate ${shop.display_name}`}
                    disabled={isPendingSuspend}
                  >
                    Unsuspend
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setConfirmSuspendId(shop.id)}
                    className="text-amber-600 hover:text-amber-700 hover:bg-amber-50 border-amber-200"
                    aria-label={`Suspend ${shop.display_name}`}
                    disabled={isPendingSuspend}
                  >
                    Suspend
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setConfirmDeleteId(shop.id)}
                  className="text-red-500 hover:text-red-600 hover:bg-red-50"
                  aria-label={`Delete ${shop.display_name}`}
                  disabled={isPendingSuspend}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {activeShopId === shop.id && (
              <InviteAdminForm
                shopId={shop.id}
                shopName={shop.name}
                onClose={() => setActiveShopId(null)}
              />
            )}
          </li>
        ))}
      </ul>

      <ConfirmDialog
        open={!!confirmDeleteId}
        title="Delete shop?"
        description={`This will permanently delete "${confirmDeleteShop?.display_name ?? ''}" and all its orders, settings, and data. This cannot be undone.`}
        confirmLabel="Delete Shop"
        onConfirm={handleDelete}
        onCancel={() => setConfirmDeleteId(null)}
        isPending={isPendingDelete}
      />

      <ConfirmDialog
        open={!!confirmSuspendId}
        title="Suspend shop?"
        description={`All admins and staff at "${confirmSuspendShop?.display_name ?? ''}" will be blocked from logging in immediately. Their data is preserved and can be restored at any time.`}
        confirmLabel="Suspend Shop"
        confirmVariant="destructive"
        confirmClassName="bg-amber-500 hover:bg-amber-600 focus-visible:ring-amber-500 border-0"
        onConfirm={handleSuspend}
        onCancel={() => setConfirmSuspendId(null)}
        isPending={isPendingSuspend}
      />

      <ConfirmDialog
        open={!!confirmUnsuspendId}
        title="Reactivate shop?"
        description={`Admins and staff at "${confirmUnsuspendShop?.display_name ?? ''}" will regain full access immediately.`}
        confirmLabel="Reactivate Shop"
        confirmVariant="default"
        onConfirm={handleUnsuspend}
        onCancel={() => setConfirmUnsuspendId(null)}
        isPending={isPendingSuspend}
      />
    </>
  );
}
