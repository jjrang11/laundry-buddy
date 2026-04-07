"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { deleteShop } from "@/features/owner/owner.actions";
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
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function toggleShop(shopId: string) {
    setActiveShopId((current) => (current === shopId ? null : shopId));
  }

  function handleDelete() {
    if (!confirmDeleteId) return;
    startTransition(async () => {
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

  const confirmShop = shops.find((s) => s.id === confirmDeleteId);

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
                <p className="font-medium text-sm text-gray-900 truncate">{shop.name}</p>
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
                >
                  {activeShopId === shop.id ? "Cancel" : "Invite Admin"}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setConfirmDeleteId(shop.id)}
                  className="text-red-500 hover:text-red-600 hover:bg-red-50"
                  aria-label={`Delete ${shop.name}`}
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
        description={`This will permanently delete "${confirmShop?.name ?? ''}" and all its orders, settings, and data. This cannot be undone.`}
        confirmLabel="Delete Shop"
        onConfirm={handleDelete}
        onCancel={() => setConfirmDeleteId(null)}
        isPending={isPending}
      />
    </>
  );
}
